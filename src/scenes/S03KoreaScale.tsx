import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s03-korea-scale — 규모를 한국 것으로 바꾼다. 길이 = 서울시청~강릉시청 직선거리 168.4km(도로·KTX 거리 아님). 높이 = 롯데월드타워(555m)보다 55m 낮은 500m, 참고로 부르즈 할리파 828m. 그런 벽이 200m 간격으로 두 줄 마주 선다.
 * 13.6s → 19.8s (186 frames)
 * 비주얼: 13.6~16.7s 지도가 아닌 추상 스트립: 강철색 점선 '서울' → '강릉 · 직선 168km'가 미끄러져 들어와 시안 '더 라인 170km' 막대 위에 겹치며 거의 딱 맞물림(스냅 SFX). 16.7~19.8s HeightCompare 기준선 위 실루엣: 롯데월드타워 555m(강철색), 더 라인 500m(시안 거울 슬랩, 오른쪽 화면 밖으로 계속 이어져 170km를 암시), 부르즈 할리파 828m(흐린 강철색). 높이 라벨 카운트업. 18.3s 더 라인 슬랩이 두 장으로 복제되어 서로 마주 보고 사이에 '간격 200m' 라벨. 63빌딩 등 파일에 높이 근거가 없는 건물은 쓰지 않는다. 자막 타이밍: L1 13.8–16.7 / L2 16.7–19.8.
 * 스텁 — 구현으로 교체할 것.
 */
export const S03KoreaScale: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s03-korea-scale (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "길이는 서울~강릉 직선거리", from: 0.00, to: 3.00 },
    { text: "롯데월드타워급 벽이 두 줄", from: 3.10, to: 6.10 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
