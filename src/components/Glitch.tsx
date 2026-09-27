import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";

type Props = {
  children: React.ReactNode;
  /** 글리치가 걸리는 프레임 구간 (장면 기준) */
  start: number;
  end: number;
  /** 0..1 */
  intensity?: number;
  seed?: string;
};

/**
 * 디지털 글리치: 구간 동안 RGB 채널 분리 + 가로 슬라이스 밀림 + 노이즈 막대.
 * '약속 → 현실' 하드 컷 직전/직후에 쓴다.
 */
export const Glitch: React.FC<Props> = ({ children, start, end, intensity = 1, seed = "g" }) => {
  const frame = useCurrentFrame();
  const active = frame >= start && frame <= end;
  if (!active) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r = (k: string) => random(`${seed}-${frame}-${k}`);
  const amt = intensity * (0.4 + 0.6 * r("amt"));
  const dx = (r("dx") - 0.5) * 60 * amt;
  const split = 6 + 18 * amt;
  const id = `glitch-${seed}-${frame}`;
  const slices = Array.from({ length: 7 }, (_, i) => ({
    top: r(`st${i}`) * 1080,
    h: 6 + r(`sh${i}`) * 70 * amt,
    shift: (r(`sx${i}`) - 0.5) * 220 * amt,
    color: ["#38f2ff", "#ff3ea5", "#ffffff", "#7c5cff"][Math.floor(r(`sc${i}`) * 4)],
    o: 0.15 + r(`so${i}`) * 0.5,
  }));
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={split} dy={0} result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-split} dy={0} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${id})`, transform: `translateX(${dx}px)` }}>{children}</AbsoluteFill>
      {slices.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.shift,
            top: s.top,
            width: 1920,
            height: s.h,
            background: s.color,
            opacity: s.o * amt,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
