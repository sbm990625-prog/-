// 구역(맵)을 읽어 3D 세계로 만들기: 지형·나무·연못·출구, 충돌 판정
// 맵 데이터는 levels.js에 있습니다.

const CELL = 2;     // 맵 한 칸의 크기 (m)
const MARGIN = 5;   // 맵 바깥에 둘러 심는 숲의 두께 (칸)

// 땅 색 (선형 RGB)
const GROUND = {
  grass: Utils.color('#62864a'),     // 볕 받으면 파스텔 연두가 되는 풀밭
  grassDry: Utils.color('#7a8d4e'),  // 마른 풀 얼룩 (노르스름한 올리브)
  forest: Utils.color('#4f5a34'),    // 숲 바닥 (검지 않은 짙은 올리브, 먼 들판도 이 색)
  dirt: Utils.color('#7d6e55'),      // 흙길 (볕 받으면 밝은 베이지빛)
  mud: Utils.color('#4a4236'),
  cobble: Utils.color('#7f7d78'),    // 마을 광장·골목 돌바닥 (셰이더가 둥근 돌과 줄눈을 그림. 휴대폰은 이 색만)
};
// 동굴 바닥 색 (위와 같은 이름: 바닥·마른 바닥·벽 밑·길·젖은 곳)
const CAVE_GROUND = {
  grass: Utils.color('#5e5850'),
  grassDry: Utils.color('#6f675a'),
  forest: Utils.color('#2a2623'),
  dirt: Utils.color('#7d6c52'),
  mud: Utils.color('#34302b'),
  cobble: Utils.color('#6f675a'),
};
// ---------- 오픈월드: 구역마다 다른 땅 ----------
// 구역(levels.js의 zones) 이름 순서. World.biomeAt(x, z)가 이 이름들로 '그 자리가 각 구역에 속한 정도'(합 1)를 알려 줌
const BIOME_IDS = ['village', 'meadow', 'woods', 'marsh', 'hills'];
// 구역별 땅 색: grass 풀밭, grassDry 마른 풀 얼룩, forest 숲 바닥 (먼 들판도 이 색)
//   gold: 밀짚빛 마른 풀밭이 생기는 양의 배율 (render.js LIGHTING.forest.gold와 곱함. 마을 안은 0)
const BIOMES = {
  village: { grass: '#62864a', grassDry: '#6f8c4c', forest: '#4f5a34', gold: 0 },      // 마을: 가꾼 푸른 잔디 (노르스름한 마른 풀 얼룩 없이)
  meadow: { grass: '#64984a', grassDry: '#8ea454', forest: '#52663a', gold: 0.6 },    // 동쪽 초원: 밝고 싱그러운 연두 + 옅은 밀짚빛 얼룩 (꽃밭이 돋보이게 금빛은 조금만)
  woods: { grass: '#485e33', grassDry: '#565d35', forest: '#323f26', gold: 0.08 },   // 북쪽 숲: 짙은 이끼빛 숲 바닥 (나무 밑은 더 어둡게)
  marsh: { grass: '#566a3e', grassDry: '#62633e', forest: '#3d4630', gold: 0 },      // 남쪽 늪지: 어두운 올리브 (물가는 진흙과 물이끼)
  hills: { grass: '#7b8a58', grassDry: '#9f9a62', forest: '#58644a', gold: 1.5 },    // 서쪽 바위 언덕: 마른 세이지·황토빛, 마른 풀이 많음
};
const BIOME_PAL = BIOME_IDS.map((id) => ({ grass: Utils.color(BIOMES[id].grass), dry: Utils.color(BIOMES[id].grassDry), forest: Utils.color(BIOMES[id].forest), gold: BIOMES[id].gold }));
const TERRAIN_COLORS = {
  rock: Utils.color('#8a8577'),    // 언덕 비탈의 드러난 바위 (셰이더가 바위 결·이끼를 그림)
  scree: Utils.color('#a09a86'),   // 바위 턱 아래 흘러내린 자갈 비탈
  algae: Utils.color('#3e5229'),   // 늪 물가의 물이끼
  marshMud: Utils.color('#463e2e'), // 늪 웅덩이 바닥 진흙
};
// 지형 모양 (큰 숫자는 config.js의 world: 물 높이·언덕 높이·계단 높이·오를 수 있는 비탈)
const TERRAIN = {
  feather: 7,       // 구역 경계를 섞는 너비 (m, 경계 양쪽으로)
  warp: 8,          // 경계선을 구불구불하게 흔드는 정도 (m, 곧은 줄이 보이지 않게)
  stepFlat: 0.22,   // 언덕 계단에서 평평한 단이 차지하는 비율 (클수록 단은 넓고 턱은 가파름)
  pondBasin: 9,     // 연못 둘레가 완만하게 우묵해지는 거리 (m, 연못이 구덩이처럼 보이지 않게)
  roadBlur: 5,      // 흙길 높이를 이만큼(m) 앞뒤의 길 높이와 평균해 완만하게 (구역 경계를 넘는 길도 가파르지 않게)
  hillKnoll: 1.8,   // 언덕 구역의 숲 덩어리(#) 밑을 이만큼(m) 높여 바위 둔덕으로
};
// 구역별 땅 높이 (m). b: 공통 완만한 물결(-1.2~1.2), road: 흙길인 정도(0~1, 길은 평평하게), wl: 물 높이
const BIOME_HEIGHT = [
  (x, z, b) => 0.1 + b * 0.25,                                                        // 마을: 거의 평평한 터
  (x, z, b, road, wl, W) => 0.75 + (Utils.fbm2(x * 0.028 + 5, z * 0.028 + 2, 2) - 0.5) * 3.2 + W.ringRise(x, z),   // 초원: 1~2m 높이로 완만하게 너울짐 (선돌 고리는 둔덕 위)
  (x, z, b) => 0.65 + b * 1.1,                                                         // 숲: 조금 높은 땅이 완만하게 출렁임
  (x, z, b, road, wl, W) => {                                                          // 늪: 수면 바로 위아래 → 얕은 웅덩이가 여기저기
    let h = wl + 0.06 + (Utils.fbm2(x * 0.11 + 1, z * 0.11 + 4, 3) - 0.5) * 1.1 + (Utils.fbm2(x * 0.03 + 7, z * 0.03 - 2, 2) - 0.5) * 0.7;
    h += 0.5 * W.blend(x, z, (c) => c === '#' || c === 'T' || c === 'b');            // 숲 덩어리·나무·덤불 밑은 물 위 둔덕
    return Utils.lerp(h, wl - 0.3, road * 0.9);                                       // 흙길은 늪으로 내려가며 발목까지 잠기는 진흙 길
  },
  (x, z, b, road, wl, W) => {                                                          // 언덕: 계단처럼 층진 바위 고원
    const cw = CONFIG.world;
    const n = Utils.fbm2(x * 0.045 + 11, z * 0.045 - 7, 4);
    const ridge = 1 - Math.abs(2 * n - 1);                                             // 능선 (0~1)
    const west = Utils.smooth((26 - x) / 40);                                          // 서쪽 끝으로 갈수록 높아지는 고원
    let h = 0.6 + (cw.hillHeight - 0.6) * Math.min(1, 0.8 * Math.pow(ridge, 1.5) + 0.35 * west);
    h += TERRAIN.hillKnoll * W.blend(x, z, isForestCell);                             // 숲 덩어리 밑은 바위 둔덕 (나무가 바위 언덕 위에 섬)
    const s = cw.hillStep, t = h / s, f = t - Math.floor(t), a = TERRAIN.stepFlat;
    h = (Math.floor(t) + Utils.smooth((f - a) / (1 - 2 * a))) * s;                    // 평평한 단 + 바위 턱
    return Utils.lerp(h, 0.8 + 1.6 * n, road * 0.85);                                  // 길은 낮고 평평하게 깎음
  },
];
const NO_WATER_BOX = { min: [0, -1e6, 0], max: [0, -1e6, 0] };   // 어디에도 보이지 않는 상자 (가까이 보이는 물이 없을 때)
const isPondCell = (c) => c === '~';
const isRoadCell = (c) => c === ':';
const isForestCell = (c) => c === '#';
const isHouseCell = (c) => c === 'h';

const CRYSTAL_TINTS = [[0.45, 0.95, 1.25], [0.95, 0.55, 1.3]];   // 수정 색: 하늘빛 / 보랏빛 (빛 색도 같음)
const TORCH_LIGHT = [2.6, 1.2, 0.42];                           // 횃불 빛 (주황)
const FLOWER_COLORS = [[1, 1, 1], [1, 0.8, 0.15], [1, 0.4, 0.6], [0.42, 0.3, 1.15], [0.14, 0.26, 1.2]];
// 파란 들꽃 (수레국화 파랑 / 연보랏빛). 꽃잎이 흰색이라 햇빛에 하얗게 바래지 않도록 아주 진하게 곱함
const BLUE_FLOWERS = [[0.08, 0.18, 1.2], [0.25, 0.2, 1.2]];

// ---------- 구역별 풍경 (오픈월드 바람골 들판) ----------
// 초원 꽃밭 색 (꽃잎이 흰색이라 곱하는 색): 분홍·흰색·노랑·연보라·파랑. 꽃밭마다 한 가지 색이 주인공 (render.js가 셰이더에도 넘겨 먼 곳 꽃 점 색으로 씀)
const MEADOW_FLOWERS = [[0.95, 0.25, 0.45], [1, 1, 0.95], [1, 0.7, 0.05], [0.55, 0.28, 1.1], [0.1, 0.2, 1.2]];
const DRESS = {
  woodsTree: 0.35,         // 북쪽 숲 나무를 이만큼 더 크게 (숲 한가운데에서 1.35배)
  woodsExtra: [1, 0.85],   // 북쪽 숲 벽에 더 심는 나무 (칸마다 [가장자리, 안쪽] 확률. 휴대폰은 config.js wallDensity를 곱함)
  woodsThin: 0.5,          // 북쪽 숲 바닥의 풀을 이만큼 솎음 (이끼 낀 어두운 바닥·낙엽·고사리가 보이게)
  carpet: [0.09, 0.42, 4],     // 초원 꽃밭 얼룩: 무늬 크기(작을수록 큰 꽃밭) · 시작 값 · 진해지는 빠르기
  carpetClumps: 9,         // 꽃밭 한가운데 칸(2x2m)에 놓는 꽃 무더기 수 (무더기 하나 = 꽃 7송이)
  plazaRadius: 7.5,        // 마을 우물 둘레 돌바닥 반지름 (m)
  lawnThin: 0.3,           // 마을 잔디는 풀을 이만큼 솎음 (가꾼 잔디처럼 고르고 낮게)
  lawnCut: 0.4,            // 마을 잔디 풀 키를 이만큼 줄임
  ringRadius: 3.5,         // 초원 선돌 고리 반지름 (m)
  ringRise: 1.2,           // 선돌 고리가 올라앉은 둔덕 높이 (m)
};
const TREE_COLLIDER = { oakA: 0.5, oakB: 0.5, willow: 0.5 };   // 나무 한 그루(T)의 충돌 반지름 (없으면 0.4)

// 모델별 그리기 설정
//   thin: 얇은 잎(양면, 그림자 없음)  grass: 바람 물결·전사 주변에서 눕기  ao: 밑동을 어둡게 할 높이(m)  rim: 윤곽 빛
//   dist: 이보다 먼 구역은 그리지 않음(m, 작은 것들은 멀면 어차피 안 보임)
//   lod: 풀 거리·생략 거리를 config.js의 grassDist·grassLod로 (먼 구역은 풀잎 절반만)
const PROP_STYLE = {
  pineA: { ao: 2.5, rim: 0.4 }, pineB: { ao: 2.5, rim: 0.4 }, oakA: { ao: 2.5, rim: 0.4 }, oakB: { ao: 2.5, rim: 0.4 },
  birch: { ao: 2.5, rim: 0.4 }, bush: { ao: 1, rim: 0.3 }, rock: { ao: 1.2, rim: 0.3 }, log: { rim: 0.2, dist: 60 },
  mushroom: { rim: 0.3, dist: 35 }, grass: { thin: true, grass: true, dist: 50, lod: true }, grassGold: { thin: true, grass: true, dist: 50, lod: true }, flower: { thin: true, grass: true, dist: 40 },
  fern: { thin: true, grass: true, dist: 50 }, reeds: { thin: true, grass: true, dist: 60 }, lily: { thin: true, dist: 60 },
  pebbles: { rim: 0.2, dist: 30 }, litter: { thin: true, dist: 40 }, ruin: { ao: 2, rim: 0.3 }, gate: { rim: 0.3 },
  cliffRock: { ao: 4, rim: 0.15 }, stalagmite: { ao: 1.5, rim: 0.2 }, stalactite: { rim: 0.1 }, crystal: { rim: 0.3 },
  torch: { rim: 0.2 }, glowShroom: { dist: 40 }, vines: { thin: true, dist: 60 },
  // 구역별 풍경 (오픈월드): 언덕 바위 더미·휜 소나무, 늪 버드나무·죽은 나무, 초원 꽃 무더기·선돌
  crag: { ao: 3, rim: 0.25 }, cragB: { ao: 2.5, rim: 0.25 }, windPine: { ao: 2.5, rim: 0.4 }, willow: { ao: 2.5, rim: 0.4 }, deadTree: { ao: 2.5, rim: 0.4 },
  flowerClump: { thin: true, grass: true, dist: 45 }, standingStone: { ao: 2, rim: 0.25 }, stoneLintel: { rim: 0.25 },
  // 마을 (village.js의 모델)
  house: { ao: 3, rim: 0.2 }, houseB: { ao: 3, rim: 0.2 }, fence: { rim: 0.2, dist: 80 }, well: { ao: 1.5, rim: 0.2 },
  lantern: { rim: 0.2, dist: 90 }, campfire: { rim: 0.2, dist: 70 }, crate: { ao: 1, rim: 0.2, dist: 70 }, barrel: { ao: 1, rim: 0.2, dist: 70 }, hay: { ao: 1, rim: 0.2, dist: 70 },
};
const CHUNK = 12;   // 화면 밖 건너뛰기를 위한 구역 크기 (m)

// 모델이 차지하는 범위: 가로 반지름, 아래·위 높이
function extentOf(b) {
  let r = 0, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < b.pos.length; i += 3) {
    const k = b.ofs ? b.ofs[i + 2] * 0.71 : 0;   // 카메라를 향한 잎 판은 가운데에서 이만큼 펼쳐짐
    r = Math.max(r, Math.hypot(b.pos[i], b.pos[i + 2]) + k);
    y0 = Math.min(y0, b.pos[i + 1] - k);
    y1 = Math.max(y1, b.pos[i + 1] + k);
  }
  return { r, y0, y1 };
}

// 풀 포기마다 정해진 0~1 난수 (포기마다 사라지는 거리가 다르게). 위치(x, z)의 숫자 비트로 만들어서
// 셰이더(shaders.js의 tuftRand)와 똑같은 값이 나옴 → 먼 구역에서 이미 땅으로 줄어든 포기는 아예 그리지 않고 건너뛸 수 있음
const _tuftF = new Float32Array(2), _tuftU = new Uint32Array(_tuftF.buffer);
function tuftRand(x, z) {
  _tuftF[0] = x;
  _tuftF[1] = z;
  let h = (Math.imul(_tuftU[0], 0x9E3779B1) ^ Math.imul(_tuftU[1], 0x85EBCA77)) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 0x2C1B3C6D) >>> 0;
  h = (h ^ (h >>> 12)) >>> 0;
  return (h >>> 8) / 16777216;
}

// 그림자 지도용 모델: 카메라를 향해 세우는 잎 판을 뺀 것 (그 판은 원래 그림자를 만들지 않음: shaders.js shadowVS)
// 그림자는 똑같고, 그림자를 그릴 때 정점 계산만 줄어듦. 그런 잎 판이 없는 모델이면 null
function shadowModel(b) {
  if (!b.ofs || !b.ofs.length) return null;
  const keep = [];
  for (let t = 0; t < b.pos.length / 9; t++) {
    if (!(b.ofs[t * 9 + 2] > 0 || b.ofs[t * 9 + 5] > 0 || b.ofs[t * 9 + 8] > 0)) keep.push(t);
  }
  if (keep.length * 9 === b.pos.length) return null;
  const pick = (arr, n) => {
    const out = [];
    for (const t of keep) for (let k = t * 3 * n; k < (t + 1) * 3 * n; k++) out.push(arr[k]);
    return out;
  };
  return { pos: pick(b.pos, 3), nrm: pick(b.nrm, 3), col: pick(b.col, 4), wind: pick(b.wind, 1), uv: pick(b.uv, 2), ofs: [] };
}

// 인스턴스를 구역별로 묶고, 구역마다 감싸는 상자를 계산
// 구역은 북→남, 서→동 차례로 늘어놓음: 화면에 나란히 보이는 구역들이 데이터에서도 붙어 있어 한 번에 묶어 그릴 수 있음 (GL.drawMesh)
// fade: 풀처럼 멀어지면 포기마다 사라지는 것. 구역 안에서 늦게 사라지는 포기부터 늘어놓고 그 난수를 part.fade에 둠
//   → 먼 구역은 앞에서부터 아직 보이는 포기만 그림 (render.js drawWorld)
function groupByChunk(arr, ext, fade) {
  const groups = new Map();
  for (let i = 0; i < arr.length; i += 8) {
    const cx = Math.floor(arr[i] / CHUNK), cz = Math.floor(arr[i + 2] / CHUNK), key = cx + ',' + cz;
    if (!groups.has(key)) groups.set(key, { cx, cz, idxs: [] });
    groups.get(key).idxs.push(i);
  }
  const order = [...groups.values()].sort((a, b) => a.cz - b.cz || a.cx - b.cx);
  const sorted = [], parts = [];
  for (const { idxs } of order) {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const start = sorted.length / 8;
    let rs = null;
    if (fade) {
      const r = new Map(idxs.map((i) => [i, tuftRand(arr[i], arr[i + 2])]));
      idxs.sort((a, b) => r.get(b) - r.get(a));
      rs = Float32Array.from(idxs, (i) => r.get(i));
    }
    for (const i of idxs) {
      for (let k = 0; k < 8; k++) sorted.push(arr[i + k]);
      const s = arr[i + 4], r = ext.r * s + 0.5;
      min[0] = Math.min(min[0], arr[i] - r); max[0] = Math.max(max[0], arr[i] + r);
      min[2] = Math.min(min[2], arr[i + 2] - r); max[2] = Math.max(max[2], arr[i + 2] + r);
      min[1] = Math.min(min[1], arr[i + 1] + ext.y0 * s - 0.5); max[1] = Math.max(max[1], arr[i + 1] + ext.y1 * s + 0.5);
    }
    parts.push({ start, count: idxs.length, box: { min, max }, fade: rs });
  }
  return { sorted, parts };
}

const World = {
  level: null,
  data: [],
  cols: 0,
  rows: 0,
  waterLevel: null,  // 연못 수면 높이 (연못이 없으면 null)
  colliders: {},     // '칸x,칸z' → 둥근 장애물 [{ x, z, r }]
  meshes: [],        // 그래픽 카드에 올린 모델 [{ mesh, cull, shadow, ground, ao, grass, rim, fog }]
  water: null,       // 연못 물 모델
  trees: [],         // 나무 잎 위치 [x, 높이, z, 반지름] (낙엽이 떨어지는 곳)
  flowerSpots: [],   // 꽃 위치 [x, y, z] (나비가 노는 곳)
  gate: null,        // 출구 { x, y, z, dx, dz(통로 방향), px, pz(기둥 방향) }
  gateOpen: false,   // 적을 모두 물리치면 true
  barrierFade: 1,    // 마법 장벽의 진하기 (1 → 0으로 사라짐)
  barrier: null,     // 장벽 모델
  pillar: null,      // 열린 출구의 빛기둥 모델
  start: { x: 0, z: 0, angle: 0 },
  cave: false,       // 동굴 구역인지 (바위 벽·천장, 횃불·수정 빛)
  pal: GROUND,       // 땅 색 (숲 / 동굴)
  lights: [],        // 주변을 비추는 빛 [{ x, y, z, r(닿는 거리), color, flicker }] (횃불·수정)
  torches: [],       // 불꽃이 피어오르는 자리 [x, y, z]
  holes: [],         // 동굴 천장 구멍 [x, z, 바닥 x, 바닥 z] (햇빛이 비스듬히 들어와 바닥에 닿는 자리)
  shafts: null,      // 천장 구멍으로 쏟아지는 빛줄기 모델
  bossSpot: null,    // 보스가 잠들어 있는 자리 (지도의 B)
  // 오픈월드(구역이 있는 맵)에서만 쓰는 1m 격자 (땅 모델과 같은 격자). 구역이 없는 맵은 null → 예전 계산 그대로
  bio: null,         // 구역 무게 { w: 칸마다 5개씩(BIOME_IDS 순서), x0, z0, nx, nz }
  hgrid: null,       // 땅 높이 { h, x0, z0, nx, nz }: groundHeight가 땅 모델과 똑같은 높이를 빠르게 돌려줌
  reach: null,       // 걸어서 갈 수 있는 격자점 (1) — 적은 여기에만 나타남
  waterBoxes: [],    // 물을 12m 구역마다 나눈 상자들 [{ min: [x, y, z], max: [x, y, z] }] (물에 비친 모습을 그릴지 정할 때)
  _waterAll: null,   // 물 전체를 감싸는 상자

  // 물에 비친 모습을 그릴지 정할 때 render.js가 보는 상자. 다른 맵은 물 전체 상자 그대로,
  // 오픈월드는 물이 넓어서(늪 전체) 카메라 60m 안에서 화면에 걸친 물 구역 상자만 (멀리만 물이 있으면 반사 그림을 건너뜀)
  get waterBox() {
    if (!this.bio || typeof Renderer === 'undefined' || !Renderer.vp) return this._waterAll;
    const planes = frustumPlanes(Renderer.vp), e = Camera.eye;
    for (const b of this.waterBoxes) {
      const dx = Math.max(b.min[0] - e[0], 0, e[0] - b.max[0]), dz = Math.max(b.min[2] - e[2], 0, e[2] - b.max[2]);
      if (dx * dx + dz * dz < 3600 && boxVisible(planes, b)) return b;
    }
    return NO_WATER_BOX;
  },
  set waterBox(v) { this._waterAll = v; },
  pondCells: [],     // 연못(~) 칸 [칸x, 칸z]
  _bw: new Float32Array(5), _bwH: new Float32Array(5), _bwC: new Float32Array(5), _bwG: new Float32Array(5), _bwD: new Float32Array(5),   // 계산용 (매번 새로 만들지 않게)
  villageBox: null,  // 마을 울타리 안쪽 범위 [x0, z0, x1, z1] (m). 마을이 없는 맵은 null
  wellSpot: null,    // 마을 우물 자리 [x, z] (둘레가 돌바닥 광장)
  ringSpots: [],     // 초원 선돌 고리(G) 가운데 [x, z]
  fairySpots: [],    // 북쪽 숲 버섯 고리(M) 가운데 [x, z] (둘레는 풀 없는 이끼 바닥)
  _bioOut: { village: 0, meadow: 0, woods: 0, marsh: 0, hills: 0 },

  load(level) {
    this.meshes.forEach((m) => {
      GL.deleteMesh(m.mesh);
      if (m.far) GL.deleteMesh(m.far);
      if (m.shadowMesh) GL.deleteMesh(m.shadowMesh);
    });
    for (const m of [this.water, this.barrier, this.pillar, this.shafts]) if (m) GL.deleteMesh(m);
    this.water = this.barrier = this.pillar = this.gate = this.shafts = null;
    this.gateOpen = false;
    this.barrierFade = 1;
    this.level = level;
    this.cave = level.theme === 'cave';
    this.pal = this.cave ? CAVE_GROUND : GROUND;
    this.data = level.data;
    this.rows = this.data.length;
    this.cols = this.data[0].length;
    this.colliders = {};
    this.bossSpot = null;
    this.start = { x: (this.cols * CELL) / 2, z: (this.rows * CELL) / 2, angle: Utils.rad(level.startAngle || 0) };
    this.data.forEach((row, z) => {
      if (row.length !== this.cols) console.warn(`맵 ${z}번째 줄의 길이가 다릅니다.`);
      const x = row.indexOf('P');
      if (x >= 0) this.start = { x: (x + 0.5) * CELL, z: (z + 0.5) * CELL, angle: this.start.angle };
      const b = row.indexOf('B');
      if (b >= 0) this.bossSpot = { x: (b + 0.5) * CELL, z: (z + 0.5) * CELL };
    });
    // 구역별 풍경: 마을 울타리 안 범위·우물 자리·선돌 고리 자리 (땅 높이·색·소품 배치가 씀)
    const vz = (level.zones || []).find((zn) => zn.kind === 'village');
    this.villageBox = vz ? [(vz.rect[0] + 1) * CELL, (vz.rect[1] + 1) * CELL, vz.rect[2] * CELL, vz.rect[3] * CELL] : null;
    this.wellSpot = null;
    this.ringSpots = [];
    this.fairySpots = [];
    this.data.forEach((row, cz) => [...row].forEach((ch, cx) => {
      if (ch === 'W' && vz) this.wellSpot = [(cx + 0.5) * CELL, (cz + 0.5) * CELL];
      if (ch === 'G') this.ringSpots.push([(cx + 0.5) * CELL, (cz + 0.5) * CELL]);
      if (ch === 'M') this.fairySpots.push([(cx + 0.5) * CELL, (cz + 0.5) * CELL]);
    }));
    this.hgrid = this.reach = this.waterBox = null;
    this.waterBoxes = [];
    this.pondCells = [];
    this.data.forEach((row, cz) => [...row].forEach((ch, cx) => { if (ch === '~') this.pondCells.push([cx, cz]); }));
    this.buildBiomes();   // 오픈월드: 구역 무게 (구역이 없으면 null)
    // 수면 높이: 오픈월드는 한 높이로 고정 (config.js world.waterLevel, 늪·연못 땅을 이 둘레로 만듦)
    // 다른 맵은 연못 칸들의 땅 높이 중 가장 낮은 곳보다 살짝 아래
    this.waterLevel = null;
    if (this.bio) {
      this.waterLevel = CONFIG.world.waterLevel;
    } else {
      let low = Infinity;
      for (let cz = 0; cz < this.rows; cz++) {
        for (let cx = 0; cx < this.cols; cx++) {
          if (this.data[cz][cx] !== '~') continue;
          for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) low = Math.min(low, this.baseHeight((cx + ox) * CELL, (cz + oz) * CELL));
        }
      }
      if (low < Infinity) this.waterLevel = low - 0.12;
    }
    this.buildHeights();  // 오픈월드: 땅 높이 격자 + 걸어서 갈 수 있는 곳 확인
    this.build();
    if (this.hgrid) this.reach = this.walkReach(this.reach);   // 나무·바위·집이 생긴 뒤, 그것들에 막힌 구석까지 빼고 다시 확인 (적 배치용)
  },

  // 땅 모델의 1m 격자 범위 (맵 바깥으로 숲 두께 + 20m 더)
  grid() {
    const pad = MARGIN * CELL + 20;
    return { x0: -pad, z0: -pad, nx: Math.round(this.cols * CELL + pad * 2), nz: Math.round(this.rows * CELL + pad * 2) };
  },

  // 구역 무게 격자: 격자점마다 '각 구역에 속한 정도'를 미리 계산해 둠 (경계는 TERRAIN.feather m에 걸쳐 섞이고 구불구불)
  // 맵 테두리에 닿은 구역은 맵 바깥으로 끝없이 이어짐 (바깥 숲도 옆 구역 색을 따라감)
  buildBiomes() {
    this.bio = null;
    const zones = (this.level.zones || []).filter((zn) => BIOME_IDS.includes(zn.id));
    if (!zones.length) return;
    const C = CELL, NB = BIOME_IDS.length, g = this.grid(), s = g.nx + 1;
    const rects = zones.map((zn) => {
      const r = zn.rect;
      return [BIOME_IDS.indexOf(zn.id), r[0] <= 1 ? -1e9 : r[0] * C, r[1] <= 1 ? -1e9 : r[1] * C,
        r[2] >= this.cols - 2 ? 1e9 : (r[2] + 1) * C, r[3] >= this.rows - 2 ? 1e9 : (r[3] + 1) * C];
    });
    const w = new Float32Array(s * (g.nz + 1) * NB), v = new Float32Array(NB);
    const fe = TERRAIN.feather, wob = TERRAIN.warp, woods = BIOME_IDS.indexOf('woods');
    for (let j = 0; j <= g.nz; j++) {
      for (let i = 0; i <= g.nx; i++) {
        const x = g.x0 + i, z = g.z0 + j;
        const wx = x + (Utils.noise2(x * 0.07 + 3, z * 0.07) - 0.5) * wob, wz = z + (Utils.noise2(x * 0.07, z * 0.07 + 9) - 0.5) * wob;
        v.fill(0);
        for (const [k, x0, z0, x1, z1] of rects) {
          const dx = Math.max(x0 - wx, wx - x1), dz = Math.max(z0 - wz, wz - z1);
          const sd = dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz);   // 구역 네모까지 거리 (안쪽은 -)
          v[k] = Math.max(v[k], Utils.smooth(0.5 - sd / (2 * fe)));
        }
        let sum = 0;
        for (let k = 0; k < NB; k++) sum += v[k];
        if (sum < 1e-4) { v[woods] = 1; sum = 1; }   // 어느 구역에도 안 닿으면 숲
        const o = (j * s + i) * NB;
        for (let k = 0; k < NB; k++) w[o + k] = v[k] / sum;
      }
    }
    this.bio = Object.assign({ w }, g);
  },

  // (x, z)의 구역 무게를 out(길이 5 배열)에 씀: 격자 네 점을 섞음
  bioMix(x, z, out) {
    const B = this.bio, NB = 5, s = B.nx + 1;
    const gx = Utils.clamp(x - B.x0, 0, B.nx - 1e-4), gz = Utils.clamp(z - B.z0, 0, B.nz - 1e-4);
    const i = gx | 0, j = gz | 0, fx = gx - i, fz = gz - j;
    const a = (j * s + i) * NB, b = a + NB, c = a + s * NB, d = c + NB, W = B.w;
    const k00 = (1 - fx) * (1 - fz), k10 = fx * (1 - fz), k01 = (1 - fx) * fz, k11 = fx * fz;
    for (let k = 0; k < NB; k++) out[k] = W[a + k] * k00 + W[b + k] * k10 + W[c + k] * k01 + W[d + k] * k11;
    return out;
  },

  // ★ 다른 파일에서 쓰는 약속: (x, z)가 각 구역에 속한 정도 { village, meadow, woods, marsh, hills } (합 1).
  //   구역이 없는 맵(노을 숲·동굴)은 null. out을 주면 거기에 써서 돌려줌 (매 프레임 불러도 새 물건을 만들지 않음)
  biomeAt(x, z, out) {
    if (!this.bio) return null;
    const w = this.bioMix(x, z, this._bw), o = out || this._bioOut;
    o.village = w[0]; o.meadow = w[1]; o.woods = w[2]; o.marsh = w[3]; o.hills = w[4];
    return o;
  },

  // (x, z)에서 가장 강한 구역 이름 ('village' 등). 구역이 없는 맵은 null
  biomeMax(x, z) {
    if (!this.bio) return null;
    const w = this.bioMix(x, z, this._bw);
    let best = 0;
    for (let k = 1; k < 5; k++) if (w[k] > w[best]) best = k;
    return BIOME_IDS[best];
  },

  // 땅 높이 격자 (오픈월드만): 구역별 높이 + 연못을 계산해 두고, 걸어서 못 가는 높은 단·움푹한 곳이 없게 다듬음
  buildHeights() {
    if (!this.bio) return;
    const g = this.grid(), s = g.nx + 1, n = s * (g.nz + 1), h = new Float32Array(n);
    for (let j = 0; j <= g.nz; j++) for (let i = 0; i <= g.nx; i++) h[j * s + i] = this.terrainHeight(g.x0 + i, g.z0 + j);
    // 흙길은 길끼리만 넓게 평균한 높이를 따라가게: 구역 경계(언덕 → 늪 등)에서도 완만한 오르막·내리막이 되고,
    // 언덕에선 길이 낮게 지나가서 양옆으로 층진 바위 둔덕이 솟음 (길 아닌 땅은 섞지 않음)
    const mask = new Float32Array(n), hm = new Float32Array(n), rws = new Float32Array(n);
    for (let j = 0; j <= g.nz; j++) {
      for (let i = 0; i <= g.nx; i++) {
        const x = g.x0 + i, z = g.z0 + j, k = j * s + i;
        mask[k] = Utils.smooth((this.blend(x, z, isRoadCell) - 0.3) * 2.5);   // 길 위인 정도
        hm[k] = h[k] * mask[k];
        rws[k] = Utils.smooth(this.roadWide(x, z) * 1.25);                     // 길과 길가 (높이를 길에 맞출 정도)
      }
    }
    const bm = this.boxBlur(mask, g, TERRAIN.roadBlur, 3), bh = this.boxBlur(hm, g, TERRAIN.roadBlur, 3);
    const wl = this.waterLevel;
    for (let k = 0; k < n; k++) {
      if (rws[k] <= 0 || bm[k] < 1e-3) continue;
      const road = bh[k] / bm[k];
      // 늪으로 내려가는 길: 수면 가까이 오면 조금 더 내려가 발목까지 잠기는 진흙 길이 됨 (길 높이를 따라 부드럽게)
      const sink = 0.3 * Utils.smooth((wl + 0.8 - road) / 0.9) * Utils.smooth(this.bioMix(g.x0 + (k % s), g.z0 + Math.floor(k / s), this._bwH)[3] * 4);
      h[k] = Utils.lerp(h[k], road - sink, rws[k] * Utils.smooth(bm[k] * 4));
    }
    this.hgrid = Object.assign({ h }, g);
    this.reach = this.fixReach(h, g);
  },

  // 격자 값을 가로·세로로 r칸씩 평균 (passes번 되풀이하면 부드러운 종 모양으로 퍼짐). 새 배열을 돌려줌
  boxBlur(src, g, r, passes) {
    const s = g.nx + 1, a = Float32Array.from(src), tmp = new Float32Array(a.length);
    for (let pass = 0; pass < passes; pass++) {
      for (let j = 0; j <= g.nz; j++) {   // 가로로 평균
        let acc = 0, cnt = 0;
        for (let i = -r; i <= g.nx + r; i++) {
          if (i + r <= g.nx) { acc += a[j * s + i + r]; cnt++; }
          if (i - r - 1 >= 0) { acc -= a[j * s + i - r - 1]; cnt--; }
          if (i >= 0 && i <= g.nx) tmp[j * s + i] = acc / cnt;
        }
      }
      for (let i = 0; i <= g.nx; i++) {   // 세로로 평균
        let acc = 0, cnt = 0;
        for (let j = -r; j <= g.nz + r; j++) {
          if (j + r <= g.nz) { acc += tmp[(j + r) * s + i]; cnt++; }
          if (j - r - 1 >= 0) { acc -= tmp[(j - r - 1) * s + i]; cnt--; }
          if (j >= 0 && j <= g.nz) a[j * s + i] = acc / cnt;
        }
      }
    }
    return a;
  },

  // 걸어서 갈 수 있는지: 시작 자리에서 1m 격자를 따라 퍼져 나감 (이웃 점과 높이 차가 오를 수 있는 비탈보다 크면 못 지나감)
  // 지나갈 수 있는 칸인데 닿지 않는 점(가파른 턱으로 둘러싸인 단·구덩이)은 닿는 이웃에 맞춰 높이를 깎거나 메움 → 완만한 오르막이 생김
  // 돌려주는 값: 걸어서 갈 수 있는 격자점 표시 (1)
  fixReach(h, g) {
    const s = g.nx + 1, n = s * (g.nz + 1);
    const open = new Uint8Array(n), reach = new Uint8Array(n), queue = new Int32Array(n);
    for (let j = 0; j <= g.nz; j++) for (let i = 0; i <= g.nx; i++) open[j * s + i] = this.blocked(g.x0 + i, g.z0 + j, 0.3) || this.obstacleCore(g.x0 + i, g.z0 + j) ? 0 : 1;   // (아직 나무·바위 충돌은 없음: 칸 글자로 미리 짐작)
    const lim = CONFIG.world.maxSlope * 0.9;   // 1m마다 이만큼까지 오르내림 (조금 여유)
    const si = Utils.clamp(Math.round(this.start.x - g.x0), 0, g.nx), sj = Utils.clamp(Math.round(this.start.z - g.z0), 0, g.nz);
    let head = 0, tail = 0;
    const push = (k) => { reach[k] = 1; queue[tail++] = k; };
    const nbs = (k, fn) => {
      const i = k % s;
      if (i > 0) fn(k - 1);
      if (i < g.nx) fn(k + 1);
      if (k >= s) fn(k - s);
      if (k + s < n) fn(k + s);
    };
    push(sj * s + si);
    // 1단계: 높이를 바꾸지 않고 갈 수 있는 곳
    while (head < tail) {
      const k = queue[head++];
      nbs(k, (m) => { if (open[m] && !reach[m] && Math.abs(h[m] - h[k]) <= lim) push(m); });
    }
    this.reachFixed = 0;
    // 2단계: 못 간 점은 이미 갈 수 있는 이웃에 맞춰 높이를 고쳐서 이어 붙임 (가까운 곳부터)
    head = 0;
    while (head < tail) {
      const k = queue[head++];
      nbs(k, (m) => {
        if (!open[m] || reach[m]) return;
        const v = Utils.clamp(h[m], h[k] - lim, h[k] + lim);
        if (v !== h[m]) { h[m] = v; this.reachFixed++; }
        push(m);
      });
    }
    return reach;
  },

  // 바위(R)·덤불(b)·무너진 돌기둥(X)·나무(T) 칸 가운데에 나중에 놓일 충돌 자리인지 (fixReach용: 아직 충돌이 없을 때 미리 짐작)
  // 큰 것(R·b·X)은 가운데에서 1m 안(칸 가운데 + 네 변의 가운데), 나무는 가운데만 → 그 틈으로 이어진 '가짜 길'을 믿지 않고
  // 언덕 위 단 같은 곳엔 정말 걸어 오를 비탈을 만들어 둠
  obstacleCore(x, z) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const ch = this.cell(cx + i, cz + j), r = 'RbX'.includes(ch) ? 1.05 : ch === 'T' ? 0.6 : 0;
        if (r && Math.hypot(x - (cx + i + 0.5) * CELL, z - (cz + j + 0.5) * CELL) < r) return true;
      }
    }
    return false;
  },

  // 나무·바위·집 충돌까지 따진 '걸어서 갈 수 있는 곳': 시작 자리에서 1m 격자를 따라 퍼져 나가되,
  // 이웃 점까지 가는 길(0.25m마다)이 충돌에 막히거나 높이 차가 오를 수 있는 비탈보다 크면 못 지나감.
  // fixReach는 땅 높이만 보고 만들어서(그때는 나무·바위가 아직 없음), 바위·나무와 가파른 턱에 둘러싸인 구석이 남을 수 있음 → 적이 거기 나타나지 않게
  walkReach(prev) {
    const G = this.hgrid, s = G.nx + 1, n = s * (G.nz + 1), reach = new Uint8Array(n), queue = new Int32Array(n);
    const r = CONFIG.player.radius, lim = CONFIG.world.maxSlope * 0.9, h = G.h;
    const i0 = Math.max(0, -G.x0), i1 = Math.min(G.nx, this.cols * CELL - G.x0), j0 = Math.max(0, -G.z0), j1 = Math.min(G.nz, this.rows * CELL - G.z0);   // 맵 안만
    const si = Math.round(this.start.x - G.x0), sj = Math.round(this.start.z - G.z0);
    let head = 0, tail = 0;
    reach[sj * s + si] = 1;
    queue[tail++] = sj * s + si;
    const step = (k, m, di, dj) => {
      if (!prev[m] || reach[m] || Math.abs(h[m] - h[k]) > lim) return;
      const x = G.x0 + (k % s), z = G.z0 + Math.floor(k / s);
      for (let t = 0.25; t <= 1; t += 0.25) if (this.blocked(x + di * t, z + dj * t, r)) return;
      reach[m] = 1;
      queue[tail++] = m;
    };
    while (head < tail) {
      const k = queue[head++], i = k % s, j = Math.floor(k / s);
      if (i > i0) step(k, k - 1, -1, 0);
      if (i < i1) step(k, k + 1, 1, 0);
      if (j > j0) step(k, k - s, 0, -1);
      if (j < j1) step(k, k + s, 0, 1);
    }
    return reach;
  },

  // 칸의 문자 (맵 밖은 숲)
  cell(cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.cols || cz >= this.rows) return '#';
    return this.data[cz][cx] || '#';
  },

  // 주변 8칸 중 지나갈 수 있는 칸이 있는지 (숲의 가장자리인지)
  nearOpen(cx, cz) {
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) if (this.cell(cx + i, cz + j) !== '#') return true;
    }
    return false;
  },

  // 원래 땅 높이 (m): 완만한 언덕. 오픈월드는 구역별 높이를 구역 무게대로 섞음 (흙길은 평평하게)
  baseHeight(x, z) {
    const b = (Utils.fbm2(x * 0.05, z * 0.05, 3) - 0.5) * 2.4;
    if (!this.bio) return b;
    const w = this.bioMix(x, z, this._bwH), road = this.roadWide(x, z), wl = this.waterLevel ?? CONFIG.world.waterLevel;
    let h = 0;
    for (let k = 0; k < 5; k++) if (w[k] > 0.001) h += w[k] * BIOME_HEIGHT[k](x, z, b, road, wl, this);
    return h;
  },

  // 흙길 근처인 정도 (길 양옆 2.5m까지 넓게 봄: 길과 길가를 함께 평평하게 다듬을 때)
  roadWide(x, z) {
    return Math.max(this.blend(x, z, isRoadCell), this.blend(x + 2.5, z, isRoadCell), this.blend(x - 2.5, z, isRoadCell),
      this.blend(x, z + 2.5, isRoadCell), this.blend(x, z - 2.5, isRoadCell));
  },

  // 계산으로 구한 땅 높이: 연못 자리는 움푹 파임 (오픈월드는 연못 둘레가 넓고 완만하게 우묵함)
  terrainHeight(x, z) {
    let h = this.baseHeight(x, z);
    if (this.waterLevel === null) return h;
    if (this.bio && this.pondCells.length) {
      let d = Infinity;   // 가장 가까운 연못 칸까지 거리 (m)
      for (const [cx, cz] of this.pondCells) {
        const dx = Math.max(cx * CELL - x, x - (cx + 1) * CELL, 0), dz = Math.max(cz * CELL - z, z - (cz + 1) * CELL, 0);
        if (dx < d && dz < d) d = Math.min(d, Math.hypot(dx, dz));
      }
      const k = Utils.smooth(1 - d / TERRAIN.pondBasin);
      if (k > 0) h = Utils.lerp(h, Math.min(h, this.waterLevel + 0.15), k);
    }
    const w = this.blend(x, z, isPondCell);
    if (w <= 0.5) return h;
    return Utils.lerp(h, this.waterLevel - 0.9, Utils.smooth((w - 0.5) * 2.2));
  },

  // 실제 땅 높이. 오픈월드는 미리 만든 격자에서 땅 모델과 똑같은 삼각형으로 읽음 (빠르고, 발이 땅 그림에 정확히 닿음)
  groundHeight(x, z) {
    const G = this.hgrid;
    if (G) {
      const gx = x - G.x0, gz = z - G.z0;
      if (gx >= 0 && gz >= 0 && gx <= G.nx && gz <= G.nz) {
        const i = Math.min(gx | 0, G.nx - 1), j = Math.min(gz | 0, G.nz - 1), fx = gx - i, fz = gz - j;
        const s = G.nx + 1, k = j * s + i, h = G.h;
        return fx > fz ? h[k] + (h[k + 1] - h[k]) * fx + (h[k + s + 1] - h[k + 1]) * fz     // 땅 모델의 대각선(왼쪽 위 → 오른쪽 아래)으로 나눈 두 삼각형
          : h[k] + (h[k + s] - h[k]) * fz + (h[k + s + 1] - h[k + s]) * fx;
      }
    }
    return this.terrainHeight(x, z);
  },

  // 비탈의 가파른 정도 (1m 갈 때 오르내리는 높이)
  slopeAt(x, z) {
    const e = 0.5;
    return Math.hypot(this.groundHeight(x + e, z) - this.groundHeight(x - e, z), this.groundHeight(x, z + e) - this.groundHeight(x, z - e)) / (2 * e);
  },

  // 바위가 드러난 정도 (0~1): 언덕 구역의 가파른 비탈 (땅 모델의 무늬 좌표 y로 셰이더에 넘김 → 바위 결을 그림)
  rockAmount(x, z) {
    if (!this.bio) return 0;
    const hills = this.bioMix(x, z, this._bw)[4];
    if (hills < 0.02) return 0;
    return Utils.smooth((this.slopeAt(x, z) - 0.42) / 0.3) * Utils.smooth(hills * 1.6);
  },

  // 주변 칸을 부드럽게 섞어서, (x, z)가 조건에 맞는 정도 (0~1)
  blend(x, z, test) {
    const gx = x / CELL - 0.5, gz = z / CELL - 0.5;
    const i = Math.floor(gx), j = Math.floor(gz);
    const fx = gx - i, fz = gz - j;
    const v = (a, b) => (test(this.cell(a, b)) ? 1 : 0);
    return Utils.lerp(Utils.lerp(v(i, j), v(i + 1, j), fx), Utils.lerp(v(i, j + 1), v(i + 1, j + 1), fx), fz);
  },

  // 흙길인 정도 (가장자리가 자연스럽게 들쭉날쭉). 마을 안에선 집 둘레도 밟혀 다져진 흙
  dirtAmount(x, z) {
    let d = this.blend(x, z, isRoadCell);
    const v = this.villageBox ? this.villageAmount(x, z) : 0;
    if (v > 0) {
      const h = isHouseCell;
      d = Math.max(d, 0.6 * v * Math.max(this.blend(x + 1.5, z, h), this.blend(x - 1.5, z, h), this.blend(x, z + 1.5, h), this.blend(x, z - 1.5, h)));
    }
    return Utils.clamp((d - 0.3) * 2.5 + (Utils.noise2(x * 0.9, z * 0.9) - 0.5) * 0.7, 0, 1);
  },

  // ---------- 구역별 풍경 도우미 (오픈월드) ----------
  // 마을 울타리 안쪽인 정도 (0~1): 울타리 안쪽 가장자리에서 2m에 걸쳐 1이 됨. 마을이 없는 맵은 0
  villageAmount(x, z) {
    const r = this.villageBox;
    if (!r) return 0;
    return Utils.smooth((x - r[0]) / 2) * Utils.smooth((r[2] - x) / 2) * Utils.smooth((z - r[1]) / 2) * Utils.smooth((r[3] - z) / 2);
  },

  // 마을 돌바닥인 정도 (0~1): 우물 둘레의 둥근 광장(가장자리는 들쭉날쭉) + 울타리 안의 흙길은 돌 깐 골목
  plazaAmount(x, z) {
    const v = this.villageAmount(x, z);
    if (v <= 0) return 0;
    const w = this.wellSpot;
    const ring = w ? Utils.smooth((DRESS.plazaRadius - Math.hypot(x - w[0], z - w[1]) + (Utils.noise2(x * 0.7, z * 0.7) - 0.5) * 2) / 1.5) : 0;
    return v * Math.max(ring, this.blend(x, z, isRoadCell) * 0.9);
  },

  // 초원 꽃밭인 정도 (0~1): 초원 구역에 큰 얼룩으로. 흙길·물가·숲 벽엔 없음
  carpetAt(x, z) {
    if (!this.bio) return 0;
    const m = this.bioMix(x, z, this._bwD)[1];
    if (m < 0.4 || this.pondNear(x, z)) return 0;
    const [f, t, k] = DRESS.carpet;
    const c = Utils.clamp((Utils.fbm2(x * f + 8, z * f + 19, 2) - t) * k, 0, 1);
    if (c <= 0) return 0;
    return c * Utils.smooth((m - 0.4) / 0.3) * (1 - this.dirtAmount(x, z)) * (1 - this.blend(x, z, isForestCell));
  },

  // 그 자리 꽃밭의 주인공 색 번호 (MEADOW_FLOWERS): 9m쯤 되는 구불구불한 덩어리마다 한 가지 색. 셰이더 groundTexture의 carpetHue와 똑같은 계산
  // (먼 곳에서 땅에 찍는 꽃 점 색이 가까이 있는 꽃 모델 색과 맞음)
  carpetHue(x, z) {
    const wx = x + (Utils.noise2(x * 0.05 + 3, z * 0.05) - 0.5) * 14, wz = z + (Utils.noise2(x * 0.05, z * 0.05 + 5) - 0.5) * 14;
    return Math.min(4, Math.floor(Utils.hash2(Math.floor(wx / 9), Math.floor(wz / 9)) * 5));
  },

  // 선돌 고리(G) 둘레 둔덕의 높이 (m): 고리 가운데에서 14m에 걸쳐 완만하게
  ringRise(x, z) {
    let h = 0;
    for (const [gx, gz] of this.ringSpots) h = Math.max(h, Utils.smooth(1 - Math.hypot(x - gx, z - gz) / 14));
    return h * DRESS.ringRise;
  },

  // 숲 벽 칸에서 트인 이웃 칸들의 반대 방향 (길이 1, 사방이 막혔으면 0). 큰 바위를 벽 안쪽으로 비켜 놓을 때
  awayFromOpen(cx, cz) {
    let ax = 0, az = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && this.cell(cx + i, cz + j) !== '#') { ax -= i; az -= j; }
    const l = Math.hypot(ax, az);
    return l > 0 ? [ax / l, az / l] : [0, 0];
  },

  // 그 자리를 어느 구역 모양으로 꾸밀지: 구역 무게를 세제곱해 날카롭게 한 뒤 난수 r(0~1)로 고름
  // → 구역 한가운데는 늘 그 구역, 경계 몇 m에서만 두 구역의 벽·나무가 섞여 자연스럽게 바뀜
  pickZone(x, z, r) {
    const w = this.bioMix(x, z, this._bwD);
    let sum = 0, best = 0;
    for (let k = 0; k < 5; k++) {
      sum += w[k] * w[k] * w[k];
      if (w[k] > w[best]) best = k;
    }
    r *= sum;
    for (let k = 0; k < 5; k++) {
      r -= w[k] * w[k] * w[k];
      if (r < 0) return BIOME_IDS[k];
    }
    return BIOME_IDS[best];
  },

  // 근처(주변 1칸 안)에 연못이 있는지
  pondNear(x, z) {
    if (this.waterLevel === null) return false;
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) if (this.cell(cx + i, cz + j) === '~') return true;
    }
    return false;
  },

  // 물에 잠겼거나 물가 진흙인지 (오픈월드는 늪 구역의 얕은 웅덩이도. 웅덩이 둘레는 풀 없는 진흙 테두리)
  isWet(x, z) {
    if (this.bio) return (this.pondNear(x, z) || this.bioMix(x, z, this._bw)[3] > 0.2) && this.groundHeight(x, z) < this.waterLevel + 0.14;
    return this.pondNear(x, z) && this.groundHeight(x, z) < this.waterLevel + 0.08;
  },

  groundColor(x, z) {
    const G = this.pal;
    const forest = this.blend(x, z, isForestCell);
    const n = Utils.fbm2(x * 0.15, z * 0.15, 3);
    let col;
    let marsh = 0;
    if (this.bio) {   // 오픈월드: 구역별 색을 구역 무게대로 섞음
      const w = this.bioMix(x, z, this._bwC), kd = Utils.smooth((n - 0.45) * 3);
      col = [0, 0, 0, 0];
      const fl = [0, 0, 0, 0];
      for (let k = 0; k < 5; k++) {
        if (w[k] < 0.001) continue;
        const P = BIOME_PAL[k];
        for (let c = 0; c < 3; c++) {
          col[c] += w[k] * Utils.lerp(P.grass[c], P.dry[c], kd);
          fl[c] += w[k] * P.forest[c];
        }
      }
      marsh = w[3];
      col = Utils.mixColor(col, fl, forest * 0.85 * (1 - 0.65 * w[1]));   // 초원의 산울타리 너머는 숲 바닥이 아니라 풀밭 (덜 어둡게)
      if (w[4] > 0.02) {   // 언덕: 중간 비탈은 흘러내린 자갈, 가파른 턱은 드러난 바위
        const sl = this.slopeAt(x, z), sp = Utils.noise2(x * 1.7, z * 1.7);
        col = Utils.mixColor(col, TERRAIN_COLORS.scree, Utils.smooth((sl - 0.25) / 0.25) * Utils.smooth(w[4] * 1.6) * (0.35 + 0.5 * sp));
        col = Utils.mixColor(col, TERRAIN_COLORS.rock, this.rockAmount(x, z));
      }
    } else {
      col = Utils.mixColor(G.grass, G.grassDry, Utils.smooth((n - 0.45) * 3));
      col = Utils.mixColor(col, G.forest, forest * 0.85);
    }
    col = Utils.mixColor(col, G.dirt, this.dirtAmount(x, z));
    if (this.villageBox) {   // 마을: 우물 둘레 광장과 울타리 안 골목은 돌바닥 (돌 무늬는 셰이더가, 여기선 바탕색만)
      const pl = this.plazaAmount(x, z);
      if (pl > 0) col = Utils.mixColor(col, G.cobble, pl * 0.9);
    }
    if (this.bio) {
      if (this.waterLevel !== null && (marsh > 0.05 || this.pondNear(x, z))) {   // 물가·웅덩이 바닥: 젖은 진흙, 늪은 물이끼 얼룩
        const h = this.groundHeight(x, z), wet = Utils.smooth((this.waterLevel + 0.3 - h) / 0.35);
        col = Utils.mixColor(col, Utils.mixColor(G.mud, TERRAIN_COLORS.marshMud, marsh), wet * 0.9);
        if (marsh > 0.05) col = Utils.mixColor(col, TERRAIN_COLORS.algae, marsh * Utils.smooth((Utils.fbm2(x * 0.3, z * 0.3, 2) - 0.5) * 4) * 0.45 * (1 - wet * 0.5));
      }
    } else if (this.pondNear(x, z)) {   // 물가: 젖은 진흙
      const wet = Utils.smooth((this.waterLevel + 0.25 - this.groundHeight(x, z)) / 0.3);
      col = Utils.mixColor(col, G.mud, wet);
    }
    col[3] = this.goldAmount(x, z);   // 네 번째 값 = 금빛 마른 풀밭 정도 (셰이더가 붓 자국 경계로 칠함)
    return col;
  },

  // 금빛(낮에는 밀짚빛) 마른 풀밭인 정도 (0~1): 탁 트인 풀밭에 큰 얼룩으로. 숲 바닥·흙길·물가·동굴엔 없음
  // 오픈월드는 구역마다 양이 다름 (BIOMES의 gold: 언덕은 많고, 마을·늪은 없음), 바위 비탈에도 없음
  goldAmount(x, z) {
    if (this.cave || this.pondNear(x, z)) return 0;
    const n = Utils.fbm2(x * 0.06 + 40, z * 0.06 - 25, 3);
    const open = 1 - this.blend(x, z, isForestCell);
    let k = LIGHTING[this.level.theme].gold ?? 1;   // 테마별 양 (노을은 적게)
    if (this.bio) {
      const w = this.bioMix(x, z, this._bwG);
      let zk = 0;
      for (let i = 0; i < 5; i++) zk += w[i] * BIOME_PAL[i].gold;
      k *= zk * (1 - this.rockAmount(x, z));
      if (k <= 0) return 0;
    }
    return Utils.clamp((n - 0.46) * 5, 0, 1) * open * open * (1 - this.dirtAmount(x, z)) * k * (1 - this.villageAmount(x, z)) * (1 - 0.8 * this.carpetAt(x, z));   // 마을 울타리 안은 가꾼 잔디, 꽃밭은 푸른 풀 (금빛 없음)
  },

  // 풀 포기 색: 그 자리 땅 색을 따라감 (마른 풀밭은 노르스름, 숲 가장자리는 짙게) → 풀과 땅이 한 덩어리로 보임
  // dry: 마른 풀 포기. 오픈월드에선 땅의 밝기만 거의 따라가고 빛깔은 조금만 (언덕의 황토·자갈 빛에 주황으로 물들지 않고 밀짚빛 그대로)
  grassTint(x, z, jitter, dry) {
    const g = this.groundColor(x, z), G = this.pal.grass;
    const t = [0, 1, 2].map((i) => Utils.clamp(Utils.lerp(1, g[i] / G[i], 0.75), 0.6, 1.5));
    if (dry && this.bio) {
      const l = t[0] * 0.3 + t[1] * 0.6 + t[2] * 0.1;
      for (let i = 0; i < 3; i++) t[i] = Utils.lerp(l, t[i], 0.25);
    }
    return t.map((v, i) => v * jitter[i]);
  },

  // 동굴 천장 높이 (m). 넓은 곳 가운데는 높고 벽 쪽으로 낮아짐. 동굴이 아니면 무한히 높음
  ceilAt(x, z) {
    if (!this.cave) return Infinity;
    const wall = (c) => c === '#';
    const near = this.blend(x, z, wall) * 0.4 + (this.blend(x - 3, z, wall) + this.blend(x + 3, z, wall) + this.blend(x, z - 3, wall) + this.blend(x, z + 3, wall)) * 0.15;
    return 8.2 + Utils.fbm2(x * 0.09 + 5, z * 0.09 - 3, 3) * 2.6 - near * 4.2;
  },

  // (x, z) 위 천장이 뚫려 있는지 (hole: 구멍 반지름에 더할 여유)
  inHole(x, z, pad = 0) {
    for (const h of this.holes) {
      const r = 2.1 + pad + (Utils.noise2(x * 0.9, z * 0.9) - 0.5) * 0.8;   // 들쭉날쭉한 구멍 가장자리
      if (Math.hypot(x - h[0], z - h[1]) < r) return true;
    }
    return false;
  },

  addCollider(x, z, r) {
    const key = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
    (this.colliders[key] = this.colliders[key] || []).push({ x, z, r });
  },

  // 반지름 r인 몸이 (x, z)에 있을 때 막히는지 (camera가 true면 물은 막지 않음). 숲(#)과 집(h)은 칸째로 막힘
  blocked(x, z, r, camera) {
    const solid = (px, pz) => {
      const c = this.cell(Math.floor(px / CELL), Math.floor(pz / CELL));
      return c === '#' || c === 'h' || (!camera && (c === '~' || (c === 'E' && !this.gateOpen)));
    };
    if (solid(x - r, z - r) || solid(x + r, z - r) || solid(x - r, z + r) || solid(x + r, z + r)) return true;
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let j = cz - 1; j <= cz + 1; j++) {
      for (let i = cx - 1; i <= cx + 1; i++) {
        const list = this.colliders[`${i},${j}`];
        if (!list) continue;
        for (const c of list) {
          const dx = x - c.x, dz = z - c.z, rr = r + c.r;
          if (dx * dx + dz * dz < rr * rr) return true;
        }
      }
    }
    return false;
  },

  // 적이 나타날 수 있는 빈 칸들 (시작 위치·연못·출구에서 떨어진 풀밭). rect = [왼쪽, 위, 오른쪽, 아래] 칸 범위 안에서만 (오픈월드 구역)
  spawnCells(rect) {
    const cells = [];
    const [x0, z0, x1, z1] = rect || [0, 0, this.cols - 1, this.rows - 1];
    for (let cz = Math.max(0, z0); cz <= Math.min(this.rows - 1, z1); cz++) {
      for (let cx = Math.max(0, x0); cx <= Math.min(this.cols - 1, x1); cx++) {
        if (!'.:fo'.includes(this.data[cz][cx])) continue;
        const x = (cx + 0.5) * CELL, z = (cz + 0.5) * CELL;
        if (Math.hypot(x - this.start.x, z - this.start.z) < 14 || this.pondNear(x, z) || this.blocked(x, z, 0.5)) continue;
        if (this.gate && Math.hypot(x - this.gate.x, z - this.gate.z) < 5) continue;
        if (this.bossSpot && Math.hypot(x - this.bossSpot.x, z - this.bossSpot.z) < 5) continue;
        if (this.hgrid && !this.dryReachable(x, z)) continue;   // 오픈월드: 물웅덩이·가파른 비탈·걸어서 못 가는 곳은 빼기
        cells.push({ x, z });
      }
    }
    return cells;
  },

  // (x, z)가 마른 땅이고, 완만하고, 시작 자리에서 걸어서 갈 수 있는지 (오픈월드의 적 배치용)
  dryReachable(x, z) {
    const G = this.hgrid, i = Math.round(x - G.x0), j = Math.round(z - G.z0);
    if (i < 0 || j < 0 || i > G.nx || j > G.nz || !this.reach[j * (G.nx + 1) + i]) return false;
    return this.groundHeight(x, z) > this.waterLevel + 0.06 && this.slopeAt(x, z) < 0.5;
  },

  // 물체(x, z, radius)를 (dx, dz)만큼 움직이되 막힌 곳은 통과하지 못하게 (0.1m씩 나눠 이동)
  // 오픈월드에서는 너무 가파른 오르막(config.js world.maxSlope보다 가파른 바위 턱)도 막음 (내려가기는 됨, 하늘을 나는 박쥐는 상관없음)
  moveEntity(e, dx, dz) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.1));
    const sx = dx / steps, sz = dz / steps;
    const climb = this.hgrid && e.type !== 'bat' ? CONFIG.world.maxSlope : 0;
    let hit = false;
    for (let i = 0; i < steps; i++) {
      let h0 = climb ? this.groundHeight(e.x, e.z) : 0;
      e.x += sx;
      if (this.blocked(e.x, e.z, e.radius) || (climb && this.groundHeight(e.x, e.z) - h0 > climb * Math.abs(sx) + 1e-4)) { e.x -= sx; hit = true; }
      if (climb) h0 = this.groundHeight(e.x, e.z);
      e.z += sz;
      if (this.blocked(e.x, e.z, e.radius) || (climb && this.groundHeight(e.x, e.z) - h0 > climb * Math.abs(sz) + 1e-4)) { e.z -= sz; hit = true; }
    }
    return hit;
  },

  // 맵 문자를 보고 나무·바위·풀 등을 배치해 3D 모델로 만듦
  build() {
    const rnd = Utils.rng(7);
    const deco = Utils.rng(8);   // 금빛 풀·파란 꽃 무더기용 난수 (따로 써서 기존 나무·바위 배치가 바뀌지 않게)
    const inst = {};
    for (const name in PROP_STYLE) inst[name] = [];
    const shadeAt = [];   // 땅에 드리우는 은은한 그늘 [x, z, 반지름, 세기]
    this.trees = [];
    this.flowerSpots = [];
    this.lights = [];
    this.torches = [];
    this.holes = [];
    const cave = this.cave;
    // 천장 구멍: 햇빛이 비스듬히 들어와 'o' 칸 바닥에 닿도록, 구멍은 해 쪽으로 비켜서 뚫음
    if (cave) {
      const sun = LIGHTING.cave.sunDir;
      this.data.forEach((row, cz) => [...row].forEach((ch, cx) => {
        if (ch !== 'o') return;
        const fx = (cx + 0.5) * CELL, fz = (cz + 0.5) * CELL, rise = this.ceilAt(fx, fz) - this.groundHeight(fx, fz);
        this.holes.push([fx + (sun[0] / sun[1]) * rise, fz + (sun[2] / sun[1]) * rise, fx, fz]);
      }));
    }
    const goldTint = LIGHTING[this.level.theme].goldTuftTint;   // 테마별 마른 풀 포기 색 (노을은 주황빛 그대로 남김)
    const put = (name, x, z, scale, tint, sink = 0.05, y = null, rot) => {
      if (goldTint && name === 'grassGold') tint = [tint[0] * goldTint[0], tint[1] * goldTint[1], tint[2] * goldTint[2]];
      inst[name].push(x, y === null ? this.groundHeight(x, z) - sink : y, z, rot === undefined ? rnd() * Math.PI * 2 : rot, scale, tint[0], tint[1], tint[2]);
    };
    const wet = Utils.rng(11);   // 오픈월드 늪의 갈대·연잎, 바위 비탈 풀 솎기용 난수 (따로 써서 다른 맵의 배치는 그대로)
    const shade = (amt) => {
      const k = 1 + (rnd() - 0.5) * amt;
      return [k * (1 + (rnd() - 0.5) * amt * 0.6), k, k * (1 + (rnd() - 0.5) * amt * 0.6)];
    };
    // 구역별 풍경 난수 (오픈월드의 벽 모양·꽃밭·버섯 고리 등. 따로 써서 다른 맵의 배치는 그대로)
    const dress = Utils.rng(21);
    const dshade = (amt) => {
      const k = 1 + (dress() - 0.5) * amt;
      return [k * (1 + (dress() - 0.5) * amt * 0.6), k, k * (1 + (dress() - 0.5) * amt * 0.6)];
    };
    // 나무 한 그루. zone(오픈월드 구역)에 따라 종류가 바뀜: 숲은 크고 키 큰 나무 위주, 초원은 활엽수·자작나무,
    // 늪은 버드나무·죽은 나무, 언덕은 바람에 휜 소나무 (구역이 없는 맵은 예전 그대로)
    const tree = (x, z, zone) => {
      const r = rnd();
      let name = r < 0.3 ? 'pineA' : r < 0.5 ? 'pineB' : r < 0.68 ? 'oakA' : r < 0.82 ? 'oakB' : 'birch';
      let s = 0.8 + rnd() * 0.5;
      if (zone === 'woods') {
        s *= 1 + DRESS.woodsTree * this.bioMix(x, z, this._bwD)[2];
        if (dress() < 0.4) name = r < 0.5 ? 'pineB' : 'oakB';
      } else if (zone === 'meadow') name = r < 0.31 ? 'oakA' : r < 0.62 ? 'oakB' : 'birch';
      else if (zone === 'marsh') name = r < 0.55 ? 'willow' : 'deadTree';
      else if (zone === 'hills') name = 'windPine';
      put(name, x, z, s, shade(0.25), 0.1, null, name === 'windPine' ? (dress() - 0.5) * 0.5 : undefined);   // 휜 소나무는 모두 같은 쪽으로 기욺
      shadeAt.push([x, z, (name === 'deadTree' ? 1.4 : 2.6) * s, 0.5]);
      if (name !== 'deadTree') this.trees.push([x, this.groundHeight(x, z) + 4.2 * s, z, 1.6 * s]);
      return name;
    };
    // 쓰러진 통나무 (길이 2.8m): 칸 밖으로 튀어나온 끝까지 막히게 통나무를 따라 충돌 원 셋
    const fallenLog = (x, z, s, tint, rot) => {
      put('log', x, z, s, tint, 0.12, null, rot);
      shadeAt.push([x, z, 1.6, 0.3]);
      if (!this.bio) return;
      const ax = Math.cos(rot), az = -Math.sin(rot);
      for (const o of [-0.9, 0, 0.9]) this.addCollider(x + ax * o * s, z + az * o * s, 0.32 * s);
    };
    const ctx = { put, shade, dshade, shadeAt, tree, dress };
    const tufts = Math.round(CONFIG.graphics.grassDensity * CELL * CELL);
    const wl = this.waterLevel;

    for (let cz = -MARGIN; cz < this.rows + MARGIN; cz++) {
      for (let cx = -MARGIN; cx < this.cols + MARGIN; cx++) {
        const ch = this.cell(cx, cz);
        const x0 = cx * CELL, z0 = cz * CELL;
        const rx = () => x0 + 0.15 + rnd() * (CELL - 0.3);
        const rz = () => z0 + 0.15 + rnd() * (CELL - 0.3);

        if (ch === '#' && cave) {   // 동굴 벽: 가장자리는 큰 바위 둘, 한 칸 안쪽은 하나 (그 너머는 보이지 않으므로 비움)
          const edge = this.nearOpen(cx, cz);
          let near2 = edge;
          for (let j = -2; j <= 2 && !near2; j++) for (let i = -2; i <= 2 && !near2; i++) near2 = this.cell(cx + i, cz + j) !== '#';
          const n = edge ? 2 : near2 ? 1 : 0;
          for (let k = 0; k < n; k++) put('cliffRock', rx(), rz(), 0.8 + rnd() * 0.45, shade(0.25), 0.4);
          continue;
        }
        if (ch === '#') {   // 숲: 가장자리는 빽빽하게(덤불·고사리·버섯·통나무), 안쪽은 듬성듬성
          // 오픈월드: 구역마다 다른 벽 (언덕은 바위 더미, 늪은 버드나무·죽은 나무, 초원은 산울타리). 북쪽 숲은 더 빽빽하고 크게
          const zone = this.bio ? this.pickZone(x0 + 1, z0 + 1, dress()) : null;
          if (zone === 'hills' || zone === 'marsh' || zone === 'meadow') {
            this.dressWall(zone, cx, cz, ctx);
            continue;
          }
          const edge = this.nearOpen(cx, cz);
          let n = edge ? 2 : rnd() < 0.75 ? 1 : 0;
          if (zone === 'woods' && dress() < DRESS.woodsExtra[edge ? 0 : 1] * (CONFIG.graphics.wallDensity ?? 1)) n++;
          for (let k = 0; k < n; k++) tree(rx(), rz(), zone);
          if (!edge) continue;
          for (let k = 0; k < 2; k++) {
            const x = rx(), z = rz(), s = 0.8 + rnd() * 0.6;
            put('bush', x, z, s, shade(0.3));
            shadeAt.push([x, z, 1.2 * s, 0.35]);
          }
          const deep = zone === 'woods';   // 북쪽 숲: 고사리·버섯·통나무가 더 많음
          for (let k = 0, nf = deep ? 5 : 3; k < nf; k++) put('fern', rx(), rz(), 0.8 + rnd() * 0.6, shade(0.3), 0.02);
          if (rnd() < (deep ? 0.5 : 0.3)) put('mushroom', rx(), rz(), 0.8 + rnd() * 0.6, shade(0.2), 0);
          if (rnd() < (deep ? 0.2 : 0.1)) {
            const s = 0.8 + rnd() * 0.3, t = shade(0.2);
            fallenLog(x0 + CELL / 2, z0 + CELL / 2, s, t, rnd() * Math.PI * 2);
          }
          continue;
        }

        // 물가: 갈대 (얕은 물가 띠에만), 연못 안: 연잎과 수련
        if (cave && ch === '~') continue;
        if (!cave && wl !== null && this.pondNear(x0 + 1, z0 + 1)) {
          for (let k = 0; k < 6; k++) {
            const x = rx(), z = rz(), h = this.groundHeight(x, z);
            if (h > wl - 0.35 && h < wl + 0.25 && rnd() < 0.45) put('reeds', x, z, 0.8 + rnd() * 0.5, shade(0.25), 0.05);
          }
          if (ch === '~') {
            for (let k = 0; k < 3; k++) {
              const x = rx(), z = rz();
              if (this.groundHeight(x, z) > wl - 0.5) continue;
              put('lily', x, z, 0.8 + rnd() * 0.6, shade(0.2), 0, wl + 0.01);
              if (rnd() < 0.35) put('flower', x + 0.08, z + 0.05, 0.6, [1, 0.55, 0.75], 0, wl - 0.13);
            }
            continue;
          }
        }

        if (ch === 'E') {   // 출구: 돌 아치. 뒤쪽 숲(#) 방향이 통로
          const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([i, j]) => this.cell(cx + i, cz + j) === '#') || [1, 0];
          const gx = x0 + CELL / 2, gz = z0 + CELL / 2, gy = this.groundHeight(gx, gz);
          put('gate', gx, gz, 1, [1, 1, 1], 0.05, null, Math.atan2(nb[0], nb[1]));
          const px = nb[1], pz = -nb[0];   // 기둥이 놓이는 방향 (통로와 수직)
          this.addCollider(gx + px * 1.45, gz + pz * 1.45, 0.5);
          this.addCollider(gx - px * 1.45, gz - pz * 1.45, 0.5);
          this.gate = { x: gx, y: gy, z: gz, dx: nb[0], dz: nb[1], px, pz };
          shadeAt.push([gx, gz, 2.5, 0.3]);
          continue;
        }

        if (ch === 'h') {   // 집: 붙어 있는 h 칸 한 덩어리가 집 한 채 (왼쪽 위 칸에서 한 번만)
          if (this.cell(cx - 1, cz) !== 'h' && this.cell(cx, cz - 1) !== 'h') this.buildHouse(cx, cz, put, shadeAt);
          continue;
        }
        const mx = x0 + CELL / 2 + (rnd() - 0.5) * 0.6, mz = z0 + CELL / 2 + (rnd() - 0.5) * 0.6;
        if (cave) {
          this.buildCaveCell(ch, cx, cz, mx, mz, rx, rz, put, shade, shadeAt, rnd);
          continue;
        }
        if ('FWLcAJNKD'.includes(ch)) this.buildVillageCell(ch, cx, cz, x0 + CELL / 2, z0 + CELL / 2, put, shade, shadeAt, rnd);
        if (ch === 'X') {   // 무너진 돌기둥
          const s = 0.9 + rnd() * 0.3;
          put('ruin', mx, mz, s, shade(0.15), 0.1);
          this.addCollider(mx, mz, 0.65 * s);
          shadeAt.push([mx, mz, 1.8 * s, 0.45]);
        }
        // 오픈월드: 이 칸의 구역 (나무·바위 모양은 경계에서 섞어 고르고, 바닥 소품은 가장 강한 구역으로)
        const here = this.bio ? this.biomeMax(x0 + 1, z0 + 1) : null;
        const plazaC = this.villageBox ? this.plazaAmount(x0 + 1, z0 + 1) : 0;   // 마을 돌바닥인 정도 (칸 가운데)
        if (ch === 'T') {
          const zone = this.bio ? this.pickZone(mx, mz, dress()) : null;
          const name = tree(mx, mz, zone);
          this.addCollider(mx, mz, TREE_COLLIDER[name] || 0.4);
          if (rnd() < 0.5 && name !== 'windPine') put('mushroom', mx + 0.5, mz + 0.3, 0.8, shade(0.2), 0);
          for (let k = 0, n = zone === 'woods' ? 6 : 3; k < n; k++) {   // 나무 밑 낙엽 (북쪽 숲은 수북이, 그늘진 갈색으로)
            const a = rnd() * 6.28, d = 0.6 + rnd() * 1.2, x = mx + Math.cos(a) * d, z = mz + Math.sin(a) * d, s = 0.8 + rnd() * 0.5;
            put('litter', x, z, s, zone === 'woods' ? shade(0.3).map((v) => v * 0.72) : shade(0.3), -0.01);
          }
        }
        if (ch === 'R') {
          if (here === 'hills' && dress() < 0.6) {   // 바위 언덕: 낮고 넓은 바위 더미 + 굴러떨어진 돌
            const s = 0.5 + dress() * 0.2;
            put('cragB', mx, mz, s, dshade(0.18), 0.2, null, dress() * 6.28);
            this.addCollider(mx, mz, 1.35 * s);
            shadeAt.push([mx, mz, 2.6 * s, 0.45]);
            for (let k = 0; k < 2; k++) put('rock', rx(), rz(), 0.25 + dress() * 0.2, dshade(0.2), 0.05, null, dress() * 6.28);
          } else {
            const s = 0.9 + rnd() * 0.5;
            put('rock', mx, mz, s, shade(0.2), 0.1);
            this.addCollider(mx, mz, 0.85 * s);
            shadeAt.push([mx, mz, 1.4 * s, 0.45]);
            for (let k = 0; k < 2; k++) put('rock', rx(), rz(), 0.25 + rnd() * 0.2, shade(0.2));
          }
        }
        if (ch === 'b') {
          const s = 1 + rnd() * 0.4;
          put('bush', mx, mz, s, shade(0.3));
          this.addCollider(mx, mz, 0.7 * s);
          shadeAt.push([mx, mz, 1.2 * s, 0.35]);
          if (here === 'marsh') for (let k = 0; k < 2; k++) put('reeds', rx(), rz(), 0.8 + dress() * 0.5, dshade(0.25), 0.05, null, dress() * 6.28);   // 늪: 덤불 둘레 갈대
        }
        if (ch === 'G') this.buildStoneRing(x0 + CELL / 2, z0 + CELL / 2, ctx);
        if (ch === 'M') {   // 버섯 고리 (요정의 고리): 버섯 일곱 무리가 둥글게. 가운데는 비어 있고 지나갈 수 있음
          const a0 = dress() * 6.28;
          for (let k = 0; k < 7; k++) {
            const a = a0 + (k / 7) * Math.PI * 2 + (dress() - 0.5) * 0.3, r = 1.2 + (dress() - 0.5) * 0.25;
            put('mushroom', x0 + 1 + Math.cos(a) * r, z0 + 1 + Math.sin(a) * r, 1.7 + dress() * 0.6, dshade(0.15), 0, null, dress() * 6.28);
          }
          for (let k = 0; k < 4; k++) put('litter', rx(), rz(), 0.8 + dress() * 0.5, dshade(0.3), -0.01, null, dress() * 6.28);
        }
        // 숲 바로 옆 풀밭엔 고사리가 자람 (북쪽 숲은 거의 늘, 늪은 고사리 대신 갈대, 바위 언덕은 굴러떨어진 돌)
        const besideForest = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => this.cell(cx + i, cz + j) === '#');
        if (besideForest && rnd() < (here === 'woods' ? 0.9 : 0.5)) {
          const x = rx(), z = rz(), s = 0.7 + rnd() * 0.5, t = shade(0.3);
          if (here === 'marsh') put('reeds', x, z, s + 0.1, t, 0.05);
          else if (here === 'hills') put('rock', x, z, s * 0.4, t, 0.05);
          else put('fern', x, z, s, t, 0.02);
        }
        if (besideForest && rnd() < 0.5) put('litter', rx(), rz(), 0.8 + rnd() * 0.5, shade(0.3), -0.01);
        // 둘레 여덟 칸이 모두 트인 풀밭인지 (충돌이 있는 통나무·큰 돌은 이런 곳에만: 다른 바위·나무와 붙어 좁은 길을 막지 않게)
        const clear = () => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].every(([i, j]) => '.f'.includes(this.cell(cx + i, cz + j)));
        if (here === 'woods' && this.dirtAmount(x0 + 1, z0 + 1) < 0.3) {   // 북쪽 숲 바닥: 군데군데 고사리와 낙엽, 드물게 쓰러진 통나무
          if (dress() < 0.3) put('fern', x0 + 0.3 + dress() * 1.4, z0 + 0.3 + dress() * 1.4, 0.7 + dress() * 0.5, dshade(0.3), 0.02, null, dress() * 6.28);
          for (let k = 0, n = dress() < 0.4 ? 2 : 0; k < n; k++) put('litter', x0 + dress() * 2, z0 + dress() * 2, 0.8 + dress() * 0.5, dshade(0.3).map((v) => v * 0.72), -0.01, null, dress() * 6.28);
          if (ch === '.' && clear() && dress() < 0.05 && this.roadWide(x0 + 1, z0 + 1) < 0.05) fallenLog(x0 + 1, z0 + 1, 0.85 + dress() * 0.3, dshade(0.2), dress() * 6.28);
        }
        if (here === 'hills' && ch === '.' && dress() < 0.1 && this.roadWide(x0 + 1, z0 + 1) < 0.05 && clear()) {   // 바위 언덕: 흩어진 큰 돌
          const s = 0.5 + dress() * 0.35;
          put('rock', mx, mz, s, dshade(0.2), 0.12, null, dress() * 6.28);
          this.addCollider(mx, mz, 0.8 * s);
          shadeAt.push([mx, mz, 1.3 * s, 0.4]);
        }
        for (let k = 0; k < 2; k++) {   // 흙길 위 자갈 (돌바닥 위엔 없음)
          const x = rx(), z = rz();
          if (this.dirtAmount(x, z) > 0.55 && plazaC < 0.3) put('pebbles', x, z, 0.6 + rnd() * 0.6, shade(0.2), 0.02);
        }
        // 초원 꽃밭: 꽃 무더기 (무더기 하나 = 꽃 7송이). 꽃밭마다 주인공 색 하나 + 가끔 다른 색 (나비가 모여듦)
        const carpet = this.bio && '.f'.includes(ch) ? this.carpetAt(x0 + 1, z0 + 1) : 0;
        if (carpet > 0.05) {
          for (let k = 0, n = Math.round(carpet * DRESS.carpetClumps); k < n; k++) {
            const x = x0 + 0.2 + dress() * (CELL - 0.4), z = z0 + 0.2 + dress() * (CELL - 0.4);
            const c = dress() < 0.15 ? MEADOW_FLOWERS[(dress() * MEADOW_FLOWERS.length) | 0] : MEADOW_FLOWERS[this.carpetHue(x, z)];
            if (this.dirtAmount(x, z) < 0.3 && !this.isWet(x, z)) put('flowerClump', x, z, 0.85 + dress() * 0.35, c, 0, null, dress() * 6.28);
          }
          if (carpet > 0.6) this.flowerSpots.push([x0 + 1, this.groundHeight(x0 + 1, z0 + 1), z0 + 1, 1]);
        }
        // 마을 울타리 안쪽 가장자리: 울타리를 따라 들꽃
        if (plazaC < 0.2 && ch === '.' && this.villageAmount(x0 + 1, z0 + 1) > 0.3 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => this.cell(cx + i, cz + j) === 'F') && dress() < 0.6) {
          for (let k = 0, n = 3 + ((dress() * 3) | 0); k < n; k++) {
            const x = x0 + 0.2 + dress() * (CELL - 0.4), z = z0 + 0.2 + dress() * (CELL - 0.4);
            if (this.dirtAmount(x, z) < 0.3) put('flower', x, z, 0.8 + dress() * 0.4, FLOWER_COLORS[(dress() * FLOWER_COLORS.length) | 0], 0, null, dress() * 6.28);
          }
        }
        if (ch === 'f') this.flowerSpots.push([x0 + CELL / 2, this.groundHeight(x0 + CELL / 2, z0 + CELL / 2), z0 + CELL / 2]);
        const flowers = ch === 'f' ? 16 : rnd() < 0.15 ? 1 : 0;
        const main = ch === 'f' && deco() < 0.65 ? BLUE_FLOWERS[(deco() * BLUE_FLOWERS.length) | 0] : null;   // 꽃밭은 대부분 한 가지 파란 꽃으로
        for (let k = 0; k < flowers; k++) {
          const x = rx(), z = rz();
          if (this.dirtAmount(x, z) < 0.3 && !this.isWet(x, z) && plazaC < 0.3) {
            const s = 0.8 + rnd() * 0.5, c = FLOWER_COLORS[(rnd() * FLOWER_COLORS.length) | 0];   // (rnd 순서는 예전 그대로)
            put('flower', x, z, s, main && deco() < 0.8 ? main : c, 0);
          }
        }
        // 금빛 풀밭 가장자리엔 파란 들꽃 무더기 (위치·색·방향 모두 deco 난수)
        const cg = this.goldAmount(x0 + CELL / 2, z0 + CELL / 2);
        if (cg > 0.15 && cg < 0.75 && deco() < 0.35) {
          const bx = x0 + 0.4 + deco() * (CELL - 0.8), bz = z0 + 0.4 + deco() * (CELL - 0.8);
          const bc = BLUE_FLOWERS[(deco() * BLUE_FLOWERS.length) | 0];
          for (let k = 0, n = 4 + ((deco() * 5) | 0); k < n; k++) {
            const x = bx + (deco() - 0.5) * 0.9, z = bz + (deco() - 0.5) * 0.9;
            if (this.dirtAmount(x, z) < 0.3 && !this.isWet(x, z)) put('flower', x, z, 1.0 + deco() * 0.6, bc, 0, null, deco() * Math.PI * 2);
          }
        }
        // 오픈월드 늪: 얕은 웅덩이 가장자리엔 갈대, 조금 깊은 물엔 연잎
        if (this.bio && wl !== null) {
          const mw = this.bioMix(x0 + 1, z0 + 1, this._bw)[3];
          for (let k = 0; mw > 0.4 && k < 5; k++) {
            const x = x0 + 0.15 + wet() * (CELL - 0.3), z = z0 + 0.15 + wet() * (CELL - 0.3), h = this.groundHeight(x, z), r = wet(), t = 0.85 + wet() * 0.3;
            if (this.dirtAmount(x, z) > 0.4) continue;   // 물에 잠긴 흙길 위는 비워 둠 (걸어가는 길이 보이게)
            if (h > wl - 0.22 && h < wl + 0.12 && r < 0.5 * mw) put('reeds', x, z, 0.7 + wet() * 0.6, [t, t, t * 0.95], 0.05, null, wet() * 6.28);
            else if (h < wl - 0.14 && r < 0.3 * mw) put('lily', x, z, 0.6 + wet() * 0.6, [t, t, t], 0, wl + 0.01, wet() * 6.28);
          }
        }
        const bw = this.bio ? this.bioMix(x0 + 1, z0 + 1, this._bw) : null, thin = bw ? bw[3] * 0.4 + bw[4] * 0.25 : 0;   // 늪은 풀이 듬성듬성 (웅덩이가 보이게), 언덕도 조금 (땅의 층과 바위가 보이게)
        const lawn = this.villageBox ? this.villageAmount(x0 + 1, z0 + 1) : 0;   // 마을 울타리 안: 짧게 깎은 푸른 잔디
        const thin2 = bw ? bw[2] * DRESS.woodsThin + carpet * 0.85 + lawn * DRESS.lawnThin : 0;   // 북쪽 숲 바닥(이끼·낙엽이 보이게)·꽃밭(꽃이 풀에 묻히지 않게)·마을 잔디도 풀을 솎음
        for (let k = 0; k < tufts; k++) {
          if (thin && wet() < thin) continue;
          if (thin2 && dress() < thin2) continue;
          const x = x0 + rnd() * CELL, z = z0 + rnd() * CELL;
          if (this.dirtAmount(x, z) < 0.35 + rnd() * 0.2 && !this.isWet(x, z) && !(this.bio && this.rockAmount(x, z) > 0.3 + 0.4 * wet())) {   // (바위 비탈엔 풀이 드묾)
            if (lawn > 0 && this.plazaAmount(x, z) > 0.25) continue;   // 돌바닥 사이로 풀이 솟지 않게
            if (here === 'woods' && this.fairySpots.some(([fx, fz]) => Math.hypot(x - fx, z - fz) < 2.4)) continue;   // 버섯 고리 둘레는 풀 없는 이끼 바닥
            // 금빛 풀밭 위는 금빛 마른 풀 (경계에선 섞여 들쭉날쭉), 그 밖에도 드문드문 한 포기씩. 마을 잔디엔 없음
            const g = this.goldAmount(x, z);
            const dry = (deco() < g * 1.3 - 0.15 || deco() < 0.03) && lawn < 0.5;
            put(dry ? 'grassGold' : 'grass', x, z, (0.8 + rnd() * 0.45) * (1 - DRESS.lawnCut * lawn - 0.3 * carpet), this.grassTint(x, z, shade(0.2), dry), 0.02);   // 풀 색은 그 자리 땅 색을 따라감 (마을 잔디·꽃밭은 짧게)
          }
        }
      }
    }

    // 천장 구멍 가장자리를 따라 늘어진 덩굴 (구멍으로 들어온 햇빛을 받아 반짝임)
    if (cave) {
      for (const [hx, hz] of this.holes) {
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2 + rnd() * 0.5, r = 2.0 + rnd() * 0.5, x = hx + Math.cos(a) * r, z = hz + Math.sin(a) * r;
          inst.vines.push(x, this.ceilAt(x, z) + 0.1, z, rnd() * Math.PI * 2, 0.8 + rnd() * 0.5, 1, 1, 1);
        }
      }
    }
    this.meshes = [{ mesh: GL.createMesh(this.buildGround(shadeAt)), cull: true, ground: true }];
    if (cave) this.meshes.push({ mesh: GL.createMesh(this.buildCeiling()), cull: false, shadow: true, ao: 0 });
    else this.meshes.push({ mesh: GL.createMesh(buildMountains((this.cols * CELL) / 2, (this.rows * CELL) / 2, LIGHTING[this.level.theme].mountainScale || 1)), cull: false, fog: 0.0019 });   // 산 높이는 테마별 (숲은 지평선 위로 낮게)
    for (const name in inst) {
      if (!inst[name].length) continue;
      const st = PROP_STYLE[name];
      const { sorted, parts } = groupByChunk(inst[name], extentOf(Models[name]), !!st.grass && !!st.dist);   // 풀 종류는 포기마다 사라지는 거리 순서로
      const g = CONFIG.graphics;   // 풀은 품질 설정을 따름 (휴대폰은 가까이만, 먼 구역은 풀잎 절반)
      const sm = st.thin ? null : shadowModel(Models.far[name] || Models[name]);
      this.meshes.push({ mesh: GL.createMesh(Models[name], sorted, parts), cull: !st.thin, shadow: !st.thin,
        ao: st.ao || 0, grass: !!st.grass, rim: st.rim || 0, dist: (st.lod && g.grassDist) || st.dist || 0, lod: st.lod ? g.grassLod || 0 : 0,
        fadeStart: st.grass && st.dist ? (st.lod ? g.grassFadeStart ?? 0.45 : 0.72) : 0,   // 풀 포기가 하나둘 사라지기 시작하는 거리 (그리는 거리에 대한 비율. 풀밭은 config.js grassFadeStart)
        far: Models.far[name] ? GL.createMesh(Models.far[name], sorted, parts) : null,   // 나무: 멀리 있는 구역은 면이 적은 모양으로
        shadowMesh: sm ? GL.createMesh(sm, sorted, parts) : null });   // 그림자 지도에는 카메라를 향한 잎 판을 뺀 모양 (그림자는 같음)
    }

    if (cave) this.shafts = this.holes.length ? GL.createMesh(this.buildShafts()) : null;
    // 숲 너머: 완만한 언덕과 그 위를 덮은 먼 숲 (안개 속에 겹겹이 보임)
    const cxm = (this.cols * CELL) / 2, czm = (this.rows * CELL) / 2;
    const halfW = cxm + MARGIN * CELL, halfH = czm + MARGIN * CELL;
    const far = [];
    for (let k = 0; k < (cave ? 0 : 1800); k++) {
      const a = rnd() * Math.PI * 2, d = 40 + rnd() * 150;
      const x = cxm + Math.cos(a) * d, z = czm + Math.sin(a) * d;
      if (Math.abs(x - cxm) < halfW + 2 && Math.abs(z - czm) < halfH + 2) continue;   // 가까운 숲은 이미 있음
      const skirt = this.hgrid ? this.skirtHeight(x, z) : -2.5 * Utils.clamp((d - 45) / 195, 0, 1);   // 바깥 들판 높이 (대략)
      const t = shade(0.3);
      far.push(x, Math.max(hillHeight(x, z, cxm, czm), skirt) - 0.3, z, rnd() * 6.28, 0.8 + rnd() * 0.9, t[0], t[1], t[2]);
    }
    if (!cave) {
      const farGroups = groupByChunk(far, extentOf(Models.farTree));
      this.meshes.push({ mesh: GL.createMesh(Models.farTree, farGroups.sorted, farGroups.parts), cull: true, fog: 0.006 });
      this.meshes.push({ mesh: GL.createMesh(buildHills(cxm, czm)), cull: false, fog: 0.006 });
    }
    this.water = wl === null ? null : GL.createMesh(this.buildWater());

    // 출구의 마법 장벽(아치 사이 판)과 열린 뒤의 빛기둥
    if (this.gate) {
      const g = this.gate, b = new MeshBuilder(), n = [g.dx, 0, g.dz];
      const corner = (side, up) => [g.x + g.px * 1.1 * side, g.y - 0.1 + up * 3.2, g.z + g.pz * 1.1 * side];
      const q = [corner(-1, 0), corner(1, 0), corner(1, 1), corner(-1, 1)];
      const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (const k of [0, 1, 2, 0, 2, 3]) b.vert(q[k], n, [1, 1, 1, 0], 0, uv[k]);
      this.barrier = GL.createMesh(b);
      const pb = new MeshBuilder();
      Shapes.cylinder(pb, M4.translation(g.x, g.y - 0.2, g.z), 1.1, 0.8, 9, 18, () => [1, 1, 1, 0], { smooth: true, top: false });
      this.pillar = GL.createMesh(pb);
    }
  },

  // ---------- 구역별 풍경: 숲 벽(#) 한 칸을 구역 모양으로 (오픈월드) ----------
  // 언덕 = 층진 바위 더미(가끔 꼭대기에 휜 소나무)와 흩어진 돌, 늪 = 버드나무·죽은 나무와 덤불·갈대, 초원 = 낮은 산울타리(덤불 줄) 너머 듬성듬성한 나무
  // (지나갈 수 없는 건 예전처럼 칸째로 막힘. 가장자리 큰 바위는 트인 쪽으로 튀어나오지 않게 안쪽으로 비켜 놓고, 튀어나온 만큼 충돌 원을 둠)
  dressWall(zone, cx, cz, { put, dshade, shadeAt, tree, dress }) {
    const x0 = cx * CELL, z0 = cz * CELL;
    const rx = () => x0 + 0.15 + dress() * (CELL - 0.3), rz = () => z0 + 0.15 + dress() * (CELL - 0.3);
    const edge = this.nearOpen(cx, cz);
    let near2 = edge;
    for (let j = -2; j <= 2 && !near2; j++) for (let i = -2; i <= 2 && !near2; i++) near2 = this.cell(cx + i, cz + j) !== '#';
    if (zone === 'hills') {
      if (near2) {
        const [ax, az] = this.awayFromOpen(cx, cz), k = edge ? 0.5 : 0.2;
        const s = edge ? 0.72 + dress() * 0.3 : 0.95 + dress() * 0.35;
        const x = x0 + 1 + ax * k + (dress() - 0.5) * 0.4, z = z0 + 1 + az * k + (dress() - 0.5) * 0.4;
        this.putCrag(put, x, z, s, dshade, dress, edge ? 0.22 : 0.3);
        shadeAt.push([x, z, 2.2 * s, 0.4]);
        if (edge) {
          this.addCollider(x, z, 1.15 * s);
          for (let k2 = 0, n = 2 + (dress() < 0.5 ? 1 : 0); k2 < n; k2++) put('rock', rx(), rz(), 0.28 + dress() * 0.3, dshade(0.2), 0.05, null, dress() * 6.28);
        }
      } else if (dress() < 0.65) {   // 깊은 안쪽: 큰 바위나 바위 더미 (넘어다 보이는 뒤쪽 바위 능선)
        if (dress() < 0.45) put('rock', rx(), rz(), 2.2 + dress() * 1.4, dshade(0.2), 0.6, null, dress() * 6.28);
        else this.putCrag(put, rx(), rz(), 1.05 + dress() * 0.4, dshade, dress, 0.25);
      } else if (dress() < 0.3) tree(rx(), rz(), 'hills');
      return;
    }
    if (zone === 'marsh') {
      if (edge || dress() < 0.6) tree(rx(), rz(), 'marsh');
      if (!edge) return;
      for (let k = 0, n = dress() < 0.5 ? 2 : 1; k < n; k++) {
        const x = rx(), z = rz(), s = 0.8 + dress() * 0.5;
        put('bush', x, z, s, dshade(0.3), 0.05, null, dress() * 6.28);
        shadeAt.push([x, z, 1.2 * s, 0.35]);
      }
      for (let k = 0; k < 2; k++) put('reeds', rx(), rz(), 0.8 + dress() * 0.5, dshade(0.25), 0.05, null, dress() * 6.28);
      return;
    }
    // 초원: 가장자리는 덤불을 줄지어 심은 산울타리, 그 뒤 한 줄은 나무가 드문드문, 더 먼 곳은 탁 트인 들판에 나무 몇 그루
    const bush = (s) => {
      const x = rx(), z = rz();
      put('bush', x, z, s, dshade(0.3), 0.05, null, dress() * 6.28);
      shadeAt.push([x, z, 1.3 * s, 0.35]);
    };
    if (edge) {
      for (let k = 0; k < 3; k++) bush(1.1 + dress() * 0.4);
      if (dress() < 0.15) tree(rx(), rz(), 'meadow');
    } else if (near2) {
      if (dress() < 0.4) tree(rx(), rz(), 'meadow');
      if (dress() < 0.5) bush(1.0 + dress() * 0.5);
    } else {
      if (dress() < 0.1) tree(rx(), rz(), 'meadow');
      if (dress() < 0.15) bush(0.9 + dress() * 0.5);
    }
  },

  // 층진 바위 더미 하나 (+ pine 확률로 꼭대기에 바람에 휜 소나무: 모델에 적어 둔 맨 윗돌 자리 Models.crag.top을 따라감)
  putCrag(put, x, z, s, tint, dress, pine) {
    const rot = dress() * 6.28, sink = 0.6, name = dress() < 0.45 ? 'cragB' : 'crag';   // 높은 것·낮고 넓은 것 두 가지를 섞음
    put(name, x, z, s, tint(0.18), sink, null, rot);
    if (dress() >= pine) return;
    const t = Models[name].top, c = Math.cos(rot), sn = Math.sin(rot);
    const px = x + (c * t[0] + sn * t[2]) * s, pz = z + (-sn * t[0] + c * t[2]) * s;
    put('windPine', px, pz, 0.5 + dress() * 0.3, tint(0.2), 0, this.groundHeight(x, z) - sink + t[1] * s - 0.2, (dress() - 0.5) * 0.5);
  },

  // 선돌 고리 (초원의 G 칸, 둔덕 위): 반지름 3.5m 둘레에 돌 여섯 — 다섯은 서 있고 하나는 쓰러져 누움. 첫 두 돌 위엔 덮개돌
  buildStoneRing(gx, gz, { put, dshade, shadeAt, dress }) {
    const R = DRESS.ringRadius, a0 = 0.35, sink = 0.15, H = 2.6;   // H: 선돌 모델 높이 (art.js buildStandingStone)
    const spot = (k) => {
      const a = a0 + (k / 6) * Math.PI * 2;
      return [gx + Math.cos(a) * R, gz + Math.sin(a) * R, a];
    };
    const g0 = this.groundHeight(...spot(0).slice(0, 2)), g1 = this.groundHeight(...spot(1).slice(0, 2));
    const top = Math.max(g0, g1) - sink + H;   // 덮개돌을 받치는 두 돌은 꼭대기 높이를 맞춤
    for (let k = 0; k < 6; k++) {
      const [x, z, a] = spot(k), gy = this.groundHeight(x, z);
      if (k === 4) {   // 쓰러져 누운 돌 (덮개돌 모양을 작게): 길이를 따라 충돌 원 둘
        const rot = -a + 0.5, ax = Math.cos(rot), az = -Math.sin(rot);
        put('stoneLintel', x, z, 0.62, dshade(0.1), 0, gy + 0.08, rot);
        for (const o of [-0.7, 0.7]) this.addCollider(x + ax * o, z + az * o, 0.4);
        shadeAt.push([x, z, 1.6, 0.3]);
        continue;
      }
      const s = k < 2 ? (top - (gy - sink)) / H : 0.92 + dress() * 0.16;
      put('standingStone', x, z, s, dshade(0.1), sink, null, -a - Math.PI / 2 + (dress() - 0.5) * 0.25);   // 넓은 면이 고리 가운데를 향함
      this.addCollider(x, z, 0.45);
      shadeAt.push([x, z, 1.3, 0.35]);
    }
    const [xa, za] = spot(0), [xb, zb] = spot(1);
    put('stoneLintel', (xa + xb) / 2, (za + zb) / 2, 1, dshade(0.1), 0, top + 0.27, Math.atan2(-(zb - za), xb - xa));
  },

  // 집 한 채: (cx, cz)에서 오른쪽·아래로 이어진 h 칸 덩어리 크기대로 (2칸 = 작은 집, 3칸 = 긴 집). 문은 마을 가운데 쪽을 향함
  buildHouse(cx, cz, put, shadeAt) {
    let w = 1, d = 1;
    while (this.cell(cx + w, cz) === 'h') w++;
    while (this.cell(cx, cz + d) === 'h') d++;
    const hx = (cx + w / 2) * CELL, hz = (cz + d / 2) * CELL;
    const vz = (this.level.zones || []).find((z) => z.kind === 'village');
    const vx = vz ? ((vz.rect[0] + vz.rect[2] + 1) / 2) * CELL : (this.cols * CELL) / 2, vzz = vz ? ((vz.rect[1] + vz.rect[3] + 1) / 2) * CELL : (this.rows * CELL) / 2;
    const dx = vx - hx, dz = vzz - hz;
    const open = (i, j) => '.:f'.includes(this.cell(cx + (i > 0 ? w : i < 0 ? -1 : 0), cz + (j > 0 ? d : j < 0 ? -1 : 0)));
    let dir;   // 문이 향할 방향 (마을 가운데 쪽이 트여 있으면 그쪽, 아니면 트인 다른 쪽). 긴 집은 긴 쪽 면에만 문이 날 수 있음
    const long = w !== d;
    let cands = Math.abs(dx) > Math.abs(dz) ? [[Math.sign(dx) || 1, 0], [0, Math.sign(dz) || 1], [0, 1], [0, -1], [1, 0], [-1, 0]]
      : [[0, Math.sign(dz) || 1], [Math.sign(dx) || 1, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
    if (long) cands = cands.filter((c) => (w > d ? c[0] === 0 : c[1] === 0));
    for (const c of cands) if (open(c[0], c[1])) { dir = c; break; }
    dir = dir || cands[0];
    const rot = Math.atan2(-dir[0], -dir[1]);   // 모델의 앞(-z)이 dir을 향하도록 (긴 집 모델은 x 방향으로 긺)
    // 집 모양: 작은 집은 초가 둘, 긴 집은 기와 둘 중 칸 위치로 골라 이웃끼리 달라 보이게 (village.js의 HOUSE_STYLES)
    const name = long ? ((cx & 1) ? 'houseD' : 'houseB') : (((cx + (cz >> 1)) & 1) ? 'houseC' : 'house');
    put(name, hx, hz, 1, [1, 1, 1], 0.15, null, rot);
    shadeAt.push([hx, hz, Math.max(w, d) * CELL * 0.7, 0.45]);
    // 이번에 만드는 마을의 굴뚝·등불 자리 (World.build가 빛 목록을 새로 만들 때마다 함께 새로 시작. village.js가 연기·깃발 줄에 씀)
    const V = this.village && this.village.lights === this.lights ? this.village : (this.village = { lights: this.lights, chimneys: [], lanterns: [] });
    const model = Models[name], gy = this.groundHeight(hx, hz) - 0.15, c = Math.cos(rot), s = Math.sin(rot);
    const at = (p) => [hx + c * p[0] + s * p[2], gy + p[1], hz - s * p[0] + c * p[2]];   // 모델 좌표 → 세상 좌표 (셰이더의 instRot과 같은 회전)
    if (model.chimney) V.chimneys.push(at(model.chimney));
    if (model.windowLight) {   // 밤에만 켜지는 창문 불빛 (집마다 하나: 등불 넷 + 모닥불 + 집 다섯 = 10개로 빛 상한 12개 안)
      const l = at(model.windowLight);
      this.lights.push({ x: l[0], y: l[1], z: l[2], r: 6.5, color: WINDOW_LIGHT, flicker: 0, night: true });
    }
    if (model.door) {   // 문 앞 디딤돌: 돌계단 앞에서 바깥으로 네 개 (빈 땅에만)
      const sr = Utils.rng(cx * 131 + cz * 7 + 1), door = at(model.door);
      for (let i = 0; i < 4; i++) {
        const k = 1.0 + i * 0.72, j = (sr() - 0.5) * 0.24;
        const x = door[0] + dir[0] * k - dir[1] * j, z = door[2] + dir[1] * k + dir[0] * j;
        if (!'.:fP'.includes(this.cell(Math.floor(x / CELL), Math.floor(z / CELL)))) break;
        put('flagstone', x, z, 0.85 + sr() * 0.3, [1, 1, 1], 0.03, null, sr() * Math.PI * 2);
      }
    }
  },

  // 마을의 소품 한 칸: 울타리(F)·우물(W)·등불(L)·모닥불(c)·상자(A)·장터 가판대(J)·깃발 기둥(N)·이정표(K)·빨랫줄(D)
  buildVillageCell(ch, cx, cz, mx, mz, put, shade, shadeAt, rnd) {
    const gy = this.groundHeight(mx, mz);
    const V = this.village && this.village.lights === this.lights ? this.village : (this.village = { lights: this.lights, chimneys: [], lanterns: [] });
    // 새 소품(J·N·K·D)은 자기 난수를 써서, 공용 난수(rnd) 순서가 바뀌어 다른 나무·풀 배치가 달라지지 않게 함
    const road = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([i, j]) => this.cell(cx + i, cz + j) === ':');   // 옆의 흙길 방향
    if (ch === 'J') {   // 장터 가판대: 마을 가운데(광장) 쪽을 바라봄
      const vz = (this.level.zones || []).find((z) => z.kind === 'village');
      const dx = vz ? ((vz.rect[0] + vz.rect[2] + 1) / 2) * CELL - mx : 0, dz = vz ? ((vz.rect[1] + vz.rect[3] + 1) / 2) * CELL - mz : 1;
      const dir = Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz) || 1], rot = Math.atan2(-dir[0], -dir[1]);
      put('stall', mx, mz, 1, [1, 1, 1], 0.03, null, rot);
      for (const o of [-0.5, 0.5]) this.addCollider(mx + Math.cos(rot) * o, mz - Math.sin(rot) * o, 0.7);
      shadeAt.push([mx, mz, 1.6, 0.4]);
      return;
    }
    if (ch === 'N') {   // 깃발 기둥: 천이 흙길 쪽으로 늘어지게 (칸 x가 짝수면 파랑, 홀수면 적갈)
      const rot = road && road[0] < 0 ? Math.PI : 0;
      put((cx & 1) ? 'bannerB' : 'banner', mx, mz, 1, [1, 1, 1], 0.05, null, rot);
      this.addCollider(mx, mz, 0.25);
      return;
    }
    if (ch === 'K') {   // 이정표: 흙길 쪽을 바라봄
      const rot = road ? Math.atan2(-road[0], -road[1]) : 0;
      put('sign', mx, mz, 1, [1, 1, 1], 0.05, null, rot + (Utils.rng(cx * 977 + cz)() - 0.5) * 0.3);
      this.addCollider(mx, mz, 0.22);
      return;
    }
    if (ch === 'D') {   // 빨랫줄: 위·아래 칸에 집이 있으면 가로(x)로, 아니면 세로로. 기둥 둘만 막음
      const alongX = this.cell(cx, cz - 1) === 'h' || this.cell(cx, cz + 1) === 'h', rot = alongX ? 0 : Math.PI / 2;
      put('laundry', mx, mz, 1, [1, 1, 1], 0.05, null, rot);
      for (const o of [-1.4, 1.4]) this.addCollider(mx + (alongX ? o : 0), mz + (alongX ? 0 : -o), 0.15);
      return;
    }
    if (ch === 'F') {   // 울타리: 옆 칸에 울타리·집이 있으면 가로, 아니면 세로. 작은 원 셋으로 막음
      const alongX = 'Fh'.includes(this.cell(cx - 1, cz)) || 'Fh'.includes(this.cell(cx + 1, cz));
      put('fence', mx, mz, 1, shade(0.1), 0.05, null, alongX ? 0 : Math.PI / 2);
      for (const o of [-0.7, 0, 0.7]) this.addCollider(mx + (alongX ? o : 0), mz + (alongX ? 0 : o), 0.3);
    } else if (ch === 'W') {
      put('well', mx, mz, 1, [1, 1, 1], 0.08, null, rnd() * 6.28);
      this.addCollider(mx, mz, 0.95);
      shadeAt.push([mx, mz, 1.6, 0.4]);
    } else if (ch === 'L') {
      put('lantern', mx, mz, 1, [1, 1, 1], 0.05, null, rnd() * 6.28);
      this.addCollider(mx, mz, 0.22);
      this.lights.push({ x: mx, y: gy + 2.3, z: mz, r: 7, color: LANTERN_LIGHT, flicker: 0.3 + rnd() * 3 });
      V.lanterns.push([mx, gy, mz]);   // 등불 꼭대기끼리 삼각 깃발 줄을 이음 (village.js)
    } else if (ch === 'c') {
      put('campfire', mx, mz, 1, [1, 1, 1], 0.03, null, rnd() * 6.28);
      this.addCollider(mx, mz, 0.65);
      this.torches.push([mx, gy + 0.3, mz]);
      this.lights.push({ x: mx, y: gy + 0.9, z: mz, r: 9, color: TORCH_LIGHT, flicker: 1 + rnd() * 10 });
      for (let k = 0; k < 2; k++) put('log', mx + 1.2 * Math.cos(k * 2.5), mz + 1.2 * Math.sin(k * 2.5), 0.7, shade(0.2), 0.1, null, k * 2.5 + 1.57);   // 둘러앉는 통나무
      shadeAt.push([mx, mz, 1.2, 0.35]);
    } else if (ch === 'A') {
      const r = rnd(), name = r < 0.4 ? 'crate' : r < 0.7 ? 'barrel' : 'hay';
      put(name, mx, mz, 0.9 + rnd() * 0.25, shade(0.1), 0.03, null, rnd() * 6.28);
      this.addCollider(mx, mz, 0.6);
      shadeAt.push([mx, mz, 1.0, 0.35]);
    }
  },

  // 동굴의 빈 칸 하나: 수정(C)·횃불(t)·석순(S)·바위(R)·돌기둥(X)·천장 구멍(o) + 벽가의 빛나는 버섯, 자갈, 종유석
  buildCaveCell(ch, cx, cz, mx, mz, rx, rz, put, shade, shadeAt, rnd) {
    const gy = this.groundHeight(mx, mz);
    if (ch === 'C') {
      const s = 0.85 + rnd() * 0.35, tint = CRYSTAL_TINTS[(rnd() * 2) | 0];
      put('crystal', mx, mz, s, tint, 0.05);
      this.addCollider(mx, mz, 0.7 * s);
      this.lights.push({ x: mx, y: gy + 1.3 * s, z: mz, r: 8, color: tint.map((v) => v * 1.5), flicker: 0 });
      for (let k = 0; k < 2; k++) put('crystal', rx(), rz(), 0.25 + rnd() * 0.2, tint, 0.03);   // 둘레의 작은 수정
    }
    if (ch === 't') {
      put('torch', mx, mz, 1, [1, 1, 1], 0.02);
      this.addCollider(mx, mz, 0.35);
      this.torches.push([mx, gy + 1.72, mz]);
      this.lights.push({ x: mx, y: gy + 2.1, z: mz, r: 10, color: TORCH_LIGHT, flicker: 1 + rnd() * 10 });
    }
    if (ch === 'S') {
      const s = 0.8 + rnd() * 0.5;
      put('stalagmite', mx, mz, s, shade(0.2), 0.05);
      this.addCollider(mx, mz, 0.5 * s);
      shadeAt.push([mx, mz, 1.2 * s, 0.4]);
    }
    if (ch === 'R') {
      const s = 0.9 + rnd() * 0.5;
      put('rock', mx, mz, s, [0.75, 0.72, 0.68], 0.1);
      this.addCollider(mx, mz, 0.85 * s);
      shadeAt.push([mx, mz, 1.4 * s, 0.45]);
    }
    if (ch === 'X') {
      const s = 0.9 + rnd() * 0.3;
      put('ruin', mx, mz, s, [0.8, 0.78, 0.75], 0.1);
      this.addCollider(mx, mz, 0.65 * s);
      shadeAt.push([mx, mz, 1.8 * s, 0.45]);
    }
    // 벽 바로 옆: 빛나는 버섯, 굴러떨어진 돌
    const besideWall = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => this.cell(cx + i, cz + j) === '#');
    if (besideWall && rnd() < 0.35) put('glowShroom', rx(), rz(), 0.8 + rnd() * 0.6, [1, 1, 1], 0);
    if (besideWall && rnd() < 0.5) put('rock', rx(), rz(), 0.3 + rnd() * 0.3, [0.7, 0.68, 0.64]);
    for (let k = 0; k < 2; k++) {   // 길 위 자갈
      const x = rx(), z = rz();
      if (this.dirtAmount(x, z) > 0.55) put('pebbles', x, z, 0.6 + rnd() * 0.6, [0.8, 0.78, 0.74], 0.02);
    }
    if (rnd() < 0.25) put('pebbles', rx(), rz(), 0.5 + rnd() * 0.5, [0.75, 0.73, 0.7], 0.02);
    // 천장에 매달린 종유석 (구멍 근처는 빼고)
    if (rnd() < 0.3) {
      const x = rx(), z = rz();
      if (!this.inHole(x, z, 1.2)) put('stalactite', x, z, 0.7 + rnd() * 0.7, shade(0.2), 0, this.ceilAt(x, z) + 0.15);
    }
  },

  // 동굴 천장: 1m 격자, 아래를 향한 면. 구멍 자리는 비움 (햇빛이 들어와 그림자 지도로 바닥에 빛 웅덩이가 생김)
  buildCeiling() {
    const b = new MeshBuilder();
    const pad = MARGIN * CELL + 6;
    const x0 = -pad, z0 = -pad, nx = Math.round(this.cols * CELL + pad * 2), nz = Math.round(this.rows * CELL + pad * 2);
    const rnd = Utils.rng(5);
    const pt = (x, z) => {
      const e = 0.5, h = this.ceilAt(x, z);
      const n = V3.normalize([this.ceilAt(x + e, z) - this.ceilAt(x - e, z), -2 * e, this.ceilAt(x, z + e) - this.ceilAt(x, z - e)]);
      return { p: [x, h, z], n };
    };
    const P = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) P.push(pt(x0 + i, z0 + j));
    const at = (i, j) => P[j * (nx + 1) + i];
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        if (this.inHole(x0 + i + 0.5, z0 + j + 0.5)) continue;
        const c = vary(COLORS.caveCeil, 0.1, rnd);
        for (const [a, bb] of [[0, 0], [1, 1], [1, 0], [0, 0], [0, 1], [1, 1]]) {
          const q = at(i + a, j + bb);
          b.vert(q.p, q.n, c);
        }
      }
    }
    return b;
  },

  // 천장 구멍마다 비스듬한 빛기둥 (구멍 → 바닥, 빛을 더해 그림)
  buildShafts() {
    const b = new MeshBuilder();
    for (const [hx, hz, fx, fz] of this.holes) {
      const top = [hx, this.ceilAt(hx, hz) + 0.5, hz], bottom = [fx, this.groundHeight(fx, fz) - 0.3, fz];
      Shapes.segment(b, bottom, top, 2.0, 1.8, 20, () => [1, 1, 1, 0], { smooth: true, top: false });
    }
    return b;
  },

  // 땅: 1m 간격 격자. 높이는 언덕, 색은 풀밭·흙길·숲 바닥을 섞고 나무 밑은 어둡게. 바깥은 멀리까지 넓게 깔기
  buildGround(shadeAt) {
    const b = new MeshBuilder();
    const pad = MARGIN * CELL + 20;
    const x0 = -pad, z0 = -pad;
    const nx = Math.round(this.cols * CELL + pad * 2), nz = Math.round(this.rows * CELL + pad * 2);
    const idx = (i, j) => j * (nx + 1) + i;

    // 나무·바위 밑 그늘 모으기
    const occ = new Float32Array((nx + 1) * (nz + 1));
    for (const [ox, oz, r, k] of shadeAt) {
      const i0 = Math.max(0, Math.floor(ox - r - x0)), i1 = Math.min(nx, Math.ceil(ox + r - x0));
      const j0 = Math.max(0, Math.floor(oz - r - z0)), j1 = Math.min(nz, Math.ceil(oz + r - z0));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const d = Math.hypot(x0 + i - ox, z0 + j - oz);
          if (d < r) occ[idx(i, j)] += (1 - d / r) * (1 - d / r) * k;
        }
      }
    }

    const P = [], N = [], C = [], UV = [];
    const G = this.hgrid;
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = x0 + i, z = z0 + j, e = 0.5;
        const dark = 1 - Math.min(0.6, occ[idx(i, j)]);
        if (G) {   // 오픈월드: 높이 격자 그대로 (발 높이와 똑같음), 기울기는 이웃 격자점으로
          const H = (a, c) => G.h[Utils.clamp(c, 0, nz) * (nx + 1) + Utils.clamp(a, 0, nx)];
          P.push([x, H(i, j), z]);
          N.push(V3.normalize([(H(i - 1, j) - H(i + 1, j)) * 0.5, 1, (H(i, j - 1) - H(i, j + 1)) * 0.5]));
          // 무늬 좌표 y = 바위가 드러난 정도 (셰이더 groundTexture가 바위 결을 그림)
          // 무늬 좌표 x = 마을 돌바닥인 정도(+) 또는 초원 꽃밭인 정도(-) (둘은 서로 닿지 않음. 셰이더가 돌 무늬 / 먼 곳의 꽃 점을 그림)
          const pl = this.plazaAmount(x, z);
          UV.push([pl > 0.001 ? pl : -this.carpetAt(x, z), this.rockAmount(x, z)]);
        } else {
          P.push([x, this.groundHeight(x, z), z]);
          N.push(V3.normalize([
            this.groundHeight(x - e, z) - this.groundHeight(x + e, z), 2 * e,
            this.groundHeight(x, z - e) - this.groundHeight(x, z + e)]));
          UV.push(NO_UV);
        }
        C.push(this.groundColor(x, z).map((v, n) => (n < 3 ? v * dark : v)));
      }
    }
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        for (const k of [idx(i, j), idx(i, j + 1), idx(i + 1, j + 1), idx(i, j), idx(i + 1, j + 1), idx(i + 1, j)]) {
          b.vert(P[k], N[k], C[k], 0, UV[k]);
        }
      }
    }

    // 바깥 들판: 격자 테두리에서 멀리 산 밑까지 (안개에 묻힘)
    const far = 240, cxm = (this.cols * CELL) / 2, czm = (this.rows * CELL) / 2;
    const up = [0, 1, 0], fc = this.pal.forest;
    const inner = [[x0, z0], [x0 + nx, z0], [x0 + nx, z0 + nz], [x0, z0 + nz]];
    const outer = [[cxm - far, czm - far], [cxm + far, czm - far], [cxm + far, czm + far], [cxm - far, czm + far]];
    if (G) {
      // 오픈월드: 테두리 격자점마다 띠를 이어 붙임 (높은 언덕 끝에서도 땅이 끊기지 않게). 바깥 끝은 그 쪽 구역의 숲 바닥 색
      const ring = [];   // 테두리를 한 바퀴 도는 격자점 [i, j]
      for (let i = 0; i < nx; i++) ring.push([i, 0]);
      for (let j = 0; j < nz; j++) ring.push([nx, j]);
      for (let i = nx; i > 0; i--) ring.push([i, nz]);
      for (let j = nz; j > 0; j--) ring.push([0, j]);
      const out = ([i, j]) => [cxm - far + (i / nx) * 2 * far, -2.5, czm - far + (j / nz) * 2 * far];   // 테두리 점을 바깥 네모에 비례해 옮긴 자리
      for (let r = 0; r < ring.length; r++) {
        const p = ring[r], q = ring[(r + 1) % ring.length];
        const a = P[idx(p[0], p[1])], bb = P[idx(q[0], q[1])], c = out(q), d = out(p);
        const ca = Utils.mixColor(fc, C[idx(p[0], p[1])], 0.5), cb = Utils.mixColor(fc, C[idx(q[0], q[1])], 0.5);
        ca[3] = cb[3] = 0;
        b.vert(a, up, ca); b.vert(c, up, cb); b.vert(d, up, ca);
        b.vert(a, up, ca); b.vert(bb, up, cb); b.vert(c, up, cb);
      }
      return b;
    }
    for (let s = 0; s < 4; s++) {
      const t = (s + 1) % 4;
      const a = [inner[s][0], this.groundHeight(inner[s][0], inner[s][1]), inner[s][1]];
      const bb = [inner[t][0], this.groundHeight(inner[t][0], inner[t][1]), inner[t][1]];
      const c = [outer[t][0], -2.5, outer[t][1]], d = [outer[s][0], -2.5, outer[s][1]];
      b.vert(a, up, fc); b.vert(c, up, fc); b.vert(d, up, fc);
      b.vert(a, up, fc); b.vert(bb, up, fc); b.vert(c, up, fc);
    }
    return b;
  },

  // 땅 격자 바깥 들판의 대략적인 높이 (오픈월드: 가장 가까운 테두리 높이에서 멀리 -2.5m까지 낮아짐) — 먼 나무를 심을 때
  skirtHeight(x, z) {
    const G = this.hgrid, cx = Utils.clamp(x, G.x0, G.x0 + G.nx), cz = Utils.clamp(z, G.z0, G.z0 + G.nz);
    const d = Math.hypot(x - cx, z - cz), span = 240 - Math.max(G.nx, G.nz) / 2;
    return Utils.lerp(this.groundHeight(cx, cz), -2.5, Utils.clamp(d / span, 0, 1));
  },

  // 연못 수면: 0.5m 간격 격자. 정점마다 '물 깊이'를 담아 두면 셰이더가 물가 거품과 색을 그림
  // 오픈월드는 늪 구역 전체와 연못을 덮음 (땅이 물 위로 올라온 곳은 땅에 가려짐). 정점 색 r = 늪 물인 정도 (흐린 올리브빛 물 + 개구리밥)
  buildWater() {
    if (this.bio) return this.buildMarshWater();
    const b = new MeshBuilder();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let cz = 0; cz < this.rows; cz++) {
      for (let cx = 0; cx < this.cols; cx++) {
        if (this.data[cz][cx] !== '~') continue;
        minX = Math.min(minX, cx - 1); maxX = Math.max(maxX, cx + 2);
        minZ = Math.min(minZ, cz - 1); maxZ = Math.max(maxZ, cz + 2);
      }
    }
    const step = 0.5, up = [0, 1, 0], wl = this.waterLevel;
    this.waterBox = { min: [minX * CELL, wl - 0.2, minZ * CELL], max: [maxX * CELL, wl + 0.2, maxZ * CELL] };   // 화면에 보이는지 확인용
    const nx = Math.round(((maxX - minX) * CELL) / step), nz = Math.round(((maxZ - minZ) * CELL) / step);
    const pt = (i, j) => {
      const x = minX * CELL + i * step, z = minZ * CELL + j * step;
      return { p: [x, wl, z], d: wl - this.groundHeight(x, z) };
    };
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const q = [pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j)];
        if (q.every((v) => v.d < -0.3)) continue;   // 완전히 땅 위인 곳은 생략
        for (const k of [0, 1, 2, 0, 2, 3]) b.vert(q[k].p, up, [0, 0, 0, 0], q[k].d);
      }
    }
    this.waterBoxes = [this.waterBox];
    return b;
  },

  // 오픈월드의 물: 맵 전체를 격자로 훑어서 늪 구역·연못 근처에서 땅이 수면 가까이 낮은 곳만 물을 깖
  // 12m 구역마다 물이 있는 범위를 상자로 모아 둠 (World.waterBoxes)
  buildMarshWater() {
    const b = new MeshBuilder();
    const step = CONFIG.graphics.waterStep || 0.5, up = [0, 1, 0], wl = this.waterLevel;
    const minX = -2 * CELL, minZ = -2 * CELL, nx = Math.round(((this.cols + 4) * CELL) / step), nz = Math.round(((this.rows + 4) * CELL) / step);
    const s = nx + 1, D = new Float32Array(s * (nz + 1)), M = new Float32Array(s * (nz + 1));
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = minX + i * step, z = minZ + j * step, k = j * s + i;
        const marsh = this.bioMix(x, z, this._bw)[3];
        const ok = marsh > 0.05 || this.pondNear(x, z);
        D[k] = ok ? wl - this.groundHeight(x, z) : -1;   // 물 깊이 (땅 위는 -)
        M[k] = Utils.smooth((marsh - 0.05) / 0.45);
      }
    }
    const boxes = new Map();
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const ks = [j * s + i, (j + 1) * s + i, (j + 1) * s + i + 1, j * s + i + 1];
        if (D[ks[0]] < -0.3 && D[ks[1]] < -0.3 && D[ks[2]] < -0.3 && D[ks[3]] < -0.3) continue;   // 완전히 땅 위인 곳은 생략
        const x = minX + i * step, z = minZ + j * step;
        const ps = [[x, wl, z], [x, wl, z + step], [x + step, wl, z + step], [x + step, wl, z]];
        for (const q of [0, 1, 2, 0, 2, 3]) b.vert(ps[q], up, [M[ks[q]], 0, 0, 0], D[ks[q]]);
        const key = Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK);
        const bx = boxes.get(key);
        if (!bx) boxes.set(key, { min: [x, wl - 0.2, z], max: [x + step, wl + 0.2, z + step] });
        else {
          bx.min[0] = Math.min(bx.min[0], x); bx.min[2] = Math.min(bx.min[2], z);
          bx.max[0] = Math.max(bx.max[0], x + step); bx.max[2] = Math.max(bx.max[2], z + step);
        }
      }
    }
    this.waterBoxes = [...boxes.values()];
    const all = { min: [Infinity, wl - 0.2, Infinity], max: [-Infinity, wl + 0.2, -Infinity] };
    for (const bx of this.waterBoxes) {
      all.min[0] = Math.min(all.min[0], bx.min[0]); all.min[2] = Math.min(all.min[2], bx.min[2]);
      all.max[0] = Math.max(all.max[0], bx.max[0]); all.max[2] = Math.max(all.max[2], bx.max[2]);
    }
    this.waterBox = all;   // 물 전체를 감싸는 상자 (예전 방식의 확인용)
    return b;
  },
};
