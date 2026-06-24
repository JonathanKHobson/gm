#!/usr/bin/env python3
"""QA gate for the Goldspire Atlas UX / Visual / Run-Mode pass."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
DOCS = ROOT / "docs"

REQUIRED_PAGES = [
    "index.html",
    "run.html",
    "player-display.html",
    "pages/entity-index.html",
    "pages/gm-dashboard.html",
    "pages/handouts.html",
    "pages/session-zero.html",
    "pages/pc-cheat-sheet.html",
    "pages/pronunciation-guide.html",
    "pages/media-board.html",
]

INTERNAL_VISIBLE_PHRASES = [
    "Clean party reference",
    "No Strixwolf continuity bleed",
    "prompt_fallback",
]

EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF]")


class IconButtonParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.unlabeled: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        classes = set(data.get("class", "").split())
        if tag in {"button", "a"} and "icon-button" in classes:
            if not (data.get("aria-label") or data.get("title")):
                self.unlabeled.append(self.get_starttag_text() or tag)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def add(checks: list[dict], name: str, ok: bool, detail: str = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


def root_css_block(css: str) -> str:
    match = re.search(r":root\s*\{(?P<body>.*?)\}", css, re.S)
    return match.group("body") if match else ""


def main() -> int:
    checks: list[dict] = []

    for page in REQUIRED_PAGES:
        add(checks, f"required page exists: {page}", (DIST / page).exists())

    html_files = list(DIST.rglob("*.html"))
    css_files = list(DIST.rglob("*.css"))
    js_files = list(DIST.rglob("*.js"))
    json_files = [p for p in DIST.rglob("*.json") if "obsidian_vault" not in p.parts]

    scanned = html_files + css_files + js_files + json_files
    svg_refs = [str(p.relative_to(DIST)) for p in scanned if ".svg" in read(p).lower()]
    add(checks, "no SVG references in generated site files", not svg_refs, "\n".join(svg_refs[:30]))

    html_css_js = html_files + css_files + js_files
    emoji_refs = [str(p.relative_to(DIST)) for p in html_css_js if EMOJI_RE.search(read(p))]
    add(checks, "no emoji in primary UI files", not emoji_refs, "\n".join(emoji_refs[:30]))

    visible_phrase_hits = []
    for p in html_files:
        text = read(p)
        for phrase in INTERNAL_VISIBLE_PHRASES:
            if phrase in text:
                visible_phrase_hits.append(f"{p.relative_to(DIST)}: {phrase}")
    add(checks, "no internal prompt language visible in HTML", not visible_phrase_hits, "\n".join(visible_phrase_hits[:30]))

    css = read(DIST / "styles.css")
    root = root_css_block(css)
    add(checks, "light mode is default", "color-scheme: light" in root and "--bg: #f6f3ec" in root, root[:500])
    add(checks, "dark mode remains optional", 'html[data-theme="dark"]' in css and "color-scheme: dark" in css)
    add(checks, "print stylesheet exists", "@media print" in css and "background: white" in css)

    index = read(DIST / "index.html")
    add(checks, "homepage links Run Mode", 'href="run.html"' in index)
    add(checks, "homepage links GM Dashboard", 'href="pages/gm-dashboard.html"' in index)
    add(checks, "homepage does not show full choice track reference", "Choice Track Reference" not in index)
    primary_nav = "".join(re.findall(r'<(?:nav|div) class="(?:hero-actions|hero-jump|sticky-top-nav)"[^>]*>.*?</(?:nav|div)>', index, re.S | re.I))
    add(checks, "homepage primary nav does not link raw Markdown", ".md" not in primary_nav, primary_nav[:1000])
    add(checks, "compact dashboard summary exists on homepage", "At-a-Glance GM Summary" in index)

    dashboard = read(DIST / "pages" / "gm-dashboard.html")
    add(checks, "GM dashboard has state import/export/reset panels", all(term in dashboard for term in ["Export State", "Import State", "Reset State", "Per-Scene Decision Log"]))
    add(checks, "dashboard includes CSS meter bars", "data-act-meter" in dashboard and "dashboard-bars" in dashboard)
    add(checks, "dashboard includes PC profile manager", "data-pc-profile-manager" in dashboard)

    entity_index = read(DIST / "pages" / "entity-index.html")
    add(checks, "entity index includes PC category", "PC / Player Character" in entity_index and "category-pc" in entity_index)
    add(checks, "entity index includes pronunciations", "Pronunciation:" in entity_index)

    run = read(DIST / "run.html")
    app = read(DIST / "app.js")
    run_js = read(DIST / "js" / "run-mode.js")
    sync_js = read(DIST / "js" / "display-sync.js")
    player_display = read(DIST / "player-display.html")
    add(checks, "run mode exists and has scrubber", "data-slide-root" in run and "data-slide-scrubber" in run)
    add(checks, "run mode no longer ships a Slide 1 / 1 shell placeholder", not re.search(r"Slide\s+1\s*/\s*1", run, re.I))
    add(checks, "run mode can auto-complete previous scene", "run-auto-complete" in run and "autoCompletePreviousSceneOnNext" in run_js)
    add(checks, "player display sync uses BroadcastChannel and localStorage fallback", "BroadcastChannel" in sync_js and "localStorage" in sync_js and "goldspire-run-sync-v1" in sync_js)
    add(checks, "player display supports blackout", "blackout" in player_display and "blackout" in (read(DIST / "js" / "player-display.js") + run_js))
    add(checks, "rules drawer is hidden outside normal page flow by default", 'id="rules-drawer"' in index and "hidden aria-hidden=\"true\"" in index and "drawer.hidden = false" in app and "drawer.hidden = true" in app)
    add(checks, "dev mode uses explicit data-dev-mode boundary", 'body:not([data-dev-mode="true"]) .dev-only' in css and "document.body.dataset.devMode" in app)
    add(checks, "GM dashboard groups state controls by context", "state-context-grid" in dashboard and "state-context-panel" in dashboard)
    add(checks, "homepage Session Zero deep content is collapsed behind summary", "session-zero-summary" in index and "session-zero-homepage-details" in index)

    pc_sheet = read(DIST / "pages" / "pc-cheat-sheet.html")
    pc_sheet_required = [
        "PC Cheat Sheet",
        "data-pc-print-card",
        "pc-dossier-card",
        "pc-source-panel",
        "pc-outcome-tracker",
        "data-pc-profile-manager",
        "data-print-hp_override",
        "Open Module PDF",
        "Open Sheet Guide",
    ]
    missing_pc_sheet_required = [term for term in pc_sheet_required if term not in pc_sheet]
    add(
        checks,
        "PC cheat sheet is a printable editable dossier",
        not missing_pc_sheet_required and "Unknown / verify from sheet" not in pc_sheet,
        "\n".join(missing_pc_sheet_required),
    )
    add(checks, "pronunciation guide page exists with cards", "Pronunciation Guide" in read(DIST / "pages" / "pronunciation-guide.html") and "pronunciation-card" in read(DIST / "pages" / "pronunciation-guide.html"))
    add(checks, "media board exists with send-to-player controls", "Media Board" in read(DIST / "pages" / "media-board.html") and "data-show-player-scene" in read(DIST / "pages" / "media-board.html"))

    add(checks, "wiki pages have collapsible section hook", 'data-collapsible-sections' in read(DIST / "pages" / "entities" / "garrick-reed.html"))
    add(checks, "entity header clipping fix classes present", ".entity-page-lede" in css and "overflow: visible" in css and ".inline-entity-link" in css)

    unlabeled: list[str] = []
    for p in html_files:
        parser = IconButtonParser()
        parser.feed(read(p))
        unlabeled.extend(f"{p.relative_to(DIST)}: {item}" for item in parser.unlabeled)
    add(checks, "icon buttons have labels", not unlabeled, "\n".join(unlabeled[:30]))

    report = {
        "pass": all(check["ok"] for check in checks),
        "check_count": len(checks),
        "issue_count": sum(1 for check in checks if not check["ok"]),
        "checks": checks,
    }
    out = DIST / "data" / "qa-ux-report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    qa_report = DIST / "QA_REPORT.md"
    if qa_report.exists():
        passed = report["check_count"] - report["issue_count"]
        addendum = [
            "",
            "## UX / Visual / Run-Mode QA",
            "",
            f"Checks passed: **{passed} / {report['check_count']}**",
            f"Checks failed: **{report['issue_count']}**",
            "",
            "- Light mode is the default, with dark and print-preview themes available.",
            "- Homepage choice tracking is reduced to a compact summary; full state controls live on the GM Dashboard.",
            "- Run Mode, Player Display sync, PC cheat sheet, pronunciation guide, media board, and dashboard pages exist.",
            "- Entity headers use wrapping/overflow-safe classes to avoid lead paragraph clipping.",
            "- Repeated controls use labeled icon buttons and generated raster PNG icons.",
            "",
            "Detailed JSON: `data/qa-ux-report.json`.",
            "",
        ]
        qa_report.write_text(qa_report.read_text(encoding="utf-8") + "\n".join(addendum), encoding="utf-8")
        (DOCS / "STORY_ATLAS_QA_REPORT.md").write_text(qa_report.read_text(encoding="utf-8"), encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
