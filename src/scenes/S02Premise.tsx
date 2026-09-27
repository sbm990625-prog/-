import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s02-premise — 사고실험의 규칙을 선언한다: 약속대로 100% 완공됐다고 가정. 사양의 날짜를 정확히 단다 — 170km·무차량·20분은 2021.01 발표, 500m·200m·거울 외벽·900만 명·34㎢는 2022.07 디자인 공개.
 * 7s → 13.6s (198 frames)
 * 비주얼: LineSection(200m×500m) 단면이 시안 와이어프레임으로 그려지며 치수 라벨 '폭 200m'·'높이 500m'가 눈금처럼 올라온다. 10.1s 카메라가 뒤로·위로 빠지며 단면이 LineAerial(night)로 이어져 밤 사막을 가로지르는 170km 빛의 선이 되고 아래에 '170km' 치수 막대. 10.1s부터 왼쪽 위 날짜 칩 '2021 발표 → 2022 디자인 공개'. 11.9s 오른쪽 아래 BigNumber 0→9,000,000명(약 1.2초 카운트, 틱 SFX) 후 정지. 오른쪽 아래 SourceTag와 작은 '※ 공식 발표 수치 기반 가상 재구성' 태그(s08까지 유지). 캡션은 하단 1/3, 한 번에 한 줄. 자막 타이밍: L1 7.1–10.1 / L2 10.1–11.9 / 칩 10.1–13.6 / L3 11.9–13.6.
 * 스텁 — 구현으로 교체할 것.
 */
export const S02Premise: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s02-premise (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "약속대로 100% 완공됐다고 치자", from: 0.00, to: 1.55 },
    { text: "길이 170km, 높이 500m", from: 1.65, to: 3.20 },
    { text: "2021 발표 → 2022 디자인 공개", from: 3.30, to: 4.85 },
    { text: "900만 명이 산다", from: 4.95, to: 6.50 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
