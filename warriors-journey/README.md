# 전사의 여정

브라우저에서 돌아가는 3D 액션 게임 (WebGL2, 외부 라이브러리 없음). 기사가 바람골 마을을 거점으로 둘레의 들판(오픈월드)을 평정하고, 봉인이 풀린 동굴로 들어가 보스 바위 골렘과 싸웁니다.
공격 버튼을 꾹 누르고 있다 놓으면 **차지 공격**, Tab(지도 버튼)으로 **세계 지도**.

## 바로 해 보기

```bash
python3 tools/serve.py      # http://localhost:8000 을 브라우저로 열기
```

`index.html`을 파일로 바로 열면 브라우저 보안 때문에 안 될 수 있어서, 위 테스트 서버로 여는 것이 안전합니다.

## 이어서 만들기

- **`PROGRESS.md`에 모든 것이 정리되어 있습니다**: 조작, 파일별 역할, 지금까지 한 일, 다음 할 일, 아티팩트 갱신 방법.
- 밸런스·그래픽 숫자: `js/config.js`, 테마별 색·조명·화면 마무리: `js/render.js`의 `LIGHTING`.
- 새 스크립트 파일을 추가하면 `index.html`과 `artifact.html`의 `<script>` 목록을 둘 다 고쳐 주세요.
- Claude Code에서 이어 갈 때: 이 폴더를 열고 "PROGRESS.md 읽고 이어서 만들어 줘"라고 하면 됩니다.
- 오픈월드 지도를 바꾸려면 `tools/gen-world.mjs`의 숫자를 고치고 `node tools/gen-world.mjs` (→ `js/levels.js`에 써넣음).

## 폴더

| 경로 | 내용 |
|---|---|
| `index.html` / `artifact.html` | 브라우저용 / Claude 아티팩트용 시작 파일 |
| `js/` | 게임 코드 전부 |
| `tools/` | 테스트 서버, 헤드리스 크롬 스크린샷 도구, 오픈월드 지도 생성기 |
| `.claude/shots/ref/` | 그래픽 참고 그림 (야숨·왕눈, git에는 포함하지 않음) |
