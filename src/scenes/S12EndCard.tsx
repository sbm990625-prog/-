import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s12-end-card — 오프닝의 170km 빛의 선을 되받는 엔드 카드: 선이 구간별로 꺼져 2.4km 앰버 불씨만 남는다. 170km 대 2.4km로 요약하고, 거울 은유로 열린 질문을 남긴다. 마지막으로 읽히는 글자는 정식 이름 네옴(NEOM) · 더 라인.
 * 84.8s → 91s (186 frames)
 * 비주얼: 오프닝을 되받는 LineAerial 궤도 밤 시점. 170km 시안 선 전체가 네온처럼 빛나다가 먼 끝부터 구간별로 약한 전기 지직 소리와 함께 꺼지고, 2.4km 앰버 불씨 하나만 어둠 속에서 숨 쉬듯 남는다. 별·Vignette·옅은 Grain. 85.1s L1이 불씨 아래 페이드인. 87.4s L1이 빠지고 L2가 가운데 더 크게 따뜻한 흰색으로 — 아래에 거울면처럼 뒤집힌 옅은 반사가 생겼다가 물결치며 사라진다. 하단 작은 락업 '네옴(NEOM) · 더 라인(THE LINE)'. 마지막 0.5초 불씨가 어두워지고 LetterBox가 살짝 닫히며 검정으로 페이드. 음악은 지속음 하나로 끝, CTA 없음. 자막 타이밍: L1 85.1–87.4 / L2 87.4–91.0 / 락업 87.4–91.0.
 * 스텁 — 구현으로 교체할 것.
 */
export const S12EndCard: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s12-end-card (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "170km의 약속, 2.4km의 기초", from: 0.00, to: 1.97 },
    { text: "그 거울은 누구의 미래를 비췄을까", from: 2.07, to: 4.03 },
    { text: "네옴(NEOM) · 더 라인(THE LINE)", from: 4.13, to: 6.10 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
