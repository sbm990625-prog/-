import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { clamp01, easeOutBack, fmt, progress } from "../utils/anim";
import {
  BigNumber,
  Caption,
  DisclaimerTag,
  DreamLetterBox,
  ExperimentChip,
  Grain,
  SceneFrame,
  SourceTag,
  Vignette,
} from "../components";

/**
 * s04-density — 실험 1 · 인구밀도. 900만 ÷ 34㎢ = 264,706명/㎢ (계산)
 * = 서울 15,550명/㎢(2022)의 17.0배, 맨해튼 28,871명/㎢(2020)의 9.2배.
 * 19.8s → 26.4s (198 frames). 모든 시간은 장면 기준(0 = 19.8s).
 *
 * 선형 눈금 막대 비교: 강철색 서울·맨해튼 막대는 짧고, 시안 '더 라인' 막대는
 * 패널 테두리를 뚫고 화면 밖으로 넘쳐 나간다. 3.2s(=23.0s)에 ×17·×9 태그.
 * 시작은 이전 장면의 whoosh push 를 이어받아 오른쪽에서 밀려 들어오고,
 * 끝은 왼쪽으로 밀려 나가며 다음 장면(s05)에 넘긴다.
 */

// ── 데이터 (docs/storyboard.json s04-density) ───────────────────────────
const SEOUL = 15550;
const MANHATTAN = 28871;
const LINE = 264706;

// ── 레이아웃 ─────────────────────────────────────────────────────────────
const X0 = 480; // 막대 시작 x (값 0 위치)
const PANEL_RIGHT = 1740; // 패널 오른쪽 테두리 (막대가 뚫고 나가는 선)
const PANEL_TOP = 228;
const PANEL_BOTTOM = 552;
const LINE_LEN = 2450; // 시안 막대 전체 길이 (px) — 화면(1920) 밖으로 넘친다
const K = LINE_LEN / LINE; // 선형 눈금: px / (명/㎢)
const PANEL_LEN = PANEL_RIGHT - X0;

const ROW_SEOUL_Y = 298;
const ROW_MAN_Y = 386;
const ROW_LINE_Y = 488;

// ── 타이밍 (프레임, 장면 기준) ───────────────────────────────────────────
const F_PANEL = -4;
const F_SEOUL = 16;
const F_MAN = 32;
const F_LINE = 50;
const F_LINE_END = 94;
const F_TAGS = 96; // 23.0s
const PUSH_OUT = 12;

const lineEase = Easing.bezier(0.55, 0, 0.25, 1);

/** 오프블랙 위 옅은 시안 측정 그리드 (약속 구간 공통 바탕) */
const MeasureGrid: React.FC<{ shift: number }> = ({ shift }) => (
  <AbsoluteFill
    style={{
      backgroundImage: [
        `linear-gradient(${COLORS.neon}14 1px, transparent 1px)`,
        `linear-gradient(90deg, ${COLORS.neon}14 1px, transparent 1px)`,
        `linear-gradient(${COLORS.neon}07 1px, transparent 1px)`,
        `linear-gradient(90deg, ${COLORS.neon}07 1px, transparent 1px)`,
      ].join(", "),
      backgroundSize: "240px 240px, 240px 240px, 48px 48px, 48px 48px",
      backgroundPosition: `${shift}px 0px, ${shift}px 0px, ${shift}px 0px, ${shift}px 0px`,
    }}
  />
);

/** 강철색 비교 막대 한 줄 (서울·맨해튼) */
const SteelRow: React.FC<{
  label: string;
  value: number;
  y: number;
  start: number;
  mult: string;
  multStart: number;
}> = ({ label, value, y, start, mult, multStart }) => {
  const frame = useCurrentFrame();
  const appear = progress(frame, start - 6, start + 8);
  const p = progress(frame, start, start + 20, Easing.out(Easing.cubic));
  const w = value * K * p;
  const h = 44;
  const tagP = progress(frame, multStart, multStart + 12, easeOutBack);
  const tagO = progress(frame, multStart, multStart + 6);
  return (
    <div style={{ position: "absolute", left: 0, top: y - h / 2, height: h, width: 1920, opacity: appear }}>
      <div
        style={{
          position: "absolute",
          right: 1920 - X0 + 32,
          top: -8,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 42,
          color: COLORS.steel,
          whiteSpace: "nowrap",
          transform: `translateX(${(1 - appear) * -16}px)`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: X0,
          top: 0,
          width: w,
          height: h,
          background: `linear-gradient(90deg, ${COLORS.steel}bb, ${COLORS.steel})`,
          borderRadius: "0 4px 4px 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: X0 + w + 22,
          top: -4,
          display: "flex",
          alignItems: "center",
          gap: 22,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.num,
            fontWeight: 700,
            fontSize: 40,
            color: COLORS.steel,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 3,
            opacity: progress(frame, start + 2, start + 10),
          }}
        >
          {fmt(value * p)}
        </span>
        {tagO > 0 ? (
          <span
            style={{
              fontFamily: FONTS.num,
              fontWeight: 900,
              fontSize: 36,
              color: COLORS.bg,
              background: COLORS.neon,
              borderRadius: 8,
              padding: "4px 16px 2px",
              letterSpacing: 4,
              boxShadow: `0 0 22px ${COLORS.neon}88`,
              opacity: tagO,
              transform: `scale(${0.4 + 0.6 * tagP})`,
              transformOrigin: "left center",
              display: "inline-block",
            }}
          >
            {mult}
          </span>
        ) : null}
      </div>
    </div>
  );
};

/** 시안 '더 라인' 막대 — 패널을 뚫고 화면 밖으로 */
const LineRow: React.FC<{ crossFrame: number }> = ({ crossFrame }) => {
  const frame = useCurrentFrame();
  const appear = progress(frame, F_LINE - 8, F_LINE + 6);
  const p = progress(frame, F_LINE, F_LINE_END, lineEase);
  const w = LINE_LEN * p;
  const h = 66;
  const growing = frame >= F_LINE && frame < F_LINE_END;
  const headO = growing ? 1 : 1 - progress(frame, F_LINE_END, F_LINE_END + 10);
  // 막대 '서울 길이' 눈금: 23.0s 부터 왼→오로 새겨지며 ×17 을 몸으로 느끼게
  const seoulLen = SEOUL * K;
  const notches = useMemo(() => Array.from({ length: 16 }, (_, i) => (i + 1) * seoulLen).filter((x) => X0 + x < 1960), [seoulLen]);
  // 패널 테두리를 뚫는 순간의 글로우 펄스
  const burst = frame >= crossFrame ? Math.exp(-(frame - crossFrame) / 9) : 0;
  const breathe = 0.85 + 0.15 * Math.sin(frame / 9);
  return (
    <div style={{ position: "absolute", left: 0, top: ROW_LINE_Y - h / 2, height: h, width: 1920, opacity: appear }}>
      <div
        style={{
          position: "absolute",
          right: 1920 - X0 + 32,
          top: -2,
          fontFamily: FONTS.display,
          fontSize: 50,
          color: COLORS.neon,
          whiteSpace: "nowrap",
          textShadow: `0 0 18px ${COLORS.neon}66`,
          transform: `translateX(${(1 - appear) * -16}px)`,
        }}
      >
        더 라인
      </div>
      <div
        style={{
          position: "absolute",
          left: X0,
          top: 0,
          width: w,
          height: h,
          background: `linear-gradient(90deg, ${COLORS.neon}cc 0%, ${COLORS.neon} 60%, #d8fdff 100%)`,
          boxShadow: `0 0 ${26 + 30 * burst}px ${COLORS.neon}${frame > F_LINE_END ? "aa" : "88"}, 0 0 ${80 * breathe}px ${COLORS.neon2}55`,
          overflow: "hidden",
        }}
      >
        {notches.map((x, i) => {
          const o = progress(frame, F_TAGS + i * 1.6, F_TAGS + i * 1.6 + 6);
          if (o <= 0 || x > w) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - 2,
                top: 0,
                width: 4,
                height: h,
                background: COLORS.bg,
                opacity: 0.55 * o,
              }}
            />
          );
        })}
      </div>
      {/* 자라는 막대의 밝은 머리 */}
      {headO > 0 && w > 4 && X0 + w < 2000 ? (
        <div
          style={{
            position: "absolute",
            left: X0 + w - 60,
            top: -30,
            width: 120,
            height: h + 60,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, #ffffff 0%, ${COLORS.neon}aa 30%, transparent 70%)`,
            opacity: headO * 0.9,
          }}
        />
      ) : null}
    </div>
  );
};

export const S04Density: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 시안 막대가 패널 테두리를 넘는 프레임 (정적 계산)
  const crossFrame = useMemo(() => {
    for (let f = F_LINE; f <= F_LINE_END; f++) {
      if (LINE_LEN * progress(f, F_LINE, F_LINE_END, lineEase) >= PANEL_LEN) return f;
    }
    return F_LINE_END;
  }, []);

  // whoosh push: 오른쪽에서 밀려 들어와 왼쪽으로 밀려 나간다
  const pushIn = progress(frame, 0, 16, Easing.out(Easing.cubic));
  const pushOut = progress(frame, durationInFrames - PUSH_OUT, durationInFrames, Easing.in(Easing.cubic));
  const pushX = (1 - pushIn) * 240 - pushOut * 300;
  const contentO = Math.min(0.3 + 0.7 * progress(frame, 0, 10), 1 - pushOut);
  // 느린 카메라 드리프트 (왼쪽 기준으로 아주 살짝 줌인)
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.035]);

  // 패널
  const panelO = progress(frame, F_PANEL, F_PANEL + 16);
  const burst = frame >= crossFrame ? Math.exp(-(frame - crossFrame) / 10) : 0;
  const breach = frame >= crossFrame ? 1 : 0;
  const axisTicks = [0, 50000, 100000];

  // 화면 오른쪽 가장자리로 번지는 시안 빛 (막대가 화면을 벗어난 뒤)
  const lineW = LINE_LEN * progress(frame, F_LINE, F_LINE_END, lineEase);
  const edgeGlow = clamp01((X0 + lineW - 1920) / 300);

  const numO = progress(frame, F_LINE + 8, F_LINE + 20);
  const noteO = progress(frame, F_LINE_END - 4, F_LINE_END + 14);

  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <MeasureGrid shift={pushX * 0.35 - frame * 0.25} />

      <AbsoluteFill
        style={{
          opacity: contentO,
          transform: `translateX(${pushX}px) scale(${drift})`,
          transformOrigin: `${X0}px 460px`,
        }}
      >
        {/* 보라 보조 글로우 (시안 막대 뒤) */}
        <div
          style={{
            position: "absolute",
            left: 900,
            top: ROW_LINE_Y - 260,
            width: 1400,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${COLORS.neon2}33 0%, transparent 65%)`,
            opacity: progress(frame, F_LINE, F_LINE_END),
          }}
        />

        {/* 패널 (선형 눈금) */}
        <div style={{ opacity: panelO }}>
          <div
            style={{
              position: "absolute",
              left: X0 - 1,
              top: PANEL_TOP,
              width: 2,
              height: PANEL_BOTTOM - PANEL_TOP,
              background: `${COLORS.steel}88`,
            }}
          />
          {/* 위·아래 테두리 */}
          {[PANEL_TOP, PANEL_BOTTOM].map((yy) => (
            <div
              key={yy}
              style={{
                position: "absolute",
                left: X0,
                top: yy,
                width: PANEL_LEN * progress(frame, F_PANEL, F_PANEL + 24, Easing.inOut(Easing.cubic)),
                height: 1,
                background: `${COLORS.steel}40`,
              }}
            />
          ))}
          {/* 오른쪽 테두리: 시안 막대가 뚫는 자리 */}
          <div
            style={{
              position: "absolute",
              left: PANEL_RIGHT - 1,
              top: PANEL_TOP,
              width: 2,
              height: PANEL_BOTTOM - PANEL_TOP,
              backgroundImage: `repeating-linear-gradient(180deg, ${COLORS.steel}99 0 10px, transparent 10px 18px)`,
              WebkitMaskImage: breach
                ? `linear-gradient(180deg, #000 0%, #000 ${((ROW_LINE_Y - 60 - PANEL_TOP) / (PANEL_BOTTOM - PANEL_TOP)) * 100}%, transparent ${((ROW_LINE_Y - 44 - PANEL_TOP) / (PANEL_BOTTOM - PANEL_TOP)) * 100}%, transparent ${((ROW_LINE_Y + 44 - PANEL_TOP) / (PANEL_BOTTOM - PANEL_TOP)) * 100}%, #000 ${((ROW_LINE_Y + 60 - PANEL_TOP) / (PANEL_BOTTOM - PANEL_TOP)) * 100}%)`
                : undefined,
              opacity: progress(frame, F_PANEL + 10, F_PANEL + 26),
            }}
          />
          {/* 눈금 */}
          {axisTicks.map((v) => {
            const x = X0 + v * K;
            return (
              <React.Fragment key={v}>
                {v > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      top: PANEL_TOP,
                      width: 1,
                      height: PANEL_BOTTOM - PANEL_TOP,
                      background: `${COLORS.steel}1f`,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: x - 100,
                    width: 200,
                    top: PANEL_BOTTOM + 10,
                    textAlign: "center",
                    fontFamily: FONTS.num,
                    fontSize: 24,
                    color: COLORS.dim,
                  }}
                >
                  {v === 0 ? "0" : `${v / 10000}만`}
                </div>
              </React.Fragment>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: X0 + 12,
              top: PANEL_TOP - 38,
              whiteSpace: "nowrap",
              fontFamily: FONTS.body,
              fontWeight: 500,
              fontSize: 24,
              color: COLORS.muted,
              letterSpacing: -0.2,
            }}
          >
            인구밀도 · 명/㎢ · 선형 눈금
          </div>
        </div>

        <SteelRow label="서울" value={SEOUL} y={ROW_SEOUL_Y} start={F_SEOUL} mult="×17" multStart={F_TAGS} />
        <SteelRow label="맨해튼" value={MANHATTAN} y={ROW_MAN_Y} start={F_MAN} mult="×9" multStart={F_TAGS + 5} />
        <LineRow crossFrame={crossFrame} />

        {/* 뚫린 테두리가 번쩍이는 세로 섬광 */}
        {burst > 0.02 ? (
          <div
            style={{
              position: "absolute",
              left: PANEL_RIGHT - 3,
              top: ROW_LINE_Y - 150,
              width: 6,
              height: 300,
              background: `linear-gradient(180deg, transparent, #ffffff 40%, #ffffff 60%, transparent)`,
              boxShadow: `0 0 24px ${COLORS.neon}`,
              opacity: burst,
              transform: `scaleY(${0.6 + (1 - burst) * 0.9})`,
            }}
          />
        ) : null}
        {/* 패널 테두리를 뚫는 순간 파열 글로우 */}
        {burst > 0.02 ? (
          <div
            style={{
              position: "absolute",
              left: PANEL_RIGHT - 220,
              top: ROW_LINE_Y - 220,
              width: 440,
              height: 440,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffffffcc 0%, ${COLORS.neon}88 22%, transparent 65%)`,
              opacity: burst,
              transform: `scale(${1 + (1 - burst) * 0.8})`,
            }}
          />
        ) : null}

        {/* 시안 막대 아래 큰 숫자 */}
        <div
          style={{
            position: "absolute",
            left: X0,
            top: ROW_LINE_Y + 104,
            display: "flex",
            alignItems: "flex-end",
            gap: 26,
            opacity: numO,
          }}
        >
          <BigNumber
            // 막대 길이와 1:1 로 맞물려 오르는 값 (선형 눈금을 숫자로도 느끼게)
            value={Math.round(LINE * progress(frame, F_LINE, F_LINE_END, lineEase))}
            start={0}
            duration={0}
            unit="명/㎢"
            size={104}
            align="left"
          />
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 700,
              fontSize: 32,
              color: COLORS.neon,
              border: `1.5px solid ${COLORS.neon}88`,
              borderRadius: 8,
              padding: "2px 12px",
              marginBottom: 22,
              whiteSpace: "nowrap",
            }}
          >
            계산
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: X0 + 4,
            top: ROW_LINE_Y + 256,
            fontFamily: FONTS.body,
            fontWeight: 500,
            fontSize: 28,
            color: COLORS.muted,
            opacity: noteO * 0.9,
            letterSpacing: -0.2,
            whiteSpace: "nowrap",
          }}
        >
          부지 34㎢ 기준 · 층 면적 아님
        </div>
      </AbsoluteFill>

      {/* 화면 밖으로 넘친 막대가 오른쪽 가장자리에 남기는 빛 */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: ROW_LINE_Y - 260,
          width: 360,
          height: 520,
          background: `radial-gradient(ellipse at 100% 50%, ${COLORS.neon}40 0%, transparent 70%)`,
          opacity: edgeGlow * contentO,
        }}
      />

      {/* 자막 가독성용 하단 어둠 띠 */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 72%, rgba(5,6,15,0.75) 90%)",
          pointerEvents: "none",
        }}
      />
      {/* 한 줄씩 별도 Caption: 같은 자리에서 교차 페이드 (리플로 없음) */}
      <Caption lines={[{ text: "1㎢당 **26만 명**이 산다 (계산)", from: 0.3, to: 3.1 }]} />
      <Caption lines={[{ text: "서울의 **17배**, 맨해튼의 **9배**", from: 3.1, to: 6.6 }]} />

      <Vignette strength={0.6} />
      <Grain />
      <DreamLetterBox />
      <ExperimentChip index="실험 1" title="인구밀도" start={-4} />
      <DisclaimerTag start={-12} />
      <SourceTag label="계산" text="900만 ÷ 34㎢ · 서울 2022 · 맨해튼 2020" start={14} end={durationInFrames} />
    </SceneFrame>
  );
};
