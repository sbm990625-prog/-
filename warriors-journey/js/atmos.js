// 하늘·빛: 오픈월드의 하루(낮 → 노을 → 어스름 → 달밤 → 새벽 → 낮)와 구역마다 다른 공기
// render.js의 LIGHTING(테마별 빛 값)을 시각·구역에 따라 섞어서 Atmos.L에 담아 둠. 그리기는 Atmos.L만 읽음
//   - 하루: LIGHTING.forest(맑은 낮) / sunset(노을) / twilight·predawn(어스름) / night(달밤) / dawn(새벽)을 DAY_KEYS 시각대로 차례로 섞음
//   - 구역: 전사가 있는 구역(늪지·언덕·숲…) 쪽으로 몇 초에 걸쳐 ZONE_AIR 배율을 섞음 (경계에서 툭 바뀌지 않음)
//   - 해 방향은 몇 초에 한 번씩 짧게 미끄러지듯 옮김 (계속 조금씩 돌리면 그림자 테두리가 기어가듯 떨림)
// 노을 숲·동굴처럼 오픈월드가 아닌 구역은 그 테마 값 그대로 (Atmos.L === LIGHTING[테마]) → 예전 모습 그대로
// 시각: Atmos.time (0~1). 0 아침 · 0.5 늦은 오후까지 맑은 낮 · 0.6 노을 · 0.66 어스름 · 0.72~0.9 달밤 · 0.95 새벽 · 1 = 다시 아침
//       하루 길이·시작 시각은 config.js의 world (dayLength, startTime, dayNight). 시험할 땐 Atmos.time = 0.8 처럼 바로 바꿔도 됨

// 하루의 시각표: [시각, LIGHTING 이름]. 사이는 부드럽게 섞음
const DAY_KEYS = [
  [0, 'forest'], [0.5, 'forest'],     // 하루의 절반은 지금 그대로의 맑은 낮
  [0.6, 'sunset'],                    // 금빛 노을
  [0.66, 'twilight'],                 // 푸른 어스름
  [0.72, 'night'], [0.9, 'night'],    // 달밤
  [0.925, 'predawn'],                 // 새벽 전 어스름
  [0.955, 'dawn'],                    // 분홍빛 새벽
  [1, 'forest'],
];
const SUN_STEP = Math.cos(Utils.rad(4));      // 해가 이만큼(도) 벗어나면 옮김 (노을이 지는 동안 10초에 한 번쯤)
const SUN_SMALL = Math.cos(Utils.rad(0.3));   // 조금만 벗어났어도 SUN_WAIT초가 지나면 옮김
const SUN_WAIT = 10;                          // (초)
const SUN_GLIDE = 0.8;                        // 옮기는 데 걸리는 시간 (초): 그림자가 한 번 스르르 움직임
const ZONE_BLEND = 8;                         // 구역 경계 양쪽 이 거리(m) 안에서 공기가 섞임
const ZONE_EASE = 1.5;                        // 구역 공기가 따라가는 빠르기 (클수록 빨리, 약 2초)
const BEAM_COUNT = 14;                        // 북쪽 숲 햇살 기둥 수 (최대)
const BEAM_STEEP = 0.8;                       // 햇살 기둥을 해 방향보다 곧추세우는 정도 (0이면 해 방향 그대로)
const NO_ZONES = [];                          // (구역이 없는 지도용 빈 목록)

// 값 섞기 (숫자·배열·배열 속 배열·cel 같은 묶음). out의 배열·묶음은 처음 한 번만 만들고 매 화면 다시 씀 (쓰레기를 만들지 않음)
const ATMOS_KEYS = new WeakMap();
function atmosKeys(o) {
  let k = ATMOS_KEYS.get(o);
  if (!k) {
    k = Object.keys(o);
    ATMOS_KEYS.set(o, k);
  }
  return k;
}
function mixValue(a, b, t, o) {
  if (typeof a === 'number') return typeof b === 'number' ? a + (b - a) * t : a;
  if (Array.isArray(a)) {
    if (!Array.isArray(o) || o.length !== a.length) o = new Array(a.length);   // (처음 한 번만)
    const bb = Array.isArray(b) ? b : a;
    for (let i = 0; i < a.length; i++) o[i] = mixValue(a[i], bb[i], t, o[i]);
    return o;
  }
  if (a && typeof a === 'object') {
    if (!o || typeof o !== 'object' || Array.isArray(o)) o = {};
    return mixLighting(a, b && typeof b === 'object' ? b : a, t, o);
  }
  return t < 0.5 || b === undefined ? a : b;   // 켜고 끄는 값(true/false)은 절반에서 바뀜
}
// a와 b를 t(0~1)만큼 섞어 out에 담음
function mixLighting(a, b, t, out) {
  const ka = atmosKeys(a);
  for (let i = 0; i < ka.length; i++) {
    const k = ka[i];
    out[k] = mixValue(a[k], k in b ? b[k] : a[k], t, out[k]);
  }
  const kb = atmosKeys(b);
  for (let i = 0; i < kb.length; i++) {
    const k = kb[i];
    if (!(k in a)) out[k] = mixValue(b[k], b[k], 1, out[k]);
  }
  return out;
}
// 구역 공기: out의 값에 배율 mul을 무게 w(0~1)만큼 곱함 (배열은 칸마다). mul.add는 더하는 값
function applyZoneAir(out, mul, w) {
  const keys = atmosKeys(mul);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i], m = mul[k], v = out[k];
    if (k === 'add') {
      const ak = atmosKeys(m);
      for (let j = 0; j < ak.length; j++) out[ak[j]] = (out[ak[j]] || 0) + m[ak[j]] * w;
    } else if (typeof v === 'number') {
      out[k] = v * (1 + (m - 1) * w);
    } else if (Array.isArray(v)) {
      for (let j = 0; j < v.length; j++) v[j] *= 1 + (m[j] - 1) * w;
    }
  }
}

const Atmos = {
  L: LIGHTING.forest,   // 지금 화면의 빛 값 (render.js가 읽음)
  time: null,           // 하루 시각 (0~1, 0.25 = 오전). 처음엔 config의 startTime
  night: 0,             // 밤인 정도 (0~1)
  zoneW: {},            // 구역 공기 무게 (ZONE_AIR 이름 → 0~1)
  zoneT: {},            // 구역 공기 목표 무게
  beamMesh: null,       // 북쪽 숲 햇살 기둥 모델
  beams: [],            // 햇살 기둥 발밑 위치 [x, z]
  beamDir: [0, 1, 0],   // 햇살 기둥이 해 쪽으로 뻗은 방향
  level: null,          // Atmos.L을 만든 구역
  lastTime: null,       // 지난번에 섞은 시각 (밖에서 시각을 바꾸면 바로 맞춤)
  out: {},              // 섞은 값을 담는 그릇 (매 화면 다시 씀)
  sun: [0, 1, 0],       // 지금 쓰는 해 방향 (몇 초에 한 번씩 옮김)
  sunFrom: [0, 1, 0],
  sunTo: [0, 1, 0],
  sunGlide: -1,         // 해를 옮기는 중이면 0~1
  sunWait: 0,
  px: 0, pz: 0,         // 지난번 전사 위치 (순간이동하면 구역 공기를 바로 맞춤)
  eye: [0, 0, 0],       // (World.biomeAt에 넘길 위치, 매 화면 다시 씀)

  get open() { return !!(World.level && World.level.id === 'world'); },   // 오픈월드인지 (하루·구역 공기는 여기서만)

  // 매 프레임 (main.js): 시각을 흘리고, 구역 공기를 따라가고, 빛 값을 섞음
  update(dt, player) {
    if (this.time === null) this.time = CONFIG.world.startTime ?? 0.12;
    if (World.level !== this.level) this.snap();
    const jumped = this.time !== this.lastTime;   // 시험 등으로 시각을 바로 바꿈
    const W = CONFIG.world;
    if (W.dayNight !== false && W.dayLength > 0) this.time = (this.time + dt / W.dayLength) % 1;
    const teleport = Math.hypot(player.x - this.px, player.z - this.pz) > 6;   // 순간이동 (쓰러져 마을에서 깸 등)
    this.zoneTargets(player.x, player.z);
    const k = teleport ? 1 : Math.min(1, dt * ZONE_EASE);
    for (const id in this.zoneT) this.zoneW[id] = (this.zoneW[id] || 0) + (this.zoneT[id] - (this.zoneW[id] || 0)) * k;
    this.px = player.x;
    this.pz = player.z;
    this.resolve(dt, jumped);
  },

  // 구역을 불러오거나 마을에서 깨어났을 때 (main.js): 기다리지 않고 바로 맞춤
  snap() {
    if (this.time === null) this.time = CONFIG.world.startTime ?? 0.12;
    if (World.level !== this.level) {
      this.level = World.level;
      this.buildBeams();
    }
    const p = Game.player;
    if (p) {
      this.zoneTargets(p.x, p.z);
      for (const id in this.zoneT) this.zoneW[id] = this.zoneT[id];
      this.px = p.x;
      this.pz = p.z;
    }
    this.resolve(0, true);
  },

  // 그리기 직전 (render.js): 구역이 바뀌었거나 시각을 밖에서 바꿨으면 바로 맞춰서 돌려줌
  current() {
    if (World.level !== this.level) this.snap();
    else if (this.time !== this.lastTime) this.resolve(0, true);
    return this.L;
  },

  // 구역 공기 목표 무게: 지형 담당이 World.biomeAt을 만들면 그것을, 없으면 구역 사각형(levels.js zones)에서 경계를 부드럽게
  zoneTargets(x, z) {
    const T = this.zoneT;
    for (const id in ZONE_AIR) T[id] = 0;
    if (!this.open) return;
    if (typeof World.biomeAt === 'function') {
      const e = this.eye;
      e[0] = x; e[1] = World.groundHeight(x, z); e[2] = z;
      const b = World.biomeAt.length === 1 ? World.biomeAt(e) : World.biomeAt(x, z);
      if (typeof b === 'string' && b in ZONE_AIR) {   // 구역 이름 하나
        T[b] = 1;
        return;
      }
      if (b && typeof b === 'object') {               // { 구역 이름: 무게 }
        let any = false;
        for (const id in ZONE_AIR) if (typeof b[id] === 'number') { T[id] = Utils.clamp(b[id], 0, 1); any = true; }
        if (any) return;
      }
    }
    let sum = 0;
    const zones = World.level.zones || NO_ZONES;
    for (let i = 0; i < zones.length; i++) {
      const zn = zones[i];
      if (!(zn.id in ZONE_AIR)) continue;
      const r = zn.rect;
      const dx = Math.max(r[0] * CELL - x, x - (r[2] + 1) * CELL), dz = Math.max(r[1] * CELL - z, z - (r[3] + 1) * CELL);
      const sd = dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz);   // 사각형까지 거리 (안쪽은 음수)
      T[zn.id] = Utils.smooth((ZONE_BLEND - sd) / (ZONE_BLEND * 2));
      sum += T[zn.id];
    }
    if (sum > 1) for (const id in T) T[id] /= sum;   // 구역 모서리에서 겹치면 합이 1을 넘지 않게
  },

  // 빛 값 섞기: 하루 시각 → 구역 공기 → 해 방향 (snap이면 해를 바로 옮김)
  resolve(dt, snap) {
    this.lastTime = this.time;
    if (!this.open) {   // 오픈월드가 아니면 테마 값 그대로
      this.L = LIGHTING[World.level ? World.level.theme : 'forest'] || LIGHTING.forest;
      this.night = this.L.night || 0;
      return;
    }
    const out = this.out, tm = this.time;
    let i = 0;
    while (i < DAY_KEYS.length - 2 && tm >= DAY_KEYS[i + 1][0]) i++;
    const k0 = DAY_KEYS[i], k1 = DAY_KEYS[i + 1];
    const t = Utils.smooth((tm - k0[0]) / Math.max(k1[0] - k0[0], 1e-6));
    mixLighting(LIGHTING[k0[1]], LIGHTING[k1[1]], t, out);
    const ss = out.skySun;   // 하늘의 해 자리: 섞으면 길이가 1보다 짧아지므로 다시 1로 (해 원반이 작아지거나 사라지지 않게)
    if (ss) {
      const sl = Math.hypot(ss[0], ss[1], ss[2]) || 1;
      ss[0] /= sl; ss[1] /= sl; ss[2] /= sl;
    }
    for (const id in ZONE_AIR) {
      const w = this.zoneW[id] || 0;
      if (w > 0.001) applyZoneAir(out, ZONE_AIR[id], w);
    }
    this.stepSun(out.sunDir, dt, snap);
    out.sunDir[0] = this.sun[0];
    out.sunDir[1] = this.sun[1];
    out.sunDir[2] = this.sun[2];
    this.night = out.night;
    this.L = out;
  },

  // 해 방향: 목표가 4도 넘게(또는 조금이라도 10초 넘게) 벗어나면 0.8초 동안 스르르 옮김. 낮·밤 동안은 목표가 그대로라 움직이지 않음
  stepSun(target, dt, snap) {
    const s = this.sun;
    const len = Math.hypot(target[0], target[1], target[2]) || 1;
    const tx = target[0] / len, ty = target[1] / len, tz = target[2] / len;
    if (snap) {
      s[0] = tx; s[1] = ty; s[2] = tz;
      this.sunGlide = -1;
      this.sunWait = 0;
      return;
    }
    if (this.sunGlide >= 0) {
      this.sunGlide = Math.min(1, this.sunGlide + dt / SUN_GLIDE);
      const g = Utils.smooth(this.sunGlide), a = this.sunFrom, b = this.sunTo;
      const x = a[0] + (b[0] - a[0]) * g, y = a[1] + (b[1] - a[1]) * g, z = a[2] + (b[2] - a[2]) * g, l = Math.hypot(x, y, z) || 1;
      s[0] = x / l; s[1] = y / l; s[2] = z / l;
      if (this.sunGlide >= 1) this.sunGlide = -1;
      return;
    }
    this.sunWait += dt;
    const d = s[0] * tx + s[1] * ty + s[2] * tz;
    if (d < SUN_STEP || (d < SUN_SMALL && this.sunWait > SUN_WAIT)) {
      for (let i = 0; i < 3; i++) this.sunFrom[i] = s[i];
      this.sunTo[0] = tx; this.sunTo[1] = ty; this.sunTo[2] = tz;
      this.sunGlide = 0;
      this.sunWait = 0;
    }
  },

  // 북쪽 숲 햇살 기둥 모델: 숲 구역 안에서 나무 가장자리의 빈 칸을 골라, 땅에서 낮 해 쪽으로 비스듬히 솟은 기둥
  // (무늬 좌표 y: 땅 0 ~ 꼭대기 1 → 셰이더가 양 끝을 부드럽게 지움)
  buildBeams() {
    if (this.beamMesh) GL.deleteMesh(this.beamMesh);
    this.beamMesh = null;
    this.beams = [];
    const lv = World.level;
    if (!this.open || CONFIG.graphics.sunBeams === false) return;
    const zone = (lv.zones || []).find((z) => z.id === 'woods');
    if (!zone) return;
    const rnd = Utils.rng(4242), [x0, z0, x1, z1] = zone.rect;
    const cands = [];
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (!'.:f'.includes(World.cell(cx, cz))) continue;
        let canopy = 0, road = 0;
        for (let dz = -2; dz <= 2; dz++) {
          for (let dx = -2; dx <= 2; dx++) {
            const c = World.cell(cx + dx, cz + dz);
            if (c === '#' || c === 'T') canopy++;
            if (c === ':' && Math.abs(dx) <= 1 && Math.abs(dz) <= 1) road++;
          }
        }
        // 길가(전사가 지나가며 보는 곳)를 먼저, 그다음 나무 가까운 빈터. 나무가 전혀 없는 곳은 빼기
        if (canopy) cands.push({ cx, cz, k: rnd() * 0.6 + (road ? 0 : 0.8) + (canopy > 2 ? 0 : 0.4) });
      }
    }
    cands.sort((a, b) => a.k - b.k);
    const picked = [];
    for (const c of cands) {
      if (picked.length >= BEAM_COUNT) break;
      const x = (c.cx + 0.5) * CELL, z = (c.cz + 0.5) * CELL;
      if (picked.some((p) => Math.hypot(p[0] - x, p[1] - z) < 8)) continue;   // 서로 떨어뜨려
      picked.push([x, z]);
    }
    this.beams = picked;   // 기둥 발밑 위치 [x, z] (시험·확인용)
    if (!picked.length) return;
    // 기둥 방향: 낮 해 쪽이지만 조금 더 곧추세움 (해 그대로면 너무 눕혀져서 길 앞쪽을 볼 때 머리 위로 지나가 버림)
    const s = V3.normalize(V3.add(LIGHTING.forest.sunDir, [0, BEAM_STEEP, 0]));
    this.beamDir = s;   // (셰이더: 해 쪽을 바라볼수록 진하게)
    const b = new MeshBuilder(), n = 14, col = [1, 1, 1, 0];
    for (const [x, z] of picked) {
      const gy = World.groundHeight(x, z), H = 8 + rnd() * 3, r0 = 0.8 + rnd() * 0.7, r1 = r0 * (0.7 + rnd() * 0.25);
      const p0 = [x + (rnd() - 0.5), gy - 0.3, z + (rnd() - 0.5)];
      const p1 = [p0[0] + (s[0] / s[1]) * H, gy + H, p0[2] + (s[2] / s[1]) * H];
      const ax = V3.normalize(V3.sub(p1, p0));
      const u = V3.normalize(V3.cross(ax, [0, 1, 0])), w = V3.cross(u, ax);
      const side = (a) => [u[0] * Math.cos(a) + w[0] * Math.sin(a), u[1] * Math.cos(a) + w[1] * Math.sin(a), u[2] * Math.cos(a) + w[2] * Math.sin(a)];
      for (let i = 0; i < n; i++) {
        const na = side((i / n) * Math.PI * 2), nb = side(((i + 1) / n) * Math.PI * 2);
        const la = V3.add(p0, V3.scale(na, r0)), lb = V3.add(p0, V3.scale(nb, r0));
        const ha = V3.add(p1, V3.scale(na, r1)), hb = V3.add(p1, V3.scale(nb, r1));
        b.vert(la, na, col, 0, [i / n, 0]); b.vert(lb, nb, col, 0, [(i + 1) / n, 0]); b.vert(hb, nb, col, 0, [(i + 1) / n, 1]);
        b.vert(la, na, col, 0, [i / n, 0]); b.vert(hb, nb, col, 0, [(i + 1) / n, 1]); b.vert(ha, na, col, 0, [i / n, 1]);
      }
    }
    this.beamMesh = GL.createMesh(b);
  },
};
