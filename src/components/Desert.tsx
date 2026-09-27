import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { HEIGHT, WIDTH } from "../theme";

type Time = "night" | "dawn" | "day" | "dusk";

type Props = {
  time?: Time;
  /** 지평선 y (px) */
  horizon?: number;
  stars?: boolean;
  /** 태양/달 x 위치 (0..1) */
  sunX?: number;
  sunY?: number;
  /** 모래언덕 층 수 */
  duneLayers?: number;
  /** 카메라가 옆으로 흐르는 시차 (px, 프레임당) */
  drift?: number;
  children?: React.ReactNode;
};

const SKY: Record<Time, [string, string, string]> = {
  night: ["#03040c", "#0a1030", "#1b2350"],
  dawn: ["#0a0f2a", "#4a2c5e", "#ff9a6a"],
  day: ["#1a4fb0", "#5aa0e8", "#dfe9f5"],
  dusk: ["#120a2a", "#6a2a5e", "#ff6a3d"],
};

const SAND: Record<Time, [string, string]> = {
  night: ["#1a1730", "#0b0a18"],
  dawn: ["#8a5a3a", "#2e1c14"],
  day: ["#e3c48f", "#b8905a"],
  dusk: ["#a05a3a", "#3a1f16"],
};

const dunePath = (seed: number, baseY: number, amp: number, drift: number, width = WIDTH): string => {
  const pts: string[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * width;
    const u = (x + drift) / width;
    const y =
      baseY +
      amp * Math.sin(u * Math.PI * 2 * 1.3 + seed * 7) +
      amp * 0.5 * Math.sin(u * Math.PI * 2 * 3.1 + seed * 3) +
      amp * 0.25 * Math.sin(u * Math.PI * 2 * 6.7 + seed * 11);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `${pts.join(" ")} L${width},${HEIGHT + 10} L0,${HEIGHT + 10} Z`;
};

/** 사막 배경: 하늘 그라데이션, 별, 태양/달, 여러 겹의 모래언덕 (SVG). */
export const Desert: React.FC<Props> = ({
  time = "night",
  horizon = 620,
  stars,
  sunX = 0.72,
  sunY,
  duneLayers = 3,
  drift = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const sky = SKY[time];
  const sand = SAND[time];
  const showStars = stars ?? time === "night";
  const starPts = useMemo(
    () =>
      Array.from({ length: 160 }, (_, i) => ({
        x: random(`sx${i}`) * WIDTH,
        y: random(`sy${i}`) * horizon * 0.95,
        r: 0.6 + random(`sr${i}`) * 1.6,
        tw: random(`st${i}`) * Math.PI * 2,
      })),
    [horizon],
  );
  const sy = sunY ?? (time === "day" ? horizon * 0.35 : horizon * 0.82);
  const sunColor = time === "night" ? "#dfe6ff" : time === "day" ? "#fff6d5" : "#ffb070";
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky[0]} />
            <stop offset="60%" stopColor={sky[1]} />
            <stop offset="100%" stopColor={sky[2]} />
          </linearGradient>
          <linearGradient id="sandg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sand[0]} />
            <stop offset="100%" stopColor={sand[1]} />
          </linearGradient>
          <radialGradient id="sung">
            <stop offset="0%" stopColor={sunColor} />
            <stop offset="40%" stopColor={sunColor} stopOpacity={0.9} />
            <stop offset="100%" stopColor={sunColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={WIDTH} height={horizon} fill="url(#skyg)" />
        {showStars
          ? starPts.map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill="#ffffff"
                opacity={0.35 + 0.65 * Math.abs(Math.sin(frame * 0.05 + s.tw))}
              />
            ))
          : null}
        <circle cx={sunX * WIDTH} cy={sy} r={time === "night" ? 70 : 140} fill="url(#sung)" opacity={time === "night" ? 0.9 : 0.85} />
        {time === "night" ? <circle cx={sunX * WIDTH} cy={sy} r={34} fill="#eef2ff" /> : null}
        <rect y={horizon} width={WIDTH} height={HEIGHT - horizon} fill="url(#sandg)" />
        {Array.from({ length: duneLayers }, (_, i) => {
          const k = i / Math.max(1, duneLayers - 1);
          const baseY = horizon + 10 + k * (HEIGHT - horizon) * 0.55;
          const shade = 0.15 + k * 0.45;
          return (
            <path
              key={i}
              d={dunePath(i + 1, baseY, 22 + k * 40, drift * frame * (0.3 + k))}
              fill={`rgba(0,0,0,${shade})`}
            />
          );
        })}
        {/* 지평선 안개 */}
        <rect y={horizon - 60} width={WIDTH} height={120} fill={sky[2]} opacity={0.18} />
      </svg>
      {children}
    </AbsoluteFill>
  );
};
