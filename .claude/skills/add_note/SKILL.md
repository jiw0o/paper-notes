---
name: add_note
description: Add a new paper note from a paper link (arXiv/abstract URL). Fetches the paper's metadata and creates an empty (blank) note entry so it shows up in the Paper Notes web app. Use when the user shares a paper URL and wants a note stub created for it.
---

# add_note

새 논문 노트를 빈 화면으로 추가하는 skill. 사용자가 논문 link를 주면, 그 논문의 metadata를 가져와 catalog와 note 데이터에 등록한다. note 본문은 비워 두고(`""`) 상태는 `not-yet`으로 둔다.

## 입력

- 논문 link 1개 (예: `https://arxiv.org/abs/2406.12345`). abs / pdf / 학회 페이지 모두 가능.
- link 없이 호출되면 사용자에게 논문 link를 물어본다.

## 데이터 모델 (배경)

이 앱은 두 파일에서 논문을 조립한다:

1. `catalog.js` → `const curatedPaperCatalog = [ ... ]`: 논문 **metadata** 배열.
2. `paper-notes-data.js` → `const importedPaperNotes = { ... }`: 제목(title)을 key로 하는 **note 본문** 객체.

앱은 catalog의 각 논문에 대해 같은 `title`을 가진 note를 찾아 본문을 채운다. 따라서 **두 파일의 title 문자열은 정확히 동일**해야 한다. 카테고리는 자동 추론하지 않고 사람이 직접 정하는 값이므로, 새 논문은 카테고리를 **비워 둔다**(`"categories": []`). 이후 앱의 "정보 수정"에서 또는 catalog 항목의 `categories`에 직접 넣어 분류한다.

## 절차

1. **link에서 metadata 수집.** WebFetch로 논문 페이지를 읽어 다음을 추출한다:
   - `title`: 논문 제목 (부제 포함, 원문 그대로). LaTeX/줄바꿈 제거하고 한 줄로.
   - `authors`: 저자 이름 문자열 **배열**.
   - `year`: 발행 연도 (숫자).
   - `venue`: 발표처. arXiv preprint면 `"Preprint (arXiv)"`. 학회 채택이 명시돼 있으면 `"NeurIPS 2024"`처럼.
   - `doi`: arXiv면 `"arXiv:2406.12345"` 형식. 그 외에는 DOI 문자열, 없으면 `""`.
   - `url`: 정규 abstract URL (arXiv면 `https://arxiv.org/abs/<id>`).

   > arXiv는 `https://arxiv.org/abs/<id>` 페이지에 title/authors/year가 모두 있다. pdf 링크를 받으면 abs 링크로 바꿔 fetch한다.

2. **중복 확인.** `catalog.js`와 `paper-notes-data.js`에서 같은 title이 이미 있는지 Grep으로 확인한다. 있으면 추가하지 말고 사용자에게 이미 존재함을 알린다.

3. **`catalog.js`에 metadata 추가.** `curatedPaperCatalog` 배열 안에, 기존 항목과 동일한 **double-quote JSON 스타일**로 삽입한다. 배열은 title 기준 알파벳순이므로 알맞은 위치에 끼워 넣는다(맞는 위치를 찾기 애매하면 배열 끝 `]` 직전에 넣어도 동작에는 문제 없다). 형식:

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
       "categories": []
     },
   ```

   `categories`는 사람이 나중에 직접 채울 자리이므로 **항상 빈 배열**로 둔다. (앱은 `categories[0]`을 주 카테고리, 나머지를 보조 카테고리로 쓴다.)

   바로 앞 항목 뒤에 쉼표가 오도록 유의한다(JSON이 아니라 JS 배열 리터럴이라 trailing comma는 허용되지만, 기존 스타일은 항목 사이에 쉼표를 둔다).

4. **`paper-notes-data.js`에 빈 note 추가.** `importedPaperNotes` 객체에 title을 key로 하는 항목을 넣는다. 본문은 빈 문자열, 상태는 `not-yet`:

   ```js
     "<TITLE>": {
       "note": "",
       "status": "not-yet"
     },
   ```

   title에 `"`나 `\`가 있으면 JS 문자열로 escape한다. 객체도 title 알파벳순이지만, 위치가 애매하면 마지막 항목 뒤(닫는 `}` 직전)에 추가한다.

5. **검증.** `node --check catalog.js`와 `node --check paper-notes-data.js`로 두 파일이 문법 오류 없이 파싱되는지 확인한다.

6. **보고.** 추가한 title, venue, year를 한 줄로 요약해 사용자에게 알린다. note는 비어 있으니 앱에서 열어 작성하면 된다고 안내한다.

## 주의

- 두 파일의 title은 **글자 그대로 동일**해야 한다(공백·콜론·대소문자 포함).
- note 본문은 절대 임의로 채우지 않는다. "빈 화면"이 이 skill의 목적이다.
- commit/push는 사용자가 명시적으로 요청할 때만 한다.
