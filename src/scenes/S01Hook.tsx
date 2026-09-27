import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s01-hook — 첫 1초에 숫자 하나(170km)와 이미지 하나(밤 사막을 가로지르는 빛의 선)로 붙잡는다. 시청자가 검색했을 '네온 시티'를 글리치로 정식 이름 네옴(NEOM)으로 바로잡고, 어원 라벨(NEO+M)로 이름을 각인한 뒤 질문형 제목을 띄운다.
 * 0s → 7s (210 frames)
 * 비주얼: 0.0s 검은 화면, 0.1s Flash + 베이스 히트. 0.2~1.0s LineAerial(night, sea) 궤도 시점: 밤 사막을 왼쪽→오른쪽으로 가르는 시안 머리카락 선이 약 0.8초 만에 점화되며 그려지고(휘익 SFX), 0.3s부터 선 아래 눈금 라벨 '170km'. 별이 반짝이고 카메라는 느리게 푸시인. LetterBox 켜짐(약속 구간 표식, s08 끝까지 유지). 0.9s 화면 중앙에 NeonText '네온 시티?'가 마젠타로 지직. 2.6s Glitch RGB 분리 + 지직 SFX → 시안 '사우디 네옴(NEOM) '더 라인''으로 뒤집힘. 2.8~4.6s 그 아래 작은 어원 라벨 'NEO(새로운) + M(미래)'. 4.6s 라벨 자리에 흰색 굵은 제목 '진짜로 지어졌다면?'이 TypeWriter로 찍힘. Grain·Vignette·약한 Scanlines. 자막 타이밍: 네온 시티? 0.9–2.6 / 이름 2.6–7.0 / 어원 2.8–4.6 / 제목 4.6–7.0.
 * 스텁 — 구현으로 교체할 것.
 */
export const S01Hook: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s01-hook (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "네온 시티?", from: 0.00, to: 1.65 },
    { text: "사우디 네옴(NEOM) '더 라인'", from: 1.75, to: 3.40 },
    { text: "NEO(새로운) + M(미래)", from: 3.50, to: 5.15 },
    { text: "진짜로 지어졌다면?", from: 5.25, to: 6.90 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
