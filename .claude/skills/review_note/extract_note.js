#!/usr/bin/env node
// Usage: node extract_note.js "<note title>" [outFile]
// Locates a note by title (exact, then fuzzy) across paper-notes-data.js and
// study-notes-data.js, prints a JSON header (matched key, source, catalog
// metadata) to stdout, and writes the raw note body to outFile (default:
// ./_review_note.md) so it can be Read with pagination.

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

const paperNotes = load("paper-notes-data.js", "importedPaperNotes") || {};
const studyNotes = load("study-notes-data.js", "importedStudyNotes") || {};
const catalog = load("catalog.js", "curatedPaperCatalog") || [];

function find(notes) {
  if (notes[title]) return title;
  const t = norm(title);
  return Object.keys(notes).find(
    (k) => norm(k) === t || norm(k).includes(t) || t.includes(norm(k))
  );
}

let source = "paper";
let key = find(paperNotes);
let note = key && paperNotes[key];
if (!key) {
  source = "study";
  key = find(studyNotes);
  note = key && studyNotes[key];
}

if (!key) {
  console.log(JSON.stringify({ found: false, query: title }, null, 2));
  process.exit(1);
}

const meta =
  catalog.find((p) => p.title === key) ||
  catalog.find((p) => norm(p.title) === norm(key));

fs.writeFileSync(outFile, note.note || "");

console.log(
  JSON.stringify(
    {
      found: true,
      source,
      key,
      status: note.status,
      noteLength: (note.note || "").length,
      noteFile: outFile,
      catalog: meta
        ? { authors: meta.authors, year: meta.year, venue: meta.venue, doi: meta.doi, url: meta.url }
        : null,
    },
    null,
    2
  )
);
