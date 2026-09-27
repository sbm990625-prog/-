# 사우디 네옴시티 '더 라인', 진짜로 지어졌다면?

사우디 네옴(NEOM)의 거울 도시 **더 라인(THE LINE)** 이 약속대로 완성됐다면 어땠을지를 다루는
약 90초짜리 모션그래픽 영상 프로젝트입니다. [Remotion](https://www.remotion.dev)(React)으로
모든 장면을 코드로 그리며, 스톡 영상·사진·외부 폰트 로딩 없이 렌더됩니다.

- 대본·스토리보드: [`docs/script.md`](docs/script.md), [`docs/storyboard.json`](docs/storyboard.json)
- 근거 자료(출처·날짜 포함): [`docs/facts.md`](docs/facts.md), [`docs/research/`](docs/research/)
- 완성 영상: `out/neom-line.mp4`, 썸네일: `out/thumbnail.png` (렌더 산출물, git에는 포함하지 않음)

> 흔히 "네온 시티"라고 잘못 들리지만 정식 이름은 **네옴(NEOM)** 입니다. 영상은 정식 명칭을 쓰고,
> '네온'은 거울 외벽과 발광 효과로 표현한 시각 톤으로만 살렸습니다.

## 렌더하기

```bash
npm install
npm run render            # → out/neom-line.mp4 (1920x1080, 30fps, H.264 + AAC)
npm run thumbnail         # → out/thumbnail.png (1280x720)
npm run studio            # 브라우저에서 장면별 미리보기/편집
```

렌더에는 Chromium이 필요합니다. `remotion.config.ts`는 이 저장소가 만들어진 클라우드 환경의
Playwright Chromium(headless shell)을 자동으로 쓰고, 없으면 Remotion이 Chrome Headless Shell을
내려받습니다.

## 구조

```
src/
  Root.tsx          컴포지션 등록 (Main, 장면별 Scene-*, 컴포넌트 갤러리)  ← 자동 생성
  Main.tsx          장면을 스토리보드 시간대로 배치 + 사운드트랙 큐
  scenes/           장면 컴포넌트 (스토리보드의 scene id 하나당 파일 하나)
  components/       공용 비주얼: 거울 벽, 사막, 단면도, 항공 시점, 자막, 카운터, 차트, 오버레이, 사운드 믹서
  theme.ts          색·서체·안전 여백
  utils/anim.ts     초→프레임, 이징, 숫자 포맷
public/audio/       절차적으로 생성한 배경음/효과음 (AAC)
tools/
  gen-audio.py      numpy로 사운드트랙 스템·효과음 생성 (저작권 걱정 없는 자체 제작)
  scaffold-scenes.mjs  docs/storyboard.json → 장면 스텁/인덱스/Root 생성
docs/               대본, 스토리보드, 근거 자료
```

## 대본 바꾸기

1. `docs/storyboard.json`의 장면(시간, 자막, 비주얼)을 수정합니다.
2. `node tools/scaffold-scenes.mjs` — 새 장면의 스텁과 인덱스를 다시 만듭니다 (기존 장면 파일은 보존).
3. `src/scenes/<장면>.tsx`를 구현하고 `npm run studio`로 확인한 뒤 `npm run render`.

## 사운드

`tools/gen-audio.py`가 패드·펄스·바람 스템(100초)과 임팩트/휘익/글리치/라이저/틱 효과음을 만들고,
`src/components/Soundtrack.tsx`가 장면 흐름에 맞춰 볼륨을 자동화합니다. 다시 생성하려면:

```bash
pip install numpy scipy
python3 tools/gen-audio.py
for f in public/audio/*.wav; do npx remotion ffmpeg -y -i "$f" -c:a aac -b:a 160k -f mp4 "${f%.wav}.m4a"; done
```
