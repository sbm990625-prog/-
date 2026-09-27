import React from "react";
import { random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, glow } from "../theme";

type Props = {
  children: React.ReactNode;
  color?: string;
  size?: number;
  font?: "display" | "body" | "num";
  weight?: number;
  /** 네온 깜빡임 (0=없음, 1=강함) */
  flicker?: number;
  strength?: number;
  style?: React.CSSProperties;
};

/** 네온사인 느낌의 발광 텍스트 */
export const NeonText: React.FC<Props> = ({
  children,
  color = COLORS.neon,
  size = 120,
  font = "display",
  weight,
  flicker = 0,
  strength = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = flicker > 0 ? 1 - flicker * (random(`flicker-${frame}`) < 0.08 ? 0.6 : 0) : 1;
  return (
    <div
      style={{
        fontFamily: FONTS[font],
        fontWeight: weight ?? (font === "body" ? 900 : undefined),
        fontSize: size,
        color: COLORS.ink,
        textShadow: glow(color, strength * f),
        opacity: 0.85 + 0.15 * f,
        lineHeight: 1.15,
        letterSpacing: font === "num" ? 2 : -1,
        wordBreak: "keep-all",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
