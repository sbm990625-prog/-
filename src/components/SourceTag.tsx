import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS, SAFE } from "../theme";
import { progress } from "../utils/anim";

type Props = {
  /** 예: "블룸버그 · 2024.04" */
  text: string;
  /** 앞에 붙는 라벨 (기본 "출처") — "계산", "추정" 등으로 바꿀 수 있다 */
  label?: string;
  position?: "bottomRight" | "bottomLeft" | "topRight" | "topLeft";
  start?: number;
  end?: number;
  color?: string;
};

/** 화면 구석의 작은 출처/날짜 표기. 숫자를 보여줄 땐 반드시 같이 쓴다. */
export const SourceTag: React.FC<Props> = ({ text, label = "출처", position = "bottomRight", start = 0, end, color = COLORS.muted }) => {
  const frame = useCurrentFrame();
  const inP = progress(frame, start, start + 12);
  const outP = end === undefined ? 1 : 1 - progress(frame, end - 10, end);
  const o = Math.min(inP, outP);
  if (o <= 0) return null;
  const pos: React.CSSProperties =
    position === "bottomRight"
      ? { right: SAFE.x, bottom: SAFE.y - 40 }
      : position === "bottomLeft"
        ? { left: SAFE.x, bottom: SAFE.y - 40 }
        : position === "topRight"
          ? { right: SAFE.x, top: SAFE.y - 40 }
          : { left: SAFE.x, top: SAFE.y - 40 };
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        opacity: o,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONTS.body,
        fontSize: 26,
        fontWeight: 500,
        color,
        background: "rgba(5,6,15,0.65)",
        border: `1px solid ${color}55`,
        borderRadius: 8,
        padding: "6px 14px",
        letterSpacing: -0.2,
      }}
    >
      <span style={{ fontWeight: 900, color: COLORS.ink, opacity: 0.8 }}>{label}</span>
      <span style={{ width: 1, height: 20, background: `${color}88` }} />
      <span>{text}</span>
    </div>
  );
};
