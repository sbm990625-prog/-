#!/usr/bin/env node
/**
 * docs/storyboard.json → src/scenes/*.tsx 스텁 + src/scenes/index.ts + src/Main.tsx + src/Root.tsx 생성.
 *
 * - 이미 존재하는 장면 파일은 절대 덮어쓰지 않는다 (구현이 날아가지 않도록).
 * - index.ts / Root.tsx 는 항상 다시 생성한다 (장면 목록의 단일 진실 원천은 storyboard.json).
 * - Main.tsx 는 없을 때만 생성한다 (사운드 큐는 손으로 다듬는다).
 *
 * 사용: node tools/scaffold-scenes.mjs [--storyboard <json>] [--root <dir>]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const ROOT = argOf("--root", join(dirname(fileURLToPath(import.meta.url)), ".."));
const FPS = 30;

const storyboard = JSON.parse(readFileSync(argOf("--storyboard", join(ROOT, "docs", "storyboard.json")), "utf8"));
const fps = storyboard.fps || FPS;

const toName = (id) => {
  const pascal = String(id)
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return /^[0-9]/.test(pascal) ? `S${pascal}` : pascal;
};

const scenes = storyboard.scenes.map((s) => {
  const from = Math.round(s.startSec * fps);
  const to = Math.round(s.endSec * fps);
  return { ...s, name: toName(s.id), from, durationInFrames: Math.max(1, to - from) };
});

// 연속성 검사: 장면이 겹치거나 비면 경고
for (let i = 1; i < scenes.length; i++) {
  const prevEnd = scenes[i - 1].from + scenes[i - 1].durationInFrames;
  if (prevEnd !== scenes[i].from) {
    console.warn(`⚠ ${scenes[i - 1].id} ends at ${prevEnd} but ${scenes[i].id} starts at ${scenes[i].from}`);
  }
}
const total = scenes[scenes.length - 1].from + scenes[scenes.length - 1].durationInFrames;

const scenesDir = join(ROOT, "src", "scenes");
mkdirSync(scenesDir, { recursive: true });

const esc = (s) => JSON.stringify(s);

for (const s of scenes) {
  const file = join(scenesDir, `${s.name}.tsx`);
  if (existsSync(file)) continue;
  const lines = s.koreanText || [];
  const per = (s.endSec - s.startSec) / Math.max(1, lines.length);
  const captionLines = lines
    .map((t, i) => `    { text: ${esc(t)}, from: ${(i * per).toFixed(2)}, to: ${((i + 1) * per - 0.1).toFixed(2)} },`)
    .join("\n");
  writeFileSync(
    file,
    `import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../theme";
import { Caption, SceneFrame, Vignette } from "../components";

/**
 * ${s.id} — ${(s.purpose || "").replace(/\*\//g, "* /")}
 * ${s.startSec}s → ${s.endSec}s (${s.durationInFrames} frames)
 * 비주얼: ${(s.visual || "").replace(/\*\//g, "* /")}
 * 스텁 — 구현으로 교체할 것.
 */
export const ${s.name}: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: FONTS.num, fontSize: 40, color: COLORS.dim }}>${s.id} (stub)</div>
      </AbsoluteFill>
      <Caption
        lines={[
${captionLines}
        ]}
      />
      <Vignette />
    </SceneFrame>
  );
};
`,
  );
  console.log(`created src/scenes/${s.name}.tsx`);
}

writeFileSync(
  join(scenesDir, "index.ts"),
  `// 자동 생성: node tools/scaffold-scenes.mjs (docs/storyboard.json 이 원본). 손으로 고치지 말 것.
import React from "react";
${scenes.map((s) => `import { ${s.name} } from "./${s.name}";`).join("\n")}

export type SceneEntry = {
  id: string;
  name: string;
  component: React.FC;
  from: number;
  durationInFrames: number;
  transition: string;
};

export const FPS = ${fps};
export const TOTAL_FRAMES = ${total};

export const SCENES: SceneEntry[] = [
${scenes
  .map(
    (s) =>
      `  { id: ${esc(s.id)}, name: ${esc(s.name)}, component: ${s.name}, from: ${s.from}, durationInFrames: ${s.durationInFrames}, transition: ${esc(s.transition || "cut")} },`,
  )
  .join("\n")}
];
`,
);
console.log(`wrote src/scenes/index.ts (${scenes.length} scenes, ${total} frames = ${(total / fps).toFixed(1)}s)`);

// 장면별 독립 진입점: 한 장면만 번들하므로 다른 장면 파일이 깨져 있어도 미리보기가 된다.
//   npx remotion still src/preview/<Name>.tsx Scene-<Name> out/x.png --frame=30
const previewDir = join(ROOT, "src", "preview");
mkdirSync(previewDir, { recursive: true });
for (const s of scenes) {
  writeFileSync(
    join(previewDir, `${s.name}.tsx`),
    `// 자동 생성: node tools/scaffold-scenes.mjs — 장면 하나만 번들하는 미리보기 진입점.
import React from "react";
import { Composition, registerRoot } from "remotion";
import "../fonts.css";
import { ${s.name} } from "../scenes/${s.name}";

const PreviewRoot: React.FC = () => (
  <Composition id="Scene-${s.name}" component={${s.name}} durationInFrames={${s.durationInFrames}} fps={${fps}} width={1920} height={1080} />
);

registerRoot(PreviewRoot);
`,
  );
}
console.log(`wrote src/preview/*.tsx (${scenes.length})`);

const mainFile = join(ROOT, "src", "Main.tsx");
if (!existsSync(mainFile)) {
  writeFileSync(
    mainFile,
    `import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS } from "./theme";
import { Soundtrack } from "./components";
import { SCENES } from "./scenes";

/** 전체 영상: 스토리보드 순서대로 장면을 절대 프레임에 배치 + 사운드트랙. */
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {SCENES.map((s) => (
        <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.durationInFrames}>
          <s.component />
        </Sequence>
      ))}
      <Soundtrack pad={[[0, 0.7]]} wind={[[0, 0.4]]} />
    </AbsoluteFill>
  );
};
`,
  );
  console.log("wrote src/Main.tsx");
}

writeFileSync(
  join(ROOT, "src", "Root.tsx"),
  `// 자동 생성: node tools/scaffold-scenes.mjs. 갤러리/컴포지션 추가는 이 스크립트에서.
import React from "react";
import { Composition, Folder } from "remotion";
import "./fonts.css";
import { HEIGHT, WIDTH } from "./theme";
import { Main } from "./Main";
import { FPS, SCENES, TOTAL_FRAMES } from "./scenes";
import * as Gallery from "./Gallery";
import { THUMB, Thumbnail } from "./Thumbnail";

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={THUMB.width} height={THUMB.height} />
      <Folder name="Scenes">
        {SCENES.map((s) => (
          <Composition key={s.id} id={\`Scene-\${s.name}\`} component={s.component} durationInFrames={s.durationInFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
        ))}
      </Folder>
      <Folder name="Gallery">
        {Object.entries(Gallery).map(([id, component]) => (
          <Composition key={id} id={id} component={component as React.FC} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} />
        ))}
      </Folder>
    </>
  );
};
`,
);
console.log("wrote src/Root.tsx");
