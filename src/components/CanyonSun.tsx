import React from "react";
import { COLORS, FONTS } from "../theme";

type Props = {
  /** 태양 고도 (도). 남쪽(왼쪽)에서 비춘다. */
  elevation: number;
  /** 벽 높이 / 협곡 폭 (m) */
  height?: number;
  gap?: number;
  cx?: number;
  baseY?: number;
  pxPerMeter?: number;
  /** 고도 라벨 (예: "동지 정오") */
  label?: string;
};

/**
 * 500m 벽 사이 200m 협곡의 단면에 햇빛이 드는 모습. 태양 고도가 arctan(500/200)=68.2° 보다 낮으면 바닥은 그늘.
 */
export const CanyonSun: React.FC<Props> = ({ elevation, height = 500, gap = 200, cx = 960, baseY = 920, pxPerMeter = 1.4, label }) => {
  const H = height * pxPerMeter;
  const G = gap * pxPerMeter;
  const wallW = 120;
  const leftInner = cx - G / 2;
  const rightInner = cx + G / 2;
  const top = baseY - H;
  const rad = (elevation * Math.PI) / 180;
  // 왼쪽(남쪽) 벽 윗모서리에서 내려오는 그림자 경계
  const shadowLen = H / Math.tan(rad); // 수평 그림자 길이 (px)
  const litStart = leftInner + shadowLen; // 바닥에 빛이 닿기 시작하는 x
  const floorLit = Math.max(0, rightInner - litStart);
  // 바닥이 전부 그늘이면: 오른쪽 벽면의 빛 경계 높이
  const wallShadowTop = shadowLen >= G ? baseY - (H - G * Math.tan(rad)) : baseY;
  const rayDx = Math.cos(rad);
  const rayDy = Math.sin(rad);
  // 협곡 윗 개구부를 통과하는 평행 광선: 오른쪽 벽면 또는 바닥에 닿는 곳까지 그린다
  const rays = Array.from({ length: 7 }, (_, i) => {
    const ex = leftInner + ((i + 0.5) / 7) * G;
    const tWall = (rightInner - ex) / rayDx;
    const tFloor = (baseY - top) / rayDy;
    const t = Math.min(tWall, tFloor);
    return { x1: ex - rayDx * 700, y1: top - rayDy * 700, x2: ex + rayDx * t, y2: top + rayDy * t };
  });
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="cs-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b2350" />
          <stop offset="1" stopColor="#0d1130" />
        </linearGradient>
        <linearGradient id="cs-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffd27a" stopOpacity={0.15} />
        </linearGradient>
      </defs>
      {/* 햇빛 영역 (협곡 안) */}
      <polygon
        points={`${leftInner},${top} ${rightInner},${top} ${rightInner},${Math.min(baseY, wallShadowTop)} ${Math.min(rightInner, Math.max(leftInner, litStart))},${shadowLen >= G ? wallShadowTop : baseY}`}
        fill="url(#cs-sun)"
      />
      {/* 광선 */}
      {rays.map((r, i) => (
        <g key={i}>
          <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#ffd27a" strokeOpacity={0.45} strokeWidth={2} />
          <circle cx={r.x2} cy={r.y2} r={5} fill="#ffd27a" />
        </g>
      ))}
      {/* 벽 */}
      <rect x={leftInner - wallW} y={top} width={wallW} height={H} fill="url(#cs-wall)" stroke={COLORS.neon} strokeWidth={2} />
      <rect x={rightInner} y={top} width={wallW} height={H} fill="url(#cs-wall)" stroke={COLORS.neon} strokeWidth={2} />
      {/* 바닥 */}
      <line x1={leftInner - 400} y1={baseY} x2={rightInner + 400} y2={baseY} stroke={COLORS.sand} strokeOpacity={0.6} strokeWidth={3} />
      <line x1={leftInner} y1={baseY} x2={rightInner} y2={baseY} stroke="#000" strokeWidth={10} />
      {floorLit > 0 ? <line x1={rightInner - floorLit} y1={baseY} x2={rightInner} y2={baseY} stroke="#ffd27a" strokeWidth={10} /> : null}
      {/* 그림자 경계선 */}
      <line x1={leftInner} y1={top} x2={Math.min(rightInner, litStart)} y2={shadowLen >= G ? wallShadowTop : baseY} stroke="#ffd27a" strokeOpacity={0.8} strokeDasharray="10 8" strokeWidth={2} />
      {/* 라벨 */}
      <text x={leftInner - wallW - 40} y={top + 60} textAnchor="end" fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={900} fontSize={64}>
        {elevation.toFixed(1)}°
      </text>
      {label ? (
        <text x={leftInner - wallW - 40} y={top + 110} textAnchor="end" fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={700} fontSize={32}>
          {label}
        </text>
      ) : null}
      <text x={cx} y={baseY + 56} textAnchor="middle" fill={floorLit > 0 ? "#ffd27a" : COLORS.muted} fontFamily={FONTS.body} fontWeight={900} fontSize={34}>
        {floorLit > 0 ? `바닥 햇빛 ${Math.round((floorLit / G) * 100)}%` : "바닥: 그늘"}
      </text>
    </svg>
  );
};
