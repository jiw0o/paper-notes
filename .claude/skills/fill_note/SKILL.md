---
name: fill_note
description: Take a note title plus raw/rough content the user dumps, reformat that content into this repo's house note style (Korean prose + English technical terms, nested bullets, ⇒/: notation, $math$, [[wiki-links]]), and write it into the matching note's body in the data files. Use when the user gives a note title and some content and wants it filled in / formatted to match the existing notes.
---

# fill_note

노트 **제목**과 **추가할 내용(러프한 메모/덤프)**을 받아서, 그 내용을 이 repo의 **노트 작성 양식**에 맞게 재구성한 뒤 해당 노트의 `note` 본문에 **직접 써넣는** skill.

핵심은 "내용 자체를 새로 만드는 것"이 아니라, 사용자가 준 내용을 **기존 노트들과 똑같은 양식으로 정리**하는 것이다. 사용자가 주지 않은 사실을 지어내지 않는다.

## 입력

- 노트 **제목** 1개 (부분/약칭 가능 — 퍼지 매칭으로 찾는다. 예: `UniVLA`).
- 노트에 **추가/작성할 내용** (한글/영문 섞인 러프한 메모, 불릿 덤프, 문단 등 무엇이든).
- 둘 중 하나라도 없으면 사용자에게 물어본다.

## 데이터 위치 (배경)

`review_note`와 동일하다. 노트 본문의 **source of truth는 `notes-snapshot.js`**(라이브 사이트에서 export→sync된 최신 상태). 스냅샷에 없는(예: `add_note`로 막 추가한) 노트는 seed 파일(`paper-notes-data.js`/`study-notes-data.js`)에 있다. 세 파일 모두 `const <var> = JSON.stringify(obj, null, 2);` 형태라 헬퍼가 안전하게 노트 하나만 바꿔 다시 직렬화한다.

> ⚠️ **sync 덮어쓰기 주의:** `origin:"snapshot"`인 노트를 여기서 고치면, 그 변경은 repo에만 있고 라이브 사이트 localStorage에는 없다. 다음에 사용자가 사이트에서 export→`sync_to_repo` 하면 **이 변경이 되돌아간다.** 그래서 작성 후 보고에서, 이 내용을 라이브 사이트 노트에도 붙여넣어 두라고(또는 사이트에서 직접 작성하라고) 안내한다. seed(`origin:"seed"`)면 아직 스냅샷에 없는 새 노트라 이 문제가 없다.

## 절차

1. **노트 찾기 & 기존 본문 확인.** repo 루트에서 `review_note`의 추출 헬퍼로 현재 본문과 위치를 확인한다(덮어쓰기 전 기존 내용을 반드시 본다):

   ```bash
   node .claude/skills/review_note/extract_note.js "<제목>" <scratchpad>/_cur.md
   ```

   stdout JSON에서 `found`, `origin`(snapshot/seed), `source`(paper/study), `key`(정확한 제목)를 얻고, `_cur.md`를 Read로 읽는다. `found:false`면 비슷한 제목을 grep으로 찾아 사용자에게 확인한다.
   - **기존 본문이 비어 있으면**: 사용자가 준 내용을 양식에 맞춰 처음부터 작성한다.
   - **기존 본문이 있으면**: 기본은 **이어붙이기(append)** 다 — 기존 내용을 보존하고 새 내용을 양식에 맞춰 적절한 섹션에 통합한다. 기존 내용을 크게 재구성/대체해야 할 것 같으면 **먼저 사용자에게 확인**한다(덮어쓰면 손실되므로).

2. **내용을 양식에 맞게 재구성.** 아래 "작성 양식" 규칙대로 사용자가 준 내용을 정리한다. 내용을 추가·창작하지 말고, 표현·구조·표기만 양식에 맞춘다. 불명확하거나 원문 확인이 필요한 부분은 임의로 채우지 말고 그대로 두거나 사용자에게 묻는다.

3. **결과를 파일로 저장.** 완성한 Markdown을 scratchpad에 쓴다:

   ```
   <scratchpad>/_filled.md
   ```

4. **노트에 써넣기.** 헬퍼로 해당 노트 본문에 기록한다(파일 위치는 헬퍼가 origin을 따라 자동 판단):

   ```bash
   node .claude/skills/fill_note/write_note.js "<key>" <scratchpad>/_filled.md
   ```

   상태를 같이 바꾸려면 `--status done`(또는 `in-progress` 등)을 덧붙인다. 빈 stub을 처음 채우는 경우, 사용자가 원하면 `--status` 로 상태를 올려준다(기본은 기존 상태 유지). stdout JSON의 `written:true`, `file`, `oldLen`/`newLen`을 확인한다.

5. **검증.** 기록한 파일을 문법 체크한다:

   ```bash
   node --check <헬퍼가 보고한 file>   # notes-snapshot.js | paper-notes-data.js | study-notes-data.js
   ```

6. **보고.** 어느 파일(origin)·어느 노트에 썼는지, 길이 변화(oldLen→newLen)를 한 줄로 요약하고, 완성된 Markdown을 코드블록으로 보여줘 사용자가 검토하게 한다. `origin:"snapshot"`이면 위 "sync 덮어쓰기 주의"를 덧붙인다.

## 작성 양식 (house style) — 가장 중요

기존 노트(예: UniVLA, CAIMAN, Being-H0.5)에서 추출한 규칙. 새 내용을 이 모양으로 맞춘다.

### 문서 구조

- **최상위 섹션은 `#` heading.** 첫 섹션은 보통 `# Overview` 또는 `# Overview & Contribution`. 그 뒤로 내용에 따라: `# Background` / `# Problem` / `# Method` / `# Preliminaries` / `# Experiments`(하위에 `## Setup`) / `# Summarize` 등.
- **최상위 섹션 사이에는 `---`(수평선)** 을 넣어 구분한다.
- 방법론의 각 구성요소는 `##`, 그 하위는 `###`로 단계화한다. heading 단계를 건너뛰지 않는다.
- `# Overview & Contribution` 안에서 자주 쓰는 소항목(불릿): **Background / Problem / Objective / Key Idea / Challenge & Related Work / Contribution**. 내용이 그런 구조면 이 라벨을 활용한다(강제는 아님).

### 리스트 · 기호

- 본문 대부분은 **`-` 중첩 불릿**. 들여쓰기는 4칸. 열거(문제 N가지, 단계 N개, contribution 등)는 **`1.` `2.` 번호 리스트**.
- **`⇒`**: 그래서/결론/결과/도출을 나타낼 때. (예: `⇒ Task-Centric Latent Action을 추출`)
- **`:`**: 용어 정의. 보통 용어 불릿 아래 들여쓴 줄에서 `: 정의...` 형태. (예: `- CAI\n    : j-th entity의 ...`)
- **`→`**: 짧은 인라인 변환/귀결에 가끔 사용.
- 핵심 용어/아이디어는 **`**bold**`**. (예: `**Key Idea**`, `**Compressed Action Space**`)

### 언어 · 표기

- **한글 서술 + 영어 기술용어 그대로.** ML/로보틱스 전문용어(Latent Action, Embodiment, Action Space, Diffusion, Action Expert, Codebook, Reward 등)는 **번역하지 않고 영어로** 둔다. 설명·연결어만 한글.
- 모델/약어 표기는 일관되게(예: VLA, OpenVLA, π0/$\pi_0$, DINOv2). 기존 노트에서 쓰던 표기를 따른다.

### 수식 · 링크 · 이미지

- 수식은 KaTeX: 인라인 `$...$`, 디스플레이 `$$...$$`. 사용자가 일반 텍스트로 쓴 수식이라도 의미가 분명하면 `$...$`로 감싼다. 단, 불확실한 기호를 임의로 추가하지 않는다.
- 다른 노트 참조는 **`[[정확한 노트 제목]]`** 위키링크. 사용자가 "~ 참고", "[[...]]" 식으로 가리키면 위키링크로 만든다.
- 이미지 임베드: paper 노트는 `![image.png](./assets/papers/image%20N.png)`, study 노트는 `./assets/study-notes/...` (경로는 URL-encoded, 공백은 `%20`). 사용자가 이미지를 따로 주지 않으면 이미지 라인을 만들지 않는다(존재하지 않는 파일을 가리키지 않도록).

### 톤

- 간결한 개조식. 완결된 문장보다 **불릿 + 기호(⇒/:)** 중심. 기존 노트의 밀도/말투를 맞춘다.

## 주의

- **내용을 창작하지 않는다.** 사용자가 준 내용을 양식에 맞게 정리만 한다. 빠진 정보를 추측해 채우지 말 것(필요하면 묻는다).
- 기존 본문이 있으면 **덮어쓰기 전에** 확인한다(append가 기본). 헬퍼는 `note` 전체를 교체하므로, append하려면 4번에 넘기는 `_filled.md`에 **기존 본문 + 새 내용**을 합쳐 담아야 한다.
- 작성 후 반드시 `node --check`로 대상 파일을 검증한다.
- commit/push는 사용자가 명시적으로 요청할 때만 한다.
- 임시 파일(`_cur.md`, `_filled.md`)은 scratchpad에 둔다.
