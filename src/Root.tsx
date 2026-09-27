import React from "react";
import { Composition } from "remotion";
import "./fonts.css";
import { FPS, HEIGHT, WIDTH } from "./theme";
import * as Gallery from "./Gallery";
import { THUMB, Thumbnail } from "./Thumbnail";

const galleries = Gallery as Record<string, React.FC>;

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={THUMB.width} height={THUMB.height} />
      {Object.entries(galleries).map(([id, component]) => (
        <Composition key={id} id={id} component={component} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </>
  );
};
