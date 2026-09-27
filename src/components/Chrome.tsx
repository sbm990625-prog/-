import React from "react";
import { useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { COLORS, FONTS, SAFE } from "../theme";
import { progress } from "../utils/anim";

/**
 * 장면들이 공유하는 '크롬'(화면 틀 요소). 장면마다 같은 모양·위치로 보이도록 여기서만 정의한다.
 *  - ExperimentChip: 왼쪽 위 '실험 N · 제목' 헤더 칩 (s04–s08), 인적 비용 헤더(s11)도 color 로 재사용
 *  - DisclaimerTag: '※ 공식 발표 수치 기반 가상 재구성' (s02–s08, 오른쪽 위 작은 태그)
 *  - DreamLetterBox: 약속 구간(s01–s08) 레터박스. out 을 주면 장면 끝에서 열린다.
 */

type ChipProps = {
  /** "실험 1" 같은 번호 부분 (없으면 제목만) */
  index?: string;
  title: string;
  /** 등장/퇴장 프레임 (장면 기준). end 없으면 장면 끝까지 */
  start?: number;
  end?: number;
  color?: string;
};

export const ExperimentChip: React.FC<ChipProps> = ({ index, title, start = 0, end, color = COLORS.neon }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const e = end ?? durationInFrames;
  // '쿵' 박히는 느낌: 살짝 크게 들어와 제자리로
  const p = progress(frame, start, start + 10, Easing.out(Easing.back(2)));
  const out = 1 - progress(frame, e - 8, e);
  const o = Math.min(progress(frame, start, start + 4), out);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x,
        top: SAFE.y + 40,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: o,
        transform: `scale(${1.25 - 0.25 * p})`,
        transformOrigin: "left center",
      }}
    >
      {index ? (
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 40,
            color: COLORS.bg,
            background: color,
            padding: "4px 16px 2px",
            borderRadius: 6,
            boxShadow: `0 0 24px ${color}66`,
          }}
        >
          {index}
        </div>
      ) : null}
      <div style={{ fontFamily: FONTS.display, fontSize: 44, color: COLORS.ink, textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>{title}</div>
    </div>
  );
};

export const DisclaimerTag: React.FC<{ start?: number; text?: string }> = ({ start = 0, text = "※ 공식 발표 수치 기반 가상 재구성" }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, start + 12) * 0.85;
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: SAFE.x,
        top: SAFE.y + 44,
        opacity: o,
        fontFamily: FONTS.body,
        fontWeight: 500,
        fontSize: 24,
        color: COLORS.muted,
        letterSpacing: -0.2,
      }}
    >
      {text}
    </div>
  );
};

type LBProps = {
  /** 레터박스 높이 (px) */
  height?: number;
  /** 장면 시작에서 닫히며 들어올지 (s01 만 true) */
  animateIn?: boolean;
  /** 장면 끝 N 프레임 동안 열리며 사라질지 (s08 끝) */
  outFrames?: number;
};

export const DreamLetterBox: React.FC<LBProps> = ({ height = 84, animateIn = false, outFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = animateIn ? progress(frame, 0, 20) : 1;
  const outP = outFrames > 0 ? 1 - progress(frame, durationInFrames - outFrames, durationInFrames) : 1;
  const h = height * Math.min(inP, outP);
  if (h <= 0.5) return null;
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: "#000" }} />
    </>
  );
};
