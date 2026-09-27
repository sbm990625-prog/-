// 자동 생성: node tools/scaffold-scenes.mjs. 갤러리/컴포지션 추가는 이 스크립트에서.
import React from "react";
import { Composition, Folder } from "remotion";
import "./fonts.css";
import { HEIGHT, WIDTH } from "./theme";
import { Main } from "./Main";
import { FPS, SCENES, TOTAL_FRAMES } from "./scenes";
import * as Gallery from "./Gallery";
import { THUMB, Thumbnail } from "./Thumbnail";

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={THUMB.width} height={THUMB.height} />
      <Folder name="Scenes">
        {SCENES.map((s) => (
          <Composition key={s.id} id={`Scene-${s.name}`} component={s.component} durationInFrames={s.durationInFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
        ))}
      </Folder>
      <Folder name="Gallery">
        {Object.entries(Gallery).map(([id, component]) => (
          <Composition key={id} id={id} component={component as React.FC} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} />
        ))}
      </Folder>
    </>
  );
};
