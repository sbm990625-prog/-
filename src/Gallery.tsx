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
  Glitch,
  SourceTag,
  Headlines,
  Timeline,
  PlanVsReality,
  StationLine,
  RaceLanes,
  BirdFlock,
  CanyonSun,
  TypeWriter,
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

export const GalleryReality: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Glitch start={0} end={20} seed="gr">
      <LineAerial drawStart={0} drawDuration={40} ghost built={2.4 / 170} builtLabel="2.4 km" />
    </Glitch>
    <Vignette />
    <Caption lines={[{ text: "2030년까지 목표: **170km 중 2.4km**", from: 1, to: 5 }]} accent={COLORS.amber} />
    <SourceTag text="블룸버그 · 2024.04" start={20} />
  </SceneFrame>
);

export const GalleryHeadlines: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Headlines
      start={0}
      stagger={18}
      items={[
        { outlet: "Bloomberg", date: "2024.04.05", text: "2030년 목표, 170km → 2.4km로 축소" },
        { outlet: "Hyundai E&C 공시", date: "2026.03.13", text: "더 라인 지하 터널 계약 해지" },
        { outlet: "Semafor", date: "2026.05.22", text: "더 라인 공사, 2030년 이후로 연기" },
      ]}
    />
  </SceneFrame>
);

export const GalleryTimeline: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Timeline
      start={0}
      stagger={10}
      events={[
        { date: "2021.01", label: "발표", color: COLORS.neon },
        { date: "2022.07", label: "거울 디자인 공개", color: COLORS.neon },
        { date: "2024.04", label: "2.4km로 축소" },
        { date: "2025.07", label: "전면 재검토" },
        { date: "2026.05", label: "2030년 이후로 연기" },
      ]}
    />
  </SceneFrame>
);

export const GalleryPlanReality: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <PlanVsReality
      title="계획 인구 vs 실제 인구"
      start={0}
      rows={[
        { label: "송도", plan: 265611, real: 212085, unit: "명", note: "2024.11" },
        { label: "마스다르", plan: 50000, real: 6000, unit: "명", note: "2024" },
        { label: "포레스트 시티", plan: 700000, real: 9000, unit: "명", note: "2024" },
      ]}
    />
  </SceneFrame>
);

export const GalleryTrain: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <StationLine stations={86} start={0} duration={140} totalMinutes={168} fromLabel="서쪽 끝" toLabel="동쪽 끝" y={420} />
    <StationLine express start={0} duration={40} totalMinutes={20} y={760} color={COLORS.magenta} />
  </SceneFrame>
);

export const GalleryRace: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <RaceLanes
      start={0}
      duration={100}
      lanes={[
        { label: "더 라인 약속", sub: "170km · 510km/h 필요", minutes: 20, color: COLORS.neon },
        { label: "KTX 서울→강릉", sub: "약 168km (직선)", minutes: 100, color: COLORS.neon2 },
        { label: "86개 역 모두 정차", sub: "계산 · 역마다 30초", minutes: 168, color: COLORS.amber },
      ]}
    />
  </SceneFrame>
);

export const GalleryBirds: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0}>
    <Desert time="dawn" horizon={700} />
    <MirrorWall horizon={700} vanishX={600} nearX={2000} sunReflect={0.4} skyColors={["#0a0f2a", "#4a2c5e", "#ff9a6a"]} groundColors={["#8a5a3a", "#2e1c14"]} />
    <BirdFlock start={0} duration={150} fromX={-200} toX={2200} wallX={1150} y={380} count={36} />
  </SceneFrame>
);

export const GalleryCanyon: React.FC = () => (
  <SceneFrame fadeIn={0} fadeOut={0} background={COLORS.bg2}>
    <CanyonSun elevation={38.6} label="동지 정오" />
    <div style={{ position: "absolute", left: 1300, top: 200 }}>
      <TypeWriter text="바닥까지 해가 들려면 68.2° 이상" start={0} speed={2} />
    </div>
  </SceneFrame>
);
