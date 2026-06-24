#!/usr/bin/env python3
"""QA gate for concise story outline, storyboard, and narrative story pages."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
REPORT = DIST / "data" / "qa-story-modes-report.json"
QA_REPORT = DIST / "QA_REPORT.md"
DOCS_REPORT = ROOT / "docs" / "STORY_ATLAS_QA_REPORT.md"


REQUIRED_PAGES = [
    "pages/story-outline.html",
    "pages/storyboard.html",
    "pages/story.html",
    "css/story-modes.css",
    "js/story-modes.js",
    "data/story-modes.json",
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def read_json(path: Path) -> Any:
    return json.loads(read(path)) if path.exists() else None


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: Any = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail if isinstance(detail, str) else json.dumps(detail, indent=2)})


def main() -> int:
    checks: list[dict[str, Any]] = []
    for rel in REQUIRED_PAGES:
        add(checks, f"required story mode file exists: {rel}", (DIST / rel).exists(), rel)

    scenes = read_json(DIST / "data" / "scenes.json") or []
    outline = read(DIST / "pages" / "story-outline.html")
    storyboard = read(DIST / "pages" / "storyboard.html")
    story = read(DIST / "pages" / "story.html")
    css = read(DIST / "css" / "story-modes.css")
    js = read(DIST / "js" / "story-modes.js")
    app_js = read(DIST / "app.js")
    index = read(DIST / "index.html")
    outline_content = re.search(r'<main id="content">(.*?)</main>', outline, re.S)
    storyboard_content = re.search(r'<main id="content">(.*?)</main>', storyboard, re.S)
    story_content = re.search(r'<main id="content">(.*?)</main>', story, re.S)
    outline_body = outline_content.group(1) if outline_content else outline
    storyboard_body = storyboard_content.group(1) if storyboard_content else storyboard
    story_body = story_content.group(1) if story_content else story

    add(checks, "story outline names the hero", "Hero:" in outline_body and "Messengers" in outline_body and "player characters" in outline_body, "")
    add(checks, "story outline explains the antagonist", "Antagonist" in outline and "ward economy" in outline and "not a single boss" in outline, "")
    add(checks, "story outline includes hero journey labels", all(term in outline for term in ["Inciting Incident", "Threshold", "Ordeal", "Return / Hook"]), "")
    non_icon_outline_images = [tag for tag in re.findall(r"<img[^>]+>", outline_body, re.I) if "type-icon" not in tag]
    add(checks, "story outline has no content images beyond hidden link icons", not non_icon_outline_images, non_icon_outline_images[:5])
    add(checks, "story outline has search and section filter", "data-story-search" in outline and "data-story-act-filter" in outline, "")
    add(checks, "story outline has progressive disclosure", outline.count("<details") >= 8 and "data-expand-all" in outline, outline.count("<details"))
    add(checks, "story outline preserves wiki hover links", outline.count("entity-link") >= 12 and 'data-entity="' in outline, outline.count("entity-link"))

    missing_scene_links = []
    long_outline_paragraphs = []
    for scene in scenes:
        sid = scene.get("id")
        slug = scene.get("slug")
        if not sid:
            continue
        required = [f"../run.html?slide={sid}", f"../index.html#{sid}", f"scenes/{slug}.html"]
        if not all(item in outline for item in required):
            missing_scene_links.append(sid)
        pattern = re.compile(rf'<article class="story-scene-line"[^>]*>\s*<h3>{re.escape(sid)}.*?</article>', re.S)
        match = pattern.search(outline)
        if match:
            paragraphs = re.findall(r"<p>(.*?)</p>", match.group(0), re.S)
            for para in paragraphs:
                text = re.sub(r"<[^>]+>", "", para)
                if len(text) > 850:
                    long_outline_paragraphs.append(f"{sid}:{len(text)}")
    add(checks, "every scene has Run/Atlas/wiki links in story outline", not missing_scene_links, missing_scene_links[:20])
    add(checks, "outline scene paragraphs stay concise", not long_outline_paragraphs, long_outline_paragraphs[:20])

    add(checks, "storyboard has search and filter", "data-story-search" in storyboard and "data-story-act-filter" in storyboard, "")
    add(checks, "storyboard renders visual cards", storyboard.count("storyboard-card") >= len(scenes), storyboard.count("storyboard-card"))
    add(checks, "storyboard includes scene imagery", storyboard_body.count('storyboard-card"') >= len(scenes) and storyboard_body.count("<img") >= len(scenes), storyboard_body.count("<img"))
    add(checks, "storyboard preserves wiki hover links", storyboard.count("entity-link") >= 8, storyboard.count("entity-link"))

    add(checks, "narrative story has search and filter", "data-story-search" in story and "data-story-act-filter" in story, "")
    add(checks, "narrative story has text-to-speech controls", all(term in story for term in ["data-story-read", "data-story-pause", "data-story-resume", "data-story-stop"]), "")
    add(checks, "narrative story has at least one chapter per scene", story.count("story-chapter") >= len(scenes), story.count("story-chapter"))
    add(checks, "narrative story preserves wiki hover links", story.count("entity-link") >= 20, story.count("entity-link"))
    visible_story_text = (outline_body + storyboard_body + story_body).lower()
    add(checks, "story modes hide prompt/dev language", not any(term.lower() in visible_story_text for term in ["image prompt", "asset status", "do not include the strixwolf", "prompt_fallback"]), "")
    add(checks, "story mode JS supports search/filter and speech", all(term in js for term in ["applyFilters", "speechSynthesis", "data-story-search"]), "")
    add(checks, "story mode CSS supports print and no-image outline", "@media print" in css and ".storyboard-grid" in css and ".story-scene-line" in css, "")
    add(checks, "homepage links to concise story modes", all(term in index for term in ["pages/story-outline.html", "pages/storyboard.html", "pages/story.html"]), "")
    add(checks, "command palette links to concise story modes", all(term in app_js for term in ["story-outline.html", "storyboard.html", "story.html"]), "")

    report = {
        "pass": all(check["ok"] for check in checks),
        "check_count": len(checks),
        "issue_count": sum(1 for check in checks if not check["ok"]),
        "scene_count": len(scenes),
        "checks": checks,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    if QA_REPORT.exists():
        passed = report["check_count"] - report["issue_count"]
        QA_REPORT.write_text(
            QA_REPORT.read_text(encoding="utf-8")
            + "\n\n## Story Comprehension Modes QA\n\n"
            + f"Checks passed: **{passed} / {report['check_count']}**\n\n"
            + f"Checks failed: **{report['issue_count']}**\n\n"
            + "- Generated concise Story Outline, visual Storyboard, and narrative Story pages.\n"
            + "- Verified outline is image-free, storyboard is image-led, and all scene links route to Run Mode, Atlas, and scene wiki pages.\n"
            + "- Verified wiki hover links, search/filter controls, text-to-speech controls, and print CSS support.\n"
            + "\nDetailed JSON: `data/qa-story-modes-report.json`.\n",
            encoding="utf-8",
        )
        DOCS_REPORT.write_text(QA_REPORT.read_text(encoding="utf-8"), encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
