import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS } from "./theme";
import { Soundtrack } from "./components";
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

export const Main: React.FC = () => {
  const sfx: SfxCue[] = [...(SOUND.autoTransitions ? autoCues() : []), ...SOUND.extraSfx].filter((c) => c.at * FPS < TOTAL_FRAMES);
  const clampPoints = (pts: VolumePoint[]) => pts.filter((p) => p[0] * FPS <= TOTAL_FRAMES + FPS);
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {SCENES.map((s) => (
        <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.durationInFrames}>
          <s.component />
        </Sequence>
      ))}
      <Soundtrack pad={clampPoints(SOUND.pad)} pulse={clampPoints(SOUND.pulse)} wind={clampPoints(SOUND.wind)} sfx={sfx} master={SOUND.master} />
    </AbsoluteFill>
  );
};
