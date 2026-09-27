import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, SAFE, WIDTH } from "../theme";
import { clamp01, easeInOutCubic, progress, sec } from "../utils/anim";
import {
  BigNumber,
  Caption,
  DisclaimerTag,
  DreamLetterBox,
  Grain,
  LineSection,
  SceneFrame,
  SourceTag,
  Vignette,
} from "../components";

/**
 * s02-premise — 사고실험의 규칙을 선언한다: 약속대로 100% 완공됐다고 가정.
 * 7.0s → 13.6s (198 frames). 장면 기준 시간 = 절대 시간 − 7.0.
 *
 *  0.0–3.1  측정 그리드 위 점선 단면 윤곽(200m×500m, 0프레임부터) 안으로 LineSection 이 솟고,
 *           오른쪽 높이 눈금자 옆 '높이 0→500m' 카운터, 1.5s 에 위쪽 '폭 200m' 치수선+라벨.
 *  3.1–3.4  카메라가 뒤로·위로 빠짐: 단면이 0.08 배로 줄며 홍해 쪽 선의 시작점으로 날아가
 *           그대로 빛의 선(남색 밤 사막 항공 뷰)이 되어 오른쪽으로 점화. 아래 '170 km' 치수 막대.
 *  3.1–6.6  왼쪽 위 날짜 칩 '2021 발표 → 2022 디자인 공개' (clip-path 로 텍스트와 함께 펼쳐짐).
 *  4.9–6.1  오른쪽 아래 BigNumber 0 → 9,000,000명 (1.2초) 후 정지.
 *  끝       자체 퇴장 없음 — Main 의 handoff(whoosh push)가 내용을 밀어낸다.
 */

// ── 타이밍 (장면 기준 프레임) ─────────────────────────────
const SCENE_LEN = 198; // 스토리보드 길이 (Main 에서는 handoff 로 +10 프레임)
const T_SECTION = 4; // 단면이 솟기 시작
const SECTION_DUR = 48;
const T_WIDTH = 45; // 폭 치수선 + '폭 200m' 라벨
const T_PULL = sec(3.1); // 93 — 카메라 빠짐 시작
const PULL_DUR = 40;
const FLY_DUR = 10; // 단면 → 선 시작점으로 줄어들며 이동
const T_DRAW = T_PULL + FLY_DUR; // 빛의 선 점화 (단면이 시작점에 닿는 순간)
const DRAW_DUR = 34;
const T_BAR = T_DRAW + 14; // 170km 치수 막대
const T_NUMBER = sec(4.9); // 147
const NUMBER_DUR = sec(1.2); // 36

// L3 는 11.7s 에 올라와 끝까지 유지 (to 를 장면 끝 너머로 — 자체 페이드 없음, handoff 가 밀어낸다)
const CAPTIONS = [
  { text: "약속대로 **100%** 완공됐다고 치자", from: 0.1, to: 3.1 },
  { text: "길이 **170km**, 높이 **500m**", from: 3.1, to: 4.7 },
  { text: "**900만 명**이 산다", from: 4.7, to: 7.6 },
];

// ── 단면 기하 ─────────────────────────────────────────────
const PPM = 1.1; // px / m
const SEC_W = 200 * PPM; // 220
const SEC_H = 500 * PPM; // 550
const SEC_CX = 860;
const SEC_BASE = 790;
const SEC_LEFT = SEC_CX - SEC_W / 2;
const SEC_TOP = SEC_BASE - SEC_H;
const SEC_MID_Y = SEC_BASE - SEC_H / 2;

// ── 항공 뷰 기하 (홍해 해안 → 내륙) ────────────────────────
const AX1 = 330;
const AY1 = 452;
const AX2 = 1610;
const AY2 = 382;

/** 옅은 시안 측정 그리드 (실험 노트 배경) */
const MeasureGrid: React.FC<{ opacity: number }> = ({ opacity }) => {
  const lines = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    const step = 60;
    for (let x = 0; x <= WIDTH; x += step) out.push({ x1: x, y1: 0, x2: x, y2: HEIGHT, major: x % 240 === 0 });
    for (let y = 0; y <= HEIGHT; y += step) out.push({ x1: 0, y1: y, x2: WIDTH, y2: y, major: y % 240 === 0 });
    return out;
  }, []);
  if (opacity <= 0.001) return null;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity }}>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={COLORS.neon}
          strokeOpacity={l.major ? 0.085 : 0.035}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};

/** 0프레임부터 보이는 점선 단면 윤곽 (설계도 — 벽이 이 안을 채우며 솟는다) */
const SectionOutline: React.FC<{ rise: number }> = ({ rise }) => (
  <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
    <rect
      x={SEC_LEFT}
      y={SEC_TOP}
      width={SEC_W}
      height={SEC_H}
      fill={COLORS.neon}
      fillOpacity={0.03}
      stroke={COLORS.neon}
      strokeOpacity={0.55 - 0.3 * rise}
      strokeWidth={2}
      strokeDasharray="10 8"
    />
    {/* 모서리 표식 */}
    {[
      [SEC_LEFT, SEC_TOP, 1, 1],
      [SEC_LEFT + SEC_W, SEC_TOP, -1, 1],
      [SEC_LEFT, SEC_BASE, 1, -1],
      [SEC_LEFT + SEC_W, SEC_BASE, -1, -1],
    ].map(([x, y, dx, dy], i) => (
      <path key={i} d={`M${x + dx * 22},${y} L${x},${y} L${x},${y + dy * 22}`} fill="none" stroke={COLORS.neon} strokeOpacity={0.8} strokeWidth={3} />
    ))}
  </svg>
);

/** 단면 오른쪽 높이 눈금자(+ '높이' 카운터) + 위쪽 폭 치수선 */
const SectionDims: React.FC<{ rise: number; widthP: number; frame: number }> = ({ rise, widthP, frame }) => {
  const rx = SEC_LEFT + SEC_W + 64;
  const tipY = SEC_BASE - SEC_H * rise;
  const meters = Math.round(500 * rise);
  const ticks = useMemo(() => Array.from({ length: 11 }, (_, i) => i * 50), []);
  const labelIn = progress(frame, T_SECTION, T_SECTION + 12);
  const topY = SEC_TOP - 46;
  const half = (SEC_W / 2) * widthP;
  const wLabel = progress(frame, T_WIDTH, T_WIDTH + 12);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {/* 높이 눈금자 */}
      <g opacity={labelIn}>
        <line x1={rx} y1={SEC_BASE} x2={rx} y2={tipY} stroke={COLORS.neon} strokeOpacity={0.75} strokeWidth={2} />
        {ticks.map((m) => {
          if (m > meters + 0.5) return null;
          const y = SEC_BASE - m * PPM;
          const major = m % 100 === 0;
          return (
            <line
              key={m}
              x1={rx - (major ? 14 : 8)}
              y1={y}
              x2={rx}
              y2={y}
              stroke={COLORS.neon}
              strokeOpacity={major ? 0.9 : 0.5}
              strokeWidth={2}
            />
          );
        })}
        {/* 끝 캡 */}
        <line x1={rx - 16} y1={tipY} x2={rx + 16} y2={tipY} stroke={COLORS.neon} strokeWidth={3} />
        {/* 높이 라벨 + 올라가는 값 (한 곳에서만 센다) */}
        <text x={rx + 30} y={SEC_MID_Y - 14} fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={700} fontSize={34}>
          높이
        </text>
        <text
          x={rx + 30}
          y={SEC_MID_Y + 48}
          fill={COLORS.neon}
          fontFamily={FONTS.num}
          fontWeight={900}
          fontSize={60}
          style={{ fontVariantNumeric: "tabular-nums", textShadow: `0 0 18px ${COLORS.neon}66` }}
        >
          {meters}m
        </text>
      </g>
      {/* 폭 치수선 */}
      {widthP > 0 ? (
        <g>
          <line x1={SEC_CX - half} y1={topY} x2={SEC_CX + half} y2={topY} stroke={COLORS.neon} strokeOpacity={0.75} strokeWidth={2} />
          <line x1={SEC_CX - half} y1={topY - 12} x2={SEC_CX - half} y2={topY + 12} stroke={COLORS.neon} strokeWidth={2} />
          <line x1={SEC_CX + half} y1={topY - 12} x2={SEC_CX + half} y2={topY + 12} stroke={COLORS.neon} strokeWidth={2} />
          {/* 벽까지 이어지는 보조선 */}
          <line x1={SEC_LEFT} y1={topY + 14} x2={SEC_LEFT} y2={SEC_TOP - 6} stroke={COLORS.neon} strokeOpacity={0.3 * widthP} strokeWidth={1} strokeDasharray="4 5" />
          <line x1={SEC_LEFT + SEC_W} y1={topY + 14} x2={SEC_LEFT + SEC_W} y2={SEC_TOP - 6} stroke={COLORS.neon} strokeOpacity={0.3 * widthP} strokeWidth={1} strokeDasharray="4 5" />
          <g opacity={wLabel} transform={`translate(0 ${(1 - wLabel) * 14})`}>
            <text x={SEC_CX - 8} y={topY - 24} textAnchor="end" fill={COLORS.muted} fontFamily={FONTS.body} fontWeight={700} fontSize={34}>
              폭
            </text>
            <text x={SEC_CX + 2} y={topY - 22} textAnchor="start" fill={COLORS.neon} fontFamily={FONTS.num} fontWeight={900} fontSize={48}>
              200m
            </text>
          </g>
        </g>
      ) : null}
    </svg>
  );
};

/** 로컬 항공 뷰: 남색 밤 사막(약속 구간의 시안 팔레트) + 홍해 + 170km 빛의 선. 선 머리 점은 점화 후에만. */
const NightAerial: React.FC<{ p: number }> = ({ p }) => {
  const ridges = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const y0 = 40 + i * 50;
        const amp = 14 + random(`s02-ra${i}`) * 22;
        const pts: string[] = [];
        const n = 30;
        for (let k = 0; k <= n; k++) {
          const u = k / n;
          const x = u * (WIDTH + 200) - 100;
          const y = y0 + amp * Math.sin(u * Math.PI * 2 * 1.7 + i * 5.1) + amp * 0.45 * Math.sin(u * Math.PI * 2 * 4.3 + i * 2.3);
          pts.push(`${k === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return { d: pts.join(" "), o: 0.05 + random(`s02-ro${i}`) * 0.08 };
      }),
    [],
  );
  const patches = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: random(`s02-px${i}`) * WIDTH,
        y: random(`s02-py${i}`) * HEIGHT,
        r: 200 + random(`s02-pr${i}`) * 320,
        o: 0.05 + random(`s02-po${i}`) * 0.07,
      })),
    [],
  );
  const ex = AX1 + (AX2 - AX1) * p;
  const ey = AY1 + (AY2 - AY1) * p;
  const coast = `M${AX1 - 150},-200 C${AX1 - 60},${HEIGHT * 0.25} ${AX1 - 230},${HEIGHT * 0.65} ${AX1 - 110},${HEIGHT + 200}`;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="s02-ground" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d1433" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
        <linearGradient id="s02-sea" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#020a18" />
          <stop offset="1" stopColor="#06213d" />
        </linearGradient>
        <radialGradient id="s02-patch">
          <stop offset="0" stopColor="#6f86d8" stopOpacity={1} />
          <stop offset="1" stopColor="#6f86d8" stopOpacity={0} />
        </radialGradient>
        <filter id="s02-aer-glow" filterUnits="userSpaceOnUse" x={-400} y={-400} width={WIDTH + 800} height={HEIGHT + 800}>
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <rect x={-400} y={-400} width={WIDTH + 800} height={HEIGHT + 800} fill="url(#s02-ground)" />
      {patches.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#s02-patch)" opacity={b.o} />
      ))}
      {/* 모래언덕 등고선 */}
      {ridges.map((r, i) => (
        <path key={i} d={r.d} fill="none" stroke="#000" strokeOpacity={r.o * 2} strokeWidth={2} />
      ))}
      {ridges.map((r, i) => (
        <path key={`l${i}`} d={r.d} fill="none" stroke="#9fb6ff" strokeOpacity={r.o * 0.8} strokeWidth={1} transform="translate(0,-3)" />
      ))}
      {/* 홍해 */}
      <path d={`M-400,-200 L${AX1 - 150},-200 ${coast.slice(coast.indexOf("C"))} L-400,${HEIGHT + 200} Z`} fill="url(#s02-sea)" />
      <path d={coast} fill="none" stroke={COLORS.neon} strokeOpacity={0.3} strokeWidth={3} />
      {/* 빛의 선 — 점화 전에는 아무것도 그리지 않는다 */}
      {p > 0 ? (
        <>
          <line x1={AX1} y1={AY1} x2={ex} y2={ey} stroke={COLORS.neon} strokeWidth={30} strokeOpacity={0.55} strokeLinecap="round" filter="url(#s02-aer-glow)" />
          <line x1={AX1} y1={AY1} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" />
          <circle cx={ex} cy={ey} r={9.6} fill="#ffffff" />
        </>
      ) : null}
    </svg>
  );
};

/** 단면 완성 후 거울 외벽을 타고 올라가는 한 줄기 반사광 */
const MirrorSheen: React.FC<{ frame: number }> = ({ frame }) => {
  const t = progress(frame, T_SECTION + SECTION_DUR + 4, T_SECTION + SECTION_DUR + 34, Easing.inOut(Easing.quad));
  if (t <= 0 || t >= 1) return null;
  const y = SEC_BASE - SEC_H * t;
  const o = Math.sin(Math.PI * t);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="s02-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[SEC_LEFT, SEC_LEFT + SEC_W].map((x) => (
        <rect key={x} x={x - 4} y={y - 70} width={8} height={140} fill="url(#s02-sheen)" opacity={o} />
      ))}
    </svg>
  );
};

/** 빛의 선 아래 평행한 '170 km' 치수 막대 */
const LengthBar: React.FC<{ p: number; labelP: number }> = ({ p, labelP }) => {
  const angle = (Math.atan2(AY2 - AY1, AX2 - AX1) * 180) / Math.PI;
  const len = Math.hypot(AX2 - AX1, AY2 - AY1);
  const off = 64; // 선 아래로
  const drawn = len * p;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${AX1} ${AY1}) rotate(${angle})`}>
        <g opacity={clamp01(p * 4)}>
          <line x1={0} y1={off} x2={drawn} y2={off} stroke={COLORS.neon} strokeOpacity={0.85} strokeWidth={2} />
          <line x1={0} y1={off - 14} x2={0} y2={off + 14} stroke={COLORS.neon} strokeWidth={3} />
          {p >= 0.999 ? <line x1={len} y1={off - 14} x2={len} y2={off + 14} stroke={COLORS.neon} strokeWidth={3} /> : null}
          {/* 보조선 */}
          <line x1={0} y1={14} x2={0} y2={off - 16} stroke={COLORS.neon} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="4 5" />
          {p >= 0.999 ? (
            <line x1={len} y1={14} x2={len} y2={off - 16} stroke={COLORS.neon} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="4 5" />
          ) : null}
        </g>
        <g opacity={labelP} transform={`translate(${len / 2} ${off + 70 - (1 - labelP) * -14})`}>
          <rect x={-150} y={-56} width={300} height={78} rx={10} fill="rgba(5,6,15,0.72)" stroke={`${COLORS.neon}44`} strokeWidth={1} />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fill={COLORS.neon}
            fontFamily={FONTS.num}
            fontWeight={900}
            fontSize={56}
            style={{ textShadow: `0 0 20px ${COLORS.neon}66` }}
          >
            170
            <tspan fill={COLORS.ink} fontSize={36} dx={12}>
              km
            </tspan>
          </text>
        </g>
      </g>
    </svg>
  );
};

/** 왼쪽 위 날짜 칩: '2021 발표 → 2022 디자인 공개' — 테두리째 왼쪽에서 오른쪽으로 펼쳐진다 */
const DateChip: React.FC<{ frame: number }> = ({ frame }) => {
  const p = progress(frame, T_PULL, T_PULL + 6);
  const wipe = progress(frame, T_PULL, T_PULL + 26, Easing.inOut(Easing.quad));
  if (p <= 0) return null;
  // 문장 속 숫자는 Noto Sans KR 700 (Orbitron 슬래시 0 금지)
  const num: React.CSSProperties = { fontFamily: FONTS.body, fontWeight: 700, fontSize: 38, color: COLORS.neon };
  const word: React.CSSProperties = { fontFamily: FONTS.body, fontWeight: 700, fontSize: 38, color: COLORS.ink };
  const clip = wipe >= 1 ? "inset(-40px -40px -40px -40px)" : `inset(-40px ${((1 - wipe) * 100).toFixed(2)}% -40px -40px)`;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x,
        top: SAFE.y + 40,
        opacity: p,
        clipPath: clip,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 22px 8px 18px",
        borderRadius: 10,
        background: "rgba(5,6,15,0.72)",
        border: `1px solid ${COLORS.neon}55`,
        boxShadow: `0 0 24px ${COLORS.neon}22`,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.neon, boxShadow: `0 0 10px ${COLORS.neon}` }} />
      <span style={num}>2021</span>
      <span style={word}>발표</span>
      <span style={{ ...word, color: COLORS.neon2 }}>→</span>
      <span style={num}>2022</span>
      <span style={word}>디자인 공개</span>
    </div>
  );
};

export const S02Premise: React.FC = () => {
  const frame = useCurrentFrame();

  // 장면 경계는 Main 의 handoff 가 관리한다: 0프레임부터 앵커(그리드+단면 윤곽)가 보이고, 자체 퇴장 없음.

  // ── 1막: 단면 ──
  const rise = progress(frame, T_SECTION, T_SECTION + SECTION_DUR, Easing.inOut(Easing.cubic));
  const widthP = progress(frame, T_WIDTH, T_WIDTH + 12, Easing.out(Easing.cubic));
  const dimsFade = 1 - progress(frame, T_PULL - 6, T_PULL + 3);
  // 카메라 빠짐: 단면이 0.08 배로 줄며 선의 시작점(홍해 해안)으로 날아가 그대로 선이 된다
  const fly = progress(frame, T_PULL, T_PULL + FLY_DUR, easeInOutCubic);
  const drift = interpolate(frame, [0, T_PULL], [1, 1.045], { extrapolateRight: "clamp" });
  const secSx = drift + (0.08 - drift) * fly;
  const secSy = drift + (0.05 - drift) * fly; // 위에서 내려다보면 벽이 눕는다 → 세로가 조금 더 납작
  const secDx = (AX1 - SEC_CX) * fly;
  const secDy = (AY1 - SEC_MID_Y) * fly;
  const secOpacity = 1 - progress(frame, T_DRAW - 2, T_DRAW + 5);

  // ── 2막: 항공 ──
  const aerialIn = progress(frame, T_PULL, T_PULL + FLY_DUR + 2);
  const aerialCam = progress(frame, T_PULL, T_PULL + PULL_DUR + 10, Easing.out(Easing.cubic));
  const aerialScale = 1.55 - 0.53 * aerialCam - 0.02 * progress(frame, T_PULL + PULL_DUR, SCENE_LEN + 10, Easing.linear);
  const aerialTilt = 24 * (1 - aerialCam);
  const lineP = progress(frame, T_DRAW, T_DRAW + DRAW_DUR);
  const barP = progress(frame, T_BAR, T_BAR + 22, Easing.inOut(Easing.cubic));
  const barLabel = progress(frame, T_BAR + 12, T_BAR + 26);
  // 착지 순간의 점광: 단면이 시작점에 닿을 때 정점 → 선 머리가 빠져나가며 사라짐
  const spark = interpolate(frame, [T_DRAW - 2, T_DRAW + 1, T_DRAW + 12], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const gridOpacity = 1 - 0.55 * aerialIn;

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <AbsoluteFill>
        {/* 항공 뷰 (남색 밤 사막 + 170km 빛의 선) — 뒤로·위로 빠지는 카메라 */}
        {aerialIn > 0 ? (
          <AbsoluteFill style={{ opacity: aerialIn, perspective: 1400, perspectiveOrigin: `${AX1}px ${AY1}px` }}>
            <AbsoluteFill
              style={{
                transformOrigin: `${AX1}px ${AY1}px`,
                transform: `rotateX(${aerialTilt}deg) scale(${aerialScale})`,
              }}
            >
              <NightAerial p={lineP} />
              <LengthBar p={barP} labelP={barLabel} />
            </AbsoluteFill>
          </AbsoluteFill>
        ) : null}

        <MeasureGrid opacity={gridOpacity} />

        {/* 단면 (줄어들며 선의 시작점으로) */}
        {secOpacity > 0 ? (
          <AbsoluteFill
            style={{
              opacity: secOpacity,
              transformOrigin: `${SEC_CX}px ${SEC_MID_Y}px`,
              transform: `translate(${secDx}px, ${secDy}px) scale(${secSx}, ${secSy})`,
            }}
          >
            {/* 보조 글로우 (바이올렛) — 단면 뒤에서 은은하게 */}
            <div
              style={{
                position: "absolute",
                left: SEC_CX - 420,
                top: SEC_MID_Y - 420,
                width: 840,
                height: 840,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${COLORS.neon2}33 0%, ${COLORS.neon2}00 65%)`,
                opacity: rise * (1 - fly),
              }}
            />
            {fly < 1 ? (
              <AbsoluteFill style={{ opacity: 1 - fly }}>
                <SectionOutline rise={rise} />
              </AbsoluteFill>
            ) : null}
            <LineSection cx={SEC_CX} baseY={SEC_BASE} pxPerMeter={PPM} reveal={rise} labels={false} color={COLORS.neon} />
            <MirrorSheen frame={frame} />
            {dimsFade > 0 ? (
              <AbsoluteFill style={{ opacity: dimsFade }}>
                <SectionDims rise={rise} widthP={widthP} frame={frame} />
              </AbsoluteFill>
            ) : null}
          </AbsoluteFill>
        ) : null}

        {spark > 0 ? (
          <div
            style={{
              position: "absolute",
              left: AX1 - 120,
              top: AY1 - 120,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffffff 0%, ${COLORS.neon} 14%, ${COLORS.neon}55 32%, ${COLORS.neon}00 68%)`,
              opacity: spark * 0.9,
              transform: `scale(${0.6 + 0.4 * spark})`,
            }}
          />
        ) : null}

        {/* 900만 명 */}
        <div style={{ position: "absolute", right: SAFE.x + 10, top: 610 }}>
          <BigNumber
            value={9000000}
            start={T_NUMBER}
            duration={NUMBER_DUR}
            unit="명"
            size={104}
            align="left"
            color={COLORS.neon}
          />
        </div>

        {/* 자막 가독성용 하단 어둠 띠 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 330,
            background: "linear-gradient(180deg, rgba(5,6,15,0) 0%, rgba(5,6,15,0.55) 55%, rgba(5,6,15,0.8) 100%)",
          }}
        />

        <DateChip frame={frame} />

        {/* 줄마다 별도 Caption: 앞 줄이 빠질 때 다음 줄이 위치를 바꾸며 튀지 않도록 */}
        {CAPTIONS.map((l) => (
          <Caption key={l.text} size={60} lines={[l]} />
        ))}
      </AbsoluteFill>

      <Grain />
      <Vignette strength={0.6} />
      <DreamLetterBox />
      <DisclaimerTag start={0} />
      <SourceTag text="네옴 발표 · 2021.01 / 2022.07" start={sec(1.2)} />
    </SceneFrame>
  );
};
