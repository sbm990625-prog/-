import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { progress } from "../utils/anim";
import { Grain, LineAerial, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s12-end-card — 오프닝(s01)의 170km 빛의 선을 같은 카메라·같은 좌표로 되받는 엔드 카드.
 * 첫 프레임은 s01 과 같은 구도(선 전체가 빛남) → 약 0.6초 유지 → 먼 끝(1400,520)부터 구간별로 지직거리며 꺼지고,
 * 카메라가 꺼지는 선을 따라 x1 끝의 2.4km 앰버 불씨로 옆걸음(달리)해 불씨가 화면 가운데에 선다.
 * 84.8s → 91s (186 frames). 끝(90.0s~): 불씨가 꺼지고 레터박스가 40px 닫히며 약 0.9초 동안 검정으로.
 * 자막 타이밍(절대): L1 85.1–87.4 / L2 87.4–91.0 / 락업 87.4–91.0 → 장면 기준 0.3–2.6 / 2.6–6.2.
 */

// ── 타이밍 (프레임, 장면 기준) ────────────────────────────────
const F_HOLD = 13; // 0–13: 선 전체가 최대 밝기로 유지 (s01 의 마지막 인상)
const F_KILL0 = 18; // 첫 구간(먼 끝)이 꺼지는 프레임 (지직임은 5프레임 전부터)
const KILL_STEP = 4; // 구간 사이 간격
const N_SEG = 12;
const F_EMBER = F_KILL0 + (N_SEG - 1) * KILL_STEP; // 마지막 시안 구간이 꺼짐 → 불씨가 앰버로
const F_L1_IN = 9; // 85.1s
const F_L1_OUT = 78; // 87.4s
const F_L2_IN = 78; // 87.4s
const F_LOCK_IN = 84;
const F_REFL_GONE = 114; // 88.6s — 반사는 여기까지 완전히 사라진다
const F_END_DIM = 156; // 90.0s — 불씨 꺼짐 + 레터박스 닫힘 시작
const F_BLACK0 = 159; // 검정 페이드 시작 (~0.9s)
const F_END = 186;

// ── 궤도 시점 지면 (s01 LineAerial 카메라와 완전히 같은 값) ─────────
const PERSP = 1400;
const TILT = 50; // deg
const SX = 1.8;
const SY = 1.6;
const PLANE_CY = 640;
/** s01 과 같은 선. x1 = 카메라 쪽 끝(해안) = 실제 지어진 2.4km 불씨, x2 = 먼 끝 */
const LINE = { x1: 600, y1: 660, x2: 1400, y2: 520 };
const BUILT = 2.4 / 170;
/** 평면을 왼쪽(바다)으로 넓혀, 카메라가 옆으로 움직여도 가장자리가 보이지 않게 */
const PLANE_EXT = 1400;

const project = (x: number, y: number): { x: number; y: number; s: number } => {
  const t = (TILT * Math.PI) / 180;
  const u = (x - WIDTH / 2) * SX;
  const v = (y - HEIGHT / 2) * SY;
  const Y = v * Math.cos(t);
  const Z = v * Math.sin(t);
  const s = PERSP / (PERSP - Z);
  return { x: WIDTH / 2 + u * s, y: HEIGHT / 2 + (PLANE_CY + Y - HEIGHT / 2) * s, s };
};

const HORIZON_Y = project(WIDTH / 2, 0).y;
const lerpPt = (t: number) => ({ x: LINE.x1 + (LINE.x2 - LINE.x1) * t, y: LINE.y1 + (LINE.y2 - LINE.y1) * t });
const EMBER_PLANE = lerpPt(BUILT / 2);
const EMBER = project(EMBER_PLANE.x, EMBER_PLANE.y);

// ── 카메라: 0.5초 s01 구도 유지 → 꺼지는 선을 따라 불씨 쪽으로 달리 ─────
const CAM_ZOOM = 1.1;
const CAM_TX = WIDTH / 2 - EMBER.x; // 불씨가 가로 가운데로
const CAM_TY = -40;
const camera = (frame: number) => {
  const p = progress(frame, F_HOLD + 1, 150, Easing.inOut(Easing.sin));
  const drift = progress(frame, 150, F_END, Easing.linear);
  return { tx: CAM_TX * p, ty: CAM_TY * p, s: 1 + (CAM_ZOOM - 1) * p + 0.015 * drift };
};

/** 구간 k (0 = 먼 끝 x2) 의 밝기: 켜짐 → 지직 → 식어서 꺼짐 */
const segIntensity = (frame: number, k: number): number => {
  const kill = F_KILL0 + k * KILL_STEP;
  if (frame < kill - 5) return 1;
  if (frame < kill) return random(`s12-fl-${k}-${frame}`) < 0.45 ? 0.2 : 1.15;
  return Math.exp(-(frame - kill) / 3.2);
};

/** 아직 켜져 있는 선의 비율 (0..1) — 지평선 빛·그리드가 따라 식는다 */
const litFraction = (frame: number): number => {
  let lit = 0;
  for (let k = 0; k < N_SEG; k++) lit += Math.min(1, segIntensity(frame, k));
  return lit / N_SEG;
};

/** 마지막 1초: 불씨가 어두워짐 */
const endDimAt = (frame: number): number => 1 - progress(frame, F_END_DIM, F_END_DIM + 22, Easing.in(Easing.quad));

// ── 하늘 + 별 (무한히 먼 배경 — 카메라 옆걸음에 따라 움직이지 않음) ─────
const Sky: React.FC<{ lit: number }> = ({ lit }) => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        x: random(`s12-sx${i}`) * WIDTH,
        y: 60 + random(`s12-sy${i}`) * (HORIZON_Y - 40),
        r: 0.6 + random(`s12-sr${i}`) ** 3 * 2.2,
        ph: random(`s12-sp${i}`) * Math.PI * 2,
        sp: 0.05 + random(`s12-ss${i}`) * 0.1,
        b: 0.35 + random(`s12-sb${i}`) * 0.65,
      })),
    [],
  );
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="s12-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03040b" />
          <stop offset={(HORIZON_Y / HEIGHT) * 0.8} stopColor="#0a0c24" />
          <stop offset={HORIZON_Y / HEIGHT} stopColor={interpolateColors(lit, [0, 1], ["#120f22", "#1a1440"])} />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#s12-sky)" />
      {stars.map((s, i) => {
        const tw = 0.55 + 0.45 * Math.sin(frame * s.sp * 2 + s.ph);
        // 도시의 빛이 꺼질수록 별이 조금 더 또렷해진다
        return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8ecff" opacity={s.b * tw * (0.7 + 0.3 * (1 - lit))} />;
      })}
    </svg>
  );
};

// ── 지면 위 옅은 측정 그리드 (넓힌 평면 전체) ─────────────────────
const PlaneGrid: React.FC<{ opacity: number }> = ({ opacity }) => {
  const lines = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let x = -PLANE_EXT; x <= WIDTH; x += 120) out.push(<line key={`gx${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} />);
    for (let y = 0; y <= HEIGHT; y += 120) out.push(<line key={`gy${y}`} x1={-PLANE_EXT} y1={y} x2={WIDTH} y2={y} />);
    return out;
  }, []);
  return (
    <svg width={WIDTH + PLANE_EXT} height={HEIGHT} viewBox={`${-PLANE_EXT} 0 ${WIDTH + PLANE_EXT} ${HEIGHT}`} style={{ position: "absolute", left: -PLANE_EXT, top: 0 }}>
      <g stroke={COLORS.neon} strokeOpacity={opacity} strokeWidth={1.2}>
        {lines}
      </g>
    </svg>
  );
};

// ── 구간별로 꺼지는 170km 선 + 2.4km 불씨 (평면 좌표) ─────────────
const DyingLine: React.FC = () => {
  const frame = useCurrentFrame();
  const segs = useMemo(
    () =>
      Array.from({ length: N_SEG }, (_, k) => {
        const tB = 1 - (k / N_SEG) * (1 - BUILT);
        const tA = 1 - ((k + 1) / N_SEG) * (1 - BUILT);
        return { a: lerpPt(tA), b: lerpPt(tB), k };
      }),
    [],
  );
  // 유지 구간: s01 처럼 숨 쉬는 시안 빛
  const breathe = 0.9 + 0.1 * Math.sin(frame / 5);
  const emberT = progress(frame, F_EMBER - 2, F_EMBER + 16, Easing.inOut(Easing.cubic));
  const emberColor = interpolateColors(emberT, [0, 1], [COLORS.neon, COLORS.ember]);
  const breath = 0.82 + 0.18 * Math.sin((frame - F_EMBER) / 9);
  const endDim = endDimAt(frame);
  const emberI = (emberT < 1 ? 1 : breath) * endDim;
  const a0 = lerpPt(0);
  const a1 = lerpPt(BUILT);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="s12-glow" filterUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
          <feGaussianBlur stdDeviation={14} />
        </filter>
        <radialGradient id="s12-spill">
          <stop offset="0" stopColor={COLORS.ember} stopOpacity={0.55} />
          <stop offset="0.35" stopColor={COLORS.ember} stopOpacity={0.18} />
          <stop offset="1" stopColor={COLORS.ember} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* 계획의 유령: 꺼진 뒤에도 170km 가 흐린 점선으로 남는다 */}
      <line
        x1={LINE.x1}
        y1={LINE.y1}
        x2={LINE.x2}
        y2={LINE.y2}
        stroke={COLORS.neon}
        strokeOpacity={0.16 * progress(frame, F_KILL0, F_KILL0 + 10) * endDim}
        strokeWidth={1.8}
        strokeDasharray="7 9"
      />
      {/* s01 과 같은 층: 블러 번짐 + 시안 외피 + 흰 심지 */}
      <g filter="url(#s12-glow)">
        {segs.map(({ a, b, k }) => {
          const i = segIntensity(frame, k) * (frame < F_KILL0 - 5 ? breathe : 1);
          if (i < 0.01) return null;
          return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.neon} strokeOpacity={Math.min(1, 0.55 * i)} strokeWidth={22} />;
        })}
      </g>
      {segs.map(({ a, b, k }) => {
        const i = segIntensity(frame, k) * (frame < F_KILL0 - 5 ? breathe : 1);
        if (i < 0.01) return null;
        return (
          <g key={k}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLORS.neon} strokeOpacity={Math.min(1, 0.55 * i)} strokeWidth={9} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#f2feff" strokeOpacity={Math.min(1, i)} strokeWidth={3.2} />
          </g>
        );
      })}
      {/* 꺼지는 순간의 작은 스파크 (구간의 불씨 쪽 끝) */}
      {segs.map(({ a, k }) => {
        const kill = F_KILL0 + k * KILL_STEP;
        const sp = frame >= kill && frame < kill + 5 ? 1 - (frame - kill) / 5 : 0;
        if (sp <= 0) return null;
        return (
          <g key={`sp${k}`} opacity={sp}>
            <circle cx={a.x} cy={a.y} r={10 + 8 * (1 - sp)} fill={COLORS.neon} opacity={0.25} />
            <circle cx={a.x} cy={a.y} r={3.5} fill="#f2feff" />
          </g>
        );
      })}
      {/* 2.4km — 지면에 번지는 불씨 빛 */}
      <ellipse cx={EMBER_PLANE.x} cy={EMBER_PLANE.y} rx={90 * (0.85 + 0.15 * breath)} ry={90 * (0.85 + 0.15 * breath)} fill="url(#s12-spill)" opacity={emberT * emberI} />
      <line x1={a0.x} y1={a0.y} x2={a1.x} y2={a1.y} stroke={emberColor} strokeOpacity={emberI} strokeWidth={9} strokeLinecap="round" />
      <line x1={a0.x} y1={a0.y} x2={a1.x} y2={a1.y} stroke="#fff4e0" strokeOpacity={emberI * (0.6 + 0.4 * emberT)} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
};

/** 화면 공간의 불씨 후광 (지면 원근에 눌리지 않는 공기 중의 빛) */
const EmberHalo: React.FC = () => {
  const frame = useCurrentFrame();
  const emberT = progress(frame, F_EMBER - 2, F_EMBER + 20, Easing.inOut(Easing.cubic));
  const breath = 0.8 + 0.2 * Math.sin((frame - F_EMBER) / 9);
  const o = emberT * breath * endDimAt(frame);
  if (o <= 0.001) return null;
  const r = 150 * (0.9 + 0.1 * breath);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: EMBER.x - r,
          top: EMBER.y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,214,160,0.55) 0%, rgba(255,159,67,0.28) 14%, rgba(255,159,67,0.08) 42%, rgba(255,159,67,0) 70%)`,
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: EMBER.x - 4,
          top: EMBER.y - 4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#fff6e8",
          boxShadow: `0 0 10px #ffd9a8, 0 0 24px ${COLORS.ember}`,
          opacity: o,
        }}
      />
    </>
  );
};

// ── 카메라 + 세계 ──────────────────────────────────────────────
const World: React.FC = () => {
  const frame = useCurrentFrame();
  const lit = litFraction(frame);
  const cam = camera(frame);
  return (
    <AbsoluteFill>
      <Sky lit={lit} />
      <AbsoluteFill style={{ transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`, transformOrigin: `${EMBER.x}px ${EMBER.y}px` }}>
        <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${WIDTH / 2}px ${HEIGHT / 2}px` }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: PLANE_CY - HEIGHT / 2,
              width: WIDTH,
              height: HEIGHT,
              transform: `rotateX(${TILT}deg) scale(${SX}, ${SY})`,
              transformOrigin: "50% 50%",
            }}
          >
            {/* 왼쪽 바다 연장 (LineAerial 바다의 가장 먼 색) */}
            <div style={{ position: "absolute", left: -PLANE_EXT, top: 0, width: PLANE_EXT + 4, height: HEIGHT, background: "#061a30" }} />
            {/* s01 과 같은 사막·바다 바탕 (선은 아래에서 직접 그린다) */}
            <LineAerial draw={0} night sea thickness={0.01} x1={LINE.x1} y1={LINE.y1} x2={LINE.x2} y2={LINE.y2} />
            <div
              style={{
                position: "absolute",
                left: -PLANE_EXT,
                right: 0,
                top: 0,
                bottom: 0,
                background: `linear-gradient(180deg, rgba(6,7,22,${0.72 + 0.1 * (1 - lit)}) 0%, rgba(6,7,22,${0.38 + 0.18 * (1 - lit)}) 45%, rgba(4,5,14,${0.5 + 0.15 * (1 - lit)}) 100%)`,
              }}
            />
            <PlaneGrid opacity={0.035 + 0.035 * lit} />
            <DyingLine />
          </div>
        </AbsoluteFill>
        {/* 지평선 대기광 — 도시의 빛이 꺼질수록 식는다 */}
        <div
          style={{
            position: "absolute",
            left: -WIDTH,
            right: -WIDTH,
            top: HORIZON_Y - 110,
            height: 200,
            opacity: 0.35 + 0.65 * lit,
            background: `linear-gradient(180deg, rgba(10,12,36,0) 0%, rgba(90,64,200,0.30) 48%, rgba(150,200,255,0.30) 55%, rgba(40,30,96,0.35) 60%, rgba(5,6,15,0) 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -WIDTH,
            right: -WIDTH,
            top: HORIZON_Y,
            height: 2,
            opacity: 0.4 + 0.6 * lit,
            background: `linear-gradient(90deg, rgba(56,242,255,0) 0%, rgba(160,220,255,0.55) 38%, rgba(160,220,255,0.55) 62%, rgba(56,242,255,0) 100%)`,
          }}
        />
        <EmberHalo />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 텍스트 ─────────────────────────────────────────────────────
const L1_Y = 826; // 선 아래, 선의 경로와 겹치지 않는 자리
const L2_TOP = 392;
const L2_SIZE = 92;
const L2_H = Math.round(L2_SIZE * 1.25);
const REFL_GAP = 36; // L2 글자 아래 반사 글자까지의 거리
/** 줄 상자 안에서 글자가 차지하지 않는 위·아래 여백 — 반사를 글자 기준으로 36px 에 맞추려고 뺀다 */
const REFL_PAD = 62;
const LOCK_Y = 880;

const Center: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", ...style }}>{children}</div>
);

/** 문장 속 숫자: 본문 서체(Noto Sans KR 700) + 강조색 */
const Num: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span style={{ fontFamily: FONTS.body, fontWeight: 700, color, textShadow: `0 0 18px ${color}66, 0 2px 8px rgba(0,0,0,0.9)` }}>{children}</span>
);

const LineOne: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = progress(frame, F_L1_IN, F_L1_IN + 18);
  const outP = progress(frame, F_L1_OUT - 12, F_L1_OUT, Easing.in(Easing.cubic));
  const o = inP * (1 - outP);
  if (o <= 0) return null;
  // 170km 는 선과 함께 식어 간다 (시안 → 강철빛)
  const promiseCol = interpolateColors(progress(frame, F_KILL0, F_EMBER + 6), [0, 1], [COLORS.neon, "#7fb9c4"]);
  const emberCol = interpolateColors(progress(frame, F_EMBER - 4, F_EMBER + 14), [0, 1], ["#e9d2b4", COLORS.ember]);
  return (
    <Center top={L1_Y} style={{ opacity: o, transform: `translateY(${(1 - inP) * 20 - outP * 10}px)` }}>
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 62,
          color: COLORS.ink,
          letterSpacing: -0.5,
          whiteSpace: "nowrap",
          textShadow: "0 2px 10px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.8)",
        }}
      >
        <Num color={promiseCol}>170km</Num>의 약속, <Num color={emberCol}>2.4km</Num>의 기초
      </div>
    </Center>
  );
};

const L2_TEXT = "그 거울은 누구의 미래를 비췄을까";
const L2_STYLE: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: L2_SIZE,
  lineHeight: `${L2_H}px`,
  height: L2_H,
  color: "#fff3e2",
  letterSpacing: -0.5,
  whiteSpace: "nowrap",
};

/** 거울면처럼 뒤집힌 옅은 반사 — 0.15 로 생겼다가 물결치며 88.6s 까지 완전히 사라진다 */
const Reflection: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = progress(frame, F_L2_IN + 4, F_L2_IN + 14);
  const vanish = progress(frame, F_L2_IN + 18, F_REFL_GONE, Easing.in(Easing.quad));
  const o = 0.15 * appear * (1 - vanish);
  const amp = interpolate(frame, [F_L2_IN, F_REFL_GONE], [14, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const fy = 0.05 + 0.012 * Math.sin(frame * 0.35);
  const fx = 0.004 + 0.001 * Math.cos(frame * 0.27);
  return (
    <div style={{ position: "relative", width: 1600, height: L2_H, marginTop: REFL_GAP - 3.5 - REFL_PAD }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="s12-ripple" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="turbulence" baseFrequency={`${fx} ${fy}`} numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={amp} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={3} />
        </filter>
      </svg>
      {o > 0.002 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: o,
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", filter: "url(#s12-ripple)" }}>
            <div style={{ ...L2_STYLE, transform: "scaleY(-1)" }}>{L2_TEXT}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const LineTwo: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = progress(frame, F_L2_IN, F_L2_IN + 22, Easing.out(Easing.cubic));
  // 마지막으로 읽히는 글자는 락업 — L2 가 먼저 물러난다
  const outP = progress(frame, F_END_DIM - 6, F_END_DIM + 16, Easing.in(Easing.quad));
  const o = inP * (1 - outP);
  if (o <= 0) return null;
  const surface = progress(frame, F_L2_IN + 6, F_L2_IN + 30, Easing.inOut(Easing.cubic)) * (1 - progress(frame, F_REFL_GONE - 10, F_REFL_GONE + 16));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L2_TOP, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          ...L2_STYLE,
          opacity: o,
          transform: `translateY(${(1 - inP) * 18}px) scale(${1.03 - 0.03 * inP})`,
          textShadow: "0 3px 14px rgba(0,0,0,0.9), 0 0 42px rgba(255,190,120,0.18)",
        }}
      >
        {L2_TEXT}
      </div>
      {/* 거울면 — 가는 수평선 */}
      <div
        style={{
          width: 1180 * surface,
          height: 1.5,
          marginTop: 2,
          background: "linear-gradient(90deg, rgba(255,243,226,0) 0%, rgba(255,243,226,0.4) 50%, rgba(255,243,226,0) 100%)",
          opacity: o,
        }}
      />
      <Reflection />
    </div>
  );
};

const Lockup: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = progress(frame, F_LOCK_IN, F_LOCK_IN + 22);
  const o = inP;
  if (o <= 0) return null;
  const rule = progress(frame, F_LOCK_IN + 6, F_LOCK_IN + 36, Easing.inOut(Easing.cubic));
  const latin: React.CSSProperties = { fontFamily: FONTS.num, fontWeight: 700, fontSize: 38, letterSpacing: 5, color: "#cfc7bb" };
  const paren: React.CSSProperties = { fontFamily: FONTS.body, fontWeight: 300, fontSize: 44, color: "#a79f94", margin: "0 4px 0 8px" };
  return (
    <Center top={LOCK_Y} style={{ opacity: o, transform: `translateY(${(1 - inP) * 12}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ width: 120 * rule, height: 1.5, background: `linear-gradient(90deg, transparent, ${COLORS.ember}aa)` }} />
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 54,
            color: "#efe8de",
            letterSpacing: 2,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "baseline",
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          네옴<span style={paren}>(</span>
          <span style={latin}>NEOM</span>
          <span style={{ ...paren, margin: 0 }}>)</span>
          <span style={{ color: COLORS.ember, margin: "0 26px", fontFamily: FONTS.body, fontWeight: 900 }}>·</span>
          더 라인<span style={paren}>(</span>
          <span style={latin}>THE LINE</span>
          <span style={{ ...paren, margin: 0 }}>)</span>
        </div>
        <div style={{ width: 120 * rule, height: 1.5, background: `linear-gradient(270deg, transparent, ${COLORS.ember}aa)` }} />
      </div>
    </Center>
  );
};

/** 레터박스: 들어올 때 열리고, 90.0s 부터 40px 더 닫힌다 */
const ClosingLetterBox: React.FC = () => {
  const frame = useCurrentFrame();
  const h = 84 * progress(frame, 0, 20) + 40 * progress(frame, F_END_DIM, F_END - 2, Easing.inOut(Easing.cubic));
  if (h <= 0.5) return null;
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: "#000" }} />
    </>
  );
};

export const S12EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  // 검정으로 페이드 (~0.9s) — 마지막 프레임은 완전한 검정
  const black = progress(frame, F_BLACK0, F_END - 1, Easing.inOut(Easing.quad));
  const l1Band = progress(frame, F_L1_IN - 4, F_L1_IN + 14) * (1 - progress(frame, F_L1_OUT - 8, F_L1_OUT + 6));
  const l2Band = progress(frame, F_L2_IN - 8, F_L2_IN + 16);
  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <World />
      {/* 글자 가독용 어둠 띠 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: L1_Y - 70,
          height: 230,
          background: "radial-gradient(ellipse 42% 50% at 50% 50%, rgba(3,4,10,0.7) 0%, rgba(3,4,10,0.35) 55%, rgba(3,4,10,0) 100%)",
          opacity: l1Band,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: L2_TOP - 90,
          height: 300,
          background: "radial-gradient(ellipse 52% 50% at 50% 45%, rgba(3,4,10,0.7) 0%, rgba(3,4,10,0.38) 55%, rgba(3,4,10,0) 100%)",
          opacity: l2Band,
        }}
      />
      <LineOne />
      <LineTwo />
      <Lockup />
      <Grain opacity={0.06} />
      <Vignette strength={0.66} />
      <ClosingLetterBox />
      <SourceTag text="2.4km: 디진 2025.04 항공사진" start={F_L1_IN + 4} end={F_END_DIM - 8} />
      {black > 0 ? <AbsoluteFill style={{ background: "#000", opacity: black }} /> : null}
    </SceneFrame>
  );
};
