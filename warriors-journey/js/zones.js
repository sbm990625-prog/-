// 오픈월드 구역: 마을(안전 지대)과 몬스터 구역을 나누고, 구역마다 적을 배치·되살리고, 모두 평정하면 동굴 입구를 엶
// 구역은 levels.js의 zones, 적 수는 config.js의 levels.world, 숫자는 config.js의 world
const Zones = {
  list: [],         // [{ id, name, kind, rect, danger, kills, goal, cleared, respawnTimer, ... }]
  cur: null,        // 전사가 지금 있는 구역 (길 위면 null)
  allCleared: false,
  healTimer: 0,     // 마을 회복 반짝임 간격
  level: null,
  index: 0,

  // 구역을 불러올 때 (saved: 이 브라우저에 저장된 평정한 구역 id 목록)
  reset(level, index, saved = []) {
    this.level = level;
    this.index = index;
    this.list = (level.zones || []).map((z) => Object.assign({}, z, { kills: 0, goal: 0, cleared: saved.includes(z.id), respawnTimer: 0 }));
    this.cur = this.at(World.start.x, World.start.z);
    this.allCleared = false;
    this.healTimer = 0;
    if (this.active) this.checkAll(true);   // 저장된 진행이 이미 다 평정한 상태면 바로 출구를 엶
  },

  get active() { return this.list.length > 0; },
  get fields() { return this.list.filter((z) => z.kind === 'field'); },
  get playerSafe() { return !!(this.cur && this.cur.kind === 'village'); },   // 전사가 마을 안

  // (x, z)가 속한 구역 (없으면 null)
  at(x, z) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    return this.list.find((z) => cx >= z.rect[0] && cx <= z.rect[2] && cz >= z.rect[1] && cz <= z.rect[3]) || null;
  },
  byId(id) { return this.list.find((z) => z.id === id) || null; },
  alive(zone) { return Enemies.list.filter((e) => e.zone === zone.id && !e.dead).length; },
  get clearedCount() { return this.fields.filter((z) => z.cleared).length; },

  // 구역마다 적 배치 (처음과 되살아날 때)
  spawnZone(zone, rnd) {
    const counts = (CONFIG.levels[this.level.id] || {})[zone.id] || {};
    const cells = World.spawnCells(zone.rect);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    let k = 0, n = 0;
    for (const type of ['slime', 'goblin', 'archer', 'bat']) {
      for (let i = 0; i < (counts[type] || 0) && k < cells.length; i++, k++, n++) {
        const c = cells[k];
        const e = new Enemy(type, c.x + (rnd() - 0.5) * 0.8, c.z + (rnd() - 0.5) * 0.8, rnd);
        e.zone = zone.id;
        Enemies.list.push(e);
      }
    }
    zone.goal = n;
    zone.respawnTimer = 0;
    return n;
  },
  spawnAll() {
    const rnd = Utils.rng(100 + this.index * 17);
    for (const z of this.fields) this.spawnZone(z, rnd);
  },

  // 구역의 적이 쓰러짐 (enemies.js에서)
  onKill(e) {
    const z = this.byId(e.zone);
    if (!z) return;
    z.kills++;
    if (!z.cleared && this.alive(z) === 0) {
      z.cleared = true;
      Save.setZones(this.fields.filter((f) => f.cleared).map((f) => f.id));
      const left = this.fields.length - this.clearedCount;
      Sound.play('chime');
      UI.message(`${Utils.josa(z.name, '을', '를')} 평정했다!`, left > 0 ? `남은 들판 ${left}곳 · 적은 시간이 지나면 되살아납니다` : '');
      this.checkAll();
    }
  },

  // 들판을 모두 평정했으면 동굴 입구의 봉인을 엶
  checkAll(silent) {
    if (this.allCleared || !this.fields.every((z) => z.cleared)) return;
    this.allCleared = true;
    World.gateOpen = true;
    Game.cleared = true;
    if (silent) return;
    Sound.play('chime');
    setTimeout(() => UI.message(this.level.clearTitle || '모든 구역을 평정했다!', '북쪽 숲 끝, 동굴 입구의 봉인이 풀렸다'), 1500);
  },

  update(dt, p) {
    if (!this.active) return;
    const z = this.at(p.x, p.z);
    if (z !== this.cur) {
      this.cur = z;
      if (z) UI.zoneBanner(z);
    }
    // 마을: 쉬면 체력이 천천히 참 (반짝임)
    if (this.playerSafe && !p.dead && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + CONFIG.world.villageHeal * dt);
      this.healTimer -= dt;
      if (this.healTimer <= 0) {
        this.healTimer = 0.5;
        for (let i = 0; i < 3; i++) Particles.glitter(p.x, p.groundY + 0.2, p.z);
        if (Math.random() < 0.5) Sound.play('heal');
      }
    }
    // 되살아남: 구역의 적이 모두 쓰러진 뒤 시간이 지나면 (전사가 그 구역 밖에 있을 때)
    for (const f of this.fields) {
      if (this.alive(f) > 0) {
        f.respawnTimer = 0;
        continue;
      }
      f.respawnTimer += dt;
      if (f.respawnTimer > CONFIG.world.respawn && this.cur !== f) this.spawnZone(f, Math.random);
    }
  },

  // 화면 위에 쓸 구역 상태 글 (HUD)
  hudText() {
    const z = this.cur;
    if (!z) return { text: this.allCleared ? '동굴 입구가 열렸다!' : `들판 평정 ${this.clearedCount} / ${this.fields.length}`, color: this.allCleared ? '#ffe08a' : '#ffffff' };
    if (z.kind === 'village') return { text: `${z.name} · 안전 지대`, color: '#b8f0a0' };
    const n = this.alive(z);
    return n > 0 ? { text: `${z.name} · 남은 적 ${n}`, color: '#ffffff' } : { text: `${z.name} · 평정`, color: '#ffe08a' };
  },
};
