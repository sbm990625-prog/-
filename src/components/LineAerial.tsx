import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { progress } from "../utils/anim";

type Props = {
  /** 선이 그려지는 진행 0..1 (undefined 면 프레임으로) */
  draw?: number;
  drawStart?: number;
  drawDuration?: number;
  /** 선의 시작/끝 좌표 (px) */
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  color?: string;
  thickness?: number;
  /** 왼쪽에 바다 표시 */
  sea?: boolean;
  /** 눈금 라벨 (예: "170 km") */
  label?: string;
  /** 밤 모드: 어두운 사막 + 빛나는 선 */
  night?: boolean;
};

const ridge = (seed: number, y0: number, amp: number): string => {
  const pts: string[] = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * (WIDTH + 200) - 100;
    const u = i / n;
    const y = y0 + amp * Math.sin(u * Math.PI * 2 * 1.7 + seed * 5.1) + amp * 0.45 * Math.sin(u * Math.PI * 2 * 4.3 + seed * 2.3);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

/** 위성/항공 시점: 사막 위를 가로지르는 한 줄기 빛. */
export const LineAerial: React.FC<Props> = ({
  draw,
  drawStart = 0,
  drawDuration = 60,
  x1 = 300,
  y1 = 660,
  x2 = 1760,
  y2 = 400,
  color = COLORS.neon,
  thickness = 6,
  sea = true,
  label,
  night = true,
}) => {
  const frame = useCurrentFrame();
  const p = draw ?? progress(frame, drawStart, drawStart + drawDuration);
  const ridges = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ d: ridge(i, 40 + i * 50, 14 + random(`ra${i}`) * 22), o: 0.06 + random(`ro${i}`) * 0.1 })), []);
  const patches = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: random(`px${i}`) * WIDTH,
        y: random(`py${i}`) * HEIGHT,
        r: 180 + random(`pr${i}`) * 320,
        o: 0.05 + random(`po${i}`) * 0.08,
      })),
    [],
  );
  const ex = x1 + (x2 - x1) * p;
  const ey = y1 + (y2 - y1) * p;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const sandA = night ? "#2a1e12" : "#c9a26b";
  const sandB = night ? "#120c08" : "#8f6a3c";
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="aer-sand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={sandA} />
          <stop offset="1" stopColor={sandB} />
        </linearGradient>
        <linearGradient id="aer-sea" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={night ? "#061a30" : "#1d5f8f"} />
          <stop offset="1" stopColor={night ? "#0b2c4c" : "#3a8ac0"} />
        </linearGradient>
        <radialGradient id="aer-patch">
          <stop offset="0" stopColor="#f0d7a8" stopOpacity={1} />
          <stop offset="1" stopColor="#f0d7a8" stopOpacity={0} />
        </radialGradient>
        <filter id="aer-glow" x="-10%" y="-300%" width="120%" height="700%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#aer-sand)" />
      {patches.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#aer-patch)" opacity={b.o} />
      ))}
      {/* 모래언덕 능선 (등고선 느낌) */}
      {ridges.map((r, i) => (
        <path key={i} d={r.d} fill="none" stroke="#000" strokeOpacity={r.o * 1.6} strokeWidth={2} />
      ))}
      {ridges.map((r, i) => (
        <path key={`l${i}`} d={r.d} fill="none" stroke="#ffe2b0" strokeOpacity={r.o * 0.7} strokeWidth={1} transform="translate(0,-3)" />
      ))}
      {sea ? (
        <>
          <path d={`M0,0 L${x1 - 150},0 C${x1 - 60},${HEIGHT * 0.25} ${x1 - 230},${HEIGHT * 0.65} ${x1 - 110},${HEIGHT} L0,${HEIGHT} Z`} fill="url(#aer-sea)" />
          <path d={`M${x1 - 150},0 C${x1 - 60},${HEIGHT * 0.25} ${x1 - 230},${HEIGHT * 0.65} ${x1 - 110},${HEIGHT}`} fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={3} />
        </>
      ) : null}
      {/* 빛의 선 */}
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={thickness * 5} strokeOpacity={0.55} strokeLinecap="round" filter="url(#aer-glow)" />
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={thickness} strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={thickness * 1.6} fill="#ffffff" />
      {label ? (
        <g opacity={progress(frame, drawStart + drawDuration * 0.5, drawStart + drawDuration * 0.5 + 12)}>
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 44}
            textAnchor="middle"
            fill={COLORS.ink}
            fontFamily={FONTS.num}
            fontWeight={900}
            fontSize={64}
            transform={`rotate(${angle} ${(x1 + x2) / 2} ${(y1 + y2) / 2})`}
          >
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};
