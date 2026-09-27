import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s11-human-cost — 계산에 없던 비용 — 솔직한 순간. 2020년 1월 후와이타트 부족 약 2만 명에 퇴거 명령. 퇴거를 거부한 3명은 2022.10 사형 선고, 2023.01 항소심에서 유지(집행 아님 — '선고'로만 쓴다). ITV 다큐(2024.10)에서 더 라인 노동자들이 하루 16시간·14일 연속 노동을 증언. 논란 있는 2만1천 명 사망 수치(전체 사망자 기준)는 의도적으로 넣지 않는다.
 * 75.2s → 84.8s (288 frames)
 * 비주얼: 음악이 낮은 드론 하나로 떨어지고 색이 재(#1A1612)와 잉걸불(#FF9F43)로 빠진다. Desert(night) 별과 모래언덕 아주 흐리게. 모래언덕 위 작은 추상 집 실루엣 줄(단순 SVG 상자, 따뜻한 창문 점)이 첫 캡션과 함께 하나씩 꺼지고 윤곽만 남는다. 하단 Timeline 앰버 노드 3개가 캡션에 맞춰 켜짐: '2020.01 퇴거 명령' · '2022.10 선고 · 2023.01 항소심 유지' · '2024.10 ITV 증언'. 얼굴·인물 실루엣·피 없음, 절제가 의도. 헤더 '계산에 없던 비용'은 앰버로 왼쪽 위 유지. 캡션은 TypeWriter로 한 줄씩, 느린 타건 틱. 자막 타이밍: 헤더 75.2–84.8 / L1 75.5–79.1 / L2 79.1–82.2 / L3 82.2–84.8.
 * 스텁 — 구현으로 교체할 것.
 */
export const S11HumanCost: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s11-human-cost (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "계산에 없던 비용", from: 0.00, to: 2.30 },
    { text: "후와이타트족 약 2만 명, 퇴거 명령", from: 2.40, to: 4.70 },
    { text: "퇴거를 거부한 3명, 사형 선고", from: 4.80, to: 7.10 },
    { text: "현장 노동자 '하루 16시간'", from: 7.20, to: 9.50 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
