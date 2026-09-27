import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s06-shadow — 실험 3 · 협곡의 햇빛. 북위 28.1°에서 동지 정오 태양고도 38.5°, 500m 벽의 그림자 629m = 간격 200m의 3배 (계산). 바닥에 정오 직사광이 닿는 기간은 약 4.7~9.5뿐이라 1년 중 약 214일은 한낮 해가 없다 (이상화한 동서 협곡 계산). 공정성: 네옴은 이 그늘을 공공 공간 냉방 설계로 설명했다는 점을 각주로 단다.
 * 36s → 42.6s (198 frames)
 * 비주얼: 헤더 칩 '실험 3 · 협곡의 햇빛'. CanyonSun(elevation 38.5, height 500, gap 200): 두 500m 벽과 200m 간격 단면(시안 와이어프레임). 황혼 하늘에 태양이 호를 그리다 고도 판독 38.5°(동지 정오)에 고정. 남쪽 벽에서 앰버-회색 그림자 쐐기가 간격을 가로질러 북쪽 벽까지 뻗고 치수 '그림자 629m', 브래킷 '간격 200m의 3배'. 39.0s 하단 1~12월 연간 띠: 4.7~9.5 구간만 따뜻하게 켜지고 나머지는 어두운 회색, 카운터 '214일 (계산)'. 바람 화살표 등 근거 없는 장식은 넣지 않는다. 자막 타이밍: 헤더 36.0–42.6 / L1 36.2–39.0 / L2 39.0–42.6.
 * 스텁 — 구현으로 교체할 것.
 */
export const S06Shadow: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s06-shadow (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "실험 3 · 협곡의 햇빛", from: 0.00, to: 2.10 },
    { text: "겨울 정오, 벽 그림자 629m (계산)", from: 2.20, to: 4.30 },
    { text: "한낮 해가 안 드는 날 214일 (계산)", from: 4.40, to: 6.50 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
