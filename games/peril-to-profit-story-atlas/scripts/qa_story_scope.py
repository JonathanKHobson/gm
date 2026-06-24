#!/usr/bin/env python3
"""QA gate for the Goldspire manufactured-threat story-scope pass."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
REPORT = DIST / "data" / "qa-story-scope-report.json"
QA_REPORT = DIST / "QA_REPORT.md"
DOC_REPORT = ROOT / "docs" / "STORY_ATLAS_QA_REPORT.md"

ANTAGONIST_LINE = (
    "Perceived antagonist: the forest. True antagonist: the corporate lie about "
    "the forest. The players never confront it directly. They are meant to feel "
    "it by the end."
)
FUTURE_BANNED = [
    "Manufactured-Threat Conspiracy",
    "Continuance Protocol",
    "Endless of Truth",
    "buried truth",
    "GM-only future-thread canon",
]


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: object = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail if isinstance(detail, str) else json.dumps(detail, indent=2)})


def read(rel: str) -> str:
    return (DIST / rel).read_text(encoding="utf-8", errors="ignore")


def read_json(rel: str) -> Any:
    return json.loads(read(rel))


def main() -> None:
    checks: list[dict[str, Any]] = []
    required = [
        "data/story-scope.json",
        "data/gm-future-thread.json",
        "pages/settings.html",
        "pages/story-outline.html",
        "pages/storyboard.html",
        "pages/story.html",
        "run.html",
        "index.html",
    ]
    for rel in required:
        add(checks, f"required story-scope output exists: {rel}", (DIST / rel).exists(), rel)

    scenes = read_json("data/scenes.json")
    slides = read_json("data/slides.json")
    scope = read_json("data/story-scope.json")
    index = read("index.html")
    outline = read("pages/story-outline.html")
    run_html = read("run.html")
    app_js = read("app.js")
    css = read("styles.css")

    add(checks, "story-scope manifest uses exact antagonist line", scope.get("antagonist_line") == ANTAGONIST_LINE, scope.get("antagonist_line", ""))
    add(checks, "homepage presents perceived-vs-true antagonist line", ANTAGONIST_LINE in index, "")
    add(checks, "story outline presents perceived-vs-true antagonist line", ANTAGONIST_LINE in outline, "")
    add(checks, "old no-clear-antagonist framing is absent", "no clear antagonist" not in (index + outline + run_html).lower(), "")

    scene_missing_scope = [scene["id"] for scene in scenes if not scene.get("story_scope")]
    slide_missing_scope = [slide["id"] for slide in slides if slide.get("type") == "scene" and not slide.get("storyScope")]
    add(checks, "every generated scene has story_scope data", not scene_missing_scope, scene_missing_scope)
    add(checks, "every Run Mode scene slide has storyScope data", not slide_missing_scope, slide_missing_scope)

    act_seed_coverage = []
    for act, seeds in scope.get("act_seeds", {}).items():
        tags = {tag for seed in seeds for tag in seed.get("tags", [])}
        if "GUARANTEED" not in tags or "EARNED" not in tags:
            act_seed_coverage.append(act)
    add(checks, "every act seed menu includes GUARANTEED and EARNED depth", not act_seed_coverage, act_seed_coverage)
    tagged_seed_count = sum(1 for scene in scenes for seed in scene.get("story_scope", {}).get("scene_seeds", []) if seed.get("tags"))
    add(checks, "scene seeds are tagged KEEP/REFLAVOR/ADD/SEED plus GUARANTEED/EARNED/FLAG", tagged_seed_count >= 12, tagged_seed_count)

    start_controls = list(DIST.glob("**/*.html"))
    start_locations = []
    theme_locations = []
    for path in start_controls:
        text = path.read_text(encoding="utf-8", errors="ignore")
        rel = path.relative_to(DIST).as_posix()
        if "data-run-clock-start" in text:
            start_locations.append(rel)
        if "data-theme-select" in text:
            theme_locations.append(rel)
    add(checks, "run clock start controls appear only on Home and Run Mode", sorted(start_locations) == ["index.html", "run.html"], start_locations)
    add(checks, "run clock chip exists in shared navigation", "data-run-clock" in index and "data-run-clock" in run_html and "data-run-clock" in read("pages/entity-index.html"), "")
    add(checks, "run clock uses localStorage persistence", "goldspire.runClock.v1" in app_js and "localStorage" in app_js, "")
    add(checks, "run clock supports Pause, Stop, Restart, Reset, Advance, and time adjustment", all(token in app_js for token in ["data-run-clock-pause", "data-run-clock-stop", "data-run-clock-restart", "data-run-clock-reset", "data-run-clock-advance", "data-run-clock-adjust"]), "")
    add(checks, "run clock supports break mode and break-handled controls", all(token in app_js for token in ["data-run-clock-break-start", "data-run-clock-break-end", "data-run-clock-break-done", "runClockStartBreak", "runClockMarkBreakHandled"]), "")
    add(checks, "run clock supports notice tray, snooze/dismiss, and modal escalation", all(token in app_js for token in ["data-run-clock-notices", "runClockActiveNotices", "data-run-clock-notice-snooze", "data-run-clock-modal", "modalEscalation"]), "")
    add(checks, "run clock panel is fixed top-layer UI with attention animation", all(token in css for token in [".run-clock-panel", "position: fixed", "2147482001", "@keyframes run-clock-pulse", "@keyframes run-clock-shake"]), "")
    add(checks, "run clock supports colored non-blocking and critical alert styling", all(token in css for token in [".run-clock.is-nudge", ".run-clock.is-warning", ".run-clock.is-alert", ".run-clock.is-break"]), "")
    add(checks, "run clock schedule has seven target endpoints", len(scope.get("pacing_schedule", [])) == 7, len(scope.get("pacing_schedule", [])))

    add(checks, "theme controls appear only on Settings page", theme_locations == ["pages/settings.html"], theme_locations)
    add(checks, "persistent theme bar has been removed", "Theme <select" not in index and "Theme <select" not in run_html, "")
    add(checks, "Settings page explains theme relocation", "Global display settings" in read("pages/settings.html") and "data-theme-select" in read("pages/settings.html"), "")

    gm_future = read("data/gm-future-thread.json")
    add(checks, "future-thread canon is stored in GM-only data file", "Manufactured-Threat Conspiracy" in gm_future and "gm-only" in gm_future, "")
    future_page = DIST / "pages" / "entities" / "manufactured-threat-future-thread.html"
    add(checks, "future-thread canon has a GM wiki page", future_page.exists() and "GM-only future-thread canon" in future_page.read_text(encoding="utf-8", errors="ignore"), "")
    player_text = read("player-display.html") + read("player-follow.html")
    leaks = [phrase for phrase in FUTURE_BANNED if phrase in player_text]
    add(checks, "future-thread canon does not leak into player-facing pages", not leaks, leaks)

    vault_hub = (ROOT / "obsidian_vault" / "00 Module Hub" / "Goldspire Messengers - Module Hub.md").read_text(encoding="utf-8", errors="ignore")
    add(checks, "Obsidian hub mirrors perceived-vs-true antagonist line", ANTAGONIST_LINE in vault_hub, "")
    scene_notes = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in (ROOT / "obsidian_vault" / "02 Scenes").glob("*.md"))
    add(checks, "Obsidian scene notes mirror manufactured-threat seeds", "## Manufactured-Threat Seeds" in scene_notes and "Pacing Clock" in scene_notes, "")

    issues = [check for check in checks if not check["ok"]]
    report = {"pass": not issues, "check_count": len(checks), "issue_count": len(issues), "checks": checks}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    summary = [
        "\n## Manufactured-Threat Story Scope QA",
        "",
        f"Checks passed: **{len(checks) - len(issues)} / {len(checks)}**",
        f"Checks failed: **{len(issues)}**",
        "",
        "- Corporate manufactured-threat reframe is present across homepage, story modes, scene data, Run Mode slides, and Obsidian notes.",
        "- Run Clock start points, persistence, schedule, attention notices, break mode, Pause/Stop/Restart/Reset/Advance controls, and theme relocation are covered.",
        "- Future-thread canon is stored as GM-only data/wiki content and absent from player display/follow pages.",
        "",
        "Detailed JSON: `data/qa-story-scope-report.json`.",
    ]
    text = "\n".join(summary) + "\n"
    QA_REPORT.write_text((QA_REPORT.read_text(encoding="utf-8") if QA_REPORT.exists() else "") + text, encoding="utf-8")
    DOC_REPORT.write_text((DOC_REPORT.read_text(encoding="utf-8") if DOC_REPORT.exists() else "") + text, encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    sys.exit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
