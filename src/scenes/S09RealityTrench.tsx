import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { progress } from "../utils/anim";
import { Caption, Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s09-reality-trench — 현실로. (57.2s → 64.0s, 204 frames)
 * s08 의 6프레임 검정 뒤 하드 컷. 레터박스·글로우 없음, 평평한 한낮 빛, 앰버·모래·콘크리트.
 *
 *   0–6f    하드 컷 + 노출 과다 한 번 (사진 셔터 느낌)
 *   0–30f   한낮 항공 와이드: s08 과 같은 자리의 170km 계획선 = 흐린 시안 점선 유령, 바닷가 끝에 작은 앰버 조각
 *   18–84f  앰버 조각이 화면을 채울 때까지 급 줌인 (로그 줌 + 선을 수평으로 돌림)
 *   62–96f  앰버 띠 → 회색 콘크리트 트렌치(낮은 옹벽·배관, 위로 솟은 것 없음)로 교차
 *   96–150f 하단 계획 대 현실 막대 (시안 윤곽 100% vs 앰버 채움, 카운터 1.4% 에서 멈춤)
 *   112–150f 트렌치 위로 계획된 벽의 흐린 시안 점선 유령 + 콜아웃 '수직 구조물 없음'
 *   192–204f whoosh push (왼쪽으로 밀려 나감)
 * 자막: L1 57.5–60.5 → 0.3–3.3 / L2 60.5–64.0 → 3.3–6.8
 */

// ── s08 과 같은 170km 선 (월드 좌표 = 와이드 화면 좌표) ──
const AX = 250;
const AY = 740;
const BX = 1690;
const BY = 506;
const BUILT = 2.4 / 170; // 1.41 %
const CX = AX + (BX - AX) * BUILT * 0.5;
const CY = AY + (BY - AY) * BUILT * 0.5;
const LINE_ANGLE = (Math.atan2(BY - AY, BX - AX) * 180) / Math.PI; // ≈ -9.2°

// ── 타이밍 (프레임, 장면 기준) ──
const ZOOM_A = 18;
const ZOOM_B = 84;
const Z_MAX = 118;
const X_A = 62; // 트렌치 교차 시작
const X_B = 82;
const BAR_A = 100;
const COUNT_A = 114;
const COUNT_B = 146;
const GHOST_A = 118;
const CALLOUT_A = 136;

// ── 트렌치 근접 화면 기하 (화면 좌표) ──
const T_TOP = 318; // 먼 쪽 옹벽 윗면
const T_FACE = 334; // 먼 쪽 옹벽 안쪽 면 시작
const T_FLOOR = 392; // 바닥 시작
const T_NEAR = 540; // 가까운 쪽 옹벽 윗면
const T_BOT = 556;

const SAND = "#c9a878";
const SAND_DARK = "#a9875a";
const SAND_LIGHT = "#dcc49c";
const WARM_DARK = "18,14,10";

// ─────────────────────────────────────────────────────────────
// 1) 한낮 항공 시점 (카메라 변환을 직접 계산해 선이 어떤 배율에서도 선명하게)
// ─────────────────────────────────────────────────────────────

const ridgePath = (seed: number, y0: number, amp: number): string => {
  const pts: string[] = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = u * (WIDTH + 400) - 200;
    const y = y0 + amp * Math.sin(u * Math.PI * 2 * 1.6 + seed * 5.1) + amp * 0.4 * Math.sin(u * Math.PI * 2 * 4.1 + seed * 2.3);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

const Aerial: React.FC<{ frame: number }> = ({ frame }) => {
  const ridges = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({ d: ridgePath(i, -20 + i * 50, 12 + random(`s9r${i}`) * 20), o: 0.08 + random(`s9ro${i}`) * 0.1 })),
    [],
  );
  const patches = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: 300 + random(`s9px${i}`) * 1600,
        y: random(`s9py${i}`) * HEIGHT,
        r: 200 + random(`s9pr${i}`) * 300,
        o: 0.06 + random(`s9po${i}`) * 0.08,
      })),
    [],
  );
  // 카메라: C 가 화면의 (CxScr, CyScr) 로 이동하며 로그 배율로 줌, 선을 수평으로 회전
  const zt = progress(frame, ZOOM_A, ZOOM_B, Easing.bezier(0.55, 0, 0.35, 1));
  const Z = Math.exp(Math.log(Z_MAX) * zt);
  const mt = progress(frame, ZOOM_A - 4, ZOOM_B - 14, Easing.inOut(Easing.cubic));
  const sx = interpolate(mt, [0, 1], [CX, 960]);
  const sy = interpolate(mt, [0, 1], [CY, (T_TOP + T_BOT) / 2]);
  const rot = -LINE_ANGLE * mt;
  const rad = (rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const toScr = (x: number, y: number): [number, number] => {
    const dx = (x - CX) * Z;
    const dy = (y - CY) * Z;
    return [sx + dx * cos - dy * sin, sy + dx * sin + dy * cos];
  };
  const [ax, ay] = toScr(AX, AY);
  const [bx, by] = toScr(BX, BY);
  const [ex, ey] = toScr(AX + (BX - AX) * BUILT, AY + (BY - AY) * BUILT);
  const worldT = `translate(${sx} ${sy}) rotate(${rot}) scale(${Z}) translate(${-CX} ${-CY})`;

  const bandW = 7 + 1.95 * Z; // 앰버 구간 화면 두께
  const ringO = 1 - progress(frame, ZOOM_A, ZOOM_A + 14);
  const coast = `M${AX - 150},-200 C${AX - 60},${HEIGHT * 0.25} ${AX - 230},${HEIGHT * 0.65} ${AX - 110},${HEIGHT + 200}`;
  const lx = (AX + BX) / 2;
  const ly = (AY + BY) / 2;
  const labelO = Math.min(progress(frame, 4, 16), 1 - progress(frame, ZOOM_A + 2, ZOOM_A + 14));
  const dirt = progress(Z, 6, 40, Easing.linear); // 줌인할수록 공사 흙바닥이 드러남

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="s9-sand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d3b283" />
            <stop offset="1" stopColor="#b08c5e" />
          </linearGradient>
          <linearGradient id="s9-sea" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3f6e7c" />
            <stop offset="1" stopColor="#6c98a0" />
          </linearGradient>
          <radialGradient id="s9-patch">
            <stop offset="0" stopColor="#f1dcb2" stopOpacity={1} />
            <stop offset="1" stopColor="#f1dcb2" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={worldT}>
          <rect x={-2000} y={-2000} width={WIDTH + 4000} height={HEIGHT + 4000} fill="url(#s9-sand)" />
          {patches.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#s9-patch)" opacity={b.o} />
          ))}
          {ridges.map((r, i) => (
            <path key={i} d={r.d} fill="none" stroke="#3a2812" strokeOpacity={r.o} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${coast} L-2000,${HEIGHT + 200} L-2000,-200 Z`} fill="url(#s9-sea)" />
          <path d={coast} fill="none" stroke="#efe6d2" strokeOpacity={0.55} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          {/* 현장: 파헤친 흙띠와 공사 도로 (월드 단위로 아주 작음) */}
          <g opacity={0.35 + 0.65 * dirt}>
            <line
              x1={AX - 3}
              y1={AY + 0.5}
              x2={AX + (BX - AX) * BUILT * 1.1}
              y2={AY + (BY - AY) * BUILT * 1.1}
              stroke={SAND_LIGHT}
              strokeWidth={5.2}
              strokeLinecap="butt"
            />
          </g>
        </g>
        {/* 170km 계획선 — 흐린 시안 점선 유령 */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#2a1c0c" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={COLORS.neon} strokeOpacity={0.8} strokeWidth={3} strokeDasharray="16 12" />
        {/* 실제 지어진 약 2.4km — 앰버 */}
        <line x1={ax} y1={ay} x2={ex} y2={ey} stroke="#3a2610" strokeWidth={bandW + 6} strokeLinecap="butt" strokeOpacity={0.75} />
        <line x1={ax} y1={ay} x2={ex} y2={ey} stroke={COLORS.amber} strokeWidth={bandW} strokeLinecap="butt" />
        {ringO > 0 ? (
          <g opacity={ringO * progress(frame, 2, 12)}>
            <circle cx={CX} cy={CY} r={40} fill="none" stroke="#2a1c0c" strokeOpacity={0.6} strokeWidth={6} />
            <circle cx={CX} cy={CY} r={40} fill="none" stroke={COLORS.amber} strokeWidth={3} strokeDasharray="7 6" />
          </g>
        ) : null}
      </svg>
      {labelO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: lx,
            top: ly,
            transform: `translate(-50%, -50%) rotate(${LINE_ANGLE}deg) translateY(-62px)`,
            opacity: labelO,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            padding: "8px 18px 6px",
            borderRadius: 8,
            background: `rgba(${WARM_DARK},0.72)`,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontFamily: FONTS.num, fontWeight: 900, fontSize: 40, color: COLORS.neon, opacity: 0.85 }}>170km</span>
          <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 28, color: COLORS.sand }}>(계획)</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────
// 2) 트렌치 근접: 긴 회색 콘크리트 기초, 낮은 옹벽과 배관. 위로 솟은 것은 없다.
// ─────────────────────────────────────────────────────────────

const X0 = -420;
const X1 = WIDTH + 420;

const roughEdge = (seed: string, y0: number, amp: number, step = 60): string => {
  const pts: string[] = [];
  for (let x = X0, i = 0; x <= X1; x += step, i++) {
    pts.push(`${i === 0 ? "M" : "L"}${x},${(y0 + (random(`${seed}${i}`) - 0.5) * amp).toFixed(1)}`);
  }
  return pts.join(" ");
};

const TrenchStatic: React.FC = () => {
  const geo = useMemo(() => {
    const faceJoints: number[] = [];
    for (let x = X0; x <= X1; x += 132) faceJoints.push(x);
    const slabJoints: number[] = [];
    for (let x = X0 + 60; x <= X1; x += 264) slabJoints.push(x);
    const flanges1: number[] = [];
    for (let x = X0 + 30; x <= X1; x += 250) flanges1.push(x);
    const flanges2: number[] = [];
    for (let x = X0 + 150; x <= X1; x += 310) flanges2.push(x);
    const specks = Array.from({ length: 26 }, (_, i) => ({
      x: random(`s9k${i}`) * 180,
      y: random(`s9ky${i}`) * 180,
      r: 0.8 + random(`s9kr${i}`) * 1.8,
      d: random(`s9kd${i}`) > 0.5,
    }));
    const farSpoil = `${roughEdge("s9fs", T_TOP - 64, 26)} L${X1},${T_TOP} L${X0},${T_TOP} Z`;
    const nearPts: string[] = [];
    for (let x = X1, i = 0; x >= X0; x -= 60, i++) nearPts.push(`L${x},${(T_BOT + 70 + (random(`s9ns${i}`) - 0.5) * 28).toFixed(1)}`);
    const nearSpoil = `M${X0},${T_BOT} L${X1},${T_BOT} ${nearPts.join(" ")} Z`;
    // 트렌치 밖에 눕혀 쌓아 둔 관 토막 (세로로 솟지 않음)
    const pipeStack = Array.from({ length: 5 }, (_, i) => ({ x: 250 + (i % 2) * 18, y: 176 + i * 22, w: 250 + random(`s9pw${i}`) * 60 }));
    const stains = Array.from({ length: 9 }, (_, i) => ({
      x: X0 + 200 + random(`s9st${i}`) * (X1 - X0 - 400),
      y: T_FLOOR + 20 + random(`s9sy${i}`) * (T_NEAR - T_FLOOR - 40),
      rx: 60 + random(`s9sr${i}`) * 140,
      ry: 10 + random(`s9sq${i}`) * 18,
      o: 0.08 + random(`s9so${i}`) * 0.1,
    }));
    return { faceJoints, slabJoints, flanges1, flanges2, specks, farSpoil, nearSpoil, pipeStack, stains };
  }, []);

  return (
    <svg width={WIDTH} height={HEIGHT} overflow="visible" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <pattern id="s9-speck" width={180} height={180} patternUnits="userSpaceOnUse">
          {geo.specks.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.d ? "#7d5f3a" : "#efdcb8"} opacity={0.45} />
          ))}
        </pattern>
        <linearGradient id="s9-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b4b7bb" />
          <stop offset="1" stopColor="#9a9ea4" />
        </linearGradient>
        <linearGradient id="s9-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5e636b" />
          <stop offset="0.12" stopColor="#7b8088" />
          <stop offset="1" stopColor="#868b92" />
        </linearGradient>
        <linearGradient id="s9-pipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4f57" />
          <stop offset="0.3" stopColor="#9aa0a8" />
          <stop offset="0.55" stopColor="#5b6068" />
          <stop offset="1" stopColor="#2c3036" />
        </linearGradient>
        <linearGradient id="s9-pipeB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2622" />
          <stop offset="0.35" stopColor="#5a534b" />
          <stop offset="1" stopColor="#1b1814" />
        </linearGradient>
        <linearGradient id="s9-stack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e737b" />
          <stop offset="0.35" stopColor="#b3b8bf" />
          <stop offset="1" stopColor="#4c5058" />
        </linearGradient>
      </defs>

      {/* 모래 바닥 */}
      <rect x={X0} y={-400} width={X1 - X0} height={HEIGHT + 800} fill={SAND} />
      <rect x={X0} y={-400} width={X1 - X0} height={HEIGHT + 800} fill="url(#s9-speck)" />
      {/* 바퀴 자국 */}
      {[
        [X0, 118, X1, 70],
        [X0, 136, X1, 88],
        [X0, 690, X1, 740],
        [X0, 708, X1, 758],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SAND_DARK} strokeOpacity={0.5} strokeWidth={5} />
      ))}
      {/* 파헤친 흙띠 */}
      <path d={geo.farSpoil} fill={SAND_LIGHT} />
      <path d={geo.nearSpoil} fill={SAND_LIGHT} />

      {/* 눕혀 둔 관 토막 */}
      {geo.pipeStack.map((p, i) => (
        <g key={i}>
          <rect x={p.x} y={p.y + 4} width={p.w} height={20} rx={10} fill="#6b5234" opacity={0.35} />
          <rect x={p.x} y={p.y} width={p.w} height={20} rx={10} fill="url(#s9-stack)" />
          <ellipse cx={p.x + p.w} cy={p.y + 10} rx={5} ry={10} fill="#2e3238" />
        </g>
      ))}

      {/* 먼 쪽 옹벽: 윗면 + 안쪽 면 */}
      <rect x={X0} y={T_TOP} width={X1 - X0} height={T_FACE - T_TOP} fill="#c9ccd0" />
      <rect x={X0} y={T_FACE} width={X1 - X0} height={T_FLOOR - T_FACE} fill="url(#s9-face)" />
      {geo.faceJoints.map((x) => (
        <line key={x} x1={x} y1={T_FACE} x2={x} y2={T_FLOOR} stroke="#7d8187" strokeWidth={2} />
      ))}
      <line x1={X0} y1={T_FACE + 22} x2={X1} y2={T_FACE + 22} stroke="#8e9298" strokeWidth={1.5} strokeDasharray="3 16" />
      {/* 바닥 슬래브 */}
      <rect x={X0} y={T_FLOOR} width={X1 - X0} height={T_NEAR - T_FLOOR} fill="url(#s9-floor)" />
      {geo.slabJoints.map((x) => (
        <line key={x} x1={x} y1={T_FLOOR + 6} x2={x - 18} y2={T_NEAR} stroke="#5d6269" strokeWidth={2} />
      ))}
      {geo.stains.map((st, i) => (
        <ellipse key={i} cx={st.x} cy={st.y} rx={st.rx} ry={st.ry} fill="#3b3a36" opacity={st.o} />
      ))}
      {/* 배관 두 줄 (바닥에 누워 있음) */}
      <rect x={X0} y={T_FLOOR + 44} width={X1 - X0} height={10} fill="#3d4148" opacity={0.45} />
      <rect x={X0} y={T_FLOOR + 14} width={X1 - X0} height={34} fill="url(#s9-pipe)" />
      {geo.flanges1.map((x) => (
        <rect key={x} x={x} y={T_FLOOR + 10} width={9} height={42} rx={2} fill="#50555d" />
      ))}
      <rect x={X0} y={T_FLOOR + 92} width={X1 - X0} height={8} fill="#2f2a24" opacity={0.4} />
      <rect x={X0} y={T_FLOOR + 70} width={X1 - X0} height={26} fill="url(#s9-pipeB)" />
      {geo.flanges2.map((x) => (
        <rect key={x} x={x} y={T_FLOOR + 67} width={7} height={32} rx={2} fill="#3a352f" />
      ))}
      {/* 가까운 쪽 낮은 옹벽 윗면 */}
      <rect x={X0} y={T_NEAR - 6} width={X1 - X0} height={6} fill="#4d5259" opacity={0.6} />
      <rect x={X0} y={T_NEAR} width={X1 - X0} height={T_BOT - T_NEAR} fill="#c3c6ca" />
      <rect x={X0} y={T_BOT} width={X1 - X0} height={5} fill="#6b5234" opacity={0.35} />
    </svg>
  );
};

/** 계획된 벽의 흐린 시안 점선 유령 — 트렌치 가장자리에서 위로 그려지며 사라진다 */
const GhostWall: React.FC<{ frame: number }> = ({ frame }) => {
  const p = progress(frame, GHOST_A, GHOST_A + 30, Easing.out(Easing.cubic));
  if (p <= 0) return null;
  const top = T_TOP - (T_TOP - 40) * p;
  const cols: number[] = [];
  for (let x = 80; x <= WIDTH - 60; x += 220) cols.push(x);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="s9-ghostfade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="s9-ghostmask">
          <rect x={0} y={0} width={WIDTH} height={T_TOP} fill="url(#s9-ghostfade)" />
        </mask>
      </defs>
      <g mask="url(#s9-ghostmask)" opacity={0.85}>
        {cols.map((x) => (
          <line key={x} x1={x} y1={T_TOP} x2={x} y2={top} stroke={COLORS.neon} strokeWidth={2.5} strokeDasharray="10 10" />
        ))}
        {[0.25, 0.5, 0.75].map((f) => {
          const y = T_TOP - (T_TOP - 40) * f;
          return y >= top ? <line key={f} x1={0} y1={y} x2={WIDTH} y2={y} stroke={COLORS.neon} strokeWidth={1.5} strokeDasharray="10 10" /> : null;
        })}
      </g>
      <line x1={0} y1={T_TOP} x2={WIDTH} y2={T_TOP} stroke={COLORS.neon} strokeOpacity={0.85 * p} strokeWidth={2.5} strokeDasharray="10 10" />
    </svg>
  );
};

const Callout: React.FC<{ frame: number }> = ({ frame }) => {
  const p = progress(frame, CALLOUT_A, CALLOUT_A + 14);
  if (p <= 0) return null;
  const lead = progress(frame, CALLOUT_A, CALLOUT_A + 10);
  const x = 1290;
  const yChip = 170;
  return (
    <>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <line x1={x} y1={yChip + 40} x2={x} y2={yChip + 40 + (T_TOP - yChip - 40) * lead} stroke={COLORS.ink} strokeWidth={2.5} />
        <circle cx={x} cy={T_TOP} r={7} fill={COLORS.ink} opacity={lead} />
        <line x1={x - 60} y1={T_TOP} x2={x + 60} y2={T_TOP} stroke={COLORS.ink} strokeWidth={2.5} opacity={lead} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: yChip,
          transform: `translate(-50%, -50%) translateY(${(1 - p) * 14}px)`,
          opacity: p,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 26px 10px",
          background: `rgba(${WARM_DARK},0.86)`,
          borderLeft: `6px solid ${COLORS.amber}`,
          borderRadius: 6,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: FONTS.display, fontSize: 52, color: COLORS.ink, letterSpacing: 1 }}>수직 구조물 없음</span>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// 3) 계획 대 현실 막대 (공용 PlanVsReality 는 글로우가 있고 2.4 를 '2' 로 반올림해 로컬로 구성)
// ─────────────────────────────────────────────────────────────

const BAR_X = 300;
const BAR_W = WIDTH - BAR_X * 2;
const BAR_Y = 752;
const BAR_H = 34;

const PlanBar: React.FC<{ frame: number }> = ({ frame }) => {
  const o = progress(frame, BAR_A, BAR_A + 12);
  if (o <= 0) return null;
  const outline = progress(frame, BAR_A, BAR_A + 22, Easing.inOut(Easing.cubic));
  const fillP = progress(frame, COUNT_A, COUNT_B, Easing.out(Easing.cubic));
  const pct = 1.4 * fillP;
  const stopped = frame >= COUNT_B;
  const knock = stopped ? 1 + 0.06 * (1 - progress(frame, COUNT_B, COUNT_B + 8)) : 1;
  const fillW = Math.max(3, BAR_W * BUILT * fillP);
  const labO = progress(frame, COUNT_A + 6, COUNT_A + 18);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT, opacity: o }}>
      {/* 윗줄: 카운터 / 100% */}
      <div
        style={{
          position: "absolute",
          left: BAR_X,
          top: BAR_Y - 96,
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          transform: `scale(${knock})`,
          transformOrigin: "left bottom",
          opacity: progress(frame, COUNT_A - 4, COUNT_A + 6),
        }}
      >
        <span style={{ fontFamily: FONTS.num, fontWeight: 900, fontSize: 76, color: COLORS.amber, lineHeight: 1 }}>{pct.toFixed(1)}%</span>
        <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: COLORS.sand }}>(계산)</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: BAR_X,
          top: BAR_Y - 56,
          fontFamily: FONTS.num,
          fontWeight: 700,
          fontSize: 34,
          color: COLORS.neon,
          opacity: 0.8 * outline,
        }}
      >
        100%
      </div>
      {/* 막대 */}
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <rect
          x={BAR_X}
          y={BAR_Y}
          width={BAR_W}
          height={BAR_H}
          rx={5}
          fill={`rgba(${WARM_DARK},0.35)`}
          stroke={COLORS.neon}
          strokeOpacity={0.85}
          strokeWidth={2}
          pathLength={100}
          strokeDasharray={`${outline * 100} 100`}
        />
        <rect x={BAR_X} y={BAR_Y} width={fillW} height={BAR_H} rx={3} fill={COLORS.amber} />
        <line x1={BAR_X + fillW} y1={BAR_Y - 10} x2={BAR_X + fillW} y2={BAR_Y + BAR_H + 10} stroke={COLORS.amber} strokeWidth={2} opacity={labO} />
      </svg>
      {/* 아랫줄 라벨 */}
      <div
        style={{
          position: "absolute",
          left: BAR_X,
          top: BAR_Y + BAR_H + 12,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 30,
          color: COLORS.amber,
          opacity: labO,
          whiteSpace: "nowrap",
        }}
      >
        약 <span style={{ fontFamily: FONTS.num, fontWeight: 900 }}>2.4km</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: BAR_X,
          top: BAR_Y + BAR_H + 12,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 30,
          color: COLORS.neon,
          opacity: 0.8 * labO,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: FONTS.num, fontWeight: 900 }}>170km</span> (계획)
      </div>
    </div>
  );
};

export const S09RealityTrench: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 트렌치 교차: 줌의 관성을 이어 받아 살짝 더 커지며 들어와 느린 드리프트
  const trenchO = progress(frame, X_A, X_B, Easing.inOut(Easing.quad));
  const trenchScale =
    interpolate(progress(frame, X_A, X_B + 20, Easing.out(Easing.cubic)), [0, 1], [0.72, 1]) + 0.035 * progress(frame, X_B + 20, durationInFrames, Easing.linear);
  const aerialO = 1 - progress(frame, X_A + 6, X_B + 2, Easing.inOut(Easing.quad));

  // whoosh push out
  const pushOut = progress(frame, durationInFrames - 12, durationInFrames, Easing.in(Easing.cubic));
  const camX = -pushOut * 110;

  // 하드 컷 직후 노출 과다 한 번 (셔터)
  const flash = interpolate(frame, [0, 6], [0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  // 하단 가독성 밴드: 와이드에선 자막만, 트렌치에선 막대까지 덮는다
  const bandTall = progress(frame, X_A, BAR_A + 6);

  return (
    <SceneFrame fadeIn={0} fadeOut={10} background="#17120c">
      <AbsoluteFill style={{ transform: `translateX(${camX}px)` }}>
        {aerialO > 0 ? (
          <AbsoluteFill style={{ opacity: aerialO }}>
            <Aerial frame={frame} />
          </AbsoluteFill>
        ) : null}
        {trenchO > 0 ? (
          <AbsoluteFill style={{ opacity: trenchO, transform: `scale(${trenchScale})`, transformOrigin: `50% ${((T_TOP + T_BOT) / 2 / HEIGHT) * 100}%` }}>
            <TrenchStatic />
            <GhostWall frame={frame} />
          </AbsoluteFill>
        ) : null}
        {/* 한낮의 평평한 빛: 살짝 바랜 노출 */}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,246,228,0.10) 0%, rgba(255,246,228,0) 45%)" }} />
        <AbsoluteFill
          style={{
            background: `linear-gradient(0deg, rgba(${WARM_DARK},0.9) 0%, rgba(${WARM_DARK},0.72) 16%, rgba(${WARM_DARK},0) 27%)`,
            opacity: 1 - bandTall,
          }}
        />
        <AbsoluteFill
          style={{
            background: `linear-gradient(0deg, rgba(${WARM_DARK},0.92) 0%, rgba(${WARM_DARK},0.84) 40%, rgba(${WARM_DARK},0) 52%)`,
            opacity: bandTall,
          }}
        />
        {trenchO > 0 ? <Callout frame={frame} /> : null}
        <PlanBar frame={frame} />
      </AbsoluteFill>

      <Caption lines={[{ text: "2025년 4월 항공사진 속 현장", from: 0.3, to: 3.3 }]} />
      <Caption lines={[{ text: "170km 중 약 2.4km, 기초뿐", from: 3.3, to: 6.8 }]} />

      <AbsoluteFill style={{ background: "#fffaf0", opacity: flash, pointerEvents: "none" }} />
      <Grain opacity={0.14} />
      <Vignette strength={0.35} />

      <SourceTag text="디진 · 2025.04 항공사진" position="bottomRight" start={6} stack={0} />
      <SourceTag label="계산" text="2.4 ÷ 170 = 1.4%" position="bottomRight" start={COUNT_A} stack={1} />
    </SceneFrame>
  );
};
