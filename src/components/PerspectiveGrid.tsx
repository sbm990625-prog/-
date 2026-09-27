import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../theme";

type Props = {
  horizon?: number;
  color?: string;
  speed?: number;
  opacity?: number;
  /** 세로선 개수(한쪽) */
  columns?: number;
};

/** 신스웨이브식 바닥 격자 — 소실점을 향해 흐른다. '꿈' 장면의 배경. */
export const PerspectiveGrid: React.FC<Props> = ({ horizon = 620, color = COLORS.neon2, speed = 1.2, opacity = 0.5, columns = 14 }) => {
  const frame = useCurrentFrame();
  const vx = WIDTH / 2;
  const rows: React.ReactNode[] = [];
  const spacing = 40;
  const off = (frame * speed) % spacing;
  for (let i = 0; i < 40; i++) {
    const d = 8 + i * spacing - off + spacing;
    const k = 8 / d;
    const y = horizon + (HEIGHT + 300 - horizon) * k;
    if (y > HEIGHT + 50) continue;
    rows.push(<line key={`r${i}`} x1={0} y1={y} x2={WIDTH} y2={y} stroke={color} strokeOpacity={Math.min(0.9, k * 3)} strokeWidth={1.5} />);
  }
  const cols: React.ReactNode[] = [];
  for (let i = -columns; i <= columns; i++) {
    const xNear = vx + i * 260;
    cols.push(<line key={`c${i}`} x1={vx} y1={horizon} x2={xNear} y2={HEIGHT + 200} stroke={color} strokeOpacity={0.55} strokeWidth={1.5} />);
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <linearGradient id="pg-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={1} />
          <stop offset="0.25" stopColor="#000" stopOpacity={0} />
        </linearGradient>
      </defs>
      {cols}
      {rows}
      <rect y={horizon} width={WIDTH} height={HEIGHT - horizon} fill="url(#pg-fade)" />
    </svg>
  );
};
