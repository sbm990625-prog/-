import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * s10-headlines-2026 — 2026년 현실 타임라인, 카드 3장(각 3.5~4초). 한국 연결고리(삼성물산·현대건설 터널 계약 해지)를 가장 길게. 보도(reported-only) 항목은 카드마다 매체·날짜. 2030 인구 목표 150만 → 30만 → 약 10만을 날짜 칩과 함께. s02의 '900만 명'에 취소선. PIF 총재의 '취소된 사업 없다' 반론을 각주로 달아 공정하게.
 * 64s → 75.2s (336 frames)
 * 비주얼: Headlines 컴포넌트: 로고·마스트헤드 없는 평평한 어두운 카드, 앰버 날짜 스탬프, 모서리에 매체 텍스트. 새 카드가 가운데 크게 오고 이전 카드는 작아지고 흐려져 뒤로 쌓여 읽히지 않는 질감으로만 남는다(동시에 읽히는 줄 최대 2). 뒤로 s09의 흐린 시안 170km 유령선이 깜빡. 카드1 64.2~68.2s 날짜 '2026.03': 헤드라인 + 보조줄 '약 10억 달러 수주(2022) → 해지' — '약 10억 달러 수주(2022)'는 흐린 시안, '해지'는 앰버(종이 쾅 SFX). 카드2 68.2~71.7s 날짜 '2026.05': 오른쪽에 작은 라벨 '2030 인구 목표'와 BigNumber 1,500,000 → 300,000 → 약 100,000(두 번 떨어짐), 각 단계 밑 날짜 칩 '원래 계획' · '블룸버그 2024.04' · '세마포 2026.05'. 카드3 71.7~75.2s 날짜 '2026.06 수정 · 2026.07 보도': 카드가 닿는 순간 s02의 '9,000,000명' 카운터 유령이 떠올라 앰버-빨강 취소선이 그어지고 먼지 입자로 흩어짐. 동시에 하단 회색 각주 'PIF 총재 '취소된 네옴 사업 없다''(+출처 태그). 터널 금액은 '약 10억 달러'만 쓰고 원화·지분·7231억원은 섞지 않는다. 자막 타이밍: 카드1 64.2–68.2(보조 64.8–68.2) / 카드2 68.2–71.7 / 카드3 71.7–75.2(각주 71.9–75.2).
 * 스텁 — 구현으로 교체할 것.
 */
export const S10Headlines2026: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>s10-headlines-2026 (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
    { text: "삼성물산·현대건설 터널 계약 해지", from: 0.00, to: 2.14 },
    { text: "약 10억 달러 수주(2022) → 해지", from: 2.24, to: 4.38 },
    { text: "더 라인 공사, 2030년 이후로", from: 4.48, to: 6.62 },
    { text: "홈페이지서 '900만 명' 문구 삭제", from: 6.72, to: 8.86 },
    { text: "PIF 총재 '취소된 네옴 사업 없다'", from: 8.96, to: 11.10 },
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
