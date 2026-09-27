import { interpolate, Easing } from "remotion";
import { FPS } from "../theme";

/** 초 → 프레임 (30fps) */
export const sec = (s: number): number => Math.round(s * FPS);

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** frame 이 [from, to] 구간에서 0→1 로 변하는 진행도 (이징 포함) */
export const progress = (
  frame: number,
  from: number,
  to: number,
  easing: (t: number) => number = Easing.out(Easing.cubic),
): number =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** 구간 [inStart, outEnd] 안에서 fade 프레임 동안 들어왔다 나가는 불투명도 */
export const fadeInOut = (frame: number, inStart: number, outEnd: number, fade = 12): number => {
  if (outEnd - inStart <= fade * 2) {
    return interpolate(frame, [inStart, (inStart + outEnd) / 2, outEnd], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return interpolate(frame, [inStart, inStart + fade, outEnd - fade, outEnd], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = Easing.inOut(Easing.cubic);
export const easeOutBack = Easing.out(Easing.back(1.4));

/** 한국식 천 단위 구분 숫자 */
export const fmt = (n: number, decimals = 0): string =>
  n.toLocaleString("ko-KR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
