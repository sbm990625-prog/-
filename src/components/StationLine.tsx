import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { fmt, progress } from "../utils/anim";

type Props = {
  /** 역 개수 (예: 86). express=true 면 양 끝 두 역만 선다. */
  stations?: number;
  express?: boolean;
  /** 애니메이션 구간 (장면 기준 프레임) */
  start?: number;
  duration?: number;
  /** 시뮬레이션 총 소요 시간(분) — 시계 표시용. undefined 면 시계 숨김 */
  totalMinutes?: number;
  x1?: number;
  x2?: number;
  y?: number;
  color?: string;
  /** 양 끝 라벨 */
  fromLabel?: string;
  toLabel?: string;
  /** 정차 비율 (구간 시간 중 역에 서 있는 비율) */
  dwellShare?: number;
};

/**
 * 170km 선로 위를 달리는 열차 시뮬레이션. 역마다 멈췄다 가는 움직임과 경과 시간 시계.
 * '20분 약속' vs '86개 역' 수학을 보여줄 때 쓴다.
 */
export const StationLine: React.FC<Props> = ({
  stations = 86,
  express = false,
  start = 0,
  duration = 150,
  totalMinutes,
  x1 = 180,
  x2 = 1740,
  y = 600,
  color = COLORS.neon,
  fromLabel,
  toLabel,
  dwellShare = 0.35,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, start + duration, (t) => t);
  const segs = express ? 1 : Math.max(1, stations - 1);
  let pos: number;
  if (express) {
    // 가속-순항-감속
    const e = p < 0.15 ? (p / 0.15) ** 2 * 0.075 : p > 0.85 ? 1 - ((1 - p) / 0.15) ** 2 * 0.075 : 0.075 + ((p - 0.15) / 0.7) * 0.85;
    pos = e;
  } else {
    const f = p * segs;
    const seg = Math.min(segs - 1, Math.floor(f));
    const local = f - seg;
    const move = local < dwellShare ? 0 : (local - dwellShare) / (1 - dwellShare);
    const eased = move < 0.5 ? 2 * move * move : 1 - Math.pow(-2 * move + 2, 2) / 2;
    pos = p >= 1 ? 1 : (seg + eased) / segs;
  }
  const tx = x1 + (x2 - x1) * pos;
  const ticks = express ? [0, 1] : Array.from({ length: stations }, (_, i) => i / (stations - 1));
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="sl-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={COLORS.dim} strokeWidth={6} strokeLinecap="round" />
      <line x1={x1} y1={y} x2={tx} y2={y} stroke={color} strokeWidth={6} strokeLinecap="round" />
      {ticks.map((t, i) => {
        const x = x1 + (x2 - x1) * t;
        const passed = x <= tx + 0.5;
        const end = i === 0 || i === ticks.length - 1;
        return <line key={i} x1={x} y1={y - (end ? 26 : 14)} x2={x} y2={y + (end ? 26 : 14)} stroke={passed ? color : COLORS.muted} strokeOpacity={passed ? 0.9 : 0.5} strokeWidth={end ? 4 : 2} />;
      })}
      <rect x={tx - 34} y={y - 13} width={68} height={26} rx={13} fill={color} filter="url(#sl-glow)" opacity={0.8} />
      <rect x={tx - 30} y={y - 10} width={60} height={20} rx={10} fill="#ffffff" />
      {fromLabel ? (
        <text x={x1} y={y + 72} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.body} fontWeight={700} fontSize={32}>
          {fromLabel}
        </text>
      ) : null}
      {toLabel ? (
        <text x={x2} y={y + 72} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.body} fontWeight={700} fontSize={32}>
          {toLabel}
        </text>
      ) : null}
      {totalMinutes !== undefined ? (
        <g>
          <text x={x2} y={y - 90} textAnchor="end" fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={900} fontSize={72}>
            {fmt(Math.floor(totalMinutes * p))}
            <tspan fontFamily={FONTS.body} fontSize={40} fill={color}>
              {" "}분
            </tspan>
          </text>
        </g>
      ) : null}
    </svg>
  );
};
