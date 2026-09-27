import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, SAFE, WIDTH } from "../theme";
import { fmt, progress } from "../utils/anim";
import { Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s10-headlines-2026 — 2026년 현실 타임라인, 뉴스 카드 3장. (64.0s → 75.2s, 336 frames)
 * 현실 구간: 레터박스·글로우 없음, 평평한 앰버·모래·콘크리트, 강한 Grain.
 * 공용 Headlines 는 세로 목록형이라 '가운데 큰 새 카드 + 뒤로 작아지며 흐려지는 이전 카드' 스택을 로컬로 구성한다.
 *
 *   0f       콘크리트·모래 회색 배경 + 화면을 가로지르는 170km 시안 점선 유령선(10–20% 깜빡) + 카드1 판이 이미 떠 있음
 *   ~0–4f    카드1 (64.2s) '2026.03' 삼성물산·현대건설 터널 계약 해지
 *   24f      보조줄 (64.8s) '약 10억 달러 수주(2022)'(흐린 시안) → '해지'(앰버 도장 쾅, 48f)
 *   126f     카드2 (68.2s) '2026.05' 더 라인 공사, 2030년 이후로 + 2030 인구 목표 1,500,000 → 300,000 → 약 100,000
 *            (보간 없이 2프레임 컷 전환, 각 값이 정확히 ≥0.9초 유지, 날짜 칩은 그 값이 떠 있는 동안만 켜짐)
 *   231f     카드3 (71.7s) '2026.06 수정 · 2026.07 보도' 홈페이지서 '900만 명' 문구 삭제
 *            카드가 닿으면 s02 의 9,000,000명 유령(카드 스택 위, y≈110) → 앰버-빨강 취소선 → 글자별 무작위 순서로 먼지가 됨
 *   237f     각주 (71.9s) PIF 총재 '취소된 네옴 사업 없다'
 *   끝       자체 페이드 없음 — 경계(fade)는 Main 이 처리. 마지막 프레임까지 내용이 그대로 보인다.
 */

// ── 타이밍 (프레임, 장면 기준) ──
const C1 = -2; // 64.2s 자막에 맞춰 글자가 뜨고, 0프레임에 이미 카드 판이 보이도록 살짝 앞당김
const C1_SUB = 24; // 64.8s
const C1_STAMP = 50;
const C2 = 126; // 68.2s
const N_IN = 130; // 1,500,000 정확히 130–157f (0.93s)
const DROP1 = 158; // 300,000 정확히 158–189f (1.07s)
const DROP2 = 190; // 약 100,000 정확히 190f– (카드3 이 올 때까지 1.4s)
const CUT_LEN = 2; // 값이 바뀌는 2프레임 컷 (작은 스케일 딥)
const C3 = 231; // 71.7s
const FOOT = 237; // 71.9s
const GHOST_IN = 246;
const STRIKE_A = 264;
const STRIKE_B = 278;
const DUST_A = 284;
const DUST_LEN = 12; // 글자 무작위 순서로 흩어지며 숫자 전체도 1→0
const DUST_END = DUST_A + DUST_LEN;
const HOLD_END = 346; // 마지막 카드의 느린 드리프트 끝 (핸드오프 10프레임 포함)

// ── 카드 배치 ──
const CARD_X = 200;
const CARD_W = WIDTH - CARD_X * 2; // 1520
const CARD_TOP = 350;
const STACK_DY = 92;

const WARM_DARK = "18,14,10";
const CARD_BG = "rgba(24,19,14,0.96)";
const DIM_CYAN = "rgba(56,242,255,0.62)";

// ── s09 의 170km 선: 화면 전체를 가로지르는 유령선, 왼쪽 끝이 지어진 2.4km(앰버) ──
const AX = 90;
const AY = 900;
const BX = WIDTH + 260;
const BY = 470;
const BUILT = 2.4 / 170;

// ─────────────────────────────────────────────────────────────
// 배경: 어둡게 가라앉은 한낮 사막 + 170km 유령선 깜빡임
// ─────────────────────────────────────────────────────────────

const ridgePath = (seed: number, y0: number, amp: number): string => {
  const pts: string[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = u * (WIDTH + 400) - 200;
    const y = y0 + amp * Math.sin(u * Math.PI * 2 * 1.6 + seed * 5.1) + amp * 0.4 * Math.sin(u * Math.PI * 2 * 4.1 + seed * 2.3);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

const Backdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const ridges = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({ d: ridgePath(i + 3, -10 + i * 52, 12 + random(`s10r${i}`) * 18), o: 0.1 + random(`s10ro${i}`) * 0.12 })),
    [],
  );
  // 깜빡임: 2프레임 단위 난수로 10%–20% 사이를 오간다
  const bucket = Math.floor(frame / 2);
  const lineO = 0.1 + 0.1 * random(`s10fl${bucket}`);
  const drift = frame * 0.12; // 느린 카메라 드리프트
  const ex = AX + (BX - AX) * BUILT;
  const ey = AY + (BY - AY) * BUILT;
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="s10-ground" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5a5249" />
            <stop offset="1" stopColor="#3d3830" />
          </linearGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#s10-ground)" />
        <g transform={`translate(${-drift} ${drift * 0.2})`}>
          {ridges.map((rd, i) => (
            <path key={i} d={rd.d} fill="none" stroke="#2a251f" strokeOpacity={rd.o * 1.6} strokeWidth={1.6} />
          ))}
          <line
            x1={AX}
            y1={AY}
            x2={BX}
            y2={BY}
            stroke={COLORS.neon}
            strokeWidth={1.5}
            strokeDasharray="14 10"
            opacity={lineO}
          />
          <line x1={AX} y1={AY} x2={ex} y2={ey} stroke={COLORS.amber} strokeWidth={9} strokeLinecap="round" opacity={0.9} />
          <circle cx={AX} cy={AY} r={7} fill={COLORS.amber} opacity={0.9} />
        </g>
      </svg>
      {/* 카드 뒤만 살짝 가라앉히는 그림자 (배경은 한낮 콘크리트 톤 유지) */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 45% at 50% 48%, rgba(${WARM_DARK},0.3) 0%, rgba(${WARM_DARK},0) 100%)` }} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────
// 뉴스 카드 (마스트헤드·로고 없음, 앰버 날짜 도장, 모서리 매체 텍스트)
// ─────────────────────────────────────────────────────────────

const DateStamp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 18px 5px",
      border: `3px solid ${COLORS.amber}`,
      borderRadius: 6,
      color: COLORS.amber,
      transform: "rotate(-1.5deg)",
      transformOrigin: "left center",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const Num: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 34, color }) => (
  <span style={{ fontFamily: FONTS.num, fontWeight: 700, fontSize: size, letterSpacing: 1, color }}>{children}</span>
);

const Kor: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number }> = ({ children, size = 30, color, weight = 700 }) => (
  <span style={{ fontFamily: FONTS.body, fontWeight: weight, fontSize: size, color }}>{children}</span>
);

const NewsCard: React.FC<{
  arrive: number;
  laterArrivals: number[];
  date: React.ReactNode;
  outlet: string;
  shake?: number;
  children: React.ReactNode;
}> = ({ arrive, laterArrivals, date, outlet, shake = 0, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, arrive, arrive + 16, Easing.out(Easing.cubic));
  if (p <= 0) return null;
  // 앞에 있는 동안 아주 느리게 1.02 까지 다가온다 (정지 화면 방지)
  const holdEnd = laterArrivals.length > 0 ? laterArrivals[0] : HOLD_END;
  const hold = 1 + 0.02 * progress(frame, arrive + 16, holdEnd, Easing.linear);
  // 카드 판은 빨리 불투명해져 뒤 카드를 가리고, 글자는 그 뒤에 떠오른다 (두 카드 글자가 겹쳐 읽히지 않게)
  const pBg = progress(frame, arrive, arrive + 7, Easing.out(Easing.quad));
  const pText = progress(frame, arrive + 6, arrive + 18, Easing.out(Easing.cubic));
  const depth = laterArrivals.reduce((acc, a) => acc + progress(frame, a - 2, a + 20, Easing.inOut(Easing.cubic)), 0);
  const dy = (1 - p) * 80 - depth * STACK_DY;
  const scale = (1 - depth * 0.075) * (1 + (1 - p) * 0.035) * hold;
  // 9,000,000명 유령이 떠 있는 동안 뒤 카드는 0.08 까지 가라앉혀 읽히는 층을 줄인다
  const ghostOn = progress(frame, GHOST_IN - 8, GHOST_IN + 4) * (1 - progress(frame, DUST_END, DUST_END + 12));
  const depthBase = interpolate(depth, [0, 1, 2], [1, 0.3, 0.13], { extrapolateRight: "clamp" });
  const depthO = depth > 0.5 ? depthBase + (Math.min(depthBase, 0.08) - depthBase) * ghostOn : depthBase;
  const blur = depth * 5 + (1 - p) * 3;
  // 뒤로 밀린 카드는 따뜻한 어둠 쪽으로 식는다
  const front = 1 - Math.min(1, depth);
  // 뒤로 밀린 카드는 윗부분만 남기고 아래를 지운다 (앞 카드 밑으로 삐져나오지 않게)
  const keep = interpolate(Math.min(1, depth), [0, 1], [1400, 150]);
  const mask = depth > 0.01 ? `linear-gradient(180deg, #000 0px, #000 ${keep.toFixed(0)}px, transparent ${(keep + 90).toFixed(0)}px)` : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD_X,
        top: CARD_TOP,
        width: CARD_W,
        transform: `translate(${shake}px, ${dy}px) scale(${scale})`,
        transformOrigin: "50% 0%",
        opacity: pBg * depthO,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
        maskImage: mask,
        WebkitMaskImage: mask,
        background: CARD_BG,
        border: "1px solid rgba(216,185,138,0.18)",
        borderTop: `4px solid rgba(255,179,71,${0.35 + 0.55 * front})`,
        borderRadius: 10,
        boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
        padding: "32px 56px 40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ opacity: pText }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
          <DateStamp>{date}</DateStamp>
          <Kor size={30} color={COLORS.sand} weight={500}>
            {outlet}
          </Kor>
        </div>
        {children}
      </div>
    </div>
  );
};

const Headline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 70, lineHeight: 1.2, color: COLORS.ink, letterSpacing: -1, whiteSpace: "nowrap" }}>
    {children}
  </div>
);

// ── 카드1 보조줄: '약 10억 달러 수주(2022) → 해지' ──
const Card1Sub: React.FC = () => {
  const frame = useCurrentFrame();
  const a = progress(frame, C1_SUB, C1_SUB + 14);
  const arrow = progress(frame, C1_SUB + 12, C1_SUB + 22);
  const st = progress(frame, C1_STAMP, C1_STAMP + 7, Easing.out(Easing.quad));
  const stampScale = interpolate(st, [0, 1], [1.9, 1]);
  const stampRot = interpolate(st, [0, 1], [-11, -4]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 22, height: 84 }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - a) * 14}px)`, fontFamily: FONTS.body, fontWeight: 700, fontSize: 52, color: DIM_CYAN, whiteSpace: "nowrap" }}>
        약 10억 달러 수주(2022)
      </div>
      <div style={{ opacity: arrow, transform: `translateX(${(1 - arrow) * -16}px)`, fontFamily: FONTS.body, fontWeight: 700, fontSize: 52, color: COLORS.sand }}>→</div>
      {st > 0 ? (
        <div
          style={{
            opacity: Math.min(1, st * 2.5),
            transform: `scale(${stampScale}) rotate(${stampRot}deg)`,
            fontFamily: FONTS.display,
            fontSize: 62,
            lineHeight: 1,
            color: COLORS.amber,
            border: `5px solid ${COLORS.amber}`,
            borderRadius: 8,
            padding: "10px 22px 6px",
            background: "rgba(255,179,71,0.08)",
            whiteSpace: "nowrap",
          }}
        >
          해지
        </div>
      ) : null}
    </div>
  );
};

// ── 카드2: 2030 인구 목표 1,500,000 → 300,000 → 약 100,000 ──
const STEPS = [
  { v: 1500000, chip: "원래 계획" },
  { v: 300000, chip: "블룸버그 2024.04" },
  { v: 100000, chip: "세마포 2026.05" },
];

const PopTarget: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = progress(frame, N_IN, N_IN + 6);
  // 값은 보간하지 않는다: 원래 값 → 2프레임 컷 → 정확한 다음 값
  const step = frame >= DROP2 ? 2 : frame >= DROP1 ? 1 : 0;
  const value = STEPS[step].v;
  const lastCut = step === 2 ? DROP2 : step === 1 ? DROP1 : -100;
  const inCut = frame - lastCut < CUT_LEN;
  const cutScale = inCut ? (frame - lastCut === 0 ? 0.9 : 0.96) : 1;
  const cutO = inCut ? (frame - lastCut === 0 ? 0.55 : 0.85) : 1;
  const numColor = step === 0 ? DIM_CYAN : COLORS.amber;
  // 막대는 숫자가 아니므로 부드럽게 줄어든다
  const b1 = progress(frame, DROP1, DROP1 + 10, Easing.out(Easing.exp));
  const b2 = progress(frame, DROP2, DROP2 + 10, Easing.out(Easing.exp));
  const ratio = (STEPS[0].v + (STEPS[1].v - STEPS[0].v) * b1 + (STEPS[2].v - STEPS[1].v) * b2) / STEPS[0].v;
  const BARW = 720;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(216,185,138,0.16)", opacity: appear }}>
      <div style={{ width: BARW, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: COLORS.sand, marginBottom: 4 }}>2030 인구 목표</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, transform: `scale(${cutScale})`, transformOrigin: "100% 60%", opacity: cutO }}>
          {step === 2 ? <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 48, color: COLORS.amber }}>약</span> : null}
          <span style={{ fontFamily: FONTS.num, fontWeight: 900, fontSize: 84, color: numColor, fontVariantNumeric: "tabular-nums", letterSpacing: 2, lineHeight: 1 }}>{fmt(value)}</span>
          <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 44, color: numColor }}>명</span>
        </div>
        {/* 비율 막대: 시안 윤곽 = 원래 계획, 앰버 채움 = 현재 */}
        <svg width={BARW} height={22} style={{ marginTop: 14 }}>
          <rect x={1} y={1} width={BARW - 2} height={20} rx={4} fill="none" stroke={COLORS.neon} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="10 6" />
          <rect x={BARW - 1 - (BARW - 2) * ratio} y={1} width={(BARW - 2) * ratio} height={20} rx={3} fill={step === 0 ? "rgba(56,242,255,0.35)" : COLORS.amber} />
        </svg>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {STEPS.map((s, i) => {
            const on = i === step;
            const seen = i <= step;
            return (
              <div
                key={s.chip}
                style={{
                  fontFamily: FONTS.body,
                  fontWeight: 700,
                  fontSize: 30,
                  padding: "5px 14px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  color: on ? (i === 0 ? COLORS.neon : COLORS.amber) : COLORS.concrete,
                  border: `2px solid ${on ? (i === 0 ? "rgba(56,242,255,0.6)" : COLORS.amber) : "rgba(138,143,152,0.4)"}`,
                  background: on ? "rgba(255,179,71,0.08)" : "transparent",
                  opacity: on ? 1 : seen ? 0.55 : 0.2,
                }}
              >
                {s.chip}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 카드3: s02 의 9,000,000명 유령 → 취소선 → 먼지
// 글자는 무작위 순서로 하나씩 사라지고 숫자 전체도 같은 12프레임에 1→0 으로 빠져서
// 부분 숫자(예: '100,000')가 읽히는 순간이 없다. 카드 스택 위(y≈110)에 뜬다.
// ─────────────────────────────────────────────────────────────

const GHOST_W = 880;
const GHOST_H = 130;
const GHOST_LEFT = (WIDTH - GHOST_W) / 2;
const GHOST_TOP = 45; // 중심 y≈110
const GHOST_CHARS = [...fmt(9000000)];
const GHOST_NUM_SIZE = 104;
const GHOST_CHAR_W = 76; // Orbitron 104px 한 글자 폭 근사 (먼지 발생 위치용)

const GhostNine: React.FC = () => {
  const frame = useCurrentFrame();
  // 글자별 소멸 순서: seed 로 섞은 무작위 순서
  const order = useMemo(() => {
    const idx = GHOST_CHARS.map((_, i) => i);
    return idx.map((i) => ({ i, k: random(`s10go${i}`) })).sort((a, b) => a.k - b.k).map((o) => o.i);
  }, []);
  const particles = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => ({
        g: Math.floor(random(`s10pg${i}`) * (GHOST_CHARS.length + 1)), // 마지막 칸 = '명'
        ox: random(`s10pu${i}`),
        y: 20 + random(`s10py${i}`) * (GHOST_H - 40),
        vx: 20 + random(`s10vx${i}`) * 140,
        vy: -(20 + random(`s10vy${i}`) * 100),
        s: 2.5 + random(`s10ps${i}`) * 6,
        life: 16 + random(`s10pl${i}`) * 14,
        c: random(`s10pc${i}`),
      })),
    [],
  );
  const rise = progress(frame, GHOST_IN, GHOST_IN + 18, Easing.out(Easing.cubic));
  if (rise <= 0) return null;
  const strike = progress(frame, STRIKE_A, STRIKE_B, Easing.inOut(Easing.cubic));
  // 숫자 전체가 DUST_A→DUST_END 동안 1→0
  const whole = 1 - progress(frame, DUST_A, DUST_END, Easing.linear);
  const slot = DUST_LEN / (GHOST_CHARS.length + 1);
  const dieAt = (g: number): number => {
    const rank = g < GHOST_CHARS.length ? order.indexOf(g) : GHOST_CHARS.length;
    return DUST_A + rank * slot;
  };
  const charO = (g: number): number => 1 - progress(frame, dieAt(g), dieAt(g) + 2, Easing.linear);
  // 먼지 발생 위치: 가운데 정렬된 글자 줄 기준 근사
  const rowW = GHOST_CHARS.length * GHOST_CHAR_W + 14 + 50;
  const rowX0 = (GHOST_W - rowW) / 2;
  const glyphX = (g: number): number => (g < GHOST_CHARS.length ? rowX0 + g * GHOST_CHAR_W : rowX0 + GHOST_CHARS.length * GHOST_CHAR_W + 14);
  const glyphW = (g: number): number => (g < GHOST_CHARS.length ? GHOST_CHAR_W : 50);
  return (
    <div style={{ position: "absolute", left: GHOST_LEFT, top: GHOST_TOP + (1 - rise) * 40, width: GHOST_W, height: GHOST_H, opacity: rise }}>
      {whole > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: whole }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: COLORS.neon,
              opacity: 0.55 - 0.15 * strike,
            }}
          >
            <span style={{ fontFamily: FONTS.num, fontWeight: 900, fontSize: GHOST_NUM_SIZE, letterSpacing: 2, lineHeight: 1, whiteSpace: "nowrap" }}>
              {GHOST_CHARS.map((ch, g) => (
                <span key={g} style={{ opacity: charO(g) }}>
                  {ch}
                </span>
              ))}
            </span>
            <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 50, opacity: charO(GHOST_CHARS.length) }}>명</span>
          </div>
          <svg width={GHOST_W} height={GHOST_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="s10-strike" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={COLORS.amber} />
                <stop offset="1" stopColor={COLORS.danger} />
              </linearGradient>
            </defs>
            <line
              x1={40}
              y1={GHOST_H / 2 + 14}
              x2={40 + (GHOST_W - 80) * strike}
              y2={GHOST_H / 2 + 14 - 22 * strike}
              stroke="url(#s10-strike)"
              strokeWidth={11}
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : null}
      {/* 먼지: 각 글자가 사라지는 순간 그 자리에서 흩어진다 */}
      {frame >= DUST_A ? (
        <svg width={GHOST_W} height={GHOST_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {particles.map((pt, i) => {
            const born = dieAt(pt.g);
            const t = frame - born;
            if (t < 0 || t > pt.life) return null;
            const k = t / pt.life;
            const x = glyphX(pt.g) + pt.ox * glyphW(pt.g) + pt.vx * k;
            const y = pt.y + pt.vy * k + 30 * k * k;
            const col = pt.c < 0.35 ? COLORS.amber : pt.c < 0.5 ? COLORS.danger : pt.c < 0.8 ? COLORS.sand : "rgba(56,242,255,0.8)";
            return <rect key={i} x={x} y={y} width={pt.s * (1 - k * 0.5)} height={pt.s * (1 - k * 0.5)} fill={col} opacity={(1 - k) * 0.85} />;
          })}
        </svg>
      ) : null}
    </div>
  );
};

// ── 하단 회색 각주 ──
const Footnote: React.FC = () => {
  const frame = useCurrentFrame();
  const a = progress(frame, FOOT, FOOT + 14);
  if (a <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x + 80,
        bottom: SAFE.y + 96,
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity: a,
        transform: `translateY(${(1 - a) * 18}px)`,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ width: 4, height: 58, background: COLORS.concrete, opacity: 0.7 }} />
      <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 52, color: "#b7bcc4", letterSpacing: -0.5, textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>
        PIF 총재 ‘취소된 네옴 사업 없다’
      </div>
    </div>
  );
};

export const S10Headlines2026: React.FC = () => {
  const frame = useCurrentFrame();
  // '해지' 도장 / 카드3 착지 순간의 아주 작은 흔들림
  const shakeAt = (at: number, amp: number) => {
    const t = frame - at;
    if (t < 0 || t > 8) return 0;
    return amp * Math.sin(t * 2.6) * (1 - t / 8);
  };
  const shake1 = shakeAt(C1_STAMP + 5, 5);
  const shake3 = shakeAt(C3 + 14, 3);

  return (
    <SceneFrame fadeIn={0} fadeOut={0} background="#3d3830">
      <AbsoluteFill>
        <Backdrop frame={frame} />

        <NewsCard
          arrive={C1}
          laterArrivals={[C2, C3]}
          outlet="현대건설 공시"
          shake={shake1}
          date={<Num>2026.03</Num>}
        >
          <Headline>삼성물산·현대건설 터널 계약 해지</Headline>
          <Card1Sub />
        </NewsCard>

        <NewsCard arrive={C2} laterArrivals={[C3]} outlet="세마포 보도" date={<Num>2026.05</Num>}>
          <Headline>더 라인 공사, 2030년 이후로</Headline>
          <PopTarget />
        </NewsCard>

        <NewsCard
          arrive={C3}
          laterArrivals={[]}
          outlet="AGBI 보도"
          shake={shake3}
          date={
            <>
              <Num>2026.06</Num>
              <Kor size={30}>수정</Kor>
              <Kor size={30} color={COLORS.sand}>
                ·
              </Kor>
              <Num>2026.07</Num>
              <Kor size={30}>보도</Kor>
            </>
          }
        >
          <Headline>
            홈페이지서 <span style={{ color: COLORS.amber }}>‘900만 명’</span> 문구 삭제
          </Headline>
        </NewsCard>

        <GhostNine />

        {/* 각주·출처 가독성용 하단 띠 */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(0deg, rgba(${WARM_DARK},0.85) 0%, rgba(${WARM_DARK},0.5) 16%, rgba(${WARM_DARK},0) 30%)`,
            opacity: progress(frame, FOOT - 6, FOOT + 10),
          }}
        />
        <Footnote />
      </AbsoluteFill>

      <Grain opacity={0.22} />
      <Vignette strength={0.35} />

      <SourceTag text="현대건설 공시 · 2026.03" start={C1 + 6} end={C2 + 2} stack={0} />
      <SourceTag text="세마포 보도 · 2026.05" start={C2 + 6} end={C3 + 2} stack={0} />
      <SourceTag text="30만: 블룸버그 · 2024.04" start={DROP1 + 2} end={C3 + 2} stack={1} />
      <SourceTag text="AGBI 보도 · 2026.07" start={C3 + 6} end={HOLD_END + 20} stack={0} />
      <SourceTag text="PIF 이사회 발표 보도 · 2026.04" start={FOOT + 4} end={HOLD_END + 20} stack={1} />
    </SceneFrame>
  );
};
