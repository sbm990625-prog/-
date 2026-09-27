import React, { createContext, useContext } from "react";
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

/**
 * 전체 영상(Main)이 장면 경계를 직접 처리할 때 알려 주는 컨텍스트.
 * managedIn/managedOut 이 true 면 SceneFrame 은 그쪽 경계의 페이드를 생략한다
 * (Main 이 장면을 겹쳐 크로스페이드하므로, 장면마다 검정으로 빠지면 경계가 꺼져 보인다).
 * 장면을 단독으로 미리 볼 때는 컨텍스트가 없으므로 원래 페이드가 그대로 적용된다.
 */
export const HandoffContext = createContext<{ managedIn: boolean; managedOut: boolean }>({ managedIn: false, managedOut: false });

/** 모든 장면의 바깥 틀: 배경색 + 장면 경계 페이드. */
export const SceneFrame: React.FC<Props> = ({ children, background = COLORS.bg, fadeIn: fadeInProp = 10, fadeOut: fadeOutProp = 10, style }) => {
  const frame = useCurrentFrame();
  const handoff = useContext(HandoffContext);
  const fadeIn = handoff.managedIn ? 0 : fadeInProp;
  const fadeOut = handoff.managedOut ? 0 : fadeOutProp;
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
