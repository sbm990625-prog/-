import React from "react";
import { useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS } from "../theme";
import { fmt, progress } from "../utils/anim";

export type PlanRow = {
  label: string;
  plan: number;
  real: number;
  /** 값 뒤 단위 (예: "명", "km") */
  unit?: string;
  note?: string; // "2024.11" 같은 기준 시점
};

type Props = {
  rows: PlanRow[];
  start?: number;
  stagger?: number;
  x?: number;
  y?: number;
  barWidth?: number;
  rowHeight?: number;
  labelWidth?: number;
  title?: string;
  planLabel?: string;
  realLabel?: string;
};

/** 계획(외곽선 막대) vs 현실(채운 막대) — 각 행은 계획을 100%로 정규화해 달성률을 보여준다. */
export const PlanVsReality: React.FC<Props> = ({
  rows,
  start = 0,
  stagger = 14,
  x = 160,
  y = 260,
  barWidth = 1000,
  rowHeight = 130,
  labelWidth = 380,
  title,
  planLabel = "계획",
  realLabel = "현실",
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {title ? <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 40, color: COLORS.muted, marginBottom: 20 }}>{title}</div> : null}
      <div style={{ display: "flex", gap: 30, marginLeft: labelWidth, marginBottom: 16, fontFamily: FONTS.body, fontSize: 26, fontWeight: 700 }}>
        <span style={{ color: COLORS.muted, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 14, border: `2px solid ${COLORS.neon}`, borderRadius: 3 }} />
          {planLabel}
        </span>
        <span style={{ color: COLORS.muted, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 14, background: COLORS.amber, borderRadius: 3 }} />
          {realLabel}
        </span>
      </div>
      {rows.map((r, i) => {
        const s = start + i * stagger;
        const pPlan = progress(frame, s, s + 20, Easing.out(Easing.cubic));
        const pReal = progress(frame, s + 16, s + 46, Easing.out(Easing.cubic));
        const ratio = Math.min(1, r.real / r.plan);
        const pct = ratio * 100;
        return (
          <div key={r.label} style={{ display: "flex", alignItems: "center", height: rowHeight, opacity: progress(frame, s - 4, s + 8) }}>
            <div style={{ width: labelWidth, paddingRight: 30, textAlign: "right", fontFamily: FONTS.body, fontWeight: 900, fontSize: 42, color: COLORS.ink, wordBreak: "keep-all" }}>
              {r.label}
              {r.note ? <div style={{ fontSize: 24, fontWeight: 500, color: COLORS.muted }}>{r.note}</div> : null}
            </div>
            <div style={{ position: "relative", width: barWidth, height: 56 }}>
              <div style={{ position: "absolute", inset: 0, width: barWidth * pPlan, border: `2px solid ${COLORS.neon}`, borderRadius: 6, boxShadow: `0 0 16px ${COLORS.neon}55` }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.max(4, barWidth * ratio * pReal), background: COLORS.amber, borderRadius: 6 }} />
              <div style={{ position: "absolute", left: barWidth + 24, top: -2, whiteSpace: "nowrap", fontFamily: FONTS.num, fontWeight: 900, fontSize: 44, color: COLORS.amber, opacity: pReal }}>
                {fmt(pct * pReal, pct < 10 ? 1 : 0)}%
              </div>
              <div style={{ position: "absolute", left: 0, top: 62, fontFamily: FONTS.body, fontSize: 24, color: COLORS.muted, whiteSpace: "nowrap", opacity: pReal }}>
                {fmt(r.real)}
                {r.unit ?? ""} / {fmt(r.plan)}
                {r.unit ?? ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
