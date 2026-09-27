import React from "react";
import { useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS } from "../theme";
import { fmt, progress } from "../utils/anim";

export type Tower = { label: string; meters: number; width?: number; color?: string; highlight?: boolean; shape?: "tower" | "slab" | "spire" };

type Props = {
  towers: Tower[];
  baseY?: number;
  /** m → px */
  pxPerMeter?: number;
  start?: number;
  duration?: number;
  gap?: number;
  centerX?: number;
};

/** 건물 높이 비교 실루엣 (롯데월드타워 555m vs 더 라인 500m 등). */
export const HeightCompare: React.FC<Props> = ({ towers, baseY = 900, pxPerMeter = 1.1, start = 0, duration = 45, gap = 90, centerX = 960 }) => {
  const frame = useCurrentFrame();
  const widths = towers.map((t) => t.width ?? 90);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (towers.length - 1);
  let x = centerX - total / 2;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="hc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <line x1={120} y1={baseY} x2={1800} y2={baseY} stroke={COLORS.muted} strokeOpacity={0.4} strokeWidth={2} />
      {towers.map((t, i) => {
        const w = widths[i];
        const s = start + i * 8;
        const p = progress(frame, s, s + duration, Easing.out(Easing.cubic));
        const h = t.meters * pxPerMeter * p;
        const color = t.color ?? (t.highlight ? COLORS.neon : COLORS.dim);
        const cx = x + w / 2;
        const node = (
          <g key={t.label}>
            {t.shape === "spire" ? (
              <path d={`M${x},${baseY} L${x + w},${baseY} L${cx + w * 0.12},${baseY - h * 0.75} L${cx},${baseY - h} L${cx - w * 0.12},${baseY - h * 0.75} Z`} fill={color} opacity={0.9} />
            ) : (
              <rect x={x} y={baseY - h} width={w} height={h} fill={color} opacity={t.highlight ? 0.95 : 0.8} rx={2} />
            )}
            {t.highlight ? <rect x={x} y={baseY - h} width={w} height={h} fill={color} opacity={0.6} filter="url(#hc-glow)" /> : null}
            <text x={cx} y={baseY - h - 22} textAnchor="middle" fill={t.highlight ? COLORS.ink : COLORS.muted} fontFamily={FONTS.num} fontWeight={700} fontSize={36} opacity={progress(frame, s + duration * 0.5, s + duration)}>
              {fmt(t.meters)} m
            </text>
            <text x={cx} y={baseY + 46} textAnchor="middle" fill={t.highlight ? COLORS.ink : COLORS.muted} fontFamily={FONTS.body} fontWeight={t.highlight ? 900 : 500} fontSize={30} opacity={progress(frame, s, s + 10)}>
              {t.label}
            </text>
          </g>
        );
        x += w + gap;
        return node;
      })}
    </svg>
  );
};
