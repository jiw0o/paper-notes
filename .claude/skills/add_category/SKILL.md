---
name: add_category
description: Add a new paper category (or assign an existing one) to one or more papers/study notes, writing both the catalog.js seed and the live notes-snapshot.js so it actually shows up. Use when the user wants to introduce a category (e.g. "Tactile", "In-Context Learning") and tag the relevant papers with it.
---

# add_category

새 카테고리를 도입하고(또는 기존 카테고리를) 해당하는 논문/스터디 노트에 부여하는 skill.

## 핵심 개념 (꼭 알 것)

이 앱에는 **카테고리 레지스트리가 따로 없다.** 카테고리는 어떤 항목의 `categories`(seed) 또는 `collection`/`tags`(live)에 그 이름이 **쓰이는 순간 존재**한다. 즉 "카테고리 추가" = **하나 이상의 논문에 그 이름을 부여**하는 것이다. 아무 논문에도 안 붙이면 사이드바/필터에 나타나지 않는다.

카테고리 값이 사는 곳(이중 기록 필요):

1. `catalog.js` → 각 논문의 `categories` 배열 (**seed**). `categories[0]`=주 카테고리, 나머지=보조.
2. `notes-snapshot.js` → 각 논문의 `collection`(주) + `tags`(보조) (**live source of truth**). 스냅샷이 비어있지 않으면 fresh load는 이걸 쓴다.

> ⚠️ 스냅샷에 이미 있는 논문의 카테고리를 바꾸려면 **`notes-snapshot.js`를 반드시 함께 고쳐야** 화면에 반영된다. `catalog.js`만 고치면 fresh load엔 안 보인다(스냅샷 우선). 두 곳을 일치시킨다.
>
> ⚠️ **스터디 노트(topic)** 의 카테고리는 `app.js`의 `applyStudyTaxonomy`가 로드 때마다 `catalog.js`의 `studyTopicCatalog`(각 topic의 `collection`/`tags`)로 **덮어쓴다.** 따라서 topic 카테고리는 스냅샷이 아니라 **`studyTopicCatalog`에서** 바꿔야 한다(스냅샷만 고치면 되돌아감).

## 입력

- 카테고리 이름 1개 이상.
- 부여할 대상: 논문 제목 목록, 또는 "이런 내용의 논문들"처럼 기준. 불명확하면 사용자에게 **어느 논문에 붙일지** 물어본다(카테고리는 대상이 있어야 의미가 있으므로).

## 절차

1. **기존 vocabulary 확인.** 중복·표기 흔들림을 막기 위해 현재 쓰이는 카테고리 이름을 모은다:
   ```bash
   grep -ho '"categories": \[[^]]*\]' catalog.js | sed 's/"categories": //' | tr ',' '\n' | sed 's/[][" ]//g; s/&/ \& /' | sort -u
   ```
   비슷한 이름이 이미 있으면(예: `Tactile` vs `Tactile Sensing`) 새로 만들지 말고 그걸 재사용할지 사용자에게 확인한다.

2. **대상 논문 확정.** 사용자가 제목을 줬으면 그대로, 기준만 줬으면 catalog 제목/내용으로 후보를 추려 사용자 확인을 받는다. 각 대상에 대해 새 카테고리를 **주(primary)** 로 둘지 **보조(secondary)** 로 둘지 정한다(기본은 보조 — 기존 주 카테고리를 유지).

3. **각 논문 수정 (papers).** 대상마다:
   - `catalog.js`: 그 논문의 `categories` 배열에 이름 추가. 주면 맨 앞, 보조면 뒤.
   - `notes-snapshot.js`: 그 논문 항목에서 주면 `collection`을 교체, 보조면 `tags` 배열에 추가. (스냅샷의 `tags`는 여러 줄 배열 스타일이므로 형식을 맞춘다.)
   - 그 논문이 스냅샷에 **없으면**(예: `add_note`로 막 추가한 것) `catalog.js`만 고치고, `app.js`의 `mergeMissingCuratedPapers` `additionTitles`에 들어 있는지 확인한다.

   > 스냅샷 항목은 `"url"`이 보통 고유하므로, 그 url 줄을 앵커로 잡아 바로 아래 `collection`/`tags`를 Edit하면 안전하다.

4. **스터디 노트가 대상이면.** `catalog.js`의 `studyTopicCatalog`에서 해당 topic의 `collection`/`tags`를 고친다(위 ⚠️ 참고). 스냅샷이 아니라 여기서.

5. **검증.** 고친 파일마다 `node --check`:
   ```bash
   node --check catalog.js && node --check notes-snapshot.js   # (+ app.js 고쳤으면 그것도)
   ```
   그리고 새 카테고리가 의도한 논문들에 들어갔는지 1번 grep으로 재확인.

6. **보고.** 추가한 카테고리 이름과 어떤 논문에 (주/보조로) 붙였는지 요약한다. 아래 "보이게 하는 법"을 덧붙인다.

## 보이게 하는 법 (사용자 안내)

- 이 skill은 **live source of truth인 `notes-snapshot.js`를 직접 고치므로**, 새 브라우저/기기는 fresh load에서 바로 보인다.
- **본인의 기존 브라우저**는 localStorage가 우선이라 자동으로 안 바뀐다 → 사이드바 **데이터 초기화** 버튼(또는 `localStorage.clear()`) 후 새로고침하면 반영된다.
- ⚠️ 다음에 `sync_to_repo`를 돌리면 export로 스냅샷이 통째로 덮어써진다. 그러니 **위로 본인 브라우저를 먼저 갱신**해 두면, 이후 export에도 이 카테고리가 포함돼 sync로 보존된다(갱신 안 하고 export하면 되돌아갈 수 있음).

## 주의

- 카테고리는 **대상 논문이 있어야 존재**한다. 아무 데도 안 붙이는 "빈 카테고리"는 만들지 않는다.
- `catalog.js`와 `notes-snapshot.js`의 카테고리 표기는 **글자 그대로 동일**해야 한다(대소문자·공백·`&`).
- commit/push는 사용자가 명시적으로 요청할 때만.
