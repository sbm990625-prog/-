// 3D 화면 그리기: 그림자 지도 → 하늘 → 땅·나무·풀·먼 산 → 전사(외곽선) → 물 → 꽃가루 → (1인칭) 손과 검 → 후처리

// 테마별 빛과 하늘 (밝기 숫자는 1보다 커도 됨: 마지막에 화면에 맞게 눌러 줌)
const MOON_DIR = V3.normalize([0.48, 0.58, 0.66]);   // 달이 떠 있는 방향 (동남쪽 하늘, 밤엔 이쪽에서 달빛이 비춤)
const LIGHTING = {
  // 맑은 낮 숲 (젤다 야숨풍): 부드러운 햇빛, 밝은 그늘, 옅은 하늘색 공기, 파스텔 연두
  forest: {
    sunDir: V3.normalize([-0.6, 0.55, 0.58]),   // 해가 있는 방향 (서남쪽, 늦은 오후)
    sunColor: [1.6, 1.48, 1.2],                 // 햇빛 (부드러운 금빛. 너무 세면 풀이 형광 연두로 타 버림)
    skyColor: [0.42, 0.44, 0.48],               // 위에서 오는 하늘빛 (흰빛에 가까운 옅은 푸른빛)
    groundColor: [0.3, 0.33, 0.18],             // 아래에서 반사되는 땅빛 (밝은 풀밭의 연둣빛이 나무 밑면을 밝힘)
    fogColor: [0.3, 0.5, 0.95],                 // 안개 = 지평선 하늘 색 (옅은 물빛 하늘: 하얗게 바래지 않고 맑게)
    zenith: [0.2, 0.32, 0.61],                  // 머리 위 하늘 색 (맑고 옅은 파랑)
    cloudLit: [1.3, 1.24, 1.15],                // 구름의 볕 받은 쪽 색
    cloudShade: [0.26, 0.31, 0.42],             // 구름 그늘 색 (화면 보정에서 밝게 눌리므로 짙게 잡아야 푸른 회색으로 보임)
    cumulus: 1,                                 // 지평선 뭉게구름 양 (0이면 없음)
    cumulusBase: 0.15,                          // 구름 밑동 높이 (낮춘 산맥 바로 뒤에 숨음, 0 = 지평선)
    cumulusTop: 0.7,                            // 가장 높이 솟은 구름 꼭대기 (그 위 하늘은 맑게)
    wisps: 0.6,                                 // 높은 하늘의 새털구름 양
    rays: 1,                                    // 빛줄기 세기
    particles: true,                            // 떠다니는 빛 알갱이
    particleColor: [1.0, 0.93, 0.65],           // 꽃가루 (금빛)
    terminator: 0.45,                           // 빛과 그늘 경계의 너비 (클수록 붓으로 문지른 듯 부드러움, 기본 0.22)
    shadeDesat: 0.4,                            // 그늘의 색을 빼는 정도 (짙은 초록 대신 차분한 회녹색 그늘)
    leafGlow: 0.12,                             // 그늘진 잎으로 비쳐 드는 햇빛 (나무 그늘이 칙칙하지 않게)
    moss: [0.1, 0.15, 0.05],                    // 바위 윗면 이끼 색 (옅은 올리브)
    saturation: 1.14,                           // 화면 채도 (기본 1.22. 밝기 곡선·공기로 뽀얘지는 만큼 조금 올리고, 어두운 곳은 darkDesat이 다시 뺌)
    contrast: 0.97,                             // 화면 대비 (기본 1.05, 낮을수록 공기처럼 부드러움)
    split: 0.7,                                 // 그늘은 푸르게·밝은 곳은 따뜻하게 나누는 정도 (기본 1)
    lift: [0.015, 0.02, 0.03],                  // 어두운 곳을 하늘빛으로 살짝 띄움 (흐린 물감 느낌)
    aoStrength: 0.6,                            // 주변 가림 세기 (기본 0.85)
    haze: [0.17, 0.25, 0.42, 0.0055],           // 공기 원근감: 먼 언덕·산이 잠기는 푸른 공기 색 + 짙기
    hazeStart: 30,                              // 이 거리(m)부터 먼 공기가 덮임 (20~60m 나무·집은 제 색을 지킴. 예전 20)
    fogScale: 0.72,                             // 가까운 안개는 조금 옅게 (먼 곳은 공기 원근감이 맡음. 예전 0.85)
    farFog: 0.7,                                // 먼 산·언덕 모델의 하늘색 안개 배율 (대신 푸른 공기 색에 잠김)
    mountainScale: 0.55,                        // 먼 산맥 높이 배율 (지평선 위로 낮게 깔리게)
    // 화면 마무리 (야숨풍: 밝고 뽀얀 공기, 크림색 밝은 곳, 올리브빛 차분한 그늘, 먼 곳은 물감처럼 부드럽게)
    curve: [0.16, 0.08, 0.04],                  // 밝기 곡선: 어두운 곳 띄우기 · 밝은 곳 눌러 주기(가장 밝아도 0.92) · 노출 +4%
    shadeTint: [1.03, 1.0, 0.97],               // 그늘 쪽 색 (야숨 그늘은 푸르지 않고 따뜻한 올리브빛)
    highTint: [1.03, 1.01, 0.84],               // 밝은 쪽 색 (하얗게 타는 대신 따뜻한 크림색)
    skyKeep: 0.75,                              // 하늘은 색 나누기를 덜 받아 맑은 물빛 그대로
    darkDesat: 0.15,                            // 어두운 곳 색 빼기 (탁한 진초록 대신 차분한 회녹색)
    bloomKnee: [0.55, 0.95],                    // 빛 번짐이 시작·가득 차는 밝기 (낮춰서 하늘·구름·볕 받은 풀이 은은하게 번짐)
    bloomScale: 1.3,                            // 빛 번짐 세기 배율
    bloomScreen: 1,                             // 빛 번짐·빛줄기를 스크린으로 섞음 (하얗게 타지 않고 뽀얗게)
    bloomTint: [1.0, 0.97, 0.9],                // 빛 번짐 색 (따뜻한 햇빛)
    veil: [0.66, 0.74, 0.8],                    // 몇 걸음 앞부터 덮이는 뽀얀 공기 색 (화면 밝기 기준, 옅은 푸른 회색)
    veilK: [10, 0.014, 0.31],                   // 공기: 시작 거리(m) · 짙어지는 빠르기 · 최대 짙기 (전사·가운데 숲은 또렷, 먼 숲은 뽀얗게. 예전 [5, 0.022, 0.35])
    dof: [40, 150, 0.45],                       // 먼 곳 흐림: 시작 거리(m) · 가장 흐린 거리(m) · 최대 섞는 정도 (CONFIG.graphics.softFocus. 예전 [30, 130, 0.5])
    // 캐릭터 그림체 (야숨풍). 없는 값은 예전 그대로 (useWorld의 기본값)
    // soft 명암 경계 너비, shade 그늘 밝기, lit 밝은 면 밝기, sky 그늘이 하늘·땅빛을 받는 정도,
    // rim 윤곽 빛, grad 밝은 면의 둥근 그러데이션, metal 금속 대비, sheer 망토에 비치는 햇빛
    cel: { soft: 0.11, shade: 1.12, lit: 1.8, sky: 0.5, rim: 0.3, grad: 0.12, metal: 0.55, sheer: 0.3 },
    outline: 0.8,                               // 캐릭터 외곽선 두께 배율 (기본 1)
    outlineTone: [0.58, 1.0],                   // 외곽선 색: [그 부분 색을 몇 배로 어둡게, 그 색을 섞는 비율 (나머지는 검정)] (기본 [0.3, 0.8])
    // 땅·물 (지형 작업): 마른 풀밭은 주황 대신 옅은 밀짚빛, 양도 줄임. 구역별 양은 map.js BIOMES의 gold
    gold: 0.55,                                 // 마른 풀밭 양 (1이면 예전만큼)
    goldHue: [[1.3, 1.1, 0.42], [1.5, 1.08, 0.34]],   // 마른 풀밭 땅 색 [옅은 쪽, 짙은 쪽] (풀빛 밝기에 곱함)
    water: { murk: [0.07, 0.08, 0.035], murkDeep: [0.025, 0.03, 0.014], duckweed: [0.1, 0.16, 0.035] },   // 늪 물: 얕은 곳 흐린 올리브, 깊은 곳 짙은 갈색, 개구리밥
    // ---- 오픈월드의 하루·구역 공기 (atmos.js가 시간·구역에 따라 섞어 씀). 아래 값이 '맑은 낮' 그대로의 모습 ----
    grade: [1, 1, 1],                           // 화면 전체 색 보정 (낮은 그대로)
    mist: [0.3, 1.6],                           // 낮은 곳 물안개: [짙기, 높이에 따라 옅어지는 빠르기] (늪지는 짙고 높게)
    cloudRays: 0,                               // 볕 받은 구름에서도 빛줄기가 나옴 (노을·새벽만)
    celAmbient: 1,                              // 캐릭터 그늘 밝기
    particleGain: 1,                            // 떠다니는 빛 알갱이(꽃가루·반딧불) 밝기 배율
    night: 0,                                   // 밤인 정도 (0 낮 ~ 1 밤): 별·달·반딧불·밤에만 켜지는 불빛
    moonDir: MOON_DIR,                          // 달 방향 (하늘에 달을 그리는 곳)
    sunDisc: 1,                                 // 하늘에 해를 그리는 정도 (어스름·밤엔 0)
    lampBoost: 1,                               // 등불·모닥불 밝기 배율 (밤엔 세게)
    lampRange: 1,                               // 등불·모닥불이 닿는 거리 배율 (밤엔 넓게)
    glowK: 1,                                   // 스스로 빛나는 부분(창문·등불 유리)의 밝기 배율
    fireflies: 0.55,                            // 밤 반딧불 양 (0~1, 구역마다 ZONE_AIR 배율: 늪지·초원은 많게, 마을은 적게)
    beams: 0,                                   // 나무 사이로 비스듬히 내리는 햇살 기둥 (북쪽 숲에서만 ZONE_AIR가 켬)
    beamColor: [1.0, 0.9, 0.62],                // 햇살 기둥 색 (먼지 낀 금빛)
    cloudShadow: [0.024, 0.46, 0.61, 0.38],     // 땅 위를 흘러가는 구름 그림자: [얼룩 크기(작을수록 큰 얼룩), 시작, 끝(경계 부드러움), 짙기] (예전 [0.015, 0.5, 0.68, 0.3])
  },
  // 노을 진 저녁 숲: 낮게 깔린 주황빛 해, 보랏빛 하늘, 분홍빛 구름, 반딧불
  dusk: {
    sunDir: V3.normalize([0.75, 0.2, -0.55]),   // 출구 쪽(동북쪽) 지평선 가까이 낮은 해 → 길게 늘어진 그림자, 역광
    sunColor: [2.3, 0.92, 0.34],
    skyColor: [0.22, 0.19, 0.42],
    groundColor: [0.16, 0.09, 0.07],
    fogColor: [0.95, 0.58, 0.45],
    zenith: [0.12, 0.13, 0.42],
    cloudLit: [1.25, 0.62, 0.38],               // 노을빛 받은 쪽 (너무 밝으면 화면 보정에서 하얗게 바램)
    cloudShade: [0.3, 0.2, 0.36],               // 보랏빛 그늘
    cumulus: 0.85,
    cumulusBase: 0.3,                           // 이 장의 산맥은 높아서 구름 밑동도 높게
    cumulusTop: 0.8,
    wisps: 0.5,
    rays: 1.5,
    particles: true,
    particleColor: [0.8, 1.0, 0.35],            // 반딧불 (연둣빛)
    particleGain: 1.6,                          // 반딧불은 더 밝게
    grade: [1.1, 0.86, 0.84],                   // 화면 전체를 주홍빛 저녁 색으로
    cel: { soft: 0.07, sky: 0.35, sheer: 0.5 }, // 캐릭터: 그늘은 보랏빛 하늘을 띠고, 해를 향해 걸으면 망토가 노을빛으로 비침
    // 야숨풍으로 조금 부드럽게 (노을빛은 그대로 두고, 금빛 풀이 새빨갛게 타지 않게·역광 그늘이 새까맣지 않게)
    gold: 0.4,                                  // 금빛 마른 풀밭 양 (숲의 0.4배)
    goldHue: [[1.55, 1.0, 0.1], [2.0, 0.84, 0.06]],   // 마른 풀밭 땅 색: 황록빛 ~ 주황빛 금색 (예전 그대로)
    goldTuftTint: [1.06, 0.76, 0.5],            // 마른 풀 포기 색 배율 (풀 모델은 낮의 밀짚빛이라 노을에선 주황빛으로 되돌림)
    cloudRays: 1,                               // 해가 산 너머에 걸려 있어 볕 받은 구름에서도 빛줄기가 나옴
    terminator: 0.32,                           // 명암 경계를 조금 부드럽게
    shadeDesat: 0.25,                           // 그늘 색을 조금 빼서 차분하게
    saturation: 1.06,                           // 화면 채도 (기본 1.22)
    contrast: 1.0,
    curve: [0.1, 0.04, 0],                      // 어두운 곳을 살짝 띄우고 밝은 곳은 부드럽게 눌러 줌
    darkDesat: 0.1,
  },
  // 수정 동굴: 천장 구멍으로만 햇빛이 들고, 나머지는 횃불·수정 빛. 어둡고 푸른 공기
  cave: {
    sunDir: V3.normalize([0.28, 1, 0.16]),      // 거의 머리 위 (천장 구멍 → 바닥으로 비스듬히)
    sunColor: [2.1, 1.95, 1.6],
    skyColor: [0.13, 0.15, 0.24],               // 그늘의 은은한 빛 (바위에 반사된 푸른 기운)
    groundColor: [0.05, 0.045, 0.04],
    fogColor: [0.03, 0.038, 0.06],
    fogScale: 2.3,                              // 안개를 숲보다 훨씬 짙게 (멀리는 어둠에 잠김)
    zenith: [1.5, 1.7, 2.0],                    // 구멍 너머로 보이는 하늘 (밖은 눈부신 한낮)
    cloudLit: [1.3, 1.24, 1.15],
    cloudShade: [0.58, 0.64, 0.78],
    rays: 0,                                    // 화면 빛줄기 대신 구멍마다 빛기둥을 그림
    particles: true,
    particleColor: [0.5, 0.65, 0.85],           // 떠다니는 먼지 (푸르스름)
    shaftColor: [1.0, 0.92, 0.7],               // 천장 구멍 빛기둥 색
    grade: [0.92, 0.98, 1.1],                   // 화면 전체를 서늘하게
    shadowOutside: 0,                           // 그림자 지도 바깥 = 천장에 가린 어둠
    clouds: false,
    cumulus: 0,                                 // 구멍 너머 하늘은 구름 없이 (계산도 아낌)
    wisps: 0,
    celAmbient: 0.4,                            // 캐릭터 그늘도 어둡게
  },
};

// ---------- 오픈월드의 하루 (atmos.js가 시각에 따라 이 값들을 차례로 섞음) ----------
// 모두 '맑은 낮(forest)' 값을 물려받고 바뀌는 값만 적음 → 섞을 때 빠진 값 때문에 갑자기 튀는 일이 없음
// 해 방향(sunDir)은 그림자가 기어가듯 떨리지 않게 atmos.js가 몇 초에 한 번씩 끊어서 옮김
// skySun은 하늘에 그리는 해(원반·노을빛·구름 밝은 쪽) 자리: 빛 방향은 해 진 뒤 달 쪽으로 올라가지만,
// 하늘의 해는 지평선 아래로 계속 지고(노을) 아래에서 떠오름(새벽) → '진 해가 다시 떠오르는' 모습이 없음
const DAY = LIGHTING.forest;
DAY.skySun = DAY.sunDir;   // 낮에는 빛 방향과 같음
const dayPreset = (over, cel) => Object.assign({}, DAY, over, { cel: Object.assign({}, DAY.cel, cel) });
const SUNSET_DIR = V3.normalize([-0.88, 0.2, 0.42]);   // 서쪽 지평선 가까이 낮은 해
const DAWN_DIR = V3.normalize([-0.3, 0.21, 0.93]);     // 새벽 해 (남쪽 낮게: 낮 해 자리까지 조금만 움직이도록)
const SET_SKY = V3.normalize([-0.88, -0.06, 0.42]);    // 어스름의 하늘 해 자리: 서쪽 지평선 바로 아래 (서쪽 하늘에 노을빛이 남음)
const RISE_SKY = V3.normalize([-0.3, -0.06, 0.93]);    // 새벽 전 하늘 해 자리: 새벽 해 바로 아래 (그쪽 하늘부터 밝아짐)
// 해 질 녘: 복숭앗빛 하늘, 역광에 분홍빛으로 물드는 산, 길게 늘어진 그림자
LIGHTING.sunset = dayPreset({
  sunDir: SUNSET_DIR, skySun: SUNSET_DIR,
  sunColor: [2.0, 1.2, 0.6],
  skyColor: [0.3, 0.27, 0.42],
  groundColor: [0.2, 0.15, 0.09],
  fogColor: [0.95, 0.66, 0.55],
  zenith: [0.16, 0.2, 0.5],
  cloudLit: [1.35, 0.82, 0.58],
  cloudShade: [0.34, 0.26, 0.4],
  rays: 1.3, cloudRays: 1,
  particleColor: [1.0, 0.8, 0.5],
  saturation: 1.1,
  grade: [1.05, 0.96, 0.92],
  veil: [0.8, 0.68, 0.64],
  haze: [0.36, 0.3, 0.42, 0.006],
  highTint: [1.05, 0.97, 0.84],
  bloomTint: [1.0, 0.88, 0.72],
  lampBoost: 1.2, glowK: 1.15,
  mist: [0.4, 1.4],
}, { sheer: 0.45 });
// 어스름: 해는 졌고 하늘은 푸르스름한 보랏빛. 빛이 가장 약한 때에 빛 방향을 달 쪽으로 옮김
LIGHTING.twilight = dayPreset({
  sunDir: V3.normalize(V3.add(SUNSET_DIR, MOON_DIR)),
  skySun: SET_SKY,                     // 하늘의 해는 지평선 아래로 (빛 방향만 달 쪽으로)
  sunColor: [0.35, 0.25, 0.35],
  skyColor: [0.12, 0.12, 0.23],
  groundColor: [0.05, 0.045, 0.05],
  fogColor: [0.33, 0.28, 0.45],
  zenith: [0.06, 0.07, 0.2],
  cloudLit: [0.24, 0.17, 0.26],        // 해 진 쪽 구름 밑은 옅은 분홍 (화면에선 밝기가 크게 올라가므로 낮게)
  cloudShade: [0.07, 0.06, 0.12],
  rays: 0, cloudRays: 0,
  particleColor: [1.05, 1.3, 0.5],
  particleGain: 1.3,
  saturation: 0.95, contrast: 1.0,
  curve: [0.09, 0.05, 0],
  lift: [0.01, 0.012, 0.028],
  grade: [0.9, 0.92, 1.08],
  veil: [0.3, 0.27, 0.38],
  haze: [0.14, 0.13, 0.25, 0.0065],
  shadeTint: [0.98, 0.98, 1.04], highTint: [1.02, 0.97, 0.9],
  bloomKnee: [0.42, 0.85], bloomScale: 1.5, bloomTint: [1.0, 0.9, 0.78],
  leafGlow: 0.04,
  celAmbient: 0.65,
  mist: [0.45, 1.25],
  night: 0.5, sunDisc: 0,
  lampBoost: 1.2, lampRange: 1.0, glowK: 1.35,
  cloudShadow: [0.024, 0.46, 0.61, 0.2],
}, { lit: 1.2, shade: 1.0, rim: 0.35 });
// 달밤: 짙은 남색 하늘에 별과 달. 달빛은 푸르고 어둡지만 전사·적은 또렷하게, 등불·모닥불은 따뜻하게 빛남
LIGHTING.night = dayPreset({
  sunDir: MOON_DIR,                     // 밤에는 달빛이 그림자를 만듦
  skySun: MOON_DIR,                     // 구름도 달 쪽이 밝음
  sunColor: [0.17, 0.23, 0.42],         // 달빛 (빨강을 0.1보다 낮추면 캐릭터 색 계산이 튐)
  skyColor: [0.05, 0.07, 0.14],
  groundColor: [0.018, 0.025, 0.03],
  fogColor: [0.05, 0.08, 0.16],
  zenith: [0.01, 0.017, 0.06],
  cloudLit: [0.045, 0.055, 0.09],       // 구름은 어두운 회색 (달 쪽 가장자리만 은빛. 화면에선 밝기가 크게 올라가므로 아주 낮게)
  cloudShade: [0.012, 0.016, 0.03],
  rays: 0, cloudRays: 0,
  particleColor: [1.1, 1.5, 0.45],      // 반딧불 (연둣빛)
  particleGain: 1.6,
  saturation: 0.8, contrast: 1.02,
  curve: [0.07, 0.04, 0],
  lift: [0.006, 0.01, 0.025],
  grade: [0.9, 0.95, 1.1],              // 화면 전체를 푸른 달빛 색으로 (너무 세면 등불의 주황빛까지 바래짐)
  veil: [0.07, 0.1, 0.17],              // 뽀얀 공기도 어둡게 (밝으면 화면이 우윳빛으로 뜸)
  haze: [0.03, 0.05, 0.11, 0.007],
  shadeTint: [0.97, 1.0, 1.06], highTint: [1.0, 0.97, 0.9],
  darkDesat: 0.25,
  bloomKnee: [0.35, 0.75], bloomScale: 1.7, bloomTint: [1.0, 0.9, 0.75],   // 등불·창문·반딧불이 번지게
  leafGlow: 0.02,
  celAmbient: 0.42,
  mist: [0.45, 1.2],
  night: 1, sunDisc: 0,
  lampBoost: 1.5, lampRange: 1.05, glowK: 1.6,   // 등불·모닥불: 둘레만 따뜻하게 (너무 넓으면 광장 전체가 낮처럼 밝아짐)
  cloudShadow: [0.024, 0.46, 0.61, 0.15],
}, { lit: 0.75, shade: 0.95, rim: 0.4 });
// 새벽 전 어스름: 달에서 새벽 해 쪽으로 빛 방향을 옮기는 때 (보랏빛에서 분홍빛으로)
LIGHTING.predawn = dayPreset(Object.assign({}, LIGHTING.twilight, {
  sunDir: V3.normalize(V3.add(MOON_DIR, DAWN_DIR)),
  skySun: RISE_SKY,                     // 하늘의 해는 새벽 해 자리 바로 아래에서 떠오를 준비
  fogColor: [0.36, 0.3, 0.46],
  cloudLit: [0.28, 0.2, 0.28],
  grade: [0.92, 0.92, 1.06],
}), LIGHTING.twilight.cel);
// 새벽: 분홍빛 안개, 옅은 복숭앗빛 구름, 낮은 곳에 물안개
LIGHTING.dawn = dayPreset({
  sunDir: DAWN_DIR, skySun: DAWN_DIR,
  sunColor: [1.55, 1.02, 0.88],
  skyColor: [0.34, 0.31, 0.42],
  groundColor: [0.2, 0.17, 0.13],
  fogColor: [0.9, 0.66, 0.78],
  zenith: [0.2, 0.27, 0.55],
  cloudLit: [1.3, 0.88, 0.86],
  cloudShade: [0.3, 0.27, 0.4],
  rays: 1.2, cloudRays: 1,
  particleColor: [1.0, 0.85, 0.7],
  saturation: 1.08,
  grade: [1.04, 0.95, 1.02],
  veil: [0.84, 0.7, 0.78],
  haze: [0.42, 0.32, 0.48, 0.0065],
  highTint: [1.04, 0.98, 0.9],
  bloomTint: [1.0, 0.9, 0.85],
  mist: [0.55, 1.0],
  lampBoost: 1.2, glowK: 1.15,
}, { sheer: 0.4 });

// ---------- 구역마다 다른 공기 (atmos.js가 전사가 있는 구역 쪽으로 몇 초에 걸쳐 섞음) ----------
// 숫자는 위 하루 값에 곱하는 배율 (1 = 그대로, 배열은 칸마다). add는 더하는 값. 마을·초원은 지금 모습 그대로
// (지을 때 한 번만 읽는 gold·mountainScale 같은 값은 여기 넣지 말 것)
const ZONE_AIR = {
  // 남쪽 늪지: 희뿌옇고 푸르스름한 초록 물안개가 낮게 깔리고, 먼 나무는 흐릿하게
  marsh: { fogScale: 1.55, veil: [0.94, 0.98, 0.84], veilK: [0.8, 1.5, 1.45], fogColor: [1.05, 1.05, 0.82], haze: [1.15, 1.1, 0.75, 1.35],
    skyColor: [1, 1.04, 0.92], sunColor: [0.92, 0.92, 0.9], grade: [0.97, 1.02, 0.95], saturation: 0.95, mist: [1.9, 0.6], dof: [0.8, 0.85, 1.2], fireflies: 1.7 },
  // 서쪽 바위 언덕: 맑고 투명한 공기, 멀리까지 또렷하게
  hills: { fogScale: 0.65, veilK: [1.4, 0.7, 0.6], haze: [1, 1, 1, 0.7], sunColor: [1.05, 1.04, 1.02], contrast: 1.03, saturation: 1.05,
    dof: [1.3, 1.2, 0.6], mist: [0.5, 1], fireflies: 0.6 },
  // 북쪽 숲: 잎 그늘 아래 어둑하고 푸른 초록빛, 잎 사이로 비치는 빛과 빛줄기는 세게 + 비스듬한 햇살 기둥
  woods: { skyColor: [0.74, 0.82, 0.74], groundColor: [0.66, 0.74, 0.6], sunColor: [0.9, 0.92, 0.84], leafGlow: 1.6, veil: [0.84, 0.95, 0.84],
    veilK: [0.9, 1.2, 1.25], aoStrength: 1.25, rays: 1.6, grade: [0.94, 0.99, 0.92], mist: [1.3, 0.8], add: { beams: 1.4 } },
  meadow: { fireflies: 1.6 },   // 동쪽 초원: 밤에 반딧불이 많음
  village: { fireflies: 0.5 },  // 마을: 반딧불은 조금만
};

const IDENTITY = M4.identity();
const MIST_DEFAULT = [0.3, 1.6];                         // 물안개 기본값 (테마에 mist가 없을 때 = 예전 그대로)
const CLOUD_SHADOW_DEFAULT = [0.015, 0.5, 0.68, 0.3];    // 구름 그림자 기본값 (예전 그대로)
const TREE_LOD = 30;   // 이 거리(m)보다 먼 구역의 나무는 면이 적은 모양으로 그림 (Models.far)

// 카메라가 보는 범위(시야 사각뿔)의 6면. 행렬 m = 투영 x 카메라
function frustumPlanes(m) {
  const row = (i) => [m[i], m[i + 4], m[i + 8], m[i + 12]];
  const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
  const comb = (a, s) => r3.map((v, i) => v + s * a[i]);
  return [comb(r0, 1), comb(r0, -1), comb(r1, 1), comb(r1, -1), comb(r2, 1), comb(r2, -1)];
}

// 상자가 시야 안에 조금이라도 걸치는지
function boxVisible(planes, box) {
  for (const [a, b, c, d] of planes) {
    const x = a > 0 ? box.max[0] : box.min[0];
    const y = b > 0 ? box.max[1] : box.min[1];
    const z = c > 0 ? box.max[2] : box.min[2];
    if (a * x + b * y + c * z + d < 0) return false;
  }
  return true;
}

// 점에서 상자까지 가장 가까운 거리
function boxDistance(box, p) {
  let s = 0;
  for (let k = 0; k < 3; k++) {
    const d = Math.max(box.min[k] - p[k], 0, p[k] - box.max[k]);
    s += d * d;
  }
  return Math.sqrt(s);
}

// 시야 면들을 길이 1로 맞춤 (공 모양 검사에서 면까지의 거리를 m로 재려면 필요)
function normPlanes(planes) {
  return planes.map(([a, b, c, d]) => {
    const l = Math.hypot(a, b, c) || 1;
    return [a / l, b / l, c / l, d / l];
  });
}

// 공(가운데 c, 반지름 r)이 시야 안에 조금이라도 걸치는지 (planes는 normPlanes로 맞춘 것)
function sphereVisible(planes, c, r) {
  for (const [a, b, cc, d] of planes) if (a * c[0] + b * c[1] + cc * c[2] + d < -r) return false;
  return true;
}

// 화면의 일부 사각형 [x0, y0, x1, y1] (-1~1)만 보는 시야의 6면 (물에 비친 모습은 물이 보이는 부분만 그림)
function rectPlanes(m, rect) {
  const row = (i) => [m[i], m[i + 4], m[i + 8], m[i + 12]];
  const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
  const mix = (a, s, b, t) => a.map((v, i) => s * v + t * b[i]);
  const [x0, y0, x1, y1] = rect;
  return [mix(r0, 1, r3, -x0), mix(r3, x1, r0, -1), mix(r1, 1, r3, -y0), mix(r3, y1, r1, -1), mix(r3, 1, r2, 1), mix(r3, 1, r2, -1)];
}

// 모델이 차지하는 상자 (외곽선 두께를 맞출 때 사용)
function boundsOf(b) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < b.pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], b.pos[i + k]);
      mx[k] = Math.max(mx[k], b.pos[i + k]);
    }
  }
  return { c: mn.map((v, k) => (v + mx[k]) / 2), s: mn.map((v, k) => Math.max(mx[k] - v, 0.01)) };
}

const Renderer = {
  p: {},           // 셰이더 프로그램들
  shadow: null,    // 그림자 지도
  particles: null,
  partMesh: {},    // 관절로 움직이는 몸 부분 모델 (기사·적·화살)
  partBox: {},     // 부분별 크기 (외곽선 두께 맞추기용)
  lights: { pos: new Float32Array(48), col: new Float32Array(36), count: 0 },   // 이번 화면의 점 빛 (gatherLights)
  L: LIGHTING.forest,   // 이번 화면의 빛 값 (Atmos.L: 오픈월드는 시각·구역에 따라 섞인 값, 다른 구역은 테마 값 그대로)
  fog: 0.013,      // 이번 화면의 안개 짙기 (테마별 배율 적용)
  vp: null,        // 마지막 화면의 '투영 x 카메라' 행렬 (글자를 3D 위치에 띄울 때 사용)

  init() {
    const gl = GL.gl;
    for (const name of ['world', 'shadow', 'sky', 'particle', 'trail', 'outline', 'water', 'fx', 'barrier', 'glow', 'ghost']) {
      this.p[name] = GL.program(SHADERS[name + 'VS'], SHADERS[name + 'FS']);
    }
    this.skyVao = gl.createVertexArray();   // 하늘은 정점 데이터 없이 셰이더에서 만듦
    this.leafTex = GL.createTexture(Models.leafTexture);
    this.armMesh = GL.createMesh(Models.arm);
    const register = (name, b) => {
      this.partMesh[name] = GL.createMesh(b);
      this.partBox[name] = boundsOf(b);
    };
    for (const name in Character.parts) register(name, Character.parts[name]);
    for (const name in Enemies.models) register(name, Enemies.models[name]);
    Weapons.models.forEach((b, i) => register('weapon' + i, b));   // 무기 3종 ('weapon0' 발뭉, 'weapon1' 레바테인, 'weapon2' 아스트라페)
    this.initShadow();
    this.initParticles();
    this.initTrail();
    this.initFX();
    Post.init();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  },

  // 그림자 지도 두 장: 넓은 것(멀리까지) + 촘촘한 것(전사 주변만, 그림자가 또렷함)
  initShadow() {
    this.shadow = this.makeShadow(CONFIG.graphics.shadowSize);
    this.shadowNear = this.makeShadow(Math.min(2048, CONFIG.graphics.shadowSize));
  },

  // 그림자 지도: 해 쪽에서 본 '가장 가까운 물체까지 거리'를 그리는 그림
  makeShadow(size) {
    const gl = GL.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, size, size);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.clear(gl.DEPTH_BUFFER_BIT);   // 그림자를 꺼도 '그림자 없음' 상태가 되도록
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, size };
  },

  initParticles() {
    const gl = GL.gl, n = 280, rnd = Utils.rng(3);
    const data = new Float32Array(n * 3).map(() => rnd());
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.particles = { vao, n };
  },

  // 나비·새·낙엽·먼지용 버퍼 (매 프레임 새로 채움). 점마다 숫자 10개
  initFX() {
    const gl = GL.gl;
    this.fxVao = gl.createVertexArray();
    gl.bindVertexArray(this.fxVao);
    this.fxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 40 * 512, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 40, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 40, 28);
    gl.bindVertexArray(null);
  },

  // 스킬의 빛 (Glow에 모인 삼각형): 빛을 더하는 방식
  drawGlow(proj, view) {
    const data = Glow.data;
    if (!data.length) return;
    const gl = GL.gl, P = this.p.glow;
    if (!this.glowVao) {
      this.glowVao = gl.createVertexArray();
      gl.bindVertexArray(this.glowVao);
      this.glowBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.glowBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
    }
    gl.bindVertexArray(this.glowVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glowBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    const top = Glow.top / 7;   // 앞쪽 일부(타격 섬광)는 무엇에도 가려지지 않게
    if (top > 0) {
      gl.disable(gl.DEPTH_TEST);
      gl.drawArrays(gl.TRIANGLES, 0, top);
      gl.enable(gl.DEPTH_TEST);
    }
    if (data.length / 7 > top) gl.drawArrays(gl.TRIANGLES, top, data.length / 7 - top);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  },

  drawFX(proj, view, time, H) {
    if (!Particles.list.length) return;
    const gl = GL.gl, P = this.p.fx;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, Particles.data(), gl.DYNAMIC_DRAW);
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniform1f(P.u.uScale, (H * proj[5]) / 2);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform1f(P.u.uLight, 1 - 0.8 * (this.L.night || 0));   // 밤엔 먼지·낙엽이 혼자 밝게 뜨지 않게
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.depthMask(false);
    gl.bindVertexArray(this.fxVao);
    gl.drawArrays(gl.POINTS, 0, Particles.list.length);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  },

  initTrail() {
    const gl = GL.gl;
    this.trailVao = gl.createVertexArray();
    gl.bindVertexArray(this.trailVao);
    this.trailBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * 64, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
    gl.bindVertexArray(null);
  },

  draw(player, time) {
    const gl = GL.gl;
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const L = this.L = Atmos.current();   // 하늘·빛 (atmos.js)
    this.fog = CONFIG.graphics.fogDensity * (L.fogScale || 1);
    this.gatherLights(player, time);
    const eye = Camera.eye;
    const near = 0.05, far = 1000;
    const proj = M4.perspective(Utils.rad(CONFIG.graphics.fov + player.fovKick), W / H, near, far);
    let view = M4.lookAt(eye, Camera.look, [0, 1, 0]);
    if (Camera.isFirst) view = M4.multiply(M4.rotationZ(player.roll), view);
    const lightVP = this.lightMatrix(player, L, 38, 14, 120, this.shadow.size);
    this.lightVP = lightVP;
    this.lightVPNear = this.lightMatrix(player, L, 9, 2, 40, this.shadowNear.size);
    const body = Character.matrices(player);
    const foes = Enemies.parts(time);
    this.vp = M4.multiply(proj, view);

    if (CONFIG.graphics.shadows) {
      this.drawShadowMap(lightVP, this.shadow, time, body.concat(foes), player);
      this.drawShadowMap(this.lightVPNear, this.shadowNear, time, body.concat(foes), player);
    }

    // 가까운 연못·늪 물(reflDist 안)이 화면에 보일 때만 물에 비친 모습을 먼저 그려 둠 (물이 보이는 화면 부분만)
    if (W !== Post.w || H !== Post.h) Post.resize(W, H);
    this.reflRect = World.water && CONFIG.graphics.reflections ? this.waterRect(eye) : null;
    this.hasRefl = !!this.reflRect;
    if (this.hasRefl) this.drawReflection(proj, view, eye, L, time, player, Camera.isFirst ? foes : body.concat(foes));

    Post.begin(W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const u = this.drawWorld(proj, view, lightVP, eye, L, time, player);
    const blink = player.hurtTimer > 0 && Math.floor(time * 16) % 2 === 0;   // 맞은 직후 깜빡임
    const showBody = !Camera.isFirst && !blink;
    this.drawParts(u, showBody ? body.concat(foes) : foes, proj, view, time);
    if (showBody && Cape.mesh) this.drawCape(u);
    const skyVP = this.drawSky(proj, view, L, time);   // 하늘은 불투명한 물체 다음에 (가려진 곳은 계산을 건너뜀), 빛을 더하는 효과·물보다는 먼저
    if (!Camera.isFirst && Character.ghosts.length) this.drawGhosts(proj, view, eye, time);
    if (World.water) this.drawWater(proj, view, lightVP, eye, L, time);
    this.drawFaded(proj, view, lightVP, eye, L, time, player);   // 카메라 앞을 가리는 잎은 하늘·물까지 그린 뒤 반투명하게
    if (World.gate) this.drawGateFX(proj, view, eye, time);
    if (World.shafts) this.drawShafts(proj, view, eye, L, time);
    if (Atmos.beamMesh) this.drawBeams(proj, view, eye, L, time);
    this.drawFX(proj, view, time, H);
    Skills.buildGlow(eye, time, player);
    this.drawGlow(proj, view);
    if (L.particles) this.drawParticles(proj, view, eye, time, H);
    Post.captureDepth();

    if (Camera.isFirst) {   // 손과 검은 다른 물체에 파묻히지 않게 깊이를 지우고 맨 앞에 그림
      gl.clear(gl.DEPTH_BUFFER_BIT);
      this.drawViewModel(M4.perspective(Utils.rad(60), W / H, 0.01, 10), view, lightVP, eye, L, time, player);
    }

    // 화면 속 해의 위치 → 빛줄기 (하늘에 그린 해 자리에서 나옴)
    const s = L.skySun || L.sunDir;
    const cx = skyVP[0] * s[0] + skyVP[4] * s[1] + skyVP[8] * s[2];
    const cy = skyVP[1] * s[0] + skyVP[5] * s[1] + skyVP[9] * s[2];
    const cw = skyVP[3] * s[0] + skyVP[7] * s[1] + skyVP[11] * s[2];
    const facing = V3.dot(V3.normalize(V3.sub(Camera.look, eye)), s);
    const rayStrength = cw > 0 && CONFIG.graphics.godRays ? L.rays * Utils.smooth((facing - 0.1) / 0.6) : 0;
    const pal = Skills.ult ? Skills.ult.pal : Weapons.cur;   // 번쩍임 색은 궁극기를 쓴 무기의 속성 색 (어둡게 물드는 것은 세상·하늘을 그릴 때 이미 처리)
    Post.end({ sunUV: [(cx / cw) * 0.5 + 0.5, (cy / cw) * 0.5 + 0.5], rayStrength: rayStrength * (1 - Skills.darken), rayColor: V3.scale(L.sunColor, 0.18), proj, near, far,
      flash: Skills.flash, flashColor: pal.flash, grade: L.grade,
      sat: L.saturation, contrast: L.contrast, split: L.split, lift: L.lift, ao: L.aoStrength,
      cloudRays: L.cloudRays, curve: L.curve, shadeTint: L.shadeTint, highTint: L.highTint, skyKeep: L.skyKeep, darkDesat: L.darkDesat,
      knee: L.bloomKnee, bloomScale: L.bloomScale, bloomScreen: L.bloomScreen, bloomTint: L.bloomTint, dof: L.dof,
      veil: L.veil, veilK: L.veilK && [L.veilK[0], L.veilK[1], L.veilK[2] * (1 - Skills.darken)] });   // 궁극기로 어두워질 땐 공기도 걷힘
  },

  // 물에 비친 모습이 필요한 화면 범위 [x0, y0, x1, y1] (-1~1). 카메라 reflDist(m) 안의 물이 화면에 없으면 null
  // 화면에 걸친 물 구역 상자(World.waterBoxes)들의 모서리를 화면에 옮겨 감싸는 사각형 (먼 물도 같은 그림을 읽으므로 함께 감쌈)
  waterRect(eye) {
    const planes = frustumPlanes(this.vp), vp = this.vp, reach = CONFIG.graphics.reflDist ?? 60;
    const boxes = World.waterBoxes && World.waterBoxes.length ? World.waterBoxes : [World.waterBox];
    let near = false, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of boxes) {
      if (!b || !boxVisible(planes, b)) continue;
      // 가까운지는 땅 위 거리로 잼 (예전 map.js waterBox와 같은 기준: 높은 언덕 위 카메라라도 물까지의 땅 위 거리가 reflDist 안이면 그림)
      const dx = Math.max(b.min[0] - eye[0], 0, eye[0] - b.max[0]), dz = Math.max(b.min[2] - eye[2], 0, eye[2] - b.max[2]);
      if (dx * dx + dz * dz < reach * reach) near = true;
      for (let k = 0; k < 8; k++) {
        const x = k & 1 ? b.max[0] : b.min[0], y = k & 2 ? b.max[1] : b.min[1], z = k & 4 ? b.max[2] : b.min[2];
        const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
        if (w < 0.1) {   // 카메라 옆·뒤로 넘어가는 모서리: 화면 전체
          x0 = y0 = -1;
          x1 = y1 = 1;
          continue;
        }
        const sx = (vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w, sy = (vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
    }
    if (!near) return null;
    const pad = 0.1;   // 물결에 일렁여 비껴 읽는 만큼 (물 셰이더: 화면의 3.5% = -1~1 기준 0.07) + 여유
    return [Math.max(-1, x0 - pad), Math.max(-1, y0 - pad), Math.min(1, x1 + pad), Math.min(1, y1 + pad)];
  },

  // 몸 부분 하나를 감싸는 공 (가운데 part.sc, 반지름 part.sr). 부분 목록은 화면마다 새로 만들어지므로 한 번 계산해 붙여 둠
  partSphere(part) {
    if (part.sc) return;
    const box = this.partBox[part.mesh], m = part.m;
    const k = Math.max(Math.hypot(m[0], m[1], m[2]), Math.hypot(m[4], m[5], m[6]), Math.hypot(m[8], m[9], m[10]));   // 가장 크게 늘인 방향의 배율
    part.sc = M4.transformPoint(m, box.c);
    part.sr = 0.5 * Math.hypot(box.s[0], box.s[1], box.s[2]) * k + 0.05;   // (외곽선 두께만큼 여유)
  },

  // 시야(planes: normPlanes로 맞춘 것) 안에 걸치는 부분만 골라냄
  cullParts(parts, planes) {
    const out = [];
    for (const part of parts) {
      this.partSphere(part);
      if (sphereVisible(planes, part.sc, part.sr)) out.push(part);
    }
    return out;
  },

  // 해 쪽에서 내려다보는 카메라: 전사 앞쪽 ahead(m) 지점을 중심으로 가로세로 2R(m), 깊이 ±depth(m)
  lightMatrix(player, L, R, ahead, depth, size) {
    const f = player.forward();
    const cx = player.x + f[0] * ahead, cz = player.z + f[2] * ahead;
    const lv = M4.lookAt(L.sunDir, [0, 0, 0], [0, 1, 0]);
    const c = M4.transformPoint(lv, [cx, World.groundHeight(cx, cz), cz]);
    const t = (2 * R) / size;   // 그림자 한 칸 단위로 맞춰 움직여야 그림자 테두리가 떨리지 않음
    const sx = Math.round(c[0] / t) * t, sy = Math.round(c[1] / t) * t;
    return M4.multiply(M4.ortho(sx - R, sx + R, sy - R, sy + R, -c[2] - depth, -c[2] + depth), lv);
  },

  drawShadowMap(lightVP, target, time, parts, player) {
    const gl = GL.gl, P = this.p.shadow;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, target.size, target.size);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2, 4);   // 표면에 얼룩 그림자가 생기지 않게 살짝 밀어 줌
    gl.useProgram(P.prog);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.leafTex);
    gl.uniform1i(P.u.uLeafTex, 1);   // 잎 판은 잎 모양대로 그림자 (0번은 지금 그리는 그림자 지도라 쓰면 안 됨)
    gl.uniformMatrix4fv(P.u.uLightVP, false, lightVP);
    gl.uniformMatrix4fv(P.u.uModel, false, IDENTITY);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform1f(P.u.uGrass, 0);
    gl.uniform3fv(P.u.uPlayerPos, [player.x, 0, player.z]);
    gl.disable(gl.CULL_FACE);   // 잎 판·얇은 면도 그림자를 드리우게
    const planes = frustumPlanes(lightVP), eye = Camera.eye;
    const inLight = (box) => boxVisible(planes, box);
    for (const m of World.meshes) {
      if (!m.shadow) continue;
      // 나무 그림자는 면이 적은 모양으로 (그림자에선 차이가 안 보임), 카메라를 향한 잎 판도 뺀 모양 (map.js shadowModel)
      // 멀면 그리지 않는 작은 소품(dist)은 그림자도 같은 거리까지만
      GL.drawMesh(m.shadowMesh || m.far || m.mesh, m.dist ? (box) => inLight(box) && boxDistance(box, eye) < m.dist : inLight);
    }
    for (const part of this.cullParts(parts, normPlanes(planes))) {   // 전사(1인칭에서도)·적·화살의 그림자 (이 그림자 지도에 걸치는 것만)
      gl.uniformMatrix4fv(P.u.uModel, false, part.m);
      GL.drawMesh(this.partMesh[part.mesh]);
    }
    if (Cape.mesh && Cape.pts) {   // 망토 그림자
      gl.uniformMatrix4fv(P.u.uModel, false, IDENTITY);
      GL.drawMesh(Cape.mesh);
    }
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  },

  // 하늘을 그리고, 해 위치 계산에 쓸 '방향만 있는 카메라 행렬'을 돌려줌
  drawSky(proj, view, L, time) {
    const gl = GL.gl, P = this.p.sky;
    const rot = new Float32Array(view);
    rot[12] = rot[13] = rot[14] = 0;   // 하늘은 무한히 멀어서 위치는 무시하고 방향만
    const vp = M4.multiply(proj, rot);
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uInvVP, false, M4.invert(vp));
    gl.uniform3fv(P.u.uSunDir, L.skySun || L.sunDir);   // 하늘의 해 자리 (노을 뒤엔 지평선 아래로 계속 짐)
    gl.uniform3fv(P.u.uSunColor, L.sunColor);
    gl.uniform3fv(P.u.uFogColor, L.fogColor);
    gl.uniform3fv(P.u.uZenith, L.zenith);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform1f(P.u.uDim, Skills.dim);
    gl.uniform3fv(P.u.uDimTint, (Skills.ult ? Skills.ult.pal : Weapons.cur).dark);
    gl.uniform3fv(P.u.uCloudLit, L.cloudLit);
    gl.uniform3fv(P.u.uCloudShade, L.cloudShade);
    gl.uniform4f(P.u.uCloudCfg, L.cumulus ?? 1, L.cumulusTop ?? 0.7, L.wisps ?? 0.6, L.cumulusBase ?? 0.15);   // 구름 설정 (테마에 없으면 맑은 낮 숲 값)
    gl.uniform1f(P.u.uNight, L.night || 0);              // 밤: 별과 달
    gl.uniform3fv(P.u.uMoonDir, L.moonDir || MOON_DIR);
    gl.uniform1f(P.u.uSunDisc, L.sunDisc ?? 1);          // 어스름·밤엔 해를 그리지 않음
    gl.disable(gl.CULL_FACE);   // 물에 비친 장면(앞뒷면을 뒤집어 그림)에서도 하늘이 빠지지 않게
    gl.depthFunc(gl.LEQUAL);    // 깊이는 검사만: 가장 먼 깊이에 그리면 이미 물체가 있는 곳은 건너뜀
    gl.depthMask(false);
    gl.bindVertexArray(this.skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
    return vp;
  },

  // 그림자 지도 두 장과 행렬을 셰이더에 연결 (0번: 넓은 것, 2번: 촘촘한 것)
  bindShadows(u) {
    const gl = GL.gl;
    gl.uniformMatrix4fv(u.uLightVP, false, this.lightVP);
    gl.uniformMatrix4fv(u.uLightVPNear, false, this.lightVPNear);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shadow.tex);
    gl.uniform1i(u.uShadowMap, 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.shadowNear.tex);
    gl.uniform1i(u.uShadowNear, 2);
    const L = this.L;
    gl.uniform1f(u.uShadowOutside, L.shadowOutside ?? 1);
    gl.uniform1f(u.uClouds, L.clouds === false ? 0 : 1);
    gl.uniform4fv(u.uCloudShadow, L.cloudShadow || CLOUD_SHADOW_DEFAULT);   // 구름 그림자 크기·짙기 (테마에 없으면 예전 값)
  },

  // 이번 화면에 쓸 점 빛 (가까운 것부터 12개): 횃불은 일렁이고, 동굴에선 들고 있는 검도 속성 색으로 주변을 비춤
  // 밤에는 등불·모닥불이 더 밝고 넓게 (L.lampBoost·lampRange), night: true인 빛(창문 등)은 밤에만 켜짐
  // 멀어지는 빛은 마지막 6m 동안 서서히 꺼짐. 빛이 고를 수 있는 수(휴대폰 6개)보다 많으면, 다음 차례 빛과 3m 안으로 가까운 빛도 서서히 줄임
  // → 걸어가며 고르는 빛이 바뀔 때 툭 켜지거나 꺼지지 않음
  gatherLights(player, time) {
    const L = this.L, boost = L.lampBoost ?? 1, range = L.lampRange ?? 1, nk = L.night || 0;
    const max = Utils.clamp(CONFIG.graphics.maxLights | 0, 1, 12), slots = World.cave ? max - 1 : max, cap = slots + 1;   // (한 개 더 모아 다음 차례 빛의 거리를 앎)
    const pick = this.lightPick || (this.lightPick = { d: new Float32Array(13), k: new Float32Array(13), l: new Array(13).fill(null) });
    let n = 0;
    for (const l of World.lights) {
      const d = Math.hypot(l.x - player.x, l.z - player.z);
      if (d >= l.r + 30) continue;
      let k = Utils.smooth((l.r + 30 - d) / 6) * boost * (l.night ? nk : 1);
      if (k * Math.max(l.color[0], l.color[1], l.color[2]) < 0.02) continue;   // 꺼진 빛(낮의 창문 등)은 건너뜀
      if (l.flicker) k *= 0.82 + 0.1 * Math.sin(time * 11 + l.flicker) + 0.08 * Math.sin(time * 23.7 + l.flicker * 3);
      // 가까운 순서로 끼워 넣기 (cap개까지만)
      let i = n < cap ? n++ : cap;
      if (i === cap && d >= pick.d[cap - 1]) continue;
      if (i === cap) i = cap - 1;
      while (i > 0 && pick.d[i - 1] > d) {
        pick.d[i] = pick.d[i - 1]; pick.k[i] = pick.k[i - 1]; pick.l[i] = pick.l[i - 1];
        i--;
      }
      pick.d[i] = d; pick.k[i] = k; pick.l[i] = l;
    }
    if (n > slots) {   // 넘친 빛(다음 차례)은 빼고, 그 빛과 거리가 비슷한 빛은 줄여서 바뀌는 순간이 부드럽게
      const cut = pick.d[slots];
      n = slots;
      for (let i = 0; i < n; i++) pick.k[i] *= Utils.smooth((cut - pick.d[i]) / 3);
    }
    const pos = this.lights.pos, col = this.lights.col;
    for (let i = 0; i < n; i++) {
      const l = pick.l[i], k = pick.k[i];
      pos[i * 4] = l.x; pos[i * 4 + 1] = l.y; pos[i * 4 + 2] = l.z;
      pos[i * 4 + 3] = l.r * range;
      col[i * 3] = l.color[0] * k; col[i * 3 + 1] = l.color[1] * k; col[i * 3 + 2] = l.color[2] * k;
    }
    if (World.cave && !player.dead) {
      const tip = !Camera.isFirst && Character.swordM ? M4.transformPoint(Character.swordM, [0, Weapons.cur.length * 0.6, 0]) : V3.add(player.eye(), V3.scale(player.forward(), 0.6));
      const c = Weapons.cur.spark;
      pos[n * 4] = tip[0]; pos[n * 4 + 1] = tip[1]; pos[n * 4 + 2] = tip[2]; pos[n * 4 + 3] = 4.5;
      col[n * 3] = c[0] * 0.55; col[n * 3 + 1] = c[1] * 0.55; col[n * 3 + 2] = c[2] * 0.55;
      n++;
    }
    this.lights.count = n;
  },

  // 3D 모델용 셰이더 준비 (빛·안개·그림자 값 넘기기)
  useWorld(proj, view, lightVP, eye, L, time, player) {
    const gl = GL.gl, P = this.p.world, u = P.u;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    this.bindShadows(u);
    gl.uniformMatrix4fv(u.uModel, false, IDENTITY);
    gl.uniform3fv(u.uSunDir, L.sunDir);
    gl.uniform3fv(u.uSunColor, L.sunColor);
    gl.uniform3fv(u.uSkyColor, L.skyColor);
    gl.uniform3fv(u.uGroundColor, L.groundColor);
    gl.uniform3fv(u.uFogColor, L.fogColor);
    gl.uniform4fv(u.uHaze, L.haze || [0, 0, 0, 0]);   // 공기 원근감 (테마에 없으면 끔)
    gl.uniform3fv(u.uCamPos, eye);
    gl.uniform3fv(u.uPlayerPos, [player.x, player.groundY + 1.1, player.z]);   // (풀은 x·z만 씀)
    gl.uniform1f(u.uFogDensity, this.fog);
    gl.uniform1f(u.uShadowOn, CONFIG.graphics.shadows ? 1 : 0);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uGroundDetail, 0);
    gl.uniform1f(u.uAOHeight, 0);
    gl.uniform1f(u.uGrass, 0);
    gl.uniform1f(u.uRim, 0);
    gl.uniform1f(u.uCamFade, 0);
    gl.uniform1f(u.uAlphaOut, 0);
    gl.uniform1f(u.uFlash, 0);
    gl.uniform1f(u.uTwoSided, 0);
    gl.uniform1f(u.uCel, 0);
    gl.uniform1f(u.uClipY, -1000);
    gl.uniform4fv(u.uGlowSwap, [0, 0, 0, 0]);
    gl.uniform3fv(u.uRuneColor, Weapons.tint);
    gl.uniform1f(u.uDim, Skills.dim);
    gl.uniform3fv(u.uDimTint, (Skills.ult ? Skills.ult.pal : Weapons.cur).dark);
    gl.uniform1f(u.uWaterLevel, World.waterLevel === null ? -100 : World.waterLevel);
    gl.uniform1f(u.uCelAmbient, L.celAmbient ?? 1);
    const cel = Object.assign({ soft: 0.03, shade: 0.95, lit: 2.0, sky: 0, rim: 0.45, grad: 0, metal: 1, sheer: 0 }, L.cel);   // 캐릭터 그림체 (테마에 없는 값은 예전 그대로)
    gl.uniform4fv(u.uCelLook, [cel.soft, cel.shade, cel.lit, cel.sky]);
    gl.uniform4fv(u.uCelLook2, [cel.rim, cel.grad, cel.metal, cel.sheer]);
    gl.uniform1f(u.uOldRim, L.cel ? 0 : 1);   // cel 설정이 없는 테마(동굴)는 예전 테두리 빛
    gl.uniform1f(u.uTerm, L.terminator ?? 0.22);          // 테마별 그림체 (값이 없는 테마는 예전 그대로)
    gl.uniform1f(u.uShadeDesat, L.shadeDesat ?? 0);
    gl.uniform1f(u.uLeafGlow, L.leafGlow ?? 0);
    gl.uniform3fv(u.uMoss, L.moss || [0.09, 0.19, 0.04]);
    gl.uniform4fv(u.uLights, this.lights.pos);
    gl.uniform3fv(u.uLightColors, this.lights.col);
    gl.uniform1i(u.uLightCount, this.lights.count);
    gl.uniform1f(u.uMistBase, World.waterLevel === null ? -0.8 : World.waterLevel);
    // ---- 지형·물 작업: 마른 풀밭 색 (테마에 없으면 예전 주황빛 금색) ----
    gl.uniform3fv(u.uGoldHue, (L.goldHue || [[1.55, 1.0, 0.1], [2.0, 0.84, 0.06]]).flat());
    // ---- (지형·물 작업 끝) ----
    // ---- 구역별 풍경 작업: 마을 돌바닥 무늬 켜기, 초원 꽃밭 색 (먼 곳 땅의 꽃 점) ----
    gl.uniform1f(u.uCobble, CONFIG.graphics.cobbles === false ? 0 : 1);
    gl.uniform3fv(u.uCarpetHue, this._carpetHue || (this._carpetHue = new Float32Array(MEADOW_FLOWERS.flat())));
    // ---- (구역별 풍경 작업 끝) ----
    gl.uniform2fv(u.uMist, L.mist || MIST_DEFAULT);          // 물안개 짙기·높이 (늪지는 짙게)
    gl.uniform1f(u.uHazeStart, L.hazeStart ?? 20);           // 먼 공기가 시작되는 거리
    gl.uniform1f(u.uNight, L.night || 0);                    // 밤 (안개가 달 쪽으로 따뜻해지지 않게)
    gl.uniform3fv(u.uSkySun, L.skySun || L.sunDir);          // 먼 안개의 노을빛은 하늘의 해 자리 쪽 (빛 방향과 다를 수 있음)
    gl.uniform1f(u.uGlowK, L.glowK ?? 1);                    // 창문·등불 유리 밝기 (밤엔 세게, 캐릭터는 drawParts에서 1)
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.leafTex);
    gl.uniform1i(u.uLeafTex, 1);
    // 잎 판을 세울 방향 = 화면 오른쪽·위쪽 (물에 비친 장면은 좌우가 뒤집혀 있어 오른쪽을 반대로 → 앞면이 유지됨)
    const bR = [view[0], view[4], view[8]], bU = [view[1], view[5], view[9]];
    const flip = V3.dot(V3.cross(bR, bU), [view[2], view[6], view[10]]) < 0 ? -1 : 1;
    gl.uniform3fv(u.uBillR, V3.scale(bR, flip));
    gl.uniform3fv(u.uBillU, bU);
    gl.uniform3fv(u.uGrassEye, eye);
    gl.uniform2f(u.uGrassLod, 0, 0);
    return u;
  },

  drawWorld(proj, view, lightVP, eye, L, time, player) {
    const gl = GL.gl;
    const u = this.useWorld(proj, view, lightVP, eye, L, time, player);
    const planes = frustumPlanes(M4.multiply(proj, view));
    for (const m of World.meshes) {
      const test = (box) => {
        if (!boxVisible(planes, box)) return false;
        if (!m.dist) return true;
        const d = boxDistance(box, eye);
        return d < m.dist && (!m.lod || d < m.lod || 0.5);   // 먼 풀 구역은 정점 앞 절반(큰 풀잎)만
      };
      if (m.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
      gl.uniform1f(u.uGroundDetail, m.ground ? 1 : 0);
      gl.uniform1f(u.uAOHeight, m.ao || 0);
      gl.uniform1f(u.uGrass, m.grass ? 1 : 0);
      gl.uniform2f(u.uGrassLod, m.lod || 0, m.grass ? m.dist || 0 : 0);   // 풀·꽃·고사리는 그리는 거리 끝에서 땅으로 줄어듦
      gl.uniform2f(u.uGrassFade, m.fadeStart || 0.72, m.lod ? CONFIG.graphics.grassWiden ?? 0.3 : 0);   // 포기마다 사라지는 거리가 시작되는 비율, 먼 풀밭 포기 넓히기
      const count = m.fadeStart ? (part) => this.tuftCount(part, eye, m) : null;   // 먼 구역은 아직 남은 포기만
      gl.uniform1f(u.uRim, m.rim || 0);
      gl.uniform1f(u.uFogDensity, m.fog ? m.fog * (L.farFog ?? 1) : this.fog);   // 먼 산·언덕은 따로 정한 안개 (테마별 배율)
      gl.uniform1f(u.uCamFade, Camera.isFirst || m.ground ? 0 : m.grass ? 3 : 1);   // 가리는 부분: 나무·덤불은 drawFaded에서 반투명하게, 풀은 그냥 잘라 냄
      if (m.far) {   // 나무: 가까운 구역은 매끈한 모양, 먼 구역은 면이 적은 모양 (멀면 차이가 보이지 않음)
        GL.drawMesh(m.mesh, (box) => test(box) && boxDistance(box, eye) < TREE_LOD);
        GL.drawMesh(m.far, (box) => test(box) && boxDistance(box, eye) >= TREE_LOD);
      } else {
        GL.drawMesh(m.mesh, test, null, count);
      }
    }
    gl.uniform1f(u.uCamFade, 0);
    gl.enable(gl.CULL_FACE);
    gl.uniform1f(u.uGroundDetail, 0);
    gl.uniform1f(u.uAOHeight, 0);
    gl.uniform1f(u.uGrass, 0);
    gl.uniform2f(u.uGrassLod, 0, 0);
    gl.uniform1f(u.uFogDensity, this.fog);
    return u;
  },

  // 풀 구역에서 아직 다 사라지지 않은 포기 수 (구역 안은 늦게 사라지는 포기부터 놓여 있음: map.js groupByChunk)
  // 셰이더 worldPos와 같은 식: 포기가 다 사라지는 거리 = 끝 거리 x (시작 비율 ~ 1 사이, 난수의 제곱근만큼)
  // 구역에서 카메라에 가장 가까운 곳보다 먼저 다 사라지는 포기는 어디서도 보이지 않으므로 빼고 그림 (그림은 똑같음)
  tuftCount(part, eye, m) {
    const f = part.fade;
    if (!f) return part.count;
    const t = (boxDistance(part.box, eye) / m.dist - m.fadeStart) / (1 - m.fadeStart);
    if (t <= 0) return part.count;
    const thr = t * t - 0.002;   // 이 난수 이하인 포기는 이미 다 사라짐 (계산 오차만큼 넉넉히)
    let lo = 0, hi = f.length;   // f는 큰 값부터 놓여 있음 → thr보다 큰 값의 개수
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (f[mid] > thr) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  },

  // 3인칭: 카메라 바로 앞·용사를 가리는 나무·덤불을 반투명하게 겹쳐 그림 (drawWorld에서 빼 둔 부분만)
  // 점점이 구멍을 내지 않고 유리처럼 비쳐 보여서 화면이 깨져 보이지 않음. 카메라 근처 구역만 다시 그려 가벼움
  drawFaded(proj, view, lightVP, eye, L, time, player) {
    if (Camera.isFirst) return;
    const gl = GL.gl;
    const u = this.useWorld(proj, view, lightVP, eye, L, time, player);
    const planes = frustumPlanes(M4.multiply(proj, view));
    const chest = [player.x, player.groundY + 1.1, player.z], pad = 2.4;   // 셰이더의 비우는 범위(카메라 2.2m, 시선 1.1m)보다 조금 넓게
    const lo = [0, 1, 2].map((i) => Math.min(eye[i], chest[i]) - pad), hi = [0, 1, 2].map((i) => Math.max(eye[i], chest[i]) + pad);
    const near = (box) => box.max[0] > lo[0] && box.min[0] < hi[0] && box.max[1] > lo[1] && box.min[1] < hi[1] &&
      box.max[2] > lo[2] && box.min[2] < hi[2] && boxVisible(planes, box);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);   // 하늘 표시(알파)는 그대로
    gl.depthMask(false);
    gl.uniform1f(u.uCamFade, 2);
    for (const m of World.meshes) {
      if (m.ground || m.fog || m.grass) continue;   // 땅·먼 산은 가리지 않고, 풀은 drawWorld에서 잘라 냄
      if (m.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
      gl.uniform1f(u.uAOHeight, m.ao || 0);
      gl.uniform1f(u.uRim, m.rim || 0);
      GL.drawMesh(m.mesh, near);
    }
    gl.uniform1f(u.uCamFade, 0);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.uniform1f(u.uAOHeight, 0);
  },

  // 관절로 움직이는 것들(기사·적·화살). 먼저 살짝 부풀린 뒷면을 어둡게 그려 외곽선을 만들고, 그 위에 그림
  // 화면 밖에 있는 부분은 건너뜀. opts.planes: 이 시야 면들로 고름 (없으면 카메라 시야), opts.outline: false면 외곽선 없이 (물에 비친 모습)
  drawParts(u, parts, proj, view, time, opts = {}) {
    const L = this.L;
    const gl = GL.gl, w = opts.outline === false ? 0 : CONFIG.graphics.outline * (L.outline ?? 1);   // 테마별 두께 (숲은 야숨처럼 가늘게)
    parts = this.cullParts(parts, normPlanes(opts.planes || frustumPlanes(M4.multiply(proj, view))));
    if (w > 0) {
      const O = this.p.outline;
      gl.useProgram(O.prog);
      gl.uniformMatrix4fv(O.u.uProj, false, proj);
      gl.uniformMatrix4fv(O.u.uView, false, view);
      gl.uniform1f(O.u.uTime, time);
      gl.uniform1f(O.u.uGrass, 0);
      gl.uniform3fv(O.u.uColor, [0.05, 0.04, 0.06]);
      gl.uniform2fv(O.u.uTone, L.outlineTone || [0.3, 0.8]);   // 테마별 외곽선 색 (숲은 그 부분 색을 어둡게만 → 거의 눈에 띄지 않는 부드러운 선)
      gl.cullFace(gl.FRONT);
      for (const part of parts) {
        if (part.noOutline || part.mesh === 'face' || part.mesh === 'lids') continue;   // 눈·코·입은 외곽선 없이 (마을 사람은 noOutline)
        const box = this.partBox[part.mesh];
        const grow = M4.chain(M4.translation(box.c[0], box.c[1], box.c[2]),
          M4.scaling(1 + (2 * w) / box.s[0], 1 + (2 * w) / box.s[1], 1 + (2 * w) / box.s[2]),
          M4.translation(-box.c[0], -box.c[1], -box.c[2]));
        gl.uniformMatrix4fv(O.u.uModel, false, M4.multiply(part.m, grow));
        GL.drawMesh(this.partMesh[part.mesh]);
      }
      gl.cullFace(gl.BACK);
      gl.useProgram(this.p.world.prog);
    }
    gl.uniform1f(u.uRim, 1);
    gl.uniform1f(u.uCel, 1);   // 캐릭터는 애니메이션풍 명암
    gl.uniform1f(u.uGlowK, 1); // 괴물 눈·갑옷 빛줄기는 밤에도 그대로
    const swap = [Weapons.tint[0], Weapons.tint[1], Weapons.tint[2], 1], noSwap = [0, 0, 0, 0];
    for (const part of parts) {
      gl.uniformMatrix4fv(u.uModel, false, part.m);
      gl.uniform1f(u.uFlash, part.flash || 0);
      gl.uniform4fv(u.uGlowSwap, part.knight ? swap : noSwap);   // 용사 갑옷의 빛줄기는 무기 속성 색
      GL.drawMesh(this.partMesh[part.mesh], null, part.tint);
    }
    gl.uniform4fv(u.uGlowSwap, noSwap);
    gl.uniform1f(u.uFlash, 0);
    gl.uniform1f(u.uCel, 0);
    gl.uniform1f(u.uRim, 0);
    gl.uniformMatrix4fv(u.uModel, false, IDENTITY);
  },

  // 구르기·회전베기·돌진 잔상: 지난 자세들을 무기 속성 색 빛으로 더해 그림 (오래된 것일수록 흐리게)
  drawGhosts(proj, view, eye, time) {
    const gl = GL.gl, P = this.p.ghost;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniform3fv(P.u.uCamPos, eye);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform1f(P.u.uGrass, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.depthMask(false);
    const gc = Weapons.cur.ghost;
    for (const g of Character.ghosts) {
      const k = 1 - g.age / GHOST_LIFE;
      gl.uniform3fv(P.u.uColor, V3.scale(gc, k * k));
      for (const part of g.parts) {
        gl.uniformMatrix4fv(P.u.uModel, false, part.m);
        GL.drawMesh(this.partMesh[part.mesh]);
      }
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.useProgram(this.p.world.prog);
  },

  // 천 망토: 양면 (안쪽은 어둡게)
  drawCape(u) {
    if (!Cape.pts) return;
    const gl = GL.gl;
    gl.disable(gl.CULL_FACE);
    gl.uniform1f(u.uTwoSided, 1);
    gl.uniform3fv(u.uLining, KNIGHT.coat.slice(0, 3));   // 진홍 겉감 + 남색 안감
    gl.uniform1f(u.uRim, 0.6);
    gl.uniform1f(u.uCel, 1);
    gl.uniformMatrix4fv(u.uModel, false, IDENTITY);
    GL.drawMesh(Cape.mesh);
    gl.uniform1f(u.uTwoSided, 0);
    gl.uniform1f(u.uRim, 0);
    gl.uniform1f(u.uCel, 0);
    gl.enable(gl.CULL_FACE);
  },

  // 물에 비친 모습: 수면을 거울삼아 장면을 위아래로 뒤집어 반 크기로 한 번 더 그림 (작은 풀·소품은 생략)
  drawReflection(proj, view, eye, L, time, player, parts) {
    const gl = GL.gl, wl = World.waterLevel, t = Post.refl;
    const mirror = M4.identity();
    mirror[5] = -1;
    mirror[13] = 2 * wl;
    const rview = M4.multiply(view, mirror);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.viewport(0, 0, t.w, t.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 물이 보이는 화면 부분(this.reflRect)만 그림: 그 밖은 물이 읽지 않으므로 하늘·나무를 그릴 필요가 없음
    const r = this.reflRect || [-1, -1, 1, 1];
    const px0 = Math.floor((r[0] * 0.5 + 0.5) * t.w), py0 = Math.floor((r[1] * 0.5 + 0.5) * t.h);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(px0, py0, Math.ceil((r[2] * 0.5 + 0.5) * t.w) - px0, Math.ceil((r[3] * 0.5 + 0.5) * t.h) - py0);
    gl.frontFace(gl.CW);   // 뒤집힌 세상은 앞면·뒷면도 반대
    this.drawSky(proj, rview, L, time);
    const u = this.useWorld(proj, rview, null, [eye[0], 2 * wl - eye[1], eye[2]], L, time, player);
    gl.uniform1f(u.uClipY, wl - 0.05);   // 물 아래 부분은 비치지 않음
    const planes = rectPlanes(M4.multiply(proj, rview), r);
    const test = (box) => boxVisible(planes, box);
    for (const m of World.meshes) {
      if (m.grass || (m.dist && m.dist < 45)) continue;
      if (m.cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
      gl.uniform1f(u.uGroundDetail, m.ground ? 1 : 0);
      gl.uniform1f(u.uAOHeight, m.ao || 0);
      gl.uniform1f(u.uRim, m.rim || 0);
      gl.uniform1f(u.uFogDensity, m.fog ? m.fog * (L.farFog ?? 1) : this.fog);   // 물에 비친 먼 산도 같은 안개
      GL.drawMesh(m.far || m.mesh, test);   // 물에 비친 나무는 면이 적은 모양으로
    }
    gl.enable(gl.CULL_FACE);
    gl.uniform1f(u.uGroundDetail, 0);
    gl.uniform1f(u.uAOHeight, 0);
    gl.uniform1f(u.uFogDensity, this.fog);
    this.drawParts(u, parts, proj, rview, time, { planes, outline: false });   // 물에 비친 몸은 작고 일렁여서 외곽선 없이
    gl.uniform1f(u.uClipY, -1000);
    gl.frontFace(gl.CCW);
    gl.disable(gl.SCISSOR_TEST);
  },

  // 출구: 닫혀 있으면 푸른 마법 장벽, 열리면 금빛 빛기둥
  drawGateFX(proj, view, eye, time) {
    const gl = GL.gl, P = this.p.barrier, g = World.gate;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform3fv(P.u.uCamPos, eye);
    gl.uniform1f(P.u.uBaseY, g.y);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    if (World.barrierFade > 0.01) {
      gl.uniform1f(P.u.uMode, 0);
      gl.uniform1f(P.u.uAmount, World.barrierFade);
      GL.drawMesh(World.barrier);
    }
    if (World.barrierFade < 0.99) {
      gl.uniform1f(P.u.uMode, 1);
      gl.uniform1f(P.u.uAmount, 1 - World.barrierFade);
      GL.drawMesh(World.pillar);
    }
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  },

  // 동굴 천장 구멍으로 쏟아지는 빛기둥 (빛을 더함)
  drawShafts(proj, view, eye, L, time) {
    const gl = GL.gl, P = this.p.barrier;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform3fv(P.u.uCamPos, eye);
    gl.uniform1f(P.u.uMode, 2);
    gl.uniform1f(P.u.uAmount, 1 - Skills.dim * 0.7);
    gl.uniform1f(P.u.uBaseY, -1);
    gl.uniform1f(P.u.uHeight, 10);
    gl.uniform3fv(P.u.uColor, L.shaftColor);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    GL.drawMesh(World.shafts);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  },

  // 북쪽 숲 나무 사이로 비스듬히 내리는 햇살 기둥 (atmos.js가 만든 모델, 빛을 더함)
  // 낮 해 방향에 맞춰 만들어 두었으므로 해가 기울거나(노을) 밤이면 사라지고, 숲을 벗어나도 사라짐 (L.beams)
  drawBeams(proj, view, eye, L, time) {
    const day = LIGHTING.forest.sunDir;
    const dayK = Utils.smooth((V3.dot(L.sunDir, day) - 0.995) / 0.005) * (1 - (L.night || 0));
    const amount = (L.beams || 0) * dayK * (1 - Skills.dim * 0.7);
    if (amount < 0.01) return;
    const gl = GL.gl, P = this.p.barrier;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform3fv(P.u.uCamPos, eye);
    gl.uniform1f(P.u.uMode, 3);
    gl.uniform1f(P.u.uAmount, amount);
    gl.uniform3fv(P.u.uColor, L.beamColor || [1.0, 0.9, 0.62]);
    gl.uniform3fv(P.u.uLightDir, Atmos.beamDir);   // 해 쪽을 바라볼 때 진하게 (빛은 앞으로 흩어짐)
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    GL.drawMesh(Atmos.beamMesh);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  },

  // 연못 물 (반투명, 뒤에 있는 물속 땅이 비쳐 보임)
  drawWater(proj, view, lightVP, eye, L, time) {
    const gl = GL.gl, P = this.p.water, u = P.u;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(u.uProj, false, proj);
    gl.uniformMatrix4fv(u.uView, false, view);
    this.bindShadows(u);
    gl.uniform3fv(u.uCamPos, eye);
    gl.uniform3fv(u.uSunDir, L.sunDir);
    gl.uniform3fv(u.uSunColor, L.sunColor);
    gl.uniform3fv(u.uFogColor, L.fogColor);
    gl.uniform3fv(u.uZenith, L.zenith);
    gl.uniform1f(u.uFogDensity, this.fog);
    gl.uniform1f(u.uTime, time);
    gl.activeTexture(gl.TEXTURE3);   // 물에 비친 모습
    gl.bindTexture(gl.TEXTURE_2D, Post.refl.tex);
    gl.uniform1i(u.uRefl, 3);
    gl.uniform1f(u.uHasRefl, this.hasRefl ? 1 : 0);
    gl.uniform2fv(u.uScreen, [gl.drawingBufferWidth, gl.drawingBufferHeight]);
    gl.uniform1f(u.uDim, Skills.dim);
    gl.uniform3fv(u.uDimTint, (Skills.ult ? Skills.ult.pal : Weapons.cur).dark);
    // ---- 지형·물 작업: 늪 물 색, 공기 원근감·물안개 (오픈월드만. 다른 맵의 연못은 예전 그대로) ----
    const wc = L.water || {};
    gl.uniform3fv(u.uMurk, [...(wc.murk || [0.07, 0.08, 0.035]), ...(wc.murkDeep || [0.025, 0.03, 0.014]), ...(wc.duckweed || [0.1, 0.16, 0.035])]);
    gl.uniform4fv(u.uHaze, World.bio && L.haze ? L.haze : [0, 0, 0, 0]);
    gl.uniform1f(u.uMistBase, World.bio ? World.waterLevel : -1000);
    // ---- (지형·물 작업 끝) ----
    // 하늘·빛: 물안개·먼 공기·밤 안개 색을 땅과 같은 값으로 (안 그러면 안개 낀 늪에서 물웅덩이만 맑게 뚫려 보임), 밤엔 물빛도 어둡게
    gl.uniform2fv(u.uMist, L.mist || MIST_DEFAULT);
    gl.uniform1f(u.uHazeStart, L.hazeStart ?? 20);
    gl.uniform1f(u.uNight, L.night || 0);
    gl.uniform3fv(u.uSkySun, L.skySun || L.sunDir);
    gl.uniform1f(u.uWaterLight, 1 - 0.85 * (L.night || 0));
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);   // 하늘 표시(알파)는 그대로
    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    GL.drawMesh(World.water);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  },

  drawParticles(proj, view, eye, time, H) {
    const gl = GL.gl, P = this.p.particle;
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, proj);
    gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniform3fv(P.u.uCam, eye);
    gl.uniform1f(P.u.uTime, time);
    gl.uniform1f(P.u.uScale, (H * proj[5]) / 2);
    const L = this.L, g = L.particleGain ?? 1, c = this.partColor || (this.partColor = new Float32Array(3)), nk = L.night || 0;
    for (let i = 0; i < 3; i++) c[i] = L.particleColor[i] * g;   // 반딧불은 더 밝게 (테마·시각별 배율)
    gl.uniform3fv(P.u.uColor, c);
    gl.uniform1f(P.u.uBlink, nk);                                  // 밤: 꽃가루 대신 천천히 깜빡이는 반딧불
    gl.uniform1f(P.u.uSize, 0.06 + 0.04 * nk);                     // 반딧불은 조금 크게
    gl.uniform1f(P.u.uDensity, 1 + ((L.fireflies ?? 1) - 1) * nk); // 반딧불 양 (낮 꽃가루는 그대로)
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);   // 빛나는 느낌 (색을 더함, 하늘 표시는 그대로)
    gl.depthMask(false);
    gl.bindVertexArray(this.particles.vao);
    gl.drawArrays(gl.POINTS, 0, this.particles.n);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  },

  // 1인칭: 손에 든 검과 팔 (세상 좌표로 옮겨 그려서 햇빛·그림자를 똑같이 받음)
  drawViewModel(vproj, view, lightVP, eye, L, time, player) {
    const gl = GL.gl;
    const u = this.useWorld(vproj, view, lightVP, eye, L, time, player);
    gl.uniform1f(u.uFogDensity, 0);
    gl.uniform1f(u.uMistBase, -100);
    gl.uniform1f(u.uGlowK, 1);
    gl.uniform1f(u.uRim, 0.6);
    gl.uniform1f(u.uAlphaOut, 0.25);   // 후처리에서 손·검을 알아보게
    const camWorld = M4.invert(view);
    const sword = player.swordMatrix();
    gl.uniformMatrix4fv(u.uModel, false, M4.multiply(camWorld, sword));
    GL.drawMesh(this.partMesh[Weapons.meshName]);
    gl.uniformMatrix4fv(u.uModel, false, M4.multiply(camWorld, player.armMatrix(sword)));
    GL.drawMesh(this.armMesh);
    this.drawTrail(vproj, player, time);
  },

  drawTrail(vproj, player, time) {
    const s = player.trail;
    if (s.length < 2) return;
    const gl = GL.gl, P = this.p.trail;
    const data = new Float32Array(s.length * 8);
    s.forEach((p, i) => {
      const a = Utils.clamp(1 - (time - p.t) / 0.1, 0, 1) * 0.55;
      data.set([p.base[0], p.base[1], p.base[2], 0, p.tip[0], p.tip[1], p.tip[2], a], i * 8);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.useProgram(P.prog);
    gl.uniformMatrix4fv(P.u.uProj, false, vproj);
    gl.uniform3fv(P.u.uColor, V3.scale(V3.add(Weapons.cur.core, Weapons.cur.mid), 0.33));
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    gl.bindVertexArray(this.trailVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, s.length * 2);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
  },
};
