// 마을: 집·울타리·우물·등불·모닥불·상자·장터 가판대·깃발·이정표·빨랫줄 모델과 마을 사람(NPC)
// 지도 글자(levels.js)로 배치되고(map.js), 마을 사람은 levels.js의 npcs대로 광장을 거닐며 전사가 다가오면 말을 겁니다.
// 광장 위 삼각 깃발 줄(번팅)과 굴뚝 연기도 여기서 만듭니다 (Village.spawn · Village.update).

const VILLAGE_COLORS = {
  beam: rgb('#5c4330', MAT.BARK),
  thatch: rgb('#a8925f'),
  thatchDark: rgb('#6e5c3c'),
  door: rgb('#4a3222'),
  frame: rgb('#3a2a1c'),
  wood: rgb('#8a6a42', MAT.BARK),
  woodDark: rgb('#5a4228', MAT.BARK),
  woodLight: rgb('#a07a4a', MAT.BARK),
  rope: rgb('#b09a6a'),
  bucket: rgb('#6a5236'),
  lampGlow: rgb('#ffd27a', MAT.GLOW),
  doorLamp: rgb('#d8a050', MAT.GLOW),     // 문간 등 (기둥 등불보다 조금 은은하게)
  hay: rgb('#c9a24e'),
  hayDark: rgb('#a98230'),
  straw: rgb('#d8bc6a'),
  pane: rgb('#262e3a', 0.5),              // 창유리: 어둡고 하늘이 살짝 비침
  paneGlow: rgb('#3a2410', MAT.GLOW),     // 창 안쪽의 은은한 불빛 (가장자리)
  paneCore: rgb('#80501e', MAT.GLOW),     // 창 안쪽의 따뜻한 불빛 (가운데). 낮엔 밝은 벽에 묻혀 은은하고, 밤엔 uGlowK로 더 밝아짐
  soil: rgb('#3a2a1e'),
  leaf: rgb('#56703c', MAT.LEAF),
};
const LANTERN_LIGHT = [2.4, 1.7, 0.8];   // 등불 빛 (따뜻한 노랑)
const WINDOW_LIGHT = [1.8, 1.0, 0.45];  // 밤에만 켜지는 창문 불빛 (집마다 하나, 창 앞 벽과 땅을 물들임)
const FLOWER_BOX_COLORS = ['#e08a9a', '#e8c050', '#a08ad0', '#e8e2d8', '#d86a5a'];

// ---------- 집 ----------
// 집 모양 네 가지: 초가 둘(작은 집), 기와 둘(긴 집). 회벽은 크림색까지만 (더 밝으면 햇빛에 하얗게 바램)
//   plaster 회벽, beam 나무 뼈대, accent 덧문, door 문, thatch/thatchDark 초가(볏짚 / 처마 끝), tile/tileDark 기와(겉 / 판 밑면)
const HOUSE_STYLES = [
  { roof: 'thatch', plaster: '#e4dac2', beam: '#5a4230', accent: '#4a8486', door: '#3e6264', thatch: '#a08a5a', thatchDark: '#5e4e32' },   // 크림 벽 + 청록 덧문
  { roof: 'thatch', plaster: '#e6d4c4', beam: '#4a3a2e', accent: '#b0604a', door: '#6e4630', thatch: '#968662', thatchDark: '#584c34' },   // 복숭앗빛 벽 + 적갈 덧문
  { roof: 'gable', plaster: '#e4ded0', beam: '#5c4330', accent: '#58769e', door: '#4a5a78', tile: '#9a5340', tileDark: '#5a2c22' },        // 붉은 기와 + 푸른 덧문
  { roof: 'gable', plaster: '#dedbd0', beam: '#4e3b2c', accent: '#c09a48', door: '#5e4430', tile: '#566680', tileDark: '#343c50' },        // 청회색 기와 + 겨자색 덧문
];
const HOUSE_WALL = 2.7;     // 벽 높이 (m)
const HOUSE_BASE = 0.45;    // 돌 기단 높이 (문턱 높이)
const HOUSE_WIN_Y = 1.78;   // 창 가운데 높이 (기단 위에서)
// 초가지붕 세 단: [아래 크기, 아래 높이, 위 크기, 위 높이] (크기는 처마 끝 = 1, 높이는 벽 꼭대기에서 m). 단마다 아래 단 위로 겹쳐 얹음
const THATCH_TIERS = [[1.0, 0.12, 0.7, 0.72], [0.79, 0.56, 0.44, 1.28], [0.52, 1.14, 0, 2.1]];

const shadeCol = (c, k) => [c[0] * k, c[1] * k, c[2] * k, c[3]];

// 네 점 면 (점마다 법선·색). center를 주면 면이 center 바깥을 향하게 맞춤
function quadN(b, p, n, cols, center) {
  b.triN(p[0], p[1], p[2], n[0], n[1], n[2], cols[0], center, [cols[0], cols[1], cols[2]]);
  b.triN(p[0], p[2], p[3], n[0], n[2], n[3], cols[0], center, [cols[0], cols[2], cols[3]]);
}

// 얇은 천 (깃발·빨래·차양 술): 앞뒤 두 면을 nx x ny 칸으로 (바람에 휘도록 잘게 나눔)
//   o = 한 모서리, ux = 가로 방향(길이 포함), uy = 세로 방향(길이 포함), colorAt(i, j) = 칸 색
function clothGrid(b, o, ux, uy, nx, ny, colorAt) {
  const n = V3.normalize(V3.cross(ux, uy)), back = V3.scale(n, -1);
  const P = (i, j) => V3.add(o, V3.add(V3.scale(ux, i / nx), V3.scale(uy, j / ny)));
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const c = colorAt(i, j), q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
      quadN(b, q, [n, n, n, n], [c, c, c, c], V3.sub(q[0], n));          // 앞면
      quadN(b, q, [back, back, back, back], [c, c, c, c], V3.add(q[0], n));   // 뒷면
    }
  }
}

// 돌 기단: 속 상자 + 크기가 조금씩 다른 돌을 두 줄로 엇갈려 쌓은 겉
function housePlinth(b, rnd, W, D) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, base = HOUSE_BASE;
  const stone = () => vary(COLORS.rock, 0.18, rnd);
  Shapes.box(b, ch(T(0, base / 2 - 0.02, 0), S(W + 0.1, base + 0.04, D + 0.1)), stone);
  const sides = [[W, ch(T(0, 0, -D / 2 - 0.05))], [W, ch(T(0, 0, D / 2 + 0.05), M4.rotationY(Math.PI))],
    [D, ch(T(W / 2 + 0.05, 0, 0), M4.rotationY(-Math.PI / 2))], [D, ch(T(-W / 2 - 0.05, 0, 0), M4.rotationY(Math.PI / 2))]];
  for (const [L, m] of sides) {
    for (let row = 0; row < 2; row++) {
      let x = -L / 2 - 0.08 + (row ? 0.2 : 0);
      while (x < L / 2) {
        const sw = Math.min(0.36 + rnd() * 0.16, L / 2 + 0.1 - x);
        if (sw > 0.12) {
          Shapes.box(b, ch(m, T(x + sw / 2, 0.12 + row * 0.21, -0.02 - rnd() * 0.03), M4.rotationY((rnd() - 0.5) * 0.2),
            S(sw - 0.035, 0.19 + rnd() * 0.04, 0.12)), stone);
        }
        x += sw;
      }
    }
  }
}

// 벽 하나의 나무 뼈대: 위·가운데·아래 가로대, 창 양옆 기둥, 빈 칸마다 비스듬한 버팀대
//   m: 벽 기준 행렬 (원점 = 벽 가운데 땅, x = 벽을 따라, 벽 바깥 = -z, 벽면 z = 0), L: 벽 길이
//   holes: 문·창 자리 [{ x, half: 반폭, door: 문이면 true }]
function houseFrame(b, m, L, holes, beam) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, base = HOUSE_BASE, H = HOUSE_WALL;
  const piece = (x, y, sx, sy, a = 0) => Shapes.box(b, ch(m, T(x, y, -0.02), M4.rotationZ(a), S(sx, sy, 0.08)), beam);
  const yRail = base + 1.22, yTop = base + H - 0.08, ySill = base + 0.07;
  piece(0, yTop, L, 0.16);
  let x0 = -L / 2;   // 가운데·아래 가로대 (문 자리는 비움)
  for (const d of [...holes.filter((h) => h.door), { x: L / 2 + 1, half: 1 }]) {
    const x1 = Math.min(L / 2, d.x - d.half);
    if (x1 - x0 > 0.05) {
      piece((x0 + x1) / 2, yRail, x1 - x0, 0.1);
      piece((x0 + x1) / 2, ySill, x1 - x0, 0.12);
    }
    x0 = d.x + d.half;
  }
  const xs = [-L / 2 + 0.1, L / 2 - 0.1];
  for (const h of holes) {
    xs.push(h.x - h.half, h.x + h.half);
    if (!h.door) for (const s of [-1, 1]) piece(h.x + s * h.half, base + H / 2, 0.1, H - 0.2);   // 창 양옆 기둥 (문틀은 따로)
  }
  xs.sort((a, c) => a - c);
  const inHole = (x) => holes.some((h) => Math.abs(x - h.x) < h.half);
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], c = xs[i + 1];
    if (c - a < 0.35 || inHole((a + c) / 2)) continue;
    const n = Math.ceil((c - a) / 1.3);   // 1.3m보다 넓은 칸은 기둥을 더 세워 나눔
    for (let k = 1; k < n; k++) piece(a + ((c - a) * k) / n, base + H / 2, 0.1, H - 0.2);
    for (let k = 0; k < n; k++) {
      const p = a + ((c - a) * k) / n, q = a + ((c - a) * (k + 1)) / n, xm = (p + q) / 2, w = q - p - 0.14, dir = xm >= 0 ? 1 : -1;
      const brace = (y0, y1, s) => piece(xm, (y0 + y1) / 2, Math.hypot(w, y1 - y0) - 0.04, 0.09, s * Math.atan2(y1 - y0, w));
      brace(ySill + 0.07, yRail - 0.06, dir);   // 아래 칸: 가까운 모서리 쪽으로 올라가는 버팀대
      if (p <= -L / 2 + 0.15 || q >= L / 2 - 0.15) brace(yRail + 0.06, yTop - 0.09, -dir);   // 모서리 옆 위 칸은 반대로 (< 모양)
    }
  }
}

// 창문 (벽 기준 좌표): 어두운 유리 + 안쪽의 따뜻한 불빛 + 십자 창살 + 틀·창턱 + 열어 둔 덧문 + 꽃 상자
function houseWindow(b, rnd, m, x, K, o = {}) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, C = VILLAGE_COLORS, sm = { smooth: true };
  const y = HOUSE_BASE + HOUSE_WIN_Y, ww = o.w || 0.74, wh = o.h || 0.7;
  const beam = () => vary(K.beam, 0.08, rnd);
  Shapes.box(b, ch(m, T(x, y, -0.01), S(ww, wh, 0.03)), () => C.pane);
  Shapes.box(b, ch(m, T(x, y - 0.05, -0.027), S(ww * 0.7, wh * 0.62, 0.006)), () => C.paneGlow);
  Shapes.box(b, ch(m, T(x, y - 0.07, -0.031), S(ww * 0.4, wh * 0.36, 0.006)), () => C.paneCore);
  Shapes.box(b, ch(m, T(x, y, -0.04), S(0.045, wh, 0.03)), beam);   // 창살
  Shapes.box(b, ch(m, T(x, y + 0.02, -0.04), S(ww, 0.045, 0.03)), beam);
  for (const s of [-1, 1]) Shapes.box(b, ch(m, T(x + s * (ww / 2 + 0.04), y, -0.045), S(0.08, wh + 0.14, 0.09)), beam);   // 틀
  Shapes.box(b, ch(m, T(x, y + wh / 2 + 0.05, -0.05), S(ww + 0.22, 0.1, 0.1)), beam);
  Shapes.box(b, ch(m, T(x, y - wh / 2 - 0.035, -0.08), S(ww + 0.3, 0.07, 0.18)), beam);   // 창턱
  if (o.shutters) {   // 덧문: 경첩에서 바깥으로 활짝 열어 벽에서 살짝 뜸 + 가로 살
    for (const s of [-1, 1]) {
      const hinge = ch(m, T(x + s * (ww / 2 + 0.08), y, -0.07), M4.rotationY(s * 0.38));
      Shapes.box(b, ch(hinge, T(s * 0.19, 0, -0.018), S(0.36, wh + 0.06, 0.035)), () => vary(K.accent, 0.06, rnd));
      for (let i = 0; i < 4; i++) Shapes.box(b, ch(hinge, T(s * 0.19, -wh / 2 + 0.12 + i * (wh - 0.18) / 3, -0.038), S(0.3, 0.028, 0.01)), () => K.accentDark);
    }
  }
  if (o.flowers) {   // 꽃 상자: 나무 상자 + 잎 덩이 + 작은 꽃
    const fy = y - wh / 2 - 0.15;
    Shapes.box(b, ch(m, T(x, fy, -0.16), S(ww + 0.14, 0.16, 0.2)), () => vary(C.wood, 0.1, rnd));
    Shapes.box(b, ch(m, T(x, fy + 0.07, -0.16), S(ww + 0.08, 0.03, 0.15)), () => C.soil);
    for (let i = 0; i < 5; i++) {
      Shapes.icosphere(b, ch(m, T(x - ww / 2 + 0.04 + i * (ww - 0.08) / 4, fy + 0.12, -0.17 + (rnd() - 0.5) * 0.05), S(0.1, 0.075, 0.08)), 1,
        () => vary(C.leaf, 0.2, rnd), { smooth: true, rnd, jitter: 0.2 });
    }
    for (let i = 0; i < 9; i++) {
      const fc = rgb(FLOWER_BOX_COLORS[(rnd() * FLOWER_BOX_COLORS.length) | 0]);
      Shapes.icosphere(b, ch(m, T(x - ww / 2 + 0.05 + rnd() * (ww - 0.1), fy + 0.17 + rnd() * 0.05, -0.2 - rnd() * 0.06), S(0.035, 0.03, 0.035)), 0, () => fc, sm);
    }
  }
}

// 문 (벽 기준 좌표): 판자 세 장 + 틀 + 쇠 경첩 + 고리 손잡이, 돌계단 두 단, 작은 차양, 옆에 매단 등
//   side: 등을 다는 쪽 (+1 오른쪽 / -1 왼쪽)
function houseDoor(b, rnd, m, x, K, side) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, C = VILLAGE_COLORS, sm = { smooth: true }, base = HOUSE_BASE;
  const beam = () => vary(K.beam, 0.08, rnd), iron = () => COLORS.iron, tp = (p) => M4.transformPoint(m, p);
  const dh = 1.95;
  for (let i = 0; i < 3; i++) Shapes.box(b, ch(m, T(x + (i - 1) * 0.32, base + dh / 2, -0.01), S(0.305, dh, 0.06)), () => vary(K.door, 0.16, rnd));
  for (const s of [-1, 1]) Shapes.box(b, ch(m, T(x + s * 0.54, base + 1.04, -0.045), S(0.12, 2.08, 0.12)), beam);
  Shapes.box(b, ch(m, T(x, base + 2.06, -0.055), S(1.3, 0.14, 0.14)), beam);   // 상인방
  for (const y of [0.4, 1.55]) Shapes.box(b, ch(m, T(x + side * 0.12, base + y, -0.045), S(0.62, 0.05, 0.015)), iron);   // 경첩 띠
  const hx = x - side * 0.3;   // 손잡이: 둥근 쇠판 + 고리
  Shapes.cylinder(b, ch(m, T(hx, base + 1.0, -0.04), M4.rotationX(-Math.PI / 2)), 0.035, 0.035, 0.012, 8, iron, sm);
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2, r = 0.035, cy = base + 0.97;
    Shapes.segment(b, tp([hx + Math.sin(a0) * r, cy - Math.cos(a0) * r, -0.06]), tp([hx + Math.sin(a1) * r, cy - Math.cos(a1) * r, -0.06]), 0.007, 0.007, 4, iron);
  }
  const stone = () => vary(COLORS.rock, 0.12, rnd);   // 돌계단 두 단
  Shapes.box(b, ch(m, T(x, 0.11, -0.4), M4.rotationY((rnd() - 0.5) * 0.06), S(1.42, 0.22, 0.62)), stone);
  Shapes.box(b, ch(m, T(x, 0.33, -0.22), M4.rotationY((rnd() - 0.5) * 0.06), S(1.2, 0.22, 0.42)), stone);
  const ay = base + 2.32;   // 차양: 바깥쪽이 낮게 기운 판 + 받침 둘
  Shapes.box(b, ch(m, T(x, ay, -0.33), M4.rotationX(-0.36), S(1.5, 0.06, 0.74)), () => vary(K.awning, 0.08, rnd));
  for (const s of [-1, 1]) Shapes.segment(b, tp([x + s * 0.6, base + 1.98, -0.03]), tp([x + s * 0.6, ay - 0.06, -0.5]), 0.03, 0.03, 5, beam);
  // 문간 등: 벽에서 뻗은 쇠 팔에 매단 작은 유리 등
  const lx = x + side * 0.75, ly = base + 1.82;
  Shapes.segment(b, tp([lx, ly + 0.36, 0]), tp([lx, ly + 0.36, -0.3]), 0.015, 0.015, 4, iron);
  Shapes.segment(b, tp([lx, ly + 0.36, -0.3]), tp([lx, ly + 0.14, -0.3]), 0.008, 0.008, 4, iron);
  Shapes.box(b, ch(m, T(lx, ly, -0.3), S(0.13, 0.2, 0.13)), () => C.doorLamp);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Shapes.box(b, ch(m, T(lx + sx * 0.07, ly, -0.3 + sz * 0.07), S(0.025, 0.23, 0.025)), iron);
  Shapes.cylinder(b, ch(m, T(lx, ly + 0.11, -0.3), M4.rotationY(Math.PI / 4)), 0.13, 0, 0.1, 4, iron, { bottom: true });
  Shapes.box(b, ch(m, T(lx, ly - 0.11, -0.3), S(0.16, 0.03, 0.16)), iron);
}

// 굴뚝: 돌 두 덩이(위가 살짝 어긋남) + 덮개 판 + 토기 연통. 연기가 나오는 자리를 돌려줌
function houseChimney(b, rnd, x, z, yIn, yRoof) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain;
  const stone = () => vary(COLORS.rock, 0.16, rnd), y1 = yRoof + 0.55;
  Shapes.box(b, ch(T(x, (yIn + y1) / 2, z), S(0.52, y1 - yIn, 0.52)), stone);
  Shapes.box(b, ch(T(x + 0.025, y1 + 0.14, z - 0.02), S(0.46, 0.3, 0.46)), stone);
  Shapes.box(b, ch(T(x, y1 + 0.33, z), S(0.64, 0.08, 0.64)), stone);
  Shapes.cylinder(b, T(x, y1 + 0.36, z), 0.12, 0.1, 0.22, 8, () => rgb('#9a5340'), { smooth: true });
  return [x, y1 + 0.62, z];
}

// 초가지붕: 둥근 네모(모서리가 둥근) 볏짚 세 단. 단마다 짚 결 줄무늬 + 두툼하고 어두운 처마 끝 + 밑면
//   a, c: 처마 끝 반지름 (x, z), y0: 지붕이 얹히는 높이, hs: 높이 배율. 지붕 높이를 알려 주는 함수를 돌려줌 (굴뚝 자리)
const THATCH_ROUND = 0.36;   // 초가지붕 모서리 둥글기 (0.5 = 꽤 둥긂, 작을수록 네모에 가까움)
function thatchRoof(b, rnd, a, c, y0, K, hs = 1) {
  const n = 64, e = THATCH_ROUND, p = 2 / e, ring = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t);
    const gx = (Math.sign(cs) * Math.pow(Math.abs(cs), 2 - e)) / a, gz = (Math.sign(sn) * Math.pow(Math.abs(sn), 2 - e)) / c, gl = Math.hypot(gx, gz) || 1;
    ring.push({ x: a * Math.sign(cs) * Math.pow(Math.abs(cs), e), z: c * Math.sign(sn) * Math.pow(Math.abs(sn), e), nx: gx / gl, nz: gz / gl });
  }
  const P = (r, k, h, j = 1) => [r.x * k * j, y0 + h * hs, r.z * k * j];
  const lip = 0.16 * hs, under = shadeCol(K.thatchDark, 0.45);
  for (const [k0, h0, k1, h1] of THATCH_TIERS) {
    // 짚 결: 가닥마다 밝기가 크게 다르고 (가끔 어두운 다발·볕에 바랜 다발), 둘레가 조금씩 울퉁불퉁 (짚단을 엮은 듯)
    const cols = ring.map(() => {
      const v = vary(K.thatch, 0.42, rnd), r = rnd();
      return r < 0.22 ? shadeCol(v, 0.68) : r > 0.9 ? shadeCol(v, 1.15) : v;
    });
    const jit = ring.map(() => 1 + (rnd() - 0.5) * 0.035), sag = ring.map(() => (rnd() - 0.5) * 0.05);
    const center = [0, y0 + (h0 - 1) * hs, 0], hm = h0 + (h1 - h0) * 0.5, km = k0 + (k1 - k0) * 0.5, ku = km - ((km - k1) * 0.05) / hs / (h1 - hm);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ri = ring[i], rj = ring[j], col = cols[i], lo = shadeCol(col, 0.8), mid = shadeCol(col, 0.95), hi = shadeCol(col, 1.06);
      const nrm = (r) => V3.normalize([r.nx * (h1 - h0) * hs, (k0 - k1) * (r.x * r.nx + r.z * r.nz), r.nz * (h1 - h0) * hs]);
      const ni = nrm(ri), nj = nrm(rj);
      // 한 단을 아래·위 두 칸으로 (가운데에 짚단을 묶은 가로 띠가 살짝 튀어나옴)
      const A = [P(ri, k0, h0, jit[i]), P(rj, k0, h0, jit[j])], B = [P(ri, km, hm), P(rj, km, hm)], Bo = [P(ri, km, hm, 1.012), P(rj, km, hm, 1.012)];
      quadN(b, [A[0], A[1], Bo[1], Bo[0]], [ni, nj, nj, ni], [lo, lo, mid, mid], center);
      if (k1 > 0) quadN(b, [B[0], B[1], P(rj, k1, h1), P(ri, k1, h1)], [ni, nj, nj, ni], [mid, mid, hi, hi], center);
      else b.triN(B[0], B[1], [0, y0 + h1 * hs, 0], ni, nj, [0, 1, 0], col, center, [mid, mid, hi]);
      const band = shadeCol(K.thatchDark, 0.9 + rnd() * 0.2), up = [0, 1, 0];
      quadN(b, [Bo[0], Bo[1], P(rj, ku, hm + 0.05 / hs), P(ri, ku, hm + 0.05 / hs)], [ni, nj, up, up], [band, band, band, band], center);
      // 처마 끝: 짚단을 자른 면 (두툼하고 어두움, 아래 끝이 들쭉날쭉)
      const d = vary(K.thatchDark, 0.35, rnd), hn = (r) => [r.nx, -0.2, r.nz], bi = h0 - lip / hs + sag[i], bj = h0 - lip / hs + sag[j];
      quadN(b, [P(ri, k0 * 1.012, bi, jit[i]), P(rj, k0 * 1.012, bj, jit[j]), A[1], A[0]], [hn(ri), hn(rj), hn(rj), hn(ri)], [shadeCol(d, 0.75), shadeCol(d, 0.75), d, d],
        [0, y0 + (h0 - lip / hs / 2) * hs, 0]);
      b.tri(P(ri, k0 * 1.012, bi, jit[i]), P(rj, k0 * 1.012, bj, jit[j]), [0, y0 + (h0 - lip / hs) * hs + 0.02, 0], under, [0, y0 + h0 * hs + 3, 0]);   // 밑면
    }
  }
  const apex = THATCH_TIERS[THATCH_TIERS.length - 1][3];
  Shapes.icosphere(b, M4.chain(M4.translation(0, y0 + apex * hs - 0.03, 0), M4.scaling(0.3 * hs, 0.15 * hs, 0.3 * hs)), 1, () => vary(K.thatchDark, 0.15, rnd), { smooth: true, rnd, jitter: 0.12 });
  return (x, z) => {   // (x, z) 위 지붕 높이
    const k = Math.pow(Math.pow(Math.abs(x) / a, p) + Math.pow(Math.abs(z) / c, p), 1 / p);
    let h = -Infinity;
    for (const [k0, h0, k1, h1] of THATCH_TIERS) if (k <= k0 && k >= k1) h = Math.max(h, h0 + ((k0 - k) / (k0 - k1)) * (h1 - h0));
    return y0 + h * hs;
  };
}

// 맞배지붕 (기와): 벽 꼭대기를 지나는 두 경사 판 (처마 밑 틈 없음) + 한 장씩 겹친 기와 + 용마루 + 박공 널 + 서까래 끝 + 박공 벽
function gableRoof(b, rnd, W, D, top, K) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const run = D / 2, rh = 1.55, th = Math.atan2(rh, run), cs = Math.cos(th), sn = Math.sin(th);
  const over = 0.5, overX = 0.42, t = 0.12, Wr = W + overX * 2, L = (run + over) / cs + 0.08, Lh = L / 2;
  const beam = () => vary(K.beam, 0.08, rnd);
  for (const sz of [-1, 1]) {
    // 판의 밑면이 (z = ±run, 벽 꼭대기)와 (z = 0, 용마루)를 지나도록: 밑면 가운데 + 바깥 법선 * 두께 절반
    const slab = ch(T(0, top + (rh - over * Math.tan(th)) / 2 + (cs * t) / 2, (sz * (run + over)) / 2 + (sz * sn * t) / 2), M4.rotationX(sz * th));
    Shapes.box(b, ch(slab, S(Wr, t, L)), () => K.tileDark);
    const rows = Math.round(L / 0.34), cols = Math.round(Wr / 0.31);
    for (let r = 0; r < rows; r++) {   // 기와: 용마루 → 처마로 한 줄씩, 아래 끝이 살짝 들려 윗줄 위에 겹침
      const zc = sz * (-Lh + ((r + 0.5) * L) / rows), rowK = 0.9 + rnd() * 0.14;
      for (let k = 0; k < cols; k++) {
        const xc = -Wr / 2 + ((k + 0.5) * Wr) / cols;
        Shapes.box(b, ch(slab, T(xc, t / 2 + 0.03, zc), M4.rotationX(-sz * 0.09), S(Wr / cols - 0.028, 0.05, L / rows + 0.05)), () => shadeCol(vary(K.tile, 0.16, rnd), rowK));
      }
    }
    for (const sx of [-1, 1]) Shapes.box(b, ch(slab, T(sx * (Wr / 2 + 0.035), 0.02, 0), S(0.07, t + 0.18, L + 0.02)), beam);   // 박공 널
    for (let x = -Wr / 2 + 0.3; x < Wr / 2 - 0.2; x += 0.55) Shapes.box(b, ch(slab, T(x, -t / 2 - 0.045, sz * (Lh - 0.32)), S(0.08, 0.09, 0.58)), beam);   // 서까래 끝
  }
  const ridgeY = top + rh + t / cs + 0.07;   // 용마루 + 양 끝 장식
  Shapes.cylinder(b, ch(T(-(Wr / 2 + 0.06), ridgeY, 0), M4.rotationZ(-Math.PI / 2)), 0.13, 0.13, Wr + 0.12, 10, () => K.tileDark, sm);
  for (const sx of [-1, 1]) Shapes.icosphere(b, ch(T(sx * (Wr / 2 + 0.08), ridgeY + 0.08, 0), M4.rotationZ(-sx * 0.4), S(0.1, 0.2, 0.12)), 1, () => K.tileDark, sm);
  for (const sx of [-1, 1]) {   // 박공 벽: 회벽 삼각형 + 나무 (경사 서까래·가운데 기둥·가로대) + 작은 마름모 바람구멍
    const x = (sx * W) / 2;
    b.tri([x, top, -run], [x, top, run], [x, top + rh, 0], vary(K.plaster, 0.03, rnd), [0, top + 0.4, 0]);
    const xo = x + sx * 0.03;
    for (const s of [-1, 1]) Shapes.box(b, ch(T(xo, top + rh / 2 - 0.04, (s * run) / 2), M4.rotationX(s * th), S(0.1, 0.12, Math.hypot(run, rh))), beam);
    Shapes.box(b, ch(T(xo, top + rh / 2, 0), S(0.1, rh, 0.1)), beam);
    Shapes.box(b, ch(T(xo, top + rh * 0.4, 0), S(0.1, 0.09, run * 1.15)), beam);
    Shapes.box(b, ch(T(x + sx * 0.02, top + rh * 0.7, 0), M4.rotationX(Math.PI / 4), S(0.04, 0.17, 0.17)), () => VILLAGE_COLORS.frame);
  }
  return (x, z) => top + rh * (1 - Math.abs(z) / run) + t / cs + 0.05;
}

// 집 한 채: 바닥 w x d (m), 원점 = 가운데 바닥, 문은 앞(-z). st = HOUSE_STYLES 하나, flip = 문·창 좌우를 뒤집음
// 모델에 남기는 정보 (map.js가 씀): chimney 연기 자리, windowLight 밤 창문 불빛 자리, door 문 앞 자리 (모두 모델 좌표)
function buildHouse(rnd, w, d, st, flip) {
  const b = new MeshBuilder(), T = M4.translation, S = M4.scaling, ch = M4.chain, RY = M4.rotationY;
  const K = {
    plaster: rgb(st.plaster), beam: rgb(st.beam, MAT.BARK), accent: rgb(st.accent), accentDark: shadeCol(rgb(st.accent), 0.62), door: rgb(st.door, MAT.BARK),
    thatch: rgb(st.thatch || '#a8925f'), thatchDark: rgb(st.thatchDark || '#6a5838'), tile: rgb(st.tile || '#9a5340'), tileDark: rgb(st.tileDark || '#5a2c22'),
  };
  K.awning = st.roof === 'gable' ? K.tile : rgb('#7a6448', MAT.BARK);
  const W = w - 0.5, D = d - 0.5, H = HOUSE_WALL, base = HOUSE_BASE, top = base + H, fx = flip ? -1 : 1, long = w > d;
  const beam = () => vary(K.beam, 0.08, rnd);
  housePlinth(b, rnd, W, D);
  Shapes.box(b, ch(T(0, base + H / 2, 0), S(W, H, D)), () => vary(K.plaster, 0.03, rnd));   // 회벽
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Shapes.box(b, ch(T((sx * W) / 2, base + H / 2, (sz * D) / 2), S(0.2, H + 0.02, 0.2)), beam);   // 모서리 기둥
  // 앞벽: 문 + 창 (긴 집은 창 둘), 옆벽: 창 하나씩, 뒷벽: 긴 집만 작은 창
  const doorX = -fx * (long ? 1.6 : W / 4), wins = long ? [fx * 0.05, fx * 1.85] : [(fx * W) / 4];
  const walls = [
    { m: T(0, 0, -D / 2), L: W, door: doorX, wins: wins.map((x, i) => ({ x, shutters: true, flowers: i === 0 })) },
    { m: ch(T(0, 0, D / 2), RY(Math.PI)), L: W, wins: long ? [{ x: 0, shutters: false, flowers: false, w: 0.6 }] : [] },
    { m: ch(T(W / 2, 0, 0), RY(-Math.PI / 2)), L: D, wins: [{ x: 0, shutters: true, flowers: fx > 0 }] },
    { m: ch(T(-W / 2, 0, 0), RY(Math.PI / 2)), L: D, wins: [{ x: 0, shutters: true, flowers: fx < 0 }] },
  ];
  for (const wall of walls) {
    const holes = wall.wins.map((o) => ({ x: o.x, half: (o.w || 0.74) / 2 + 0.11 }));
    if (wall.door !== undefined) holes.push({ x: wall.door, half: 0.6, door: true });
    houseFrame(b, wall.m, wall.L, holes, beam);
    for (const o of wall.wins) houseWindow(b, rnd, wall.m, o.x, K, o);
    if (wall.door !== undefined) houseDoor(b, rnd, wall.m, wall.door, K, -fx);
  }
  // 지붕 + 굴뚝
  if (st.roof === 'thatch') {
    const a = W / 2 + 0.55, c = D / 2 + 0.55;
    const roofAt = thatchRoof(b, rnd, a, c, top, K);
    const cx = fx * 0.95, cz = 0.75;
    b.chimney = houseChimney(b, rnd, cx, cz, top - 0.2, roofAt(cx, cz));
  } else {
    const roofAt = gableRoof(b, rnd, W, D, top, K);
    const cx = fx * (W / 2 - 1.0), cz = 0.6;
    b.chimney = houseChimney(b, rnd, cx, cz, top - 0.2, roofAt(cx, cz));
  }
  b.windowLight = [wins[0], base + HOUSE_WIN_Y - 0.2, -D / 2 - 0.75];
  b.door = [doorX, 0, -D / 2];
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

// 우물: 돌 테 + 기둥 두 개 + 작은 초가지붕 + 두레박
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
  thatchRoof(b, rnd, 1.0, 0.82, 2.15, { thatch: C.thatch, thatchDark: C.thatchDark }, 0.36);   // 집과 같은 볏짚 지붕 (작게)
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
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain;
  Shapes.icosphere(b, ch(T(0, 0.42, 0), S(0.62, 0.42, 0.56)), 2, () => vary(C.hay, 0.12, rnd), { smooth: true, rnd, jitter: 0.12 });
  Shapes.icosphere(b, ch(T(0.5, 0.26, 0.45), S(0.36, 0.26, 0.34)), 1, () => vary(C.hayDark, 0.12, rnd), { smooth: true, rnd, jitter: 0.15 });
  for (let i = 0; i < 14; i++) {   // 삐죽 나온 지푸라기
    const a = rnd() * 6.283, r = 0.3 + rnd() * 0.35, y = 0.2 + rnd() * 0.5;
    Shapes.segment(b, [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + 0.3), y + (rnd() - 0.3) * 0.2, Math.sin(a) * (r + 0.3)], 0.012, 0.004, 3, () => C.straw);
  }
  return b;
}

// ---------- 장터·깃발·이정표·빨랫줄·디딤돌 ----------
// 장터 가판대: 기둥 넷 + 판자 판매대 + 크림·적갈 줄무늬 차양(앞쪽 물결 술은 바람에 살랑) + 바구니의 사과·양배추·호박
function buildStall(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const wood = () => vary(C.wood, 0.12, rnd), dark = () => vary(C.woodDark, 0.1, rnd);
  const stripes = [rgb('#e0d6be', MAT.CLOTH), rgb('#b85a4e', MAT.CLOTH)];
  for (const sx of [-1, 1]) {
    Shapes.box(b, ch(T(sx * 1.0, 1.22, 0.55), S(0.1, 2.44, 0.1)), dark);    // 뒤 기둥 (높게)
    Shapes.box(b, ch(T(sx * 1.0, 1.0, -0.62), S(0.1, 2.0, 0.1)), dark);     // 앞 기둥
  }
  Shapes.box(b, ch(T(0, 0.42, -0.05), S(2.0, 0.84, 0.8)), wood);            // 판매대
  for (let i = 1; i < 7; i++) Shapes.box(b, ch(T(-1.0 + i * 0.286, 0.42, -0.455), S(0.014, 0.8, 0.012)), dark);   // 판자 틈
  Shapes.box(b, ch(T(0, 0.87, -0.05), S(2.14, 0.06, 0.92)), dark);          // 위판
  for (let i = 0; i < 7; i++) {   // 줄무늬 차양: 앞이 낮게 기욺
    const x = -0.9 + i * 0.3;
    Shapes.box(b, ch(T(x, 2.22, -0.03), M4.rotationX(-0.32), S(0.3, 0.04, 1.44)), () => stripes[i % 2]);
    const cx = x, cy = 2.0, cz = -0.72, r = 0.15, n = 6;   // 앞쪽 물결 술 (반원, 앞뒤 두 면)
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI + (k / n) * Math.PI, a1 = Math.PI + ((k + 1) / n) * Math.PI;
      const p0 = [cx, cy, cz], p1 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz], p2 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz];
      b.triN(p0, p1, p2, [0, 0, -1], [0, 0, -1], [0, 0, -1], stripes[i % 2], [cx, cy, cz + 1]);
      b.triN(p0, p1, p2, [0, 0, 1], [0, 0, 1], [0, 0, 1], stripes[i % 2], [cx, cy, cz - 1]);
    }
  }
  const basket = (x, z, r) => {
    Shapes.cylinder(b, T(x, 0.9, z), r * 0.82, r, 0.13, 10, () => vary(rgb('#9a7a48', MAT.BARK), 0.1, rnd), { smooth: true, top: false });
    Shapes.cylinder(b, T(x, 1.02, z), r * 0.92, r * 0.92, 0.012, 10, () => rgb('#3a2a1a'), { top: true });
  };
  basket(-0.62, -0.12, 0.28);   // 사과
  for (let i = 0; i < 9; i++) {
    const a = rnd() * 6.28, r = rnd() * 0.17;
    Shapes.icosphere(b, ch(T(-0.62 + Math.cos(a) * r, 1.06 + (0.17 - r) * 0.4, -0.12 + Math.sin(a) * r), S(0.06, 0.055, 0.06)), 1, () => vary(rgb('#b8443a'), 0.15, rnd), sm);
  }
  basket(0.05, -0.08, 0.3);   // 양배추
  for (const [x, z] of [[-0.06, -0.12], [0.14, -0.14], [0.04, 0.05]]) {
    Shapes.icosphere(b, ch(T(x, 1.1, z), S(0.12, 0.1, 0.12)), 1, () => vary(rgb('#6a9a4a', MAT.LEAF), 0.15, rnd), { smooth: true, rnd, jitter: 0.12 });
  }
  for (const [x, z, s] of [[0.68, -0.15, 1], [0.52, 0.12, 0.8]]) {   // 호박 (골이 진 둥근 덩이 + 꼭지)
    Shapes.cylinder(b, ch(T(x, 0.9, z), S(s, s, s)), 0.13, 0.13, 0.15, 10, () => vary(rgb('#c8743a'), 0.12, rnd), { smooth: true, rnd, jitter: 0.12, bottom: true });
    Shapes.segment(b, [x, 0.9 + 0.15 * s, z], [x + 0.02, 0.9 + 0.22 * s, z], 0.015, 0.01, 4, () => rgb('#5a6a30'));
  }
  Shapes.box(b, ch(T(0.95, 0.3, -0.55), M4.rotationY(0.3), S(0.5, 0.5, 0.5)), wood);   // 옆에 놓인 상자 + 그 위 바구니
  Shapes.cylinder(b, T(0.95, 0.55, -0.55), 0.18, 0.21, 0.12, 9, () => vary(rgb('#9a7a48', MAT.BARK), 0.1, rnd), sm);
  Shapes.box(b, ch(T(-0.8, 1.2, -0.48), M4.rotationZ(0.05), S(0.36, 0.22, 0.03)), () => vary(C.woodLight, 0.05, rnd));   // 작은 값 팻말
  Shapes.segment(b, [-0.8, 0.9, -0.47], [-0.8, 1.1, -0.47], 0.012, 0.012, 4, dark);
  b.setWind((x, y, z) => (z < -0.69 && y < 2.01 && y > 1.8 ? Utils.clamp((2.0 - y) / 0.15, 0, 1) * 0.035 : 0));
  return b;
}

// 깃발 기둥 (세로 깃발): 높은 장대 + 위 가로대에 매단 천 (장대 쪽·위쪽이 묶여 있고 바깥 아래 모서리가 바람에 가장 크게 흔들림)
function buildBanner(rnd, main, trim) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const wood = () => vary(C.woodDark, 0.08, rnd), M = rgb(main, MAT.CLOTH), R = rgb(trim, MAT.CLOTH), cream = rgb('#e0d6be', MAT.CLOTH);
  Shapes.box(b, ch(T(0, 0.15, 0), S(0.42, 0.3, 0.42)), () => vary(COLORS.rock, 0.12, rnd));
  Shapes.cylinder(b, M4.identity(), 0.07, 0.055, 4.5, 8, wood, sm);
  Shapes.cylinder(b, ch(T(0, 4.2, 0), M4.rotationZ(-Math.PI / 2)), 0.03, 0.03, 0.82, 6, wood, sm);
  Shapes.icosphere(b, ch(T(0, 4.56, 0), S(0.08, 0.08, 0.08)), 1, () => COLORS.gold, sm);
  Shapes.cylinder(b, T(0, 4.6, 0), 0.05, 0, 0.16, 6, () => COLORS.gold, sm);
  const nx = 4, ny = 10, w = 0.66, h = 2.5;
  clothGrid(b, [0.08, 4.15, 0], [w, 0, 0], [0, -h, 0], nx, ny, (i, j) => {
    if (j === 0 || j === ny - 1) return R;                                      // 위·아래 띠
    const u = (i + 0.5) / nx - 0.5, v = (j + 0.5) / ny - 0.36;
    return Math.abs(u) + Math.abs(v) * 0.9 < 0.2 ? cream : M;                   // 가운데 마름모 문장
  });
  b.setWind((x, y) => (x > 0.09 && y < 4.16 && y > 1.6 ? 0.12 * Math.min(1, (x - 0.08) / w) * Math.pow(Utils.clamp((4.15 - y) / h, 0, 1), 0.8) : 0));
  return b;
}

// 이정표: 기둥 + 서로 다른 쪽을 가리키는 화살 판 셋 (글씨처럼 보이는 짙은 획) + 작은 지붕
function buildSign(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain;
  const dark = () => vary(C.woodDark, 0.1, rnd), ink = () => rgb('#3a2a1c');
  Shapes.box(b, ch(T(0, 1.0, 0), S(0.12, 2.0, 0.12)), dark);
  Shapes.cylinder(b, ch(T(0, 2.0, 0), M4.rotationY(Math.PI / 4)), 0.16, 0, 0.14, 4, dark, { bottom: true });
  Shapes.box(b, ch(T(0, 0.08, 0), S(0.3, 0.16, 0.3)), () => vary(COLORS.rock, 0.12, rnd));
  for (const [y, yaw] of [[1.75, 0.15], [1.47, 2.6], [1.2, -0.75]]) {
    const m = ch(T(0, y, 0), M4.rotationY(yaw)), board = () => vary(C.woodLight, 0.08, rnd);
    Shapes.box(b, ch(m, T(0.33, 0, 0), S(0.56, 0.17, 0.035)), board);
    Shapes.box(b, ch(m, T(0.61, 0, 0), M4.rotationZ(Math.PI / 4), S(0.12, 0.12, 0.034)), board);   // 화살 끝
    for (const z of [-0.019, 0.019]) for (let k = 0; k < 4; k++) {
      Shapes.box(b, ch(m, T(0.14 + k * 0.1 + rnd() * 0.02, (rnd() - 0.5) * 0.03, z), S(0.05 + rnd() * 0.03, 0.022, 0.004)), ink);
    }
  }
  return b;
}

// 빨랫줄: 기둥 둘 사이에 처진 줄 + 바람에 흔들리는 빨래 넷 (흰 천·파란 셔츠·분홍 천·노란 천) + 집게
const LAUNDRY_SAG = 0.16;
function buildLaundry(rnd) {
  const b = new MeshBuilder(), C = VILLAGE_COLORS, T = M4.translation, S = M4.scaling, ch = M4.chain;
  const dark = () => vary(C.woodDark, 0.1, rnd), ropeY = (x) => 2.0 - LAUNDRY_SAG * (1 - (x / 1.4) * (x / 1.4));
  for (const x of [-1.4, 1.4]) {
    Shapes.box(b, ch(T(x, 1.07, 0), S(0.1, 2.14, 0.1)), dark);
    Shapes.box(b, ch(T(x, 2.05, 0), S(0.1, 0.07, 0.36)), dark);
  }
  for (let i = 0; i < 8; i++) {
    const x0 = -1.4 + (i / 8) * 2.8, x1 = -1.4 + ((i + 1) / 8) * 2.8;
    Shapes.segment(b, [x0, ropeY(x0), 0], [x1, ropeY(x1), 0], 0.012, 0.012, 4, () => C.rope);
  }
  for (const [x0, w, h, hex] of [[-1.15, 0.55, 0.72, '#d6d0c2'], [-0.48, 0.48, 0.46, '#6f8fb4'], [0.12, 0.62, 0.6, '#c8909a'], [0.86, 0.4, 0.5, '#c8b070']]) {
    const c = rgb(hex, MAT.CLOTH), y0 = ropeY(x0) - 0.015, y1 = ropeY(x0 + w) - 0.015;
    clothGrid(b, [x0, y0, 0], [w, y1 - y0, 0], [0, -h, 0], 3, 4, () => c);
    for (const px of [x0 + 0.05, x0 + w - 0.05]) Shapes.box(b, ch(T(px, ropeY(px) - 0.01, 0), S(0.025, 0.07, 0.03)), () => rgb('#a08060'));
  }
  b.setWind((x, y) => (Math.abs(x) < 1.3 && y < ropeY(x) - 0.03 ? Math.min(0.13, (ropeY(x) - y) * 0.2) : 0));
  return b;
}

// 디딤돌: 납작한 돌 하나 (문 앞에서 길까지 몇 개를 놓음)
function buildFlagstone(rnd) {
  const b = new MeshBuilder();
  Shapes.icosphere(b, M4.chain(M4.translation(0, 0.02, 0), M4.scaling(0.33, 0.06, 0.27)), 1, () => vary(COLORS.rock, 0.12, rnd), { smooth: true, rnd, jitter: 0.18 });
  return b;
}

// 광장 위 삼각 깃발 줄 (번팅): 같은 줄·같은 칸에 선 등불 기둥 꼭대기끼리 처지게 이음 (세상 좌표 모델 하나)
// 처음 카메라 자리 가까이 지나는 줄은 빼서 첫 화면을 가리지 않게 함
const BUNTING_COLORS = ['#d0706a', '#e0b048', '#6a98c8', '#78b070', '#b880c0'];
function buildBunting(lanterns, camX, camZ) {
  const b = new MeshBuilder(), rope = VILLAGE_COLORS.rope, cols = BUNTING_COLORS.map((h) => rgb(h, MAT.CLOTH));
  let count = 0;
  for (let i = 0; i < lanterns.length; i++) {
    for (let j = i + 1; j < lanterns.length; j++) {
      const p = lanterns[i], q = lanterns[j], dx = q[0] - p[0], dz = q[2] - p[2], len = Math.hypot(dx, dz);
      if (!((Math.abs(dz) < 0.5 || Math.abs(dx) < 0.5) && len < 16 && len > 4)) continue;
      const t = Utils.clamp(((camX - p[0]) * dx + (camZ - p[2]) * dz) / (len * len), 0, 1);
      if (Math.hypot(p[0] + dx * t - camX, p[2] + dz * t - camZ) < 2.5) continue;
      const at = (s) => [p[0] + dx * s, Utils.lerp(p[1], q[1], s) + 2.72 - 0.5 * 4 * s * (1 - s), p[2] + dz * s];
      const segs = Math.ceil(len / 0.9);
      for (let k = 0; k < segs; k++) Shapes.segment(b, at(k / segs), at((k + 1) / segs), 0.012, 0.012, 4, () => rope);
      const n = Math.floor(len / 0.45), side = V3.normalize([-dz, 0, dx]), back = V3.scale(side, -1);
      for (let k = 1; k < n; k++) {
        const s0 = (k - 0.33) / n, s1 = (k + 0.33) / n, a = at(s0), c = at(s1), mid = at(k / n);
        const tip = [mid[0], mid[1] - 0.3, mid[2]], col = cols[(k + i) % cols.length], from = b.pos.length / 3;
        b.triN(a, c, tip, side, side, side, col, V3.sub(mid, side));
        b.triN(a, c, tip, back, back, back, col, V3.add(mid, side));
        for (let v = from; v < b.pos.length / 3; v++) if (Math.abs(b.pos[v * 3 + 1] - tip[1]) < 1e-5) b.wind[v] = 0.05;   // 깃발 끝만 바람에 살랑
      }
      count++;
    }
  }
  return count ? b : null;
}

// ---------- 마을 사람 모델 ----------
// 사람마다 생김새: 피부·머리·눈 색, 옷 색 (짙은 중간 밝기: 햇빛을 받으면 1.8배 밝아지므로 #b0보다 밝은 넓은 면은 하얗게 바램)
//   hairStyle: bald(대머리 + 흰 수염) / short(짧은 머리 + 두건) / bob(단발) / spiky(삐죽 머리), hairSheen: false면 머리에 푸른 윤기 띠 없음 (밝은 색 머리)
//   jaw: 턱을 V자로 좁히는 정도, eye: 눈 크기, head: 머리 크기 배율(아이는 크게), legs·torso: 다리·몸통 길이 배율
const NPC_LOOKS = {
  elder: { skin: '#e8c0a0', hair: '#d4d0c8', brow: '#dedad2', iris: '#6a5a3a', lip: '#a8645a', shirt: '#5a3f6e', trim: '#b8984e', shawl: '#4c5a3e',
    pants: '#4a4038', boot: '#4a3628', hairStyle: 'bald', jaw: 0.3, eye: 0.92, squint: 0.8, browTilt: -0.15, robe: true, cane: true, walk: 0.8 },
  smith: { skin: '#d8a47e', hair: '#3a2a20', brow: '#2a1c14', iris: '#4a3a2a', lip: '#9a5a48', shirt: '#7a4030', trim: '#5a3a28', apron: '#5a4030',
    pants: '#3a3a44', boot: '#3a2a1e', bandana: '#b84a3a', hairStyle: 'short', jaw: 0.42, browTilt: 0.24, browThick: 1.6, stubble: '#b88a6c', walk: 1.05 },
  farmer: { skin: '#f0c8a6', hair: '#7a4a2a', brow: '#5a3420', iris: '#3f7f4a', lip: '#c06a62', shirt: '#4e6440', trim: '#34442a', scarf: '#b08838',
    pants: '#5a5040', boot: '#4a3426', hairStyle: 'bob', hairSheen: false, hat: 'straw', jaw: 0.48, lash: 1.5, smile: true, blush: 0.5, walk: 1.0 },
  child: { skin: '#f6d0b0', hair: '#c0602e', brow: '#8a3a1a', iris: '#2f6fd0', lip: '#c8605a', shirt: '#3f7f8a', trim: '#2a5a62', scarf: '#b84a3a',
    pants: '#4a5a7a', boot: '#5a3a26', hairStyle: 'spiky', hairSheen: false, jaw: 0.35, eye: 1.18, head: 1.3, legs: 0.8, torso: 0.86, smile: true, blush: 1, walk: 1.6 },
};
const NPC_LID_Y = 0.17;   // 눈꺼풀이 내려오는 기준 높이 (머리 기준)

function npcPalette(L) {
  const skin = rgb(L.skin, MAT.SKIN);
  return {
    // 머리: 머리카락 재질(MAT.HAIR)의 윤기 띠는 검은 머리용 푸른빛이라 밝은 갈색·생강색 머리엔 허연 띠로 보임 → hairSheen: false면 천 재질(부드러운 윤곽 광택)로
    skin, nose: shadeCol(skin, 0.86), hair: rgb(L.hair, L.hairSheen === false ? MAT.CLOTH : MAT.HAIR), brow: rgb(L.brow), lash: rgb('#2a1c16'), eyeWhite: rgb('#f4f1ec'), iris: rgb(L.iris),
    pupil: rgb('#141418'), lip: rgb(L.lip), blush: rgb('#e89090', MAT.SKIN), shirt: rgb(L.shirt, MAT.CLOTH), trim: rgb(L.trim, MAT.CLOTH),
    pants: rgb(L.pants, MAT.CLOTH), boot: rgb(L.boot), sole: rgb('#2a1e16'), belt: rgb('#4a3020'), buckle: rgb('#c9a85a', 0.7),
    apron: rgb(L.apron || '#5a4030'), bandana: rgb(L.bandana || '#b84a3a', MAT.CLOTH), scarf: rgb(L.scarf || '#c09040', MAT.CLOTH),
    shawl: rgb(L.shawl || '#5e6e4c', MAT.CLOTH), straw: rgb('#b49a58'), strawDark: rgb('#7a6436'), ribbon: rgb('#9a4436', MAT.CLOTH), wood: rgb('#6a5034', MAT.BARK),
  };
}

// 머리 (목·두개골·턱·귀 + 머리 모양). 얼굴 쪽 법선을 앞으로 모아 빛이 고르게 (기사와 같은 방식)
function npcHead(b, L, P, rnd) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const skin = () => P.skin, hair = () => P.hair;
  Shapes.cylinder(b, T(0, -0.04, 0), 0.047, 0.045, 0.13, 10, skin, sm);   // 목
  const faceStart = b.pos.length / 3;
  Shapes.icosphere(b, ch(T(0, 0.15, 0), S(0.102, 0.13, 0.113)), 3, skin, sm);
  Shapes.icosphere(b, ch(T(0, 0.085, -0.03), S(0.075, 0.07, 0.08)), 2, skin, sm);
  const jaw = L.jaw ?? 0.5;
  for (let i = faceStart * 3; i < b.pos.length; i += 3) {   // 턱선: 아래로 갈수록 좁히고 턱끝을 살짝 앞으로
    const k = Utils.clamp((0.15 - b.pos[i + 1]) / 0.14, 0, 1);
    b.pos[i] *= 1 - k * k * jaw;
    if (b.pos[i + 2] < 0) b.pos[i + 2] -= k * k * 0.012;
  }
  const ear = L.hairStyle === 'bald' ? 1.15 : 1;
  for (const sx of [-1, 1]) Shapes.icosphere(b, ch(T(sx * 0.1, 0.14, 0.01), S(0.018 * ear, 0.034 * ear, 0.024 * ear)), 1, skin, sm);
  b.bendNormals(faceStart, [0, 0.3, -1], 0.6);
  if (L.stubble) {   // 수염 자국: 턱 아래쪽 정점 색을 살짝 어둡게
    const st = rgb(L.stubble, MAT.SKIN);
    for (let v = faceStart; v < b.pos.length / 3; v++) {
      const y = b.pos[v * 3 + 1], z = b.pos[v * 3 + 2], k = Utils.clamp((0.1 - y) / 0.03, 0, 1) * Utils.clamp((-z - 0.02) / 0.03, 0, 1) * 0.75;
      for (let c = 0; c < 3; c++) b.col[v * 4 + c] = Utils.lerp(b.col[v * 4 + c], st[c], k);
    }
  }
  const lock = (base, dir, len, r, col = hair) => Shapes.segment(b, base, V3.add(base, V3.scale(V3.normalize(dir), len)), r, 0.003, 7, col, sm);
  if (L.hairStyle === 'spiky') {   // 아이: 기사처럼 삐죽삐죽, 짧게
    const c0 = [0, 0.2, 0.025];
    Shapes.icosphere(b, ch(T(c0[0], c0[1], c0[2]), S(0.118, 0.112, 0.124)), 2, hair, sm);
    for (let i = 0; i < 12; i++) {
      const th = 0.25 + rnd() * 1.1, ph = Math.PI * 0.1 + (i / 12) * Math.PI * 0.8 + (rnd() - 0.5) * 0.2;
      const d = [Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th)];
      lock([d[0] * 0.1, c0[1] + d[1] * 0.09, c0[2] + d[2] * 0.1], V3.add(d, [0, 0.55, 0.35]), 0.08 + rnd() * 0.05, 0.04 + rnd() * 0.012);
    }
    for (let i = 0; i < 5; i++) {   // 앞머리
      const x = -0.07 + i * 0.035;
      lock([x, 0.255, -0.075], [x * 2.5 + (rnd() - 0.5) * 0.3, -0.9, -0.55], 0.07 + rnd() * 0.02, 0.028);
    }
    for (const sx of [-1, 1]) lock([sx * 0.105, 0.2, -0.01], [sx * 0.4, -1, 0.1], 0.07, 0.03);
  } else if (L.hairStyle === 'bob') {   // 농부: 턱선까지 오는 단발 + 옆으로 넘긴 앞머리
    Shapes.icosphere(b, ch(T(0, 0.195, 0.02), S(0.12, 0.113, 0.126)), 2, hair, sm);
    for (let i = 0; i < 15; i++) {
      const ph = -Math.PI * 0.62 + (i / 14) * Math.PI * 1.24, sx = Math.sin(ph), cz = Math.cos(ph);
      const base = [sx * 0.112, 0.2, 0.02 + cz * 0.115], tip = [sx * 0.128, 0.065 + Math.abs(sx) * 0.01, 0.025 + cz * 0.118];
      Shapes.segment(b, base, tip, 0.036, 0.008, 7, hair, sm);
    }
    for (let i = 0; i < 5; i++) {
      const x = -0.075 + i * 0.03;
      lock([x, 0.262, -0.07], [0.5 + (rnd() - 0.5) * 0.2, -0.75, -0.45], 0.08 + i * 0.008, 0.03);
    }
  } else if (L.hairStyle === 'short') {   // 대장장이: 짧은 머리 + 빨간 두건 (뒤에 매듭과 두 갈래 끈)
    Shapes.icosphere(b, ch(T(0, 0.185, 0.022), S(0.116, 0.104, 0.122)), 2, hair, sm);
    for (const sx of [-1, 1]) Shapes.icosphere(b, ch(T(sx * 0.098, 0.12, 0.0), S(0.014, 0.04, 0.024)), 1, hair, sm);   // 구레나룻
    const band = () => P.bandana;
    Shapes.icosphere(b, ch(T(0, 0.212, 0.018), S(0.123, 0.098, 0.13)), 2, band, sm);
    Shapes.cylinder(b, ch(T(0, 0.19, 0.016), M4.rotationX(-0.08), S(1, 1, 1.05)), 0.122, 0.12, 0.05, 16, band, sm);
    Shapes.icosphere(b, ch(T(0, 0.205, 0.135), S(0.035, 0.03, 0.03)), 1, band, sm);
    for (const sx of [-1, 1]) Shapes.segment(b, [sx * 0.012, 0.2, 0.14], [sx * 0.05, 0.1, 0.17], 0.024, 0.006, 5, band, sm);
  } else if (L.hairStyle === 'bald') {   // 촌장: 벗어진 머리 + 귀 옆·뒤 흰 머리 + 흘러내리는 수염
    for (const sx of [-1, 1]) {
      Shapes.icosphere(b, ch(T(sx * 0.094, 0.175, 0.035), S(0.032, 0.05, 0.06)), 1, hair, { smooth: true, rnd, jitter: 0.15 });
      lock([sx * 0.09, 0.2, 0.03], [sx * 0.3, -0.4, 0.8], 0.06, 0.024);
    }
    Shapes.icosphere(b, ch(T(0, 0.15, 0.085), S(0.08, 0.06, 0.04)), 1, hair, { smooth: true, rnd, jitter: 0.12 });
    Shapes.icosphere(b, ch(T(0, 0.035, -0.08), S(0.068, 0.085, 0.05)), 2, hair, sm);   // 수염 덩이
    for (let i = 0; i < 9; i++) {   // 수염 가닥: 턱선을 따라 아래로 모임
      const u = (i / 8) * 2 - 1, a = u * 1.2;
      const base = [Math.sin(a) * 0.07, 0.085 - (1 - Math.abs(u)) * 0.025, -Math.cos(a) * 0.072 - 0.025];
      const tip = [Math.sin(a) * 0.022, -0.075 - (1 - Math.abs(u)) * 0.045 - rnd() * 0.02, -0.085];
      Shapes.segment(b, base, tip, 0.03, 0.005, 7, hair, sm);
    }
  }
}

// 얼굴의 이목구비 (외곽선 없이 따로 그리는 모델 → 코 둘레에 검은 테가 생기지 않음)
//   눈: 아몬드꼴 흰자 + 큰 눈동자 + 동공 + 반짝임 둘 + 윗속눈썹 선 + 눈꼬리, 눈썹, 작은 코, 입(웃는 입은 곡선), 볼 홍조
function npcFeatures(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const c = (name) => () => P[name], e = L.eye || 1, sq = L.squint || 1, bt = L.browThick || 1, lash = L.lash || 1;
  const tilt = L.browTilt ?? 0.14;
  for (const sx of [-1, 1]) {
    const ex = sx * (0.04 + (e - 1) * 0.012), ey = 0.146;
    Shapes.icosphere(b, ch(T(ex, ey, -0.094), M4.rotationZ(sx * 0.1), S(0.027 * e, 0.02 * e * sq, 0.012)), 2, c('eyeWhite'), sm);
    Shapes.icosphere(b, ch(T(ex - sx * 0.003, ey - 0.002, -0.102), S(0.0155 * e, 0.02 * e * Math.min(1, sq + 0.1), 0.006)), 2, c('iris'), sm);
    Shapes.icosphere(b, ch(T(ex - sx * 0.003, ey, -0.106), S(0.007 * e, 0.0095 * e, 0.003)), 1, c('pupil'), sm);
    Shapes.icosphere(b, ch(T(ex - sx * 0.008, ey + 0.007 * e, -0.109), S(0.0055 * e, 0.0055 * e, 0.002)), 0, c('eyeWhite'), sm);
    Shapes.icosphere(b, ch(T(ex + sx * 0.002, ey - 0.009 * e, -0.108), S(0.003 * e, 0.003 * e, 0.0015)), 0, c('eyeWhite'), sm);
    const ly = ey + 0.0205 * e * sq;   // 윗속눈썹 선 + 눈꼬리 (속눈썹이 긴 사람은 더 굵고 바깥으로 살짝 치켜 올라감)
    Shapes.box(b, ch(T(ex + sx * 0.001, ly, -0.103), M4.rotationZ(sx * 0.14), S(0.062 * e, 0.0075 * lash, 0.012)), c('lash'));
    Shapes.box(b, ch(T(ex + sx * 0.032 * e, ly - 0.005, -0.097), M4.rotationZ(-sx * (lash > 1 ? -0.5 : 0.55)), S(0.016 * lash, 0.006 * lash, 0.008)), c('lash'));
    Shapes.box(b, ch(T(ex + sx * 0.002, ey - 0.018 * e * sq, -0.099), M4.rotationZ(-sx * 0.1), S(0.04 * e, 0.003, 0.006)), c('lash'));   // 아래 눈 선
    const by = 0.189 + (e - 1) * 0.03;
    if (L.hairStyle === 'bald') {   // 촌장: 흰 털이 수북한 눈썹 (바깥쪽이 처져 인자한 인상)
      Shapes.icosphere(b, ch(T(sx * 0.042, by + 0.002, -0.101), M4.rotationZ(sx * tilt), S(0.032, 0.013, 0.013)), 1, c('brow'), sm);
      Shapes.icosphere(b, ch(T(sx * 0.068, by - 0.008, -0.092), M4.rotationZ(sx * (tilt - 0.4)), S(0.016, 0.01, 0.011)), 1, c('brow'), sm);
    } else {
      Shapes.box(b, ch(T(sx * 0.044, by, -0.104), M4.rotationZ(sx * tilt), S(0.048, 0.0095 * bt, 0.01)), c('brow'));
    }
    if (L.blush) Shapes.icosphere(b, ch(T(sx * 0.06, 0.112, -0.086), M4.rotationY(-sx * 0.5), S(0.02, 0.011, 0.005)), 1, () => shadeCol(P.blush, 0.7 + 0.3 * L.blush), sm);
  }
  Shapes.icosphere(b, ch(T(0, 0.122, -0.108), S(0.006, 0.013, 0.008)), 1, c('nose'), sm);   // 코 (작게)
  if (L.hairStyle === 'bald') {   // 콧수염 (흰 털)
    for (const sx of [-1, 1]) Shapes.segment(b, [sx * 0.004, 0.106, -0.114], [sx * 0.048, 0.078, -0.098], 0.014, 0.004, 6, c('hair'), sm);
  }
  const my = 0.09, mz = -0.112;
  if (L.smile) {   // 웃는 입: 가운데 + 양 끝이 올라간 곡선
    Shapes.box(b, ch(T(0, my, mz), S(0.016, 0.0045, 0.004)), c('lip'));
    for (const sx of [-1, 1]) Shapes.box(b, ch(T(sx * 0.0125, my + 0.0028, mz + 0.0015), M4.rotationZ(sx * 0.5), S(0.012, 0.004, 0.004)), c('lip'));
  } else {
    Shapes.box(b, ch(T(0, my, mz), S(0.024, 0.0038, 0.004)), c('lip'));
  }
  b.bendNormals(0, [0, 0.3, -1], 0.6);
}

// 몸통 (허리 → 어깨) + 사람마다 옷 장식
function npcTorso(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true }, tz = L.torso || 1;
  const shirt = () => P.shirt, trim = () => P.trim;
  Shapes.cylinder(b, S(1, tz, 0.72), 0.16, 0.205, 0.46, 14, shirt, sm);
  Shapes.icosphere(b, ch(T(0, 0.44 * tz, 0), S(0.215, 0.085, 0.152)), 2, shirt, sm);   // 어깨
  Shapes.cylinder(b, ch(T(0, 0.45 * tz, 0), S(1, 1, 0.9)), 0.085, 0.072, 0.06, 12, trim, sm);   // 깃
  if (L.robe) {   // 촌장: 어깨를 덮는 짧은 망토(숄, 금빛 단) + 앞섶의 금빛 띠
    Shapes.box(b, ch(T(0, 0.15 * tz, -0.132), M4.rotationX(-0.08), S(0.04, 0.3 * tz, 0.02)), trim);
    Shapes.cylinder(b, ch(T(0, 0.33 * tz, 0.004), S(1, 1, 0.76)), 0.248, 0.22, 0.13 * tz, 18, () => P.shawl, { smooth: true, top: false });
    Shapes.icosphere(b, ch(T(0, 0.46 * tz, 0.004), S(0.22, 0.045, 0.168)), 2, () => P.shawl, sm);
    Shapes.cylinder(b, ch(T(0, 0.32 * tz, 0.004), S(1, 1, 0.76)), 0.252, 0.25, 0.026, 18, trim, sm);
    Shapes.icosphere(b, ch(T(0, 0.43 * tz, -0.175), S(0.03, 0.03, 0.015)), 1, () => P.buckle, sm);   // 숄을 여민 금 단추
  }
  if (L.apron) {   // 대장장이: 가죽 앞치마 윗판 + 어깨끈 + 주머니
    Shapes.box(b, ch(T(0, 0.2 * tz, -0.148), M4.rotationX(0.06), S(0.25, 0.36 * tz, 0.022)), () => P.apron);
    for (const sx of [-1, 1]) Shapes.box(b, ch(T(sx * 0.1, 0.41 * tz, -0.06), M4.rotationX(-1.0), S(0.03, 0.2, 0.012)), () => P.apron);
    Shapes.box(b, ch(T(0.05, 0.14 * tz, -0.163), S(0.1, 0.08, 0.012)), () => shadeCol(P.apron, 0.75));
  }
  if (L.scarf) {   // 목도리: 목둘레 (꼬리는 따로 흔들리는 tail 모델)
    Shapes.cylinder(b, ch(T(0, 0.39 * tz, 0), S(1, 1, 0.9)), 0.125, 0.1, 0.085, 14, () => P.scarf, sm);
  }
  if (!L.robe && !L.apron) {   // 앞 여밈: 짙은 띠 + 단추 셋
    Shapes.box(b, ch(T(0, 0.22 * tz, -0.132), M4.rotationX(-0.05), S(0.05, 0.3 * tz, 0.018)), trim);
    for (let i = 0; i < 3; i++) Shapes.icosphere(b, ch(T(0, (0.12 + i * 0.09) * tz, -0.143), S(0.012, 0.012, 0.008)), 1, () => P.buckle, sm);
  }
}

// 허리 아래 (옷자락·허리띠). 촌장은 발목까지 오는 긴 옷, 대장장이는 바지 + 앞치마 아랫단 + 허리에 찬 망치
function npcPelvis(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  if (L.robe) {
    Shapes.cylinder(b, ch(T(0, -0.8, 0), S(1, 1, 0.86)), 0.29, 0.185, 0.84, 14, () => P.shirt, sm);
    Shapes.cylinder(b, ch(T(0, -0.8, 0), S(1, 1, 0.86)), 0.295, 0.293, 0.045, 14, () => P.trim, sm);
    Shapes.cylinder(b, ch(T(0, -0.04, 0), S(1, 1, 0.8)), 0.195, 0.19, 0.08, 14, () => P.shawl, sm);   // 천 허리띠
    for (const sx of [-1, 1]) Shapes.box(b, ch(T(sx * 0.04, -0.22, -0.16), M4.rotationZ(sx * 0.08), S(0.05, 0.3, 0.015)), () => P.shawl);
  } else if (L.apron) {
    Shapes.cylinder(b, ch(T(0, -0.2, 0), S(1, 1, 0.8)), 0.175, 0.18, 0.24, 14, () => P.pants, sm);
    Shapes.box(b, ch(T(0, -0.25, -0.155), M4.rotationX(0.04), S(0.32, 0.5, 0.022)), () => P.apron);
    Shapes.cylinder(b, ch(T(0, -0.03, 0), S(1, 1, 0.8)), 0.188, 0.188, 0.06, 14, () => P.belt, sm);
    Shapes.segment(b, [0.18, -0.03, 0.02], [0.2, -0.24, 0.03], 0.014, 0.014, 5, () => P.wood);   // 망치
    Shapes.box(b, ch(T(0.2, -0.26, 0.03), S(0.05, 0.05, 0.12)), () => COLORS.iron);
  } else {
    const h = L.torso ? 0.27 : 0.34;   // 웃옷 자락 (아이는 짧게)
    Shapes.cylinder(b, ch(T(0, -h + 0.04, 0), S(1, 1, 0.85)), 0.24, 0.18, h, 14, () => P.shirt, sm);
    Shapes.cylinder(b, ch(T(0, -h + 0.03, 0), S(1, 1, 0.85)), 0.245, 0.243, 0.035, 14, () => P.trim, sm);
    Shapes.cylinder(b, ch(T(0, -0.035, 0), S(1, 1, 0.88)), 0.192, 0.19, 0.065, 14, () => P.belt, sm);
    Shapes.box(b, ch(T(0, -0.003, -0.168), S(0.05, 0.045, 0.014)), () => P.buckle);
  }
}

// 팔 (어깨 → 팔꿈치). 대장장이는 걷어 올린 소매
function npcArm(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true };
  const sleeve = () => P.shirt;
  Shapes.icosphere(b, ch(T(0, -0.01, 0), S(0.066, 0.07, 0.066)), 1, sleeve, sm);
  Shapes.cylinder(b, T(0, -0.26, 0), L.robe ? 0.068 : 0.05, 0.06, 0.26, 10, sleeve, sm);
  if (L.apron) Shapes.cylinder(b, T(0, -0.21, 0), 0.058, 0.056, 0.07, 10, () => shadeCol(P.shirt, 0.85), sm);   // 걷은 소매 단
}

// 아래팔 + 손 (엄지 포함)
function npcForearm(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true }, skin = () => P.skin;
  if (L.apron) {   // 맨팔 + 가죽 팔찌
    Shapes.cylinder(b, T(0, -0.24, 0), 0.04, 0.05, 0.24, 10, skin, sm);
    Shapes.cylinder(b, T(0, -0.21, 0), 0.047, 0.05, 0.07, 10, () => P.apron, sm);
  } else if (L.robe) {   // 넓은 소매 끝 + 금빛 테
    Shapes.cylinder(b, T(0, -0.22, 0), 0.075, 0.06, 0.22, 10, () => P.shirt, sm);
    Shapes.cylinder(b, T(0, -0.225, 0), 0.077, 0.076, 0.03, 10, () => P.trim, sm);
    Shapes.cylinder(b, T(0, -0.25, 0), 0.034, 0.036, 0.06, 8, skin, sm);
  } else {
    Shapes.cylinder(b, T(0, -0.23, 0), 0.042, 0.048, 0.23, 10, () => P.shirt, sm);
    Shapes.cylinder(b, T(0, -0.235, 0), 0.046, 0.046, 0.03, 10, () => P.trim, sm);
  }
  Shapes.box(b, ch(T(0, -0.29, 0), S(0.056, 0.085, 0.066)), skin);   // 손
  Shapes.segment(b, [0, -0.255, -0.03], [0, -0.3, -0.048], 0.016, 0.011, 6, skin, sm);   // 엄지
}

// 넓적다리 / 정강이 + 장화 (다리 길이 배율 legs)
function npcLeg(b, L, P) {
  const lg = 0.44 * (L.legs || 1);
  Shapes.cylinder(b, M4.translation(0, -lg, 0), 0.066, 0.082, lg, 10, () => P.pants, { smooth: true });
}
function npcShin(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true }, lg = 0.44 * (L.legs || 1), boot = () => P.boot;
  Shapes.cylinder(b, T(0, -lg * 0.55, 0), 0.06, 0.066, lg * 0.55, 10, () => P.pants, sm);
  Shapes.cylinder(b, T(0, -lg + 0.02, 0), 0.064, 0.068, lg * 0.5, 10, boot, sm);
  Shapes.cylinder(b, T(0, -lg * 0.5 - 0.01, 0), 0.074, 0.074, 0.04, 10, () => shadeCol(P.boot, 1.15), sm);   // 장화 목 접힌 단
  Shapes.icosphere(b, ch(T(0, -lg + 0.04, -0.065), S(0.062, 0.045, 0.11)), 1, boot, sm);   // 발등·코
  Shapes.box(b, ch(T(0, -lg + 0.008, -0.035), S(0.11, 0.022, 0.23)), () => P.sole);
}

// 밀짚모자: 살짝 처진 넓은 챙 + 둥근 꼭대기 + 붉은 띠 (짚 결은 면마다 밝기를 조금씩)
function npcHat(b, L, P, rnd) {
  const T = M4.translation, sm = { smooth: true }, straw = () => vary(P.straw, 0.16, rnd);
  Shapes.cylinder(b, T(0, 0.228, 0.01), 0.35, 0.16, 0.05, 20, straw, { smooth: true, bottom: true, bottomColor: () => P.strawDark, top: false });
  Shapes.cylinder(b, T(0, 0.25, 0.01), 0.15, 0.13, 0.12, 16, straw, sm);
  Shapes.icosphere(b, M4.chain(T(0, 0.37, 0.01), M4.scaling(0.13, 0.04, 0.13)), 1, straw, sm);
  Shapes.cylinder(b, T(0, 0.258, 0.01), 0.153, 0.149, 0.04, 16, () => P.ribbon, sm);
  for (const r of [0.31, 0.24]) Shapes.cylinder(b, T(0, 0.228 + ((0.35 - r) / 0.19) * 0.05 + 0.002, 0.01), r, r - 0.008, 0.004, 20, () => P.strawDark, { top: false });
}

// 목도리 꼬리: 목 뒤 매듭에서 두 갈래로 늘어짐 (따로 흔들림)
function npcTail(b, L, P) {
  const T = M4.translation, S = M4.scaling, ch = M4.chain, sm = { smooth: true }, sc = () => P.scarf;
  Shapes.icosphere(b, ch(T(0, 0, 0.012), S(0.045, 0.04, 0.035)), 1, sc, sm);
  for (const sx of [-1, 1]) {
    Shapes.box(b, ch(T(sx * 0.03, -0.12, 0.02), M4.rotationZ(sx * 0.12), M4.rotationX(-0.12), S(0.055, 0.22, 0.016)), sc);
    Shapes.box(b, ch(T(sx * 0.044, -0.24, 0.035), M4.rotationZ(sx * 0.12 + 0.785), S(0.04, 0.04, 0.016)), sc);
  }
}

// 지팡이 (촌장): 길이 1m 막대 (손에서 땅까지 늘려 그림) + 위쪽 구부러진 손잡이
function npcCane(b, L, P) {
  const wood = () => P.wood, sm = { smooth: true };
  Shapes.segment(b, [0, 0.02, 0], [0, -1, 0], 0.02, 0.016, 7, wood, sm);
  const pts = [[0, 0.02, 0], [0, 0.07, -0.015], [0, 0.085, -0.06], [0, 0.06, -0.09]];
  for (let i = 0; i + 1 < pts.length; i++) Shapes.segment(b, pts[i], pts[i + 1], 0.02, 0.02, 6, wood, sm);
  Shapes.cylinder(b, M4.translation(0, -1, 0), 0.02, 0.02, 0.05, 6, () => COLORS.iron, sm);
}

// 한 사람의 모델들: 이름 = 생김새 + 부분 (예: 'elderHead'). 머리·얼굴·눈꺼풀·모자는 아이처럼 머리가 큰 사람은 크게
function buildNpcLook(id, L) {
  const P = npcPalette(L), rnd = Utils.rng(id.length * 97 + id.charCodeAt(0));
  const make = (fn, big) => {
    const b = new MeshBuilder();
    fn(b, L, P, rnd);
    if (big && L.head) for (let i = 0; i < b.pos.length; i++) b.pos[i] *= L.head;
    return b;
  };
  const lids = (b) => {   // 눈꺼풀: 깜빡일 때만 위에서 아래로 내려옴
    const e = L.eye || 1;
    for (const sx of [-1, 1]) {
      Shapes.icosphere(b, M4.chain(M4.translation(sx * (0.04 + (e - 1) * 0.012), 0.147, -0.096), M4.rotationZ(sx * 0.1), M4.scaling(0.03 * e, 0.023 * e, 0.016)), 2, () => P.skin, { smooth: true });
    }
  };
  const out = {
    [id + 'Head']: make(npcHead, true), [id + 'Face']: make(npcFeatures, true), [id + 'Lids']: make(lids, true),
    [id + 'Torso']: make(npcTorso), [id + 'Pelvis']: make(npcPelvis), [id + 'Arm']: make(npcArm), [id + 'Forearm']: make(npcForearm),
    [id + 'Leg']: make(npcLeg), [id + 'Shin']: make(npcShin),
  };
  if (L.hat) out[id + 'Hat'] = make(npcHat, true);
  if (L.scarf) out[id + 'Tail'] = make(npcTail);
  if (L.cane) out[id + 'Cane'] = make(npcCane);
  return out;
}

// 관절: [이름, 부모, 부모 기준 위치, 모델] (키 약 1.75m, 다리·몸통 길이는 생김새마다). 원점 = 부모 기준 위치, 앞쪽은 -z
function npcRig(id, L) {
  const lg = 0.44 * (L.legs || 1), tz = L.torso || 1, m = (n) => id + n;
  return [
    ['hips', null, [0, 0.03 + lg * 2, 0], m('Pelvis')],
    ['spine', 'hips', [0, 0.04, 0], m('Torso')],
    ['head', 'spine', [0, 0.5 * tz, 0], m('Head')],
    ['face', 'head', [0, 0, 0], m('Face')],
    ['lids', 'head', [0, 0, 0], m('Lids')],
    ['hat', 'head', [0, 0, 0], L.hat ? m('Hat') : null],
    ['tail', 'spine', [0, 0.44 * tz, 0.1], L.scarf ? m('Tail') : null],
    ['shoulderR', 'spine', [0.21, 0.42 * tz, 0], m('Arm')],
    ['elbowR', 'shoulderR', [0, -0.26, 0], m('Forearm')],
    ['handR', 'elbowR', [0, -0.3, 0], null],
    ['shoulderL', 'spine', [-0.21, 0.42 * tz, 0], m('Arm')],
    ['elbowL', 'shoulderL', [0, -0.26, 0], m('Forearm')],
    ['hipR', 'hips', [0.1, -0.02, 0], m('Leg')],
    ['kneeR', 'hipR', [0, -lg, 0], m('Shin')],
    ['hipL', 'hips', [-0.1, -0.02, 0], m('Leg')],
    ['kneeL', 'hipL', [0, -lg, 0], m('Shin')],
  ];
}

// 사람마다 가만히 서 있을 때의 자세 (J: x 앞뒤 / y 비틂 / z 옆으로. 팔꿈치의 y는 굽히는 방향을 안쪽으로 돌림)
//   촌장: 허리를 조금 숙이고 오른손은 지팡이, 왼손은 뒷짐 · 대장장이: 팔짱 · 농부: 허리에 손 · 아이: 들썩들썩
const NPC_IDLE = {
  elder: { spine: J(-0.14), head: J(0.12), shoulderR: J(0.42, 0, 0.12), elbowR: J(0.5), shoulderL: J(-0.6, 0, -0.1), elbowL: J(1.3, -1.75) },
  smith: { shoulderR: J(0.5, 0, 0.15), elbowR: J(1.9, 1.3), shoulderL: J(0.45, 0, -0.15), elbowL: J(1.85, -1.35) },
  farmer: { shoulderR: J(-0.15, 0, 0.72), elbowR: J(1.55, 1.35), shoulderL: J(-0.15, 0, -0.72), elbowL: J(1.55, -1.35) },
  child: { shoulderR: J(0.1, 0, 0.25), elbowR: J(0.5), shoulderL: J(0.1, 0, -0.25), elbowL: J(0.5) },
};
const NPC_NO_OUTLINE = /(Face|Lids)$/;   // 이목구비는 외곽선 없이
const NPC_TINT = [1, 1, 1, 1];

// 마을 사람 하나: 집 근처를 거닐다가 전사가 다가오면 돌아서서 손을 흔들고 말을 걺
class Villager {
  constructor(def, x, z) {
    this.def = def;
    this.name = def.name;
    this.id = NPC_LOOKS[def.look] ? def.look : 'farmer';
    this.L = NPC_LOOKS[this.id];
    this.rig = Village.rigs[this.id];
    this.x = x;
    this.z = z;
    this.homeX = x;
    this.homeZ = z;
    this.radius = 0.35;
    this.scale = def.scale || 1;
    this.speed = 1.1 * (this.L.walk || 1);   // 걷는 빠르기 (아이는 뛰어다님)
    this.wander = this.id === 'child' ? 9 : 7;  // 집 둘레를 거니는 범위 (m)
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
    this.look = 0;          // 고개를 돌린 각도 (몸보다 먼저 전사 쪽으로)
    this.lookK = 0;
    this.blink = 0;
    this.blinkTimer = 1 + Math.random() * 3;
    this.tail = 0;          // 목도리 꼬리가 뒤로 날리는 정도 (용수철)
    this.tailVel = 0;
    this.wipe = 4 + Math.random() * 6;   // 농부가 이마의 땀을 닦기까지 남은 시간
    this.seed = Math.random();
    this.groundY = World.groundHeight(x, z);
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
    let lookTarget = 0;
    if (this.near) {   // 고개가 먼저 전사 쪽으로, 몸은 천천히 따라 돎. 처음 다가오면 손을 흔들고, 머물면 몇 초마다 다음 말
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
      this.facing += diff * Math.min(1, dt * 2);
      lookTarget = Utils.clamp(diff, -0.9, 0.9);
      this.vx -= this.vx * a;
      this.vz -= this.vz * a;
    } else {   // 집 근처를 어슬렁
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 3 + Math.random() * 5;
        for (let i = 0; i < 6; i++) {
          const tx = this.homeX + (Math.random() - 0.5) * this.wander, tz = this.homeZ + (Math.random() - 0.5) * this.wander;
          if (!World.blocked(tx, tz, 0.5)) {
            this.wx = tx;
            this.wz = tz;
            break;
          }
        }
      }
      const tx = this.wx - this.x, tz = this.wz - this.z, td = Math.hypot(tx, tz);
      if (td > 0.4) {
        const sp = this.speed;
        this.vx += ((tx / td) * sp - this.vx) * a;
        this.vz += ((tz / td) * sp - this.vz) * a;
        const target = Math.atan2(tz, tx), diff = Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing));
        this.facing += diff * Math.min(1, dt * 5);
      } else {
        this.vx -= this.vx * a;
        this.vz -= this.vz * a;
      }
    }
    this.look += (lookTarget - this.look) * Math.min(1, dt * 6);
    const bumped = World.moveEntity(this, this.vx * dt, this.vz * dt);
    if (bumped) this.timer = Math.min(this.timer, 0.3);   // 막히면 곧 다른 곳으로
    this.groundY += (World.groundHeight(this.x, this.z) - this.groundY) * Math.min(1, dt * 12);
    const speed = Math.hypot(this.vx, this.vz);
    this.walk += speed * dt * (this.id === 'child' ? 4.2 : 3.2);
    // 눈 깜빡임: 몇 초마다 한 번 (0.14초)
    this.blinkTimer -= dt;
    if (this.blinkTimer < -0.14) this.blinkTimer = 2 + Math.random() * 3.5;
    this.blink = this.blinkTimer < 0 ? Math.sin((-this.blinkTimer / 0.14) * Math.PI) : 0;
    // 목도리 꼬리: 걸으면 뒤로 날리고 용수철처럼 출렁임 (기사의 뒷머리와 같은 방식)
    const tailTarget = (speed / this.speed) * 0.7 + Math.sin(time * 2.6 + this.seed * 5) * 0.06;
    this.tailVel += ((tailTarget - this.tail) * 70 - this.tailVel * 9) * dt;
    this.tail += this.tailVel * dt;
    this.wipe -= dt;
    if (this.wipe < -1.2) this.wipe = 7 + Math.random() * 3;
  }

  // 그리기용 부분 목록에 더함
  parts(out, time) {
    const L = this.L, amt = Utils.clamp(Math.hypot(this.vx, this.vz) / this.speed, 0, 1), idle = 1 - amt;
    const s = Math.sin(this.walk), co = Math.cos(this.walk), breathe = Math.sin(time * 1.6 + this.seed * 9) * 0.025;
    const swing = this.id === 'elder' ? 0.6 : 1;   // 촌장은 걸음이 작음
    const pose = {
      hips: J(0, s * 0.08 * amt, Math.sin(time * 0.6 + this.seed * 4) * 0.03 * idle),   // 가만히 있으면 천천히 무게를 옮겨 실음
      spine: J(-0.04 * amt + breathe, -s * 0.08 * amt),
      head: J(Math.sin(time * 1.1 + this.seed * 5) * 0.05 - breathe, Math.sin(time * 0.7 + this.seed * 3) * 0.2 * idle * (1 - Math.min(1, Math.abs(this.look) * 3))),
      hipR: J(s * 0.6 * amt * swing), kneeR: J(-(0.05 + Math.max(0, co) * 0.9 * amt * swing)),
      hipL: J(-s * 0.6 * amt * swing), kneeL: J(-(0.05 + Math.max(0, -co) * 0.9 * amt * swing)),
      shoulderR: J(-s * 0.4 * amt + 0.1, 0, 0.12), elbowR: J(0.35),
      shoulderL: J(s * 0.4 * amt + 0.1, 0, -0.12), elbowL: J(0.35),
      tail: J(-this.tail, 0, Math.sin(time * 1.9 + this.seed * 3) * 0.05),
    };
    const elder = this.id === 'elder', R = elder ? 'L' : 'R', side = elder ? -1 : 1;   // 촌장은 오른손에 지팡이 → 왼손으로 손짓
    const wk = this.wave > 0 ? Math.min(1, this.wave * 4) * Math.min(1, (1.6 - this.wave) * 4) : 0;
    const idlePose = NPC_IDLE[this.id];
    if (idlePose) blendPose(pose, idlePose, idle);
    if (this.id === 'farmer' && !this.near && this.wipe < 0) {   // 농부: 가끔 이마의 땀을 닦음
      const k = Math.sin(Math.PI * Utils.clamp(-this.wipe / 1.2, 0, 1)) * idle;
      blendPose(pose, { shoulderR: J(2.0, 0, 0.35), elbowR: J(2.1, 0.9), head: J(-0.1, -0.15) }, k);
    }
    if (this.near) {   // 말을 시작할 때: 고개를 끄덕이며 손을 들어 손짓
      const k = Math.max(0, 1 - this.lineTimer / 1.2), g = Math.sin(Math.PI * Math.min(1, this.lineTimer / 1.2)) * Math.min(1, k * 4);
      pose.head = J(pose.head.x + Math.sin(this.lineTimer * 10) * 0.06 * k, pose.head.y, pose.head.z);
      blendPose(pose, { ['shoulder' + R]: J(0.9, 0, side * 0.3), ['elbow' + R]: J(1.1, side * 0.4) }, g * (1 - wk));
    }
    if (wk > 0) blendPose(pose, { ['shoulder' + R]: J(2.7 + Math.sin(time * 9) * 0.3, 0, side * 0.5), ['elbow' + R]: J(0.5) }, wk);   // 손 흔들기
    pose.head = J(pose.head.x, pose.head.y - this.look * 0.8, pose.head.z);   // 고개를 전사 쪽으로
    let hy = 0.03 + 0.88 * (L.legs || 1) - 0.02 * amt + Math.abs(co) * 0.04 * amt;
    if (this.id === 'child') hy += Math.abs(Math.sin(time * (this.near ? 7 : 3.5) + this.seed * 5)) * (this.near ? 0.05 : 0.012) * idle;   // 아이: 신나서 깡충깡충
    const root = M4.chain(M4.translation(this.x, this.groundY, this.z), M4.rotationY(-this.facing - Math.PI / 2), M4.scaling(this.scale, this.scale, this.scale));
    const { out: list, W } = rigMatrices(this.rig, root, pose, { hips: hy });
    const lidY = NPC_LID_Y * (L.head || 1);
    for (const part of list) {
      let m = part.m;
      if (part.mesh.endsWith('Lids')) {   // 눈꺼풀: 깜빡일 때만 위에서 아래로 늘어나며 덮음
        if (this.blink < 0.05) continue;
        m = M4.chain(m, M4.translation(0, lidY, 0), M4.scaling(1, this.blink, 1), M4.translation(0, -lidY, 0));
      }
      out.push({ mesh: part.mesh, m, flash: 0, tint: NPC_TINT, noOutline: NPC_NO_OUTLINE.test(part.mesh) });
    }
    if (L.cane) {   // 지팡이: 오른손에서 땅까지 곧게
      const h = M4.transformPoint(W.handR, [0, 0, 0]), len = Math.max(0.2, h[1] - this.groundY + 0.01);
      out.push({ mesh: this.id + 'Cane', m: M4.chain(M4.translation(h[0], h[1], h[2]), M4.rotationY(-this.facing - Math.PI / 2), M4.scaling(this.scale, len, this.scale)), flash: 0, tint: NPC_TINT });
    }
  }
}

// 굴뚝 연기 뭉치: particles.js의 연기(SMOKE) 점을 빌려 쓰되, 매 화면 particles.js가 계산하기 직전에 값을 맞춰 둠
// (particles.js는 투명도 = 0.8 x 남은 생명 / maxLife, 크기 += 1.2 x dt로 바꾸므로, 그 결과가 원하는 값이 되도록 maxLife·크기·속도를 미리 정함)
const SMOKE_WIND = V3.normalize([0.85, 0, 0.5]);   // 풀밭 바람과 같은 쪽으로 흘러감
function smokeStep(q, dt, day) {
  const v = CONFIG.village, age = q.age + dt, k = Utils.clamp(age / q.span, 0, 1);
  q.color[0] = q.color[1] = 0.8 * day;   // 색은 지금 시각을 따라감 (밤이 되면 이미 피어오른 연기도 어두워짐)
  q.color[2] = 0.84 * day;
  const alpha = v.smokeAlpha * Utils.smooth(Math.min(1, age / 0.6)) * (1 - k);
  q.age = age;
  q.maxLife = (0.8 * Math.max(q.life - dt, 0)) / Math.max(alpha, 1e-4);
  q.size = v.smokeSize + v.smokeGrow * age - 1.2 * dt;
  const drift = 0.25 + 0.55 * k, rise = v.smokeRise * (1 - 0.65 * k);
  q.vx = SMOKE_WIND[0] * drift + Math.sin(age * 1.3 + q.seed * 9) * 0.05;
  q.vy = rise;
  q.vz = SMOKE_WIND[2] * drift + Math.cos(age * 1.1 + q.seed * 7) * 0.05;
}

const Village = {
  list: [],     // 이 구역의 마을 사람들
  rigs: {},     // 생김새 → 관절 목록
  smoke: [],    // 지금 피어오르는 굴뚝 연기 뭉치
  chimneys: [], // 이 구역의 굴뚝 [{ x, y, z, t }]

  // 소품 모델을 Models에 더함 (Models.build 다음에). 새 모델의 그리기 설정은 map.js의 PROP_STYLE에 더함
  build() {
    const S = HOUSE_STYLES;
    Models.house = buildHouse(Utils.rng(61), 4, 4, S[0]);
    Models.houseC = buildHouse(Utils.rng(70), 4, 4, S[1], true);
    Models.houseB = buildHouse(Utils.rng(62), 6, 4, S[2]);
    Models.houseD = buildHouse(Utils.rng(71), 6, 4, S[3], true);
    Models.fence = buildFence(Utils.rng(63));
    Models.well = buildWell(Utils.rng(64));
    Models.lantern = buildLantern(Utils.rng(65));
    Models.campfire = buildCampfire(Utils.rng(66));
    Models.crate = buildCrate(Utils.rng(67));
    Models.barrel = buildBarrel(Utils.rng(68));
    Models.hay = buildHay(Utils.rng(69));
    Models.stall = buildStall(Utils.rng(72));
    Models.banner = buildBanner(Utils.rng(73), '#4a6a96', '#2e3e5e');
    Models.bannerB = buildBanner(Utils.rng(74), '#a8503e', '#5e2a22');
    Models.sign = buildSign(Utils.rng(75));
    Models.laundry = buildLaundry(Utils.rng(76));
    Models.flagstone = buildFlagstone(Utils.rng(77));
    Object.assign(PROP_STYLE, {
      houseC: { ao: 3, rim: 0.2 }, houseD: { ao: 3, rim: 0.2 },
      stall: { ao: 1.5, rim: 0.2, dist: 90 }, banner: { rim: 0.2, dist: 120 }, bannerB: { rim: 0.2, dist: 120 },
      sign: { rim: 0.2, dist: 70 }, laundry: { rim: 0.2, dist: 70 }, flagstone: { dist: 45 },
    });
  },

  // 마을 사람 모델 (Enemies.models에 합쳐져 같은 방식으로 그려짐)
  npcModels() {
    const out = {};
    for (const id in NPC_LOOKS) {
      Object.assign(out, buildNpcLook(id, NPC_LOOKS[id]));
      this.rigs[id] = npcRig(id, NPC_LOOKS[id]);
    }
    return out;
  },

  // 구역을 불러올 때: levels.js의 npcs 자리에 마을 사람 배치 (소품에 막힌 자리면 가까운 빈 곳으로), 번팅·굴뚝 준비
  spawn(level) {
    this.list = (level.npcs || []).map((def) => {
      let x = (def.cell[0] + 0.5) * CELL, z = (def.cell[1] + 0.5) * CELL;
      for (let r = 0.5; r < 4 && World.blocked(x, z, 0.4); r += 0.5) {
        for (let k = 0; k < 8; k++) {
          const nx = x + Math.cos((k / 8) * 6.283) * r, nz = z + Math.sin((k / 8) * 6.283) * r;
          if (!World.blocked(nx, nz, 0.4)) { x = nx; z = nz; break; }
        }
      }
      return new Villager(def, x, z);
    });
    const V = World.village && World.village.lights === World.lights ? World.village : null;   // 이번 구역의 마을 정보 (map.js)
    this.chimneys = V ? V.chimneys.map(([x, y, z]) => ({ x, y, z, t: Math.random() })) : [];
    this.smoke = [];
    if (V && V.lanterns.length > 1) {
      const a = World.start.angle, b = buildBunting(V.lanterns, World.start.x - Math.cos(a) * 3.6, World.start.z - Math.sin(a) * 3.6);
      if (b) World.meshes.push({ mesh: GL.createMesh(b), cull: true, shadow: false, ao: 0, rim: 0.2 });
    }
  },

  update(dt, p, time) {
    for (const v of this.list) v.update(dt, p, time);
    // 전사와 겹치지 않게
    for (const v of this.list) {
      const dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz), min = v.radius + p.radius;
      if (d < min && d > 0.001) World.moveEntity(p, (dx / d) * (min - d), (dz / d) * (min - d));
    }
    this.updateSmoke(dt, p);
  },

  // 굴뚝 연기: 가까운 굴뚝에서 옅은 연기 뭉치가 피어올라 바람 쪽으로 흘러가며 커지고 옅어짐 (낮엔 연한 회색 → 밝은 하늘 앞에서도 보임, 밤엔 어둡게)
  updateSmoke(dt, p) {
    const v = CONFIG.village;
    let live = 0;   // 다 사라진 연기 뭉치는 목록에서 뺌 (매 화면 새 배열을 만들지 않게 제자리에서)
    for (const q of this.smoke) if (q.life > 0) this.smoke[live++] = q;
    this.smoke.length = live;
    const day = 1 - 0.75 * (Atmos.night || 0);   // 낮엔 하얀 회색, 밤엔 어둡게
    if (CONFIG.graphics.life && v.smokeRate > 0) {
      for (const c of this.chimneys) {
        if (Math.hypot(c.x - p.x, c.z - p.z) > v.smokeDist) continue;
        c.t -= dt;
        if (c.t > 0) continue;
        c.t = (0.6 + Math.random() * 0.8) / v.smokeRate;
        const span = v.smokeLife * (0.8 + Math.random() * 0.4), n = Particles.list.length;
        const q = { type: FX.SMOKE, x: c.x + (Math.random() - 0.5) * 0.1, y: c.y, z: c.z + (Math.random() - 0.5) * 0.1, vx: 0, vy: 0, vz: 0,
          life: span, maxLife: span, size: v.smokeSize, seed: Math.random(), color: [0.8 * day, 0.8 * day, 0.84 * day], alpha: 0, age: 0, span };
        Particles.spawn(q);
        if (Particles.list.length > n) this.smoke.push(q);
      }
    }
    for (const q of this.smoke) smokeStep(q, dt, day);
  },
  // 마을 사람 그리기: enemies.js의 Enemies.parts가 Village.list를 돌며 v.parts를 부름 (적과 같은 거리 규칙 CONFIG.graphics.actorDist)
};
