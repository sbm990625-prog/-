import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s07-mirror-birds — 실험 4 · 거울 벽. 외벽 170km × 500m × 2면 = 170㎢ = 서울 605.2㎢의 28% (계산). 이 벽은 홍해·리프트밸리 비행로(대형 철새 150만 마리+, 버드라이프/UNDP) 위에 선다. 2024 TREE 학술지 호라이즌 스캔: '이동 조류에 상당한 위험을 줄 가능성'. 사건이 아니라 위험(우려)으로 표현한다.
 * 42.6s → 49s (192 frames)
 * 비주얼: 헤더 칩 '실험 4 · 거울 벽'. 낮의 MirrorWall 정면 와이드: 거울이 하늘과 구름을 그대로 비춰 벽이 거의 사라져 보인다. 42.8s 단순화한 자체 SVG 서울 윤곽 실루엣이 거울면 위에 겹쳐지며 거울 면적 대비 28%만큼 채워짐(강철색). 45.6s BirdFlock V자 편대가 오른쪽→왼쪽으로 반사된 하늘을 향해 날아온다. 벽에 닿기 직전 프레임이 멈추고(freeze) 접촉 지점에 앰버 경고 링이 맥동 — 충돌 장면은 보여주지 않는다('가능성'이지 사건이 아님). 상단 리본 '홍해 비행로 · 대형 철새 150만 마리+'. 자막 타이밍: 헤더 42.6–49.0 / L1 42.8–45.6 / L2 45.6–49.0.
 * 스텁 — 구현으로 교체할 것.
 */
export const S07MirrorBirds: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s07-mirror-birds (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "실험 4 · 거울 벽", from: 0.00, to: 2.03 },
    { text: "거울 170㎢, 서울 28% (계산)", from: 2.13, to: 4.17 },
    { text: "학술지: 철새에 '상당한 위험' 우려", from: 4.27, to: 6.30 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
