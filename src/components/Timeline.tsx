import React from "react";
import { useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS } from "../theme";
import { progress } from "../utils/anim";

export type TimelineEvent = {
  date: string; // "2021.01"
  label: string; // "발표: 170km"
  color?: string;
};

type Props = {
  events: TimelineEvent[];
  start?: number;
  stagger?: number;
  y?: number;
  x1?: number;
  x2?: number;
  /** 활성(가장 최근) 이벤트 색 */
  accent?: string;
};

/** 가로 연표: 선이 그려지며 날짜 노드가 순서대로 켜진다. 라벨은 위/아래 번갈아 배치. */
export const Timeline: React.FC<Props> = ({ events, start = 0, stagger = 30, y = 560, x1 = 200, x2 = 1720, accent = COLORS.amber }) => {
  const frame = useCurrentFrame();
  const n = events.length;
  const lineP = progress(frame, start, start + stagger * Math.max(1, n - 1) + 10, Easing.inOut(Easing.cubic));
  const xs = events.map((_, i) => x1 + ((x2 - x1) * i) / Math.max(1, n - 1));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={COLORS.dim} strokeWidth={3} />
      <line x1={x1} y1={y} x2={x1 + (x2 - x1) * lineP} y2={y} stroke={accent} strokeWidth={4} />
      {events.map((e, i) => {
        const s = start + i * stagger;
        const p = progress(frame, s, s + 12);
        const up = i % 2 === 0;
        const color = e.color ?? accent;
        return (
          <g key={i} opacity={p}>
            <circle cx={xs[i]} cy={y} r={10 + 4 * p} fill={COLORS.bg} stroke={color} strokeWidth={4} />
            <circle cx={xs[i]} cy={y} r={5} fill={color} />
            <line x1={xs[i]} y1={y + (up ? -18 : 18)} x2={xs[i]} y2={y + (up ? -70 : 70)} stroke={color} strokeOpacity={0.6} strokeWidth={2} />
            <text x={xs[i]} y={y + (up ? -130 : 118)} textAnchor="middle" fill={color} fontFamily={FONTS.num} fontWeight={700} fontSize={30}>
              {e.date}
            </text>
            <text x={xs[i]} y={y + (up ? -86 : 162)} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.body} fontWeight={700} fontSize={34}>
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
