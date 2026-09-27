// 자동 생성: node tools/scaffold-scenes.mjs — 장면 하나만 번들하는 미리보기 진입점.
import React from "react";
import { Composition, registerRoot } from "remotion";
import "../fonts.css";
import { S06Shadow } from "../scenes/S06Shadow";

const PreviewRoot: React.FC = () => (
  <Composition id="Scene-S06Shadow" component={S06Shadow} durationInFrames={198} fps={30} width={1920} height={1080} />
);

registerRoot(PreviewRoot);
