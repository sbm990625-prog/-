import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { progress } from "../utils/anim";

export type Lane = {
  label: string; // "더 라인 (약속)"
  sub?: string; // "170km · 20분"
  minutes: number;
  color?: string;
  /** 도착 시 표시 (기본: "N분" / "N시간 M분") */
  finishText?: string;
};

type Props = {
  lanes: Lane[];
  start?: number;
  /** 가장 느린 레인이 도착하는 데 걸리는 프레임 */
  duration?: number;
  x1?: number;
  x2?: number;
  y?: number;
  laneGap?: number;
  labelWidth?: number;
};

const hm = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = Math.round(m - h * 60);
  return h > 0 ? `${h}시간${mm ? ` ${mm}분` : ""}` : `${mm}분`;
};

/** 같은 거리를 서로 다른 시간에 달리는 레인 비교 (약속 20분 vs KTX vs 실제 정차). 시간 비례로 움직인다. */
export const RaceLanes: React.FC<Props> = ({ lanes, start = 0, duration = 150, x1 = 560, x2 = 1400, y = 330, laneGap = 170, labelWidth = 400 }) => {
  const frame = useCurrentFrame();
  const maxMin = Math.max(...lanes.map((l) => l.minutes));
  const simMin = progress(frame, start, start + duration, (t) => t) * maxMin;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {lanes.map((l, i) => {
        const ly = y + i * laneGap;
        const p = Math.min(1, simMin / l.minutes);
        const done = p >= 1;
        const color = l.color ?? COLORS.neon;
        const tx = x1 + (x2 - x1) * p;
        return (
          <div key={l.label}>
            <div style={{ position: "absolute", left: x1 - labelWidth - 30, top: ly - 42, width: labelWidth, textAlign: "right" }}>
              <div style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 42, color: COLORS.ink, wordBreak: "keep-all" }}>{l.label}</div>
              {l.sub ? <div style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: 26, color: COLORS.muted }}>{l.sub}</div> : null}
            </div>
            <div style={{ position: "absolute", left: x1, top: ly - 3, width: x2 - x1, height: 6, background: COLORS.dim, borderRadius: 3 }} />
            <div style={{ position: "absolute", left: x1, top: ly - 3, width: tx - x1, height: 6, background: color, borderRadius: 3, boxShadow: `0 0 18px ${color}` }} />
            <div style={{ position: "absolute", left: tx - 14, top: ly - 14, width: 28, height: 28, borderRadius: 14, background: "#fff", boxShadow: `0 0 24px ${color}` }} />
            <div
              style={{
                position: "absolute",
                left: x2 + 30,
                top: ly - 30,
                fontFamily: FONTS.num,
                fontWeight: 900,
                fontSize: 44,
                color,
                opacity: done ? 1 : 0.35,
                whiteSpace: "nowrap",
              }}
            >
              {done ? (l.finishText ?? hm(l.minutes)) : hm(simMin)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
