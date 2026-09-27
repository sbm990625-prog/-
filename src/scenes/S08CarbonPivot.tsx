import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s08-carbon-pivot — 실험 5 · 탄소, 그리고 전환. 올드필드 교수(UNSW) 추정 내재 탄소 18억 톤 이상 = 영국 전체 배출 4년치 이상(1인 전문가 추정이므로 '추정'). 이어서 카메라가 빠지며 빛나는 170km 전체를 보여 주고 '여기까지가, 약속이었다' — 음악이 음 중간에 끊기고 6프레임 검정, 현실로 하드 컷(약 57초).
 * 49s → 57.2s (246 frames)
 * 비주얼: 헤더 '실험 5 · 탄소'. 49.0~54.4s 작고 어두운 입자 큐브들이 연기 기둥처럼 솟아 쌓이며 BigNumber 'CO₂ 18억 톤'(낮은 붐 SFX). 51.9s 옆에 강철색 비교 태그 '영국 약 4년치+'. 54.4s 헤더가 빠지고 카메라가 크게 위로 빠지며 새벽 LineAerial 와이드: 170km 전체가 시안으로 빛나고 GlowBlob 블룸, 음악 절정. 54.4~57.0s 캡션 '여기까지가, 약속이었다'(중앙, 흰색). 57.0s 음악이 음 중간에 끊김 → 57.0~57.2s 6프레임 순수 검정 + 마른 클릭 SFX, 그 사이 LetterBox 제거. 자막 타이밍: 헤더 49.0–54.4 / L1 49.2–51.9 / L2 51.9–54.4 / L3 54.4–57.0.
 * 스텁 — 구현으로 교체할 것.
 */
export const S08CarbonPivot: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s08-carbon-pivot (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "실험 5 · 탄소", from: 0.00, to: 1.95 },
    { text: "짓는 데만 CO₂ 18억 톤 (추정)", from: 2.05, to: 4.00 },
    { text: "영국 배출량 4년치 이상", from: 4.10, to: 6.05 },
    { text: "여기까지가, 약속이었다", from: 6.15, to: 8.10 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
