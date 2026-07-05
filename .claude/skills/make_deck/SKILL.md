---
name: make_deck
description: Turn a paper note into a presentation by preparing a very detailed Claude Design brief plus the paper's real figures, then wiring the exported HTML deck into the Paper Notes site's Presentations tab. Use when the user picks a note and wants slides built (via claude.ai/design) with strong visuals — fetched figures and simple diagrams — not just text.
---

# make_deck

선택한 노트 하나를 **발표자료(슬라이드 덱)**로 만드는 skill. 실제 슬라이드 생성은
사람이 **claude.ai/design(Claude Design)** 웹 앱에서 대화로 진행한다(= "갈래 B" 핸드오프).
이 skill이 자동으로 하는 일은 그 앞뒤다:

1. 노트 본문 + 논문 metadata를 읽어 **아주 상세한 발표 brief(prompt)** 를 만든다.
2. 논문 원본(arXiv HTML)에서 **figure를 실제로 내려받아** 슬라이드용 시각자료로 준비한다.
3. 좋은 figure가 없는 슬라이드는 **간단한 다이어그램 스펙**을 brief에 적어 Claude Design이 그리게 한다.
4. Claude Design에서 **HTML로 export**한 결과를 사이트의 발표자료 프레임워크에 등록한다.

> **왜 반자동인가:** Claude Design은 웹 앱에서 사람이 대화로 만드는 도구라 Claude Code가
> headless로 호출할 수 없다. 이 환경의 `DesignSync`/`/design-sync`는 **디자인 시스템(컴포넌트
> 라이브러리) 동기화 전용**이라 발표 덱 생성용이 아니다. 그래서 생성 단계는 사람이 하고,
> 이 skill은 **입력 brief를 극대화**하고 **결과 반입을 자동화**한다.

## 입력

- 노트 제목 또는 id 1개. (예: `"APT: Action Expert Pretraining..."` 또는 `paper-02`)
- 없이 호출되면 어떤 노트인지 물어본다.
- 선택 파라미터(안 주면 기본값 + 확인):
  - **청중/자리**: 그룹 미팅 / 세미나 / 수업 (기본: 랩 그룹 미팅)
  - **길이**: 슬라이드 수 또는 발표 시간 (기본: 12~15장, ~15분)
  - **언어**: **발표자료는 영어로 생성**(기본이자 원칙). 노트는 한국어+영어 혼용이지만 슬라이드
    문구는 전부 영어여야 한다. 단순 번역이 아니라 **용어는 논문 원문에서 실제로 쓰인 표현으로**
    맞춘다(아래 3-bis 참조).
  - **톤/디자인**: 기본 "clean academic, 여백 넉넉, 슬라이드마다 시각자료 1개"

## 배경: 발표자료 프레임워크 (이미 구축됨)

사이트는 노트에 발표자료를 붙이는 틀을 갖고 있다. 이 skill은 그 틀에 결과만 꽂으면 된다.

- **데이터 모델**: paper 객체의 선택 필드 `presentation: { path, title, updatedAt }`.
  `hasPresentation(item)`이 true면 노트가 발표 페이지를 갖는다.
- **seed 등록**: `presentations.js` → `presentationCatalog`가 id(또는 title) → `{ path, title, updatedAt }`.
  `app.js`의 `applyPresentations()`가 `loadPapers()`에서 매칭 항목에 필드를 주입한다.
  `presentation`은 평범한 필드라 export → `notes-snapshot.js` 왕복에 그대로 보존된다.
- **표시/연결**: 사이드바 **Presentations 탭**이 `hasPresentation`인 항목만 모아 보여주고,
  카드를 누르면 **앱 내 iframe 뷰어**(`#presentation-view`)에서 열린다. 노트 reader에는
  **"발표자료" 버튼**이, 덱 뷰어에는 **"새 탭에서 열기 ↗"** 와 **"원본 노트"** 버튼이 있다.
  딥링크는 `#deck=<id>`.
- **덱 파일 위치**: `presentations/<id>/index.html` (필요하면 그 폴더 안에 assets 동봉).
  → **iframe에 임베드되므로 export는 반드시 HTML**(단일 파일 또는 index.html+assets 폴더)이어야 한다.
  PPTX/PDF는 브라우저 iframe에서 렌더링되지 않는다. PPTX는 원하면 다운로드용으로 따로 보관만.

## 절차

### 1. 노트와 metadata 확정
- **source of truth는 `notes-snapshot.js`**. id 또는 title로 항목을 찾아 다음을 읽는다:
  `id`, `title`, `authors`, `year`, `venue`, `url`, `doi`, `collection`/`tags`, 그리고 **`note` 본문**.
  (스냅샷에 없으면 `catalog.js` + `paper-notes-data.js`에서 title로 조립.)
- 노트 본문이 비어 있으면(`""`) 발표 brief를 만들 재료가 없다 → 사용자에게 알리고,
  `fill_note`로 먼저 채우거나 논문 내용을 직접 요약해 진행할지 확인한다. **내용을 지어내지 않는다.**
- arXiv id를 `doi`("arXiv:XXXX") 또는 `url`에서 뽑아 둔다(2단계용).

### 2. 논문 figure 내려받기 (best-effort)
- 산출 폴더를 정한다: `presentations/<id>/assets/`.
- 헬퍼 실행:
  ```bash
  python3 .claude/skills/make_deck/fetch_figures.py <arxiv_id_or_url> presentations/<id>/assets
  ```
  - `arxiv.org/html/<id>` → 실패 시 `ar5iv` 순으로 시도해 `<figure>` 이미지를 받고
    `presentations/<id>/assets/figNN.*` + `figures.md`(파일명·caption·source 색인)를 만든다.
  - JSON 요약(`downloaded`, 각 figure의 caption/source)을 읽는다.
- **figure를 못 받는 경우**(HTML 렌더링 없음/네트워크 차단/구형 논문): 지어내지 말 것.
  대신 3단계에서 **다이어그램 스펙 비중을 높이고**, 필요하면 사용자에게 핵심 그림(아키텍처/teaser)
  캡처를 요청한다. `note` 본문에 이미지 임베드(`![](./assets/...)`)가 있으면 그 경로도 후보로 쓴다.
- 받은 figure를 훑어 **어떤 그림이 무엇인지**(teaser/architecture/main result/ablation 등) 파악한다.
  caption과 본문을 근거로 판단하고, 관련 없거나 깨진 이미지는 brief에서 제외한다.

### 3. 슬라이드 설계 + 시각자료 매핑
노트 본문을 **슬라이드 단위**로 재구성한다. 원칙:
- **슬라이드마다 시각자료 1개**를 원칙으로 한다(사용자가 시각자료를 매우 중시함).
  각 content 슬라이드에 다음 중 하나를 배정: (a) 2단계에서 받은 **실제 figure 파일**, 또는
  (b) **다이어그램 스펙**(직접 그리게 할 것).
- 전형적 흐름(논문에 맞게 조정): Title → Motivation/Problem → (선행연구 한계) →
  **Method overview(보통 architecture figure)** → 핵심 구성요소별 1~2장 →
  **Main results(표/그래프 figure)** → Ablation/Analysis → Takeaways/한 줄 결론 → (참고문헌).
- 본문 bullet은 노트에서 가져오되 슬라이드용으로 압축(한 슬라이드 3~5 bullet, 문장 짧게).
  **노트에 없는 수치/결과를 만들지 않는다.** 불확실하면 그 슬라이드에 물음표로 표시하고 사용자에게 확인.
- **다이어그램 스펙**은 Claude Design이 바로 그릴 수 있게 **구체적으로**: 노드 목록, 화살표(방향/레이블),
  좌→우 또는 상→하 레이아웃, 강조할 블록, 캡션. 예:
  > *Diagram — APT 2단계 학습:* 박스 3개를 좌→우로. `[VL Backbone]` →(freeze)→ `[Action Expert
  > (pretrain)]` →(fine-tune)→ `[VLA Policy]`. 위쪽에 "Stage 1: Action Expert Pretraining",
  > 아래쪽에 "Stage 2: Joint fine-tuning". 강조색은 accent 하나만.

### 3-bis. 영어 용어 확정 (논문 원문 기반)
발표자료는 **영어**로 나가고, 노트는 한국어라 **역번역으로 용어를 지어내면 안 된다.** 논문이
실제로 쓰는 표현으로 맞춘다.
- 논문 원문을 읽어(2단계에서 받은 arXiv HTML, 또는 `WebFetch`로 abstract/intro) **정식 영어 용어**를
  수집한다: 방법·모델 이름, 핵심 개념 용어, 약어(full form 포함), 수식 표기/기호, 데이터셋·벤치마크
  이름, 섹션 제목. (예: 노트의 "행동 전문가 사전학습" → 논문 용어 **"action expert pretraining"**.)
- 짧은 **glossary(한국어 노트 표현 → 논문 영어 용어)** 를 만들어 brief 상단에 넣고, 슬라이드 전체에서
  일관되게 그 용어만 쓴다. 논문에 없는 용어를 새로 만들지 않는다. 애매하면 논문 표기를 그대로 인용.
- 방법/기여의 이름(예: 제안 기법의 축약명)은 **논문이 부여한 이름 그대로** 쓴다(대소문자 포함).

### 4. 발표 brief 작성 → `presentations/<id>/BRIEF.md`
Claude Design에 **그대로 붙여넣을** 상세 prompt를 쓴다. **아래 섹션을 모두 채운다**(비면 결과가 나빠짐):

```markdown
# 발표자료 생성 요청: <제목 축약>

## 1) 논문
- 제목: <full title>
- 저자 / 발표처 / 연도: <authors> · <venue> · <year>
- 링크: <url>
- 한 문장 논지(thesis): <이 논문이 주장하는 핵심 한 줄>

## 2) 발표 맥락
- 청중: <랩 그룹 미팅 등> / 사전지식: <해당 분야 연구자 수준>
- 길이: 슬라이드 <N>장, 약 <M>분
- 언어: **English throughout.** Use the paper's own terminology (see Glossary below); do not invent terms.
- 목표: <이 발표로 청중이 얻어갈 1~2가지>

## 2-bis) Glossary (paper terminology — use these exact terms)
<3-bis에서 만든 목록: 개념 → 논문 영어 용어. 방법/모델 이름, 약어(full form), 표기/기호 포함>

## 3) 디자인 방향
- 비율 16:9, clean academic. 여백 넉넉, 슬라이드당 핵심 1개.
- **모든 content 슬라이드에 시각자료 1개**(아래 figure 또는 diagram).
- 타이포: 제목 serif, 본문 sans. 강조색(accent) 1개만. 배경은 밝은 톤.
- bullet은 3~5개, 짧은 구. 문단 금지. 수식은 필요할 때만 크게.
- 출력: 완성 후 **HTML로 export**(웹 임베드용). 파일은 index.html 기준.

## 4) 업로드한 시각자료 (assets/ 폴더)
<figures.md 기반으로 나열 — 각 파일이 무엇이고 어느 슬라이드에 쓸지>
- `fig01.png` — Figure 1, 전체 architecture. → 슬라이드 4(Method overview)에 크게.
- `fig03.png` — Table 2, main results. → 슬라이드 8(Results).
- ...

## 5) 슬라이드 구성(장별)
> 각 장: 제목 / 본문 bullet / **시각자료 지정**(파일명 또는 diagram 스펙) / 발표자 노트

### S1. Title
- <제목, 저자, 발표처/연도>
- 시각자료: teaser figure(`figXX.png`) 있으면 배경/우측에 은은하게.

### S2. Motivation
- <노트에서 뽑은 문제의식 bullet 3~4개>
- 시각자료: <figure 또는> Diagram — <구체 스펙>
- 발표자 노트: <말로 보탤 맥락>

### S3. ... (Method / 구성요소 / Results / Ablation / Takeaways 순으로 계속)
...

### S(N). Takeaways
- <핵심 3줄>
- 시각자료: 핵심 그림 1개 재등장 또는 요약 diagram.

## 6) 다이어그램 스펙(직접 그릴 것)
<3단계에서 정한 diagram들을 노드/화살표/레이블/레이아웃까지 구체적으로>

## 7) 지켜야 할 것
- 논문/노트에 **없는 수치·결과·주장 금지**. 불확실하면 비워 두고 표시.
- 용어는 원어 유지. 캡션 출처는 해당 figure의 원 논문 그림 번호를 따른다.
```

- brief는 **노트 본문에 충실**해야 한다. 노트의 강조점·연결(`[[...]]`)·용어를 반영한다.
- 다 쓰면 사용자에게 brief 요약(장수, 어떤 figure를 어디에 쓰는지, 만들 diagram 목록)을 보여준다.

### 5. Claude Design 핸드오프 (사용자 수동 단계)
사용자에게 아래를 안내한다(그대로 출력):
1. **claude.ai/design** 새 대화를 연다.
2. `presentations/<id>/assets/`의 이미지들을 **업로드**한다.
3. `presentations/<id>/BRIEF.md` 내용을 **붙여넣어** 생성을 요청한다.
4. 캔버스/인라인 코멘트로 다듬는다(슬라이드별 시각자료 배치 확인).
5. 완성되면 **Export → HTML**로 내보낸다. (단일 HTML 또는 index.html+assets zip)
6. 내보낸 파일을 사용자가 저장한 경로를 이 skill에 알려주면 6단계로 넘어간다.

### 6. export 반입 → 사이트에 등록
- 사용자가 준 export를 `presentations/<id>/`에 배치한다. 진입 파일은 **`index.html`**.
  - 단일 HTML이면 그대로 `presentations/<id>/index.html`로 저장.
  - 폴더/zip이면 풀어서 통째로 넣고, 진입점을 `index.html`로 맞춘다(상대경로 asset 유지).
- `presentations.js`의 `presentationCatalog`에 항목을 추가/갱신한다(id 키 우선):
  ```js
  "<id>": {
    path: "presentations/<id>/index.html",
    title: "<발표 제목>",
    updatedAt: "<YYYY-MM-DD>"
  }
  ```
  - 이미 있던 데모/이전 항목이면 값만 갱신.
  - **기존 방문자 브라우저에도 반영**되게 하려면 `app.js`의 `PRESENTATION_CATALOG_KEY` suffix를
    올린다(예: `-v1` → `-v2`). 저장소의 다른 seed 스텝과 동일한 패턴.
- 검증:
  ```bash
  node --check app.js && node --check presentations.js
  python3 -m http.server 8080   # Presentations 탭 → 카드 → iframe에서 슬라이드 확인
  ```
- 원하면 `sync_to_repo`로 라이브 반영(스냅샷에 `presentation` 필드가 실려 lossless 보존됨).
  커밋/푸시는 사용자가 요청할 때만.

## 가드레일
- **내용 날조 금지**: 노트/논문에 없는 결과·수치·인용을 만들지 않는다. 빈 곳은 표시하고 물어본다.
- **figure는 실제 원본만**: 논문 그림을 재현/변형해 "가짜 결과 그림"을 만들지 않는다.
  못 구하면 다이어그램(개념도)으로 대체하고 그 사실을 밝힌다.
- **덱은 전부 영어.** 용어는 노트(한국어)를 역번역하지 말고 **논문 원문의 표현**으로 통일한다(3-bis).
  방법/기여 이름은 논문이 부여한 이름 그대로. 논문에 없는 용어를 새로 만들지 않는다.
- export는 HTML(임베드용). PPTX가 필요하면 별도 다운로드로만 두고 사이트엔 HTML을 등록한다.
- 커밋/푸시/라이브 반영은 사용자 확인 후에만.

## 이 skill의 파일
- `fetch_figures.py` — arXiv HTML(→ ar5iv fallback)에서 figure를 내려받아 `figures.md` 색인을
  만드는 stdlib 헬퍼. 못 찾으면 빈 결과 + 사유를 JSON으로 알린다(exit 0).
