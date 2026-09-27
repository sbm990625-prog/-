import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { progress } from "../utils/anim";
import { Caption, Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s09-reality-trench — 현실로. (57.2s → 64.0s, 204 frames)
 * s08 의 6프레임 검정 뒤 하드 컷. 레터박스·글로우 없음, 평평한 한낮 빛, 앰버·모래·콘크리트.
 *
 *   0f      하드 컷 (플래시 없음) — 첫 프레임부터 한낮 항공 와이드
 *   0–54f   s08 과 같은 자리의 170km 계획선 = 시안 점선 유령(어두운 윤곽), 바닷가 끝에 작은 앰버 조각, '170km (계획)' 유지
 *   18–66f  앰버 조각을 향해 로그 줌 + 선을 수평으로 돌림. 줌이 커질수록 앰버 조각이 위에서 본 트렌치(회색 수로·옹벽 테두리)로 드러남
 *   66–76f  브리지: 수로 중심으로 1→3 배 스케일 + 측면 트렌치(낮은 옹벽·배관, 위로 솟은 것 없음)로 교차 페이드
 *   100–150f 하단 계획 대 현실 막대 (시안 윤곽 100% vs 앰버 채움, 카운터 1.4% 에서 멈춤)
 *   118–150f 트렌치 위로 계획된 벽의 흐린 시안 점선 유령 + 콜아웃 '수직 구조물 없음'
 *   끝      Main 이 whoosh push 를 담당 — 장면 자체의 퇴장 없음, 느린 드리프트만
 * 자막: L1 57.5–60.5 → 0.3–3.3 / L2 60.5–64.0 → 3.3–6.8 (Main 핸드오프 10프레임 동안 유지되도록 7.1 까지)
 */

const SCENE_LEN = 204;

// ── s08 과 같은 170km 선 (월드 좌표 = 와이드 화면 좌표) ──
const AX = 250;
const AY = 740;
const BX = 1690;
const BY = 506;
const BUILT = 2.4 / 170; // 1.41 %
const S0 = 0.008; // 앰버 구간이 해안 끝에서 살짝 안쪽에서 시작 → 줌인 시 점선 유령이 양 끝으로 이어짐
const SX = AX + (BX - AX) * S0;
const SY = AY + (BY - AY) * S0;
const EX = AX + (BX - AX) * (S0 + BUILT);
const EY = AY + (BY - AY) * (S0 + BUILT);
const CX = (SX + EX) / 2;
const CY = (SY + EY) / 2;
const LINE_ANGLE = (Math.atan2(BY - AY, BX - AX) * 180) / Math.PI; // ≈ -9.2°

// ── 타이밍 (프레임, 장면 기준) ──
const LABEL_HOLD = 54; // '170km (계획)' 57.3–59.0s 유지
const ZOOM_A = 18;
const ZOOM_B = 66;
const Z_BR = 37; // 줌 끝 배율: 수로 폭 ≈ 79px = 측면 트렌치 높이(238px) ÷ 3
const BR_A = ZOOM_B; // 브리지 (1→3 배)
const BR_B = BR_A + 10;
const BR_K = 3;
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

// 굽이진 해안선 (왼쪽 위는 육지가 화면 끝까지, 왼쪽 아래로 만이 열림 — 곧은 띠가 아니다)
const COAST = "M-140,-260 C-40,160 240,360 172,690 C140,860 150,1010 380,1340";
const COAST_FILL = `${COAST} L-2400,1340 L-2400,-260 Z`;

/** 위에서 본 트렌치: 짙은 회색 수로 + 옹벽 테두리 + 옅은 가로 리브 + 2px 앰버 윤곽. look=0 이면 작은 앰버 조각 */
const TopChannel: React.FC<{ x: number; y: number; len: number; w: number; angle: number; look: number; ribSp: number }> = ({
  x,
  y,
  len,
  w,
  angle,
  look,
  ribSp,
}) => {
  const h = w / 2;
  const sp = Math.max(3, w * 0.42);
  const N = 30;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = -0.05 + (1.1 * i) / N;
    top.push(`${i === 0 ? "M" : "L"}${(u * len).toFixed(1)},${(-h - sp * (0.55 + 0.7 * random(`s9sp${i}`))).toFixed(1)}`);
    bot.push(`L${(u * len).toFixed(1)},${(h + sp * (0.55 + 0.7 * random(`s9sb${i}`))).toFixed(1)}`);
  }
  const spoil = `${top.join(" ")} ${bot.reverse().join(" ")} Z`;
  const wall = Math.min(6, w * 0.14);
  const ribs: number[] = [];
  const ribO = look * progress(ribSp, 22, 50, Easing.linear);
  if (ribO > 0) for (let rx = ribSp; rx < len - 4; rx += ribSp) ribs.push(rx);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={spoil} fill={SAND_LIGHT} opacity={0.2 + 0.22 * look} />
      <rect x={-2} y={-h - 2} width={len + 4} height={w + 4} fill="#3a3226" opacity={0.55} />
      <rect x={0} y={-h} width={len} height={w} fill={COLORS.amber} />
      {look > 0 ? (
        <g opacity={look}>
          <rect x={0} y={-h} width={len} height={w} fill="#5d5a55" />
          <rect x={0} y={-h} width={len} height={w * 0.3} fill="#4a4843" opacity={0.6} />
          {ribs.map((rx) => (
            <line key={rx} x1={rx} y1={-h + wall} x2={rx} y2={h - wall} stroke="#9a958c" strokeOpacity={0.3 * (ribO / Math.max(look, 0.001))} strokeWidth={2} />
          ))}
          <rect x={0} y={-h} width={len} height={wall} fill="#9a958c" />
          <rect x={0} y={h - wall} width={len} height={wall} fill="#9a958c" />
          <rect x={1} y={-h + 1} width={len - 2} height={w - 2} fill="none" stroke={COLORS.amber} strokeWidth={2} />
        </g>
      ) : null}
    </g>
  );
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
  // 카메라: C 가 화면의 (CxScr, CyScr) 로 이동하며 로그 배율로 줌, 선을 수평으로 회전.
  // 끝 기울기(≈2.25)를 브리지 1→3 배의 시작 속도와 맞춰 관성이 끊기지 않게 한다.
  const zt = progress(frame, ZOOM_A, ZOOM_B, Easing.bezier(0.3, 0, 0.8, 0.55));
  const Z = Math.exp(Math.log(Z_BR) * zt);
  const mt = progress(frame, ZOOM_A - 4, ZOOM_B - 8, Easing.inOut(Easing.cubic));
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
  const [s0x, s0y] = toScr(SX, SY);
  const [ex, ey] = toScr(EX, EY);
  const worldT = `translate(${sx} ${sy}) rotate(${rot}) scale(${Z}) translate(${-CX} ${-CY})`;
  const scrAngle = LINE_ANGLE + rot;
  const chanLen = Math.hypot(ex - s0x, ey - s0y);

  const bandW = 7 + 1.95 * Z; // 앰버 구간 화면 두께 (Z_BR 에서 ≈79px)
  const look = progress(bandW, 12, 30, Easing.inOut(Easing.quad)); // 앰버 조각 → 위에서 본 트렌치
  const ribSp = (80 * Z) / Z_BR; // 월드에 붙은 리브 간격 (Z_BR 에서 80px)
  const ringO = 1 - progress(frame, ZOOM_A, ZOOM_A + 14);
  // '170km (계획)': 줌 중에도 점선 유령 위(앰버 오른쪽)를 타고 따라가며 LABEL_HOLD 까지 유지
  const mx = (ax + bx) / 2;
  const lx = Math.max(Math.min(mx, 1400), ex + 250);
  const ly = ay + ((lx - ax) * (by - ay)) / (bx - ax);
  const labelO = Math.min(progress(frame, 0, 3, Easing.linear), 1 - progress(frame, LABEL_HOLD, LABEL_HOLD + 6, Easing.linear));

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="s9-sand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d3b283" />
            <stop offset="1" stopColor="#b08c5e" />
          </linearGradient>
          <linearGradient id="s9-sea" x1="-200" y1="1100" x2="220" y2="760" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2f5c6a" />
            <stop offset="0.7" stopColor="#4f8790" />
            <stop offset="1" stopColor="#79aeaa" />
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
          {/* 바다 + 얕은 물 + 젖은 모래 + 물거품 */}
          <path d={COAST_FILL} fill="url(#s9-sea)" />
          <path d={COAST} fill="none" stroke="#8cc3bb" strokeOpacity={0.45} strokeWidth={26} />
          <path d={COAST} fill="none" stroke="#a88a62" strokeOpacity={0.45} strokeWidth={10} transform="translate(7 0)" />
          <path d={COAST} fill="none" stroke="#f4efe2" strokeOpacity={0.7} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </g>
        {/* 170km 계획선 — 시안 점선 유령 (3px·60%, 1px 어두운 윤곽) */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#3a3226" strokeOpacity={0.9} strokeWidth={5} strokeDasharray="16 12" />
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={COLORS.neon} strokeOpacity={0.6} strokeWidth={3} strokeDasharray="14 14" strokeDashoffset={-1} />
        {/* 실제 지어진 약 2.4km — 앰버 조각 → 위에서 본 트렌치 */}
        <TopChannel x={s0x} y={s0y} len={chanLen} w={bandW} angle={scrAngle} look={look} ribSp={ribSp} />
        {ringO > 0 ? (
          <g opacity={ringO * progress(frame, 2, 12)}>
            <circle cx={sx} cy={sy} r={40} fill="none" stroke="#2a1c0c" strokeOpacity={0.6} strokeWidth={6} />
            <circle cx={sx} cy={sy} r={40} fill="none" stroke={COLORS.amber} strokeWidth={3} strokeDasharray="7 6" />
          </g>
        ) : null}
      </svg>
      {labelO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: lx,
            top: ly,
            transform: `translate(-50%, -50%) rotate(${scrAngle}deg) translateY(-58px)`,
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
          <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 40, color: COLORS.neon, opacity: 0.9 }}>170km</span>
          <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: COLORS.sand }}>(계획)</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────
// 2) 트렌치 근접: 긴 회색 콘크리트 기초, 낮은 옹벽과 배관. 위로 솟은 것은 없다.
// ─────────────────────────────────────────────────────────────

// 브리지에서 1/3 배로 들어오므로 트렌치 끝이 화면 안에 보이지 않게 넉넉히 길게
const X0 = -1500;
const X1 = WIDTH + 1500;
const PIPE_REST = T_TOP - 4; // 관 더미가 놓이는 모래 선

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
    const pipeStack = Array.from({ length: 4 }, (_, i) => ({ x: 250 + (i % 2) * 18, y: PIPE_REST - 20 * (4 - i), w: 250 + random(`s9pw${i}`) * 60 }));
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
      <rect x={X0} y={-2400} width={X1 - X0} height={HEIGHT + 4800} fill={SAND} />
      <rect x={X0} y={-2400} width={X1 - X0} height={HEIGHT + 4800} fill="url(#s9-speck)" />
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
      {/* 접지 그림자 (6px, 25% 검정) */}
      <ellipse cx={250 + 9 + 150} cy={PIPE_REST + 1} rx={186} ry={3} fill="#000" opacity={0.25} />
      {geo.pipeStack.map((p, i) => (
        <g key={i}>
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
      {/* 막대 뒤 작은 받침 카드 (화면 전체 스크림 대신) */}
      <div
        style={{
          position: "absolute",
          left: BAR_X - 44,
          top: BAR_Y - 122,
          width: BAR_W + 88,
          height: BAR_H + 186,
          borderRadius: 14,
          background: `rgba(${WARM_DARK},0.74)`,
          boxShadow: "0 6px 0 rgba(0,0,0,0.12)",
        }}
      />
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
        약 2.4km
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
        170km (계획)
      </div>
    </div>
  );
};

export const S09RealityTrench: React.FC = () => {
  const frame = useCurrentFrame();

  // 브리지: 수로 중심(960, 437)으로 10프레임 동안 1→3 배 (줌 끝 속도를 이어 받아 감속) + 교차 페이드
  const bt = progress(frame, BR_A, BR_B, Easing.out(Easing.quad));
  const k = Math.exp(Math.log(BR_K) * bt);
  const aerialO = 1 - progress(frame, BR_A + 3, BR_B, Easing.inOut(Easing.quad));
  const trenchO = progress(frame, BR_A + 2, BR_B - 1, Easing.inOut(Easing.quad));
  // 트렌치는 같은 카메라 배율을 공유: 브리지 시작에 1/3 (수로 폭 일치) → 끝에 1, 이후 느린 드리프트
  const trenchScale = (k / BR_K) * (1 + 0.035 * progress(frame, BR_B, SCENE_LEN, Easing.linear));
  const origin = `50% ${((T_TOP + T_BOT) / 2 / HEIGHT) * 100}%`;

  return (
    <SceneFrame fadeIn={0} fadeOut={0} background="#17120c">
      <AbsoluteFill>
        {aerialO > 0 ? (
          <AbsoluteFill style={{ opacity: aerialO, transform: `scale(${k})`, transformOrigin: origin }}>
            <Aerial frame={frame} />
          </AbsoluteFill>
        ) : null}
        {trenchO > 0 ? (
          <AbsoluteFill style={{ opacity: trenchO, transform: `scale(${trenchScale})`, transformOrigin: origin }}>
            <TrenchStatic />
            <GhostWall frame={frame} />
          </AbsoluteFill>
        ) : null}
        {/* 한낮의 평평한 빛: 살짝 바랜 노출 */}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,246,228,0.10) 0%, rgba(255,246,228,0) 45%)" }} />
        {/* 자막용 하단 밴드: 맨 아래 180px, 55% 검정 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 180,
            background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0) 100%)",
          }}
        />
        {trenchO > 0 ? <Callout frame={frame} /> : null}
        <PlanBar frame={frame} />
      </AbsoluteFill>

      <Caption lines={[{ text: "2025년 4월 항공사진 속 현장", from: 0.3, to: 3.3 }]} />
      <Caption lines={[{ text: "170km 중 약 2.4km, 기초뿐", from: 3.3, to: 7.1 }]} />

      <Grain opacity={0.14} />
      <Vignette strength={0.35} />

      <SourceTag text="디진 · 2025.04 항공사진" position="bottomRight" start={6} stack={0} />
      <SourceTag label="계산" text="2.4 ÷ 170 = 1.4%" position="bottomRight" start={COUNT_A} stack={1} />
    </SceneFrame>
  );
};
