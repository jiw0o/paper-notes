#!/usr/bin/env node
// Usage: node write_note.js "<note title>" <markdownFile> [--status <status>]
// Writes the (already house-style-formatted) Markdown in <markdownFile> into the
// matching note's `note` field. Locates the note the same way review_note's
// extract_note.js does: prefers notes-snapshot.js (the live source of truth once
// synced); falls back to the seed files (paper-notes-data.js /
// study-notes-data.js) when the snapshot is empty or doesn't contain the title.
//
// All three data files are plain `const <var> = <JSON.stringify(obj, null, 2)>;`
// (verified byte-for-byte), so we load the object, mutate just the one note (and
// optionally its status), and re-serialize the whole object while preserving the
// leading banner comment. That yields a minimal diff (only the changed note) and
// matches the exact formatting sync_to_repo/the seed exports already use.
//
// Prints a JSON summary to stdout (origin, source, key, file, oldLen, newLen).

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readFile(file) {
  const full = path.join(ROOT, file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : undefined;
}

function loadVar(file, varName) {
  const src = readFile(file);
  if (src === undefined) return undefined;
  const shimmed = src.replace("const " + varName, "global." + varName);
  eval(shimmed); // files are static, repo-owned data declarations
  return global[varName];
}

// Everything before `const <var>` is the banner comment we must preserve.
function banner(file, varName) {
  const src = readFile(file);
  const idx = src.indexOf("const " + varName);
  return idx > 0 ? src.slice(0, idx) : "";
}

function writeVar(file, varName, obj) {
  const out = banner(file, varName) + "const " + varName + " = " + JSON.stringify(obj, null, 2) + ";\n";
  fs.writeFileSync(path.join(ROOT, file), out);
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");

// --- args ---
const args = process.argv.slice(2);
let status = null;
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--status") {
    status = args[++i];
  } else {
    positional.push(args[i]);
  }
}
const title = positional[0];
const mdFile = positional[1];
if (!title || !mdFile) {
  console.error('usage: node write_note.js "<note title>" <markdownFile> [--status <status>]');
  process.exit(2);
}
if (!fs.existsSync(mdFile)) {
  console.error("markdown file not found: " + mdFile);
  process.exit(2);
}
const content = fs.readFileSync(mdFile, "utf8");

const t = norm(title);
const fuzzy = (k) => norm(k) === t || norm(k).includes(t) || t.includes(norm(k));

let result = null;

// 1) Prefer the live snapshot (source of truth once synced).
const snapshot = loadVar("notes-snapshot.js", "notesSnapshot");
const snapPapers = Array.isArray(snapshot && snapshot.papers) ? snapshot.papers : [];
if (snapPapers.length) {
  const hit =
    snapPapers.find((p) => p.title === title) || snapPapers.find((p) => fuzzy(p.title));
  if (hit) {
    const oldLen = (hit.note || "").length;
    hit.note = content;
    if (status) hit.status = status;
    writeVar("notes-snapshot.js", "notesSnapshot", snapshot);
    result = {
      origin: "snapshot",
      source: hit.type === "topic" ? "study" : "paper",
      key: hit.title,
      file: "notes-snapshot.js",
      status: hit.status,
      oldLen,
      newLen: content.length,
    };
  }
}

// 2) Fall back to the seed files.
if (!result) {
  const seeds = [
    { file: "paper-notes-data.js", varName: "importedPaperNotes", source: "paper" },
    { file: "study-notes-data.js", varName: "importedStudyNotes", source: "study" },
  ];
  for (const s of seeds) {
    const notes = loadVar(s.file, s.varName);
    if (!notes) continue;
    const key = notes[title] ? title : Object.keys(notes).find((k) => fuzzy(k));
    if (!key) continue;
    const entry = notes[key];
    const oldLen = (entry.note || "").length;
    entry.note = content;
    if (status) entry.status = status;
    writeVar(s.file, s.varName, notes);
    result = {
      origin: "seed",
      source: s.source,
      key,
      file: s.file,
      status: entry.status,
      oldLen,
      newLen: content.length,
    };
    break;
  }
}

if (!result) {
  console.log(JSON.stringify({ written: false, query: title }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(Object.assign({ written: true }, result), null, 2));
