import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s04-density — 실험 1 · 인구밀도. 900만 ÷ 34㎢ = 264,706명/㎢ (계산) = 서울 15,550명/㎢(2022)의 17.0배, 맨해튼 28,871명/㎢(2020)의 9.2배. 부지(바닥) 면적 기준이지 500m 높이의 연면적 기준이 아님을 각주로 밝혀 공정하게. 선형 스케일로 ×17을 몸으로 느끼게.
 * 19.8s → 26.4s (198 frames)
 * 비주얼: 헤더 칩 '실험 1 · 인구밀도'가 왼쪽 위에 쿵(thud SFX) 박히고 장면 내내 유지. BarCompare(scale: linear), 막대가 차례로 자람: 서울 15,550(강철색, 아주 짧음) → 맨해튼 28,871(강철색, 짧음) → 더 라인 264,706(시안). 마지막 막대가 패널 가장자리를 뚫고 화면 밖으로 넘쳐 나가며 글로우. 시안 막대 아래 BigNumber '264,706명/㎢'. 23.0s 막대 옆 '×17'·'×9' 태그 팝. 하단 작은 회색 각주 '부지 34㎢ 기준 · 층 면적 아님'. 서울 면적 실루엣 등 추가 요소는 넣지 않는다(과밀 방지). 자막 타이밍: 헤더 19.8–26.4 / L1 20.1–23.0 / L2 23.0–26.4.
 * 스텁 — 구현으로 교체할 것.
 */
export const S04Density: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s04-density (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "실험 1 · 인구밀도", from: 0.00, to: 2.10 },
    { text: "1㎢당 26만 명이 산다 (계산)", from: 2.20, to: 4.30 },
    { text: "서울의 17배, 맨해튼의 9배", from: 4.40, to: 6.50 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
