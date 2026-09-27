import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { progress } from "../utils/anim";

type Props = {
  /** 중심 x, 바닥 y (px) */
  cx?: number;
  baseY?: number;
  /** 500m → px 스케일 */
  pxPerMeter?: number;
  /** 층/내부가 채워지는 진행 0..1 (undefined 면 프레임으로 자동) */
  reveal?: number;
  revealStart?: number;
  revealDuration?: number;
  /** 치수 라벨 표시 */
  labels?: boolean;
  /** 사람(1.7m) 스케일 표시 */
  human?: boolean;
  color?: string;
};

/**
 * 더 라인의 단면도: 폭 200m × 높이 500m 의 슬래브. 양쪽 거울 외벽, 내부 층, 바닥 철도 스파인.
 * 규모를 설명하는 장면에 쓴다.
 */
export const LineSection: React.FC<Props> = ({
  cx = 960,
  baseY = 940,
  pxPerMeter = 1.5,
  reveal,
  revealStart = 0,
  revealDuration = 45,
  labels = true,
  human = false,
  color = COLORS.neon,
}) => {
  const frame = useCurrentFrame();
  const p = reveal ?? progress(frame, revealStart, revealStart + revealDuration);
  const labelP = progress(frame, revealStart + revealDuration * 0.6, revealStart + revealDuration * 0.6 + 15);
  const W = 200 * pxPerMeter;
  const H = 500 * pxPerMeter;
  const left = cx - W / 2;
  const top = baseY - H;
  const floors = 40; // 시각적 층 (실제 층수 아님)
  const shownFloors = Math.floor(floors * p);
  const drawnH = H * p;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="sec-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2350" />
          <stop offset="1" stopColor="#0a0d22" />
        </linearGradient>
        <filter id="sec-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {/* 지면 */}
      <line x1={left - 500} y1={baseY} x2={left + W + 500} y2={baseY} stroke={COLORS.sand} strokeOpacity={0.5} strokeWidth={2} />
      {/* 내부 */}
      <rect x={left} y={baseY - drawnH} width={W} height={drawnH} fill="url(#sec-inner)" />
      {/* 층선 */}
      {Array.from({ length: shownFloors }, (_, i) => {
        const y = baseY - ((i + 1) / floors) * H;
        return <line key={i} x1={left + 6} y1={y} x2={left + W - 6} y2={y} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1} />;
      })}
      {/* 중앙 통로(빈 공간) */}
      <rect x={cx - W * 0.14} y={baseY - drawnH} width={W * 0.28} height={drawnH} fill="#000" opacity={0.35} />
      {/* 바닥 철도 스파인 */}
      {p > 0.08 ? (
        <>
          <rect x={left + W * 0.2} y={baseY - 22 * pxPerMeter} width={W * 0.6} height={16 * pxPerMeter} fill={COLORS.neon2} opacity={0.35} />
          <line x1={left + W * 0.2} y1={baseY - 14 * pxPerMeter} x2={left + W * 0.8} y2={baseY - 14 * pxPerMeter} stroke={COLORS.neon2} strokeWidth={3} />
        </>
      ) : null}
      {/* 거울 외벽 — 양쪽 */}
      {[left, left + W].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={baseY} x2={x} y2={baseY - drawnH} stroke={color} strokeWidth={10} strokeOpacity={0.5} filter="url(#sec-glow)" />
          <line x1={x} y1={baseY} x2={x} y2={baseY - drawnH} stroke="#ffffff" strokeWidth={3} />
        </g>
      ))}
      {p >= 0.99 ? <line x1={left} y1={top} x2={left + W} y2={top} stroke="#ffffff" strokeWidth={3} /> : null}
      {/* 치수 */}
      {labels ? (
        <g opacity={labelP}>
          {/* 높이 500m */}
          <line x1={left + W + 70} y1={top} x2={left + W + 70} y2={baseY} stroke={COLORS.muted} strokeWidth={2} />
          <line x1={left + W + 58} y1={top} x2={left + W + 82} y2={top} stroke={COLORS.muted} strokeWidth={2} />
          <line x1={left + W + 58} y1={baseY} x2={left + W + 82} y2={baseY} stroke={COLORS.muted} strokeWidth={2} />
          <text x={left + W + 95} y={top + H / 2 + 14} fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={700} fontSize={44}>
            500 m
          </text>
          <text x={left + W + 95} y={top + H / 2 + 60} fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={500} fontSize={30}>
            높이
          </text>
          {/* 폭 200m */}
          <line x1={left} y1={baseY + 50} x2={left + W} y2={baseY + 50} stroke={COLORS.muted} strokeWidth={2} />
          <line x1={left} y1={baseY + 38} x2={left} y2={baseY + 62} stroke={COLORS.muted} strokeWidth={2} />
          <line x1={left + W} y1={baseY + 38} x2={left + W} y2={baseY + 62} stroke={COLORS.muted} strokeWidth={2} />
          <text x={cx} y={baseY + 105} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={700} fontSize={40}>
            200 m
          </text>
        </g>
      ) : null}
      {/* 사람 스케일 */}
      {human && p > 0.05 ? (
        <g opacity={labelP}>
          <circle cx={left - 60} cy={baseY - 1.7 * pxPerMeter * 6 - 3} r={3} fill={COLORS.amber} />
          <line x1={left - 60} y1={baseY - 1.7 * pxPerMeter * 6} x2={left - 60} y2={baseY} stroke={COLORS.amber} strokeWidth={2} />
          <text x={left - 60} y={baseY + 36} textAnchor="middle" fill={COLORS.amber} fontFamily={FONTS.body} fontSize={22} fontWeight={700}>
            사람 (×6)
          </text>
        </g>
      ) : null}
    </svg>
  );
};
