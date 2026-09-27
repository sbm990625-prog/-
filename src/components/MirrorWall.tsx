import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../theme";

type Props = {
  /** 소실점 x, 지평선 y */
  vanishX?: number;
  horizon?: number;
  /** 카메라 쪽 벽 가장자리 x (보통 화면 밖 왼쪽; 오른쪽 벽이면 WIDTH+80) */
  nearX?: number;
  /** 카메라 진행 (프레임당 m) — 패널 선이 흘러간다 */
  speed?: number;
  /** 벽에 비친 하늘 (위→지평선) 색 3개. Desert 의 하늘과 맞추면 거울처럼 보인다. */
  skyColors?: [string, string, string];
  /** 벽에 비친 땅 색 */
  groundColors?: [string, string];
  /** 반사된 태양 위치 0..1 (소실점→가까운 쪽), undefined 면 없음 */
  sunReflect?: number;
  sunColor?: string;
  /** 윗모서리 네온 광선 */
  edgeGlow?: string;
  edgeGlowOpacity?: number;
  /** 패널 간격 (m) */
  panel?: number;
  /** 벽 전체 불투명도 (등장 연출용) */
  opacity?: number;
};

/**
 * 500m 높이의 거울 벽을 1점 투시로 그린다. 카메라는 지면에서 벽을 따라 바라본다.
 * 벽면은 하늘·땅이 반사된 그라데이션 + 반사된 태양 + 유리 패널 격자로 '거울'을 만든다.
 */
export const MirrorWall: React.FC<Props> = ({
  vanishX = 1350,
  horizon = 600,
  nearX = -80,
  speed = 0.6,
  skyColors = ["#050816", "#1a2a6a", "#9cc3ff"],
  groundColors = ["#6b4a2c", "#1a120c"],
  sunReflect,
  sunColor = "#fff2d0",
  edgeGlow = COLORS.neon,
  edgeGlowOpacity = 0.9,
  panel = 40,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const d0 = 18; // 가장 가까운 벽 지점까지 거리 (m)
  const nearTop = horizon - 2600; // 500m 벽의 꼭대기는 화면 위로 한참 벗어난다
  const nearBottom = horizon + 900;
  const project = (d: number) => {
    const k = d0 / d;
    return {
      x: vanishX + (nearX - vanishX) * k,
      top: horizon + (nearTop - horizon) * k,
      bottom: horizon + (nearBottom - horizon) * k,
    };
  };
  const dir = nearX < vanishX ? 1 : -1;
  const offset = (frame * speed) % panel;
  const seams: React.ReactNode[] = [];
  for (let i = 0; i < 90; i++) {
    const d = d0 + i * panel - offset + panel;
    if (d <= d0 * 0.6) continue;
    const p = project(d);
    if (dir * (vanishX - p.x) < 2) break;
    seams.push(<line key={i} x1={p.x} y1={p.top} x2={p.x} y2={p.bottom} stroke="#ffffff" strokeOpacity={Math.min(0.35, (0.45 * d0) / d + 0.04)} strokeWidth={1.4} />);
  }
  // 가로 패널선 (가까운 쪽 y 간격 일정 → 멀어질수록 소실점으로 모인다)
  const rails: React.ReactNode[] = [];
  for (let y = nearTop; y <= nearBottom; y += 140) {
    rails.push(<line key={`r${y}`} x1={nearX} y1={y} x2={vanishX} y2={horizon} stroke="url(#mw-seam-fade)" strokeWidth={1.2} />);
  }
  const wallPath = `M${nearX},${nearTop} L${vanishX},${horizon} L${nearX},${nearBottom} Z`;
  const sunX = sunReflect === undefined ? null : vanishX + (nearX - vanishX) * sunReflect;
  const sunY = horizon - 24;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <linearGradient id="mw-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyColors[0]} />
          <stop offset={`${Math.max(0, (horizon - 420) / HEIGHT)}`} stopColor={skyColors[1]} />
          <stop offset={`${(horizon - 6) / HEIGHT}`} stopColor={skyColors[2]} />
          <stop offset={`${horizon / HEIGHT}`} stopColor="#ffffff" />
          <stop offset={`${(horizon + 8) / HEIGHT}`} stopColor={groundColors[0]} />
          <stop offset={`${Math.min(1, (horizon + 260) / HEIGHT)}`} stopColor={groundColors[1]} />
          <stop offset="1" stopColor="#050403" />
        </linearGradient>
        <linearGradient id="mw-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.7" stopColor="#ffffff" stopOpacity={0.08} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="mw-depth" gradientUnits="userSpaceOnUse" x1={nearX} y1="0" x2={vanishX} y2="0">
          <stop offset="0" stopColor={skyColors[2]} stopOpacity={0} />
          <stop offset="0.7" stopColor={skyColors[2]} stopOpacity={0.25} />
          <stop offset="1" stopColor={skyColors[2]} stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="mw-seam-fade" gradientUnits="userSpaceOnUse" x1={nearX} y1="0" x2={vanishX} y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity={0.08} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="mw-sun">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.25" stopColor={sunColor} stopOpacity={0.9} />
          <stop offset="1" stopColor={sunColor} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="mw-streak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sunColor} stopOpacity={0} />
          <stop offset="0.85" stopColor={sunColor} stopOpacity={0.35} />
          <stop offset="1" stopColor={sunColor} stopOpacity={0} />
        </linearGradient>
        <clipPath id="mw-clip">
          <path d={wallPath} />
        </clipPath>
        <filter id="mw-blur" filterUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g clipPath="url(#mw-clip)">
        {/* 반사된 하늘과 땅 */}
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="url(#mw-fill)" />
        {/* 반사된 태양 + 유리 위 세로 빛줄기 */}
        {sunX !== null ? (
          <>
            <rect x={sunX - 70} y={0} width={140} height={horizon} fill="url(#mw-streak)" />
            <ellipse cx={sunX} cy={sunY} rx={150} ry={110} fill="url(#mw-sun)" opacity={0.95} />
          </>
        ) : null}
        {/* 대기 원근: 멀어질수록 밝고 뿌옇게 */}
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="url(#mw-depth)" />
        {/* 유리 패널 격자 */}
        {rails}
        {seams}
        {/* 유리 광택 */}
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="url(#mw-sheen)" />
      </g>
      {/* 윗모서리 네온 */}
      <line x1={nearX} y1={nearTop} x2={vanishX} y2={horizon} stroke={edgeGlow} strokeWidth={14} strokeOpacity={edgeGlowOpacity * 0.7} filter="url(#mw-blur)" />
      <line x1={nearX} y1={nearTop} x2={vanishX} y2={horizon} stroke="#ffffff" strokeWidth={2.5} strokeOpacity={edgeGlowOpacity} />
      {/* 바닥 접지선 */}
      <line x1={nearX} y1={nearBottom} x2={vanishX} y2={horizon} stroke={edgeGlow} strokeWidth={4} strokeOpacity={edgeGlowOpacity * 0.5} filter="url(#mw-blur)" />
    </svg>
  );
};
