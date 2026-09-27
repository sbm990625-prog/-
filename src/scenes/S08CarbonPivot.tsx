import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { clamp01, progress } from "../utils/anim";
import {
  BigNumber,
  Caption,
  DisclaimerTag,
  DreamLetterBox,
  ExperimentChip,
  GlowBlob,
  Grain,
  LineAerial,
  SceneFrame,
  SourceTag,
  Vignette,
} from "../components";

/**
 * s08-carbon-pivot — 실험 5 · 탄소, 그리고 전환. (49.0s → 57.2s, 246 frames)
 *  0–162f  (49.0–54.4s) 어두운 입자 큐브가 연기 기둥처럼 솟아 쌓이고 BigNumber 'CO₂ 18억 톤'.
 *          87f(51.9s) 강철색 비교 태그 '영국 약 4년치+'.
 *  162f    (54.4s) 헤더가 빠지고 카메라가 크게 위로 빠지며 새벽 LineAerial 와이드 — 170km 전체가 시안으로.
 *  162–240f 캡션 '여기까지가, 약속이었다'(중앙, 흰색), 블룸이 절정까지 차오름.
 *  240–245f (57.0–57.2s) 6프레임 순수 검정 — 음악이 음 중간에 끊김. 다음 장면으로 하드 컷.
 */

const PIVOT = 162; // 54.4s
const CUT = 240; // 57.0s

// 연기 기둥 기하
const PLUME_X = 600;
const PLUME_BASE = 826;
const CELL = 22;

// 공중 시점의 170km 선 (장면 기준 화면 좌표)
const AX1 = 250;
const AY1 = 800;
const AX2 = 1690;
const AY2 = 566;
// 연기 기둥이 줄어들어 꽂히는 선 위의 점 (선의 약 25% 지점)
const PIN_T = 0.25;
const PIN_X = AX1 + (AX2 - AX1) * PIN_T;
const PIN_Y = AY1 + (AY2 - AY1) * PIN_T;

/* ───────── 측정 그리드 배경 ───────── */
const MeasureGrid: React.FC<{ drift: number }> = ({ drift }) => (
  <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <pattern id="s08-grid-minor" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${-drift})`}>
        <path d="M40 0 L0 0 0 40" fill="none" stroke={COLORS.neon} strokeOpacity={0.045} strokeWidth={1} />
      </pattern>
      <pattern id="s08-grid-major" width={200} height={200} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${-drift})`}>
        <path d="M200 0 L0 0 0 200" fill="none" stroke={COLORS.neon} strokeOpacity={0.085} strokeWidth={1} />
        <path d="M-6 0 L6 0 M0 -6 L0 6" stroke={COLORS.neon} strokeOpacity={0.3} strokeWidth={1.2} />
      </pattern>
      <radialGradient id="s08-grid-fade" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0" stopColor="#fff" stopOpacity={1} />
        <stop offset="1" stopColor="#fff" stopOpacity={0.15} />
      </radialGradient>
      <mask id="s08-grid-mask">
        <rect width={WIDTH} height={HEIGHT} fill="url(#s08-grid-fade)" />
      </mask>
    </defs>
    <g mask="url(#s08-grid-mask)">
      <rect width={WIDTH} height={HEIGHT} fill="url(#s08-grid-minor)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#s08-grid-major)" />
    </g>
  </svg>
);

/* ───────── 탄소 연기 기둥 (입자 큐브) ───────── */
type Cube = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  arrive: number;
  travel: number;
  rot0: number;
  rot1: number;
  size: number;
  shade: number;
  swirl: number;
  phase: number;
};

type Wisp = { x: number; period: number; offset: number; size: number; drift: number; rot: number };

const CarbonPlume: React.FC<{ frame: number }> = ({ frame }) => {
  const cubes = useMemo<Cube[]>(() => {
    // 연기 뭉게: 위로 갈수록 커지는 원들의 합집합 안쪽 격자점을 큐브 자리로 쓴다
    const blobs: { x: number; y: number; r: number }[] = [];
    for (let k = 0; k <= 9; k++) {
      const t = k / 9;
      // 바람에 오른쪽으로 휘며 위로 갈수록 넓게 퍼지는 기둥
      const x = PLUME_X - 10 + 26 * Math.sin(t * 4.2) + t * t * 90;
      const y = PLUME_BASE - 14 - t * 410;
      const r = 46 + 120 * Math.pow(t, 1.1);
      blobs.push({ x, y, r });
      if (k === 5) blobs.push({ x: x - r * 0.75, y: y + r * 0.2, r: r * 0.55 });
      if (k >= 6) blobs.push({ x: x + r * 0.78, y: y + r * (0.3 - (k - 6) * 0.15), r: r * (0.5 + (k - 6) * 0.04) });
    }
    const top = blobs[blobs.length - 2];
    blobs.push({ x: top.x - top.r * 0.2, y: top.y - top.r * 0.42, r: top.r * 0.62 });
    const slots: { x: number; y: number; depth: number; k: number }[] = [];
    let gi = 0;
    for (let gy = PLUME_BASE; gy > 150; gy -= CELL) {
      for (let gx = PLUME_X - 360; gx < PLUME_X + 400; gx += CELL) {
        gi++;
        const x = gx + (random(`s08-jx-${gi}`) - 0.5) * 8;
        const y = gy + (random(`s08-jy-${gi}`) - 0.5) * 8;
        let depth = -Infinity;
        for (const b of blobs) depth = Math.max(depth, b.r - Math.hypot(x - b.x, y - b.y));
        if (depth < 0) continue;
        // 가장자리는 해진 윤곽 (연기처럼)
        if (depth < 26 && random(`s08-skip-${gi}`) > 0.25 + depth / 40) continue;
        slots.push({ x, y, depth, k: random(`s08-k-${gi}`) });
      }
    }
    // 아래에서부터 쌓인다 (약간 섞어서)
    slots.sort((a, b) => b.y - b.k * 70 - (a.y - a.k * 70));
    const N = slots.length;
    return slots.map((s, i) => {
      const f = i / N;
      const core = clamp01(s.depth / 60);
      return {
        sx: PLUME_X + (random(`s08-sx-${i}`) - 0.5) * 80,
        sy: PLUME_BASE + 44,
        tx: s.x,
        ty: s.y,
        arrive: 8 + Math.pow(f, 0.9) * 128 + random(`s08-a-${i}`) * 6,
        travel: 16 + (PLUME_BASE + 40 - s.y) * 0.03,
        rot0: (random(`s08-r0-${i}`) - 0.5) * 160,
        rot1: (random(`s08-r1-${i}`) - 0.5) * 30,
        size: 10 + core * 7 + random(`s08-sz-${i}`) * 4,
        shade: 0.35 + 0.65 * core * random(`s08-sh-${i}`) + 0.2 * core,
        swirl: (random(`s08-sw-${i}`) - 0.5) * 80,
        phase: random(`s08-ph-${i}`) * Math.PI * 2,
      };
    });
  }, []);

  const wisps = useMemo<Wisp[]>(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: PLUME_X + 20 + (random(`s08-wx-${i}`) - 0.5) * 360,
        period: 70 + random(`s08-wp-${i}`) * 50,
        offset: random(`s08-wo-${i}`) * 120,
        size: 7 + random(`s08-ws-${i}`) * 7,
        drift: (random(`s08-wd-${i}`) - 0.5) * 80,
        rot: (random(`s08-wr-${i}`) - 0.5) * 180,
      })),
    [],
  );

  // 기둥 꼭대기 높이 (쌓인 만큼) — 흩날리는 입자의 출발 높이
  const filled = clamp01((frame - 8) / 130);
  const topY = PLUME_BASE - filled * (PLUME_BASE - 250);

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="s08-ground" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLORS.neon} stopOpacity={0} />
          <stop offset="0.5" stopColor={COLORS.neon} stopOpacity={0.9} />
          <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* 기둥의 뿌리 = 빛의 선 한 토막 */}
      <rect x={PLUME_X - 420} y={PLUME_BASE + 40} width={840} height={3} fill="url(#s08-ground)" opacity={0.55 + 0.45 * progress(frame, 0, 20)} />
      <rect x={PLUME_X - 420} y={PLUME_BASE + 34} width={840} height={15} fill="url(#s08-ground)" opacity={0.18 * (0.55 + 0.45 * progress(frame, 0, 20))} />
      {cubes.map((c, i) => {
        const launch = c.arrive - c.travel;
        if (frame < launch) return null;
        const t = clamp01((frame - launch) / c.travel);
        const e = Easing.out(Easing.cubic)(t);
        const settle = frame - c.arrive;
        const breath = settle > 0 ? Math.sin(frame * 0.06 + c.phase) * 1.4 : 0;
        const x = c.sx + (c.tx - c.sx) * e + Math.sin(t * Math.PI) * c.swirl;
        const y = c.sy + (c.ty - c.sy) * e + breath;
        const rot = c.rot0 + (c.rot1 - c.rot0) * e;
        const o = clamp01(t * 4) * (0.45 + 0.55 * Math.min(1, c.shade));
        const lum = Math.round(28 + Math.min(1, c.shade) * 30); // 어두운 회청색
        const fill = `rgb(${lum},${lum + 3},${lum + 18})`;
        const s = c.size;
        return (
          <rect
            key={i}
            x={-s / 2}
            y={-s / 2}
            width={s}
            height={s}
            rx={1.5}
            fill={fill}
            stroke={COLORS.neon2}
            strokeOpacity={0.22 + Math.min(1, c.shade) * 0.22}
            strokeWidth={1}
            opacity={o}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}
          />
        );
      })}
      {/* 꼭대기에서 흩어져 오르는 입자 (연기) */}
      {frame > 30
        ? wisps.map((w, i) => {
            const local = (frame + w.offset) % w.period;
            const u = local / w.period;
            const y = topY + 30 - u * 120;
            const x = w.x + w.drift * u + Math.sin(u * 5 + i) * 10;
            const o = Math.sin(u * Math.PI) * 0.55 * progress(frame, 30, 60);
            return (
              <rect
                key={`w${i}`}
                x={x - w.size / 2}
                y={y - w.size / 2}
                width={w.size}
                height={w.size}
                fill="#2c3146"
                stroke={COLORS.neon2}
                strokeOpacity={0.25}
                opacity={o}
                transform={`rotate(${(w.rot * u).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
              />
            );
          })
        : null}
    </svg>
  );
};

/* ───────── 영국 비교 태그 (강철색) ───────── */
const UkCompare: React.FC<{ frame: number; start: number }> = ({ frame, start }) => {
  const inP = progress(frame, start, start + 14);
  if (inP <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 26,
        opacity: inP,
        transform: `translateY(${(1 - inP) * 18}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 900,
          fontSize: 44,
          color: COLORS.steel,
          border: `2px solid ${COLORS.steel}88`,
          background: "rgba(159,179,200,0.08)",
          borderRadius: 10,
          padding: "6px 22px 8px",
          letterSpacing: -0.5,
        }}
      >
        = 영국 약 4년치+
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        {[0, 1, 2, 3, 4].map((k) => {
          const p = progress(frame, start + 8 + k * 5, start + 18 + k * 5, Easing.out(Easing.back(1.6)));
          const partial = k === 4;
          return (
            <div
              key={k}
              style={{
                width: partial ? 12 : 34,
                height: 34,
                borderRadius: 3,
                background: COLORS.steel,
                opacity: (partial ? 0.4 : 0.9) * p,
                transform: `scale(${0.4 + 0.6 * p})`,
                transformOrigin: "bottom center",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ───────── 새벽 공중 와이드 ───────── */
const DawnAerial: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - PIVOT;
  // 블룸은 음악 절정(225–239f)에 맞춰 차오른다
  const bloom = interpolate(frame, [PIVOT + 6, 200, 225, CUT], [0.2, 0.5, 0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  // 히어로 선: 컷 직후부터 선명한 시안, 절정으로 갈수록 헤일로가 넓고 밝아진다
  const lineOn = progress(frame, PIVOT, PIVOT + 10);
  // 선 위를 달리는 빛 펄스
  const pulseT = progress(frame, PIVOT + 24, CUT, Easing.inOut(Easing.sin));
  const px = AX1 + (AX2 - AX1) * pulseT;
  const py = AY1 + (AY2 - AY1) * pulseT;
  const dimO = progress(frame, PIVOT + 30, PIVOT + 48);
  const angle = (Math.atan2(AY2 - AY1, AX2 - AX1) * 180) / Math.PI;
  const nx = -Math.sin((angle * Math.PI) / 180);
  const ny = Math.cos((angle * Math.PI) / 180);
  const off = 62;
  return (
    <AbsoluteFill>
      <LineAerial night sea x1={AX1} y1={AY1} x2={AX2} y2={AY2} thickness={5} draw={1} />
      {/* 새벽빛: 전체를 약속 구간의 짙은 청흑으로 누르고, 동쪽(오른쪽 위)에서 따뜻한 빛이 번진다 */}
      <AbsoluteFill style={{ background: "linear-gradient(170deg, rgba(8,14,34,0.62) 0%, rgba(5,6,15,0.42) 55%, rgba(5,6,15,0.66) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.55 }}>
        <MeasureGrid drift={0} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(255,154,106,0.42) 0%, rgba(255,154,106,0.12) 45%, rgba(255,154,106,0) 75%)",
          mixBlendMode: "screen",
          opacity: 0.35 + 0.65 * progress(frame, PIVOT, PIVOT + 60),
        }}
      />
      <GlowBlob x={(AX1 + AX2) / 2} y={(AY1 + AY2) / 2} r={760} color={COLORS.neon} opacity={bloom * 0.34} />
      <GlowBlob x={(AX1 + AX2) / 2 + 200} y={(AY1 + AY2) / 2 - 80} r={560} color={COLORS.neon2} opacity={bloom * 0.22} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="s08-line-glow" x="-10%" y="-400%" width="120%" height="900%">
            <feGaussianBlur stdDeviation={9 + 5 * bloom} />
          </filter>
          <radialGradient id="s08-pulse">
            <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
            <stop offset="0.25" stopColor={COLORS.neon} stopOpacity={0.8} />
            <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* 170 km 히어로 선 — 그레이드/그리드 위에 다시 그려 시안으로 빛나게 */}
        <g opacity={lineOn}>
          <line
            x1={AX1}
            y1={AY1}
            x2={AX2}
            y2={AY2}
            stroke={COLORS.neon}
            strokeWidth={20 + 14 * bloom}
            strokeOpacity={0.45 + 0.3 * bloom}
            strokeLinecap="round"
            filter="url(#s08-line-glow)"
          />
          <line x1={AX1} y1={AY1} x2={AX2} y2={AY2} stroke={COLORS.neon} strokeWidth={6} strokeLinecap="round" />
          <line x1={AX1} y1={AY1} x2={AX2} y2={AY2} stroke="#ffffff" strokeWidth={2} strokeOpacity={0.7 + 0.3 * bloom} strokeLinecap="round" />
        </g>
        {local > 24 ? <circle cx={px} cy={py} r={70} fill="url(#s08-pulse)" opacity={0.8 * progress(frame, PIVOT + 24, PIVOT + 34)} /> : null}
        {/* 170 km 치수선 (선 아래, 흐린 시안) */}
        <g opacity={dimO * 0.8}>
          <line x1={AX1 + nx * off} y1={AY1 + ny * off} x2={AX2 + nx * off} y2={AY2 + ny * off} stroke={COLORS.neon} strokeOpacity={0.5} strokeWidth={1.5} />
          <line x1={AX1 + nx * (off - 12)} y1={AY1 + ny * (off - 12)} x2={AX1 + nx * (off + 12)} y2={AY1 + ny * (off + 12)} stroke={COLORS.neon} strokeWidth={2} />
          <line x1={AX2 + nx * (off - 12)} y1={AY2 + ny * (off - 12)} x2={AX2 + nx * (off + 12)} y2={AY2 + ny * (off + 12)} stroke={COLORS.neon} strokeWidth={2} />
          <text
            x={(AX1 + AX2) / 2 + nx * (off + 40)}
            y={(AY1 + AY2) / 2 + ny * (off + 40)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={COLORS.neon}
            fontFamily={FONTS.num}
            fontWeight={700}
            fontSize={34}
            letterSpacing={4}
            transform={`rotate(${angle} ${(AX1 + AX2) / 2 + nx * (off + 40)} ${(AY1 + AY2) / 2 + ny * (off + 40)})`}
          >
            170 KM
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const S08CarbonPivot: React.FC = () => {
  const frame = useCurrentFrame();

  // s07 에서 밀려 들어오는 whoosh push
  const pushIn = progress(frame, 0, 16, Easing.out(Easing.cubic));

  // 54.4s 크레인 업: 탄소 장면은 선 위 한 점으로 줄어들고, 공중 와이드가 위에서 내려다본다
  const pull = progress(frame, PIVOT, PIVOT + 40, Easing.out(Easing.cubic));
  const carbonOpacity = 1 - progress(frame, PIVOT + 2, PIVOT + 24, Easing.in(Easing.quad));
  const carbonScale = 1 - 0.8 * pull;
  const plumeRootX = PLUME_X;
  const plumeRootY = PLUME_BASE + 40;
  const carbonTx = (PIN_X - plumeRootX) * pull;
  const carbonTy = (PIN_Y - plumeRootY) * pull;

  const aerialOpacity = progress(frame, PIVOT, PIVOT + 16);
  const aerialScale = interpolate(pull, [0, 1], [3.4, 1.04]) - 0.03 * progress(frame, PIVOT + 42, CUT, Easing.linear);
  const aerialTx = (plumeRootX - PIN_X) * (1 - pull);
  const aerialTy = (plumeRootY - PIN_Y) * (1 - pull);

  // 숫자 블록
  const numOut = 1 - progress(frame, PIVOT - 14, PIVOT);

  if (frame >= CUT) {
    // 57.0–57.2s: 6프레임 순수 검정 (음악이 음 중간에 끊김) → s09 하드 컷
    return <AbsoluteFill style={{ background: "#000" }} />;
  }

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      {/* ── 2막: 새벽 공중 와이드 ── */}
      {frame >= PIVOT ? (
        <AbsoluteFill
          style={{
            opacity: aerialOpacity,
            transform: `translate(${aerialTx}px, ${aerialTy}px) scale(${aerialScale})`,
            transformOrigin: `${PIN_X}px ${PIN_Y}px`,
          }}
        >
          <DawnAerial frame={frame} />
        </AbsoluteFill>
      ) : null}

      {/* ── 1막: 탄소 (전환 동안 공중 와이드 위에서 선 위의 한 점으로 줄어든다) ── */}
      {carbonOpacity > 0 ? (
        <AbsoluteFill
          style={{
            opacity: carbonOpacity * (0.6 + 0.4 * pushIn),
            transform: `translate(${(1 - pushIn) * 240 + carbonTx}px, ${carbonTy}px) scale(${carbonScale})`,
            transformOrigin: `${plumeRootX}px ${plumeRootY}px`,
          }}
        >
          <AbsoluteFill style={{ opacity: 1 - progress(frame, PIVOT, PIVOT + 8) }}>
            <MeasureGrid drift={frame * 0.25} />
            <GlowBlob x={PLUME_X + 30} y={520} r={420} color={COLORS.neon2} opacity={0.16 * progress(frame, 10, 90)} />
          </AbsoluteFill>
          <CarbonPlume frame={frame} />
        </AbsoluteFill>
      ) : null}

      {/* 숫자 + 비교 */}
      {numOut > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 1000,
            width: 800,
            top: 250,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 30,
            opacity: numOut * pushIn,
            transform: `translate(${(1 - pushIn) * 240}px, ${(1 - numOut) * -40}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <div
              style={{
                fontFamily: FONTS.num,
                fontWeight: 700,
                fontSize: 84,
                color: COLORS.neon,
                opacity: progress(frame, 22, 34),
                letterSpacing: 2,
                textShadow: `0 0 18px ${COLORS.neon}66`,
              }}
            >
              CO<span style={{ fontSize: 48, verticalAlign: "-0.1em" }}>2</span>
            </div>
            <BigNumber value={18} start={26} duration={36} unit="억 톤" size={230} sub="(추정)" />
          </div>
          <UkCompare frame={frame} start={87} />
        </div>
      ) : null}

      <Caption lines={[{ text: "짓는 데만 CO₂ 18억 톤 (추정)", from: 0.2, to: 2.8 }]} />
      <Caption lines={[{ text: "영국 배출량 4년치 이상", from: 2.9, to: 5.4 }]} />
      <Caption
        lines={[{ text: "여기까지가, 약속이었다", from: 5.55, to: 8.4 }]}
        position="center"
        size={76}
        weight={900}
        style={{ top: -250 }}
      />

      <Grain />
      <Vignette strength={0.62} />
      <ExperimentChip index="실험 5" title="탄소" start={-6} end={PIVOT} />
      <DisclaimerTag start={-12} />
      <DreamLetterBox outFrames={6} />
      <SourceTag text="필립 올드필드(UNSW) 추정 · 디진 2022.08" start={20} end={PIVOT} />
    </SceneFrame>
  );
};
