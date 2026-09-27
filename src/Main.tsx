import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";
import { HandoffContext, Soundtrack } from "./components";
import type { SfxCue, VolumePoint } from "./components";
import { FPS, SCENES, TOTAL_FRAMES } from "./scenes";
import { SOUND } from "./sound";

/**
 * 전체 영상: 스토리보드 순서대로 장면을 절대 프레임에 배치하고 사운드트랙을 깐다.
 *
 * 효과음은 두 곳에서 온다.
 *  1) 자동 큐: 장면이 끝나는 방식(handoff)을 보고 whoosh 전환엔 휘익, 하드 컷엔 클릭+임팩트, 글리치 컷엔 글리치+임팩트.
 *  2) 수동 큐: src/sound.ts 의 SOUND.extraSfx (카운터 틱, 라이저 등 장면 내부 타이밍).
 * 스템 볼륨 자동화도 src/sound.ts 에 있다.
 */
const autoCues = (): SfxCue[] => {
  const cues: SfxCue[] = [];
  SCENES.forEach((s, i) => {
    if (i === 0) return;
    const prev = SCENES[i - 1].handoff.toLowerCase();
    const at = s.from / FPS;
    if (/glitch|글리치/.test(prev)) {
      cues.push({ name: "fx-glitch", at: Math.max(0, at - 0.15), volume: 0.7 });
      cues.push({ name: "fx-impact", at, volume: 0.9 });
    } else if (/hard|smash|하드|컷/.test(prev)) {
      // 꿈→현실: 음이 끊기고 6프레임 검정 동안 마른 클릭, 현실이 열릴 때 무거운 한 방
      cues.push({ name: "fx-tick", at: Math.max(0, at - 0.2), volume: 0.85 });
      cues.push({ name: "fx-impact", at, volume: 0.55 });
    } else if (/whoosh|push|slide|wipe|zoom|휘|밀|줌/.test(prev)) {
      cues.push({ name: "fx-whoosh", at: Math.max(0, at - 0.5), volume: 0.4 });
    }
    // fade 전환은 조용히 넘어간다 (필요하면 SOUND.extraSfx 에 수동 큐)
  });
  return cues;
};

/** 장면 경계에서 겹치는 프레임 수 (whoosh push / fade). 하드 컷은 겹치지 않는다. */
const OVERLAP = 10;
const isHard = (h: string) => /hard|smash|하드|컷|glitch|글리치/.test(h.toLowerCase());
const isPush = (h: string) => /whoosh|push|slide|wipe|휘|밀/.test(h.toLowerCase());

/**
 * 장면 경계 처리: 나가는 장면을 OVERLAP 프레임 더 늘려 들어오는 장면 '위에서' 사라지게 한다.
 * 장면마다 따로 페이드 아웃→페이드 인 하면 경계마다 0.5초 가까이 화면이 꺼지므로,
 * 여기서 겹쳐 크로스페이드(+push 는 좌측 밀기)로 잇는다. 들어오는 장면의 시작 시각은 그대로라
 * 자막·효과음 타이밍은 스토리보드와 같다.
 */
const Handoff: React.FC<{ children: React.ReactNode; outFrames: number; outPush: boolean; inFrames: number; inPush: boolean }> = ({
  children,
  outFrames,
  outPush,
  inFrames,
  inPush,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  let opacity = 1;
  let x = 0;
  if (outFrames > 0 && frame >= durationInFrames - outFrames) {
    const p = interpolate(frame, [durationInFrames - outFrames, durationInFrames - 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    opacity = 1 - p;
    if (outPush) x = -90 * p;
  }
  if (inFrames > 0 && inPush && frame < inFrames) {
    const p = interpolate(frame, [0, inFrames], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    x = 90 * (1 - p);
  }
  return <AbsoluteFill style={{ opacity, transform: x ? `translateX(${x}px)` : undefined }}>{children}</AbsoluteFill>;
};

export const Main: React.FC = () => {
  const sfx: SfxCue[] = [...(SOUND.autoTransitions ? autoCues() : []), ...SOUND.extraSfx].filter((c) => c.at * FPS < TOTAL_FRAMES);
  const clampPoints = (pts: VolumePoint[]) => pts.filter((p) => p[0] * FPS <= TOTAL_FRAMES + FPS);
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {SCENES.map((s, i) => {
        const next = SCENES[i + 1];
        const prev = SCENES[i - 1];
        const outFrames = next && !isHard(s.handoff) ? OVERLAP : 0;
        const inFrames = prev && !isHard(prev.handoff) ? OVERLAP : 0;
        return (
          <Sequence
            key={s.id}
            name={s.id}
            from={s.from}
            durationInFrames={s.durationInFrames + outFrames}
            style={{ zIndex: SCENES.length - i }}
          >
            <HandoffContext.Provider value={{ managedIn: inFrames > 0, managedOut: outFrames > 0 }}>
              <Handoff outFrames={outFrames} outPush={isPush(s.handoff)} inFrames={inFrames} inPush={prev ? isPush(prev.handoff) : false}>
                <s.component />
              </Handoff>
            </HandoffContext.Provider>
          </Sequence>
        );
      })}
      <Soundtrack pad={clampPoints(SOUND.pad)} pulse={clampPoints(SOUND.pulse)} wind={clampPoints(SOUND.wind)} sfx={sfx} master={SOUND.master} />
    </AbsoluteFill>
  );
};
