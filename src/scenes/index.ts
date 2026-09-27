// 자동 생성: node tools/scaffold-scenes.mjs (docs/storyboard.json 이 원본). 손으로 고치지 말 것.
import React from "react";
import { S01Hook } from "./S01Hook";
import { S02Premise } from "./S02Premise";
import { S03KoreaScale } from "./S03KoreaScale";
import { S04Density } from "./S04Density";
import { S05Train } from "./S05Train";
import { S06Shadow } from "./S06Shadow";
import { S07MirrorBirds } from "./S07MirrorBirds";
import { S08CarbonPivot } from "./S08CarbonPivot";
import { S09RealityTrench } from "./S09RealityTrench";
import { S10Headlines2026 } from "./S10Headlines2026";
import { S11HumanCost } from "./S11HumanCost";
import { S12EndCard } from "./S12EndCard";

export type SceneEntry = {
  id: string;
  name: string;
  component: React.FC;
  from: number;
  durationInFrames: number;
  handoff: string;
};

export const FPS = 30;
export const TOTAL_FRAMES = 2730;

export const SCENES: SceneEntry[] = [
  { id: "s01-hook", name: "S01Hook", component: S01Hook, from: 0, durationInFrames: 210, handoff: "whoosh push" },
  { id: "s02-premise", name: "S02Premise", component: S02Premise, from: 210, durationInFrames: 198, handoff: "whoosh push" },
  { id: "s03-korea-scale", name: "S03KoreaScale", component: S03KoreaScale, from: 408, durationInFrames: 186, handoff: "whoosh push" },
  { id: "s04-density", name: "S04Density", component: S04Density, from: 594, durationInFrames: 198, handoff: "whoosh push" },
  { id: "s05-train", name: "S05Train", component: S05Train, from: 792, durationInFrames: 288, handoff: "whoosh push" },
  { id: "s06-shadow", name: "S06Shadow", component: S06Shadow, from: 1080, durationInFrames: 198, handoff: "fade" },
  { id: "s07-mirror-birds", name: "S07MirrorBirds", component: S07MirrorBirds, from: 1278, durationInFrames: 192, handoff: "whoosh push" },
  { id: "s08-carbon-pivot", name: "S08CarbonPivot", component: S08CarbonPivot, from: 1470, durationInFrames: 246, handoff: "hard cut" },
  { id: "s09-reality-trench", name: "S09RealityTrench", component: S09RealityTrench, from: 1716, durationInFrames: 204, handoff: "whoosh push" },
  { id: "s10-headlines-2026", name: "S10Headlines2026", component: S10Headlines2026, from: 1920, durationInFrames: 336, handoff: "fade" },
  { id: "s11-human-cost", name: "S11HumanCost", component: S11HumanCost, from: 2256, durationInFrames: 288, handoff: "fade" },
  { id: "s12-end-card", name: "S12EndCard", component: S12EndCard, from: 2544, durationInFrames: 186, handoff: "fade to black" },
];
