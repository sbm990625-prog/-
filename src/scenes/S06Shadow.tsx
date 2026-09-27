import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { progress } from "../utils/anim";
import { Caption, DisclaimerTag, DreamLetterBox, ExperimentChip, Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s06-shadow — 실험 3 · 협곡의 햇빛. 36.0s → 42.6s (198 frames), 장면 기준 0~6.6s.
 *
 * 1) 0.0–3.0s  두 500m 벽 / 200m 간격 단면(시안 와이어프레임). 태양이 호를 그리며 떠올라 고도 38.5°(동지 정오)에 고정.
 *              남쪽 벽 그림자 쐐기가 간격을 가로질러 북쪽 벽까지 → 치수 '그림자 629m', 브래킷 '간격 200m의 3배'.
 * 2) 3.0–6.6s  하단 1~12월 연간 띠: 4월 7일–9월 5일 만 따뜻하게 켜지고 나머지는 어두운 회색, 카운터 214일 (계산).
 *
 * 계산: 북위 28.1°, 동지 정오 고도 = 90 − 28.1 − 23.44 ≈ 38.5°. 500 ÷ tan 38.5° ≈ 629m.
 * 바닥에 정오 직사광 → 고도 ≥ atan(500/200) = 68.2° → 적위 ≥ 6.3° → 4월 7일 ~ 9월 5일 (151일), 나머지 214일.
 */

// ── 단면 기하 (px) ─────────────────────────────────────────────
const PX_PER_M = 0.66;
const WALL_M = 500;
const GAP_M = 200;
const H = WALL_M * PX_PER_M; // 330
const G = GAP_M * PX_PER_M; // 132
const WALL_T = 36; // 벽 두께 (시각용)
const L = 860; // 남쪽 벽 안쪽 면 x
const R = L + G; // 북쪽 벽 안쪽 면 x
const BASE = 562; // 지면 y
const TOP = BASE - H; // 벽 윗면 y
const FINAL_EL = 38.5;
const SHADOW_M = 629;
const SHADOW_PX = WALL_M / Math.tan((FINAL_EL * Math.PI) / 180) * PX_PER_M; // ≈ 415
const SUN_DIST = 124; // 헤더/레터박스에서 떨어지도록 낮춤
const ANG_R = 82; // 고도각 호 반지름
const SUN_R = 14; // 태양 원반 (지름 28px)
const SUN_HALO = 60;
// 200m 라벨 주위 광선 마스크 박스 (12px 여유)
const LBL200 = { x: 876 - 12, y: 168 - 12, w: 100 + 24, h: 30 + 24 };

const SUN = "#ffd27a";
const SUN_DISC = COLORS.amber; // #FFB347
const SHADOW_FILL = "#6e6250"; // 앰버-회색
const SHADOW_LINE = "#c9ad86";

// ── 연간 띠 ───────────────────────────────────────────────────
const STRIP_X = 420;
const STRIP_W = 960;
const STRIP_Y = 752;
const STRIP_H = 36;
const LIT_START = 96; // 4월 7일 (0-based day of year)
const LIT_END = 247; // 9월 5일까지 (exclusive 경계) → 켜진 151일, 나머지 214일
const DARK_DAYS = 214;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const dayX = (d: number) => STRIP_X + (STRIP_W * d) / 365;

// ── 타이밍 (프레임, 장면 기준) ──────────────────────────────────
const F_SUN0 = 14;
const F_LOCK = 52;
const F_DIM0 = 56;
const F_DIM1 = 80;
const F_BR = [70, 76, 82];
const F_BR_TXT = 86;
const F_STRIP = 90;
const F_SWEEP0 = 100;
const F_SWEEP1 = 156;

const rad = (d: number) => (d * Math.PI) / 180;

/** 벽 안쪽의 층 선 (와이어프레임) — 정적 */
const WallLines: React.FC<{ x: number }> = ({ x }) => {
  const lines = useMemo(() => Array.from({ length: 19 }, (_, i) => TOP + ((i + 1) * H) / 20), []);
  return (
    <g>
      {lines.map((y, i) => (
        <line key={i} x1={x + 4} x2={x + WALL_T - 4} y1={y} y2={y} stroke={COLORS.neon} strokeOpacity={i % 4 === 3 ? 0.32 : 0.12} strokeWidth={1} />
      ))}
    </g>
  );
};

/** 측정 그리드 배경 — 정적 */
const MeasureGrid: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `linear-gradient(${COLORS.neon}14 1px, transparent 1px), linear-gradient(90deg, ${COLORS.neon}14 1px, transparent 1px), linear-gradient(${COLORS.neon}08 1px, transparent 1px), linear-gradient(90deg, ${COLORS.neon}08 1px, transparent 1px)`,
      backgroundSize: "240px 240px, 240px 240px, 48px 48px, 48px 48px",
      backgroundPosition: "0 10px, 0 10px, 0 10px, 0 10px",
    }}
  />
);

const Canyon: React.FC<{ frame: number }> = ({ frame }) => {
  // 벽이 선으로 그려짐
  const draw = progress(frame, -10, 20, Easing.inOut(Easing.cubic));
  const wallFill = progress(frame, -4, 22);
  const wallPerim = 2 * (H + WALL_T);

  // 태양: 10° → 38.5° 호를 그리며 떠올라 고정
  const el = interpolate(frame, [F_SUN0, F_LOCK], [10, FINAL_EL], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const sunIn = progress(frame, F_SUN0 - 4, F_SUN0 + 12);
  const r = rad(el);
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const tan = Math.tan(r);
  const sunX = L - SUN_DIST * cos;
  const sunY = TOP - SUN_DIST * sin;
  const locked = frame >= F_LOCK;
  const lockPulse = locked ? progress(frame, F_LOCK, F_LOCK + 22) : 0;

  // 그림자 경계가 북쪽 벽에 닿는 높이
  const hitY = Math.min(BASE, TOP + G * tan);
  const shadowIn = progress(frame, F_SUN0 + 2, F_SUN0 + 22);

  // 평행 광선 (협곡 개구부를 통과)
  const rays = Array.from({ length: 6 }, (_, i) => {
    const ex = L + ((i + 0.5) / 6) * G;
    const t = Math.min((R - ex) / cos, (BASE - TOP) / sin);
    return { x1: ex - cos * 300, y1: TOP - sin * 300, x2: ex + cos * t, y2: TOP + sin * t };
  });

  // 태양 궤적 호 (0° → 현재 고도)
  const arcPts = Array.from({ length: 16 }, (_, i) => {
    const a = rad((el * i) / 15);
    return `${(L - SUN_DIST * Math.cos(a)).toFixed(1)},${(TOP - SUN_DIST * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  const angArc = Array.from({ length: 12 }, (_, i) => {
    const a = rad((el * i) / 11);
    return `${(L - ANG_R * Math.cos(a)).toFixed(1)},${(TOP - ANG_R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

  // 그림자 629m 치수선 + 유령 투영
  const dimP = progress(frame, F_DIM0, F_DIM1, Easing.inOut(Easing.cubic));
  const dimEnd = L + SHADOW_PX * dimP;
  const ghostEndX = L + SHADOW_PX; // 벽이 없다면 그림자가 끝나는 곳
  const ghostP = progress(frame, F_DIM0, F_DIM1 - 4, Easing.out(Easing.cubic));
  const ghostX = R + (ghostEndX - R) * ghostP;
  const ghostY = hitY + (BASE - hitY) * ghostP;
  const shadowLabel = progress(frame, F_DIM1 - 8, F_DIM1 + 6);

  // 간격 200m × 3 브래킷
  const brO = F_BR.map((f) => progress(frame, f, f + 8));
  const brTxt = progress(frame, F_BR_TXT, F_BR_TXT + 12);
  // 연간 띠가 들어오면 윗부분은 살짝 물러난다
  const recede = 1 - 0.25 * progress(frame, F_STRIP, F_STRIP + 20);

  const labelO = progress(frame, 14, 30);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="s06-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#141a3e" />
          <stop offset="1" stopColor="#0a0e26" />
        </linearGradient>
        <linearGradient id="s06-lit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SUN} stopOpacity={0.34} />
          <stop offset="1" stopColor={SUN} stopOpacity={0.08} />
        </linearGradient>
        <radialGradient id="s06-sunhalo">
          <stop offset="0" stopColor={SUN_DISC} stopOpacity={0.25} />
          <stop offset="0.6" stopColor={SUN_DISC} stopOpacity={0.12} />
          <stop offset="1" stopColor={SUN_DISC} stopOpacity={0} />
        </radialGradient>
        <mask id="s06-raymask" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect x={0} y={0} width={1920} height={1080} fill="#fff" />
          <rect x={LBL200.x} y={LBL200.y} width={LBL200.w} height={LBL200.h} rx={6} fill="#000" />
        </mask>
        <pattern id="s06-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <line x1="0" y1="0" x2="0" y2="14" stroke={SHADOW_LINE} strokeOpacity={0.22} strokeWidth={2} />
        </pattern>
      </defs>

      <g opacity={recede}>
        {/* 지면 */}
        <line x1={380} x2={1600} y1={BASE} y2={BASE} stroke={COLORS.sand} strokeOpacity={0.45 * draw} strokeWidth={2} />
        <text x={392} y={BASE - 16} fill={COLORS.muted} opacity={labelO * 0.8} fontFamily={FONTS.body} fontWeight={700} fontSize={28}>
          남 <tspan fontFamily={FONTS.num} fontSize={28}>S</tspan>
        </text>
        <text x={1588} y={BASE - 16} textAnchor="end" fill={COLORS.muted} opacity={labelO * 0.8} fontFamily={FONTS.body} fontWeight={700} fontSize={28}>
          북 <tspan fontFamily={FONTS.num} fontSize={28}>N</tspan>
        </text>

        {/* 태양 궤적과 각도 */}
        <polyline points={arcPts} fill="none" stroke={SUN} strokeOpacity={0.35 * sunIn} strokeWidth={2} strokeDasharray="3 9" strokeLinecap="round" />
        <line x1={L - SUN_DIST - 20} x2={L} y1={TOP} y2={TOP} stroke={COLORS.muted} strokeOpacity={0.45 * sunIn} strokeWidth={1.5} strokeDasharray="6 8" />
        <polyline points={angArc} fill="none" stroke={SUN} strokeOpacity={0.8 * sunIn} strokeWidth={2.5} />

        {/* 햇빛이 드는 부분 (그림자 경계 위) */}
        <polygon points={`${L},${TOP} ${R},${TOP} ${R},${hitY}`} fill="url(#s06-lit)" opacity={shadowIn} />
        <g mask="url(#s06-raymask)">
          {rays.map((ry, i) => (
            <line key={i} x1={ry.x1} y1={ry.y1} x2={ry.x2} y2={ry.y2} stroke={SUN} strokeOpacity={0.22 * sunIn} strokeWidth={1.5} />
          ))}
        </g>

        {/* 그림자 쐐기 */}
        <g opacity={shadowIn}>
          <polygon points={`${L},${TOP} ${L},${BASE} ${R},${BASE} ${R},${hitY}`} fill={SHADOW_FILL} fillOpacity={0.5} />
          <polygon points={`${L},${TOP} ${L},${BASE} ${R},${BASE} ${R},${hitY}`} fill="url(#s06-hatch)" />
        </g>
        {/* 북쪽 벽면의 빛 */}
        <line x1={R} x2={R} y1={TOP} y2={hitY} stroke={SUN} strokeOpacity={0.9 * shadowIn} strokeWidth={5} />

        {/* 벽 */}
        {[L - WALL_T, R].map((x) => (
          <g key={x}>
            <rect x={x} y={TOP} width={WALL_T} height={H} fill="url(#s06-wall)" opacity={wallFill} />
            <g opacity={wallFill}>
              <WallLines x={x} />
            </g>
            <rect
              x={x}
              y={TOP}
              width={WALL_T}
              height={H}
              fill="none"
              stroke={COLORS.neon}
              strokeWidth={2}
              strokeDasharray={wallPerim}
              strokeDashoffset={wallPerim * (1 - draw)}
              style={{ filter: `drop-shadow(0 0 6px ${COLORS.neon}88)` }}
            />
          </g>
        ))}

        {/* 그림자 경계선: 태양 → 남쪽 벽 윗모서리 → 북쪽 벽 */}
        <line x1={sunX} y1={sunY} x2={L} y2={TOP} stroke={SUN} strokeOpacity={0.6 * sunIn} strokeWidth={2} />
        <line x1={L} y1={TOP} x2={R} y2={hitY} stroke={SUN} strokeOpacity={0.9 * shadowIn} strokeWidth={2.5} strokeDasharray="10 7" />
        {/* 벽이 없었다면: 그림자가 629m 까지 */}
        {ghostP > 0 ? (
          <line x1={R + WALL_T * 0} y1={hitY} x2={ghostX} y2={ghostY} stroke={SHADOW_LINE} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="4 8" />
        ) : null}
        {ghostP > 0 ? (
          <polygon
            points={`${R + WALL_T},${Math.min(BASE, TOP + (G + WALL_T) * tan)} ${ghostEndX},${BASE} ${R + WALL_T},${BASE}`}
            fill={SHADOW_FILL}
            fillOpacity={0.16 * ghostP}
          />
        ) : null}

        {/* 태양 */}
        <g opacity={sunIn}>
          <circle cx={sunX} cy={sunY} r={SUN_HALO} fill="url(#s06-sunhalo)" />
          <circle cx={sunX} cy={sunY} r={SUN_R + 6} fill={SUN_DISC} fillOpacity={0.25} />
          <circle cx={sunX} cy={sunY} r={SUN_R} fill={SUN_DISC} style={{ filter: `drop-shadow(0 0 8px ${SUN_DISC})` }} />
          {locked ? (
            <circle cx={sunX} cy={sunY} r={SUN_R + 40 * lockPulse} fill="none" stroke={SUN} strokeOpacity={0.8 * (1 - lockPulse)} strokeWidth={2} />
          ) : null}
        </g>

        {/* 벽 치수: 500m / 200m */}
        <g opacity={labelO}>
          <line x1={R + WALL_T + 24} x2={R + WALL_T + 24} y1={TOP} y2={BASE} stroke={COLORS.neon} strokeOpacity={0.55} strokeWidth={1.5} />
          <line x1={R + WALL_T + 16} x2={R + WALL_T + 32} y1={TOP} y2={TOP} stroke={COLORS.neon} strokeOpacity={0.7} strokeWidth={1.5} />
          <line x1={R + WALL_T + 16} x2={R + WALL_T + 32} y1={BASE} y2={BASE} stroke={COLORS.neon} strokeOpacity={0.7} strokeWidth={1.5} />
          <text x={R + WALL_T + 40} y={TOP + 34} fill={COLORS.neon} fontFamily={FONTS.num} fontWeight={700} fontSize={28}>
            500m
          </text>
          <line x1={L} x2={R} y1={TOP - 26} y2={TOP - 26} stroke={COLORS.neon} strokeOpacity={0.55} strokeWidth={1.5} />
          <line x1={L} x2={L} y1={TOP - 34} y2={TOP - 18} stroke={COLORS.neon} strokeOpacity={0.7} strokeWidth={1.5} />
          <line x1={R} x2={R} y1={TOP - 34} y2={TOP - 18} stroke={COLORS.neon} strokeOpacity={0.7} strokeWidth={1.5} />
          <text x={(L + R) / 2} y={TOP - 40} textAnchor="middle" fill={COLORS.neon} fontFamily={FONTS.num} fontWeight={700} fontSize={28}>
            200m
          </text>
        </g>

        {/* 고도 판독 */}
        <g opacity={sunIn}>
          <text x={L - WALL_T - 36} y={TOP + 78} textAnchor="end" fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={700} fontSize={28}>
            태양고도
          </text>
          <text
            x={L - WALL_T - 36}
            y={TOP + 146}
            textAnchor="end"
            fill={locked ? COLORS.ink : "#e9dcc0"}
            fontFamily={FONTS.num}
            fontWeight={900}
            fontSize={64}
            style={{ textShadow: locked ? `0 0 ${24 * (1 - lockPulse) + 10}px ${SUN}88` : undefined }}
          >
            {el.toFixed(1)}°
          </text>
          <text
            x={L - WALL_T - 36}
            y={TOP + 194}
            textAnchor="end"
            fill={SUN}
            opacity={progress(frame, F_LOCK - 2, F_LOCK + 10)}
            fontFamily={FONTS.body}
            fontWeight={700}
            fontSize={30}
          >
            동지 정오
          </text>
        </g>

        {/* 그림자 629m 치수선 (지면 아래) */}
        {dimP > 0 ? (
          <g>
            <line x1={L} x2={dimEnd} y1={BASE + 24} y2={BASE + 24} stroke={SHADOW_LINE} strokeWidth={2.5} />
            <line x1={L} x2={L} y1={BASE + 14} y2={BASE + 34} stroke={SHADOW_LINE} strokeWidth={2.5} />
            <line x1={dimEnd} x2={dimEnd} y1={BASE + 14} y2={BASE + 34} stroke={SHADOW_LINE} strokeWidth={2.5} opacity={dimP} />
            <line x1={ghostEndX} x2={ghostEndX} y1={BASE} y2={BASE + 24} stroke={SHADOW_LINE} strokeOpacity={0.5 * dimP} strokeWidth={1.5} strokeDasharray="3 4" />
          </g>
        ) : null}
        {dimP > 0 ? (
          <g opacity={shadowLabel}>
            <text x={ghostEndX + 28} y={BASE - 92} fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={700} fontSize={28}>
              그림자
            </text>
            <text x={ghostEndX + 26} y={BASE - 30} fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={900} fontSize={60} style={{ textShadow: `0 0 18px ${SHADOW_LINE}55` }}>
              {Math.round(SHADOW_M * dimP)}
              <tspan fontSize={40}>m</tspan>
            </text>
            <text x={ghostEndX + 128} y={BASE - 92} fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={500} fontSize={28}>
              (계산)
            </text>
          </g>
        ) : null}

        {/* 간격 200m 의 3배 */}
        {F_BR.map((f, i) => {
          const x0 = L + i * G;
          const x1 = x0 + G;
          const o = brO[i];
          if (o <= 0) return null;
          const y = BASE + 46 + (1 - o) * 8;
          return (
            <g key={f} opacity={o}>
              <path
                d={`M ${x0 + 3} ${y} L ${x0 + 3} ${y + 10} L ${x1 - 3} ${y + 10} L ${x1 - 3} ${y}`}
                fill="none"
                stroke={i === 0 ? COLORS.neon : COLORS.neon2}
                strokeOpacity={i === 0 ? 0.9 : 0.85}
                strokeWidth={2}
              />
              <text x={(x0 + x1) / 2} y={y + 44} textAnchor="middle" fill={i === 0 ? COLORS.neon : "#b9a8ff"} fontFamily={FONTS.num} fontWeight={700} fontSize={30}>
                ×{i + 1}
              </text>
            </g>
          );
        })}
        <text
          x={L + 3 * G + 44}
          y={BASE + 90}
          opacity={brTxt}
          fill={COLORS.ink}
          fontFamily={FONTS.body}
          fontWeight={700}
          fontSize={32}
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
        >
          = 간격 <tspan fill={COLORS.neon}>200m</tspan>의 3배
        </text>
      </g>
    </svg>
  );
};

/** 1~12월 연간 띠: 4월 7일–9월 5일 만 켜지고 나머지는 어두운 회색, 214일 카운터 */
const YearStrip: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = progress(frame, F_STRIP, F_STRIP + 16);
  if (inP <= 0) return null;
  const sweep = interpolate(frame, [F_SWEEP0, F_SWEEP1], [0, 365], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const darkPassed = Math.min(sweep, LIT_START) + Math.max(0, sweep - LIT_END);
  const done = frame >= F_SWEEP1;
  const counter = done ? DARK_DAYS : Math.round((darkPassed / (365 - (LIT_END - LIT_START))) * DARK_DAYS);
  const litShown = Math.max(0, Math.min(sweep, LIT_END) - LIT_START);
  const litLabel = progress(frame, F_SWEEP0 + 26, F_SWEEP0 + 40);
  const doneP = progress(frame, F_SWEEP1 - 4, F_SWEEP1 + 14);

  let acc = 0;
  const monthStarts = MONTH_DAYS.map((d) => {
    const s = acc;
    acc += d;
    return s;
  });

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: inP, transform: `translateY(${(1 - inP) * 16}px)` }}>
      <defs>
        <linearGradient id="s06-litband" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="1" stopColor="#ffb347" />
        </linearGradient>
        <clipPath id="s06-strip-clip">
          <rect x={STRIP_X} y={STRIP_Y} width={STRIP_W} height={STRIP_H} rx={6} />
        </clipPath>
      </defs>
      {/* 빈 띠 */}
      <rect x={STRIP_X} y={STRIP_Y} width={STRIP_W} height={STRIP_H} rx={6} fill="#0d1024" stroke={COLORS.dim} strokeOpacity={0.7} strokeWidth={1.5} />
      <g clipPath="url(#s06-strip-clip)">
        {/* 어두운 회색 (정오에도 바닥 그늘) */}
        <rect x={STRIP_X} y={STRIP_Y} width={dayX(Math.min(sweep, LIT_START)) - STRIP_X} height={STRIP_H} fill="#3a3f4f" />
        {sweep > LIT_END ? <rect x={dayX(LIT_END)} y={STRIP_Y} width={dayX(sweep) - dayX(LIT_END)} height={STRIP_H} fill="#3a3f4f" /> : null}
        {/* 따뜻하게 켜짐 (4월 7일–9월 5일) */}
        {litShown > 0 ? (
          <rect
            x={dayX(LIT_START)}
            y={STRIP_Y}
            width={dayX(LIT_START + litShown) - dayX(LIT_START)}
            height={STRIP_H}
            fill="url(#s06-litband)"
            style={{ filter: `drop-shadow(0 0 10px ${SUN}aa)` }}
          />
        ) : null}
        {/* 월 경계 */}
        {monthStarts.slice(1).map((d) => (
          <line key={d} x1={dayX(d)} x2={dayX(d)} y1={STRIP_Y} y2={STRIP_Y + STRIP_H} stroke={COLORS.bg} strokeWidth={2} />
        ))}
      </g>
      {/* 재생 헤드 */}
      {!done && sweep > 0 ? <line x1={dayX(sweep)} x2={dayX(sweep)} y1={STRIP_Y - 8} y2={STRIP_Y + STRIP_H + 8} stroke={COLORS.ink} strokeWidth={2} /> : null}
      {/* 월 숫자 */}
      {monthStarts.map((d, i) => {
        const lit = i >= 3 && i <= 8;
        return (
          <text
            key={i}
            x={dayX(d + MONTH_DAYS[i] / 2)}
            y={STRIP_Y + STRIP_H + 34}
            textAnchor="middle"
            fill={lit ? "#e7d3a8" : COLORS.muted}
            fillOpacity={lit ? 0.95 : 0.8}
            fontFamily={FONTS.body}
            fontWeight={700}
            fontSize={28}
          >
            {i + 1}
          </text>
        );
      })}
      <text x={STRIP_X - 18} y={STRIP_Y + STRIP_H + 34} textAnchor="end" fill={COLORS.muted} fillOpacity={0.8} fontFamily={FONTS.body} fontWeight={700} fontSize={28}>
        월
      </text>
      {/* 4월 7일 – 9월 5일 */}
      <g opacity={litLabel}>
        <line x1={dayX(LIT_START)} x2={dayX(LIT_START)} y1={STRIP_Y - 22} y2={STRIP_Y - 4} stroke={SUN} strokeWidth={1.5} />
        <line x1={dayX(LIT_END)} x2={dayX(LIT_END)} y1={STRIP_Y - 22} y2={STRIP_Y - 4} stroke={SUN} strokeWidth={1.5} />
        <line x1={dayX(LIT_START)} x2={(dayX(LIT_START) + dayX(LIT_END)) / 2 - 138} y1={STRIP_Y - 13} y2={STRIP_Y - 13} stroke={SUN} strokeOpacity={0.5} strokeWidth={1.5} />
        <line x1={(dayX(LIT_START) + dayX(LIT_END)) / 2 + 138} x2={dayX(LIT_END)} y1={STRIP_Y - 13} y2={STRIP_Y - 13} stroke={SUN} strokeOpacity={0.5} strokeWidth={1.5} />
        <text x={(dayX(LIT_START) + dayX(LIT_END)) / 2} y={STRIP_Y - 17} textAnchor="middle" fill={SUN} fontFamily={FONTS.body} fontWeight={700} fontSize={30}>
          4월 7일 – 9월 5일
        </text>
      </g>
      {/* 카운터 */}
      <text x={STRIP_X + STRIP_W + 44} y={STRIP_Y - 6} fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={700} fontSize={28}>
        한낮 그늘
      </text>
      <text
        x={STRIP_X + STRIP_W + 40}
        y={STRIP_Y + STRIP_H + 20}
        fill={COLORS.ink}
        fontFamily={FONTS.num}
        fontWeight={900}
        fontSize={64}
        style={{ textShadow: doneP > 0 ? `0 0 ${16 * doneP}px rgba(244,246,255,0.35)` : undefined }}
      >
        {counter}
        <tspan fontFamily={FONTS.body} fontWeight={700} fontSize={40} dx={6}>
          일
        </tspan>
        <tspan fontFamily={FONTS.body} fontWeight={500} fontSize={28} fill={COLORS.muted} dx={10}>
          (계산)
        </tspan>
      </text>
    </svg>
  );
};

export const S06Shadow: React.FC = () => {
  const frame = useCurrentFrame();
  // 이전 장면의 휘익 푸시를 받는 짧은 진입 + 느린 카메라 드리프트
  const push = progress(frame, 0, 18, Easing.out(Easing.cubic));
  const drift = interpolate(frame, [0, 198], [1, 1.025]);

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      {/* 황혼 하늘: 오프블랙 + 태양 쪽 따뜻한 번짐 + 수평선 보라 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 560px at 700px 170px, rgba(255,154,106,0.13), rgba(255,154,106,0) 70%), linear-gradient(180deg, ${COLORS.bg} 0%, #0a0a1f 45%, #16122e 62%, ${COLORS.bg} 78%)`,
        }}
      />
      <MeasureGrid opacity={0.9} />
      <AbsoluteFill style={{ transform: `translateX(${(1 - push) * 70}px) scale(${drift})`, transformOrigin: "960px 470px" }}>
        <Canyon frame={frame} />
      </AbsoluteFill>
      <YearStrip frame={frame} />

      <Grain />
      <Vignette strength={0.6} />
      <DreamLetterBox />
      <ExperimentChip index="실험 3" title="협곡의 햇빛" start={-6} end={100000} />
      <DisclaimerTag start={-12} />
      {/* 두 번째 줄은 핸드오프(+10프레임) 동안에도 선명하게 남도록 to 를 장면 끝 너머로 둔다. 연속된 두 줄은 따로 렌더해 같은 자리에서 교차 페이드 (한 Caption 안에선 다음 줄이 미리 자리를 차지해 윗줄이 튄다) */}
      <Caption lines={[{ text: "겨울 정오, 벽 그림자 629m (계산)", from: 0.2, to: 3.0 }]} />
      <Caption lines={[{ text: "한낮 해가 안 드는 날 214일 (계산)", from: 3.0, to: 7.3 }]} />
      <SourceTag label="계산" text="북위 28.1° · 벽 500m · 간격 200m · 동서축 이상화" position="bottomRight" start={10} />
      <SourceTag label="네옴 측" text="그늘은 공공 공간 냉방 설계 · 디진 2022.08" position="bottomLeft" start={96} />
    </SceneFrame>
  );
};
