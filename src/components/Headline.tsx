import React from "react";
import { useCurrentFrame, Easing } from "remotion";
import { COLORS, FONTS } from "../theme";
import { progress } from "../utils/anim";

export type HeadlineItem = {
  outlet: string; // "Bloomberg", "블룸버그", "Semafor"
  date: string; // "2024.04.05"
  text: string; // 한국어 요약 헤드라인
  /** 강조색 (기본 amber = 현실) */
  color?: string;
};

type Props = {
  items: HeadlineItem[];
  /** 첫 카드 등장 프레임, 카드 간 간격 */
  start?: number;
  stagger?: number;
  x?: number;
  y?: number;
  width?: number;
  /** 새 카드가 오면 이전 카드를 흐리게 */
  dimPrevious?: boolean;
};

/** 뉴스 헤드라인 카드 스택 — 날짜·매체·요약. 현실 파트에서 쓴다. */
export const Headlines: React.FC<Props> = ({ items, start = 0, stagger = 45, x = 160, y = 200, width = 1600, dimPrevious = true }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, width, display: "flex", flexDirection: "column", gap: 22 }}>
      {items.map((it, i) => {
        const s = start + i * stagger;
        const p = progress(frame, s, s + 16, Easing.out(Easing.cubic));
        if (p <= 0) return null;
        const newest = items.findIndex((_, j) => frame < start + j * stagger) - 1;
        const isNewest = newest === -2 ? i === items.length - 1 : i === newest;
        const dim = dimPrevious && !isNewest ? 0.45 : 1;
        const color = it.color ?? COLORS.amber;
        return (
          <div
            key={i}
            style={{
              opacity: p * dim,
              transform: `translateX(${(1 - p) * -60}px)`,
              display: "flex",
              alignItems: "stretch",
              background: "linear-gradient(90deg, rgba(20,22,40,0.92), rgba(12,13,25,0.75))",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: isNewest ? `0 0 40px ${color}33` : undefined,
            }}
          >
            <div style={{ width: 10, background: color }} />
            <div style={{ padding: "18px 28px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
                <span style={{ fontFamily: FONTS.num, fontWeight: 700, fontSize: 26, color }}>{it.date}</span>
                <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 26, color: COLORS.muted }}>{it.outlet}</span>
              </div>
              <div style={{ fontFamily: FONTS.body, fontWeight: 900, fontSize: 52, color: COLORS.ink, lineHeight: 1.25, wordBreak: "keep-all" }}>{it.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
