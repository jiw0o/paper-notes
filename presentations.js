// Seed registry of presentation decks generated for notes.
//
// Keyed by an item's `id` (preferred, e.g. "paper-02") or its exact `title`.
// Each entry points at a self-contained slide deck that is served statically
// from this repo (GitHub Pages), e.g. "presentations/<id>/index.html".
//
// app.js merges these onto the matching item's `presentation` field via
// applyPresentations() — see loadPapers(). Because `presentation` is a plain
// field on the paper object, it round-trips losslessly through the app's
// "데이터 내보내기" export and into notes-snapshot.js, so once a deck is synced
// the snapshot carries it and this seed becomes a no-op for that item.
//
// To force this step to re-run for browsers that already loaded the app, bump
// the suffix on PRESENTATION_CATALOG_KEY in app.js (same pattern as the other
// seed steps).
//
// Entry shape:
//   "<id-or-title>": {
//     path: "presentations/<id>/index.html", // relative to the repo root
//     title: "발표 제목",                      // optional; defaults to the note title
//     updatedAt: "2026-07-04"                 // optional ISO date
//   }
const presentationCatalog = {
 // Keyed by exact title (this note isn't in notes-snapshot.js yet, so its
 // index-based id can shift; matching by title is stable).
 "Real-Time Execution of Action Chunking Flow Policies": {
   path: "presentations/paper-31/index.html",
   title: "Real-Time Chunking (RTC) — NeurIPS 2025",
   updatedAt: "2026-07-05"
 },
 "Training-Time Action Conditioning for Efficient Real-Time Chunking": {
   path: "presentations/paper-arxiv-2512-05964/index.html",
   title: "Training-Time Action Conditioning (RTC) — Preprint 2025",
   updatedAt: "2026-07-07"
 }
};


