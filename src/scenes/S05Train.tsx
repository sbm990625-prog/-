import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, SAFE, glow } from "../theme";
import { clamp01, fmt, progress } from "../utils/anim";
import {
  Caption,
  DisclaimerTag,
  DreamLetterBox,
  ExperimentChip,
  GlowBlob,
  Grain,
  PerspectiveGrid,
  SceneFrame,
  SourceTag,
  Vignette,
} from "../components";

/**
 * s05-train — 실험 2 · 20분 열차. (26.4s → 36.0s, 288 frames)
 * 0.0–6.2s  : 같은 170km 두 레인 — 시안 '약속'(20:00, 평균 510 km/h) vs 강철색 KTX 305 km/h (33:24 → '33분 (계산)')
 * 4.9–5.5s  : 두 레인 선로가 한 줄의 170km 선로로 모핑(빈 화면 없이 이어짐)
 * 5.5–9.6s  : 같은 선로에 역 86개가 왼→오로 팝, 열차가 역마다 섰다 감(자막 L3 와 함께 출발). 모서리 시계는 정차 시간만 0→42.5분,
 *             점선 시안 '20분' 선을 넘는 순간 앰버.
 * 자막(장면 기준 초): L1 0.2–3.0 / L2 3.0–6.2 / L3 6.2–9.6, 헤더 칩은 장면 내내.
 */

// ── 타이밍 (프레임, 장면 기준) ─────────────────────────────
const RACE_START = 14;
const KTX_MIN = 33.4; // 170 ÷ 305 × 60 = 33.4분 (스토리보드 반올림값 → 33:24)
const PROMISE_MIN = 20;
const RACE_DUR = 104; // KTX 도착까지
const CYAN_ARRIVE = RACE_START + (RACE_DUR * PROMISE_MIN) / KTX_MIN; // ≈ 76
const KTX_ARRIVE = RACE_START + RACE_DUR; // 118
const MORPH0 = 146; // ≈4.9s: 결과 정지 ~1초 뒤 레이스 선로 → 역 선로 모핑 시작
const MORPH1 = 166; // 모핑 완료 (레이스 언마운트)
const PHASE2 = 186; // 6.2s — 자막 L3
const TICK_START = MORPH1 - 2;
const TICK_STEP = 0.38; // 86개 ≈ 33프레임
const TRAIN_START = PHASE2;
const SLOW_STOPS = 3; // 처음 3개 역은 천천히 (섰다 가는 게 보이도록)
const SLOW_PER = 7;
const FAST_DUR = 54;
const TRAIN_END = TRAIN_START + SLOW_STOPS * SLOW_PER + FAST_DUR;
const STATIONS = 86;
const SEGS = STATIONS - 1; // 85회 정차
const DWELL = 0.45;
const SCENE_LEN = 288;

// ── 레이아웃 ───────────────────────────────────────────────
const RX1 = 470;
const RX2 = 1450;
const CAP_W = 96;
/** 캡슐 앞코 위치 — 출발 시 캡슐 전체가 출발선 오른쪽에 있도록 */
const noseX = (p: number) => RX1 + CAP_W + (RX2 - RX1 - CAP_W) * p;
const LANE_Y = [372, 560];
const SX1 = 200;
const SX2 = 1720;
const SY = 610;

const mmss = (m: number) => {
  const total = Math.round(m * 60);
  const mm = Math.floor(total / 60);
  const ss = total - mm * 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

/** 열차가 지나간 역 수(연속값)와 순간 속도(역/프레임) */
const stationAt = (frame: number): { s: number; rate: number } => {
  const u = frame - TRAIN_START;
  if (u <= 0) return { s: 0, rate: 0 };
  const slowLen = SLOW_STOPS * SLOW_PER;
  if (u < slowLen) return { s: u / SLOW_PER, rate: 1 / SLOW_PER };
  const v = Math.min(1, (u - slowLen) / FAST_DUR);
  const rem = SEGS - SLOW_STOPS;
  // 가속: h(v) = 0.3v + 0.7v²
  const s = SLOW_STOPS + rem * (0.3 * v + 0.7 * v * v);
  const rate = v >= 1 ? 0 : (rem * (0.3 + 1.4 * v)) / FAST_DUR;
  return { s: Math.min(SEGS, s), rate };
};

/** 정차 시간(분)만 누적 — 역당 30초 */
const dwellMinutes = (s: number): number => {
  if (s >= SEGS) return SEGS * 0.5;
  const k = Math.floor(s);
  const f = s - k;
  return 0.5 * (k + Math.min(1, f / DWELL));
};

/** 섰다-가는 위치 (0..1) */
const trainPos = (s: number, rate: number): number => {
  if (s >= SEGS) return 1;
  const k = Math.floor(s);
  const f = s - k;
  const m = f < DWELL ? 0 : (f - DWELL) / (1 - DWELL);
  const eased = m < 0.5 ? 2 * m * m : 1 - Math.pow(-2 * m + 2, 2) / 2;
  const stopGo = (k + eased) / SEGS;
  // 역이 1프레임보다 빨리 지나가면 섰다-감이 떨림으로 보이므로 연속 이동으로 섞는다
  const w = clamp01((rate - 0.25) / 0.35);
  return stopGo * (1 - w) + (s / SEGS) * w;
};

// ── 배경: 옅은 시안 측정 그리드 ─────────────────────────────
const MeasureGrid: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <pattern id="s05-minor" width={40} height={40} patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke={COLORS.neon} strokeOpacity={0.045} strokeWidth={1} />
      </pattern>
      <pattern id="s05-major" width={200} height={200} patternUnits="userSpaceOnUse">
        <rect width={200} height={200} fill="url(#s05-minor)" />
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke={COLORS.neon} strokeOpacity={0.09} strokeWidth={1} />
      </pattern>
    </defs>
    <rect width={1920} height={1080} fill="url(#s05-major)" />
  </svg>
);

// ── 캡슐 열차 ──────────────────────────────────────────────
const Capsule: React.FC<{ x: number; y: number; color: string; w?: number; h?: number; strength?: number }> = ({
  x,
  y,
  color,
  w = 96,
  h = 30,
  strength = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - w,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: `${h / 2}px ${h}px ${h}px ${h / 2}px`,
      background: `linear-gradient(90deg, ${color}00 0%, ${color}aa 35%, #ffffff 100%)`,
      boxShadow: `0 0 ${18 * strength}px ${color}, 0 0 ${46 * strength}px ${color}88`,
    }}
  />
);

/** 캡슐 뒤 스피드 라인 */
const SpeedLines: React.FC<{ x: number; y: number; color: string; frame: number; amount: number; seed: string }> = ({
  x,
  y,
  color,
  frame,
  amount,
  seed,
}) => {
  if (amount <= 0.01) return null;
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const r1 = random(`${seed}-y-${i}`);
        const r2 = random(`${seed}-l-${i}`);
        const r3 = random(`${seed}-p-${i}`);
        const len = 80 + r2 * 220;
        const cycle = 300;
        const off = (frame * 34 + r3 * cycle) % cycle;
        const dy = (r1 - 0.5) * 34;
        const left = x - 110 - off - len * 0.4;
        const fade = 1 - off / cycle;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top: y + dy,
              width: len,
              height: 2,
              background: `linear-gradient(90deg, ${color}00, ${color})`,
              opacity: amount * fade * (0.35 + 0.5 * r2),
              borderRadius: 1,
            }}
          />
        );
      })}
    </>
  );
};

// ── 1부: 두 레인 레이스 ─────────────────────────────────────
const Race: React.FC<{ frame: number }> = ({ frame }) => {
  const simMin = interpolate(frame, [RACE_START, KTX_ARRIVE], [0, KTX_MIN], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appear = progress(frame, -6, 14);
  const trackDraw = progress(frame, -8, 14, Easing.inOut(Easing.cubic));
  // 모핑: 두 레인 선로 → 한 줄 역 선로. 라벨·캡슐·시계는 먼저 빠진다.
  const m = progress(frame, MORPH0, MORPH1, Easing.inOut(Easing.cubic));
  const fadeOut = 1 - progress(frame, MORPH0, MORPH0 + 10);
  const mx1 = interpolate(m, [0, 1], [RX1, SX1]);
  const mx2 = interpolate(m, [0, 1], [RX1 + (RX2 - RX1) * trackDraw, SX2]);
  const dimY = interpolate(m, [0, 1], [LANE_Y[1] + 110, SY + 66]);
  const dimX1 = interpolate(m, [0, 1], [RX1, SX1]);
  const dimX2 = interpolate(m, [0, 1], [RX2, SX2]);

  const lanes = [
    { key: "promise", minutes: PROMISE_MIN, color: COLORS.neon, name: "약속", speed: 510, arrive: CYAN_ARRIVE },
    { key: "ktx", minutes: KTX_MIN, color: COLORS.steel, name: "KTX", speed: 305, arrive: KTX_ARRIVE },
  ];
  const marker20 = noseX(PROMISE_MIN / KTX_MIN);
  const markerP = progress(frame, CYAN_ARRIVE, CYAN_ARRIVE + 12) * fadeOut;
  const ktxLabelP = progress(frame, KTX_ARRIVE + 2, KTX_ARRIVE + 16);

  return (
    <AbsoluteFill>
      {/* 출발선 · 도착선 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: appear }}>
        <g opacity={fadeOut}>
          <line x1={RX1} y1={LANE_Y[0] - 70} x2={RX1} y2={LANE_Y[1] + 70} stroke={COLORS.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 8" />
          <line x1={RX2} y1={LANE_Y[0] - 70} x2={RX2} y2={LANE_Y[1] + 70} stroke={COLORS.ink} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 8" />
        </g>
        {/* 170km 치수선 — 모핑 때 역 선로의 치수선 자리로 늘어난다 */}
        <g opacity={progress(frame, 0, 18)}>
          <line x1={dimX1} y1={dimY} x2={dimX2} y2={dimY} stroke={COLORS.muted} strokeOpacity={0.7} strokeWidth={2} />
          <line x1={dimX1} y1={dimY - 12} x2={dimX1} y2={dimY + 12} stroke={COLORS.muted} strokeWidth={2} />
          <line x1={dimX2} y1={dimY - 12} x2={dimX2} y2={dimY + 12} stroke={COLORS.muted} strokeWidth={2} />
          <rect x={960 - 90} y={dimY - 20} width={180} height={40} fill={COLORS.bg} />
          <text x={960} y={dimY + 13} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={700} fontSize={32}>
            170km
          </text>
        </g>
      </svg>

      {/* 선로 (두 레인 → 한 줄로 모핑) */}
      {LANE_Y.map((ly, i) => {
        const laneIn = progress(frame, -6 + i * 4, 14 + i * 4);
        const y = interpolate(m, [0, 1], [ly, SY]);
        return (
          <div
            key={`track-${i}`}
            style={{
              position: "absolute",
              left: mx1,
              top: y - 2.5,
              width: Math.max(0, mx2 - mx1),
              height: 5,
              background: COLORS.dim,
              opacity: laneIn * interpolate(m, [0, 1], [0.8, 1]),
              borderRadius: 2.5,
            }}
          />
        );
      })}

      {lanes.map((l, i) => {
        const y = LANE_Y[i];
        const p = Math.min(1, simMin / l.minutes);
        const tx = noseX(p);
        const moving = frame > RACE_START && p < 1;
        const done = p >= 1;
        const arriveP = progress(frame, l.arrive, l.arrive + 14, Easing.out(Easing.back(2)));
        const laneIn = progress(frame, -6 + i * 4, 14 + i * 4) * fadeOut;
        // 평균/최고 속도는 처음부터 고정값 (가속 곡선처럼 보이지 않게)
        const speed = Math.round(progress(frame, 0, 12, Easing.out(Easing.cubic)) * l.speed);
        const clock = mmss(Math.min(simMin, l.minutes));
        const isCyan = i === 0;
        return (
          <div key={l.key} style={{ position: "absolute", inset: 0, opacity: laneIn, transform: `translateX(${(1 - laneIn) * -30}px)` }}>
            {/* 라벨 */}
            <div style={{ position: "absolute", left: SAFE.x + 20, top: y - 58, width: RX1 - SAFE.x - 70, textAlign: "right" }}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 50,
                  lineHeight: 1.05,
                  color: l.color,
                  textShadow: isCyan ? glow(l.color, 0.35) : "none",
                }}
              >
                {l.name}
              </div>
              <div style={{ fontFamily: FONTS.num, fontWeight: 700, fontSize: 36, color: COLORS.ink, marginTop: 6, whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 28, color: COLORS.muted, marginRight: 10 }}>
                  {isCyan ? "평균" : "최고"}
                </span>
                {speed}
                <span style={{ fontFamily: FONTS.num, fontSize: 28, color: l.color, marginLeft: 8 }}>km/h</span>
              </div>
            </div>
            {/* 지나온 선로 (빛) */}
            <div
              style={{
                position: "absolute",
                left: RX1,
                top: y - 2,
                width: tx - RX1,
                height: 4,
                background: `linear-gradient(90deg, ${l.color}33, ${l.color})`,
                boxShadow: isCyan ? `0 0 14px ${l.color}` : "none",
                borderRadius: 2,
              }}
            />
            <SpeedLines x={tx} y={y} color={l.color} frame={frame} amount={moving ? (isCyan ? 1 : 0.45) : done ? (isCyan ? 0.4 : 0.22) : 0} seed={l.key} />
            <Capsule x={tx} y={y} w={CAP_W} color={l.color} strength={isCyan ? 1 : 0.45} />
            {/* 도착 펄스 */}
            {done && frame < l.arrive + 24 ? (
              <div
                style={{
                  position: "absolute",
                  left: RX2 - 60 * progress(frame, l.arrive, l.arrive + 22),
                  top: y - 60 * progress(frame, l.arrive, l.arrive + 22),
                  width: 120 * progress(frame, l.arrive, l.arrive + 22),
                  height: 120 * progress(frame, l.arrive, l.arrive + 22),
                  borderRadius: "50%",
                  border: `2px solid ${l.color}`,
                  opacity: 1 - progress(frame, l.arrive, l.arrive + 22),
                }}
              />
            ) : null}
            {/* 시계 */}
            <div
              style={{
                position: "absolute",
                left: RX2 + 44,
                top: y - 32,
                fontFamily: FONTS.num,
                fontWeight: 700,
                fontSize: 54,
                lineHeight: 1,
                color: done ? l.color : COLORS.ink,
                opacity: done ? 1 : 0.55,
                textShadow: done && isCyan ? glow(l.color, 0.4) : "none",
                transform: `scale(${done ? 1 + 0.1 * (1 - arriveP) : 1})`,
                transformOrigin: "left center",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {clock}
            </div>
            {isCyan ? (
              <div
                style={{
                  position: "absolute",
                  left: RX2 + 46,
                  top: y + 34,
                  fontFamily: FONTS.body,
                  fontWeight: 700,
                  fontSize: 30,
                  color: l.color,
                  opacity: progress(frame, l.arrive + 4, l.arrive + 16),
                  whiteSpace: "nowrap",
                }}
              >
                약속 20분
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: RX2 + 46,
                  top: y + 34,
                  fontFamily: FONTS.body,
                  fontWeight: 700,
                  fontSize: 30,
                  color: l.color,
                  opacity: ktxLabelP,
                  transform: `translateY(${(1 - ktxLabelP) * 10}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                33분 (계산)
              </div>
            )}
          </div>
        );
      })}

      {/* 약속 열차가 도착한 순간, KTX 가 있던 자리 (≈60%) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: markerP }}>
        <line
          x1={marker20}
          y1={LANE_Y[0] + 8}
          x2={marker20}
          y2={LANE_Y[1] - 26}
          stroke={COLORS.neon}
          strokeOpacity={0.55}
          strokeWidth={2}
          strokeDasharray="4 7"
          strokeDashoffset={-frame * 0.6}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ── 2부: 역 86개 ───────────────────────────────────────────
const Stations: React.FC<{ frame: number; crossFrame: number }> = ({ frame, crossFrame }) => {
  const ticks = useMemo(() => Array.from({ length: STATIONS }, (_, i) => SX1 + ((SX2 - SX1) * i) / SEGS), []);
  const { s, rate } = stationAt(frame);
  const pos = trainPos(s, rate);
  const tx = SX1 + (SX2 - SX1) * pos;
  const stopMin = dwellMinutes(s);
  const shown = Math.floor(stopMin * 2 + 1e-6) / 2;
  const amberP = progress(frame, crossFrame, crossFrame + 3);
  const accent = interpolateColors(amberP, [0, 1], [COLORS.neon, COLORS.amber]);
  const baseOn = frame >= MORPH1 ? 1 : 0; // 레이스 선로가 모핑으로 이 자리에 도착한 뒤 넘겨받는다
  const panelP = progress(frame, MORPH1 + 2, MORPH1 + 18);

  // 게이지 (0–45분)
  const GX = 1180;
  const GW = 600;
  const GY = 408;
  const gMax = 45;
  const g20 = GX + (GW * PROMISE_MIN) / gMax;
  const fillW = (GW * stopMin) / gMax;
  const crossPulse = frame >= crossFrame ? 1 - progress(frame, crossFrame, crossFrame + 18) : 0;

  return (
    <AbsoluteFill>
      {/* 오른쪽 위: 정차 시간 시계 */}
      <div style={{ position: "absolute", left: GX, top: 238, width: GW, opacity: panelP, transform: `translateY(${(1 - panelP) * 16}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: COLORS.muted, paddingBottom: 8 }}>정차 시간만</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: FONTS.num,
                fontWeight: 800,
                fontSize: 96,
                lineHeight: 1,
                color: accent,
                textShadow: `0 0 ${14 + 30 * crossPulse}px ${accent}${amberP > 0 ? "aa" : "66"}`,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt(shown, 1)}
            </span>
            <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 44, color: accent }}>분</span>
          </div>
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: panelP }}>
        <rect x={GX} y={GY} width={GW} height={14} rx={7} fill={COLORS.dim} fillOpacity={0.6} />
        <rect x={GX} y={GY} width={Math.max(0, fillW)} height={14} rx={7} fill={accent} />
        {crossPulse > 0 ? (
          <circle cx={g20} cy={GY + 7} r={10 + 50 * (1 - crossPulse)} fill="none" stroke={COLORS.amber} strokeWidth={3} opacity={crossPulse} />
        ) : null}
        {/* 20분 약속선 (점선 시안) */}
        <line x1={g20} y1={GY - 22} x2={g20} y2={GY + 36} stroke={COLORS.neon} strokeWidth={3} strokeDasharray="6 6" />
        <text x={g20} y={GY + 66} textAnchor="middle" fill={COLORS.neon} fontFamily={FONTS.body} fontWeight={700} fontSize={30}>
          20분 (약속)
        </text>
      </svg>

      {/* 선로 + 역 눈금 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="s05-train-glow" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation={6} />
          </filter>
        </defs>
        <line x1={SX1} y1={SY} x2={SX2} y2={SY} stroke={COLORS.dim} strokeWidth={5} strokeLinecap="round" opacity={baseOn} />
        <line x1={SX1} y1={SY} x2={tx} y2={SY} stroke={COLORS.neon} strokeWidth={5} strokeLinecap="round" opacity={frame > TRAIN_START ? 0.9 : 0} />
        {ticks.map((x, i) => {
          const t0 = TICK_START + i * TICK_STEP;
          const pp = interpolate(frame, [t0, t0 + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(3)),
          });
          if (pp <= 0) return null;
          const end = i === 0 || i === SEGS;
          const hh = (end ? 30 : 16) * pp;
          const passed = x <= tx + 0.5 && frame > TRAIN_START;
          return (
            <line
              key={i}
              x1={x}
              y1={SY - hh}
              x2={x}
              y2={SY + hh}
              stroke={passed ? COLORS.neon : COLORS.ink}
              strokeOpacity={passed ? 0.95 : 0.45}
              strokeWidth={end ? 4 : 2}
            />
          );
        })}
        {/* 열차 */}
        <g opacity={progress(frame, MORPH1 - 4, MORPH1 + 6)}>
          <rect x={tx - 40} y={SY - 14} width={70} height={28} rx={14} fill={COLORS.neon} filter="url(#s05-train-glow)" opacity={0.85} />
          <rect x={tx - 34} y={SY - 10} width={58} height={20} rx={10} fill="#ffffff" />
        </g>
        {/* 170km 치수 */}
        <g opacity={baseOn}>
          <line x1={SX1} y1={SY + 66} x2={SX2} y2={SY + 66} stroke={COLORS.muted} strokeOpacity={0.7} strokeWidth={2} />
          <line x1={SX1} y1={SY + 54} x2={SX1} y2={SY + 78} stroke={COLORS.muted} strokeWidth={2} />
          <line x1={SX2} y1={SY + 54} x2={SX2} y2={SY + 78} stroke={COLORS.muted} strokeWidth={2} />
          <rect x={(SX1 + SX2) / 2 - 90} y={SY + 46} width={180} height={40} fill={COLORS.bg} />
          <text x={(SX1 + SX2) / 2} y={SY + 79} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.num} fontWeight={700} fontSize={32}>
            170km
          </text>
        </g>
      </svg>

      {/* 각주 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: SY + 106,
          textAlign: "center",
          fontFamily: FONTS.body,
          fontWeight: 500,
          fontSize: 28,
          color: COLORS.muted,
          opacity: progress(frame, TRAIN_START + 10, TRAIN_START + 24) * 0.95,
        }}
      >
        역당 30초 가정 · 85회 × 30초 (계산)
      </div>
    </AbsoluteFill>
  );
};

export const S05Train: React.FC = () => {
  const frame = useCurrentFrame();

  // 정차 시계가 20분을 넘는 프레임 (정적 계산)
  const crossFrame = useMemo(() => {
    for (let f = TRAIN_START; f <= TRAIN_END + 1; f++) {
      if (dwellMinutes(stationAt(f).s) > PROMISE_MIN) return f;
    }
    return TRAIN_END;
  }, []);

  // whoosh push: 들어올 때 오른쪽에서 밀려 들어온다 (나가는 push 는 Main 이 담당)
  const pushIn = 1 - progress(frame, 0, 12, Easing.out(Easing.cubic));
  const camX = pushIn * 90;
  const drift = 1 + 0.01 * (frame / SCENE_LEN);

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <MeasureGrid />
      <GlowBlob x={960} y={720} r={760} color={COLORS.neon2} opacity={0.12} />
      <PerspectiveGrid horizon={770} opacity={0.5} speed={2.2} />

      <AbsoluteFill style={{ transform: `translateX(${camX}px) scale(${drift})`, transformOrigin: "50% 45%" }}>
        {frame < MORPH1 ? <Race frame={frame} /> : null}
        {frame >= MORPH0 ? <Stations frame={frame} crossFrame={crossFrame} /> : null}
      </AbsoluteFill>

      {/* 자막 가독성 밴드 */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(0deg, rgba(5,6,15,0.92) 0%, rgba(5,6,15,0.75) 18%, rgba(5,6,15,0) 34%)",
          pointerEvents: "none",
        }}
      />

      <Caption lines={[{ text: "평균 시속 **510km** 필요 (계산)", from: 0.2, to: 3.0 }]} />
      <Caption lines={[{ text: "KTX 최고 속도로도 **33분** (계산)", from: 3.0, to: 6.2 }]} accent={COLORS.steel} />
      <Caption lines={[{ text: "역 86개, 정차만 **42.5분** (계산)", from: 6.2, to: 10.2 }]} accent={COLORS.amber} />

      <Grain />
      <Vignette strength={0.6} />
      <DreamLetterBox />
      <ExperimentChip index="실험 2" title="끝에서 끝까지 20분" start={-3} end={SCENE_LEN + 60} />
      <DisclaimerTag />

      <SourceTag label="계산" text="170km ÷ 20분 = 시속 510km" position="bottomLeft" start={0} end={MORPH1} />
      <SourceTag label="계산" text="KTX 최고 305km/h · 무정차 가정" position="bottomRight" start={90} end={MORPH1} />
      <SourceTag text="역 86개: npj Urban Sustainability · 2023.06" position="bottomLeft" start={MORPH1 + 2} />
      <SourceTag label="계산" text="역당 30초 정차 가정" position="bottomRight" start={MORPH1 + 8} />
    </SceneFrame>
  );
};
