import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s05-train — 실험 2 · 20분 열차. 약속은 2021.01 발표에서 처음 나오고 2022.07에 되풀이됐다. 170km ÷ 20분 = 평균 시속 510km, 무정차 (계산). KTX 최고 약 305km/h로 무정차 달려도 170 ÷ 305 × 60 = 33.4분 → 33분 (계산; 실제 KTX 운행 시간 아님). 2023 논문은 역 86개가 필요하다고 봤다. 85회 × 30초 = 정차만 42.5분 (계산; 30초 정차는 가정).
 * 26.4s → 36s (288 frames)
 * 비주얼: 헤더 칩 교체(thud). 26.4~32.6s PerspectiveGrid 바닥 위 RaceLanes 2레인(같은 170km): 위 시안 캡슐 '약속'—분 시계가 끝에 닿는 순간 20:00, 속도 판독이 '510 km/h'까지 카운트, 스피드 라인+휘익 SFX. 아래 강철색 캡슐 'KTX 305 km/h'는 시안이 도착할 때 약 60% 지점, 시계는 계속 흘러 33:24 → 라벨 '33분 (계산)'. 32.6~36.0s StationLine(stations=86)으로 전환: 같은 170km 선로에 역 눈금 86개가 왼→오 빠르게 팝(틱 SFX), 열차가 역마다 섰다 감. 모서리 시계는 '정차 시간만' 세며 0→42.5분, 점선 시안 '20분' 선을 넘는 순간 앰버로 바뀜. 각주 '역당 30초 가정 · 85회 × 30초 (계산)'. 논문의 '무작위 이동 60분 이상'이나 '평균 57km'는 이 장면에 넣지 않는다(정차 시간과 혼동 방지). 자막 타이밍: 헤더 26.4–36.0 / L1 26.6–29.4 / L2 29.4–32.6 / L3 32.6–36.0.
 * 스텁 — 구현으로 교체할 것.
 */
export const S05Train: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s05-train (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "실험 2 · 끝에서 끝까지 20분", from: 0.00, to: 2.30 },
    { text: "평균 시속 510km 필요 (계산)", from: 2.40, to: 4.70 },
    { text: "KTX 최고 속도로도 33분 (계산)", from: 4.80, to: 7.10 },
    { text: "역 86개, 정차만 42.5분 (계산)", from: 7.20, to: 9.50 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
