import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { fadeInOut } from "../utils/anim";

type Props = {
  children: React.ReactNode;
  background?: string;
  /** 장면 시작/끝의 페이드 프레임 수 (0이면 하드 컷) */
  fadeIn?: number;
  fadeOut?: number;
  style?: React.CSSProperties;
};

/** 모든 장면의 바깥 틀: 배경색 + 장면 경계 페이드. */
export const SceneFrame: React.FC<Props> = ({ children, background = COLORS.bg, fadeIn = 10, fadeOut = 10, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacityIn = fadeIn > 0 ? Math.min(1, frame / fadeIn) : 1;
  const opacityOut = fadeOut > 0 ? Math.min(1, (durationInFrames - frame) / fadeOut) : 1;
  const opacity = fadeIn === 0 && fadeOut === 0 ? 1 : Math.max(0, Math.min(opacityIn, opacityOut));
  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity, ...style }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// fadeInOut 은 개별 요소용으로도 재수출
export { fadeInOut };
