import type { SfxCue, VolumePoint } from "./components";

/**
 * 사운드 믹스 (초 단위, 영상 전체 기준). docs/script.md 의 팔레트·무드와 장면별 SFX 지시를 따른다.
 * 스템: public/audio/stem-*.m4a (tools/gen-audio.py 로 생성, 각 100초).
 *
 *  0–57.0   약속 구간  — 신스 패드 베드, 실험(s04–s08)부터 펄스가 붙고 s08 에서 절정
 *  57.0     음이 중간에 끊김 + 6프레임 검정 + 마른 클릭
 *  57.2–75.2 현실 구간 — 패드 없음, 드라이 펄스, 황량한 바람
 *  75.2–84.8 인적 비용 — 낮은 패드 하나(드론처럼), 펄스 없음
 *  84.8–91.0 엔드 카드 — 지속음으로 끝
 */

// 한 순간에 볼륨을 끊을 때 쓰는 아주 짧은 간격 (1프레임)
const CUT = 1 / 30;

export const SOUND: {
  master: number;
  pad: VolumePoint[];
  pulse: VolumePoint[];
  wind: VolumePoint[];
  autoTransitions: boolean;
  extraSfx: SfxCue[];
} = {
  master: 0.9,
  pad: [
    [0, 0.0],
    [1.5, 0.45],
    [19.8, 0.5],
    [50.0, 0.55],
    [54.4, 0.75], // s08 카메라가 빠지며 절정
    [57.0 - CUT, 0.75],
    [57.0, 0.0], // 음 중간에 끊김
    [75.2, 0.0],
    [76.5, 0.25], // s11 낮은 드론
    [84.8, 0.3],
    [86.0, 0.42], // s12 지속음
    [89.5, 0.35],
    [91.0, 0.0],
  ],
  pulse: [
    [0, 0.0],
    [19.8, 0.0],
    [20.8, 0.28], // 실험 시작부터 추진감
    [49.0, 0.32],
    [54.4, 0.5],
    [57.0 - CUT, 0.5],
    [57.0, 0.0],
    [57.2, 0.0],
    [57.6, 0.42], // 현실: 드라이 퍼커션
    [74.2, 0.42],
    [75.2, 0.0],
  ],
  wind: [
    [0, 0.32], // 밤 사막
    [7.0, 0.12],
    [57.0, 0.12],
    [57.2, 0.5], // 현실: 황량함
    [75.2, 0.3],
    [84.8, 0.18],
    [91.0, 0.0],
  ],
  autoTransitions: true,
  extraSfx: [
    // s01 훅
    { name: "fx-impact", at: 0.1, volume: 0.8 }, // 베이스 히트 + 플래시
    { name: "fx-whoosh", at: 0.2, volume: 0.5 }, // 빛의 선 점화
    { name: "fx-glitch", at: 2.55, volume: 0.7 }, // 네온 → 네옴
    ...[4.6, 4.75, 4.9, 5.05, 5.2, 5.35].map((at) => ({ name: "fx-tick" as const, at, volume: 0.22 })), // 제목 타이핑
    // s02 900만 카운터
    ...[11.9, 12.1, 12.3, 12.5, 12.7, 12.9].map((at) => ({ name: "fx-tick" as const, at, volume: 0.3 })),
    // s03 서울~강릉 스냅, 높이 카운트업
    { name: "fx-tick", at: 15.9, volume: 0.75 },
    ...[16.9, 17.2, 17.5].map((at) => ({ name: "fx-tick" as const, at, volume: 0.25 })),
    // 실험 헤더 '쿵' (s04–s08)
    ...[19.85, 26.45, 36.05, 42.65, 49.05].map((at) => ({ name: "fx-impact" as const, at, volume: 0.3 })),
    // s04 ×17 태그
    { name: "fx-tick", at: 23.0, volume: 0.5 },
    // s05 열차: 510km/h 휘익, 역 86개 팝, 20분 선 넘을 때
    { name: "fx-whoosh", at: 27.2, volume: 0.4 },
    ...Array.from({ length: 12 }, (_, i) => ({ name: "fx-tick" as const, at: 32.7 + i * 0.07, volume: 0.18 })),
    { name: "fx-tick", at: 35.2, volume: 0.6 },
    // s07 철새 경고 링
    { name: "fx-tick", at: 47.4, volume: 0.5 },
    { name: "fx-tick", at: 47.9, volume: 0.4 },
    // s08 탄소 붐, 절정 라이저, 끊김 클릭
    { name: "fx-impact", at: 49.6, volume: 0.5 },
    { name: "fx-riser", at: 50.4, volume: 0.45 },
    // (57.0 클릭과 57.2 현실 진입 임팩트는 autoTransitions 의 hard cut 처리)
    // s10 헤드라인 카드 '쾅', 인구 목표 두 번 하락, 900만 취소선
    { name: "fx-impact", at: 64.2, volume: 0.35 },
    { name: "fx-impact", at: 68.2, volume: 0.3 },
    { name: "fx-tick", at: 69.2, volume: 0.45 },
    { name: "fx-tick", at: 70.2, volume: 0.45 },
    { name: "fx-impact", at: 71.7, volume: 0.3 },
    { name: "fx-glitch", at: 72.2, volume: 0.3 },
    // s11 느린 타건
    ...[75.5, 75.8, 76.1, 79.1, 79.4, 79.7, 82.2, 82.5, 82.8].map((at) => ({ name: "fx-tick" as const, at, volume: 0.16 })),
    // s12 선이 구간별로 꺼지는 지직
    { name: "fx-glitch", at: 85.0, volume: 0.25 },
    { name: "fx-glitch", at: 85.9, volume: 0.2 },
    { name: "fx-glitch", at: 86.7, volume: 0.15 },
  ],
};
