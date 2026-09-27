import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

type Props = {
  text: string;
  start?: number;
  /** 글자당 프레임 */
  speed?: number;
  size?: number;
  color?: string;
  font?: "display" | "body" | "num";
  weight?: number;
  cursor?: boolean;
  style?: React.CSSProperties;
};

/** 한 글자씩 타이핑되는 텍스트 (한글 음절 단위) + 깜빡이는 커서. */
export const TypeWriter: React.FC<Props> = ({ text, start = 0, speed = 2, size = 56, color = COLORS.ink, font = "body", weight = 700, cursor = true, style }) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const shown = Math.max(0, Math.min(chars.length, Math.floor((frame - start) / speed)));
  const done = shown >= chars.length;
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{ fontFamily: FONTS[font], fontWeight: weight, fontSize: size, color, whiteSpace: "pre-wrap", wordBreak: "keep-all", ...style }}>
      {chars.slice(0, shown).join("")}
      {cursor && frame >= start && (!done || blink) ? <span style={{ color: COLORS.neon, marginLeft: 2 }}>▍</span> : null}
    </div>
  );
};
