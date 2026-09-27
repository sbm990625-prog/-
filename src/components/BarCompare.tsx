import React from "react";
import { useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS } from "../theme";
import { fmt, progress } from "../utils/anim";

export type Bar = { label: string; value: number; color?: string; note?: string; highlight?: boolean };

type Props = {
  bars: Bar[];
  unit?: string;
  /** 큰 격차를 보여줄 때 'sqrt' 또는 'log' */
  scale?: "linear" | "sqrt" | "log";
  start?: number;
  duration?: number;
  /** 막대 최대 길이 (px) */
  maxWidth?: number;
  x?: number;
  y?: number;
  rowHeight?: number;
  labelWidth?: number;
  decimals?: number;
  title?: string;
};

const tf = (v: number, scale: Props["scale"]) => (scale === "sqrt" ? Math.sqrt(v) : scale === "log" ? Math.log10(v + 1) : v);

/** 가로 막대 비교 차트 (인구밀도·높이·비용 비교용). 막대는 순차적으로 자란다. */
export const BarCompare: React.FC<Props> = ({
  bars,
  unit = "",
  scale = "linear",
  start = 0,
  duration = 40,
  maxWidth = 1100,
  x = 200,
  y = 300,
  rowHeight = 120,
  labelWidth = 360,
  decimals = 0,
  title,
}) => {
  const frame = useCurrentFrame();
  const max = Math.max(...bars.map((b) => tf(b.value, scale)));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: labelWidth + maxWidth + 300 }}>
      {title ? (
        <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 40, color: COLORS.muted, marginBottom: 30 }}>{title}</div>
      ) : null}
      {bars.map((b, i) => {
        const s = start + i * 10;
        const p = progress(frame, s, s + duration, Easing.out(Easing.cubic));
        const w = (tf(b.value, scale) / max) * maxWidth * p;
        const color = b.color ?? (b.highlight ? COLORS.neon : COLORS.dim);
        return (
          <div key={b.label} style={{ display: "flex", alignItems: "center", height: rowHeight, opacity: progress(frame, s - 4, s + 6) }}>
            <div
              style={{
                width: labelWidth,
                fontFamily: FONTS.body,
                fontWeight: b.highlight ? 900 : 500,
                fontSize: 40,
                color: b.highlight ? COLORS.ink : COLORS.muted,
                textAlign: "right",
                paddingRight: 30,
                wordBreak: "keep-all",
              }}
            >
              {b.label}
            </div>
            <div style={{ position: "relative", width: maxWidth, height: rowHeight * 0.5 }}>
              <div
                style={{
                  width: w,
                  height: "100%",
                  background: b.highlight ? `linear-gradient(90deg, ${color}, #ffffff)` : color,
                  borderRadius: 4,
                  boxShadow: b.highlight ? `0 0 30px ${color}` : undefined,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: w + 24,
                  top: -6,
                  fontFamily: FONTS.num,
                  fontWeight: 700,
                  fontSize: 44,
                  color: b.highlight ? COLORS.ink : COLORS.muted,
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(b.value * p, decimals)}
                {unit ? <span style={{ fontFamily: FONTS.body, fontSize: 30, marginLeft: 8 }}>{unit}</span> : null}
                {b.note ? <span style={{ fontFamily: FONTS.body, fontSize: 26, color: COLORS.muted, marginLeft: 14, fontWeight: 500 }}>{b.note}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
