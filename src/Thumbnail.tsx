import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS, glow } from "./theme";
import { Desert, GlowBlob, MirrorWall, Vignette } from "./components";

/**
 * 유튜브 썸네일 (1280x720). 1920x1080 장면을 2/3 로 축소해 배경으로 쓰고, 큰 제목을 올린다.
 * npm run thumbnail → out/thumbnail.png
 */
export const THUMB = { width: 1280, height: 720 } as const;

export const Thumbnail: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "scale(0.6667)", transformOrigin: "0 0" }}>
        <Desert time="dusk" horizon={640} sunX={0.64} sunY={610} duneLayers={3} />
        <MirrorWall
          horizon={640}
          vanishX={1080}
          nearX={-120}
          speed={0}
          sunReflect={0.55}
          skyColors={["#120a2a", "#6a2a5e", "#ff6a3d"]}
          groundColors={["#a05a3a", "#3a1f16"]}
          sunColor="#ffb070"
          edgeGlowOpacity={1}
        />
        <GlowBlob x={1080} y={640} r={380} color={COLORS.neon} opacity={0.3} />
        <Vignette strength={0.75} />
      </div>
      {/* 오른쪽 어둡게 — 글자 대비 */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,6,15,0) 38%, rgba(5,6,15,0.8) 72%)" }} />
      <div style={{ position: "absolute", right: 56, top: 70, width: 720, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 900,
            fontSize: 40,
            color: COLORS.bg,
            background: COLORS.neon,
            padding: "4px 18px",
            borderRadius: 6,
            letterSpacing: -0.5,
          }}
        >
          사우디 네옴시티 &lsquo;더 라인&rsquo;
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 138, lineHeight: 1.02, color: COLORS.ink, textAlign: "right", textShadow: glow(COLORS.neon, 0.9), marginTop: 14 }}>
          170km
          <br />
          거울 도시
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 88, lineHeight: 1.1, color: "#ffffff", textAlign: "right", textShadow: `0 4px 0 #000, ${glow(COLORS.magenta, 0.8)}`, marginTop: 8 }}>
          진짜 지어졌다면?
        </div>
      </div>
      {/* 현실 도장 */}
      <div
        style={{
          position: "absolute",
          left: 70,
          bottom: 70,
          transform: "rotate(-8deg)",
          border: `6px solid ${COLORS.amber}`,
          borderRadius: 14,
          padding: "8px 22px",
          color: COLORS.amber,
          fontFamily: FONTS.display,
          fontSize: 64,
          background: "rgba(5,6,15,0.7)",
          boxShadow: `0 0 30px ${COLORS.amber}55`,
        }}
      >
        현실: 2.4km
      </div>
    </AbsoluteFill>
  );
};
