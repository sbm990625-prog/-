// 게임 시작점: 화면 준비, 게임 루프
const viewCanvas = document.getElementById('view');   // 3D 화면
const hudCanvas = document.getElementById('hud');     // 글자·체력 막대

const Game = {
  time: 0,          // 게임 시작 후 지난 시간(초)
  levelStart: 0,    // 지금 구역에 들어온 시각
  levelIndex: 0,    // 지금 구역 번호 (levels.js의 LEVELS 순서)
  player: null,
  cleared: false,   // 이 구역의 적을 모두 물리쳤는지
  finished: false,  // 마지막 구역까지 끝냈는지
  deathTimer: 0,
  fade: 0,          // 화면 어둡기 (구역을 옮길 때)
  fadeDir: 0,       // 1: 어두워지는 중, -1: 밝아지는 중
  afterFade: null,  // 완전히 어두워졌을 때 할 일
  hitStop: 0,       // 적을 때린 순간 게임을 아주 잠깐 거의 멈춤 (남은 초)
  resumed: false,   // 저장된 구역부터 이어 하는 중인지 (처음 몇 초 '처음부터' 버튼을 보여 줌)

  start() {
    if (!GL.init(viewCanvas)) {
      showError('이 브라우저는 3D 그래픽(WebGL2)을 지원하지 않아요. 최신 크롬이나 엣지로 열어 주세요.');
      return false;
    }
    Models.build();
    Village.build();
    Weapons.build();
    Character.build();
    Enemies.build();
    Renderer.init();
    UI.init(hudCanvas);
    Camera.init();
    const saved = Save.level();   // 이 브라우저에서 마지막으로 도착한 구역부터
    this.resumed = saved > 0;
    this.loadLevel(saved);
    return true;
  },

  // 처음 구역부터 다시
  restart() {
    this.resumed = false;
    this.finished = false;
    Save.setLevel(0);
    Save.setZones([]);
    this.fadeTo(() => this.loadLevel(0));
  },

  loadLevel(index) {
    this.levelIndex = index;
    if (index > Save.level()) Save.setLevel(index);
    const level = LEVELS[index];
    World.load(level);
    this.player = new Player(World.start.x, World.start.z, World.start.angle);
    this.cleared = false;
    this.deathTimer = 0;
    Zones.reset(level, index, Save.zones());   // 오픈월드 구역 (저장된 평정 기록 포함)
    Enemies.spawn(level, index);
    Village.spawn(level);
    Particles.reset();
    Skills.reset();
    Cape.reset();
    UI.buildMinimap();
    UI.mapOpen = false;
    Sound.setAmbient();
    Atmos.snap();   // 하늘·빛을 이 구역에 바로 맞춤 (atmos.js)
    this.levelStart = this.time;
  },

  // 오픈월드에서 쓰러지면: 구역을 다시 만들지 않고 마을 광장에서 눈을 뜸 (적은 제자리로 돌아감)
  respawn() {
    this.player = new Player(World.start.x, World.start.z, World.start.angle);
    for (const e of Enemies.list) {
      e.state = e.boss ? e.state : 'idle';
      e.timer = 0;
    }
    Arrows.list = [];
    Skills.reset();
    Cape.reset();
    this.deathTimer = 0;
    Atmos.snap();   // 마을 공기로 바로
    UI.message('마을에서 눈을 떴다', '괴물들은 들판으로 돌아갔다');
  },

  // 화면을 어둡게 한 뒤 fn 실행, 다시 밝아짐
  fadeTo(fn) {
    if (this.fadeDir) return;
    this.fadeDir = 1;
    this.afterFade = fn;
  },

  update(dt) {
    if (this.hitStop > 0) {   // 히트스톱: 그동안은 시간이 아주 느리게 흐름
      this.hitStop -= dt;
      dt *= 0.06;
    }
    this.time += dt;
    if (this.fadeDir) {
      this.fade = Utils.clamp(this.fade + this.fadeDir * dt * 2.2, 0, 1);
      if (this.fade >= 1 && this.fadeDir > 0) {
        this.afterFade();
        this.fadeDir = -1;
      } else if (this.fade <= 0 && this.fadeDir < 0) {
        this.fadeDir = 0;
      }
    }
    if (Input.wasPressed('KeyV')) {
      Camera.toggle();
      UI.toast(Camera.isFirst ? '1인칭 시점' : '3인칭 시점');
    }
    if (Input.wasPressed('KeyM')) Sound.toggleMute();
    if (Input.wasPressed('Tab')) UI.mapOpen = !UI.mapOpen;   // 세계 지도
    const p = this.player;
    p.update(dt, this.time);
    Enemies.update(dt, p, this.time);
    Village.update(dt, p, this.time);
    Zones.update(dt, p);
    Skills.update(dt, p);
    Weapons.update(dt, p);
    Character.update(p, dt, this.time);
    Character.updateGhosts(p, dt, Character.matrices(p));
    Cape.update(dt, Character.W, p.groundY, this.time);
    Camera.update(p, dt);
    Atmos.update(dt, p);   // 하루 시각·구역 공기 (atmos.js)
    Particles.update(dt, this.time, p);

    // 적을 모두 물리치면 출구가 열림 (오픈월드는 zones.js가 들판을 모두 평정했을 때 엶)
    if (!Zones.active && !this.cleared && Enemies.remaining === 0 && !Enemies.boss) {   // (보스는 다 부서져 사라진 뒤에)
      this.cleared = true;
      World.gateOpen = true;
      Sound.play('chime');
      UI.message(World.level.clearTitle || '모든 적을 물리쳤다!', '출구의 봉인이 풀렸다');
    }
    World.barrierFade += ((World.gateOpen ? 0 : 1) - World.barrierFade) * Math.min(1, dt * 1.5);
    const g = World.gate;
    if (g && World.gateOpen) {
      if (Math.random() < dt * 12) Particles.glitter(g.x, g.y, g.z);
      if (Math.hypot(p.x - g.x, p.z - g.z) < 1.3) this.nextLevel();   // 출구로 들어감
    }

    // 쓰러지면 잠시 뒤 이 구역을 처음부터 (오픈월드는 마을에서 다시)
    if (p.dead) {
      this.deathTimer += dt;
      if (this.deathTimer > 2.5) this.fadeTo(() => (Zones.active ? this.respawn() : this.loadLevel(this.levelIndex)));
    }
  },

  nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.fadeTo(() => this.loadLevel(this.levelIndex + 1));
    } else if (!this.finished) {   // 마지막 구역(보스)을 끝냄: 마을로 돌아감
      this.finished = true;
      Save.setLevel(0);
      this.fadeTo(() => {
        this.loadLevel(0);
        UI.message('동굴의 수호자를 물리치고 마을로 돌아왔다!', '이야기는 다음 단계에서 이어집니다');
      });
    }
  },

  draw() {
    Renderer.draw(this.player, this.time);
    UI.draw(this.player, this.time - this.levelStart, World.level);
  },
};

// 진행 저장: 도착한 구역 번호를 이 브라우저에만 기억 (막힌 곳에서는 저장 없이 처음부터)
const Save = {
  key: 'warrior-level',
  level() {
    try {
      const v = parseInt(localStorage.getItem(this.key), 10);
      return v >= 0 && v < LEVELS.length ? v : 0;
    } catch (e) {
      return 0;
    }
  },
  setLevel(i) {
    try {
      localStorage.setItem(this.key, String(i));
    } catch (e) { /* 저장이 막힌 곳 */ }
  },
  // 오픈월드에서 평정한 구역 id 목록
  zonesKey: 'warrior-zones',
  zones() {
    try {
      const v = JSON.parse(localStorage.getItem(this.zonesKey) || '[]');
      return Array.isArray(v) ? v.filter((id) => typeof id === 'string') : [];
    } catch (e) {
      return [];
    }
  },
  setZones(ids) {
    try {
      localStorage.setItem(this.zonesKey, JSON.stringify(ids));
    } catch (e) { /* 저장이 막힌 곳 */ }
  },
};

function showError(msg) {
  const box = document.getElementById('error');
  box.textContent = msg;
  box.style.display = 'flex';
}

// 자동 화질: 계속 느리면 해상도를 조금씩 낮추고, 여유가 생기면 다시 올림
const AutoQuality = {
  scale: 1,     // 해상도에 곱하는 값 (0.6 ~ 1)
  avg: 16,      // 최근 프레임 간격 평균 (ms)
  timer: 0,
  update(frameSec) {
    if (!CONFIG.graphics.autoQuality || frameSec > 0.1) return;   // 다른 창에 가려져 멈췄던 프레임은 무시
    this.avg += (frameSec * 1000 - this.avg) * 0.05;
    this.timer += frameSec;
    if (this.timer < 2) return;
    this.timer = 0;
    if (this.avg > 24 && this.scale > 0.6) {
      this.scale = Math.max(0.6, this.scale - 0.1);
      resize();
    } else if (this.avg < 14 && this.scale < 1) {
      this.scale = Math.min(1, this.scale + 0.1);
      resize();
    }
  },
};

// 브라우저 창 크기에 맞춰 화면 해상도 조절 (너무 크면 느려지므로 CONFIG.graphics.maxPixels 화소까지)
function resize() {
  if (!UI.canvas) return;   // 시작에 실패했으면 무시
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let scale = dpr * CONFIG.graphics.renderScale * AutoQuality.scale;
  scale = Math.min(scale, Math.sqrt(CONFIG.graphics.maxPixels / (w * h)));
  viewCanvas.width = Math.round(w * scale);
  viewCanvas.height = Math.round(h * scale);
  UI.resize(Math.round(w * dpr), Math.round(h * dpr));
}

// 게임 루프: 1초에 약 60번 '갱신 → 그리기'를 반복
let lastTime = performance.now();
function loop(now) {
  const frameSec = (now - lastTime) / 1000;
  const dt = Math.min(frameSec, 0.05);   // 다른 탭에 다녀와도 시간이 튀지 않게
  lastTime = now;
  AutoQuality.update(frameSec);
  Game.update(dt);
  Sound.update(dt);   // (게임이 잠깐 멈칫해도 음악 박자는 그대로)
  Game.draw();
  Input.endFrame();
  requestAnimationFrame(loop);
}

// 휴대폰·태블릿(터치 화면만 있는 기기): 무거운 효과를 줄이고 시작
if (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) Object.assign(CONFIG.graphics, CONFIG.mobileGraphics);
Input.init(hudCanvas);
TouchControls.init(hudCanvas);
Sound.init();
window.addEventListener('resize', resize);
try {
  if (Game.start()) {
    resize();
    requestAnimationFrame(loop);
  }
} catch (e) {
  showError('오류가 났어요: ' + e.message);
  console.error(e);
}
