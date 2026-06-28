---
name: add_note
description: Add a new paper note from a paper link (arXiv/abstract URL). Fetches the paper's metadata, picks categories based on the paper's content (proposing a new category if none fit), and creates a blank note entry so it shows up in the Paper Notes web app. Use when the user shares a paper URL and wants a note stub created for it.
---

# add_note

새 논문 노트를 빈 화면으로 추가하는 skill. 사용자가 논문 link를 주면, 그 논문의 metadata를 가져와 catalog와 note 데이터에 등록한다. note 본문은 비워 두고(`""`) 상태는 `not-yet`으로 둔다. **카테고리는 논문 내용을 바탕으로 직접 골라 채운다.**

## 입력

- 논문 link 1개 (예: `https://arxiv.org/abs/2406.12345`). abs / pdf / 학회 페이지 모두 가능.
- link 없이 호출되면 사용자에게 논문 link를 물어본다.

## 데이터 모델 (배경)

이 앱은 세 곳에서 논문 상태를 조립한다:

1. `catalog.js` → `const curatedPaperCatalog = [ ... ]`: 논문 **metadata** 배열. 각 항목에 `categories` 배열(사람이 직접 정함)이 있다. 앱은 `categories[0]`을 주 카테고리(collection), 나머지를 보조 카테고리로 쓴다.
2. `paper-notes-data.js` → `const importedPaperNotes = { ... }`: 제목(title)을 key로 하는 **note 본문** 객체.
3. `notes-snapshot.js` → `const notesSnapshot = { ..., papers: [...] }`: **라이브 전체 상태 스냅샷**. 비어있지 않으면 fresh load의 **source of truth**라서 seed 파일(1·2)을 덮어쓴다.

앱은 catalog의 각 논문에 대해 같은 `title`을 가진 note를 찾아 본문을 채운다. 따라서 **catalog.js와 paper-notes-data.js의 title 문자열은 정확히 동일**해야 한다.

> ⚠️ **스냅샷이 채워져 있으면**(현재 상태) catalog.js에 논문만 추가해도 fresh load엔 안 보인다 — 스냅샷이 우선이기 때문. 그래서 아래 5번에서 `mergeMissingCuratedPapers`에 title을 등록해, 스냅샷을 source로 쓰는 상태에서도 새 논문이 주입되게 한다(repo의 T-Rex 처리와 동일한 패턴).

## 절차

1. **link에서 metadata 수집.** WebFetch로 논문 페이지를 읽어 다음을 추출한다:
   - `title`: 논문 제목 (부제 포함, 원문 그대로). LaTeX/줄바꿈 제거하고 한 줄로.
   - `authors`: 저자 이름 문자열 **배열**.
   - `year`: 발행 연도 (숫자).
   - `venue`: 발표처. arXiv preprint면 `"Preprint (arXiv)"`. 학회 채택이 명시돼 있으면 `"NeurIPS 2024"`처럼.
   - `doi`: arXiv면 `"arXiv:2406.12345"` 형식. 그 외에는 DOI 문자열, 없으면 `""`.
   - `url`: 정규 abstract URL (arXiv면 `https://arxiv.org/abs/<id>`).
   - **abstract 본문**: 카테고리 선택의 근거로 쓰기 위해 초록/요지를 읽어둔다(저장은 안 함).

   > arXiv는 `https://arxiv.org/abs/<id>` 페이지에 title/authors/year/abstract가 모두 있다. pdf 링크를 받으면 abs 링크로 바꿔 fetch한다.

2. **중복 확인.** `catalog.js`와 `paper-notes-data.js`에서 같은 title이 이미 있는지 Grep으로 확인한다. 있으면 추가하지 말고 사용자에게 이미 존재함을 알린다.

3. **카테고리 선택 (논문 내용 기반).**
   - 먼저 **현재 카테고리 vocabulary**를 파악한다: `catalog.js`의 `categories` 배열들과 `notes-snapshot.js`의 `collection`/`tags`에서 실제로 쓰이는 이름을 모은다. (예: `grep -ho '"categories": \[[^]]*\]' catalog.js`)
     - 현재 세트(참고, 데이터에서 재확인할 것): Causality · Dexterous Manipulation · Diffusion Policy · Humanoid · Latent Action · Loco-Manipulation · Reinforcement Learning · Risk & Uncertainty · Skill Discovery · Spatial Reasoning · World Model · VLA · VLM · WAM · Safety · Benchmark · Steering
   - 1번에서 읽은 **abstract/제목 내용**을 근거로, 이 세트에서 해당하는 카테고리를 1~3개 고른다. **가장 핵심이 되는 것을 맨 앞**(주 카테고리)에 둔다. 제목 키워드만 보고 기계적으로 넣지 말고 실제 기여/주제로 판단한다.
   - 표기는 기존 이름과 **글자 그대로 동일**해야 한다(대소문자·공백·`&` 포함).
   - **기존 세트에 적당한 게 없으면** 임의로 만들지 말고 **새 카테고리를 사용자에게 제안**한다: 제안 이름 + 한 줄 근거를 제시하고 동의를 받는다. 동의하면 그 이름을 쓰고, 거절하면 사용자가 지정한 이름/기존 카테고리를 쓴다. (확신이 서면 제안과 함께 그대로 진행하되, 새 이름은 반드시 한 번 확인받는다.)

4. **`catalog.js`에 metadata 추가.** `curatedPaperCatalog` 배열 안에, 기존 항목과 동일한 **double-quote JSON 스타일**로 삽입한다. 배열은 title 기준 알파벳순이므로 알맞은 위치에 끼워 넣는다(애매하면 배열 끝 `]` 직전도 무방). 형식:

   ```js
     {
       "title": "<TITLE>",
       "authors": [
         "<Author 1>",
         "<Author 2>"
       ],
       "year": <YEAR>,
       "venue": "<VENUE>",
       "doi": "<DOI>",
       "url": "<URL>",
       "categories": ["<Primary>", "<Secondary>"]
     },
   ```

   바로 앞 항목 뒤에 쉼표가 오도록 유의한다.

5. **`paper-notes-data.js`에 빈 note 추가.** `importedPaperNotes` 객체에 title을 key로 하는 항목을 넣는다. 본문은 빈 문자열, 상태는 `not-yet`:

   ```js
     "<TITLE>": {
       "note": "",
       "status": "not-yet"
     },
   ```

   title에 `"`나 `\`가 있으면 JS 문자열로 escape한다. 위치가 애매하면 닫는 `}` 직전에 추가한다.

6. **스냅샷 상태에서도 보이게 등록.** `app.js`의 `mergeMissingCuratedPapers` 안 `additionTitles` Set에 이 논문 title을 **글자 그대로** 추가한다. 그래야 `notes-snapshot.js`가 source of truth인 상태에서도 새 논문이 주입된다. `node --check app.js`로 확인.

7. **검증.** `node --check catalog.js`, `node --check paper-notes-data.js`, `node --check app.js`로 세 파일 모두 파싱되는지 확인한다.

8. **보고.** 추가한 title·venue·year와 **고른 카테고리(+ 새 카테고리를 만들었다면 그 사실)**를 한 줄로 요약한다. note는 비어 있으니 앱에서 열어 작성하면 된다고 안내하고, 아래 "보이게 하는 법"을 덧붙인다.

## 새 논문을 화면에서 보이게 하는 법 (사용자 안내)

- **본인 브라우저**: 콘솔에서 `localStorage.removeItem("margin-curated-catalog-additions-v1")` 후 새로고침하면 6번 등록 덕에 새 논문이 주입된다. (또는 `localStorage.clear()` 후 새로고침.)
- **모두에게 영구 반영**: 위로 본인 화면에서 확인한 뒤, 사이드바 "데이터 내보내기" → `sync_to_repo`로 스냅샷에 구워 넣고 push 하면 다른 기기/새 브라우저에도 반영된다.

## 주의

- catalog.js와 paper-notes-data.js의 title은 **글자 그대로 동일**해야 한다(공백·콜론·대소문자 포함).
- note 본문은 절대 임의로 채우지 않는다. "빈 화면"이 이 skill의 목적이다. (카테고리만 내용 기반으로 채운다.)
- 새 카테고리는 **반드시 사용자 확인 후** 도입한다. 비슷한 기존 이름이 있으면 그걸 재사용한다(중복 난립 방지).
- commit/push는 사용자가 명시적으로 요청할 때만 한다.
