import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./theme";
import {
  BarCompare,
  BigNumber,
  Caption,
  Desert,
  Grain,
  HeightCompare,
  LineAerial,
  LineSection,
  MirrorWall,
  NeonText,
  PerspectiveGrid,
  SceneFrame,
  Soundtrack,
  Vignette,
} from "./components";

/** 컴포넌트 미리보기용 컴포지션들 — 최종 영상엔 안 들어간다. */
export const GalleryWall: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Desert time="dawn" horizon={600} sunX={0.8} />
    <MirrorWall horizon={600} sunReflect={0.3} skyColors={["#0a0f2a", "#4a2c5e", "#ff9a6a"]} groundColors={["#8a5a3a", "#2e1c14"]} sunColor="#ffd0a0" />
    <Vignette />
    <Grain />
    <Caption lines={[{ text: "높이 **500m**, 길이 **170km**의 거울 벽", from: 0, to: 5 }]} />
  </SceneFrame>
);

export const GallerySection: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0} background={COLORS.bg2}>
    <LineSection revealStart={0} revealDuration={40} />
    <Caption lines={[{ text: "단면: 폭 200m × 높이 500m", from: 0, to: 5 }]} position="top" />
  </SceneFrame>
);

export const GalleryAerial: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <LineAerial drawStart={0} drawDuration={50} label="170 km" />
    <Vignette />
    <Caption lines={[{ text: "홍해에서 사막을 가로질러 **170km**", from: 0, to: 5 }]} />
  </SceneFrame>
);

export const GalleryData: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <PerspectiveGrid opacity={0.25} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <BigNumber value={9000000} unit="명" label="계획 인구" start={5} duration={40} />
    </AbsoluteFill>
    <Vignette />
  </SceneFrame>
);

export const GalleryBars: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <BarCompare
      title="인구밀도 (명/km²)"
      scale="sqrt"
      unit=""
      bars={[
        { label: "서울", value: 15700 },
        { label: "맨해튼", value: 28000 },
        { label: "더 라인 (계산)", value: 265000, highlight: true },
      ]}
      start={0}
      duration={40}
    />
    <Vignette />
  </SceneFrame>
);

export const GalleryHeights: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Desert time="night" horizon={900} duneLayers={1} />
    <HeightCompare
      towers={[
        { label: "63빌딩", meters: 249, width: 70 },
        { label: "롯데월드타워", meters: 555, width: 80, shape: "spire" },
        { label: "더 라인", meters: 500, width: 320, highlight: true, shape: "slab" },
        { label: "부르즈 할리파", meters: 828, width: 70, shape: "spire" },
      ]}
      pxPerMeter={0.85}
      baseY={900}
    />
    <Vignette />
  </SceneFrame>
);

export const GalleryNeon: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
      <NeonText size={150} flicker={0.5}>
        네온 시티
      </NeonText>
      <NeonText size={80} font="num" color={COLORS.magenta}>
        2045.09.27
      </NeonText>
    </AbsoluteFill>
  </SceneFrame>
);

export const GallerySound: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Soundtrack
      pad={[[0, 0.8]]}
      pulse={[[0, 0], [1, 0.7]]}
      wind={[[0, 0.5]]}
      sfx={[
        { name: "fx-whoosh", at: 0.2 },
        { name: "fx-impact", at: 1.5 },
        { name: "fx-tick", at: 3.0, volume: 0.6 },
      ]}
    />
    <NeonText size={100}>사운드 테스트</NeonText>
  </SceneFrame>
);
