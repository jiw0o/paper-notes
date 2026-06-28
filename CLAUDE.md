# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal, single-user web app for keeping research **paper notes** and **study-topic notes**, with `[[wiki-link]]` cross-references and backlinks. It is a **static site with no build step and no backend** (vanilla JS + a MathJax CDN), deployed via GitHub Pages. The UI is in Korean.

## Running & validating

There is no package.json, bundler, test runner, or lint config. "Building" means editing the files directly.

```bash
python3 -m http.server 8080      # serve locally, then open http://localhost:8080
node --check app.js              # syntax-check a JS file before committing (no real test suite)
```

The data files (`catalog.js`, `paper-notes-data.js`, `study-notes-data.js`, `notes-snapshot.js`) are plain JS that assign globals; `node --check <file>` is the only correctness gate available after editing them. Always run it after touching a data file — a single stray quote/comma silently breaks the whole app.

Deployment = push to `main`; GitHub Pages serves the repo root (`.nojekyll` is present so `assets/` is served as-is).

## Data flow — the key thing to understand

In the browser, the source of truth is **`localStorage`** (key `margin-paper-notes-v1`). The repo's `.js` data files are only *seeds* used to populate that store on first load. The whole non-obvious part of this codebase is `loadPapers()` in `app.js`, which reconciles these layers.

**Two seeding paths**, decided in `loadPapers()`:

1. **Snapshot path (current/primary).** `notes-snapshot.js` defines `notesSnapshot = { version, exportedAt, papers: [...] }`. When `papers` is non-empty, a fresh load uses it directly as the complete, lossless state (note + status + collection + tags + abstract + favorite + all metadata), and marks every seed step "applied" so the curated seeds below are skipped entirely.
2. **Curated-seed path (fallback, when the snapshot is empty).** State is assembled from three files:
   - `catalog.js` → `curatedPaperCatalog`: array of paper **metadata**. Categories are an explicit per-paper `categories` array (set manually or via the in-app edit dialog), **not** inferred — `buildCuratedCatalog` uses `categories[0]` as the primary (`collection`) and the rest as secondary tags. Status defaults to `done`.
   - `paper-notes-data.js` → `importedPaperNotes`: object keyed by paper **title** → `{ note, status }`. Joined to catalog entries **by exact title match**.
   - `study-notes-data.js` → `importedStudyNotes`: object keyed by topic **title** → `{ category, note }`. Topic stubs come from `buildStudyTopics()`; notes are merged in by fuzzy-normalized title (`normalizeStudyTitle`).
   - `seedPapers` (top of `app.js`) seeds the three demo papers.

Each merge step is gated by a versioned `localStorage` flag (`CATALOG_VERSION_KEY`, `TOPIC_CATALOG_KEY`, `STUDY_CONTENT_KEY`, `PAPER_CONTENT_KEY`). **Bumping the version suffix on one of these keys is how you force that seed step to re-run** for existing visitors; otherwise edits to seed files never reach a browser that already has the flag set.

**Consequence:** once the snapshot is populated, editing `catalog.js` / `paper-notes-data.js` does **not** show up on a fresh load — the snapshot wins. The intended workflow is: edit on the live site → export JSON → regenerate the snapshot (see `sync_to_repo`). Seed files remain only as the empty-snapshot fallback.

### Items: papers vs. topics
Every item lives in one flat `papers` array. A study-topic item has `type === "topic"` (see `isTopic()`); papers have no `type`. This distinction drives the Library vs. Study Notes views, which template/abstract is used, and several render branches.

## app.js structure

Single ~1500-line file, no modules. Notable areas:
- **Custom Markdown renderer** (`renderNotePreview` and helpers, ~line 579): headings, lists, bold, code blocks, image embeds, `$…$`/`$$…$$` math, and `[[title]]` wiki-links rendered as in-app links. MathJax (v4 CDN) typesets math via a queued `scheduleMathTypeset` (debounced, with retry).
- **Backlinks** (`renderBacklinks`): computed by scanning every note for `[[this title]]`.
- **Persistence** (`persist`): debounced write of the full `papers` array back to `localStorage`. `exportData` produces the JSON the sync workflow consumes.
- Views (home / library / topics / favorites / reader) are sections in `index.html` toggled by JS; no router beyond a `#paper=<id>` hash.

## Skills (`.claude/skills/`) — the maintenance workflow

These encode the canonical ways to change content; prefer them over ad-hoc edits.

- **`add_note`** — given a paper URL, fetch metadata and add a *blank* note: a metadata entry in `catalog.js` (`curatedPaperCatalog`) **and** a matching `"<title>": { "note": "", "status": "not-yet" }` in `paper-notes-data.js`. The two title strings must be **byte-for-byte identical**. Never auto-fill the note body.
- **`review_note`** — proofread one note (typos, fidelity to the source paper, formatting). Report only; edit only if asked.
- **`sync_to_repo`** — the live-site → repo direction. Takes the app's "데이터 내보내기" JSON export and runs `node .claude/skills/sync_to_repo/build_snapshot.js <export.json>` to regenerate `notes-snapshot.js`, then commits/pushes to `main` (after showing a diff summary and getting confirmation). This is the only path that captures notes edited on the deployed site, since they live in that browser's `localStorage`.

## Conventions

- **Data files use double-quoted JSON-style literals** even though they're JS. Match the surrounding style; trailing commas are tolerated but existing code separates items with commas.
- Image embeds in notes use URL-encoded relative paths, e.g. `![image](./assets/study-notes/image%208.png)`; assets live in `assets/papers/` and `assets/study-notes/`.
- Commit/push only when the user explicitly asks (except `sync_to_repo`, whose whole purpose is to deploy — it still confirms first).
