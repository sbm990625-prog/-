import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { clamp01, progress } from "../utils/anim";
import { Caption, DisclaimerTag, DreamLetterBox, Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s03-korea-scale — 규모를 한국 것으로 바꾼다.
 * 길이 = 서울시청~강릉시청 직선거리 168.4km(도로·KTX 거리 아님), 높이 = 롯데월드타워(555m)보다 55m 낮은 500m,
 * 참고로 부르즈 할리파 828m. 그런 벽이 200m 간격으로 두 줄 마주 선다.
 * 13.6s → 19.8s (186 frames). 장면 내부 시간 = 절대 시간 − 13.6s.
 *  - A (0–3.1s): 추상 스트립. 시안 '더 라인 170km' 막대 위로 강철색 점선 '서울 → 강릉 · 직선 168km'가 올라와 맞물림(2.2s 스냅).
 *  - B (3.1–6.2s): 기준선 위 실루엣 — 부르즈 할리파 828m(흐린 강철) · 롯데월드타워 555m(강철) · 더 라인 500m(시안 거울 벽,
 *    오른쪽 화면 밖으로 이어짐). 4.7s(=18.3s) 벽이 두 장으로 복제되어 마주 보고 '간격 200m'.
 *  - 끝: whoosh push (왼쪽으로 밀려 나감).
 */

const W = 1920;
const H = 1080;

// ─── 타이밍 (프레임, 장면 기준) ─────────────────────────────
const T = {
  barIn: 0,
  steelIn: 16,
  steelAligned: 48,
  snap: 64, // 스냅 SFX 지점 (15.73s 절대)
  stripOut: 86,
  stripGone: 104,
  baseIn: 82,
  burj: 98,
  lotte: 88,
  line: 94,
  grow: 34,
  dup: 141, // 18.3s 절대
  pushOut: 174,
} as const;

// ─── 스트립 기하 ─────────────────────────────────────────
const STRIP_Y = 470;
const STRIP_X0 = 250;
const STRIP_X1 = 1670;
const PX_PER_KM = (STRIP_X1 - STRIP_X0) / 170;
const STEEL_KM = 168.4;
const STEEL_X1 = STRIP_X0 + STEEL_KM * PX_PER_KM;

// ─── 높이 비교 기하 ───────────────────────────────────────
const BASE_Y = 762;
const PX_PER_M = 0.65;
const BURJ_X = 470;
const LOTTE_X = 800;
const WALL_X0 = 1030;
const WALL_T = 40; // 벽 전면(끝면) 폭 — 양식화
const GAP_PX = 200 * PX_PER_M; // 130px = 200m (같은 축척)
const K = -0.28; // 비스듬한 깊이축 기울기 (dx 당 dy)

const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let x = -80; x <= W + 80; x += 80) out.push({ x1: x, y1: -80, x2: x, y2: H + 80, major: (x + 80) % 320 === 0 });
    for (let y = -80; y <= H + 80; y += 80) out.push({ x1: -80, y1: y, x2: W + 80, y2: y, major: (y + 80) % 320 === 0 });
    return out;
  }, []);
  const drift = (frame * 0.35) % 80;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={`translate(${-drift} 0)`}>
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={COLORS.neon}
              strokeOpacity={l.major ? 0.075 : 0.035}
              strokeWidth={1}
            />
          ))}
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 55% 45%, ${COLORS.neon2}14 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── A: 추상 스트립 ───────────────────────────────────────
const Strip: React.FC = () => {
  const frame = useCurrentFrame();

  const ticks = useMemo(() => {
    const out: { x: number; major: boolean }[] = [];
    for (let km = 0; km <= 170; km += 10) out.push({ x: STRIP_X0 + km * PX_PER_KM, major: km % 50 === 0 || km === 170 });
    return out;
  }, []);

  // 0프레임부터 30% 그려진 상태 — s02에서 넘어오는 push가 빈 화면에 떨어지지 않게
  const barP = 0.3 + 0.7 * progress(frame, T.barIn, T.barIn + 22, Easing.out(Easing.cubic));
  const barEnd = STRIP_X0 + (STRIP_X1 - STRIP_X0) * barP;
  const cyanLabelO = progress(frame, 2, 18);
  const tickO = progress(frame, 8, 26) * 0.7;

  // 강철색 점선: 아래·왼쪽에서 미끄러져 들어와 → 막대 위로 올라와 스냅
  const slideP = progress(frame, T.steelIn, T.steelAligned, Easing.out(Easing.cubic));
  const riseP = progress(frame, T.steelAligned + 2, T.snap, Easing.in(Easing.cubic));
  const settle = frame >= T.snap ? Math.sin(clamp01((frame - T.snap) / 10) * Math.PI) * -5 * (1 - clamp01((frame - T.snap) / 10)) : 0;
  const steelDx = (1 - slideP) * -520;
  const steelDy = (1 - riseP) * 150 + settle;
  const steelO = progress(frame, T.steelIn, T.steelIn + 12);

  const snapPulse = frame >= T.snap ? Math.exp(-(frame - T.snap) / 7) : 0;
  const ringP = progress(frame, T.snap, T.snap + 16, Easing.out(Easing.cubic));

  const outP = progress(frame, T.stripOut, T.stripGone, Easing.inOut(Easing.cubic));
  const groupO = 1 - outP;
  if (groupO <= 0) return null;

  const steelY = STRIP_Y + steelDy;

  return (
    <AbsoluteFill style={{ opacity: groupO, transform: `translateY(${-50 * outP}px)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="s03-strip-glow" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation={9} />
          </filter>
          <linearGradient id="s03-bar" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={COLORS.neon} stopOpacity={0.75} />
            <stop offset="1" stopColor={COLORS.neon} stopOpacity={1} />
          </linearGradient>
        </defs>

        {/* 눈금 (10km 간격) */}
        <g opacity={tickO}>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x}
              x2={t.x}
              y1={STRIP_Y + 20}
              y2={STRIP_Y + (t.major ? 42 : 32)}
              stroke={COLORS.neon}
              strokeOpacity={t.major ? 0.6 : 0.3}
              strokeWidth={2}
            />
          ))}
        </g>

        {/* 시안 '더 라인 170km' 막대 */}
        <rect
          x={STRIP_X0}
          y={STRIP_Y - 11}
          width={Math.max(0, barEnd - STRIP_X0)}
          height={22}
          rx={4}
          fill={COLORS.neon}
          opacity={0.45 + 0.35 * snapPulse}
          filter="url(#s03-strip-glow)"
        />
        <rect x={STRIP_X0} y={STRIP_Y - 11} width={Math.max(0, barEnd - STRIP_X0)} height={22} rx={4} fill="url(#s03-bar)" />
        {/* 막대 끝 캡 */}
        <g opacity={cyanLabelO}>
          <line x1={STRIP_X0} x2={STRIP_X0} y1={STRIP_Y - 30} y2={STRIP_Y + 18} stroke={COLORS.neon} strokeWidth={3} />
          <line x1={STRIP_X1} x2={STRIP_X1} y1={STRIP_Y - 30} y2={STRIP_Y + 18} stroke={COLORS.neon} strokeWidth={3} />
        </g>

        {/* 강철색 점선 서울 → 강릉 */}
        <g opacity={steelO} transform={`translate(${steelDx} 0)`}>
          <line x1={STRIP_X0} x2={STEEL_X1} y1={steelY} y2={steelY} stroke={COLORS.bg} strokeWidth={14} strokeLinecap="round" />
          <line
            x1={STRIP_X0}
            x2={STEEL_X1}
            y1={steelY}
            y2={steelY}
            stroke={COLORS.steel}
            strokeWidth={7}
            strokeDasharray="22 12"
            strokeLinecap="round"
          />
          <circle cx={STRIP_X0} cy={steelY} r={11} fill={COLORS.steel} stroke={COLORS.bg} strokeWidth={4} />
          <circle cx={STEEL_X1} cy={steelY} r={11} fill={COLORS.steel} stroke={COLORS.bg} strokeWidth={4} />
        </g>

        {/* 스냅 링 */}
        {frame >= T.snap ? (
          <g opacity={1 - ringP} fill="none" stroke={COLORS.neon} strokeWidth={3}>
            <circle cx={STRIP_X0} cy={STRIP_Y} r={12 + 46 * ringP} />
            <circle cx={STEEL_X1} cy={STRIP_Y} r={12 + 46 * ringP} />
          </g>
        ) : null}
      </svg>

      {/* 시안 라벨 (막대 위) */}
      <div
        style={{
          position: "absolute",
          left: STRIP_X0,
          top: STRIP_Y - 112,
          opacity: cyanLabelO,
          transform: `translateY(${(1 - cyanLabelO) * 12}px)`,
          fontFamily: FONTS.display,
          fontSize: 50,
          color: COLORS.neon,
          textShadow: `0 0 18px ${COLORS.neon}66`,
        }}
      >
        더 라인
      </div>
      <div
        style={{
          position: "absolute",
          right: W - STRIP_X1,
          top: STRIP_Y - 108,
          opacity: cyanLabelO,
          transform: `translateY(${(1 - cyanLabelO) * 12}px)`,
          fontFamily: FONTS.num,
          fontWeight: 700,
          fontSize: 50,
          color: COLORS.neon,
          textShadow: `0 0 18px ${COLORS.neon}66`,
        }}
      >
        170<span style={{ fontSize: 34, marginLeft: 6 }}>km</span>
      </div>

      {/* 강철색 라벨 (점선 아래, 함께 이동) */}
      <div
        style={{
          position: "absolute",
          left: STRIP_X0,
          top: steelY + 54,
          opacity: steelO,
          transform: `translateX(${steelDx}px)`,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 40,
          color: COLORS.steel,
        }}
      >
        서울
      </div>
      <div
        style={{
          position: "absolute",
          right: W - STEEL_X1 - 6,
          top: steelY + 54,
          opacity: steelO,
          transform: `translateX(${steelDx}px)`,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 40,
          color: COLORS.steel,
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          whiteSpace: "nowrap",
        }}
      >
        <span>강릉 · 직선</span>
        <span style={{ fontFamily: FONTS.num, fontSize: 42 }}>
          168<span style={{ fontSize: 30, marginLeft: 4 }}>km</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─── B: 높이 비교 ─────────────────────────────────────────
const burjPath = (c: number, b: number, h: number): string => {
  const pts: [number, number][] = [
    [-56, 0],
    [-56, 0.22],
    [-42, 0.22],
    [-42, 0.42],
    [-30, 0.42],
    [-30, 0.6],
    [-19, 0.6],
    [-19, 0.74],
    [-9, 0.74],
    [-4, 0.88],
    [-1.5, 0.88],
    [0, 1],
  ];
  const left = pts.map(([dx, fy]) => `${c + dx},${b - fy * h}`);
  const right = pts
    .slice(0, -1)
    .reverse()
    .map(([dx, fy]) => `${c - dx},${b - fy * h}`);
  return `M${[...left, ...right].join(" L")} Z`;
};

const lottePath = (c: number, b: number, h: number): string =>
  [
    `M${c - 46},${b}`,
    `Q${c - 44},${b - h * 0.55} ${c - 17},${b - h * 0.92}`,
    `L${c - 5},${b - h}`,
    `L${c + 5},${b - h}`,
    `L${c + 17},${b - h * 0.92}`,
    `Q${c + 44},${b - h * 0.55} ${c + 46},${b}`,
    "Z",
  ].join(" ");

/** 비스듬한 깊이축으로 오른쪽 화면 밖까지 이어지는 거울 벽 */
const Wall: React.FC<{ x0: number; h: number; opacity?: number; front?: boolean }> = ({ x0, h, opacity = 1, front = true }) => {
  const x1 = x0 + WALL_T;
  const L = W + 320 - x1;
  const y0 = BASE_Y;
  const top = y0 - h;
  const side = `M${x1},${y0} L${x1},${top} L${x1 + L},${top + K * L} L${x1 + L},${y0 + K * L} Z`;
  const topFace = `M${x0},${top} L${x1},${top} L${x1 + L},${top + K * L} L${x0 + L},${top + K * L} Z`;
  // 거울 외벽의 층 줄(깊이축과 평행) — 몇 줄만
  const bands = [0.2, 0.4, 0.6, 0.8].map((f) => top + h * f);
  return (
    <g opacity={opacity}>
      <path d={side} fill="url(#s03-mirror)" stroke={COLORS.neon} strokeOpacity={0.55} strokeWidth={1.5} />
      {h > 4
        ? bands.map((y, i) => (
            <line key={i} x1={x1} y1={y} x2={x1 + L} y2={y + K * L} stroke={COLORS.mirror} strokeOpacity={0.14} strokeWidth={1} />
          ))
        : null}
      <path d={topFace} fill={COLORS.neon} fillOpacity={0.35} />
      <rect x={x0} y={top} width={WALL_T} height={h} fill="url(#s03-front)" />
      {front ? <line x1={x0} y1={top} x2={x1} y2={top} stroke={COLORS.ink} strokeWidth={2} strokeOpacity={0.9} /> : null}
    </g>
  );
};

const NumLabel: React.FC<{
  x: number;
  y: number;
  value: number;
  color: string;
  size?: number;
  opacity: number;
  glowColor?: string;
}> = ({ x, y, value, color, size = 40, opacity, glowColor }) => (
  <div
    style={{
      position: "absolute",
      left: x - 200,
      width: 400,
      top: y - size * 1.3,
      textAlign: "center",
      opacity,
      fontFamily: FONTS.num,
      fontWeight: 700,
      fontSize: size,
      color,
      fontVariantNumeric: "tabular-nums",
      textShadow: glowColor ? `0 0 16px ${glowColor}88` : "0 2px 6px rgba(0,0,0,0.8)",
      whiteSpace: "nowrap",
    }}
  >
    {Math.round(value)}
    <span style={{ fontSize: size * 0.7, marginLeft: 6 }}>m</span>
  </div>
);

const NameLabel: React.FC<{ x: number; text: string; color: string; opacity: number }> = ({ x, text, color, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - 200,
      width: 400,
      top: BASE_Y + 20,
      textAlign: "center",
      opacity,
      fontFamily: FONTS.body,
      fontWeight: 700,
      fontSize: 35,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

const Heights: React.FC = () => {
  const frame = useCurrentFrame();
  const inO = progress(frame, T.baseIn, T.baseIn + 14);
  if (inO <= 0) return null;

  const baseP = progress(frame, T.baseIn, T.baseIn + 22, Easing.inOut(Easing.cubic));
  const gp = (s: number) => progress(frame, s, s + T.grow, Easing.out(Easing.cubic));
  const burjP = gp(T.burj);
  const lotteP = gp(T.lotte);
  const lineP = gp(T.line);

  const burjH = 828 * PX_PER_M * burjP;
  const lotteH = 555 * PX_PER_M * lotteP;
  const lineH = 500 * PX_PER_M * lineP;
  const lineTop = BASE_Y - 500 * PX_PER_M;

  const labelO = (s: number) => progress(frame, s + 4, s + 16);

  // 복제: 두 번째 벽이 오른쪽으로 밀려 나와 마주 섬
  const dupP = progress(frame, T.dup, T.dup + 18, Easing.inOut(Easing.cubic));
  const dupO = progress(frame, T.dup, T.dup + 6);
  const bX0 = WALL_X0 + (WALL_T + GAP_PX) * dupP;
  const gapO = progress(frame, T.dup + 12, T.dup + 26);
  const refO = progress(frame, T.lotte + T.grow - 6, T.lotte + T.grow + 10) * 0.8;

  // 벽 옆면에 쓰인 '더 라인 →' (가장 바깥 벽 면을 따라감)
  const faceX = (dupO > 0 ? bX0 : WALL_X0) + WALL_T + 90;
  const faceTextO = progress(frame, T.line + 18, T.line + 32);

  const gapX0 = WALL_X0 + WALL_T;
  const gapX1 = gapX0 + GAP_PX;

  return (
    <AbsoluteFill style={{ opacity: inO }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="s03-mirror" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={COLORS.neon} stopOpacity={0.5} />
            <stop offset="0.45" stopColor={COLORS.mirror} stopOpacity={0.18} />
            <stop offset="1" stopColor={COLORS.neon2} stopOpacity={0.28} />
          </linearGradient>
          <linearGradient id="s03-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.ink} stopOpacity={0.95} />
            <stop offset="1" stopColor={COLORS.neon} stopOpacity={0.9} />
          </linearGradient>
          <filter id="s03-wall-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={12} />
          </filter>
        </defs>

        {/* 기준선 */}
        <line
          x1={960 - 840 * baseP}
          x2={960 + 840 * baseP}
          y1={BASE_Y}
          y2={BASE_Y}
          stroke={COLORS.muted}
          strokeOpacity={0.45}
          strokeWidth={2}
        />

        {/* 부르즈 할리파 (흐린 강철) */}
        {burjH > 0.5 ? <path d={burjPath(BURJ_X, BASE_Y, burjH)} fill={COLORS.steel} fillOpacity={0.32} stroke={COLORS.steel} strokeOpacity={0.45} strokeWidth={1.5} /> : null}

        {/* 롯데월드타워 (강철) */}
        {lotteH > 0.5 ? (
          <g>
            <path d={lottePath(LOTTE_X, BASE_Y, lotteH)} fill={COLORS.steel} fillOpacity={0.85} />
            <line x1={LOTTE_X} x2={LOTTE_X} y1={BASE_Y} y2={BASE_Y - lotteH * 0.97} stroke={COLORS.bg} strokeOpacity={0.35} strokeWidth={2} />
          </g>
        ) : null}

        {/* 500m 기준 점선: 롯데월드타워가 55m 더 높다 */}
        <line
          x1={LOTTE_X - 60}
          x2={WALL_X0 - 6}
          y1={lineTop}
          y2={lineTop}
          stroke={COLORS.neon}
          strokeOpacity={0.55 * refO}
          strokeWidth={2}
          strokeDasharray="8 8"
        />

        {/* 더 라인 벽 — 글로우 1겹 */}
        {lineH > 0.5 ? (
          <>
            <rect x={WALL_X0 - 4} y={BASE_Y - lineH} width={WALL_T + 8} height={lineH} fill={COLORS.neon} opacity={0.5} filter="url(#s03-wall-glow)" />
            <Wall x0={WALL_X0} h={lineH} />
            {dupO > 0 ? <Wall x0={bX0} h={lineH} opacity={dupO} /> : null}
          </>
        ) : null}

        {/* 간격 200m 치수선 */}
        <g opacity={gapO} stroke={COLORS.neon} strokeWidth={2}>
          <line x1={gapX0 + 4} x2={gapX1 - 4} y1={BASE_Y + 22} y2={BASE_Y + 22} />
          <line x1={gapX0 + 4} x2={gapX0 + 4} y1={BASE_Y + 12} y2={BASE_Y + 32} />
          <line x1={gapX1 - 4} x2={gapX1 - 4} y1={BASE_Y + 12} y2={BASE_Y + 32} />
          <path d={`M${gapX0 + 4},${BASE_Y + 22} l12,-7 l0,14 Z M${gapX1 - 4},${BASE_Y + 22} l-12,-7 l0,14 Z`} fill={COLORS.neon} stroke="none" />
        </g>
      </svg>

      {/* 벽 옆면 글자 — 깊이축을 따라 기울임 */}
      <div
        style={{
          position: "absolute",
          left: faceX,
          top: BASE_Y - lineH * 0.5 + K * (faceX - WALL_X0 - WALL_T) - 30,
          opacity: faceTextO * 0.9,
          transform: `skewY(${(Math.atan(K) * 180) / Math.PI}deg)`,
          transformOrigin: "left center",
          fontFamily: FONTS.display,
          fontSize: 46,
          color: COLORS.ink,
          letterSpacing: 2,
          textShadow: `0 0 18px ${COLORS.neon}`,
          whiteSpace: "nowrap",
        }}
      >
        더 라인 <span style={{ fontFamily: FONTS.num, fontSize: 34, color: COLORS.neon }}>→ 170km</span>
      </div>

      {/* 높이 라벨 (카운트업) */}
      <NumLabel x={BURJ_X} y={BASE_Y - burjH - 14} value={828 * burjP} color={COLORS.steel} opacity={labelO(T.burj) * 0.88} />
      <NumLabel x={LOTTE_X} y={BASE_Y - lotteH - 14} value={555 * lotteP} color={COLORS.steel} opacity={labelO(T.lotte)} />
      <NumLabel
        x={WALL_X0 + WALL_T / 2}
        y={BASE_Y - lineH - 14}
        value={500 * lineP}
        color={COLORS.neon}
        size={44}
        opacity={labelO(T.line)}
        glowColor={COLORS.neon}
      />

      {/* 이름 */}
      <NameLabel x={BURJ_X} text="부르즈 할리파" color={COLORS.steel} opacity={labelO(T.burj) * 0.85} />
      <NameLabel x={LOTTE_X} text="롯데월드타워" color={COLORS.steel} opacity={labelO(T.lotte)} />
      <div
        style={{
          position: "absolute",
          left: (gapX0 + gapX1) / 2 - 200,
          width: 400,
          top: BASE_Y + 36,
          textAlign: "center",
          opacity: gapO,
          transform: `translateY(${(1 - gapO) * 10}px)`,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 32,
          color: COLORS.neon,
          whiteSpace: "nowrap",
        }}
      >
        간격 <span style={{ fontFamily: FONTS.num, fontSize: 32 }}>200</span>
        <span style={{ fontFamily: FONTS.num, fontSize: 24, marginLeft: 3 }}>m</span>
      </div>
    </AbsoluteFill>
  );
};

export const S03KoreaScale: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // whoosh push: 오른쪽에서 밀려 들어와 → 끝에서 왼쪽으로 밀려 나감
  const pushIn = progress(frame, 0, 10, Easing.out(Easing.cubic));
  const pushOut = progress(frame, T.pushOut, durationInFrames, Easing.in(Easing.cubic));
  const tx = (1 - pushIn) * 90 - pushOut * 180;
  const contentO = Math.min(0.4 + 0.6 * pushIn, 1 - pushOut);
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.025]);

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <Grid />
      <AbsoluteFill style={{ opacity: contentO, transform: `translateX(${tx}px)` }}>
        <AbsoluteFill style={{ transform: `scale(${drift})`, transformOrigin: "60% 55%" }}>
          <Strip />
          <Heights />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* 자막 대비용 하단 밴드 */}
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 16%, rgba(0,0,0,0) 26%)" }} />

      {/* 줄마다 별도 Caption — 같은 하단 앵커에서 교차 페이드 (한 Caption에 넣으면 겹침 구간에 L1이 위로 튐) */}
      <Caption lines={[{ text: "길이는 **서울~강릉** 직선거리", from: 0.2, to: 3.05 }]} accent={COLORS.steel} />
      <Caption lines={[{ text: "**롯데월드타워급** 벽이 두 줄", from: 3.15, to: 6.2 }]} accent={COLORS.steel} />

      <Grain />
      <Vignette strength={0.6} />
      <DreamLetterBox />
      <DisclaimerTag start={-12} />
      <SourceTag label="계산" text="서울시청~강릉시청 직선거리 (도로 거리 아님)" start={T.snap - 14} end={T.stripGone} />
      <SourceTag label="출처" text="높이: 브리태니커" start={T.stripGone} end={durationInFrames + 10} />
    </SceneFrame>
  );
};
