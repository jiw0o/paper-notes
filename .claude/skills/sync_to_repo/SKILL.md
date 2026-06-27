---
name: sync_to_repo
description: Pull changes made on the deployed GitHub Pages site back into the repo and push. Takes the JSON exported from the app's "데이터 내보내기" button, regenerates notes-snapshot.js (full lossless state), then commits and pushes to the deploy branch. Use when the user edited/added notes on the live site and wants the repo updated and redeployed.
---

# sync_to_repo

배포된 GitHub Pages 사이트에서 한 변경(노트 수정/추가, 상태·카테고리·즐겨찾기·abstract 변경 등)을 repo로 되가져와 push 하는 skill.

배포 앱은 데이터를 브라우저 **localStorage**에만 저장하므로, 변경사항을 꺼내오는 유일한 경로는 사이드바의 **"데이터 내보내기"** 버튼으로 받는 JSON이다. 이 skill은 그 JSON을 받아 repo의 `notes-snapshot.js`(전체 상태 무손실 스냅샷)를 재생성하고, commit + push 한다.

## 동작 원리 (배경)

- export JSON 형식: `{ version, exportedAt, papers: [ ... ] }`. `papers`의 각 항목은 note 한 개의 **전체 필드**(note, status, collection, tags, abstract, favorite, title, authors, year, venue, doi, url 등).
- `index.html`은 `notes-snapshot.js`를 `app.js` 직전에 로드한다.
- `app.js`의 `loadPapers()`는 **fresh load(처음 방문/캐시 초기화) 시 `notesSnapshot.papers`가 비어있지 않으면 그걸 source of truth로 그대로 사용**한다 → 무손실. 비어있으면 기존 seed(`catalog.js` + `paper-notes-data.js` + `study-notes-data.js`)로 폴백한다.
- 따라서 이 skill이 갱신하는 파일은 **`notes-snapshot.js` 하나**다. 손실 없이 라이브 상태 전체가 반영된다.

## 입력

- export JSON 파일 경로. 사용자가 사이트에서 "데이터 내보내기"로 받은 `paper-notes-YYYY-MM-DD.json`.
- 경로를 안 주면: 윈도우 Downloads(`/mnt/c/Users/hwang/Downloads`)에서 가장 최근 `paper-notes-*.json`을 찾아 후보로 제시하고 확인받는다. 없으면 사용자에게 "사이트에서 데이터 내보내기 후 파일 경로를 알려달라"고 안내한다.

## 절차

1. **export 파일 확보.** 경로를 확인한다(없으면 위처럼 Downloads에서 최신 파일 탐색). 파일이 실제로 존재하는지 확인.

2. **스냅샷 재생성.** repo 루트에서 생성기를 실행한다:

   ```bash
   node .claude/skills/sync_to_repo/build_snapshot.js "<export.json 경로>"
   ```

   `notes-snapshot.js`를 덮어쓰고, stdout으로 `{ total, byType, exportedAt }` 요약을 출력한다. 형식이 잘못된 export면(papers 배열 없음 / id·title 누락) 에러로 끝나니, 그 경우 사용자에게 올바른 export 파일인지 확인한다.

3. **검증.** `node --check notes-snapshot.js`로 문법 확인.

4. **변경 확인.** `git status --short`와 `git --no-pager diff --stat`로 무엇이 바뀌는지 본다. 보통 `notes-snapshot.js` 한 파일만 바뀐다. 항목 수(이전 대비 증감)를 사용자에게 한 줄로 요약한다.

5. **commit + push.** GitHub Pages는 **deploy 브랜치(기본 `main`)에 push되어야 재배포**된다. 이 skill은 그 배포가 목적이므로 현재 브랜치(`main`)에 바로 commit/push 한다. 단, **4번 요약을 보여주고 사용자 확인을 받은 뒤** 실행한다.

   ```bash
   git add notes-snapshot.js
   git commit -m "Sync notes from deployed site (<N> items, exported <exportedAt>)"
   git push
   ```

   커밋 메시지 끝에 한 줄 비워두고:
   `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

6. **보고.** push 결과와, 잠시 후 GitHub Pages에 반영된다는 점을 알린다.

## 주의

- 이 skill은 **라이브 사이트 → repo** 단방향이다. push 후 회원님의 **기존 브라우저는 localStorage가 우선**이라 자동으로 안 바뀐다(이미 최신이라 보통 문제없음). 다른 기기/새 브라우저는 새 스냅샷을 fresh load로 받는다. 기존 브라우저를 강제로 맞추려면 사이트의 **"데이터 가져오기"**로 같은 JSON을 다시 불러오면 된다.
- 스냅샷이 채워지면 fresh load의 source of truth는 `notes-snapshot.js`다. 즉 `add_note`/직접 편집으로 `catalog.js`·`paper-notes-data.js`를 고쳐도 **스냅샷이 비어있지 않은 한 fresh load엔 안 보인다**. 라이브 사이트에서 추가·수정한 뒤 이 skill로 sync 하는 흐름을 기본으로 삼는 게 일관적이다. (seed 파일은 스냅샷이 비었을 때의 폴백/초기값으로만 남는다.)
- commit/push는 4번 요약을 보여주고 확인받은 뒤에만. 사용자가 "보기만" 원하면 5번을 건너뛴다.
