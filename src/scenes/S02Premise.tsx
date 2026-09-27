import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, HEIGHT, SAFE, WIDTH } from "../theme";
import { clamp01, easeInOutCubic, progress, sec } from "../utils/anim";
import {
  BigNumber,
  Caption,
  DisclaimerTag,
  DreamLetterBox,
  Grain,
  LineAerial,
  LineSection,
  SceneFrame,
  SourceTag,
  Vignette,
} from "../components";

/**
 * s02-premise — 사고실험의 규칙을 선언한다: 약속대로 100% 완공됐다고 가정.
 * 7.0s → 13.6s (198 frames). 장면 기준 시간 = 절대 시간 − 7.0.
 *
 *  0.0–3.1  측정 그리드 위에 LineSection 단면(200m×500m)이 시안 와이어프레임으로 솟고,
 *           오른쪽 높이 눈금자가 벽과 함께 올라가며 0→500m, 위쪽 '폭 200m' 치수선.
 *  3.1–4.6  카메라가 뒤로·위로 빠짐: 단면이 홍해 쪽 끝점으로 접히며 LineAerial(night)의
 *           170km 빛의 선이 그 점에서 오른쪽으로 점화. 아래에 '170 km' 치수 막대.
 *  3.1–6.6  왼쪽 위 날짜 칩 '2021 발표 → 2022 디자인 공개'.
 *  4.9–6.1  오른쪽 아래 BigNumber 0 → 9,000,000명 (1.2초) 후 정지.
 *  6.2–6.6  whoosh push: 내용이 왼쪽으로 밀려 나가며 사라짐 (레터박스·면책 태그는 고정).
 */

// ── 타이밍 (장면 기준 프레임) ─────────────────────────────
const T_SECTION = 4; // 단면이 솟기 시작
const SECTION_DUR = 48;
const T_WIDTH = 46; // 폭 치수선
const T_PULL = sec(3.1); // 93 — 카메라 빠짐 시작
const PULL_DUR = 40;
const T_DRAW = T_PULL + 18; // 빛의 선 점화 (단면이 끝점으로 접힌 직후)
const DRAW_DUR = 34;
const T_BAR = T_DRAW + 14; // 170km 치수 막대
const T_NUMBER = sec(4.9); // 147
const NUMBER_DUR = sec(1.2); // 36
const PUSH_FRAMES = 12;

const CAPTIONS = [
  { text: "약속대로 **100%** 완공됐다고 치자", from: 0.1, to: 3.1 },
  { text: "길이 **170km**, 높이 **500m**", from: 3.1, to: 4.9 },
  { text: "**900만 명**이 산다", from: 4.9, to: 6.6 },
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

/** 단면 오른쪽 높이 눈금자 + 위쪽 폭 치수선 (벽이 솟는 만큼 눈금이 따라 올라온다) */
const SectionDims: React.FC<{ rise: number; widthP: number; frame: number }> = ({ rise, widthP, frame }) => {
  const rx = SEC_LEFT + SEC_W + 64;
  const tipY = SEC_BASE - SEC_H * rise;
  const meters = Math.round(500 * rise);
  const ticks = useMemo(() => Array.from({ length: 11 }, (_, i) => i * 50), []);
  const labelIn = progress(frame, T_SECTION + 2, T_SECTION + 14);
  const done = rise >= 0.999;
  const settle = progress(frame, T_SECTION + SECTION_DUR - 4, T_SECTION + SECTION_DUR + 12);
  const topY = SEC_TOP - 46;
  const half = (SEC_W / 2) * widthP;
  const wLabel = progress(frame, T_WIDTH + 8, T_WIDTH + 24);
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
        {/* 눈금 끝을 따라 올라가는 값 */}
        <text
          x={rx + 30}
          y={tipY + 16}
          fill={COLORS.ink}
          fontFamily={FONTS.num}
          fontWeight={700}
          fontSize={44}
          opacity={1 - settle}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {meters}
          <tspan fill={COLORS.neon} fontSize={30} dx={6}>
            m
          </tspan>
        </text>
      </g>
      {/* 정착 후: 높이 500m 라벨이 눈금자 가운데로 */}
      {done || settle > 0 ? (
        <g opacity={settle} transform={`translate(0 ${(1 - settle) * -18})`}>
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
            style={{ textShadow: `0 0 18px ${COLORS.neon}66` }}
          >
            500m
          </text>
        </g>
      ) : null}
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

/** 왼쪽 위 날짜 칩: '2021 발표 → 2022 디자인 공개' */
const DateChip: React.FC<{ frame: number }> = ({ frame }) => {
  const p = progress(frame, T_PULL, T_PULL + 14);
  const arrow = progress(frame, T_PULL + 8, T_PULL + 22);
  const second = progress(frame, T_PULL + 12, T_PULL + 26);
  if (p <= 0) return null;
  const num: React.CSSProperties = { fontFamily: FONTS.num, fontWeight: 700, fontSize: 38, color: COLORS.neon, letterSpacing: 1 };
  const word: React.CSSProperties = { fontFamily: FONTS.body, fontWeight: 700, fontSize: 38, color: COLORS.ink };
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x,
        top: SAFE.y + 40,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 22px 10px 18px",
        borderRadius: 10,
        background: "rgba(5,6,15,0.72)",
        border: `1px solid ${COLORS.neon}55`,
        boxShadow: `0 0 24px ${COLORS.neon}22`,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.neon, boxShadow: `0 0 10px ${COLORS.neon}` }} />
      <span style={num}>2021</span>
      <span style={word}>발표</span>
      <span style={{ ...word, color: COLORS.neon2, opacity: arrow, transform: `translateX(${(1 - arrow) * -10}px)`, display: "inline-block" }}>
        →
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 14, opacity: second }}>
        <span style={num}>2022</span>
        <span style={word}>디자인 공개</span>
      </span>
    </div>
  );
};

export const S02Premise: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 장면 경계: 앞 장면의 push 를 이어받아 들어오고, 끝에서 왼쪽으로 밀려 나간다.
  // s01 은 가속 푸시인으로 끝난다 → 살짝 큰 상태에서 가라앉으며 들어온다.
  const enter = progress(frame, 0, 14);
  const exit = progress(frame, durationInFrames - PUSH_FRAMES, durationInFrames, Easing.in(Easing.cubic));
  const contentOpacity = Math.min(enter, 1 - exit);
  const pushX = -exit * 220;
  const enterScale = 1 + (1 - enter) * 0.06;

  // ── 1막: 단면 ──
  const rise = progress(frame, T_SECTION, T_SECTION + SECTION_DUR, Easing.inOut(Easing.cubic));
  const widthP = progress(frame, T_WIDTH, T_WIDTH + 16, Easing.out(Easing.cubic));
  const dimsFade = 1 - progress(frame, T_PULL - 8, T_PULL + 3);
  // 카메라 빠짐: 단면이 홍해 쪽 끝점으로 접힌다
  // 위에서 내려다보면 500m 벽은 200m 폭의 띠가 된다 → 단면이 바닥으로 눕듯(scaleY) 접히며 해안 끝점으로 이동
  const lay = progress(frame, T_PULL, T_PULL + 12, easeInOutCubic);
  const move = progress(frame, T_PULL + 3, T_DRAW, easeInOutCubic);
  const drift = interpolate(frame, [0, T_PULL], [1, 1.045], { extrapolateRight: "clamp" });
  const secSx = drift * (1 - move) + 0.05 * move;
  const secSy = drift * (1 - lay) + 0.03 * lay;
  const secDx = (AX1 - SEC_CX) * move;
  const secDy = (AY1 - SEC_BASE) * move;
  const secOpacity = 1 - progress(frame, T_DRAW - 6, T_DRAW + 2);

  // ── 2막: 항공 ──
  const aerialIn = progress(frame, T_PULL + 2, T_PULL + 20);
  const aerialCam = progress(frame, T_PULL, T_PULL + PULL_DUR + 10, Easing.out(Easing.cubic));
  const aerialScale = 1.55 - 0.53 * aerialCam - 0.02 * progress(frame, T_PULL + PULL_DUR, durationInFrames, Easing.linear);
  const aerialTilt = 24 * (1 - aerialCam);
  const barP = progress(frame, T_BAR, T_BAR + 22, Easing.inOut(Easing.cubic));
  const barLabel = progress(frame, T_BAR + 12, T_BAR + 26);
  // 접힘 순간의 점광
  // 착지점 표식: 단면이 날아드는 동안 점점 밝아지고, 점화 순간 정점 후 사라진다
  // (LineAerial 의 선 머리 점·짧은 선일 때의 글로우 클리핑도 이 빛으로 덮는다)
  const spark = interpolate(frame, [T_PULL + 4, T_DRAW, T_DRAW + 16], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const gridOpacity = 1 - 0.55 * aerialIn;

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <AbsoluteFill style={{ opacity: contentOpacity, transform: `translateX(${pushX}px) scale(${enterScale})` }}>
        {/* 항공 뷰 (밤 사막 + 170km 빛의 선) — 뒤로·위로 빠지는 카메라 */}
        {aerialIn > 0 ? (
          <AbsoluteFill style={{ opacity: aerialIn, perspective: 1400, perspectiveOrigin: `${AX1}px ${AY1}px` }}>
            <AbsoluteFill
              style={{
                transformOrigin: `${AX1}px ${AY1}px`,
                transform: `rotateX(${aerialTilt}deg) scale(${aerialScale})`,
              }}
            >
              <LineAerial
                night
                sea
                x1={AX1}
                y1={AY1}
                x2={AX2}
                y2={AY2}
                drawStart={T_DRAW}
                drawDuration={DRAW_DUR}
                thickness={6}
              />
              <LengthBar p={barP} labelP={barLabel} />
            </AbsoluteFill>
          </AbsoluteFill>
        ) : null}

        <MeasureGrid opacity={gridOpacity} />

        {/* 단면 (카메라와 함께 접힘) */}
        {secOpacity > 0 ? (
          <AbsoluteFill
            style={{
              opacity: secOpacity,
              transformOrigin: `${SEC_CX}px ${SEC_BASE}px`,
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
                opacity: rise,
              }}
            />
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
              left: AX1 - 190,
              top: AY1 - 190,
              width: 380,
              height: 380,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffffff 0%, ${COLORS.neon} 14%, ${COLORS.neon}55 32%, ${COLORS.neon}00 68%)`,
              opacity: spark * 0.95,
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
      <SourceTag text="네옴 발표 · 2021.01 / 2022.07" start={sec(1.2)} end={durationInFrames} />
    </SceneFrame>
  );
};
