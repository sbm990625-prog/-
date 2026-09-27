import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

type Props = {
  count?: number;
  /** 무리 중심의 시작/끝 좌표 */
  fromX?: number;
  toX?: number;
  y?: number;
  /** 이동에 걸리는 프레임 */
  start?: number;
  duration?: number;
  /** 거울 벽 x — 정해지면 새가 벽에 닿는 순간 멈추고 떨어진다 */
  wallX?: number;
  color?: string;
  size?: number;
  spread?: number;
  seed?: string;
};

/** V자 날갯짓을 하는 철새 무리. wallX 가 있으면 거울 벽 충돌을 (절제된 방식으로) 보여준다. */
export const BirdFlock: React.FC<Props> = ({
  count = 40,
  fromX = -200,
  toX = 2100,
  y = 360,
  start = 0,
  duration = 180,
  wallX,
  color = COLORS.ink,
  size = 16,
  spread = 220,
  seed = "birds",
}) => {
  const frame = useCurrentFrame();
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        dx: (random(`${seed}x${i}`) - 0.5) * spread * 2.2,
        dy: (random(`${seed}y${i}`) - 0.5) * spread,
        phase: random(`${seed}p${i}`) * Math.PI * 2,
        speed: 0.85 + random(`${seed}s${i}`) * 0.3,
        s: 0.7 + random(`${seed}z${i}`) * 0.6,
      })),
    [count, seed, spread],
  );
  const t = Math.max(0, frame - start);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {birds.map((b, i) => {
        const travel = ((toX - fromX) * t * b.speed) / duration;
        let x = fromX + b.dx + travel;
        let yy = y + b.dy + Math.sin(t * 0.05 + b.phase) * 8;
        let opacity = 1;
        let flap = Math.sin(t * 0.45 + b.phase);
        let rot = 0;
        if (wallX !== undefined && x >= wallX) {
          // 벽에 닿은 시점 이후: 멈추고 중력으로 낙하, 서서히 사라짐
          const hitT = ((wallX - fromX - b.dx) * duration) / ((toX - fromX) * b.speed);
          const since = t - hitT;
          x = wallX - 4;
          yy = y + b.dy + Math.sin(hitT * 0.05 + b.phase) * 8 + 0.08 * since * since;
          opacity = Math.max(0, 1 - since / 22);
          flap = -0.3;
          rot = Math.min(35, since * 2.5);
        }
        if (opacity <= 0 || yy > 1120) return null;
        const w = size * b.s;
        const wing = w * 0.55 * flap;
        return (
          <path
            key={i}
            d={`M${-w},${-wing} Q${-w * 0.45},${-wing * 0.2 - 2} 0,0 Q${w * 0.45},${-wing * 0.2 - 2} ${w},${-wing}`}
            transform={`translate(${x} ${yy}) rotate(${rot})`}
            fill="none"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};
