---
name: review_note
description: Review an existing paper/study note by title for typos, factual errors against the source paper, and formatting/readability problems. Use when the user gives a note title and wants the note's content checked and proofread. Produces a structured review report; only edits the note if the user asks.
---

# review_note

노트 제목을 받아 그 노트 내용을 **종합 검토**하는 skill. 세 가지 축으로 본다:

1. **오타** — 한글/영문 맞춤법, LaTeX 수식 오타, 용어 표기 일관성.
2. **원문과 다른 내용** — 원문 논문과 비교해 사실관계가 틀리거나 왜곡된 서술.
3. **포맷·가독성** — heading 계층, 리스트 중첩, 깨진 수식/링크/이미지, 흐름이 어색한 부분.

기본 동작은 **리뷰 리포트 생성**이다. 노트 파일 수정은 사용자가 명시적으로 요청할 때만 한다.

## 입력

- 노트 제목 1개 (정확하지 않아도 됨 — 부분 제목/약칭이면 퍼지 매칭으로 찾는다. 예: `UniVLA`).
- 제목 없이 호출되면 사용자에게 어떤 노트인지 물어본다.

## 데이터 위치 (배경)

노트 본문의 **현재 source of truth는 `notes-snapshot.js`**다(라이브 사이트에서 수정한 최신 내용이 sync로 여기에 들어옴). seed 파일은 스냅샷이 비었을 때의 폴백/초기값일 뿐이라, 그것만 보면 옛 내용을 검토할 수 있다.

- 라이브 스냅샷: `notes-snapshot.js`의 `notesSnapshot.papers` (각 항목에 title·note·status·collection·tags·url·doi 등 전체 필드). `type:"topic"`이면 study, 아니면 paper.
- 폴백 seed — paper 노트: `paper-notes-data.js`의 `importedPaperNotes`, study 노트: `study-notes-data.js`의 `importedStudyNotes`, 논문 metadata: `catalog.js`의 `curatedPaperCatalog`.

아래 `extract_note.js`는 **스냅샷을 먼저** 보고 없으면 seed로 폴백하며, 출력 JSON의 `origin` 필드로 어디서 찾았는지(`snapshot`/`seed`) 알려준다.

노트 본문은 Markdown이며 다음을 포함한다: `#`/`##`/`###` heading, `-` 리스트(들여쓰기로 중첩), KaTeX 수식(`$...$`, `$$...$$`), 다른 노트로의 `[[제목]]` 위키링크, 이미지 임베드(`![name](./assets/papers/image%20N.png)`).

## 절차

1. **노트 추출.** skill 폴더의 헬퍼를 repo 루트에서 실행한다(노트 본문은 길 수 있으니 파일로 받아 Read 한다):

   ```bash
   node .claude/skills/review_note/extract_note.js "<제목>" <scratchpad>/_review_note.md
   ```

   stdout의 JSON에서 `found`, `origin`(snapshot/seed), `key`(정규화된 정확한 제목), `source`(paper/study), `catalog.url`, `catalog.doi`를 얻는다. `found:false`면 비슷한 제목 후보를 grep으로 찾아 사용자에게 확인한다. 그다음 `noteFile`을 Read 도구로 읽는다(길면 페이지네이션). `origin`은 5번 수정 적용 시 어느 파일을 고쳐야 하는지를 결정한다.

2. **원문 확보 (사실관계 정밀 비교용).** 원문 **본문 전체**를 받아 대조한다.
   - paper 노트면 `catalog.url`/`doi`에서 arXiv id를 뽑아 **PDF를 내려받는다**:
     ```bash
     curl -sL "https://arxiv.org/pdf/<id>" -o <scratchpad>/_source.pdf
     ```
     받은 PDF는 **Read 도구의 `pages` 파라미터**로 읽는다(한 번에 최대 20쪽; 노트에서 짚을 부분과 관련된 섹션 위주로 필요한 범위를 읽는다. 수식·수치·실험 표가 핵심이면 그 페이지를 반드시 확인).
   - PDF 다운로드/파싱이 실패하면 `https://arxiv.org/html/<id>` → `https://ar5iv.org/abs/<id>` → abstract 페이지(`https://arxiv.org/abs/<id>`) 순으로 WebFetch 폴백하고, "본문 일부만 확인"이라고 표시한다.
   - url이 없거나 study 노트면, 원문 대조는 일반 지식 범위에서만 신중히 하고 "원문 미확인"이라고 표시한다. 불확실하면 단정하지 말 것.

3. **검토 수행.** 노트 본문을 읽으며 항목별로 점검한다.
   - **오타/표기**: 한글 맞춤법·띄어쓰기, 영문 스펠링, LaTeX 토큰 오타(`\infin`→`\infty`, `\theroem` 등), 모델·약어 표기 일관성(예: π0 vs Pi0, VLA 대문자).
   - **사실관계**: 수식·수치·기여(contribution)·방법론·실험 결과가 원문과 일치하는지. 원문에 근거가 있으면 인용해 지적하고, 추정이면 추정임을 밝힌다.
   - **포맷/가독성**: heading 단계 건너뜀, 빈 리스트/깨진 들여쓰기, 닫히지 않은 `$`·`$$`, 깨진 `[[링크]]`(대상 노트가 없을 수 있음 — 단순 경고), 깨진 이미지 경로(`assets/papers/` 또는 `assets/study-notes/`에 실제 파일 존재 여부 확인), 너무 길어 끊어 읽기 어려운 문단.

4. **리포트 작성.** 사용자에게 아래 형식으로 보고한다. 위치는 노트 안의 heading/문구를 인용해 찾기 쉽게 한다(노트에는 줄 번호가 없으므로 주변 텍스트로 가리킨다).

   ```
   ## 📝 노트 검토: <key>
   상태: <status> · 원문: <url 또는 "미확인">

   ### 오타 / 표기 (N건)
   - 「…인용…」 → 제안: …  (이유)

   ### 원문과 다른 내용 (N건)
   - 「…인용…」 → 원문: …  (출처/추정 여부)

   ### 포맷 / 가독성 (N건)
   - … (구체 위치와 개선안)

   ### 총평
   1~2문장 요약 + 우선 고칠 것.
   ```

   문제가 없는 축은 "이상 없음"으로 간단히 적는다. 과잉 지적을 피하고 실제로 가치 있는 항목만 든다.

5. **(선택) 수정 적용.** 사용자가 고쳐달라고 하면 `origin`에 따라 **고치는 파일이 다르다**:
   - `origin:"snapshot"` (현재 대부분): 라이브 source of truth인 `notes-snapshot.js`의 해당 항목 `note` 문자열을 Edit으로 수정한다. ⚠️ 단, `notes-snapshot.js`는 `sync_to_repo`가 export로 통째로 덮어쓰므로, 같은 수정을 **라이브 사이트에도 반영(또는 수정 후 다시 export)** 하지 않으면 다음 sync 때 되돌아간다. 그래서 가벼운 오타 정도가 아니면, **사이트에서 직접 고친 뒤 export→sync** 흐름을 사용자에게 권하는 게 안전하다.
   - `origin:"seed"` (스냅샷에 아직 없는 새 논문 등): `paper-notes-data.js`/`study-notes-data.js`의 `note`를 수정한다.
   - 본문은 한 줄 JS 문자열(이스케이프된 `\n`)이므로, 교체할 조각도 파일에 저장된 형태(이스케이프 포함) 그대로 매칭해야 한다. 수정 후 `node --check <파일>`로 문법을 검증한다. 의미를 바꾸는 사실관계 수정은 적용 전에 사용자 확인을 받는다.

## 주의

- 검토만 요청받았으면 파일을 수정하지 않는다.
- 원문에서 확인 못 한 내용을 사실처럼 단정하지 않는다 — "추정"/"원문 미확인"으로 표시.
- `[[링크]]` 대상이 없다고 무조건 오류로 보지 않는다(아직 안 쓴 노트일 수 있음). 깨진 이미지 경로처럼 실제 자원 부재가 확인되는 것만 오류로 든다.
- 작업용 임시 파일(`_review_note.md` 등)은 scratchpad에 둔다.
