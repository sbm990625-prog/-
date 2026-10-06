// 마을: 집·울타리·우물·등불·모닥불·상자 모델과 마을 사람(NPC)
// 지도 글자(levels.js)로 배치되고(map.js), 마을 사람은 levels.js의 npcs대로 광장을 거닐며 전사가 다가오면 말을 겁니다.

const VILLAGE_COLORS = {
  plaster: rgb('#e6d9bd'),
  beam: rgb('#5c4330', MAT.BARK),
  thatch: rgb('#b89a52'),
  thatchDark: rgb('#9a7d3e'),
  tile: rgb('#8c4a3c'),
  tileDark: rgb('#73392e'),
  door: rgb('#4a3222'),
  glass: rgb('#ffe9a8', MAT.GLOW),
  frame: rgb('#3a2a1c'),
  wood: rgb('#8a6a42', MAT.BARK),
  woodDark: rgb('#5a4228', MAT.BARK),
  rope: rgb('#b09a6a'),
  bucket: rgb('#6a5236'),
  lampGlow: rgb('#ffd27a', MAT.GLOW),
  hay: rgb('#c9a24e'),
  hayDark: rgb('#a98230'),
  skin: rgb('#f0c8a6', MAT.SKIN),
  skinDark: rgb('#e0b490', MAT.SKIN),
  hair: rgb('#4a3222', MAT.HAIR),
  hairGrey: rgb('#b8b0a4', MAT.HAIR),
  cloth: rgb('#ffffff', MAT.CLOTH),      // 옷: 배치할 때 사람마다 색을 곱함
  pants: rgb('#4a4a5a', MAT.CLOTH),
  apron: rgb('#6a5a4a', MAT.CLOTH),
  boot: rgb('#3a2a1c'),
  straw: rgb('#d8bc6a'),
  eye: rgb('#1a1612'),
};
const LANTERN_LIGHT = [2.4, 1.7, 0.8];   // 등불 빛 (따뜻한 노랑)

// 집: 돌 기단 + 회벽 + 나무 기둥·들보 + 문·창문 + 지붕. 바닥 w x d (m), 원점 = 가운데 바닥, 문은 앞(-z)
function buildHouse(rnd, w, d, roof) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain;
  const stone = () => vary(COLORS.rock, 0.12, rnd), plaster = () => vary(C.plaster, 0.04, rnd), beam = () => vary(C.beam, 0.08, rnd);
  const W = w - 0.5, D = d - 0.5, H = 2.5, base = 0.45;
  Shapes.box(b, ch(T(0, base / 2, 0), S(W + 0.25, base, D + 0.25)), stone);
  Shapes.box(b, ch(T(0, base + H / 2, 0), S(W, H, D)), plaster);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) Shapes.box(b, ch(T(sx * W / 2, base + H / 2, sz * D / 2), S(0.18, H, 0.18)), beam);
    Shapes.box(b, ch(T(sx * W / 2, base + H - 0.08, 0), S(0.14, 0.16, D)), beam);
    Shapes.box(b, ch(T(sx * W / 2, base + 1.3, 0), S(0.12, 0.1, D)), beam);
    Shapes.box(b, ch(T(0, base + H - 0.08, sx * D / 2), S(W, 0.16, 0.14)), beam);
    Shapes.box(b, ch(T(0, base + 1.3, sx * D / 2), S(W, 0.1, 0.12)), beam);
    // 옆 창문
    Shapes.box(b, ch(T(sx * (W / 2 + 0.03), base + 1.75, 0.1), S(0.06, 0.7, 0.7)), () => C.glass);
    Shapes.box(b, ch(T(sx * (W / 2 + 0.05), base + 1.75, 0.1), S(0.04, 0.78, 0.08)), () => C.frame);
    Shapes.box(b, ch(T(sx * (W / 2 + 0.05), base + 1.75, 0.1), S(0.04, 0.08, 0.78)), () => C.frame);
  }
  // 문 (앞쪽 왼편) + 앞 창문
  Shapes.box(b, ch(T(-W / 4, base + 0.95, -D / 2 - 0.04), S(0.95, 1.9, 0.08)), () => C.door);
  Shapes.box(b, ch(T(-W / 4, base + 1.9, -D / 2 - 0.06), S(1.1, 0.12, 0.1)), beam);
  Shapes.box(b, ch(T(-W / 4 + 0.32, base + 1.0, -D / 2 - 0.09), S(0.07, 0.07, 0.04)), () => COLORS.gold);   // 손잡이
  Shapes.box(b, ch(T(W / 4, base + 1.75, -D / 2 - 0.03), S(0.75, 0.7, 0.06)), () => C.glass);
  Shapes.box(b, ch(T(W / 4, base + 1.75, -D / 2 - 0.05), S(0.83, 0.08, 0.04)), () => C.frame);
  Shapes.box(b, ch(T(W / 4, base + 1.75, -D / 2 - 0.05), S(0.08, 0.78, 0.04)), () => C.frame);
  Shapes.box(b, ch(T(W / 4, base + 1.35, -D / 2 - 0.08), S(0.95, 0.08, 0.14)), beam);   // 창턱 + 화분
  Shapes.box(b, ch(T(W / 4, base + 1.45, -D / 2 - 0.14), S(0.5, 0.14, 0.14)), () => rgb('#8a5a3c'));
  for (let i = 0; i < 4; i++) Shapes.icosphere(b, ch(T(W / 4 - 0.18 + i * 0.12, base + 1.58, -D / 2 - 0.14), S(0.06, 0.05, 0.06)), 0, () => [1, 0.4 + rnd() * 0.3, 0.5, 0], { smooth: true });
  // 지붕
  const top = base + H, over = 0.45;
  if (roof === 'hip') {   // 네모 뿔 (초가)
    const rh = 1.7;
    Shapes.cylinder(b, ch(T(0, top - 0.05, 0), S(W / 2 + over, 1, D / 2 + over), M4.rotationY(Math.PI / 4)), Math.SQRT2, 0, rh, 4, () => vary(C.thatch, 0.08, rnd), { bottom: true, bottomColor: () => C.thatchDark });
    Shapes.cylinder(b, ch(T(0, top - 0.25, 0), S(W / 2 + over + 0.08, 1, D / 2 + over + 0.08), M4.rotationY(Math.PI / 4)), Math.SQRT2, Math.SQRT2 * 0.93, 0.22, 4, () => C.thatchDark, { top: false, bottom: true });
    Shapes.box(b, ch(T(W / 2 - 0.5, top + 0.9, 0.3), S(0.45, 1.4, 0.45)), stone);   // 굴뚝
  } else {   // 맞배지붕 (기와): 양쪽으로 기운 판 + 삼각 박공
    const rh = 1.5, half = D / 2 + over, len = Math.hypot(half, rh), th = Math.atan2(rh, half);
    for (const sz of [-1, 1]) {
      Shapes.box(b, ch(T(0, top + rh / 2 - 0.05, sz * half / 2), M4.rotationX(-sz * th), S(W + over * 2, 0.14, len + 0.1)), () => vary(C.tile, 0.08, rnd));
      for (let i = 1; i < 6; i++) Shapes.box(b, ch(T(0, top + rh / 2 - 0.05, sz * half / 2), M4.rotationX(-sz * th), T(0, 0.08, (i / 6 - 0.5) * len), S(W + over * 2 + 0.02, 0.05, 0.06)), () => C.tileDark);
    }
    Shapes.box(b, ch(T(0, top + rh, 0), S(W + over * 2 + 0.1, 0.16, 0.26)), () => C.tileDark);   // 용마루
    for (const sx of [-1, 1]) {   // 박공 벽
      const x = sx * W / 2;
      const p0 = [x, top, -D / 2], p1 = [x, top, D / 2], p2 = [x, top + rh, 0];
      b.tri(p0, p1, p2, plaster(), [0, top, 0]);
      b.tri(p1, p0, p2, plaster(), [0, top, 0]);
      Shapes.box(b, ch(T(x, top + rh / 2, 0), M4.rotationX(th), S(0.1, 0.1, len)), beam);
      Shapes.box(b, ch(T(x, top + rh / 2, 0), M4.rotationX(-th), S(0.1, 0.1, len)), beam);
    }
    Shapes.box(b, ch(T(W / 2 - 0.7, top + rh * 0.8, 0.5), S(0.45, 1.1, 0.45)), stone);   // 굴뚝
  }
  return b;
}

// 울타리 한 칸: x 방향으로 2m (기둥 둘 + 가로대 둘)
function buildFence(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const wood = () => vary(C.wood, 0.12, rnd);
  for (const x of [-0.95, 0.95]) {
    Shapes.cylinder(b, T(x, 0, 0), 0.07, 0.06, 1.05, 7, wood, sm);
    Shapes.cylinder(b, ch(T(x, 1.05, 0)), 0.06, 0, 0.1, 7, wood, sm);
  }
  for (const y of [0.42, 0.82]) Shapes.box(b, ch(T(0, y, 0), M4.rotationZ((rnd() - 0.5) * 0.04), S(2.0, 0.1, 0.05)), wood);
  return b;
}

// 우물: 돌 테 + 기둥 두 개 + 작은 지붕 + 두레박
function buildWell(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const stone = () => vary(COLORS.rock, 0.14, rnd), wood = () => vary(C.wood, 0.1, rnd);
  Shapes.cylinder(b, M4.identity(), 0.82, 0.78, 0.85, 12, stone, { rnd, jitter: 0.08, top: false });
  Shapes.cylinder(b, T(0, 0.85, 0), 0.8, 0.8, 0.08, 12, stone, sm);
  Shapes.cylinder(b, T(0, 0.86, 0), 0.6, 0.6, 0.02, 12, () => rgb('#101418'), { top: true });   // 어두운 속
  for (const x of [-0.65, 0.65]) Shapes.box(b, ch(T(x, 1.2, 0), S(0.14, 2.0, 0.14)), wood);
  Shapes.cylinder(b, ch(T(-0.75, 1.75, 0), M4.rotationZ(-Math.PI / 2)), 0.05, 0.05, 1.5, 7, wood, sm);   // 도르래 축
  Shapes.cylinder(b, ch(T(-0.1, 1.75, 0), M4.rotationZ(-Math.PI / 2)), 0.12, 0.12, 0.2, 10, wood, sm);  // 감긴 줄
  Shapes.segment(b, [0, 1.75, 0], [0, 1.0, 0], 0.012, 0.012, 4, () => C.rope);
  Shapes.cylinder(b, T(0, 0.75, 0), 0.14, 0.16, 0.25, 9, () => C.bucket, sm);
  Shapes.cylinder(b, ch(T(0, 2.2, 0), S(1.05, 1, 0.85), M4.rotationY(Math.PI / 4)), Math.SQRT2, 0, 0.55, 4, () => vary(C.thatch, 0.08, rnd), { bottom: true, bottomColor: () => C.thatchDark });
  return b;
}

// 등불 기둥: 나무 기둥 위 유리 등 (빛은 map.js에서 World.lights에 더함)
function buildLantern(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const wood = () => vary(C.woodDark, 0.1, rnd);
  Shapes.cylinder(b, M4.identity(), 0.09, 0.07, 2.1, 8, wood, sm);
  Shapes.box(b, ch(T(0, 0.1, 0), S(0.4, 0.2, 0.4)), () => vary(COLORS.rock, 0.1, rnd));
  Shapes.box(b, ch(T(0, 2.0, 0), S(0.36, 0.06, 0.36)), () => COLORS.iron);
  Shapes.box(b, ch(T(0, 2.3, 0), S(0.26, 0.5, 0.26)), () => C.lampGlow);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Shapes.box(b, ch(T(sx * 0.14, 2.3, sz * 0.14), S(0.04, 0.54, 0.04)), () => COLORS.iron);
  Shapes.cylinder(b, ch(T(0, 2.56, 0), M4.rotationY(Math.PI / 4)), 0.3, 0, 0.18, 4, () => COLORS.iron, { bottom: true });
  Shapes.icosphere(b, ch(T(0, 2.74, 0), S(0.05, 0.05, 0.05)), 0, () => COLORS.iron, sm);
  return b;
}

// 모닥불: 돌 테 + 장작 + 숯불 (불꽃은 particles.js가 World.torches 자리에서 피움)
function buildCampfire(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const stone = () => vary(COLORS.rock, 0.15, rnd);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rnd() * 0.3, r = 0.62 + rnd() * 0.08;
    Shapes.icosphere(b, ch(T(Math.cos(a) * r, 0.1, Math.sin(a) * r), M4.rotationY(rnd() * 3), S(0.2 + rnd() * 0.06, 0.14, 0.17)), 1, stone, sm);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    Shapes.segment(b, [Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42], [-Math.cos(a) * 0.12, 0.3, -Math.sin(a) * 0.12], 0.07, 0.05, 6, () => vary(C.woodDark, 0.15, rnd), sm);
  }
  Shapes.icosphere(b, ch(T(0, 0.12, 0), S(0.3, 0.1, 0.3)), 1, () => COLORS.coal, sm);
  Shapes.cylinder(b, T(0, 0.0, 0), 0.5, 0.5, 0.04, 12, () => rgb('#2a2622'), sm);   // 그을린 바닥
  return b;
}

function buildCrate(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain;
  const wood = () => vary(C.wood, 0.1, rnd), dark = () => vary(C.woodDark, 0.1, rnd);
  Shapes.box(b, ch(T(0, 0.4, 0), S(0.8, 0.8, 0.8)), wood);
  for (const [x, y, z, sx, sy, sz] of [[0, 0.78, 0, 0.86, 0.06, 0.86], [0, 0.02, 0, 0.86, 0.06, 0.86]]) Shapes.box(b, ch(T(x, y, z), S(sx, sy, sz)), dark);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Shapes.box(b, ch(T(sx * 0.4, 0.4, sz * 0.4), S(0.08, 0.84, 0.08)), dark);
  Shapes.box(b, ch(T(0.55, 0.22, -0.15), M4.rotationY(0.5), S(0.44, 0.44, 0.44)), wood);   // 옆의 작은 상자
  return b;
}

function buildBarrel(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, sm = { smooth: true };
  const wood = () => vary(C.wood, 0.1, rnd);
  Shapes.cylinder(b, M4.identity(), 0.3, 0.34, 0.42, 12, wood, sm);
  Shapes.cylinder(b, T(0, 0.42, 0), 0.34, 0.3, 0.42, 12, wood, { smooth: true, top: true });
  for (const y of [0.12, 0.4, 0.7]) Shapes.cylinder(b, T(0, y, 0), 0.355, 0.355, 0.05, 12, () => COLORS.iron, sm);
  Shapes.cylinder(b, T(0.55, 0, 0.2), 0.24, 0.27, 0.3, 10, wood, sm);   // 옆의 작은 통
  Shapes.cylinder(b, T(0.55, 0.3, 0.2), 0.27, 0.24, 0.3, 10, wood, { smooth: true, top: true });
  return b;
}

function buildHay(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  Shapes.icosphere(b, ch(T(0, 0.42, 0), S(0.62, 0.42, 0.56)), 2, () => vary(C.hay, 0.12, rnd), { smooth: true, rnd, jitter: 0.12 });
  Shapes.icosphere(b, ch(T(0.5, 0.26, 0.45), S(0.36, 0.26, 0.34)), 1, () => vary(C.hayDark, 0.12, rnd), { smooth: true, rnd, jitter: 0.15 });
  for (let i = 0; i < 14; i++) {   // 삐죽 나온 지푸라기
    const a = rnd() * 6.283, r = 0.3 + rnd() * 0.35, y = 0.2 + rnd() * 0.5;
    Shapes.segment(b, [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + 0.3), y + (rnd() - 0.3) * 0.2, Math.sin(a) * (r + 0.3)], 0.012, 0.004, 3, () => C.straw);
  }
  return b;
}

// ---------- 마을 사람 모델 (관절 원점 = 부모 기준 위치, 앞쪽은 -z) ----------
function buildNpcParts() {
  const C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const make = (fn) => {
    const b = new MeshBuilder();
    fn(b);
    return b;
  };
  const cloth = () => C.cloth;
  return {
    nPelvis: make((b) => {   // 옷 아랫자락 (치마처럼 퍼짐)
      Shapes.cylinder(b, T(0, -0.34, 0), 0.22, 0.17, 0.36, 10, cloth, sm);
      Shapes.cylinder(b, T(0, 0.0, 0), 0.18, 0.18, 0.05, 10, () => COLORS.leather, sm);   // 허리띠
    }),
    nTorso: make((b) => {
      Shapes.cylinder(b, M4.identity(), 0.17, 0.2, 0.46, 10, cloth, sm);
      Shapes.icosphere(b, ch(T(0, 0.46, 0), S(0.2, 0.08, 0.17)), 1, cloth, sm);   // 어깨
    }),
    nTorsoApron: make((b) => {   // 대장장이: 가죽 앞치마
      Shapes.cylinder(b, M4.identity(), 0.17, 0.2, 0.46, 10, cloth, sm);
      Shapes.icosphere(b, ch(T(0, 0.46, 0), S(0.2, 0.08, 0.17)), 1, cloth, sm);
      Shapes.box(b, ch(T(0, 0.14, -0.17), M4.rotationX(0.08), S(0.3, 0.62, 0.03)), () => C.apron);
      Shapes.box(b, ch(T(0, 0.42, -0.19), S(0.05, 0.1, 0.02)), () => C.apron);
    }),
    nHead: make((b) => {
      Shapes.icosphere(b, ch(T(0, 0.14, 0), S(0.125, 0.14, 0.13)), 2, () => C.skin, sm);
      Shapes.icosphere(b, ch(T(0, 0.19, 0.02), S(0.13, 0.11, 0.135)), 2, () => C.hair, sm);     // 머리카락
      Shapes.icosphere(b, ch(T(0, 0.1, -0.125), S(0.03, 0.025, 0.03)), 1, () => C.skinDark, sm);   // 코
      for (const sx of [-1, 1]) {
        Shapes.icosphere(b, ch(T(sx * 0.045, 0.145, -0.115), S(0.02, 0.025, 0.012)), 1, () => C.eye, sm);
        Shapes.icosphere(b, ch(T(sx * 0.12, 0.13, 0.0), S(0.025, 0.035, 0.02)), 1, () => C.skin, sm);   // 귀
      }
      Shapes.box(b, ch(T(0, 0.06, -0.12), S(0.05, 0.012, 0.01)), () => rgb('#b06a58'));   // 입
      Shapes.cylinder(b, T(0, -0.04, 0), 0.05, 0.05, 0.1, 8, () => C.skin, sm);          // 목
    }),
    nHatStraw: make((b) => {
      Shapes.cylinder(b, T(0, 0.24, 0), 0.36, 0.3, 0.04, 14, () => C.straw, { smooth: true, bottom: true });
      Shapes.cylinder(b, T(0, 0.26, 0), 0.15, 0.12, 0.13, 12, () => C.straw, sm);
      Shapes.cylinder(b, T(0, 0.27, 0), 0.155, 0.155, 0.03, 12, () => rgb('#8a3a2a'), sm);   // 띠
    }),
    nHood: make((b) => {   // 촌장: 두건 + 흰 수염
      Shapes.icosphere(b, ch(T(0, 0.2, 0.03), S(0.16, 0.15, 0.16)), 2, cloth, sm);
      Shapes.segment(b, [0, 0.3, 0.02], [0, 0.22, 0.26], 0.07, 0.01, 7, cloth, sm);
      Shapes.icosphere(b, ch(T(0, 0.03, -0.1), S(0.07, 0.09, 0.05)), 1, () => C.hairGrey, sm);   // 수염
    }),
    nArm: make((b) => Shapes.cylinder(b, T(0, -0.26, 0), 0.045, 0.055, 0.26, 8, cloth, sm)),
    nForearm: make((b) => {
      Shapes.cylinder(b, T(0, -0.24, 0), 0.04, 0.045, 0.24, 8, () => C.skin, sm);
      Shapes.icosphere(b, ch(T(0, -0.26, 0), S(0.05, 0.06, 0.05)), 1, () => C.skin, sm);
    }),
    nLeg: make((b) => Shapes.cylinder(b, T(0, -0.42, 0), 0.065, 0.075, 0.42, 8, () => C.pants, sm)),
    nShin: make((b) => {
      Shapes.cylinder(b, T(0, -0.4, 0), 0.055, 0.065, 0.4, 8, () => C.pants, sm);
      Shapes.box(b, ch(T(0, -0.42, -0.04), S(0.12, 0.08, 0.22)), () => C.boot);
    }),
  };
}

// 관절: [이름, 부모, 부모 기준 위치, 모델] (키 약 1.75m). 몸통·모자는 사람마다 다름 (Villager가 채움)
const NPC_RIG = [
  ['hips', null, [0, 0.92, 0], 'nPelvis'],
  ['spine', 'hips', [0, 0.04, 0], 'nTorso'],
  ['head', 'spine', [0, 0.5, 0], 'nHead'],
  ['hat', 'head', [0, 0, 0], null],
  ['shoulderR', 'spine', [0.21, 0.42, 0], 'nArm'],
  ['elbowR', 'shoulderR', [0, -0.26, 0], 'nForearm'],
  ['shoulderL', 'spine', [-0.21, 0.42, 0], 'nArm'],
  ['elbowL', 'shoulderL', [0, -0.26, 0], 'nForearm'],
  ['hipR', 'hips', [0.1, -0.02, 0], 'nLeg'],
  ['kneeR', 'hipR', [0, -0.42, 0], 'nShin'],
  ['hipL', 'hips', [-0.1, -0.02, 0], 'nLeg'],
  ['kneeL', 'hipL', [0, -0.42, 0], 'nShin'],
];
const NPC_CLOTH = new Set(['nPelvis', 'nTorso', 'nTorsoApron', 'nArm', 'nHood']);   // 옷 색을 곱할 부분

// 마을 사람 하나: 집 근처를 거닐다가 전사가 다가오면 돌아서서 손을 흔들고 말을 걺
class Villager {
  constructor(def, x, z) {
    this.def = def;
    this.name = def.name;
    this.x = x;
    this.z = z;
    this.homeX = x;
    this.homeZ = z;
    this.radius = 0.35;
    this.scale = def.scale || 1;
    this.facing = Math.random() * Math.PI * 2;
    this.vx = 0;
    this.vz = 0;
    this.walk = 0;
    this.timer = 1 + Math.random() * 3;
    this.wx = x;
    this.wz = z;
    this.near = false;      // 전사가 가까이 있음 (말풍선)
    this.wave = 0;          // 손 흔드는 남은 시간
    this.lineIdx = 0;
    this.lineTimer = 0;
    this.seed = Math.random();
    this.groundY = World.groundHeight(x, z);
    this.rig = NPC_RIG.map(([n, p, o, m]) => [n, p, o, n === 'spine' ? (def.apron ? 'nTorsoApron' : 'nTorso') : n === 'hat' ? (def.hat === 'straw' ? 'nHatStraw' : def.hat === 'hood' ? 'nHood' : null) : m]);
    this.tint = [1, def.tint[0], def.tint[1], def.tint[2]];
  }

  // 지금 할 말 (들판을 모두 평정하면 다른 말)
  get lines() { return Zones.allCleared && this.def.linesDone ? this.def.linesDone : this.def.lines; }
  get line() { return this.lines[this.lineIdx % this.lines.length]; }

  update(dt, p, time) {
    const dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz);
    const wasNear = this.near;
    this.near = d < 3.4 && !p.dead;
    this.wave = Math.max(0, this.wave - dt);
    const a = Math.min(1, dt * 8);
    if (this.near) {   // 전사 쪽으로 돌아서고 멈춤. 처음 다가오면 손을 흔들고, 머물면 몇 초마다 다음 말
      if (!wasNear) {
        this.wave = 1.6;
        this.lineTimer = 0;
      }
      this.lineTimer += dt;
      if (this.lineTimer > 4.5) {
        this.lineTimer = 0;
        this.lineIdx++;
      }
      const target = Math.atan2(dz, dx), diff = Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing));
      this.facing += diff * Math.min(1, dt * 6);
      this.vx -= this.vx * a;
      this.vz -= this.vz * a;
    } else {   // 집 근처를 어슬렁
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 3 + Math.random() * 5;
        for (let i = 0; i < 6; i++) {
          const tx = this.homeX + (Math.random() - 0.5) * 7, tz = this.homeZ + (Math.random() - 0.5) * 7;
          if (!World.blocked(tx, tz, 0.5)) {
            this.wx = tx;
            this.wz = tz;
            break;
          }
        }
      }
      const tx = this.wx - this.x, tz = this.wz - this.z, td = Math.hypot(tx, tz);
      if (td > 0.4) {
        const sp = 1.1;
        this.vx += ((tx / td) * sp - this.vx) * a;
        this.vz += ((tz / td) * sp - this.vz) * a;
        const target = Math.atan2(tz, tx), diff = Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing));
        this.facing += diff * Math.min(1, dt * 5);
      } else {
        this.vx -= this.vx * a;
        this.vz -= this.vz * a;
      }
    }
    const bumped = World.moveEntity(this, this.vx * dt, this.vz * dt);
    if (bumped) this.timer = Math.min(this.timer, 0.3);   // 막히면 곧 다른 곳으로
    this.groundY += (World.groundHeight(this.x, this.z) - this.groundY) * Math.min(1, dt * 12);
    this.walk += Math.hypot(this.vx, this.vz) * dt * 3.2;
  }

  // 그리기용 부분 목록에 더함
  parts(out, time) {
    const amt = Utils.clamp(Math.hypot(this.vx, this.vz) / 1.1, 0, 1);
    const s = Math.sin(this.walk), co = Math.cos(this.walk), breathe = Math.sin(time * 1.6 + this.seed * 9) * 0.025;
    const pose = {
      hips: J(0, s * 0.08 * amt),
      spine: J(-0.04 * amt + breathe, -s * 0.08 * amt),
      head: J(Math.sin(time * 1.1 + this.seed * 5) * 0.05 - breathe, Math.sin(time * 0.7 + this.seed * 3) * 0.2 * (1 - amt)),
      hipR: J(s * 0.6 * amt), kneeR: J(-(0.05 + Math.max(0, co) * 0.9 * amt)),
      hipL: J(-s * 0.6 * amt), kneeL: J(-(0.05 + Math.max(0, -co) * 0.9 * amt)),
      shoulderR: J(-s * 0.4 * amt + 0.1, 0, 0.12), elbowR: J(0.35),
      shoulderL: J(s * 0.4 * amt + 0.1, 0, -0.12), elbowL: J(0.35),
    };
    if (this.wave > 0) {   // 손 흔들기
      const k = Math.min(1, this.wave * 4) * Math.min(1, (1.6 - this.wave) * 4);
      blendPose(pose, { shoulderR: J(2.7 + Math.sin(time * 9) * 0.3, 0, 0.5), elbowR: J(0.5) }, k);
    }
    const hips = (0.92 - 0.02 * amt + Math.abs(co) * 0.04 * amt) * this.scale;
    const root = M4.chain(M4.translation(this.x, this.groundY, this.z), M4.rotationY(-this.facing - Math.PI / 2), M4.scaling(this.scale, this.scale, this.scale));
    for (const part of rigMatrices(this.rig, root, pose, { hips: hips / this.scale }).out) {
      out.push({ mesh: part.mesh, m: part.m, flash: 0, tint: NPC_CLOTH.has(part.mesh) ? this.tint : [1, 1, 1, 1] });
    }
  }
}

const Village = {
  list: [],   // 이 구역의 마을 사람들

  // 소품 모델을 Models에 더함 (Models.build 다음에)
  build() {
    Models.house = buildHouse(Utils.rng(61), 4, 4, 'hip');
    Models.houseB = buildHouse(Utils.rng(62), 6, 4, 'gable');
    Models.fence = buildFence(Utils.rng(63));
    Models.well = buildWell(Utils.rng(64));
    Models.lantern = buildLantern(Utils.rng(65));
    Models.campfire = buildCampfire(Utils.rng(66));
    Models.crate = buildCrate(Utils.rng(67));
    Models.barrel = buildBarrel(Utils.rng(68));
    Models.hay = buildHay(Utils.rng(69));
  },

  // 마을 사람 모델 (Enemies.models에 합쳐져 같은 방식으로 그려짐)
  npcModels() {
    return buildNpcParts();
  },

  // 구역을 불러올 때: levels.js의 npcs 자리에 마을 사람 배치
  spawn(level) {
    this.list = (level.npcs || []).map((def) => new Villager(def, (def.cell[0] + 0.5) * CELL, (def.cell[1] + 0.5) * CELL));
  },

  update(dt, p, time) {
    for (const v of this.list) v.update(dt, p, time);
    // 전사와 겹치지 않게
    for (const v of this.list) {
      const dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz), min = v.radius + p.radius;
      if (d < min && d > 0.001) World.moveEntity(p, (dx / d) * (min - d), (dz / d) * (min - d));
    }
  },

  parts(out, time) {
    for (const v of this.list) v.parts(out, time);
  },
};
