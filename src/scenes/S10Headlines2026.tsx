import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, HEIGHT, SAFE, WIDTH } from "../theme";
import { fmt, progress } from "../utils/anim";
import { Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s10-headlines-2026 — 2026년 현실 타임라인, 뉴스 카드 3장. (64.0s → 75.2s, 336 frames)
 * 현실 구간: 레터박스·글로우 없음, 평평한 앰버·모래·콘크리트, 강한 Grain.
 * 공용 Headlines 는 세로 목록형이라 '가운데 큰 새 카드 + 뒤로 작아지며 흐려지는 이전 카드' 스택을 로컬로 구성한다.
 *
 *   0–14f    s09 의 whoosh push 를 이어받아 오른쪽에서 밀려 들어옴. 뒤로 s09 과 같은 자리의 170km 시안 점선 유령선이 깜빡
 *   6f       카드1 (64.2s) '2026.03' 삼성물산·현대건설 터널 계약 해지
 *   24f      보조줄 (64.8s) '약 10억 달러 수주(2022)'(흐린 시안) → '해지'(앰버 도장 쾅, 48f)
 *   126f     카드2 (68.2s) '2026.05' 더 라인 공사, 2030년 이후로 + 2030 인구 목표 1,500,000 → 300,000 → 약 100,000
 *   231f     카드3 (71.7s) '2026.06 수정 · 2026.07 보도' 홈페이지서 '900만 명' 문구 삭제
 *            카드가 닿으면 s02 의 9,000,000명 유령 → 앰버-빨강 취소선 → 먼지로 흩어짐
 *   237f     각주 (71.9s) PIF 총재 '취소된 네옴 사업 없다'
 *   322–336f fade
 */

// ── 타이밍 (프레임, 장면 기준) ──
const C1 = 6; // 64.2s
const C1_SUB = 24; // 64.8s
const C1_STAMP = 50;
const C2 = 126; // 68.2s
const N_IN = 140;
const DROP1 = 158;
const DROP2 = 186;
const DROP_LEN = 16;
const C3 = 231; // 71.7s
const FOOT = 237; // 71.9s
const GHOST_IN = 246;
const STRIKE_A = 264;
const STRIKE_B = 278;
const DUST_A = 284;
const DUST_B = 308;

// ── 카드 배치 ──
const CARD_X = 200;
const CARD_W = WIDTH - CARD_X * 2; // 1520
const CARD_TOP = 350;
const STACK_DY = 92;

const WARM_DARK = "18,14,10";
const CARD_BG = "rgba(24,19,14,0.96)";
const DIM_CYAN = "rgba(56,242,255,0.62)";

// ── s09 과 같은 170km 선 ──
const AX = 250;
const AY = 800;
const BX = 1690;
const BY = 566;
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
  // 깜빡임: 2프레임 단위 난수로 가끔 꺼졌다 켜진다
  const bucket = Math.floor(frame / 2);
  const r = random(`s10fl${bucket}`);
  const flicker = r < 0.1 ? 0.25 : r < 0.18 ? 0.6 : 1;
  const lineIn = progress(frame, 0, 18);
  const drift = frame * 0.12; // 느린 카메라 드리프트
  const ex = AX + (BX - AX) * BUILT;
  const ey = AY + (BY - AY) * BUILT;
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="s10-ground" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b3024" />
            <stop offset="1" stopColor="#241c14" />
          </linearGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#s10-ground)" />
        <g transform={`translate(${-drift} ${drift * 0.2})`}>
          {ridges.map((rd, i) => (
            <path key={i} d={rd.d} fill="none" stroke="#0e0a06" strokeOpacity={rd.o} strokeWidth={1.6} />
          ))}
          <line
            x1={AX}
            y1={AY}
            x2={BX}
            y2={BY}
            stroke={COLORS.neon}
            strokeWidth={3}
            strokeDasharray="16 12"
            strokeLinecap="round"
            opacity={0.3 * flicker * lineIn}
          />
          <line x1={AX} y1={AY} x2={ex} y2={ey} stroke={COLORS.amber} strokeWidth={8} strokeLinecap="round" opacity={0.85 * lineIn} />
        </g>
      </svg>
      {/* 카드 뒤를 가라앉히는 평평한 어둠 */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 52%, rgba(${WARM_DARK},0.55) 0%, rgba(${WARM_DARK},0.25) 70%, rgba(${WARM_DARK},0.4) 100%)` }} />
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
  // 카드 판은 빨리 불투명해져 뒤 카드를 가리고, 글자는 그 뒤에 떠오른다 (두 카드 글자가 겹쳐 읽히지 않게)
  const pBg = progress(frame, arrive, arrive + 7, Easing.out(Easing.quad));
  const pText = progress(frame, arrive + 6, arrive + 18, Easing.out(Easing.cubic));
  const depth = laterArrivals.reduce((acc, a) => acc + progress(frame, a - 2, a + 20, Easing.inOut(Easing.cubic)), 0);
  const dy = (1 - p) * 80 - depth * STACK_DY;
  const scale = (1 - depth * 0.075) * (1 + (1 - p) * 0.035);
  const depthO = interpolate(depth, [0, 1, 2], [1, 0.3, 0.13], { extrapolateRight: "clamp" });
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
        약 <span style={{ fontFamily: FONTS.num, fontWeight: 700 }}>10</span>억 달러 수주(<span style={{ fontFamily: FONTS.num, fontWeight: 700 }}>2022</span>)
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
  const appear = progress(frame, N_IN, N_IN + 14);
  const d1 = progress(frame, DROP1, DROP1 + DROP_LEN, Easing.out(Easing.exp));
  const d2 = progress(frame, DROP2, DROP2 + DROP_LEN, Easing.out(Easing.exp));
  const snap1 = frame >= DROP1 + DROP_LEN ? 1 : d1;
  const snap2 = frame >= DROP2 + DROP_LEN ? 1 : d2;
  const value = STEPS[0].v + (STEPS[1].v - STEPS[0].v) * snap1 + (STEPS[2].v - STEPS[1].v) * snap2;
  const rounded = Math.round(value / 1000) * 1000;
  const step = frame >= DROP2 ? 2 : frame >= DROP1 ? 1 : 0;
  // 떨어지는 순간 살짝 아래로 꺼졌다 제자리
  const dip = 16 * (Math.sin(Math.PI * d1) * (d1 < 1 ? 1 : 0) + Math.sin(Math.PI * d2) * (d2 < 1 ? 1 : 0));
  const amberMix = Math.min(1, snap1);
  const numColor = amberMix >= 1 ? COLORS.amber : amberMix <= 0 ? DIM_CYAN : COLORS.amber;
  const numOpacity = amberMix > 0 && amberMix < 1 ? 0.7 + 0.3 * amberMix : 1;
  const yak = progress(frame, DROP2 + 4, DROP2 + 14);
  const ratio = value / STEPS[0].v;
  const BARW = 720;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(216,185,138,0.16)", opacity: appear }}>
      <div style={{ width: BARW, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: COLORS.sand, marginBottom: 4 }}>2030 인구 목표</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, transform: `translateY(${dip}px)`, opacity: numOpacity }}>
          <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 48, color: COLORS.amber, opacity: yak, width: 60 * yak, overflow: "hidden", display: "inline-block" }}>약</span>
          <span style={{ fontFamily: FONTS.num, fontWeight: 900, fontSize: 84, color: numColor, fontVariantNumeric: "tabular-nums", letterSpacing: 2, lineHeight: 1 }}>{fmt(rounded)}</span>
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
            const chipIn = i === 0 ? 1 : progress(frame, i === 1 ? DROP1 : DROP2, (i === 1 ? DROP1 : DROP2) + 10);
            return (
              <div
                key={s.chip}
                style={{
                  fontFamily: FONTS.body,
                  fontWeight: 700,
                  fontSize: 26,
                  padding: "5px 14px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  color: on ? (i === 0 ? COLORS.neon : COLORS.amber) : COLORS.concrete,
                  border: `2px solid ${on ? (i === 0 ? "rgba(56,242,255,0.6)" : COLORS.amber) : "rgba(138,143,152,0.4)"}`,
                  background: on ? "rgba(255,179,71,0.08)" : "transparent",
                  opacity: seen ? 0.35 + 0.65 * chipIn * (on ? 1 : 0.8) : 0.18,
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
// ─────────────────────────────────────────────────────────────

const GHOST_W = 880;
const GHOST_H = 130;
const GHOST_LEFT = (WIDTH - GHOST_W) / 2;
const GHOST_TOP = 150;

const GhostNine: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = useMemo(
    () =>
      Array.from({ length: 150 }, (_, i) => {
        const u = random(`s10pu${i}`);
        return {
          u,
          y: 20 + random(`s10py${i}`) * (GHOST_H - 40),
          vx: 30 + random(`s10vx${i}`) * 150,
          vy: -(20 + random(`s10vy${i}`) * 110),
          s: 2.5 + random(`s10ps${i}`) * 6,
          life: 18 + random(`s10pl${i}`) * 16,
          c: random(`s10pc${i}`),
        };
      }),
    [],
  );
  const rise = progress(frame, GHOST_IN, GHOST_IN + 18, Easing.out(Easing.cubic));
  if (rise <= 0) return null;
  const strike = progress(frame, STRIKE_A, STRIKE_B, Easing.inOut(Easing.cubic));
  const sweep = progress(frame, DUST_A, DUST_B, Easing.inOut(Easing.quad)); // 0→1 왼쪽부터 흩어짐
  const cut = sweep * 100;
  const gone = 1 - progress(frame, DUST_B - 2, DUST_B + 4);
  return (
    <div style={{ position: "absolute", left: GHOST_LEFT, top: GHOST_TOP + (1 - rise) * 40, width: GHOST_W, height: GHOST_H, opacity: rise }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(-20px -20px -20px ${cut}%)`, opacity: gone }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            color: COLORS.neon,
            opacity: 0.5 - 0.15 * strike,
          }}
        >
          <span style={{ fontFamily: FONTS.num, fontWeight: 900, fontSize: 104, letterSpacing: 2, lineHeight: 1 }}>{fmt(9000000)}</span>
          <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 50 }}>명</span>
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
      {/* 먼지 */}
      {frame >= DUST_A ? (
        <svg width={GHOST_W} height={GHOST_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {particles.map((pt, i) => {
            const born = DUST_A + pt.u * (DUST_B - DUST_A);
            const t = frame - born;
            if (t < 0 || t > pt.life) return null;
            const k = t / pt.life;
            const x = pt.u * GHOST_W + pt.vx * k;
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
        PIF 총재 &apos;취소된 네옴 사업 없다&apos;
      </div>
    </div>
  );
};

export const S10Headlines2026: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // s09 의 whoosh push 를 이어받아 오른쪽에서 밀려 들어옴
  const pushIn = progress(frame, 0, 14, Easing.out(Easing.cubic));
  const camX = (1 - pushIn) * 120;
  // '해지' 도장 / 카드3 착지 순간의 아주 작은 흔들림
  const shakeAt = (at: number, amp: number) => {
    const t = frame - at;
    if (t < 0 || t > 8) return 0;
    return amp * Math.sin(t * 2.6) * (1 - t / 8);
  };
  const shake1 = shakeAt(C1_STAMP + 5, 5);
  const shake3 = shakeAt(C3 + 14, 3);

  return (
    <SceneFrame fadeIn={6} fadeOut={14} background="#17120c">
      <AbsoluteFill style={{ transform: `translateX(${camX}px)` }}>
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
            홈페이지서 <span style={{ color: COLORS.amber }}>&apos;900만 명&apos;</span> 문구 삭제
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

      <Grain opacity={0.14} />
      <Vignette strength={0.45} />

      <SourceTag text="현대건설 공시 · 2026.03" start={C1 + 6} end={C2 + 2} stack={0} />
      <SourceTag text="세마포 보도 · 2026.05" start={C2 + 6} end={C3 + 2} stack={0} />
      <SourceTag text="30만: 블룸버그 · 2024.04" start={DROP1 + 2} end={C3 + 2} stack={1} />
      <SourceTag text="AGBI 보도 · 2026.07" start={C3 + 6} end={durationInFrames} stack={0} />
      <SourceTag text="PIF 이사회 발표 보도 · 2026.04" start={FOOT + 4} end={durationInFrames} stack={1} />
    </SceneFrame>
  );
};
