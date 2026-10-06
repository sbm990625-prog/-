// 개발용: 제1장 오픈월드 지도(js/levels.js의 WORLD_MAP.data)를 만들어 써넣습니다.
//   node tools/gen-world.mjs            (같은 모양이 다시 나옴: 고정 난수)
// 구역 배치·길·마을 건물은 아래 숫자로 정하고, 나무·바위·꽃은 난수로 흩뿌립니다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const COLS = 56, ROWS = 46;
const Z = { village: [19, 14, 36, 31], woods: [1, 1, 54, 11], hills: [1, 13, 17, 32], meadow: [38, 13, 54, 32], marsh: [1, 34, 54, 44] };

let seed = 20251006;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
const inRect = (x, z, r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
const get = (x, z) => (x < 0 || z < 0 || x >= COLS || z >= ROWS ? '#' : g[z][x]);
const set = (x, z, ch) => { if (x >= 0 && z >= 0 && x < COLS && z < ROWS) g[z][x] = ch; };
const fill = (x0, z0, x1, z1, ch) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, z, ch); };

// 1. 바깥 테두리 (안쪽으로 울퉁불퉁하게 두껍게)
fill(0, 0, COLS - 1, 0, '#'); fill(0, ROWS - 1, COLS - 1, ROWS - 1, '#'); fill(0, 0, 0, ROWS - 1, '#'); fill(COLS - 1, 0, COLS - 1, ROWS - 1, '#');
for (let x = 1; x < COLS - 1; x++) { if (rnd() < 0.45) set(x, 1, '#'); if (rnd() < 0.45) set(x, ROWS - 2, '#'); }
for (let z = 1; z < ROWS - 1; z++) { if (rnd() < 0.45) set(1, z, '#'); if (rnd() < 0.45) set(COLS - 2, z, '#'); }

// 2. 구역 사이 나무 울타리 (길이 지나는 틈은 비움)
const gapsX = [[8, 9], [27, 28], [45, 46]];
for (let x = 1; x < COLS - 1; x++) {
  if (!gapsX.some(([a, b]) => x >= a && x <= b)) { set(x, 12, '#'); set(x, 33, '#'); if (rnd() < 0.3) set(x, 11, '#'); if (rnd() < 0.3) set(x, 34, '#'); }
}
for (let z = 13; z <= 32; z++) {
  if (z < 22 || z > 23) { set(18, z, '#'); set(37, z, '#'); if (rnd() < 0.3) set(17, z, '#'); if (rnd() < 0.3) set(38, z, '#'); }
}

// 3. 길: 마을 광장에서 네 방향으로, 북쪽 길은 숲을 지나 동굴 입구까지
const road = (x0, z0, x1, z1) => fill(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), ':');
road(25, 20, 30, 25);          // 광장
road(27, 6, 28, 19);           // 북쪽 길
road(27, 26, 28, 38);          // 남쪽 길
road(8, 22, 24, 23);           // 서쪽 길
road(31, 22, 46, 23);          // 동쪽 길
road(27, 6, 47, 7);            // 숲 속 길 → 동굴 입구
road(47, 3, 47, 7);
road(8, 12, 9, 22);            // 서쪽 언덕 ↔ 북쪽 숲
road(8, 23, 9, 36);            // 서쪽 언덕 ↔ 남쪽 늪
road(45, 8, 46, 22);           // 동쪽 초원 ↔ 북쪽 숲
road(45, 23, 46, 36);          // 동쪽 초원 ↔ 남쪽 늪
const isRoad = (x, z) => get(x, z) === ':';
const nearRoad = (x, z, r = 1) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (isRoad(x + i, z + j)) return true; return false; };

// 4. 동굴 입구: 북쪽 숲 끝 (뒤쪽 테두리가 통로)
fill(44, 2, 50, 5, '.'); set(47, 3, ':'); set(47, 2, 'E'); set(47, 1, '#'); set(46, 1, '#'); set(48, 1, '#');
fill(45, 2, 46, 2, 'R'); fill(48, 2, 49, 2, 'R');

// 5. 마을: 울타리, 집, 우물, 모닥불, 등불, 상자, 꽃밭, 나무
const V = Z.village;
for (let x = V[0]; x <= V[2]; x++) { if (x < 27 || x > 28) { set(x, V[1], 'F'); set(x, V[3], 'F'); } }
for (let z = V[1]; z <= V[3]; z++) { if (z < 22 || z > 23) { set(V[0], z, 'F'); set(V[2], z, 'F'); } }
const house = (x0, z0, x1, z1) => fill(x0, z0, x1, z1, 'h');
house(21, 16, 22, 17); house(30, 16, 32, 17); house(21, 27, 22, 28); house(31, 27, 33, 28); house(33, 18, 34, 19);
set(27, 22, 'W'); set(29, 24, 'c'); set(26, 24, 'P');
for (const [x, z] of [[24, 19], [31, 19], [24, 26], [31, 26]]) set(x, z, 'L');
for (const [x, z] of [[23, 17], [29, 16], [23, 28], [30, 28], [35, 18], [34, 21]]) set(x, z, 'A');
for (const [x, z] of [[20, 19], [35, 24], [20, 27], [35, 29], [25, 17], [33, 30], [21, 24]]) set(x, z, 'f');
for (const [x, z] of [[34, 15], [20, 30], [35, 30], [20, 15], [34, 25]]) set(x, z, 'T');

// 6. 들판마다 다른 풍경을 난수로 흩뿌림 (길 옆·마을 안은 비움)
function scatter(rect, table, clumpP, clumpCh = '#') {
  for (let z = rect[1]; z <= rect[3]; z++) {
    for (let x = rect[0]; x <= rect[2]; x++) {
      if (get(x, z) !== '.' || nearRoad(x, z)) continue;
      const r = rnd();
      let acc = 0, done = false;
      for (const [ch, p] of table) {
        acc += p;
        if (r < acc) { set(x, z, ch); done = true; break; }
      }
      if (done) continue;
      if (rnd() < clumpP && !nearRoad(x, z, 2)) {   // 작은 덤불 숲 덩어리 (2~4칸)
        set(x, z, clumpCh);
        for (const [i, j] of [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]]) if (rnd() < 0.5 && get(x + i, z + j) === '.' && !nearRoad(x + i, z + j, 2)) set(x + i, z + j, clumpCh);
      }
    }
  }
}
// 연못 덩어리 (가운데에서 둥글게)
function pond(cx, cz, rx, rz) {
  for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const d = Math.hypot((x - cx) / rx, (z - cz) / rz);
    if (d <= 1 && get(x, z) === '.' && !nearRoad(x, z)) set(x, z, '~');
  }
}
scatter(Z.woods, [['T', 0.11], ['b', 0.05], ['R', 0.02], ['f', 0.015]], 0.06);
scatter(Z.hills, [['R', 0.1], ['X', 0.035], ['T', 0.035], ['b', 0.03]], 0.05);
pond(49, 17, 2, 1.6);
scatter(Z.meadow, [['f', 0.07], ['T', 0.035], ['b', 0.04], ['R', 0.01]], 0.025);
pond(14, 40, 3, 2); pond(33, 40, 3.5, 2); pond(50, 39, 2, 1.5);
scatter(Z.marsh, [['T', 0.06], ['b', 0.05], ['R', 0.02], ['f', 0.02]], 0.05);

// 7. 시작 지점에서 갈 수 없는 빈 칸은 숲으로 메움 (고립된 틈이 생기지 않게)
const passable = (ch) => !'#h~F'.includes(ch);
const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
const stack = [[26, 24]];
seen[24][26] = true;
while (stack.length) {
  const [x, z] = stack.pop();
  for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + i, nz = z + j;
    if (nx < 0 || nz < 0 || nx >= COLS || nz >= ROWS || seen[nz][nx] || !passable(get(nx, nz))) continue;
    seen[nz][nx] = true;
    stack.push([nx, nz]);
  }
}
let filled = 0;
for (let z = 0; z < ROWS; z++) for (let x = 0; x < COLS; x++) if (!seen[z][x] && passable(get(x, z)) && get(x, z) !== 'E') { set(x, z, '#'); filled++; }
for (const [id, r] of Object.entries(Z)) {
  let open = 0;
  for (let z = r[1]; z <= r[3]; z++) for (let x = r[0]; x <= r[2]; x++) if (seen[z][x]) open++;
  console.log(`${id}: 갈 수 있는 칸 ${open}`);
}
console.log(`고립된 칸 ${filled}개를 숲으로 메움. 동굴 입구 도달: ${seen[3][47]}`);

const lines = g.map((row) => `    '${row.join('')}',`).join('\n');
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'levels.js');
const src = fs.readFileSync(file, 'utf8');
const out = src.replace(/(\/\/ <world-map>\n)[\s\S]*?(\n  \/\/ <\/world-map>)/, `$1  data: [\n${lines}\n  ],$2`);
fs.writeFileSync(file, out);
console.log(`js/levels.js 에 ${COLS}x${ROWS} 지도를 써넣었습니다.`);
