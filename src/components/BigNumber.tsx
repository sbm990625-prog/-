import React from "react";
import { useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS, glow } from "../theme";
import { fmt, progress } from "../utils/anim";

type Props = {
  value: number;
  from?: number;
  /** 카운트 시작/끝 프레임 (장면 기준) */
  start?: number;
  duration?: number;
  decimals?: number;
  unit?: string;
  label?: string;
  sub?: string;
  color?: string;
  size?: number;
  align?: "center" | "left";
  style?: React.CSSProperties;
};

/** 커다란 숫자 카운터 (Orbitron 숫자 + 한글 단위/라벨) */
export const BigNumber: React.FC<Props> = ({
  value,
  from = 0,
  start = 0,
  duration = 40,
  decimals = 0,
  unit,
  label,
  sub,
  color = COLORS.neon,
  size = 200,
  align = "center",
  style,
}) => {
  const frame = useCurrentFrame();
  const p = frame >= start + duration ? 1 : progress(frame, start, start + duration, Easing.out(Easing.exp));
  const current = from + (value - from) * p;
  const appear = progress(frame, start - 4, start + 8);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        opacity: appear,
        transform: `scale(${0.92 + 0.08 * appear})`,
        ...style,
      }}
    >
      {label ? (
        <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: size * 0.22, color: COLORS.muted, marginBottom: 8 }}>
          {label}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "baseline", gap: size * 0.08 }}>
        <span
          style={{
            fontFamily: FONTS.num,
            fontWeight: 900,
            fontSize: size,
            color: COLORS.ink,
            textShadow: glow(color, 0.8),
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 2,
          }}
        >
          {fmt(current, decimals)}
        </span>
        {unit ? (
          <span style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: size * 0.42, color }}>{unit}</span>
        ) : null}
      </div>
      {sub ? (
        <div style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: size * 0.18, color: COLORS.muted, marginTop: 6 }}>{sub}</div>
      ) : null}
    </div>
  );
};
