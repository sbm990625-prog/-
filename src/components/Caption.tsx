import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS, SAFE } from "../theme";
import { sec } from "../utils/anim";

export type CaptionLine = {
  text: string; // "**단어**" 로 감싸면 네온 강조
  from: number; // 초 (장면 기준)
  to: number; // 초
};

type Props = {
  lines: CaptionLine[];
  position?: "bottom" | "center" | "top" | "lowerThird";
  align?: "center" | "left";
  size?: number;
  color?: string;
  accent?: string;
  weight?: 500 | 700 | 900;
  maxWidth?: number;
  /** 등장 방향 (px) */
  rise?: number;
  style?: React.CSSProperties;
};

const renderRich = (text: string, accent: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith("**") ? (
      <span key={i} style={{ color: accent, textShadow: `0 0 18px ${accent}80` }}>
        {p.slice(2, -2)}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );
};

/**
 * 한글 자막. 각 줄은 자기 시간 구간에서 스르륵 떠올랐다 사라진다.
 * 여러 줄이 겹치는 시간에는 세로로 쌓인다 (최대 2줄 권장).
 */
export const Caption: React.FC<Props> = ({
  lines,
  position = "bottom",
  align = "center",
  size = 60,
  color = COLORS.ink,
  accent = COLORS.neon,
  weight = 700,
  maxWidth = 1500,
  rise = 28,
  style,
}) => {
  const frame = useCurrentFrame();
  const active = lines.filter((l) => frame >= sec(l.from) - 6 && frame <= sec(l.to) + 6);
  if (active.length === 0) return null;

  const posStyle: React.CSSProperties =
    position === "bottom"
      ? { bottom: SAFE.y + 30, left: 0, right: 0 }
      : position === "lowerThird"
        ? { bottom: SAFE.y + 150, left: 0, right: 0 }
        : position === "top"
          ? { top: SAFE.y + 20, left: 0, right: 0 }
          : { top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center" };

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        paddingLeft: align === "left" ? SAFE.x : 0,
        gap: 14,
        ...posStyle,
        ...style,
      }}
    >
      {active.map((l) => {
        const f0 = sec(l.from);
        const f1 = sec(l.to);
        const inP = interpolate(frame, [f0, f0 + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const outP = interpolate(frame, [f1 - 10, f1], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });
        const opacity = Math.min(inP, outP);
        const y = (1 - inP) * rise + (1 - outP) * -rise * 0.5;
        return (
          <div
            key={`${l.from}-${l.text}`}
            style={{
              fontFamily: FONTS.body,
              fontWeight: weight,
              fontSize: size,
              lineHeight: 1.35,
              color,
              opacity,
              transform: `translateY(${y}px)`,
              textAlign: align,
              maxWidth,
              whiteSpace: "pre-line",
              wordBreak: "keep-all",
              textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)",
              letterSpacing: -0.5,
            }}
          >
            {renderRich(l.text, accent)}
          </div>
        );
      })}
    </div>
  );
};
