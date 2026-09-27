import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/** 가장자리 어둡게 (영화적 비네트) */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** 필름 그레인 — 프레임마다 시드가 바뀌는 SVG 노이즈 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** 얇은 주사선 — 미래 UI / 모니터 느낌 */
export const Scanlines: React.FC<{ opacity?: number; gap?: number }> = ({ opacity = 0.12, gap = 4 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity,
      background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent ${gap}px)`,
    }}
  />
);

/** 시네마 레터박스 (2.39:1 느낌) */
export const LetterBox: React.FC<{ height?: number; opacity?: number }> = ({ height = 110, opacity = 1 }) => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height, background: "#000", opacity }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height, background: "#000", opacity }} />
  </>
);

/** 색 번짐 광원 (배경 무드용) */
export const GlowBlob: React.FC<{ x: number; y: number; r: number; color: string; opacity?: number }> = ({
  x,
  y,
  r,
  color,
  opacity = 0.5,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity,
      pointerEvents: "none",
    }}
  />
);

/** 순간 화이트/컬러 플래시 (임팩트 순간) */
export const Flash: React.FC<{ at: number; length?: number; color?: string; peak?: number }> = ({
  at,
  length = 8,
  color = "#ffffff",
  peak = 0.9,
}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + length) return null;
  const o = peak * (1 - (frame - at) / length);
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} />;
};
