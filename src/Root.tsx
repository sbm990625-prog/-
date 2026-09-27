import React from "react";
import { Composition } from "remotion";
import "./fonts.css";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { GalleryAerial, GalleryBars, GalleryData, GalleryHeights, GalleryNeon, GallerySection, GallerySound, GalleryWall } from "./Gallery";

const galleries = {
  GalleryWall,
  GallerySection,
  GalleryAerial,
  GalleryData,
  GalleryBars,
  GalleryHeights,
  GalleryNeon,
  GallerySound,
};

export const Root: React.FC = () => {
  return (
    <>
      {Object.entries(galleries).map(([id, component]) => (
        <Composition key={id} id={id} component={component} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </>
  );
};
