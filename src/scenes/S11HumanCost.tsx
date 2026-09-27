import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, SAFE, WIDTH } from "../theme";
import { clamp01, progress, sec } from "../utils/anim";
import { Desert, ExperimentChip, Grain, SceneFrame, SourceTag, Vignette } from "../components";

/**
 * s11-human-cost — 계산에 없던 비용 (75.2s → 84.8s, 288 frames)
 * 재(#1A1612) + 잉걸불(#FF9F43). 흐린 밤 사막 위 추상 집 실루엣 줄의 창문이
 * L1과 함께 하나씩 꺼져 윤곽만 남고, 하단 연표 노드 3개가 자막에 맞춰 켜진다.
 * 얼굴·인물 실루엣·피 없음. 끝은 fade.
 * 절대 시간 → 장면 시간: 75.2s 를 뺀다.
 *   L1 75.5–79.1 → 0.3–3.9 / L2 79.1–82.2 → 3.9–7.0 / L3 82.2–84.8 → 7.0–9.6
 */

const T = {
  l1: sec(0.3),
  l2: sec(3.9),
  l3: sec(7.0),
};

const EMBER = COLORS.ember;
const ASH = COLORS.ash;
const TAG = "#b9a893"; // 재 톤의 출처 태그 색

// ─────────────────────────── 능선 + 집 실루엣 ───────────────────────────

const DUR = 288; // 스토리보드 장면 길이 (Main 이 +10 프레임 연장해도 이 값 기준)

// 마을이 앉은 모래 능선 — 집 밑변이 y≈640 근처
const ridgeY = (x: number): number => 664 - 26 * Math.exp(-Math.pow((x - 960) / 820, 2)) + 6 * Math.sin(x / 220 + 0.7);
// 마을 앞 전경 모래언덕 (패럴랙스용, 더 빠르게 밀린다)
const fgY = (x: number): number => 716 + 16 * Math.sin(x / 290 + 1.3) + 7 * Math.sin(x / 113 + 0.4) - 18 * Math.exp(-Math.pow((x - 1500) / 380, 2));

const WIN_W = 15;
const WIN_H = 19;
const HALO_R = 42;

type House = {
  x: number;
  w: number;
  h: number;
  base: number;
  parapet: boolean;
  windows: { x: number; y: number }[];
  offAt: number; // 창문이 꺼지기 시작하는 프레임
};

const buildHouses = (): House[] => {
  const n = 12;
  const x0 = 290;
  const x1 = 1630;
  const raw: Omit<House, "offAt">[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1) + (random(`hx${i}`) - 0.5) * 36;
    const w = 80 + random(`hw${i}`) * 52;
    const h = 60 + random(`hh${i}`) * 62;
    const base = ridgeY(x) + 6;
    const winCount = w > 112 ? 2 : 1;
    const rows = h > 100 ? 2 : 1;
    const windows: { x: number; y: number }[] = [];
    for (let r = 0; r < rows; r++) {
      const wy = rows === 1 ? base - h * 0.62 : base - h * (r === 0 ? 0.4 : 0.76);
      for (let k = 0; k < winCount; k++) {
        windows.push({ x: winCount === 1 ? x - WIN_W / 2 : x - w / 2 + (w * (k + 1)) / 3 - WIN_W / 2, y: wy });
      }
    }
    raw.push({ x, w, h, base, parapet: random(`hp${i}`) > 0.55, windows });
  }
  // 꺼지는 순서: 시드 셔플 (가장자리에서 가운데로 약간 치우치게)
  const order = raw
    .map((_, i) => ({ i, k: random(`ho${i}`) * 0.7 + Math.abs(i - (n - 1) / 2) / n }))
    .sort((a, b) => b.k - a.k)
    .map((o) => o.i);
  const first = T.l1 + 14;
  const last = T.l2 - 22;
  return raw.map((h, i) => {
    const rank = order.indexOf(i);
    return { ...h, offAt: Math.round(first + ((last - first) * rank) / (n - 1)) };
  });
};

/** 0(꺼짐)..1(켜짐) + 꺼지는 순간 짧은 깜빡임 */
const litLevel = (frame: number, offAt: number): number => {
  const p = clamp01((frame - offAt) / 12);
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  const flicker = 0.7 + 0.3 * Math.cos(p * Math.PI * 5);
  return (1 - Easing.in(Easing.quad)(p)) * flicker;
};

const HouseRow: React.FC<{ houses: House[] }> = ({ houses }) => {
  const frame = useCurrentFrame();
  const ridgePath = useMemo(() => {
    const pts: string[] = [];
    for (let x = -40; x <= WIDTH + 40; x += 40) pts.push(`${x === -40 ? "M" : "L"}${x},${ridgeY(x).toFixed(1)}`);
    return `${pts.join(" ")} L${WIDTH + 40},1120 L-40,1120 Z`;
  }, []);
  const avgLit = houses.reduce((s, h) => s + litLevel(frame, h.offAt), 0) / houses.length;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="s11-win">
          <stop offset="0%" stopColor={EMBER} stopOpacity={0.55} />
          <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="s11-ground">
          <stop offset="0%" stopColor={EMBER} stopOpacity={0.35} />
          <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="s11-ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1712" />
          <stop offset="35%" stopColor="#120e0b" />
          <stop offset="100%" stopColor="#0a0806" />
        </linearGradient>
      </defs>
      {/* 마을 뒤 따뜻한 지면 빛 — 창문이 꺼질수록 식는다 */}
      <ellipse cx={960} cy={600} rx={900} ry={120} fill="url(#s11-ground)" opacity={0.2 + 0.8 * avgLit} />
      <path d={ridgePath} fill="url(#s11-ridge)" />
      <path d={ridgePath} fill="none" stroke="#3a2d22" strokeWidth={2} opacity={0.8} />
      {houses.map((h, i) => {
        const L = litLevel(frame, h.offAt);
        const left = h.x - h.w / 2;
        const top = h.base - h.h;
        const ph = 11; // 파라펫 높이
        return (
          <g key={i}>
            <rect x={left} y={top} width={h.w} height={h.h} fill="#261b13" fillOpacity={0.3 + 0.7 * L} />
            {h.parapet ? (
              <rect x={left + h.w * 0.12} y={top - ph} width={h.w * 0.3} height={ph} fill="#261b13" fillOpacity={0.3 + 0.7 * L} />
            ) : null}
            <path
              d={
                h.parapet
                  ? `M${left},${h.base} V${top} H${left + h.w * 0.12} V${top - ph} H${left + h.w * 0.42} V${top} H${left + h.w} V${h.base}`
                  : `M${left},${h.base} V${top} H${left + h.w} V${h.base}`
              }
              fill="none"
              stroke={L > 0.02 ? "#7a5d48" : "#6a5240"}
              strokeWidth={2.4}
              strokeOpacity={0.6 + 0.35 * (1 - L)}
            />
            {h.windows.map((w, k) => (
              <g key={k}>
                <circle cx={w.x + WIN_W / 2} cy={w.y + WIN_H / 2} r={HALO_R} fill="url(#s11-win)" opacity={L} />
                <rect x={w.x} y={w.y} width={WIN_W} height={WIN_H} fill={EMBER} opacity={L} />
                <rect x={w.x} y={w.y} width={WIN_W} height={WIN_H} fill="#0d0a08" opacity={0.7 * (1 - L)} />
                <rect x={w.x} y={w.y} width={WIN_W} height={WIN_H} fill="none" stroke="#6a5240" strokeWidth={1.5} opacity={1 - L} />
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// ─────────────────────────── 전경 모래언덕 (패럴랙스) ───────────────────────────

const ForeDune: React.FC = () => {
  const path = useMemo(() => {
    const pts: string[] = [];
    for (let x = -80; x <= WIDTH + 80; x += 30) pts.push(`${x === -80 ? "M" : "L"}${x},${fgY(x).toFixed(1)}`);
    return `${pts.join(" ")} L${WIDTH + 80},1160 L-80,1160 Z`;
  }, []);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="s11-fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15100c" />
          <stop offset="30%" stopColor="#0c0907" />
          <stop offset="100%" stopColor="#070504" />
        </linearGradient>
      </defs>
      <path d={path} fill="url(#s11-fg)" />
      <path d={path} fill="none" stroke="#4a382a" strokeWidth={2} opacity={0.55} />
    </svg>
  );
};

// ─────────────────────────── 마을에서 피어오르는 잉걸불 ───────────────────────────

const Embers: React.FC<{ houses: House[] }> = ({ houses }) => {
  const frame = useCurrentFrame();
  const embers = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const h = houses[Math.floor(random(`eh${i}`) * houses.length)];
        return {
          x: h.x + (random(`ex${i}`) - 0.5) * h.w * 0.8,
          y: h.base - h.h - 6,
          period: 150 + random(`ep${i}`) * 110,
          phase: random(`ef${i}`),
          rise: 300 + random(`er${i}`) * 200,
          sway: 12 + random(`es${i}`) * 26,
          r: 2 + random(`ez${i}`) * 2.2,
          ph: random(`eo${i}`) * Math.PI * 2,
        };
      }),
    [houses],
  );
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="s11-ember">
          <stop offset="0%" stopColor={EMBER} stopOpacity={0.7} />
          <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
        </radialGradient>
      </defs>
      {embers.map((e, i) => {
        const age = (frame / e.period + e.phase) % 1;
        const y = e.y - age * e.rise;
        const x = e.x + Math.sin(age * Math.PI * 2 + e.ph) * e.sway + age * 30;
        const o = Math.min(1, age / 0.12) * Math.pow(1 - age, 1.4) * (0.75 + 0.25 * Math.sin(frame * 0.4 + e.ph));
        const r = e.r * (1 - 0.5 * age);
        return (
          <g key={i} opacity={o}>
            <circle cx={x} cy={y} r={r * 5} fill="url(#s11-ember)" />
            <circle cx={x} cy={y} r={r} fill="#ffc98a" />
          </g>
        );
      })}
    </svg>
  );
};

// ─────────────────────────── 떠다니는 재 ───────────────────────────

const Motes: React.FC = () => {
  const frame = useCurrentFrame();
  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: 240 + random(`mx${i}`) * 1440,
        y: 300 + random(`my${i}`) * 600,
        r: 1.2 + random(`mr${i}`) * 2.2,
        v: 0.25 + random(`mv${i}`) * 0.45,
        ph: random(`mp${i}`) * Math.PI * 2,
        warm: random(`mw${i}`) > 0.6,
      })),
    [],
  );
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {motes.map((m, i) => {
        const y = m.y - frame * m.v;
        const x = m.x + Math.sin(frame * 0.02 + m.ph) * 14;
        const o = (m.warm ? 0.35 : 0.22) * (0.5 + 0.5 * Math.sin(frame * 0.05 + m.ph));
        return <circle key={i} cx={x} cy={y} r={m.r} fill={m.warm ? EMBER : "#b8a894"} opacity={o} />;
      })}
    </svg>
  );
};

// ─────────────────────────── 연표 (비균등 타이밍) ───────────────────────────

type Seg = { t: string; num?: boolean };
type Node = { x: number; at: number; anchor: "start" | "middle" | "end"; date: string; label: Seg[] };

const TL_Y = 770;
const TL_X1 = 300;
const TL_X2 = 1620;

const NODES: Node[] = [
  { x: TL_X1, at: T.l1 + 10, anchor: "start", date: "2020.01", label: [{ t: "퇴거 명령" }] },
  {
    x: 960,
    at: T.l2 + 10,
    anchor: "middle",
    date: "2022.10",
    label: [{ t: "선고 · " }, { t: "2023.01", num: true }, { t: " 항소심 유지" }],
  },
  {
    x: TL_X2,
    at: T.l3 + 10,
    anchor: "end",
    date: "2024.10",
    label: [{ t: "ITV 증언 · " }, { t: "14", num: true }, { t: "일 연속" }],
  },
];

const EventLine: React.FC = () => {
  const frame = useCurrentFrame();
  const base = progress(frame, 0, 24, Easing.inOut(Easing.cubic));
  // 앰버 진행선: 각 노드가 켜질 때 다음 구간까지 이어진다
  let reach = TL_X1;
  NODES.forEach((n, i) => {
    if (i === 0) return;
    const prev = NODES[i - 1];
    const p = progress(frame, n.at - 16, n.at, Easing.inOut(Easing.cubic));
    if (p > 0) reach = prev.x + (n.x - prev.x) * p;
  });
  const firstOn = progress(frame, NODES[0].at - 4, NODES[0].at + 8);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="s11-node">
          <stop offset="0%" stopColor={EMBER} stopOpacity={0.6} />
          <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
        </radialGradient>
      </defs>
      <line x1={TL_X1} y1={TL_Y} x2={TL_X1 + (TL_X2 - TL_X1) * base} y2={TL_Y} stroke="#4a3b2f" strokeWidth={2} />
      {firstOn > 0 ? <line x1={TL_X1} y1={TL_Y} x2={reach} y2={TL_Y} stroke={EMBER} strokeWidth={3} opacity={0.85 * firstOn} /> : null}
      {NODES.map((n, i) => {
        const on = progress(frame, n.at, n.at + 14);
        const pre = progress(frame, 4 + i * 5, 24 + i * 5); // 켜지기 전 흐린 빈 노드
        const next = NODES[i + 1];
        const past = next ? progress(frame, next.at - 6, next.at + 10) : 0;
        const pulse = on > 0 ? Math.max(0, 1 - (frame - n.at) / 30) : 0;
        const labelO = on * (1 - past);
        const dateO = on * (1 - 0.5 * past);
        const rise = (1 - on) * 12;
        return (
          <g key={i}>
            <circle cx={n.x} cy={TL_Y} r={9} fill={ASH} stroke="#5c4838" strokeWidth={2} opacity={pre * (1 - on)} />
            {pulse > 0 ? <circle cx={n.x} cy={TL_Y} r={22 + 40 * (1 - pulse)} fill="url(#s11-node)" opacity={pulse} /> : null}
            <g opacity={on}>
              <circle cx={n.x} cy={TL_Y} r={9 + 3 * on} fill={ASH} stroke={EMBER} strokeWidth={3} strokeOpacity={1 - 0.45 * past} />
              <circle cx={n.x} cy={TL_Y} r={4.5} fill={EMBER} opacity={1 - 0.45 * past} />
            </g>
            <text
              x={n.x}
              y={TL_Y - 32 + rise}
              textAnchor={n.anchor}
              fontFamily={FONTS.body}
              fontWeight={700}
              fontSize={32}
              fill={COLORS.ink}
              style={{ letterSpacing: -0.3, whiteSpace: "pre" }}
            >
              <tspan fill={EMBER} opacity={dateO}>
                {n.date}
              </tspan>
              <tspan opacity={labelO}>
                {"  "}
                {n.label.map((s, k) =>
                  s.num ? (
                    <tspan key={k} fill={EMBER}>
                      {s.t}
                    </tspan>
                  ) : (
                    <tspan key={k}>{s.t}</tspan>
                  ),
                )}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─────────────────────────── 타자기 자막 (강조 + 잉걸불 커서) ───────────────────────────

type CapLine = { segs: { t: string; em?: boolean }[]; from: number; to: number; speed: number };

const CAPS: CapLine[] = [
  { segs: [{ t: "후와이타트족 " }, { t: "약 2만 명", em: true }, { t: ", 퇴거 명령" }], from: T.l1, to: T.l2, speed: 1.5 },
  { segs: [{ t: "퇴거를 거부한 " }, { t: "3명", em: true }, { t: ", 사형 선고" }], from: T.l2, to: T.l3, speed: 1.5 },
  { segs: [{ t: "현장 노동자 " }, { t: "‘하루 16시간’", em: true }], from: T.l3, to: DUR + 20, speed: 1.5 },
];

const TypeCaption: React.FC<{ line: CapLine; last: boolean }> = ({ line, last }) => {
  const frame = useCurrentFrame();
  if (frame < line.from - 2 || frame > line.to + 1) return null;
  const chars = line.segs.flatMap((s) => Array.from(s.t).map((c) => ({ c, em: !!s.em })));
  const t = frame - line.from;
  const shown = Math.max(0, Math.min(chars.length, Math.floor(t / line.speed) + 1));
  const done = shown >= chars.length;
  const doneAt = chars.length * line.speed;
  const inO = progress(frame, line.from - 2, line.from + 6);
  const outO = last ? 1 : 1 - progress(frame, line.to - 9, line.to, Easing.in(Easing.cubic));
  const o = Math.min(inO, outO);
  const drift = last ? 0 : (1 - outO) * -10;
  // 타이핑 중엔 켜진 커서, 끝나면 느리게 깜빡이다 사라짐
  const blinkOn = !done || Math.floor((t - doneAt) / 14) % 2 === 1;
  const cursorO = done ? (blinkOn ? 1 : 0) * (1 - clamp01((t - doneAt - 42) / 10)) : 1;
  const nodes: React.ReactNode[] = [];
  chars.forEach((ch, i) => {
    if (i === shown) {
      nodes.push(<span key="cur" style={{ display: "inline-block", width: 5, height: "0.92em", margin: "0 6px -0.08em", background: EMBER, opacity: cursorO * 0.9 }} />);
    }
    const cO = i < shown ? clamp01((t - i * line.speed) / 3 + 0.34) : 0;
    nodes.push(
      <span key={i} style={{ opacity: cO, color: ch.em ? EMBER : COLORS.ink, textShadow: ch.em ? `0 0 18px ${EMBER}55, 0 2px 4px rgba(0,0,0,0.9)` : undefined }}>
        {ch.c}
      </span>,
    );
  });
  if (shown >= chars.length) {
    nodes.push(<span key="cur" style={{ display: "inline-block", width: 5, height: "0.92em", margin: "0 6px -0.08em", background: EMBER, opacity: cursorO * 0.9 }} />);
  }
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.x,
        right: SAFE.x,
        bottom: SAFE.y + 34,
        textAlign: "center",
        opacity: o,
        transform: `translateY(${drift}px)`,
        fontFamily: FONTS.body,
        fontWeight: 700,
        fontSize: 62,
        lineHeight: 1.3,
        letterSpacing: -0.5,
        whiteSpace: "pre",
        color: COLORS.ink,
        textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)",
      }}
    >
      {nodes}
    </div>
  );
};

// ─────────────────────────── 장면 ───────────────────────────

export const S11HumanCost: React.FC = () => {
  const frame = useCurrentFrame();
  const houses = useMemo(buildHouses, []);

  // 느린 카메라 밀기 + 패럴랙스 (하늘 < 마을 < 전경 언덕). 끝 프레임 이후(핸드오프)에도 계속 흐른다.
  const k = interpolate(frame, [0, DUR], [0, 1], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" }) * 0.7 + (0.3 * frame) / DUR;
  const pushSky = 1 + 0.025 * k;
  const pushVillage = 1 + 0.06 * k;
  const pushFore = 1 + 0.1 * k;
  const skyFade = 0.6 + 0.4 * progress(frame, 0, 40);
  const rule = progress(frame, 0, 22, Easing.out(Easing.cubic));

  return (
    <SceneFrame background={ASH} fadeIn={12} fadeOut={8}>
      <AbsoluteFill style={{ background: ASH }} />
      {/* 흐린 밤 사막: 재 색으로 탈색 */}
      <AbsoluteFill style={{ transform: `scale(${pushSky})`, transformOrigin: "50% 58%" }}>
        <AbsoluteFill style={{ opacity: 0.6 * skyFade, filter: "sepia(0.85) saturate(0.35) brightness(0.6) contrast(1.05)" }}>
          <Desert time="night" horizon={660} sunX={1.4} sunY={200} duneLayers={2} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${ASH}aa 0%, ${ASH}44 45%, ${ASH}00 60%)` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${pushVillage})`, transformOrigin: "50% 60%" }}>
        <HouseRow houses={houses} />
        <Embers houses={houses} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-14 * k}px) scale(${pushFore})`, transformOrigin: "50% 60%" }}>
        <ForeDune />
        <Motes />
      </AbsoluteFill>

      {/* 하단 가독성 띠 */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,6,5,0) 62%, rgba(8,6,5,0.55) 74%, rgba(8,6,5,0.88) 100%)" }} />

      <EventLine />

      {CAPS.map((l, i) => (
        <TypeCaption key={i} line={l} last={i === CAPS.length - 1} />
      ))}

      {/* 헤더: 공용 칩 + 잉걸불 밑줄 */}
      <ExperimentChip title="계산에 없던 비용" color={EMBER} />
      <div
        style={{
          position: "absolute",
          left: SAFE.x,
          top: SAFE.y + 40 + 70,
          width: 120 * rule,
          height: 3,
          background: EMBER,
          opacity: 0.9 * rule,
          borderRadius: 2,
        }}
      />

      <Grain opacity={0.1} />
      <Vignette strength={0.65} />

      <SourceTag text="알자지라 · 2020.04" start={T.l1 + 6} end={T.l2 + 2} color={TAG} />
      <SourceTag text="ALQST · 2023.01 (항소심 유지, 집행 아님)" start={T.l2 + 2} end={T.l3 + 2} color={TAG} />
      <SourceTag text="ITV 다큐 · 2024.10" start={T.l3 + 2} color={TAG} />
    </SceneFrame>
  );
};
