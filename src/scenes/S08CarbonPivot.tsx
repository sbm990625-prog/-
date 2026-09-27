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
// 땅의 빛줄기에서 끊임없이 솟아오르며 위로 갈수록 넓어지고 커지는 보라 입자.
// 뒤쪽 40%는 살짝 흐리고(깊이감), 기둥 꼭대기 25%에서 옅어져 사라진다.
type Mote = {
  birth: number; // 첫 출발 프레임 (프리롤 포함)
  life: number; // 바닥→꼭대기 이동 시간
  lane: number; // -1..1 가로 위치 (삼각 분포 — 중심이 짙다)
  sizeK: number;
  alpha: number; // 0.18..0.45
  back: boolean;
  rot0: number;
  spin: number;
  phase: number;
  sway: number;
};

const PLUME_H = 560; // 기둥 최대 높이 (px)
const PLUME_ROOT_Y = PLUME_BASE + 40;
const PREROLL = 18; // 0프레임에 이미 작은 기둥이 서 있도록
const MOTES = 340;

const CarbonPlume: React.FC<{ frame: number; fade: number }> = ({ frame, fade }) => {
  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: MOTES }, (_, i) => {
        const life = 84 + random(`s08-ml-${i}`) * 40;
        return {
          birth: random(`s08-mb-${i}`) * life * 1.1,
          life,
          lane: random(`s08-mx1-${i}`) + random(`s08-mx2-${i}`) - 1,
          sizeK: 0.7 + random(`s08-ms-${i}`) * 0.3,
          alpha: 0.18 + random(`s08-ma-${i}`) * 0.27,
          back: random(`s08-md-${i}`) < 0.4,
          rot0: random(`s08-mr-${i}`) * 90,
          spin: (random(`s08-mv-${i}`) - 0.5) * 2.4,
          phase: random(`s08-mp-${i}`) * Math.PI * 2,
          sway: 6 + random(`s08-mw-${i}`) * 14,
        };
      }),
    [],
  );

  const t = frame + PREROLL;
  const rootOn = 0.55 + 0.45 * progress(frame, 0, 20);

  const renderMote = (m: Mote, i: number) => {
    const age = t - m.birth;
    if (age < 0) return null;
    const u = (age % m.life) / m.life; // 0 = 바닥, 1 = 꼭대기
    const h = u * PLUME_H;
    // 바람에 오른쪽으로 휘는 중심선, 위로 갈수록 넓어지는 폭
    const cx = PLUME_X + 80 * u * u + 10 * Math.sin(u * 3.4 + frame * 0.02);
    const halfW = 26 + 210 * Math.pow(u, 1.15);
    const x = cx + m.lane * halfW + Math.sin(frame * 0.05 + m.phase) * m.sway * u;
    const y = PLUME_ROOT_Y - 6 - h;
    const size = (6 + 16 * u) * m.sizeK + 6 * (1 - m.sizeK) * u; // 6..22 px
    const fadeIn = clamp01(u / 0.06);
    const fadeTop = 1 - clamp01((u - 0.75) / 0.25);
    const o = m.alpha * fadeIn * fadeTop;
    if (o <= 0.005) return null;
    const rot = m.rot0 + age * m.spin;
    return (
      <rect
        key={i}
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        rx={size * 0.18}
        fill={COLORS.neon2}
        opacity={o}
        transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}
      />
    );
  };

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="s08-ground" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLORS.neon} stopOpacity={0} />
          <stop offset="0.5" stopColor={COLORS.neon} stopOpacity={0.9} />
          <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
        </linearGradient>
        {/* r=0.5: 반타원 가장자리에 닿기 전에 투명해져 경계선이 보이지 않는다 */}
        <radialGradient id="s08-root-haze" cx="0.5" cy="1" r="0.5">
          <stop offset="0" stopColor={COLORS.neon2} stopOpacity={0.3} />
          <stop offset="1" stopColor={COLORS.neon2} stopOpacity={0} />
        </radialGradient>
        <filter id="s08-mote-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2} />
        </filter>
      </defs>
      {/* 기둥의 뿌리 = 빛의 선 한 토막 */}
      <rect x={PLUME_X - 420} y={PLUME_ROOT_Y} width={840} height={3} fill="url(#s08-ground)" opacity={rootOn} />
      <rect x={PLUME_X - 420} y={PLUME_ROOT_Y - 6} width={840} height={15} fill="url(#s08-ground)" opacity={0.18 * rootOn} />
      {/* 뒤쪽 입자 (흐림) → 앞쪽 입자 (선명) */}
      {fade > 0 ? (
        <g opacity={fade}>
          <path
            d={`M${PLUME_X - 170} ${PLUME_ROOT_Y} A170 90 0 0 1 ${PLUME_X + 190} ${PLUME_ROOT_Y} Z`}
            fill="url(#s08-root-haze)"
          />
          <g filter="url(#s08-mote-blur)">{motes.map((m, i) => (m.back ? renderMote(m, i) : null))}</g>
          <g>{motes.map((m, i) => (m.back ? null : renderMote(m, i)))}</g>
        </g>
      ) : null}
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
        = 영국 4년치+
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
      {/* 새벽빛: 아래 지평선 쪽 앰버 띠 → 보라 → 위쪽 오프블랙 (세로 그라디언트) */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(255,179,71,0.18) 0%, rgba(255,179,71,0.1) 12%, rgba(124,92,255,0.25) 34%, rgba(40,30,90,0.45) 58%, rgba(5,6,15,0.9) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.45 }}>
        <MeasureGrid drift={0} />
      </AbsoluteFill>
      <GlowBlob x={(AX1 + AX2) / 2 + 200} y={(AY1 + AY2) / 2 - 80} r={560} color={COLORS.neon2} opacity={bloom * 0.22} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="s08-line-glow" x="-10%" y="-400%" width="120%" height="900%">
            <feGaussianBlur stdDeviation={9 + 5 * bloom} />
          </filter>
          <filter id="s08-bloom" x="-20%" y="-600%" width="140%" height="1300%">
            <feGaussianBlur stdDeviation={30 + 16 * bloom} />
          </filter>
          <radialGradient id="s08-pulse">
            <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
            <stop offset="0.25" stopColor={COLORS.neon} stopOpacity={0.8} />
            <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* 170 km 히어로 선 — 그레이드/그리드 위에 다시 그려 시안으로 빛나게 */}
        <g opacity={lineOn}>
          {/* 절정 블룸: 선을 따라 넓게 번지는 시안 (원형 번짐 없이) */}
          <line
            x1={AX1}
            y1={AY1}
            x2={AX2}
            y2={AY2}
            stroke={COLORS.neon}
            strokeWidth={70 + 90 * bloom}
            strokeOpacity={0.08 + 0.2 * bloom}
            strokeLinecap="round"
            filter="url(#s08-bloom)"
          />
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
            fontSize={36}
            letterSpacing={3}
            style={{ filter: `drop-shadow(0 0 10px ${COLORS.neon}88) drop-shadow(0 2px 3px #000)` }}
            transform={`rotate(${angle} ${(AX1 + AX2) / 2 + nx * (off + 40)} ${(AY1 + AY2) / 2 + ny * (off + 40)})`}
          >
            170km
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

  // 탄소 기둥이 사라지는 동안 빈 화면이 생기지 않도록 공중 와이드를 6프레임 먼저 깔기 시작한다
  const aerialOpacity = progress(frame, PIVOT - 6, PIVOT + 12);
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
      {frame >= PIVOT - 6 ? (
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
          <CarbonPlume frame={frame} fade={1 - progress(frame, 136, 160, Easing.inOut(Easing.quad))} />
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
            <BigNumber value={18} from={1} start={26} duration={36} unit="억 톤" size={230} sub="(추정)" />
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
