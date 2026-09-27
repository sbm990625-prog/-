import React from "react";
import { Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";

/** 시간(초)→볼륨 자동화 포인트. 사이는 선형 보간. */
export type VolumePoint = [sec: number, volume: number];

export type SfxCue = {
  /** 효과음 파일 (public/audio/ 기준 이름, 확장자 제외) */
  name: "fx-impact" | "fx-whoosh" | "fx-glitch" | "fx-riser" | "fx-tick";
  /** 재생 시작 (초) */
  at: number;
  volume?: number;
};

type Props = {
  /** 각 스템의 볼륨 자동화 (초 단위). 비우면 스템을 쓰지 않는다. */
  pad?: VolumePoint[];
  pulse?: VolumePoint[];
  wind?: VolumePoint[];
  sfx?: SfxCue[];
  /** 전체 마스터 볼륨 */
  master?: number;
};

const curve = (points: VolumePoint[] | undefined, fps: number) => {
  if (!points || points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const xs = sorted.map((p) => Math.round(p[0] * fps));
  const ys = sorted.map((p) => p[1]);
  return (f: number) =>
    xs.length === 1
      ? ys[0]
      : interpolate(f, xs, ys, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

const SFX_LEN: Record<SfxCue["name"], number> = {
  "fx-impact": 2.5,
  "fx-whoosh": 1.4,
  "fx-glitch": 0.7,
  "fx-riser": 4.0,
  "fx-tick": 0.15,
};

/**
 * 절차적으로 생성한 스템(패드·펄스·바람)을 장면 흐름에 맞게 섞고, 원샷 효과음을 큐 시점에 재생한다.
 * 스템은 100초짜리이므로 영상 길이(≤100s) 안에서 그대로 깔린다.
 */
export const Soundtrack: React.FC<Props> = ({ pad, pulse, wind, sfx = [], master = 1 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const stems: Array<{ name: string; fn: ((f: number) => number) | null }> = [
    { name: "stem-pad", fn: curve(pad, fps) },
    { name: "stem-pulse", fn: curve(pulse, fps) },
    { name: "stem-wind", fn: curve(wind, fps) },
  ];
  return (
    <>
      {stems.map((s) =>
        s.fn ? (
          <Audio
            key={s.name}
            src={staticFile(`audio/${s.name}.m4a`)}
            volume={(f) => Math.max(0, Math.min(1, (s.fn as (f: number) => number)(f) * master))}
            trimAfter={durationInFrames}
          />
        ) : null,
      )}
      {sfx.map((c, i) => {
        const from = Math.round(c.at * fps);
        const len = Math.ceil(SFX_LEN[c.name] * fps);
        if (from >= durationInFrames) return null;
        return (
          <Sequence key={`${c.name}-${i}`} from={from} durationInFrames={Math.min(len, durationInFrames - from)}>
            <Audio src={staticFile(`audio/${c.name}.m4a`)} volume={() => (c.volume ?? 1) * master} />
          </Sequence>
        );
      })}
    </>
  );
};
