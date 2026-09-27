#!/usr/bin/env python3
"""절차적 사운드트랙 생성기 — 외부 샘플/저작권 소스 없이 numpy만으로 만든다.

출력 (public/audio/):
  stem-pad.wav    : 100초, 느린 코드 진행의 디튠 신스 패드 (영상 전체 깔림)
  stem-pulse.wav  : 100초, 100 BPM 서브베이스 펄스 (긴장/추진감, 장면별 볼륨 자동화)
  stem-wind.wav   : 100초, 사막 바람 노이즈 (필터 스윕)
  fx-impact.wav   : 2.5초, 하드 컷용 임팩트 (서브 붐 + 노이즈)
  fx-whoosh.wav   : 1.4초, 장면 전환 휘익
  fx-glitch.wav   : 0.7초, 디지털 글리치 (현실 컷 전환)
  fx-riser.wav    : 4초, 상승 라이저
  fx-tick.wav     : 0.15초, 숫자 카운터용 짧은 틱

WAV 은 git 에 넣지 않고 (용량) Remotion 번들 ffmpeg 로 AAC(.m4a) 로 변환해 커밋한다:
  npx remotion ffmpeg -y -i public/audio/stem-pad.wav -c:a aac -b:a 160k public/audio/stem-pad.m4a
"""
from __future__ import annotations

import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "audio")
rng = np.random.default_rng(20260927)


def t_axis(sec: float) -> np.ndarray:
    return np.arange(int(sec * SR)) / SR


def note(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw_bandlimited(freq: float, t: np.ndarray, harmonics: int = 24) -> np.ndarray:
    out = np.zeros_like(t)
    for n in range(1, harmonics + 1):
        if freq * n > SR / 2.2:
            break
        out += ((-1) ** (n + 1)) * np.sin(2 * np.pi * freq * n * t) / n
    return out * (2 / np.pi)


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = butter(order, cutoff / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x)


def highpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    sos = butter(order, cutoff / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x)


def timevarying_lowpass(x: np.ndarray, cutoff_curve: np.ndarray, chunk: int = 2048) -> np.ndarray:
    """청크 단위로 컷오프를 바꾸는 저역 필터 (LFO 스윕용)."""
    y = np.zeros_like(x)
    zi = None
    from scipy.signal import sosfilt_zi
    for i in range(0, len(x), chunk):
        c = float(np.clip(cutoff_curve[min(i, len(cutoff_curve) - 1)], 60, SR / 2 - 100))
        sos = butter(2, c / (SR / 2), btype="low", output="sos")
        if zi is None:
            zi = sosfilt_zi(sos) * x[0]
        y[i:i + chunk], zi = sosfilt(sos, x[i:i + chunk], zi=zi)
    return y


def env_adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(n - a_n - d_n - r_n, 0)
    env = np.concatenate([
        np.linspace(0, 1, a_n, endpoint=False),
        np.linspace(1, s, d_n, endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, r_n),
    ])
    return env[:n] if len(env) >= n else np.pad(env, (0, n - len(env)))


def normalize(x: np.ndarray, peak_db: float = -3.0) -> np.ndarray:
    peak = np.max(np.abs(x)) or 1.0
    return x / peak * (10 ** (peak_db / 20))


def write_wav(name: str, stereo: np.ndarray) -> None:
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    data = np.clip(stereo, -1, 1)
    pcm = (data.T * 32767).astype("<i2")  # (n, 2)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {path} ({data.shape[1] / SR:.1f}s)")


# ---------------------------------------------------------------- 패드 스템
def xfade_env(n: int, fade_in: float, fade_out: float) -> np.ndarray:
    """등전력(equal-power) 크로스페이드용 엔벨로프: sin 으로 올라가 cos 로 내려간다."""
    env = np.ones(n)
    a, r = int(fade_in * SR), int(fade_out * SR)
    if a > 0:
        env[:a] = np.sin(np.linspace(0, np.pi / 2, a))
    if r > 0:
        env[-r:] = np.cos(np.linspace(0, np.pi / 2, r))
    return env


def make_pad(sec: float = 100.0) -> np.ndarray:
    t = t_axis(sec)
    n = len(t)
    # 코드 진행 (A단조 계열, 영화적): Am9 → Fmaj7 → Cmaj7 → G6 → Dm9 → Em7 → Fmaj7 → Am
    chords = [
        [57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [48, 52, 55, 59, 64], [55, 59, 62, 64, 67],
        [50, 53, 57, 60, 64], [52, 55, 59, 62, 67], [53, 57, 60, 64, 71], [45, 52, 57, 60, 64],
    ]
    bar = 12.5  # 초 — 8코드 × 12.5초 = 100초
    xf = 3.0  # 코드 경계 앞뒤 1.5초씩 겹쳐 등전력 크로스페이드 (끊김/숨쉬기 없음)
    left = np.zeros(n)
    right = np.zeros(n)
    sub = np.zeros(n)
    for ci, chord in enumerate(chords):
        first, last = ci == 0, ci == len(chords) - 1
        s0 = 0.0 if first else ci * bar - xf / 2
        e0 = sec if last else (ci + 1) * bar + xf / 2
        start, end = int(s0 * SR), min(n, int(e0 * SR))
        seg_t = t[start:end]
        env = xfade_env(end - start, 0.02 if first else xf, 0.02 if last else xf)
        for m in chord:
            f = note(m)
            # 좌우로 살짝 디튠된 두 개의 톱니파 + 옥타브 위 사인 — 넓고 부드러운 패드
            l = saw_bandlimited(f * 0.998, seg_t) + 0.25 * np.sin(2 * np.pi * f * 2 * seg_t + 0.3)
            r = saw_bandlimited(f * 1.002, seg_t) + 0.25 * np.sin(2 * np.pi * f * 2 * seg_t)
            left[start:end] += l * env / len(chord)
            right[start:end] += r * env / len(chord)
        # 서브 베이스 (근음 한 옥타브 아래)
        sub[start:end] += np.sin(2 * np.pi * note(chord[0] - 12) * seg_t) * env
    # 느린 필터 스윕 (LFO 0.05 Hz) — 숨쉬는 느낌
    cutoff = 900 + 700 * np.sin(2 * np.pi * 0.05 * t - np.pi / 2)
    left = timevarying_lowpass(left, cutoff)
    right = timevarying_lowpass(right, cutoff * 1.05)
    # 페이드 인/아웃은 src/sound.ts 의 볼륨 자동화가 맡는다. 여기서는 클릭 방지용 20ms 만.
    edge = xfade_env(n, 0.02, 0.02)
    mix = np.stack([left * 0.9 + sub * 0.35, right * 0.9 + sub * 0.35]) * edge
    return normalize(mix, -6)


# ---------------------------------------------------------------- 펄스 스템
def make_pulse(sec: float = 100.0, bpm: float = 100.0) -> np.ndarray:
    t = t_axis(sec)
    n = len(t)
    beat = 60.0 / bpm
    roots = [45, 41, 36, 43, 38, 40, 41, 45]  # 패드와 같은 근음 (한 옥타브 아래)
    bar = 12.5
    out = np.zeros(n)
    i = 0
    while i * beat < sec:
        start = int(i * beat * SR)
        root = roots[min(int((i * beat) // bar), len(roots) - 1)]
        length = int(0.45 * SR)
        seg = t[:length]
        env = np.exp(-seg * 9)
        f = note(root)
        # 피치가 살짝 떨어지는 사인 플럭 (808 느낌) + 8분음표 오프비트는 약하게
        pitch = f * (1 + 0.6 * np.exp(-seg * 40))
        tone = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * env
        gain = 1.0 if i % 2 == 0 else 0.55
        end = min(start + length, n)
        out[start:end] += tone[: end - start] * gain
        i += 1
    out = lowpass(out, 220, 2)
    click = highpass(rng.normal(0, 1, n), 3000)  # 아주 약한 틱으로 비트 정의
    tick_env = np.zeros(n)
    i = 0
    while i * beat < sec:
        s = int(i * beat * SR)
        e = min(s + int(0.02 * SR), n)
        tick_env[s:e] = np.linspace(1, 0, e - s)
        i += 1
    out += click * tick_env * 0.05
    stereo = np.stack([out, out * 0.97])
    return normalize(stereo, -8)


# ---------------------------------------------------------------- 바람 스템
def make_wind(sec: float = 100.0) -> np.ndarray:
    n = int(sec * SR)
    t = t_axis(sec)
    white = rng.normal(0, 1, (2, n))
    # 핑크에 가깝게: 저역 강조
    wind = np.stack([lowpass(white[0], 1200, 1), lowpass(white[1], 1200, 1)])
    # 돌풍: 0.08 Hz 와 0.023 Hz 의 합성 LFO
    gust = 0.55 + 0.3 * np.sin(2 * np.pi * 0.08 * t) + 0.15 * np.sin(2 * np.pi * 0.023 * t + 1.3)
    cutoff = 350 + 450 * gust
    wind = np.stack([timevarying_lowpass(wind[0], cutoff), timevarying_lowpass(wind[1], cutoff * 0.9)])
    wind *= gust
    return normalize(wind, -12)


# ---------------------------------------------------------------- 원샷 효과음
def make_impact() -> np.ndarray:
    t = t_axis(2.5)
    pitch = 55 * (1 + 3 * np.exp(-t * 18))
    boom = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * np.exp(-t * 2.2)
    noise = lowpass(rng.normal(0, 1, len(t)), 2500, 2) * np.exp(-t * 7)
    tail = lowpass(rng.normal(0, 1, len(t)), 400, 2) * np.exp(-t * 1.4) * 0.5
    mono = boom * 1.0 + noise * 0.5 + tail
    return normalize(np.stack([mono, mono * 0.96]), -1.5)


def make_whoosh() -> np.ndarray:
    t = t_axis(1.4)
    n = len(t)
    noise = rng.normal(0, 1, n)
    # 밴드패스 중심이 300 → 4000 → 600 Hz 로 스윕, 진폭은 가운데서 최대
    center = 300 * (4000 / 300) ** np.sin(np.pi * t / 1.4)
    out = np.zeros(n)
    chunk = 1024
    for i in range(0, n, chunk):
        c = float(np.clip(center[i], 100, 8000))
        sos = butter(2, [c * 0.6 / (SR / 2), min(c * 1.6, 20000) / (SR / 2)], btype="band", output="sos")
        out[i:i + chunk] = sosfilt(sos, noise[i:i + chunk])
    env = np.sin(np.pi * t / 1.4) ** 2
    l = out * env * (1 - 0.6 * t / 1.4)
    r = out * env * (0.4 + 0.6 * t / 1.4)
    return normalize(np.stack([l, r]), -4)


def make_glitch() -> np.ndarray:
    t = t_axis(0.7)
    n = len(t)
    out = np.zeros(n)
    for _ in range(14):
        s = rng.integers(0, n - 2000)
        length = int(rng.integers(300, 2500))
        f = float(rng.choice([220, 440, 880, 1760, 3520]))
        burst = np.sign(np.sin(2 * np.pi * f * t[:length]))  # 사각파
        crush = np.round(burst * 3) / 3  # 비트크러시
        out[s:s + length] += crush * rng.uniform(0.3, 1.0)
    out += highpass(rng.normal(0, 1, n), 4000) * (rng.random(n) > 0.985) * 0.8
    out *= np.exp(-t * 3)
    return normalize(np.stack([out, np.roll(out, 400)]), -5)


def make_riser() -> np.ndarray:
    t = t_axis(4.0)
    n = len(t)
    noise = rng.normal(0, 1, n)
    cutoff = 200 * (6000 / 200) ** (t / 4.0)
    sweep = timevarying_lowpass(highpass(noise, 150), cutoff)
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (t / 4.0 * 2)) / SR)
    env = (t / 4.0) ** 2
    mono = (sweep * 0.8 + tone * 0.3) * env
    mono[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
    return normalize(np.stack([mono, mono]), -4)


def make_tick() -> np.ndarray:
    t = t_axis(0.15)
    tone = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90)
    click = highpass(rng.normal(0, 1, len(t)), 5000) * np.exp(-t * 200) * 0.6
    mono = tone + click
    return normalize(np.stack([mono, mono]), -8)


if __name__ == "__main__":
    write_wav("stem-pad.wav", make_pad())
    write_wav("stem-pulse.wav", make_pulse())
    write_wav("stem-wind.wav", make_wind())
    write_wav("fx-impact.wav", make_impact())
    write_wav("fx-whoosh.wav", make_whoosh())
    write_wav("fx-glitch.wav", make_glitch())
    write_wav("fx-riser.wav", make_riser())
    write_wav("fx-tick.wav", make_tick())
