import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, FONTS, HEIGHT, WIDTH } from "../theme";
import { clamp01, progress } from "../utils/anim";
import { DreamLetterBox, Flash, Glitch, Grain, LineAerial, NeonText, Scanlines, SceneFrame, Vignette } from "../components";

/**
 * s01-hook — 첫 1초에 숫자 하나(170km)와 이미지 하나(밤 사막을 가로지르는 빛의 선)로 붙잡는다.
 * '네온 시티?'(마젠타, 말장난) → 글리치 → 시안 '사우디 네옴(NEOM) '더 라인'' → 어원 → 질문형 제목.
 * 0s → 7s (210 frames). 끝: whoosh push (가속 푸시인 + 페이드, 레터박스는 유지).
 */

// ── 타이밍 (프레임, 장면 기준) ────────────────────────────────
const F_FLASH = 3; // 0.1s
const F_DRAW0 = 6; // 0.2s 선 점화
const F_DRAW1 = 30; // 1.0s
const F_LABEL = 9; // 0.3s '170km'
const F_NEON = 27; // 0.9s '네온 시티?'
const F_FLIP = 78; // 2.6s 글리치 → 네옴
const F_GL0 = 73;
const F_GL1 = 86;
const F_ETY0 = 84; // 2.8s 어원
const F_ETY1 = 138; // 4.6s
const F_TITLE = 138; // 4.6s 제목 타이핑
const F_OUT0 = 192; // whoosh push 시작
const F_END = 210;

// ── 궤도 시점 지면(3D 기울임) ─────────────────────────────────
const PERSP = 1400;
const TILT = 50; // deg
const SX = 1.8;
const SY = 1.6;
const PLANE_CY = 640; // 지면 평면 중심의 화면 y
const LINE = { x1: 600, y1: 660, x2: 1400, y2: 520 }; // LineAerial(svg) 좌표

/** LineAerial svg 좌표 → 화면 좌표 (CSS perspective + rotateX 와 같은 계산) */
const project = (x: number, y: number): { x: number; y: number; s: number } => {
  const t = (TILT * Math.PI) / 180;
  const u = (x - WIDTH / 2) * SX;
  const v = (y - HEIGHT / 2) * SY;
  const Y = v * Math.cos(t);
  const Z = v * Math.sin(t);
  const s = PERSP / (PERSP - Z);
  return { x: WIDTH / 2 + u * s, y: HEIGHT / 2 + (PLANE_CY + Y - HEIGHT / 2) * s, s };
};

const HORIZON_Y = project(WIDTH / 2, 0).y;

// ── 배경: 하늘 + 별 ───────────────────────────────────────────
const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        x: random(`s1-sx${i}`) * WIDTH,
        y: 60 + random(`s1-sy${i}`) * (HORIZON_Y - 40),
        r: 0.6 + random(`s1-sr${i}`) ** 3 * 2.2,
        ph: random(`s1-sp${i}`) * Math.PI * 2,
        sp: 0.05 + random(`s1-ss${i}`) * 0.12,
        b: 0.35 + random(`s1-sb${i}`) * 0.65,
        tint: random(`s1-st${i}`) < 0.18,
      })),
    [],
  );
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="s01-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03040b" />
          <stop offset={(HORIZON_Y / HEIGHT) * 0.8} stopColor="#0a0c24" />
          <stop offset={HORIZON_Y / HEIGHT} stopColor="#1a1440" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#s01-sky)" />
      {stars.map((s, i) => {
        const tw = 0.55 + 0.45 * Math.sin(frame * s.sp * 2 + s.ph);
        return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.tint ? COLORS.neon : "#e8ecff"} opacity={s.b * tw} />;
      })}
    </svg>
  );
};

// ── 지면 위 옅은 시안 측정 그리드 (평면과 함께 기울어짐) ─────────────
const PlaneGrid: React.FC = () => {
  const lines = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let x = 0; x <= WIDTH; x += 120) out.push(<line key={`gx${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} />);
    for (let y = 0; y <= HEIGHT; y += 120) out.push(<line key={`gy${y}`} x1={0} y1={y} x2={WIDTH} y2={y} />);
    return out;
  }, []);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
      <g stroke={COLORS.neon} strokeOpacity={0.07} strokeWidth={1.2}>
        {lines}
      </g>
    </svg>
  );
};

// ── 선 아래 치수 막대 + '170km' 라벨 (화면 좌표) ─────────────────
const Dimension: React.FC<{ draw: number }> = ({ draw }) => {
  const frame = useCurrentFrame();
  const a = project(LINE.x1, LINE.y1);
  const b = project(LINE.x2, LINE.y2);
  const hx = LINE.x1 + (LINE.x2 - LINE.x1) * draw;
  const hy = LINE.y1 + (LINE.y2 - LINE.y1) * draw;
  const h = project(hx, hy);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const deg = (ang * 180) / Math.PI;
  // 선에서 아래쪽으로 수직 오프셋
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const off = 46;
  const A = { x: a.x + nx * off, y: a.y + ny * off };
  const H = { x: h.x + nx * off, y: h.y + ny * off };
  const mid = { x: (a.x + b.x) / 2 + nx * (off + 64), y: (a.y + b.y) / 2 + ny * (off + 64) };

  const labelIn = progress(frame, F_LABEL, F_LABEL + 14);
  // 이름이 뜨면 한 걸음 물러남 (동시에 읽히는 글줄 2개 제한)
  const recede = 1 - 0.6 * progress(frame, F_FLIP, F_FLIP + 16, Easing.inOut(Easing.cubic));
  const km = Math.round(170 * clamp01(progress(frame, F_LABEL, F_DRAW1 + 2, Easing.out(Easing.quad))));
  const barO = progress(frame, F_DRAW0, F_DRAW0 + 8) * 0.9 * (0.55 + 0.45 * recede);
  const endTick = progress(frame, F_DRAW1 - 2, F_DRAW1 + 6);
  const tick = (p: { x: number; y: number }, o: number) => (
    <line x1={p.x - nx * 14} y1={p.y - ny * 14} x2={p.x + nx * 14} y2={p.y + ny * 14} stroke={COLORS.neon} strokeWidth={2.5} opacity={o} />
  );
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g opacity={barO}>
        <line x1={A.x} y1={A.y} x2={H.x} y2={H.y} stroke={COLORS.neon} strokeWidth={2} strokeDasharray="10 8" />
        {tick(A, 1)}
        {tick(H, endTick)}
      </g>
      <g opacity={labelIn * recede} transform={`translate(${mid.x} ${mid.y + (1 - labelIn) * 16}) rotate(${deg})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.neon}
          fontFamily={FONTS.num}
          fontWeight={900}
          fontSize={60}
          letterSpacing={3}
          style={{ fontVariantNumeric: "tabular-nums", filter: `drop-shadow(0 0 12px ${COLORS.neon}99) drop-shadow(0 2px 4px #000)` }}
        >
          {km}km
        </text>
      </g>
    </svg>
  );
};

/** 선이 지면에 떨어뜨리는 시안 빛 번짐 (평면 좌표, 블러 없이 그라디언트로) */
const LineSpill: React.FC<{ draw: number }> = ({ draw }) => {
  const frame = useCurrentFrame();
  const hx = LINE.x1 + (LINE.x2 - LINE.x1) * draw;
  const hy = LINE.y1 + (LINE.y2 - LINE.y1) * draw;
  const len = Math.hypot(hx - LINE.x1, hy - LINE.y1);
  const ang = (Math.atan2(LINE.y2 - LINE.y1, LINE.x2 - LINE.x1) * 180) / Math.PI;
  const breathe = 0.85 + 0.15 * Math.sin(frame / 14);
  const flare = draw > 0 && draw < 1 ? 1 : 1 - progress(frame, F_DRAW1, F_DRAW1 + 12);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="s01-spill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.neon} stopOpacity={0} />
          <stop offset="0.5" stopColor={COLORS.neon} stopOpacity={0.22} />
          <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="s01-spill-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.06" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.94" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="s01-spill-mask" maskContentUnits="objectBoundingBox">
          <rect width={1} height={1} fill="url(#s01-spill-fade)" />
        </mask>
        <radialGradient id="s01-head">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="0.25" stopColor={COLORS.neon} stopOpacity={0.55} />
          <stop offset="1" stopColor={COLORS.neon} stopOpacity={0} />
        </radialGradient>
      </defs>
      {len > 1 ? (
        <g transform={`translate(${LINE.x1} ${LINE.y1}) rotate(${ang})`}>
          <rect x={-40} y={-40} width={len + 80} height={80} rx={40} fill="url(#s01-spill)" mask="url(#s01-spill-mask)" opacity={breathe} />
          {/* 밤 톤 위에 다시 그리는 빛의 선 (시안 외피 + 흰 심지) */}
          <line x1={0} y1={0} x2={len} y2={0} stroke={COLORS.neon} strokeOpacity={0.55} strokeWidth={9} strokeLinecap="round" />
          <line x1={0} y1={0} x2={len} y2={0} stroke="#f2feff" strokeWidth={3.2} strokeLinecap="round" />
        </g>
      ) : null}
      {draw > 0 && flare > 0 ? <ellipse cx={hx} cy={hy} rx={70} ry={70} fill="url(#s01-head)" opacity={flare} /> : null}
    </svg>
  );
};

// ── 지면 전체 (하늘 + 3D 사막 + 치수) = '카메라' ─────────────────
const World: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = progress(frame, F_DRAW0, F_DRAW1, Easing.inOut(Easing.cubic));
  // 느린 푸시인 → 끝에서 가속 푸시(휘익)
  const drift = interpolate(frame, [0, F_OUT0], [1.0, 1.06], { extrapolateRight: "clamp" });
  const push = interpolate(frame, [F_OUT0, F_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const scale = drift * (1 + push * 0.55);
  const lift = -14 * (frame / F_END);
  const opacity = progress(frame, F_FLASH, F_FLASH + 6) * (1 - progress(frame, F_OUT0 + 6, F_END - 1, Easing.in(Easing.quad)));
  const c = project((LINE.x1 + LINE.x2) / 2, (LINE.y1 + LINE.y2) / 2);
  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${lift}px) scale(${scale})`, transformOrigin: `${c.x}px ${c.y - 120}px` }}>
      <Sky />
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${WIDTH / 2}px ${HEIGHT / 2}px` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: PLANE_CY - HEIGHT / 2,
            width: WIDTH,
            height: HEIGHT,
            transform: `rotateX(${TILT}deg) scale(${SX}, ${SY})`,
            transformOrigin: "50% 50%",
          }}
        >
          <LineAerial draw={draw} night sea thickness={4} x1={LINE.x1} y1={LINE.y1} x2={LINE.x2} y2={LINE.y2} />
          {/* 밤 톤: 모래를 푸른 어둠으로 누르고, 먼 쪽일수록 더 어둡게 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(6,7,22,0.72) 0%, rgba(6,7,22,0.38) 45%, rgba(4,5,14,0.5) 100%)",
            }}
          />
          <PlaneGrid />
          <LineSpill draw={draw} />
        </div>
      </AbsoluteFill>
      {/* 지평선 대기광: 평면의 끝 모서리를 녹인다 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HORIZON_Y - 110,
          height: 200,
          background: `linear-gradient(180deg, rgba(10,12,36,0) 0%, rgba(90,64,200,0.30) 48%, rgba(150,200,255,0.30) 55%, rgba(40,30,96,0.35) 60%, rgba(5,6,15,0) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HORIZON_Y,
          height: 2,
          background: `linear-gradient(90deg, rgba(56,242,255,0) 0%, rgba(160,220,255,0.55) 35%, rgba(160,220,255,0.55) 65%, rgba(56,242,255,0) 100%)`,
          boxShadow: `0 0 18px rgba(124,92,255,0.8)`,
        }}
      />
      <Dimension draw={draw} />
    </AbsoluteFill>
  );
};

// ── 제목 타이핑 (음절마다 부드럽게) ─────────────────────────────
const TypeTitle: React.FC<{ text: string; start: number; speed: number }> = ({ text, start, speed }) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const shown = Math.max(0, Math.min(chars.length, Math.floor((frame - start) / speed) + 1));
  const done = frame - start >= chars.length * speed;
  const blink = Math.floor((frame - start) / 12) % 2 === 0;
  const cursorO = frame < start ? 0 : done ? (blink ? 1 : 0) * (1 - progress(frame, start + chars.length * speed + 30, start + chars.length * speed + 40)) : 1;
  return (
    <div style={{ fontFamily: FONTS.display, fontSize: 138, color: COLORS.ink, lineHeight: 1.1, whiteSpace: "nowrap", letterSpacing: -1 }}>
      {chars.map((ch, i) => {
        const p = progress(frame, start + i * speed, start + i * speed + 5);
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: p,
                transform: `translateY(${(1 - p) * 14}px)`,
                textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 36px rgba(255,255,255,0.18)",
              }}
            >
              {ch}
            </span>
            {i === shown - 1 && frame >= start ? (
              <span style={{ position: "relative", display: "inline-block", width: 0 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    top: -96,
                    width: 12,
                    height: 112,
                    background: COLORS.neon,
                    boxShadow: `0 0 16px ${COLORS.neon}`,
                    opacity: cursorO,
                  }}
                />
              </span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── 텍스트 레이어 ──────────────────────────────────────────────
const NAME_Y = 340; // 제목 줄 중심
const SUB_Y = 500; // 어원 / 질문형 제목 자리

const Center: React.FC<{ y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ y, children, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: "translateY(-50%)", ...style }}>{children}</div>
);

/** 고장 난 간판이 켜지는 패턴: 1 = 켜짐 */
const IGNITE = [1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1];

const Texts: React.FC = () => {
  const frame = useCurrentFrame();

  // '네온 시티?' — 지직거리며 켜짐
  const k = frame - F_NEON;
  const ignite = k < 0 ? 0 : k < IGNITE.length ? IGNITE[k] * (0.55 + 0.45 * (k / IGNITE.length)) : 1;
  // 글리치 구간: 두 이름이 프레임마다 뒤섞임
  const inGlitch = frame >= F_GL0 && frame <= F_GL1;
  const coin = random(`s01-flip-${frame}`);
  const showNeon = frame < F_FLIP ? !(inGlitch && coin < 0.35) : inGlitch && coin < 0.2;
  const showName = frame >= F_FLIP ? !(inGlitch && coin < 0.2) : inGlitch && coin < 0.35;

  const nameSettle = progress(frame, F_FLIP, F_FLIP + 18, Easing.out(Easing.cubic));
  const nameGlow = 1 + 0.8 * (1 - progress(frame, F_FLIP, F_FLIP + 24));

  const etyIn = progress(frame, F_ETY0, F_ETY0 + 14);
  const etyOut = 1 - progress(frame, F_ETY1 - 12, F_ETY1, Easing.in(Easing.cubic));
  const ety = Math.min(etyIn, etyOut);

  // 가독 배경띠
  const band = progress(frame, F_NEON - 6, F_NEON + 12) * 0.85;

  // 휘익 푸시 아웃
  const out = progress(frame, F_OUT0, F_END - 2, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 + out * 0.22})`, transformOrigin: `50% ${(NAME_Y + SUB_Y) / 2}px` }}>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: NAME_Y - 190,
          height: 520,
          opacity: band,
          background: "radial-gradient(ellipse at center, rgba(3,4,12,0.78) 0%, rgba(3,4,12,0.5) 45%, rgba(3,4,12,0) 72%)",
        }}
      />
      <Glitch start={F_GL0} end={F_GL1} intensity={0.85} seed="s01">
        {frame >= F_NEON && showNeon ? (
          <Center y={NAME_Y + 30} style={{ opacity: ignite }}>
            <NeonText color={COLORS.magenta} size={156} flicker={frame > F_NEON + IGNITE.length ? 0.35 : 0} strength={1.1}>
              네온 시티?
            </NeonText>
          </Center>
        ) : null}
        {showName ? (
          <Center y={NAME_Y} style={{ transform: `translateY(-50%) scale(${1.06 - 0.06 * nameSettle})` }}>
            <NeonText color={COLORS.neon} size={100} strength={nameGlow * 0.9}>
              사우디 <span style={{ color: COLORS.neon }}>네옴(NEOM)</span> &apos;더 라인&apos;
            </NeonText>
          </Center>
        ) : null}
      </Glitch>
      {ety > 0 ? (
        <Center y={SUB_Y} style={{ opacity: ety, transform: `translateY(calc(-50% + ${(1 - etyIn) * 18}px))` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ width: 90, height: 2, background: `linear-gradient(90deg, transparent, ${COLORS.neon2})` }} />
            <div
              style={{
                fontFamily: FONTS.body,
                fontWeight: 700,
                fontSize: 58,
                color: COLORS.ink,
                letterSpacing: -0.5,
                textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontFamily: FONTS.num, fontWeight: 900, color: COLORS.neon, textShadow: `0 0 18px ${COLORS.neon}88` }}>NEO</span>
              (새로운) <span style={{ color: COLORS.muted }}>+</span>{" "}
              <span style={{ fontFamily: FONTS.num, fontWeight: 900, color: COLORS.neon, textShadow: `0 0 18px ${COLORS.neon}88` }}>M</span>
              (미래)
            </div>
            <div style={{ width: 90, height: 2, background: `linear-gradient(270deg, transparent, ${COLORS.neon2})` }} />
          </div>
        </Center>
      ) : null}
      {frame >= F_TITLE ? (
        <Center y={SUB_Y + 30}>
          <TypeTitle text="진짜로 지어졌다면?" start={F_TITLE} speed={3} />
        </Center>
      ) : null}
    </AbsoluteFill>
  );
};

export const S01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneFrame fadeIn={0} fadeOut={0}>
      <World />
      <Texts />
      <Scanlines opacity={0.06} />
      <Grain />
      <Vignette strength={0.62} />
      <Flash at={F_FLASH} length={9} peak={0.85} color="#dffcff" />
      {/* 0.0s 검은 화면 */}
      {frame < F_FLASH ? <AbsoluteFill style={{ background: "#000" }} /> : null}
      <DreamLetterBox animateIn />
    </SceneFrame>
  );
};
