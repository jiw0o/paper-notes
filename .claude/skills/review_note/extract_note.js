#!/usr/bin/env node
// Usage: node extract_note.js "<note title>" [outFile]
// Locates a note by title (exact, then fuzzy). Prefers notes-snapshot.js (the
// live source of truth once synced); falls back to the seed files
// (paper-notes-data.js / study-notes-data.js + catalog.js) when the snapshot is
// empty or doesn't contain the title. Prints a JSON header (matched key, source,
// catalog metadata, origin) to stdout, and writes the raw note body to outFile
// (default: ./_review_note.md) so it can be Read with pagination.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
function load(file, varName) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return undefined;
  let src = fs.readFileSync(full, "utf8").replace("const " + varName, "global." + varName);
  eval(src); // files are static, repo-owned data declarations
  return global[varName];
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

const title = process.argv[2];
const outFile = process.argv[3] || path.join(ROOT, "_review_note.md");
if (!title) {
  console.error("usage: node extract_note.js \"<note title>\" [outFile]");
  process.exit(2);
}

const t = norm(title);
const fuzzy = (k) => norm(k) === t || norm(k).includes(t) || t.includes(norm(k));

let result = null;

// 1) Prefer the live snapshot (source of truth once synced).
const snapshot = load("notes-snapshot.js", "notesSnapshot");
const snapPapers = Array.isArray(snapshot && snapshot.papers) ? snapshot.papers : [];
if (snapPapers.length) {
  const hit =
    snapPapers.find((p) => p.title === title) || snapPapers.find((p) => fuzzy(p.title));
  if (hit) {
    result = {
      origin: "snapshot",
      source: hit.type === "topic" ? "study" : "paper",
      key: hit.title,
      status: hit.status,
      note: hit.note || "",
      meta: { authors: hit.authors, year: hit.year, venue: hit.venue, doi: hit.doi, url: hit.url },
    };
  }
}

// 2) Fall back to the seed files (e.g. a paper just added via add_note that is
//    not in the snapshot yet).
if (!result) {
  const paperNotes = load("paper-notes-data.js", "importedPaperNotes") || {};
  const studyNotes = load("study-notes-data.js", "importedStudyNotes") || {};
  const catalog = load("catalog.js", "curatedPaperCatalog") || [];
  const findKey = (notes) =>
    notes[title] ? title : Object.keys(notes).find((k) => fuzzy(k));

  let source = "paper";
  let key = findKey(paperNotes);
  let note = key && paperNotes[key];
  if (!key) {
    source = "study";
    key = findKey(studyNotes);
    note = key && studyNotes[key];
  }
  if (key) {
    const meta =
      catalog.find((p) => p.title === key) || catalog.find((p) => norm(p.title) === norm(key));
    result = {
      origin: "seed",
      source,
      key,
      status: note.status,
      note: note.note || "",
      meta: meta
        ? { authors: meta.authors, year: meta.year, venue: meta.venue, doi: meta.doi, url: meta.url }
        : null,
    };
  }
}

if (!result) {
  console.log(JSON.stringify({ found: false, query: title }, null, 2));
  process.exit(1);
}

fs.writeFileSync(outFile, result.note);

console.log(
  JSON.stringify(
    {
      found: true,
      origin: result.origin,
      source: result.source,
      key: result.key,
      status: result.status,
      noteLength: result.note.length,
      noteFile: outFile,
      catalog: result.meta,
    },
    null,
    2
  )
);
