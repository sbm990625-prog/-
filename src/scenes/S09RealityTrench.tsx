import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s09-reality-trench — 현실로. 숫자가 도달하는 자연스러운 결론. 2025년 4월 공개된 항공사진: 약 2.4km 길이의 콘크리트 기초 트렌치, 수직 구조물 없음. 2.4 ÷ 170 = 1.4% (계산). 2026년 현재형으로 쓰지 않고 사진 시점을 캡션에 박는다.
 * 57.2s → 64s (204 frames)
 * 비주얼: 평평하고 거친 한낮 빛, 앰버·모래·콘크리트 회색, 강한 Grain, 글로우 없음, LetterBox 없음(현실이 노출된 느낌). LineAerial(day, ghost, built = 2.4/170): 170km 계획은 흐린 시안 점선 유령선으로만 남고 한쪽 끝에 작은 앰버 구간. 카메라가 170km 전체에서 앰버 조각이 화면을 채울 때까지 빠르게 줌인 → 단순 SVG 긴 회색 트렌치, 낮은 옹벽과 배관, 위로 솟은 것은 하나도 없음. 콜아웃 '수직 구조물 없음'. 하단 PlanVsReality 막대: 100% 시안 윤곽 대 앰버 채움, 카운터가 1.4%에서 멈춤. 드라이 퍼커션·클릭. 자막 타이밍: L1 57.5–60.5 / L2 60.5–64.0.
 * 스텁 — 구현으로 교체할 것.
 */
export const S09RealityTrench: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s09-reality-trench (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "2025년 4월 항공사진 속 현장", from: 0.00, to: 3.30 },
    { text: "170km 중 약 2.4km, 기초뿐", from: 3.40, to: 6.70 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
