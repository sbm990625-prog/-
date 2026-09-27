import type { SfxCue, VolumePoint } from "./components";

/**
 * 사운드 믹스 설정 (초 단위, 영상 전체 기준).
 * 스템: public/audio/stem-*.m4a (tools/gen-audio.py 로 생성, 각 100초).
 * 장면 타이밍이 바뀌면 여기 숫자만 고치면 된다.
 */
export const SOUND: {
  master: number;
  pad: VolumePoint[];
  pulse: VolumePoint[];
  wind: VolumePoint[];
  autoTransitions: boolean;
  extraSfx: SfxCue[];
} = {
  master: 0.9,
  // 전체에 깔리는 패드 — 초반 페이드인, 마지막에 사라진다.
  pad: [
    [0, 0.0],
    [2, 0.55],
    [80, 0.55],
    [92, 0.0],
  ],
  // 추진감 펄스 — 스토리보드 확정 후 '꿈' 구간에서 올리고 '현실' 컷에서 끊는다.
  pulse: [[0, 0]],
  // 사막 바람 — 오프닝과 현실 파트의 황량함.
  wind: [
    [0, 0.35],
    [6, 0.2],
    [92, 0.2],
  ],
  autoTransitions: true,
  extraSfx: [],
};
