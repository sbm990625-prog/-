import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { progress, sec } from "../utils/anim";
import { Caption, DisclaimerTag, DreamLetterBox, ExperimentChip, Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s07-mirror-birds — 실험 4 · 거울 벽 (42.6s → 49.0s, 192 frames)
 *
 * 한낮의 거울 벽을 정면 와이드로 본다. 벽은 하늘·구름을 그대로 비춰 거의 보이지 않는다.
 *  A (0.2–3.0s)  서울 윤곽(강철색)이 거울면 위에 겹치고, 그 면적의 28%가 거울색(시안)으로 차오른다
 *                → 거울 170㎢ = 서울 605㎢의 28% (계산).
 *  B (3.0–6.4s)  V자 철새 편대가 오른쪽 위에서 반사된 하늘로 날아든다. 새와 거울 속 새(반사상)가
 *                서로 가까워지다 접촉 직전 프레임이 멈추고, 접촉 지점에 앰버 경고 링이 맥동한다.
 *                충돌은 보여주지 않는다 ('위험 가능성'이지 사건이 아님).
 * 끝: whoosh push (내용이 왼쪽으로 밀려나며 빠진다).
 */

// ── 레이아웃 ─────────────────────────────────────────────
const WALL_TOP = 300;
const WALL_BOTTOM = 790;
const REFL_HORIZON = 738; // 벽에 비친 지평선
const EXT = 480; // whoosh push 때 오른쪽 빈 띠가 보이지 않도록 배경을 더 넓게
const WW = WIDTH + EXT;

// ── 타이밍 (장면 기준 프레임) ────────────────────────────
const F = {
  outlineIn: 6,
  outlineDone: 30,
  seoulLabel: 16,
  fillStart: 28,
  fillEnd: 56,
  mirrorLabel: 50,
  diagramOut: 84, // 56→84: 완성된 도해를 약 1초 유지
  diagramGone: 96,
  birdsStart: 90,
  ribbon: 94,
  freeze: 150,
  push: 181,
};

// 새 편대가 향하는 접촉 지점 (벽 위, 반사된 구름 속)
const CONTACT = { x: 820, y: 470 };
const CAM = { x: 960, y: 540 };
const APPROACH = { x: 720, y: -70 }; // 벽에 닿기 전 세계 좌표 이동량
const U_AT_FREEZE = 0.92;

// ── 서울 윤곽 (단순화, 서→동 0..100, 북→남 0..82) ─────────
const SEOUL: [number, number][] = [
  [0, 36], [4, 33], [9, 34], [14, 30], [18, 26], [22, 20], [27, 17], [30, 11], [34, 9], [38, 13], [42, 14],
  [46, 10], [50, 11], [53, 5], [57, 1], [61, 2], [64, 7], [66, 12], [69, 15], [73, 17], [76, 24], [80, 27],
  [84, 30], [88, 36], [92, 38], [97, 40], [100, 46], [98, 52], [94, 56], [91, 62], [86, 66], [80, 68],
  [76, 74], [70, 77], [64, 80], [58, 78], [53, 82], [47, 80], [42, 82], [37, 78], [33, 72], [29, 70],
  [25, 66], [20, 62], [15, 56], [10, 52], [6, 46], [2, 42],
];
const HAN_RIVER: [number, number][] = [
  [100, 50], [92, 53], [84, 57], [76, 60], [68, 58], [60, 56], [52, 55], [45, 53], [38, 50], [30, 46], [22, 43], [14, 40], [6, 37], [0, 35],
];
const SEOUL_BOX = { x: 440, y: 360, w: 540, h: 380 };
const FILL_FRAC = 0.28; // 170 ÷ 605.2 = 0.281

const toPx = ([x, y]: [number, number]): [number, number] => [SEOUL_BOX.x + (x / 100) * SEOUL_BOX.w, SEOUL_BOX.y + (y / 82) * SEOUL_BOX.h];

/** Catmull-Rom 으로 부드럽게 (닫힌/열린 곡선) → 촘촘한 점열 */
const smooth = (pts: [number, number][], closed: boolean, sub = 8): [number, number][] => {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out: [number, number][] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let k = 0; k < sub; k++) {
      const t = k / sub;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};

const poly = (pts: [number, number][]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

/** 서쪽(왼쪽)부터 채운 면적 비율 → x 좌표 (세로 스캔라인 적분) */
const useSeoulGeometry = () =>
  useMemo(() => {
    const pts = smooth(SEOUL.map(toPx), true);
    const d = `${poly(pts)} Z`;
    const riverD = poly(smooth(HAN_RIVER.map(toPx), false));
    const minX = SEOUL_BOX.x;
    const maxX = SEOUL_BOX.x + SEOUL_BOX.w;
    const cols: { x: number; h: number }[] = [];
    for (let x = minX; x <= maxX; x += 1) {
      const ys: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if ((ax <= x && bx > x) || (bx <= x && ax > x)) ys.push(ay + ((x - ax) / (bx - ax)) * (by - ay));
      }
      ys.sort((m, n) => m - n);
      let h = 0;
      for (let k = 0; k + 1 < ys.length; k += 2) h += ys[k + 1] - ys[k];
      cols.push({ x, h });
    }
    const total = cols.reduce((sum, c) => sum + c.h, 0);
    let acc = 0;
    const cum = cols.map((c) => {
      acc += c.h;
      return { x: c.x, f: acc / total };
    });
    const xForFrac = (f: number): number => {
      if (f <= 0) return minX;
      for (const c of cum) if (c.f >= f) return c.x;
      return maxX;
    };
    return { d, riverD, xForFrac };
  }, []);

// ── 구름 (정적 기하) ─────────────────────────────────────
type Puff = { cx: number; cy: number; rx: number; ry: number; o: number };
const cloud = (x: number, y: number, s: number, o: number): Puff[] => [
  { cx: x, cy: y, rx: 150 * s, ry: 34 * s, o },
  { cx: x - 90 * s, cy: y + 8 * s, rx: 90 * s, ry: 24 * s, o: o * 0.9 },
  { cx: x + 70 * s, cy: y - 16 * s, rx: 80 * s, ry: 30 * s, o: o * 0.85 },
  { cx: x + 150 * s, cy: y + 6 * s, rx: 70 * s, ry: 18 * s, o: o * 0.7 },
];
const SKY_CLOUDS: Puff[] = [...cloud(260, 190, 1.1, 0.5), ...cloud(1180, 150, 1.4, 0.42), ...cloud(1760, 230, 0.9, 0.38), ...cloud(740, 262, 0.7, 0.3)];
const REFL_CLOUDS: Puff[] = [
  ...cloud(420, 420, 1.3, 0.34),
  ...cloud(760, 500, 1.6, 0.42),
  ...cloud(1340, 380, 1.2, 0.3),
  ...cloud(1700, 560, 1.4, 0.3),
  ...cloud(1080, 640, 1.0, 0.26),
  ...cloud(200, 640, 1.1, 0.24),
];

const Clouds: React.FC<{ puffs: Puff[]; drift: number; id: string; tint: string }> = ({ puffs, drift, id, tint }) => (
  <g filter={`url(#${id})`} transform={`translate(${drift} 0)`}>
    {puffs.map((p, i) => (
      <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={tint} opacity={p.o} />
    ))}
  </g>
);

// ── 배경: 하늘 + 거울 벽 + 사막 ───────────────────────────
const World: React.FC<{ t: number }> = ({ t }) => {
  const seams = useMemo(() => {
    const v: React.ReactNode[] = [];
    for (let x = -64; x <= WW + 64; x += 72) v.push(<line key={`v${x}`} x1={x} y1={WALL_TOP} x2={x} y2={WALL_BOTTOM} stroke="#ffffff" strokeOpacity={0.07} strokeWidth={1.2} />);
    for (let y = WALL_TOP + 54; y < WALL_BOTTOM; y += 54) v.push(<line key={`h${y}`} x1={0} y1={y} x2={WW} y2={y} stroke="#ffffff" strokeOpacity={0.045} strokeWidth={1} />);
    return v;
  }, []);
  const skyDrift = t * 0.25;
  const reflDrift = -t * 0.18;
  const glintX = interpolate(t, [2, 64], [-400, WIDTH + 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return (
    <svg width={WW} height={HEIGHT} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="s7-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e2350" />
          <stop offset="0.5" stopColor="#1d4a80" />
          <stop offset="1" stopColor="#3a6aa3" />
        </linearGradient>
        {/* 벽에 비친 하늘: 실제 하늘과 거의 같은 색 → 벽이 사라져 보인다 */}
        <linearGradient id="s7-refl" gradientUnits="userSpaceOnUse" x1="0" y1={WALL_TOP} x2="0" y2={WALL_BOTTOM}>
          <stop offset="0" stopColor="#35649c" />
          <stop offset="0.55" stopColor="#4876ab" />
          <stop offset={(REFL_HORIZON - 26 - WALL_TOP) / (WALL_BOTTOM - WALL_TOP)} stopColor="#6d92bc" />
          <stop offset={(REFL_HORIZON - WALL_TOP) / (WALL_BOTTOM - WALL_TOP)} stopColor="#a9bdd2" />
          <stop offset={(REFL_HORIZON + 4 - WALL_TOP) / (WALL_BOTTOM - WALL_TOP)} stopColor="#b48d5d" />
          <stop offset="1" stopColor="#6e5132" />
        </linearGradient>
        <linearGradient id="s7-sand" x1="0" y1={WALL_BOTTOM} x2="0" y2={HEIGHT} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b8925f" />
          <stop offset="0.3" stopColor="#8a6a42" />
          <stop offset="0.75" stopColor="#3a2a18" />
          <stop offset="1" stopColor="#0d0906" />
        </linearGradient>
        <linearGradient id="s7-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.42" stopColor="#ffffff" stopOpacity={0.07} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.62" stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="s7-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.neon} stopOpacity={0.55} />
          <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="s7-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity={0.16} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <filter id="s7-cloud" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="s7-cloud2" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <clipPath id="s7-wall">
          <rect x={0} y={WALL_TOP} width={WW} height={WALL_BOTTOM - WALL_TOP} />
        </clipPath>
      </defs>
      {/* 실제 하늘 */}
      <rect x={0} y={0} width={WW} height={WALL_TOP} fill="url(#s7-sky)" />
      <Clouds puffs={SKY_CLOUDS} drift={skyDrift} id="s7-cloud" tint="#dfe8f5" />
      {/* 거울 벽 */}
      <g clipPath="url(#s7-wall)">
        <rect x={0} y={WALL_TOP} width={WW} height={WALL_BOTTOM - WALL_TOP} fill="url(#s7-refl)" />
        <Clouds puffs={REFL_CLOUDS} drift={reflDrift} id="s7-cloud2" tint="#d4e0f0" />
        {/* 벽에 비친 사구 */}
        <path
          d={`M0,${REFL_HORIZON + 10} C300,${REFL_HORIZON - 4} 520,${REFL_HORIZON + 18} 860,${REFL_HORIZON + 8} S1500,${REFL_HORIZON - 2} ${WW},${REFL_HORIZON + 12} L${WW},${WALL_BOTTOM} L0,${WALL_BOTTOM} Z`}
          fill="#8d6c45"
          opacity={0.55}
        />
        {seams}
        <rect x={0} y={WALL_TOP} width={WW} height={WALL_BOTTOM - WALL_TOP} fill="url(#s7-sheen)" />
        {/* 거울임을 알려주는 한 번의 빛 훑기 */}
        {glintX < WIDTH + 400 ? (
          <rect x={glintX} y={WALL_TOP} width={300} height={WALL_BOTTOM - WALL_TOP} fill="url(#s7-glint)" transform={`skewX(-24)`} style={{ transformOrigin: `${glintX}px ${WALL_BOTTOM}px` }} />
        ) : null}
      </g>
      {/* 벽 윗모서리: 가는 흰 선 + 아래로 번지는 시안 */}
      <rect x={0} y={WALL_TOP} width={WW} height={10} fill="url(#s7-edge)" opacity={0.35} />
      <line x1={0} y1={WALL_TOP} x2={WW} y2={WALL_TOP} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.5} />
      {/* 사막 전경 */}
      <rect x={0} y={WALL_BOTTOM} width={WW} height={HEIGHT - WALL_BOTTOM} fill="url(#s7-sand)" />
      <line x1={0} y1={WALL_BOTTOM} x2={WW} y2={WALL_BOTTOM} stroke={COLORS.neon} strokeOpacity={0.25} strokeWidth={1.5} />
      <path d={`M0,880 C360,846 640,900 1020,872 S1620,840 ${WW},868 L${WW},${HEIGHT} L0,${HEIGHT} Z`} fill="#5a4128" opacity={0.55} />
      <path d={`M0,960 C420,930 820,990 1240,950 S1760,930 ${WW},952 L${WW},${HEIGHT} L0,${HEIGHT} Z`} fill="#1a120b" opacity={0.7} />
    </svg>
  );
};

/** 약속 구간 공통의 옅은 시안 측정 그리드 */
const MeasureGrid: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      right: -EXT,
      opacity: 0.06,
      backgroundImage: `linear-gradient(${COLORS.neon} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.neon} 1px, transparent 1px)`,
      backgroundSize: "96px 96px",
    }}
  />
);

/** 벽이 거의 안 보이므로 왼쪽에 높이 치수선만 살짝 */
const HeightMark: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progress(frame, 6, 30, Easing.inOut(Easing.cubic));
  const o = 0.75 * progress(frame, 6, 18) * (1 - progress(frame, F.birdsStart - 10, F.birdsStart + 10));
  if (o <= 0) return null;
  const x = 170;
  const mid = (WALL_TOP + WALL_BOTTOM) / 2;
  const half = ((WALL_BOTTOM - WALL_TOP) / 2) * p;
  return (
    <>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity: o }}>
        <line x1={x} y1={mid - half} x2={x} y2={mid + half} stroke={COLORS.neon} strokeWidth={2} />
        <line x1={x - 12} y1={mid - half} x2={x + 12} y2={mid - half} stroke={COLORS.neon} strokeWidth={2} />
        <line x1={x - 12} y1={mid + half} x2={x + 12} y2={mid + half} stroke={COLORS.neon} strokeWidth={2} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x + 18,
          top: mid - 20,
          opacity: o * p,
          fontFamily: FONTS.num,
          fontWeight: 700,
          fontSize: 30,
          color: COLORS.neon,
          textShadow: "0 2px 6px rgba(0,0,0,0.8)",
        }}
      >
        500m
      </div>
    </>
  );
};

// ── A: 서울 28% 도해 ─────────────────────────────────────
const SeoulOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const g = useSeoulGeometry();
  const draw = progress(frame, F.outlineIn, F.outlineDone, Easing.inOut(Easing.cubic));
  const baseFill = progress(frame, F.outlineIn + 14, F.outlineDone + 4);
  const fillP = progress(frame, F.fillStart, F.fillEnd, Easing.inOut(Easing.cubic));
  const levelX = g.xForFrac(FILL_FRAC * fillP);
  const pct = Math.round(28 * fillP);
  const out = progress(frame, F.diagramOut, F.diagramGone, Easing.inOut(Easing.cubic));
  const seoulLbl = progress(frame, F.seoulLabel, F.seoulLabel + 14);
  const numIn = progress(frame, F.fillStart - 6, F.fillStart + 8);
  const mirrorLbl = progress(frame, F.mirrorLabel, F.mirrorLabel + 14);
  if (out >= 1) return null;
  const labelX = SEOUL_BOX.x + SEOUL_BOX.w + 100;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 - 0.04 * out})`, transformOrigin: "50% 50%" }}>
      {/* 가독성용 어두운 받침 (거울 위의 부드러운 그늘) */}
      <div
        style={{
          position: "absolute",
          left: SEOUL_BOX.x - 200,
          top: SEOUL_BOX.y - 110,
          width: 1340,
          height: SEOUL_BOX.h + 220,
          background: "radial-gradient(ellipse at 48% 50%, rgba(5,6,15,0.72) 0%, rgba(5,6,15,0.5) 42%, rgba(5,6,15,0) 72%)",
          opacity: Math.min(1, draw * 1.5),
        }}
      />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="s7-seoul">
            <path d={g.d} />
          </clipPath>
          <linearGradient id="s7-mirrorfill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={COLORS.neon} stopOpacity={0.9} />
            <stop offset="0.55" stopColor="#bff9ff" stopOpacity={0.9} />
            <stop offset="1" stopColor={COLORS.neon} stopOpacity={0.8} />
          </linearGradient>
        </defs>
        {/* 서울 (강철색) */}
        <path d={g.d} fill={COLORS.steel} fillOpacity={0.14 * baseFill} />
        <g clipPath="url(#s7-seoul)">
          <path d={g.riverD} fill="none" stroke={COLORS.steel} strokeOpacity={0.3 * baseFill} strokeWidth={6} strokeLinecap="round" />
          {/* 거울 170㎢ 만큼 서쪽부터 차오름 */}
          {fillP > 0 ? (
            <>
              <rect x={SEOUL_BOX.x - 10} y={SEOUL_BOX.y - 10} width={levelX - SEOUL_BOX.x + 10} height={SEOUL_BOX.h + 20} fill="url(#s7-mirrorfill)" opacity={0.9} />
              <line x1={levelX} y1={SEOUL_BOX.y - 10} x2={levelX} y2={SEOUL_BOX.y + SEOUL_BOX.h + 10} stroke="#ffffff" strokeWidth={2.5} strokeOpacity={0.9} />
            </>
          ) : null}
        </g>
        <path
          d={g.d}
          fill="none"
          stroke={COLORS.steel}
          strokeWidth={3}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
      {/* 오른쪽 판독 */}
      <div style={{ position: "absolute", left: labelX, top: SEOUL_BOX.y + 6 }}>
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: 46,
            color: COLORS.steel,
            opacity: seoulLbl,
            transform: `translateY(${(1 - seoulLbl) * 14}px)`,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            letterSpacing: -0.5,
          }}
        >
          서울 <span style={{ fontFamily: FONTS.num, fontWeight: 700 }}>605</span>㎢의
        </div>
        <div
          style={{
            fontFamily: FONTS.num,
            fontWeight: 800,
            fontSize: 168,
            lineHeight: 1.05,
            color: COLORS.steel,
            opacity: numIn,
            transform: `translateY(${(1 - numIn) * 18}px)`,
            textShadow: "0 3px 12px rgba(0,0,0,0.75)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}
          <span style={{ fontSize: 110 }}>%</span>
        </div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: 40,
            color: COLORS.neon,
            opacity: mirrorLbl,
            transform: `translateX(${(1 - mirrorLbl) * 16}px)`,
            textShadow: "0 2px 8px rgba(0,0,0,0.85)",
            whiteSpace: "nowrap",
            letterSpacing: -0.4,
          }}
        >
          <span style={{ width: 26, height: 26, borderRadius: 4, background: COLORS.neon, boxShadow: `0 0 14px ${COLORS.neon}88` }} />
          <span>
            = 거울 <span style={{ fontFamily: FONTS.num }}>170</span>㎢ <span style={{ fontSize: 32, color: COLORS.ink, opacity: 0.85 }}>(계산)</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── B: 철새 편대와 반사상 ────────────────────────────────
type Member = { ox: number; oy: number; phase: number; s: number };
const FORMATION: Member[] = (() => {
  const m: Member[] = [{ ox: 0, oy: 0, phase: 0, s: 1.1 }];
  for (let k = 1; k <= 5; k++) {
    m.push({ ox: k * 34, oy: -k * 20, phase: k * 0.7, s: 1 - k * 0.03 });
    m.push({ ox: k * 32 + 6, oy: k * 22, phase: k * 0.7 + 0.35, s: 1 - k * 0.03 });
  }
  return m;
})();

const birdPath = (w: number, flap: number) => {
  const wing = w * 0.55 * flap;
  return `M${-w},${-wing} Q${-w * 0.45},${-wing * 0.2 - 2} 0,0 Q${w * 0.45},${-wing * 0.2 - 2} ${w},${-wing}`;
};

/** 투시: z = 1 이 벽면. 새는 z<1 (카메라 쪽), 거울 속 반사상은 z>1. */
const project = (wx: number, wy: number, z: number) => ({ x: CAM.x + (wx - CAM.x) / z, y: CAM.y + (wy - CAM.y) / z });

const Flock: React.FC<{ u: number; t: number; reflIn: number }> = ({ u, t, reflIn }) => {
  const r = 1 - u;
  const zb = 1 - 0.5 * r;
  const zr = 1 + 0.5 * r;
  const size = 20;
  const birds: React.ReactNode[] = [];
  const refl: React.ReactNode[] = [];
  FORMATION.forEach((m, i) => {
    const wx = CONTACT.x + m.ox + APPROACH.x * r;
    const wy = CONTACT.y + m.oy + APPROACH.y * r;
    const flap = Math.sin(t * 0.42 + m.phase);
    const b = project(wx, wy, zb);
    const q = project(wx, wy, zr);
    birds.push(
      <path key={`b${i}`} d={birdPath((size * m.s) / zb, flap)} transform={`translate(${b.x} ${b.y})`} fill="none" stroke="#f1f5ff" strokeWidth={3.2 / Math.sqrt(zb)} strokeLinecap="round" strokeLinejoin="round" />,
    );
    refl.push(<path key={`r${i}`} d={birdPath((size * m.s) / zr, flap)} transform={`translate(${q.x} ${q.y})`} fill="none" stroke="#dbe8ff" strokeWidth={2.2} strokeLinecap="round" />);
  });
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id="s7-flock-wall">
          <rect x={0} y={WALL_TOP} width={WIDTH} height={WALL_BOTTOM - WALL_TOP} />
        </clipPath>
      </defs>
      <g clipPath="url(#s7-flock-wall)" opacity={0.42 * reflIn}>
        {refl}
      </g>
      <g style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.55))" }}>{birds}</g>
    </svg>
  );
};

/** 접촉 직전 정지 후 앰버 경고 링 */
const WarningRing: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const f = frame - F.freeze;
  if (f < 0) return null;
  const inP = progress(f, 0, 10);
  const rings = [0, 1, 2].map((k) => {
    const cyc = ((f + k * 14) % 42) / 42;
    return (
      <circle
        key={k}
        cx={x}
        cy={y}
        r={30 + cyc * 120}
        fill="none"
        stroke={COLORS.amber}
        strokeWidth={3 * (1 - cyc) + 0.8}
        opacity={inP * (1 - cyc) * 0.9}
      />
    );
  });
  const pulse = 0.75 + 0.25 * Math.sin(f * 0.3);
  const br = 92 - 10 * inP;
  const L = 22;
  const corners: [number, number, number, number][] = [
    [-1, -1, 1, 0], [1, -1, -1, 0], [-1, 1, 1, 0], [1, 1, -1, 0],
  ];
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      {rings}
      <circle cx={x} cy={y} r={30} fill="none" stroke={COLORS.amber} strokeWidth={3.5} opacity={inP * pulse} />
      <circle cx={x} cy={y} r={5} fill={COLORS.amber} opacity={inP * pulse} />
      {corners.map(([sx, sy], i) => (
        <path
          key={i}
          d={`M${x + sx * br},${y + sy * br - sy * L} L${x + sx * br},${y + sy * br} L${x + sx * br - sx * L},${y + sy * br}`}
          fill="none"
          stroke={COLORS.amber}
          strokeWidth={3}
          opacity={inP * 0.85}
        />
      ))}
    </svg>
  );
};

/** 상단 리본: 홍해 비행로 · 대형 철새 150만 마리+ */
const Ribbon: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progress(frame, F.ribbon, F.ribbon + 16);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 212, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 30px 10px 22px",
          background: "rgba(5,6,15,0.66)",
          borderLeft: `4px solid ${COLORS.amber}`,
          borderRadius: 6,
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 38,
          color: COLORS.ink,
          letterSpacing: -0.4,
          whiteSpace: "nowrap",
        }}
      >
        <span>홍해 비행로</span>
        <span style={{ color: COLORS.muted }}>·</span>
        <span>
          대형 철새 <span style={{ fontFamily: FONTS.num, color: COLORS.amber }}>150</span>
          <span style={{ color: COLORS.amber }}>만 마리+</span>
        </span>
      </div>
    </div>
  );
};

export const S07MirrorBirds: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // 접촉 직전에 장면 전체가 멈춘다 (정지 프레임)
  const t = Math.min(frame, F.freeze);
  const frozen = frame >= F.freeze;
  const drift = interpolate(t, [0, F.freeze], [1, 1.045], { extrapolateRight: "clamp" });
  const u = interpolate(t, [F.birdsStart, F.freeze], [0, U_AT_FREEZE], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const birdsOn = frame >= F.birdsStart;
  const freezeGrade = progress(frame, F.freeze, F.freeze + 8);
  const flash = frozen ? Math.max(0, 1 - (frame - F.freeze) / 5) * 0.18 : 0;
  // whoosh push
  const push = progress(frame, F.push, durationInFrames, Easing.in(Easing.cubic));
  // 접촉 지점 (화면 좌표, 드리프트 반영)
  const cx = CAM.x + (CONTACT.x - CAM.x) * drift;
  const cy = CAM.y + (CONTACT.y - CAM.y) * drift;
  return (
    <SceneFrame fadeIn={12} fadeOut={4}>
      <AbsoluteFill style={{ transform: `translateX(${-push * 420}px)`, filter: push > 0 ? `blur(${push * 6}px)` : undefined }}>
        <AbsoluteFill
          style={{
            transform: `scale(${drift})`,
            transformOrigin: `${CAM.x}px ${CAM.y}px`,
            filter: freezeGrade > 0 ? `saturate(${1 - 0.35 * freezeGrade}) brightness(${1 - 0.12 * freezeGrade})` : undefined,
          }}
        >
          <World t={t} />
          <MeasureGrid />
          {birdsOn ? <Flock u={u} t={t} reflIn={progress(frame, F.birdsStart + 8, F.birdsStart + 26)} /> : null}
        </AbsoluteFill>
        <HeightMark />
        <SeoulOverlay />
        <WarningRing x={cx} y={cy} />
        {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} /> : null}
        <Ribbon />
      </AbsoluteFill>

      {/* 자막 가독성용 하단 그늘 */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(3,4,10,0.55) 88%, rgba(3,4,10,0.7) 100%)" }} />
      <Grain />
      <Vignette strength={0.55} />
      <DreamLetterBox />
      <ExperimentChip index="실험 4" title="거울 벽" />
      <DisclaimerTag />
      <Caption lines={[{ text: "거울 **170㎢**, 서울 28% (계산)", from: 0.2, to: 3.0 }]} />
      <Caption lines={[{ text: "학술지: 철새에 '상당한 위험' 우려", from: 3.0, to: 6.4 }]} style={{ opacity: 1 - progress(frame, F.push, F.push + 7) }} />
      <SourceTag label="계산" text="170km × 500m × 2면 ÷ 서울 605.2㎢" start={sec(0.4)} end={F.diagramGone} />
      <SourceTag text="TREE 학술지 · 2024.01" start={F.diagramGone} />
      <SourceTag text="철새 수: 버드라이프/UNDP" position="bottomLeft" start={F.ribbon + 4} />
    </SceneFrame>
  );
};
