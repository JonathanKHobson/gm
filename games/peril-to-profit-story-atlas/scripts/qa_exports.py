#!/usr/bin/env python3
"""QA for Story Atlas static exports and player handout voice safety."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def scan(text: str, patterns: list[str]) -> list[str]:
    return [pattern for pattern in patterns if re.search(pattern, text, re.I)]


def handout_surface_text(payload: dict[str, Any]) -> str:
    values: list[str] = [
        str(payload.get("title") or ""),
        str(payload.get("in_world_label") or ""),
        str(payload.get("brand_flag") or ""),
        str(payload.get("kicker") or ""),
        str(payload.get("hook") or ""),
    ]
    for block in payload.get("blocks") or []:
        values.append(str(block.get("label") or ""))
        values.append(str(block.get("body") or ""))
    for label, body in payload.get("spec") or []:
        values.extend([str(label), str(body)])
    values.extend(str(item) for item in payload.get("affordances") or [])
    return "\n".join(values)


def main() -> int:
    failures: list[str] = []
    warnings: list[str] = []
    try:
        manifest = load_json(DIST / "exports" / "export-manifest.json")
        coverage = load_json(DIST / "data" / "export-coverage-report.json")
        wordlists = load_json(DIST / "exports" / "qa-wordlists.json")
    except FileNotFoundError as exc:
        print(f"Export QA FAILED: missing {exc}")
        return 1

    entries = manifest.get("entries") or []
    counts = coverage.get("player_handouts") or {}
    if manifest.get("schema_version") != "story-atlas-export-manifest-v1":
        failures.append("export manifest has wrong schema version")
    if not manifest.get("build_timestamp") or not manifest.get("source_content_hash"):
        failures.append("export manifest missing build timestamp/source content hash")
    if len(entries) < 400:
        failures.append(f"too few export entries: {len(entries)}")
    if counts.get("available", 0) < 300:
        failures.append(f"too few player handouts available: {counts.get('available', 0)}")
    if counts.get("featured", 0) < 8:
        failures.append(f"too few featured player handouts: {counts.get('featured', 0)}")

    required_formats = {"printer", "pdf", "markdown", "json", "docx"}
    for entry in entries:
        variants = entry.get("variants") or {}
        for variant in ["raw", "gm"]:
            formats = (variants.get(variant) or {}).get("formats") or {}
            missing = required_formats - set(formats)
            if missing:
                failures.append(f"{entry.get('key')}: {variant} missing formats {sorted(missing)}")
            for rel in formats.values():
                if not (DIST / rel).exists():
                    failures.append(f"{entry.get('key')}: missing export file {rel}")
            variant_meta = variants.get(variant) or {}
            if not variant_meta.get("build_timestamp") or not variant_meta.get("content_hash"):
                failures.append(f"{entry.get('key')}: {variant} missing build timestamp/content hash")
        player = variants.get("player") or {}
        if player.get("available"):
            formats = player.get("formats") or {}
            missing = required_formats - set(formats)
            if missing:
                failures.append(f"{entry.get('key')}: player missing formats {sorted(missing)}")
            for rel in formats.values():
                if not (DIST / rel).exists():
                    failures.append(f"{entry.get('key')}: missing player export file {rel}")
            payload = load_json(DIST / formats["json"])
            for key in ["build_timestamp", "content_hash", "disclosure_tier", "featured"]:
                if key not in payload:
                    failures.append(f"{entry.get('key')}: player handout missing {key}")
            for block in payload.get("blocks") or []:
                if not str(block.get("label") or "").strip() or not str(block.get("body") or "").strip():
                    failures.append(f"{entry.get('key')}: player handout has empty conditional block")
            if not payload.get("hook") or not payload.get("affordances"):
                failures.append(f"{entry.get('key')}: player handout missing hook or affordances")
            text = handout_surface_text(payload)
            leaked = scan(text, wordlists.get("banned_player_patterns") or [])
            if leaked:
                failures.append(f"{entry.get('key')}: player handout leak patterns {leaked[:4]}")
            voice_tells = scan(text, wordlists.get("wiki_voice_tells") or [])
            if voice_tells and payload.get("archetype") not in set(wordlists.get("voice_exempt_archetypes") or []):
                message = f"{entry.get('key')}: wiki-voice tells {voice_tells[:4]}"
                if payload.get("featured"):
                    failures.append(message)
                else:
                    warnings.append(message)
        elif entry.get("kind") == "entity" and player.get("archetype") == "clue.prop" and "physical prop" not in player.get("reason", ""):
            failures.append(f"{entry.get('key')}: clue no-handout reason should name physical prop gating")

    packs = ((manifest.get("site_exports") or {}).get("player_handout_packs") or {})
    for pack_name in ["featured", "all"]:
        formats = packs.get(pack_name) or {}
        for fmt in required_formats:
            rel = formats.get(fmt)
            if not rel or not (DIST / rel).exists():
                failures.append(f"missing {pack_name} handout pack {fmt}")
    context = ((manifest.get("site_exports") or {}).get("context") or {})
    for fmt in ["json", "markdown"]:
        rel = context.get(fmt)
        if not rel or not (DIST / rel).exists():
            failures.append(f"missing whole-site context export {fmt}")

    contract = ((manifest.get("site_exports") or {}).get("contract") or {})
    for fmt in ["printer", "pdf", "markdown", "json", "docx"]:
        rel = (contract.get("formats") or {}).get(fmt)
        if not rel or not (DIST / rel).exists():
            failures.append(f"missing contract handout {fmt}")
    for rel in contract.get("assets") or []:
        if not (DIST / rel).exists():
            failures.append(f"missing contract image asset {rel}")

    for rel in [
        "exports/_index/README.md",
        "exports/_index/export-manifest.json",
        "exports/_index/coverage-report.md",
        "exports/_index/build-info.json",
        "exports/_index/self-verify-report.md",
    ]:
        if not (DIST / rel).exists():
            failures.append(f"missing review index file {rel}")
    try:
        build_info = load_json(DIST / "exports" / "_index" / "build-info.json")
        if not build_info.get("build_timestamp") or not build_info.get("source_content_hash"):
            failures.append("build-info.json missing timestamp/source hash")
        if build_info.get("regenerate_command") != "python3 story-atlas/src/build_atlas.py":
            failures.append("build-info.json missing single regenerate exports build step")
        if "dynamic" not in str(build_info.get("dynamic_reexport_todo", "")).lower():
            failures.append("build-info.json missing future dynamic re-export TODO")
    except FileNotFoundError:
        pass
    try:
        coverage_text = load_text(DIST / "exports" / "_index" / "coverage-report.md")
        bad_rows = []
        for line in coverage_text.splitlines():
            if not line.startswith("| ") or line.startswith("|---") or " entity |" in line:
                continue
            parts = [part.strip() for part in line.strip("|").split("|")]
            if len(parts) < 6:
                continue
            category, entity, has_md, has_handout, _featured, notes = parts[:6]
            if entity.startswith(("entity:", "scene:")) and has_md != "yes":
                bad_rows.append(f"{entity} missing markdown")
            if entity.startswith(("entity:", "scene:")) and has_handout != "yes" and "physical prop" not in notes:
                bad_rows.append(f"{entity} missing player handout")
            if category == "clues" and has_handout == "yes" and "physical prop" in notes:
                bad_rows.append(f"{entity} has clue handout despite physical-prop note")
        failures.extend(bad_rows[:80])
        if len(bad_rows) > 80:
            failures.append(f"... {len(bad_rows) - 80} more organized coverage failures")
    except FileNotFoundError:
        pass

    report = {
        "schema_version": "story-atlas-export-qa-report-v1",
        "entries": len(entries),
        "warnings": warnings[:80],
        "failures": failures,
    }
    (DIST / "data" / "qa-export-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    if failures:
        print("Export QA FAILED")
        for failure in failures[:80]:
            print(f"- {failure}")
        if len(failures) > 80:
            print(f"... {len(failures) - 80} more failures")
        return 1
    print(f"Export QA passed: {len(entries)} entries, {counts.get('available', 0)} player handouts, {len(warnings)} voice warnings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
