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
 *  1) 자동 큐: 장면 전환 문자열(transition)을 보고 부드러운 전환엔 whoosh, 하드 컷/글리치엔 impact+glitch.
 *  2) 수동 큐: src/sound.ts 의 SOUND.extraSfx (카운터 틱, 라이저 등 장면 내부 타이밍).
 * 스템 볼륨 자동화도 src/sound.ts 에 있다.
 */
const autoCues = (): SfxCue[] => {
  const cues: SfxCue[] = [];
  SCENES.forEach((s, i) => {
    if (i === 0) return;
    const t = s.transition.toLowerCase();
    const prev = SCENES[i - 1].transition.toLowerCase();
    const at = s.from / FPS;
    const hard = /glitch|hard|smash|글리치|하드|컷/.test(prev) && !/fade|dissolve|페이드|디졸브/.test(prev);
    if (hard) {
      cues.push({ name: "fx-glitch", at: Math.max(0, at - 0.15), volume: 0.7 });
      cues.push({ name: "fx-impact", at, volume: 0.9 });
    } else if (/whoosh|push|slide|wipe|zoom|휘|밀|줌/.test(prev) || /fade|dissolve|페이드|디졸브/.test(prev)) {
      cues.push({ name: "fx-whoosh", at: Math.max(0, at - 0.5), volume: 0.45 });
    } else if (t) {
      cues.push({ name: "fx-whoosh", at: Math.max(0, at - 0.5), volume: 0.3 });
    }
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
