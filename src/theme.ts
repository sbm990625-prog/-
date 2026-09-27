/** 영상 전체의 색·서체·안전 여백. 장면 컴포넌트는 반드시 여기서 가져다 쓴다. */
export const COLORS = {
  bg: "#05060f",
  bg2: "#0b0e1f",
  bg3: "#131735",
  ink: "#f4f6ff",
  muted: "#9aa3c7",
  dim: "#4b5280",
  neon: "#38f2ff", // 시안 네온 — '꿈/약속'의 색
  neon2: "#7c5cff", // 보라 — 보조 네온
  magenta: "#ff3ea5", // 강조
  amber: "#ffb347", // '현실/경고'의 색
  danger: "#ff4d4d",
  sand: "#d8b98a",
  sandDark: "#6b4f2a",
  mirror: "#c8d7ff",
  sky: "#0e1a3a",
  skyDawn: "#ff9a6a",
} as const;

export const FONTS = {
  display: "'Black Han Sans', 'Noto Sans KR', sans-serif",
  body: "'Noto Sans KR', sans-serif",
  num: "'Orbitron', 'Noto Sans KR', sans-serif",
} as const;

/** 1920x1080 기준 안전 여백 (휴대폰에서 잘리는 가장자리 회피) */
export const SAFE = { x: 120, y: 90 } as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const glow = (color: string, strength = 1) =>
  [
    `0 0 ${8 * strength}px ${color}`,
    `0 0 ${24 * strength}px ${color}`,
    `0 0 ${64 * strength}px ${color}80`,
  ].join(", ");
