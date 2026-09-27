// 자동 생성: node tools/scaffold-scenes.mjs — 장면 하나만 번들하는 미리보기 진입점.
import React from "react";
import { Composition, registerRoot } from "remotion";
import "../fonts.css";
import { S08CarbonPivot } from "../scenes/S08CarbonPivot";

const PreviewRoot: React.FC = () => (
  <Composition id="Scene-S08CarbonPivot" component={S08CarbonPivot} durationInFrames={246} fps={30} width={1920} height={1080} />
);

registerRoot(PreviewRoot);
