import React from "react";
import { Composition } from "remotion";
import "./fonts.css";
import { FPS, HEIGHT, WIDTH } from "./theme";
import * as Gallery from "./Gallery";

const galleries = Gallery as Record<string, React.FC>;

export const Root: React.FC = () => {
  return (
    <>
      {Object.entries(galleries).map(([id, component]) => (
        <Composition key={id} id={id} component={component} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </>
  );
};
