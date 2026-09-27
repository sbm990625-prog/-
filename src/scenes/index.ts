// 자리표시 — docs/storyboard.json 이 생기면 node tools/scaffold-scenes.mjs 가 덮어쓴다.
import React from "react";

export type SceneEntry = {
  id: string;
  name: string;
  component: React.FC;
  from: number;
  durationInFrames: number;
  transition: string;
};

export const FPS = 30;
export const TOTAL_FRAMES = 1;
export const SCENES: SceneEntry[] = [];
