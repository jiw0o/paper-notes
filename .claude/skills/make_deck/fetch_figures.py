#!/usr/bin/env python3
"""Download figures from a paper's arXiv HTML rendering.

Usage:
    python3 fetch_figures.py <arxiv_id_or_url> <out_dir>

Best-effort figure grabber for the `make_deck` skill. Papers on arXiv usually
have an HTML rendering at https://arxiv.org/html/<id> (native) or, as a
fallback, https://ar5iv.labs.arxiv.org/html/<id>. Both wrap figures in
<figure><img ...><figcaption>...</figcaption></figure>. We parse those, download
each <img> into <out_dir>/, and write <out_dir>/figures.md indexing every image
with its caption and source URL.

stdlib only (no pip). Prints a short JSON summary to stdout. Never fabricates a
figure: if nothing is found it says so and exits 0 so the skill can fall back to
diagram specs.
"""
import html
import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin

UA = "Mozilla/5.0 (compatible; paper-notes-make_deck/1.0)"


def arxiv_id(raw):
    raw = raw.strip()
    m = re.search(r"(\d{4}\.\d{4,5})(v\d+)?", raw)
    if m:
        return m.group(1) + (m.group(2) or "")
    # old-style ids like hep-th/9901001
    m = re.search(r"([a-z\-]+/\d{7})(v\d+)?", raw)
    if m:
        return m.group(1) + (m.group(2) or "")
    return raw


class FigureParser(HTMLParser):
    """Collect (img_src, caption) pairs, preferring <figure> context."""

    def __init__(self):
        super().__init__()
        self.figures = []          # list of dict(src, caption)
        self._fig_depth = 0
        self._cur = None
        self._in_caption = False
        self._caption_buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "figure":
            self._fig_depth += 1
            self._cur = {"src": None, "caption": ""}
        elif tag == "img":
            src = a.get("src") or a.get("data-src")
            if not src:
                return
            if self._fig_depth and self._cur is not None:
                # keep the first (usually only) img of the figure
                if not self._cur["src"]:
                    self._cur["src"] = src
            else:
                # standalone img — still capture, alt as caption
                self.figures.append({"src": src, "caption": a.get("alt", "").strip()})
        elif tag == "figcaption":
            self._in_caption = True
            self._caption_buf = []

    def handle_endtag(self, tag):
        if tag == "figcaption":
            self._in_caption = False
            if self._cur is not None:
                self._cur["caption"] = html.unescape(" ".join(self._caption_buf)).strip()
        elif tag == "figure":
            self._fig_depth = max(0, self._fig_depth - 1)
            if self._cur and self._cur.get("src"):
                self.figures.append(self._cur)
            self._cur = None

    def handle_data(self, data):
        if self._in_caption:
            self._caption_buf.append(data.strip())


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read(), r.geturl()


def try_source(base_url, out_dir):
    try:
        raw, final_url = fetch(base_url)
    except Exception as e:
        return None, f"{base_url} -> {e}"
    parser = FigureParser()
    try:
        parser.feed(raw.decode("utf-8", "replace"))
    except Exception as e:
        return None, f"parse {base_url} -> {e}"
    if not parser.figures:
        return None, f"{base_url} -> no <figure> images found"
    return (parser.figures, final_url), None


def main():
    if len(sys.argv) < 3:
        print("usage: fetch_figures.py <arxiv_id_or_url> <out_dir>", file=sys.stderr)
        return 2
    aid = arxiv_id(sys.argv[1])
    out_dir = sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)

    candidates = [
        f"https://arxiv.org/html/{aid}",
        f"https://ar5iv.labs.arxiv.org/html/{aid}",
        f"https://ar5iv.org/abs/{aid}",
    ]
    errors = []
    found = None
    for url in candidates:
        result, err = try_source(url, out_dir)
        if result:
            found = result
            break
        errors.append(err)

    if not found:
        print(json.dumps({
            "arxiv_id": aid, "downloaded": 0, "figures": [],
            "note": "No HTML rendering with figures found. Fall back to diagram specs "
                    "or ask the user to supply figures.",
            "tried": errors,
        }, ensure_ascii=False, indent=2))
        return 0

    figures, base = found
    index = []
    downloaded = 0
    for i, fig in enumerate(figures, 1):
        src = urljoin(base if base.endswith("/") else base + "/", fig["src"])
        ext = os.path.splitext(src.split("?")[0])[1].lower() or ".png"
        if ext not in (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"):
            ext = ".png"
        fname = f"fig{i:02d}{ext}"
        dest = os.path.join(out_dir, fname)
        try:
            data, _ = fetch(src)
            with open(dest, "wb") as f:
                f.write(data)
            downloaded += 1
            index.append({"file": fname, "caption": fig["caption"], "source": src})
        except Exception as e:
            index.append({"file": None, "caption": fig["caption"], "source": src, "error": str(e)})

    # write a human-readable index the brief can reference
    lines = [f"# Figures for {aid}", "", f"Source: {base}", ""]
    for item in index:
        if item.get("file"):
            lines.append(f"## {item['file']}")
            lines.append(f"- caption: {item['caption'] or '(none)'}")
            lines.append(f"- source: {item['source']}")
        else:
            lines.append(f"## (download failed)")
            lines.append(f"- caption: {item['caption'] or '(none)'}")
            lines.append(f"- source: {item['source']}")
            lines.append(f"- error: {item.get('error')}")
        lines.append("")
    with open(os.path.join(out_dir, "figures.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(json.dumps({
        "arxiv_id": aid, "source": base, "downloaded": downloaded,
        "figures": index,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
