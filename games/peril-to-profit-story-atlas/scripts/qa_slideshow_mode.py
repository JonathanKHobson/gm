#!/usr/bin/env python3
"""QA gate for Goldspire slideshow/run mode."""

from __future__ import annotations

import contextlib
import http.server
import json
import os
import re
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
REPORT = DIST / "data" / "qa-slideshow-report.json"
QA_REPORT = DIST / "QA_REPORT.md"
DOC_REPORT = ROOT / "docs" / "STORY_ATLAS_QA_REPORT.md"

REQUIRED_FILES = [
    "run.html",
    "player-display.html",
    "player-follow.html",
    "data/slides.json",
    "data/slides-data.js",
    "data/music-library.json",
    "data/music-library-data.js",
    "js/display-sync.js",
    "js/music-player.js",
    "js/run-mode.js",
    "js/player-display.js",
    "js/player-follow.js",
    "css/run-mode.css",
    "css/music-player.css",
    "pages/session-zero.html",
    "pages/safety-tools.html",
    "pages/session-zero-faq.html",
    "pages/session-zero-cue-cards.html",
    "pages/character-sheet-guide.html",
    "assets/session-zero/SZ-00-standby-welcome.png",
    "assets/session-zero/session-zero-faq-qr.png",
]

REQUIRED_SECTIONS = [
    "PROLOGUE",
    "ACT-ONE",
    "ACT-TWO",
    "ACT-THREE",
    "ACT-FOUR",
    "ACT-FIVE",
    "EPILOGUE",
]

REQUIRED_CHEATS = [
    "CHEAT-GM",
    "CHEAT-CONDITIONS",
    "CHEAT-PC",
    "CHEAT-LOOT",
    "CHEAT-PRONUNCIATION",
    "CHEAT-STATE",
]

REQUIRED_SLIDE_FIELDS = [
    "id",
    "type",
    "sectionId",
    "sectionTitle",
    "title",
    "order",
    "playerSafe",
    "completionEligible",
]

PLAYER_SAFE_FIELDS = {
    "id",
    "type",
    "title",
    "image",
    "alt",
    "caption",
    "mood",
    "publicObjective",
    "readAloud",
    "playerBullets",
    "playerTable",
    "playerBeats",
    "displayMode",
    "companionMapIds",
    "mapData",
}

BANNED_PLAYER_PATTERNS = [
    re.compile(r"GM-only", re.I),
    re.compile(r"GM notes?", re.I),
    re.compile(r"GM script", re.I),
    re.compile(r"GM goal", re.I),
    re.compile(r"image prompt", re.I),
    re.compile(r"asset status", re.I),
    re.compile(r"future spoiler", re.I),
    re.compile(r"secret lore", re.I),
    re.compile(r"dev mode", re.I),
    re.compile(r"continuity instruction", re.I),
    re.compile(r"\[Atlas addition", re.I),
    re.compile(r"canon source", re.I),
    re.compile(r"canon note", re.I),
    re.compile(r"\bCATS\b", re.I),
]

SESSION_ZERO_BANNED_SAFE_KEYS = {
    "sectionId",
    "sectionTitle",
    "shortTitle",
    "order",
    "playerSafe",
    "completionEligible",
    "slideNumber",
    "totalSlides",
    "gmGoal",
    "gmNotes",
    "stateControls",
    "spoilers",
    "sourceFiles",
}

SESSION_ZERO_REQUIRED_TEXT = [
    "GM",
    "Kyle",
    "he/him",
    "15+ years",
    "roleplay-friendly",
    "TTRPG",
    "Player introductions",
    "Mox",
    "phones",
    "PG-13-ish",
    "Open Door",
    "pause",
    "slow down",
    "break",
    "Dungeons & Dragons",
    "Duality Dice",
    "Hope",
    "Fear",
    "Agility",
    "Stress",
    "Armor",
    "character sheet",
    "connections",
]

EXPECTED_PER_CHARACTER_PCS = {
    "marlowe-fairwind",
    "barnacle",
    "garrick-reed",
    "khari-nix",
    "varian-soto",
}

PER_CHARACTER_REQUIRED_SLIDES = [
    "SZ-04",
    "SZ-05",
    "SZ-06",
    "SZ-07",
    "PROLOGUE",
    "S00-01",
    "S01-01",
]

TAKEAWAY_BANNED_FRAGMENTS = [
    "say the player-safe fiction",
    "answer what their characters could know",
    "invite an in-character question or roll",
    "offer a simple next action",
    "use the linked q-card",
    "use the linked cue",
    "use the linked cue cards",
    "say the mechanic in table language",
    "translate this into",
    "point to the active example",
    "use this takeaway to keep the beat focused",
    "say the rule in one sentence",
]

TAKEAWAY_NON_TAKEAWAY_PATTERNS = [
    re.compile(r"\bno\s+(?:new\s+)?mechanic\b", re.I),
    re.compile(r"\bno\s+roll\b", re.I),
    re.compile(r"^\s*none\s*$", re.I),
]

ACT_ONE_UPGRADE_TARGETS = {
    "ACT-ONE",
    "S01-02",
    "MAP-S01-02",
    "S01-03",
    "MAP-COMBAT-S01-03",
    "S01-04",
}

ACT_ONE_REQUIRED_FIELDS = [
    "gmGoal",
    "publicObjective",
    "readAloud",
    "playerTakeaway",
    "storyTakeaway",
    "mechanicTakeaway",
    "gmScript",
    "gmReadAloud",
    "gmChecklist",
    "gmPrivate",
    "playerBeats",
    "gmBeats",
    "mechanicIds",
    "stateControls",
    "references",
    "sourceFiles",
    "beatAutoplayEligible",
    "beatAutoplayDefault",
    "beatAutoplayIntervalMs",
    "entityIds",
]

ACT_ONE_MAP_REQUIRED_FIELDS = [
    "gmOrientation",
    "gmDetails",
    "checks",
    "optionalRolls",
    "interactables",
    "hazards",
    "sensoryStack",
    "transitions",
    "hiddenTruth",
]

ACT_TWO_UPGRADE_TARGETS = {
    "ACT-TWO",
    "S02-01",
    "S02-02",
    "MAP-S02-03",
    "S02-03",
    "MAP-LOC-bramble-union-villages",
    "MAP-LOC-the-wandering-briar",
    "S02-04",
}

ACT_TWO_REQUIRED_FIELDS = [
    "gmGoal",
    "publicObjective",
    "readAloud",
    "playerTakeaway",
    "storyTakeaway",
    "mechanicTakeaway",
    "gmScript",
    "gmReadAloud",
    "gmChecklist",
    "gmPrivate",
    "playerBeats",
    "gmBeats",
    "mechanicIds",
    "references",
    "sourceFiles",
    "beatAutoplayEligible",
    "beatAutoplayDefault",
    "beatAutoplayIntervalMs",
]

ACT_TWO_SCENE_REQUIRED_FIELDS = [
    *ACT_TWO_REQUIRED_FIELDS,
    "stateControls",
    "entityIds",
]

ACT_TWO_MAP_REQUIRED_FIELDS = [
    "gmOrientation",
    "gmDetails",
    "checks",
    "optionalRolls",
    "interactables",
    "hazards",
    "sensoryStack",
    "transitions",
    "hiddenTruth",
]

ACT_THREE_UPGRADE_TARGETS = {
    "ACT-THREE",
    "S03-01",
    "S03-02",
    "S03-03",
    "S03-04",
    "MAP-LOC-hush",
    "MAP-LOC-hushtm-community-enclave",
    "MAP-LOC-clover-co-op",
    "MAP-LOC-firstmoss-launch-festival",
    "MAP-LOC-the-sunless-farms",
    "MAP-LOC-hush-safe-irrigation-path",
    "MAP-LOC-the-claravale-market",
    "MAP-LOC-hush-farms",
}

ACT_THREE_REQUIRED_FIELDS = [
    "gmGoal",
    "publicObjective",
    "readAloud",
    "playerTakeaway",
    "storyTakeaway",
    "mechanicTakeaway",
    "gmScript",
    "gmReadAloud",
    "gmChecklist",
    "gmPrivate",
    "playerBeats",
    "gmBeats",
    "mechanicIds",
    "references",
    "sourceFiles",
    "beatAutoplayEligible",
    "beatAutoplayDefault",
    "beatAutoplayIntervalMs",
]

ACT_THREE_SCENE_REQUIRED_FIELDS = [
    *ACT_THREE_REQUIRED_FIELDS,
    "stateControls",
    "choicesConsequences",
    "perCharacterLayer",
]

ACT_THREE_MAP_REQUIRED_FIELDS = [
    "gmOrientation",
    "gmDetails",
    "locations",
    "checks",
    "optionalRolls",
    "interactables",
    "hazards",
    "sensoryStack",
    "transitions",
    "hiddenTruth",
]

ACT_FOUR_UPGRADE_TARGETS = {
    "ACT-FOUR",
    "S04-01",
    "S04-02",
    "S04-03",
    "S04-04",
    "S04-05",
    "MAP-LOC-hush-farms",
    "MAP-LOC-the-hanging-office",
    "MAP-LOC-sablewoodtm-logistics-preserve",
    "MAP-LOC-old-sable",
    "MAP-LOC-open-vale-ward-lines",
    "MAP-LOC-athervast",
}

ACT_FOUR_REQUIRED_FIELDS = [
    "gmGoal",
    "publicObjective",
    "readAloud",
    "playerTakeaway",
    "storyTakeaway",
    "mechanicTakeaway",
    "gmScript",
    "gmReadAloud",
    "gmChecklist",
    "gmPrivate",
    "playerBeats",
    "gmBeats",
    "mechanicIds",
    "references",
    "sourceFiles",
    "beatAutoplayEligible",
    "beatAutoplayDefault",
    "beatAutoplayIntervalMs",
]

ACT_FOUR_SCENE_REQUIRED_FIELDS = [
    *ACT_FOUR_REQUIRED_FIELDS,
    "stateControls",
    "choicesConsequences",
    "perCharacterLayer",
    "takeawayHelp",
]

ACT_FOUR_MAP_REQUIRED_FIELDS = [
    "gmOrientation",
    "gmDetails",
    "locations",
    "checks",
    "optionalRolls",
    "interactables",
    "hazards",
    "sensoryStack",
    "transitions",
    "hiddenTruth",
]

ACT_FIVE_UPGRADE_TARGETS = {
    "ACT-FIVE",
    "S05-01",
    "S05-02",
    "S05-03",
    "S05-04",
    "S05-05",
    "S05-06",
    "S05-07",
    "MAP-S05-03",
    "MAP-COMBAT-S05-05",
    "MAP-COMBAT-S05-06",
    "MAP-LOC-open-valetm-ritual-site",
    "MAP-LOC-the-miremist",
    "MAP-LOC-the-stones-of-the-vale",
    "MAP-LOC-sablewoodtm-logistics-preserve",
    "MAP-LOC-old-sable",
}

ACT_FIVE_REQUIRED_FIELDS = [
    "gmGoal",
    "publicObjective",
    "readAloud",
    "playerTakeaway",
    "storyTakeaway",
    "mechanicTakeaway",
    "gmScript",
    "gmReadAloud",
    "gmChecklist",
    "gmPrivate",
    "playerBeats",
    "gmBeats",
    "mechanicIds",
    "references",
    "sourceFiles",
    "beatAutoplayEligible",
    "beatAutoplayDefault",
    "beatAutoplayIntervalMs",
]

ACT_FIVE_SCENE_REQUIRED_FIELDS = [
    *ACT_FIVE_REQUIRED_FIELDS,
    "stateControls",
    "choicesConsequences",
    "perCharacterLayer",
    "takeawayHelp",
]

ACT_FIVE_MAP_REQUIRED_FIELDS = [
    "gmOrientation",
    "gmDetails",
    "locations",
    "checks",
    "optionalRolls",
    "interactables",
    "hazards",
    "sensoryStack",
    "transitions",
    "hiddenTruth",
]

EPILOGUE_UPGRADE_TARGETS = {
    "EPILOGUE",
    "S06-01",
    "S06-02",
    "MAP-LOC-relay-spire",
    "MAP-LOC-the-goldspire-relay",
    "MAP-LOC-old-sable",
}

EPILOGUE_REQUIRED_FIELDS = [
    "gmGoal",
    "publicObjective",
    "readAloud",
    "playerTakeaway",
    "storyTakeaway",
    "mechanicTakeaway",
    "gmScript",
    "gmReadAloud",
    "gmChecklist",
    "gmPrivate",
    "playerBeats",
    "gmBeats",
    "mechanicIds",
    "references",
    "sourceFiles",
    "takeawayHelp",
    "beatAutoplayEligible",
    "beatAutoplayDefault",
    "beatAutoplayIntervalMs",
]

EPILOGUE_SCENE_REQUIRED_FIELDS = [
    *EPILOGUE_REQUIRED_FIELDS,
    "stateControls",
    "choicesConsequences",
    "perCharacterLayer",
    "playerQuestions",
]

EPILOGUE_MAP_REQUIRED_FIELDS = [
    "gmOrientation",
    "gmDetails",
    "locations",
    "interactables",
    "sensoryStack",
    "transitions",
    "hiddenTruth",
]


def player_text_blob(value: Any) -> str:
    """Collect player-facing text while ignoring image paths and developer keys."""
    text_parts: list[str] = []
    text_keys = {
        "title",
        "caption",
        "mood",
        "publicObjective",
        "readAloud",
        "playerBullets",
        "playerTable",
        "label",
    }

    def walk(node: Any, key: str = "") -> None:
        if isinstance(node, dict):
            for child_key, child in node.items():
                walk(child, child_key)
        elif isinstance(node, list):
            for child in node:
                walk(child, key)
        elif key in text_keys and node not in (None, ""):
            text_parts.append(str(node))

    walk(value)
    return "\n".join(text_parts)


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: object = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail if isinstance(detail, str) else json.dumps(detail, indent=2)})


def takeaway_content_issues(slides: list[dict]) -> dict[str, list[dict[str, str]]]:
    issues: dict[str, list[dict[str, str]]] = {
        "duplicate_body": [],
        "banned_meta": [],
        "non_takeaway": [],
        "missing_say": [],
        "missing_ask": [],
    }

    def visible_values(source: dict) -> dict[str, str]:
        return {
            "player": str(source.get("playerTakeaway") or ""),
            "story": str(source.get("storyTakeaway") or ""),
            "mechanic": str(source.get("mechanicTakeaway") or ""),
        }

    def inspect(scope: str, source: dict) -> None:
        help_block = source.get("takeawayHelp") or {}
        values = visible_values(source)
        for kind, visible in values.items():
            if not visible:
                continue
            cue = help_block.get(kind) or {}
            blob = json.dumps(cue, ensure_ascii=False).lower()
            visible_norm = re.sub(r"\s+", " ", visible).strip().lower()
            deeper_norm = re.sub(r"\s+", " ", str(cue.get("deeper") or cue.get("body") or "")).strip().lower()
            if deeper_norm and deeper_norm == visible_norm:
                issues["duplicate_body"].append({"scope": scope, "kind": kind, "text": visible[:160]})
            for fragment in TAKEAWAY_BANNED_FRAGMENTS:
                if fragment in blob:
                    issues["banned_meta"].append({"scope": scope, "kind": kind, "fragment": fragment})
            check_text = "\n".join([visible, str(cue.get("say") or ""), str(cue.get("ask") or cue.get("faq") or ""), str(cue.get("deeper") or cue.get("body") or "")])
            for pattern in TAKEAWAY_NON_TAKEAWAY_PATTERNS:
                if pattern.search(check_text):
                    issues["non_takeaway"].append({"scope": scope, "kind": kind, "text": pattern.pattern})
            say = str(cue.get("say") or "").strip()
            ask = str(cue.get("ask") or cue.get("faq") or "").strip()
            if len(say) < 24 or not any(mark in say for mark in ['"', "'"]):
                issues["missing_say"].append({"scope": scope, "kind": kind, "say": say[:160]})
            if len(ask) < 36 or "answer the exact question" in ask.lower():
                issues["missing_ask"].append({"scope": scope, "kind": kind, "ask": ask[:160]})

    for slide in slides:
        if slide.get("sectionId") not in {"SESSION-ZERO", "PROLOGUE"}:
            continue
        inspect(str(slide.get("id", "")), slide)
        for beat in slide.get("gmBeats", []):
            inspect(f"{slide.get('id', '')}/{beat.get('id', '')}", beat)
    return issues


def act_one_upgrade_issues(slides: list[dict]) -> dict[str, list[dict[str, object]]]:
    by_id = {slide.get("id"): slide for slide in slides}
    issues: dict[str, list[dict[str, object]]] = {
        "missing_slides": [],
        "missing_fields": [],
        "takeaway_quality": [],
        "player_leaks": [],
        "per_character": [],
        "map_data": [],
        "state_order": [],
    }
    missing = sorted(ACT_ONE_UPGRADE_TARGETS - set(by_id))
    issues["missing_slides"].extend({"slide": sid} for sid in missing)
    expected_order = ["S01-02", "MAP-S01-02", "S01-03", "MAP-COMBAT-S01-03", "S01-04"]
    actual_order = [sid for sid, _order in sorted(((sid, by_id.get(sid, {}).get("order", 9999)) for sid in expected_order), key=lambda row: row[1])]
    if actual_order != expected_order:
        issues["state_order"].append({"expected": expected_order, "actual": actual_order})

    for sid in sorted(ACT_ONE_UPGRADE_TARGETS):
        slide = by_id.get(sid)
        if not slide:
            continue
        for field in ACT_ONE_REQUIRED_FIELDS:
            if field == "perCharacterLayer":
                continue
            if sid == "ACT-ONE" and field in {"stateControls", "entityIds"}:
                continue
            if sid.startswith("MAP-") and field == "entityIds" and field not in slide:
                continue
            value = slide.get(field)
            if field == "beatAutoplayDefault":
                missing_field = field not in slide
            else:
                missing_field = value in (None, "", [])
            if missing_field:
                issues["missing_fields"].append({"slide": sid, "field": field})
        if sid != "ACT-ONE" and not slide.get("perCharacterLayer"):
            issues["per_character"].append({"slide": sid, "issue": "missing perCharacterLayer"})
        gm_notes_blob = json.dumps(slide.get("gmNotes", []), ensure_ascii=False)
        if sid != "ACT-ONE" and any(name in gm_notes_blob for name in ["Varian", "Garrick", "Barnacle", "Khari", "Marlowe"]):
            issues["per_character"].append({"slide": sid, "issue": "PC-specific content appears in gmNotes"})
        help_block = slide.get("takeawayHelp") or {}
        for kind in ["player", "story", "mechanic"]:
            visible = str(slide.get(f"{kind}Takeaway") or "")
            cue = help_block.get(kind) or {}
            if not visible:
                issues["takeaway_quality"].append({"slide": sid, "kind": kind, "issue": "missing visible takeaway"})
                continue
            for cue_field in ["statement", "say", "ask", "deeper"]:
                if not str(cue.get(cue_field) or "").strip():
                    issues["takeaway_quality"].append({"slide": sid, "kind": kind, "issue": f"missing {cue_field}"})
            if str(cue.get("deeper", "")).strip().lower() == visible.strip().lower():
                issues["takeaway_quality"].append({"slide": sid, "kind": kind, "issue": "deeper repeats visible takeaway"})
            blob = json.dumps({"visible": visible, "cue": cue}, ensure_ascii=False).lower()
            for fragment in TAKEAWAY_BANNED_FRAGMENTS:
                if fragment in blob:
                    issues["takeaway_quality"].append({"slide": sid, "kind": kind, "issue": f"banned meta phrase: {fragment}"})
            for pattern in TAKEAWAY_NON_TAKEAWAY_PATTERNS:
                if pattern.search(blob):
                    issues["takeaway_quality"].append({"slide": sid, "kind": kind, "issue": f"non-takeaway: {pattern.pattern}"})
        for gm_beat in slide.get("gmBeats", []):
            beat_scope = f"{sid}/{gm_beat.get('id', '')}"
            beat_help = gm_beat.get("takeawayHelp") or {}
            for kind in ["player", "story", "mechanic"]:
                visible = str(gm_beat.get(f"{kind}Takeaway") or "")
                cue = beat_help.get(kind) or {}
                if not visible:
                    issues["takeaway_quality"].append({"slide": beat_scope, "kind": kind, "issue": "missing visible takeaway"})
                    continue
                for cue_field in ["statement", "say", "ask", "deeper"]:
                    if not str(cue.get(cue_field) or "").strip():
                        issues["takeaway_quality"].append({"slide": beat_scope, "kind": kind, "issue": f"missing {cue_field}"})
                if str(cue.get("deeper", "")).strip().lower() == visible.strip().lower():
                    issues["takeaway_quality"].append({"slide": beat_scope, "kind": kind, "issue": "deeper repeats visible takeaway"})
                blob = json.dumps({"visible": visible, "cue": cue}, ensure_ascii=False).lower()
                for fragment in TAKEAWAY_BANNED_FRAGMENTS:
                    if fragment in blob:
                        issues["takeaway_quality"].append({"slide": beat_scope, "kind": kind, "issue": f"banned meta phrase: {fragment}"})
                for pattern in TAKEAWAY_NON_TAKEAWAY_PATTERNS:
                    if pattern.search(blob):
                        issues["takeaway_quality"].append({"slide": beat_scope, "kind": kind, "issue": f"non-takeaway: {pattern.pattern}"})
        safe_text = player_text_blob(slide.get("playerSafeProjection") or slide)
        for term in ["Keystone Asset", "GM-only", "GM script", "hidden truth", "Bramble Union"]:
            if term.lower() in safe_text.lower():
                issues["player_leaks"].append({"slide": sid, "term": term})
        if sid.startswith("MAP-"):
            map_data = slide.get("mapData") or {}
            for field in ACT_ONE_MAP_REQUIRED_FIELDS:
                if field == "hazards" and sid == "MAP-S01-02":
                    continue
                if not map_data.get(field):
                    issues["map_data"].append({"slide": sid, "field": field})
    return issues


def _inspect_takeaway_quality(scope: str, source: dict, issues: list[dict[str, object]]) -> None:
    help_block = source.get("takeawayHelp") or {}
    for kind in ["player", "story", "mechanic"]:
        visible = str(source.get(f"{kind}Takeaway") or "")
        cue = help_block.get(kind) or {}
        if not visible:
            issues.append({"slide": scope, "kind": kind, "issue": "missing visible takeaway"})
            continue
        for cue_field in ["statement", "say", "ask", "deeper"]:
            if not str(cue.get(cue_field) or "").strip():
                issues.append({"slide": scope, "kind": kind, "issue": f"missing {cue_field}"})
        if str(cue.get("deeper", "")).strip().lower() == visible.strip().lower():
            issues.append({"slide": scope, "kind": kind, "issue": "deeper repeats visible takeaway"})
        blob = json.dumps({"visible": visible, "cue": cue}, ensure_ascii=False).lower()
        for fragment in TAKEAWAY_BANNED_FRAGMENTS:
            if fragment in blob:
                issues.append({"slide": scope, "kind": kind, "issue": f"banned meta phrase: {fragment}"})
        for pattern in TAKEAWAY_NON_TAKEAWAY_PATTERNS:
            if pattern.search(blob):
                issues.append({"slide": scope, "kind": kind, "issue": f"non-takeaway: {pattern.pattern}"})


def act_two_upgrade_issues(slides: list[dict]) -> dict[str, list[dict[str, object]]]:
    by_id = {slide.get("id"): slide for slide in slides}
    issues: dict[str, list[dict[str, object]]] = {
        "missing_slides": [],
        "missing_fields": [],
        "takeaway_quality": [],
        "player_leaks": [],
        "per_character": [],
        "map_data": [],
        "state_branch": [],
        "transitions": [],
    }
    missing = sorted(ACT_TWO_UPGRADE_TARGETS - set(by_id))
    issues["missing_slides"].extend({"slide": sid} for sid in missing)

    expected_scene_order = ["S02-01", "S02-02", "S02-03", "S02-04"]
    actual_scene_order = [sid for sid, _order in sorted(((sid, by_id.get(sid, {}).get("order", 9999)) for sid in expected_scene_order), key=lambda row: row[1])]
    if actual_scene_order != expected_scene_order:
        issues["transitions"].append({"expectedSceneOrder": expected_scene_order, "actual": actual_scene_order})

    for sid in sorted(ACT_TWO_UPGRADE_TARGETS):
        slide = by_id.get(sid)
        if not slide:
            continue
        required = ACT_TWO_REQUIRED_FIELDS
        if sid.startswith("S02-"):
            required = ACT_TWO_SCENE_REQUIRED_FIELDS
        for field in required:
            value = slide.get(field)
            missing_field = field not in slide if field == "beatAutoplayDefault" else value in (None, "", [])
            if missing_field:
                issues["missing_fields"].append({"slide": sid, "field": field})

        if sid != "ACT-TWO" and not slide.get("perCharacterLayer"):
            issues["per_character"].append({"slide": sid, "issue": "missing perCharacterLayer"})
        gm_notes_blob = json.dumps(slide.get("gmNotes", []), ensure_ascii=False)
        if sid != "ACT-TWO" and any(name in gm_notes_blob for name in ["Varian", "Garrick", "Barnacle", "Khari", "Marlowe"]):
            issues["per_character"].append({"slide": sid, "issue": "PC-specific content appears in gmNotes"})

        _inspect_takeaway_quality(sid, slide, issues["takeaway_quality"])
        for gm_beat in slide.get("gmBeats", []):
            _inspect_takeaway_quality(f"{sid}/{gm_beat.get('id', '')}", gm_beat, issues["takeaway_quality"])

        safe_text = player_text_blob(slide.get("playerSafeProjection") or slide)
        for term in ["Keystone Asset", "Grail Industries", "defector truth", "Bramble Union"]:
            if term.lower() in safe_text.lower():
                issues["player_leaks"].append({"slide": sid, "term": term})

        if sid.startswith("MAP-"):
            map_data = slide.get("mapData") or {}
            for field in ACT_TWO_MAP_REQUIRED_FIELDS:
                if not map_data.get(field):
                    issues["map_data"].append({"slide": sid, "field": field})
            if len(json.dumps(map_data.get("gmDetails", []), ensure_ascii=False)) < 120:
                issues["map_data"].append({"slide": sid, "field": "gmDetails", "issue": "stub-length"})
            if not slide.get("playerBeats"):
                issues["map_data"].append({"slide": sid, "field": "playerBeats"})

    s0202_keys = {row.get("key") for row in by_id.get("S02-02", {}).get("stateControls", [])}
    for key in ["strixwolf_outcome", "strixwolf_trust", "strixwolf_blood_debt", "ambushAwareness"]:
        if key not in s0202_keys:
            issues["state_branch"].append({"slide": "S02-02", "missingState": key})
    s0203_keys = {row.get("key") for row in by_id.get("S02-03", {}).get("stateControls", [])}
    if "bramble_outcome" not in s0203_keys:
        issues["state_branch"].append({"slide": "S02-03", "missingState": "bramble_outcome"})
    s0204_keys = {row.get("key") for row in by_id.get("S02-04", {}).get("stateControls", [])}
    for key in ["bramble_outcome", "bramble_truth_learned"]:
        if key not in s0204_keys:
            issues["state_branch"].append({"slide": "S02-04", "missingState": key})

    combat_map = by_id.get("MAP-S02-03", {}).get("mapData", {})
    raw_transitions = combat_map.get("transitions", [])
    if isinstance(raw_transitions, str):
        transition_rows = [raw_transitions]
    else:
        transition_rows = [str(row) for row in raw_transitions or [] if str(row).strip()]
    combat_transitions = "\n".join(transition_rows).lower()
    for term in ["s02-04", "map-loc-bramble-union-villages", "map-loc-the-wandering-briar"]:
        if term not in combat_transitions:
            issues["transitions"].append({"slide": "MAP-S02-03", "missingTransition": term})
    for loc_id in ["MAP-LOC-bramble-union-villages", "MAP-LOC-the-wandering-briar"]:
        loc_keys = {row.get("key") for row in by_id.get(loc_id, {}).get("stateControls", [])}
        if "bramble_outcome" not in loc_keys or "bramble_truth_learned" not in loc_keys:
            issues["state_branch"].append({"slide": loc_id, "missingState": "bramble gating flags"})
    return issues


def act_three_upgrade_issues(slides: list[dict]) -> dict[str, list[dict[str, object]]]:
    by_id = {slide.get("id"): slide for slide in slides}
    issues: dict[str, list[dict[str, object]]] = {
        "missing_slides": [],
        "missing_fields": [],
        "takeaway_quality": [],
        "player_leaks": [],
        "per_character": [],
        "map_data": [],
        "state_branch": [],
        "transitions": [],
    }
    missing = sorted(ACT_THREE_UPGRADE_TARGETS - set(by_id))
    issues["missing_slides"].extend({"slide": sid} for sid in missing)

    expected_scene_order = ["S03-01", "S03-02", "S03-03", "S03-04"]
    actual_scene_order = [sid for sid, _order in sorted(((sid, by_id.get(sid, {}).get("order", 9999)) for sid in expected_scene_order), key=lambda row: row[1])]
    if actual_scene_order != expected_scene_order:
        issues["transitions"].append({"expectedSceneOrder": expected_scene_order, "actual": actual_scene_order})

    for sid in sorted(ACT_THREE_UPGRADE_TARGETS):
        slide = by_id.get(sid)
        if not slide:
            continue
        required = ACT_THREE_REQUIRED_FIELDS
        if sid.startswith("S03-"):
            required = ACT_THREE_SCENE_REQUIRED_FIELDS
        for field in required:
            value = slide.get(field)
            missing_field = field not in slide if field == "beatAutoplayDefault" else value in (None, "", [])
            if missing_field:
                issues["missing_fields"].append({"slide": sid, "field": field})

        if sid != "ACT-THREE" and not slide.get("perCharacterLayer"):
            issues["per_character"].append({"slide": sid, "issue": "missing perCharacterLayer"})
        gm_notes_blob = json.dumps(slide.get("gmNotes", []), ensure_ascii=False)
        if sid != "ACT-THREE" and any(name in gm_notes_blob for name in ["Varian", "Garrick", "Barnacle", "Khari", "Marlowe"]):
            issues["per_character"].append({"slide": sid, "issue": "PC-specific content appears in gmNotes"})

        _inspect_takeaway_quality(sid, slide, issues["takeaway_quality"])
        for gm_beat in slide.get("gmBeats", []):
            _inspect_takeaway_quality(f"{sid}/{gm_beat.get('id', '')}", gm_beat, issues["takeaway_quality"])

        safe_text = player_text_blob(slide.get("playerSafeProjection") or slide)
        for term in ["Keystone Asset", "Hush™", "ward economy", "defector truth", "Grail Industries"]:
            if term.lower() in safe_text.lower():
                issues["player_leaks"].append({"slide": sid, "term": term})

        if sid.startswith("MAP-"):
            map_data = slide.get("mapData") or {}
            for field in ACT_THREE_MAP_REQUIRED_FIELDS:
                if not map_data.get(field):
                    issues["map_data"].append({"slide": sid, "field": field})
            if len(json.dumps(map_data.get("gmDetails", []), ensure_ascii=False)) < 120:
                issues["map_data"].append({"slide": sid, "field": "gmDetails", "issue": "stub-length"})
            if not slide.get("playerBeats"):
                issues["map_data"].append({"slide": sid, "field": "playerBeats"})

    s0301_keys = {row.get("key") for row in by_id.get("S03-01", {}).get("stateControls", [])}
    for key in ["strixwolf_outcome", "strixwolf_disposition", "bramble_outcome", "bramble_truth_learned", "package_status", "hush_trust", "ward_awareness"]:
        if key not in s0301_keys:
            issues["state_branch"].append({"slide": "S03-01", "missingState": key})
    s0302_keys = {row.get("key") for row in by_id.get("S03-02", {}).get("stateControls", [])}
    for key in ["hush_trust", "custodian_route", "ward_awareness", "hush_clues", "package_status", "bramble_truth_learned"]:
        if key not in s0302_keys:
            issues["state_branch"].append({"slide": "S03-02", "missingState": key})
    s0304_keys = {row.get("key") for row in by_id.get("S03-04", {}).get("stateControls", [])}
    for key in ["festival_participation", "festival_boon", "hush_trust", "ward_awareness", "hush_clues"]:
        if key not in s0304_keys:
            issues["state_branch"].append({"slide": "S03-04", "missingState": key})

    bridge_map = by_id.get("MAP-LOC-hush-farms", {}).get("mapData", {})
    bridge_transitions = "\n".join(str(row) for row in bridge_map.get("transitions", []) if str(row).strip()).lower()
    for term in ["s04-01", "act-four", "custodian_route", "package_status"]:
        if term not in bridge_transitions:
            issues["transitions"].append({"slide": "MAP-LOC-hush-farms", "missingTransition": term})
    safe_path = "\n".join(str(row) for row in (by_id.get("MAP-LOC-hush-safe-irrigation-path", {}).get("mapData", {}) or {}).get("transitions", []) if str(row).strip()).lower()
    if "custodian_route=safe" not in safe_path or "map-loc-hush-farms" not in safe_path:
        issues["transitions"].append({"slide": "MAP-LOC-hush-safe-irrigation-path", "missingSafeGate": "custodian_route=safe -> MAP-LOC-hush-farms"})

    expected_map_edges = {
        "MAP-LOC-hush": ["MAP-LOC-clover-co-op", "MAP-LOC-firstmoss-launch-festival", "MAP-LOC-the-claravale-market", "MAP-LOC-the-sunless-farms", "MAP-LOC-hush-farms"],
        "MAP-LOC-clover-co-op": ["MAP-LOC-firstmoss-launch-festival", "MAP-LOC-hush"],
        "MAP-LOC-firstmoss-launch-festival": ["MAP-LOC-the-claravale-market", "MAP-LOC-clover-co-op", "MAP-LOC-hush"],
        "MAP-LOC-the-sunless-farms": ["MAP-LOC-hush-safe-irrigation-path", "MAP-LOC-hush-farms"],
        "MAP-LOC-the-claravale-market": ["MAP-LOC-clover-co-op", "MAP-LOC-firstmoss-launch-festival", "MAP-LOC-hush"],
    }
    for sid, expected_edges in expected_map_edges.items():
        text = "\n".join(str(row) for row in (by_id.get(sid, {}).get("mapData", {}) or {}).get("transitions", []) if str(row).strip()).lower()
        for edge in expected_edges:
            if edge.lower() not in text:
                issues["transitions"].append({"slide": sid, "missingEdge": edge})
    return issues


def act_four_upgrade_issues(slides: list[dict]) -> dict[str, list[dict[str, object]]]:
    by_id = {slide.get("id"): slide for slide in slides}
    issues: dict[str, list[dict[str, object]]] = {
        "missing_slides": [],
        "missing_fields": [],
        "takeaway_quality": [],
        "player_leaks": [],
        "per_character": [],
        "map_data": [],
        "state_branch": [],
        "transitions": [],
        "reveal_gating": [],
    }
    missing = sorted(ACT_FOUR_UPGRADE_TARGETS - set(by_id))
    issues["missing_slides"].extend({"slide": sid} for sid in missing)

    expected_scene_order = ["S04-01", "S04-02", "S04-03", "S04-04", "S04-05"]
    actual_scene_order = [
        sid
        for sid, _order in sorted(
            ((sid, by_id.get(sid, {}).get("order", 9999)) for sid in expected_scene_order),
            key=lambda row: row[1],
        )
    ]
    if actual_scene_order != expected_scene_order:
        issues["transitions"].append({"expectedSceneOrder": expected_scene_order, "actual": actual_scene_order})

    for sid in sorted(ACT_FOUR_UPGRADE_TARGETS):
        slide = by_id.get(sid)
        if not slide:
            continue
        required = ACT_FOUR_REQUIRED_FIELDS
        if sid.startswith("S04-"):
            required = ACT_FOUR_SCENE_REQUIRED_FIELDS
        for field in required:
            value = slide.get(field)
            missing_field = field not in slide if field == "beatAutoplayDefault" else value in (None, "", [])
            if missing_field:
                issues["missing_fields"].append({"slide": sid, "field": field})

        if sid != "ACT-FOUR" and sid != "MAP-LOC-athervast" and not slide.get("perCharacterLayer"):
            issues["per_character"].append({"slide": sid, "issue": "missing perCharacterLayer"})
        gm_notes_blob = json.dumps(slide.get("gmNotes", []), ensure_ascii=False)
        if sid != "ACT-FOUR" and any(name in gm_notes_blob for name in ["Varian", "Garrick", "Barnacle", "Khari", "Marlowe"]):
            issues["per_character"].append({"slide": sid, "issue": "PC-specific content appears in gmNotes"})

        _inspect_takeaway_quality(sid, slide, issues["takeaway_quality"])
        for gm_beat in slide.get("gmBeats", []):
            _inspect_takeaway_quality(f"{sid}/{gm_beat.get('id', '')}", gm_beat, issues["takeaway_quality"])

        safe_projection = slide.get("playerSafeProjection") or {}
        safe_text = player_text_blob(safe_projection or slide)
        safe_payload_blob = json.dumps(safe_projection, ensure_ascii=False)
        gated_terms = ["ward-economy", "ward economy", "soul-economy", "soul economy", "Hush™", "Sablewood™", "Athervast"]
        if sid != "S04-04":
            gated_terms.append("Keystone Asset")
        for term in gated_terms:
            if term.lower() in safe_text.lower():
                issues["player_leaks"].append({"slide": sid, "term": term})
        if sid != "MAP-LOC-athervast" and ("Athervast" in safe_payload_blob or "MAP-LOC-athervast" in safe_payload_blob):
            issues["player_leaks"].append({"slide": sid, "term": "inactive Athervast map id"})
        if sid == "S04-04" and "Keystone Asset" not in safe_text:
            issues["reveal_gating"].append({"slide": sid, "issue": "Custodian reveal beat does not expose Keystone Asset after reveal point"})
        if sid != "S04-04" and "Keystone Asset" in safe_text:
            issues["reveal_gating"].append({"slide": sid, "issue": "Keystone Asset appears before S04-04"})

        if sid.startswith("MAP-"):
            map_data = slide.get("mapData") or {}
            for field in ACT_FOUR_MAP_REQUIRED_FIELDS:
                if not map_data.get(field):
                    issues["map_data"].append({"slide": sid, "field": field})
            if len(json.dumps(map_data.get("gmDetails", []), ensure_ascii=False)) < 120:
                issues["map_data"].append({"slide": sid, "field": "gmDetails", "issue": "stub-length"})
            if not slide.get("playerBeats"):
                issues["map_data"].append({"slide": sid, "field": "playerBeats"})

    expected_states = {
        "S04-01": ["custodian_route", "package_status", "ward_awareness", "hush_trust", "custodian_trust", "strixwolf_outcome", "bramble_outcome"],
        "S04-02": ["custodian_trust", "festival_boon", "package_status", "custodian_route"],
        "S04-03": ["custodian_trust", "hush_trust", "bramble_truth_learned", "strixwolf_blood_debt", "package_status"],
        "S04-04": ["package_status", "custodian_trust", "ward_awareness", "keystone_understanding", "ritual_prep"],
        "S04-05": ["ritual_prep", "ward_stability", "custodian_trust", "keystone_understanding", "festival_boon", "package_status"],
        "MAP-LOC-open-vale-ward-lines": ["ritual_prep", "ward_stability", "keystone_understanding"],
    }
    for sid, keys in expected_states.items():
        present = {row.get("key") for row in by_id.get(sid, {}).get("stateControls", [])}
        for key in keys:
            if key not in present:
                issues["state_branch"].append({"slide": sid, "missingState": key})

    s0401_blob = json.dumps(by_id.get("S04-01", {}), ensure_ascii=False).lower()
    for term in ["custodian_route", "dangerous", "unknown", "instinct", "13", "stress"]:
        if term not in s0401_blob:
            issues["state_branch"].append({"slide": "S04-01", "missingDangerousRouteHandling": term})
    s0404_blob = json.dumps(by_id.get("S04-04", {}), ensure_ascii=False).lower()
    for term in ["custodian", "package_status=lost", "kyle", "keystone_understanding"]:
        if term not in s0404_blob:
            issues["reveal_gating"].append({"slide": "S04-04", "missingRevealBranch": term})
    if "marlowe" in player_text_blob(by_id.get("S04-04", {}).get("playerSafeProjection") or {}).lower():
        issues["reveal_gating"].append({"slide": "S04-04", "issue": "Marlowe appears in player-safe reveal text"})

    bridge_map = by_id.get("MAP-LOC-open-vale-ward-lines", {}).get("mapData", {})
    bridge_transitions = "\n".join(str(row) for row in bridge_map.get("transitions", []) if str(row).strip()).lower()
    for term in ["s05-01", "act-five", "ritual_prep", "ward_stability"]:
        if term not in bridge_transitions:
            issues["transitions"].append({"slide": "MAP-LOC-open-vale-ward-lines", "missingTransition": term})
    athervast_map = by_id.get("MAP-LOC-athervast", {}).get("mapData", {})
    athervast_transitions = "\n".join(str(row) for row in athervast_map.get("transitions", []) if str(row).strip()).lower()
    if not athervast_map.get("inactive"):
        issues["transitions"].append({"slide": "MAP-LOC-athervast", "issue": "Athervast must remain inactive until Kyle rules"})
    if "inactive" not in athervast_transitions or "open-vale" not in athervast_transitions:
        issues["transitions"].append({"slide": "MAP-LOC-athervast", "issue": "inactive map must point GM back to Open Vale edge"})

    expected_map_edges = {
        "MAP-LOC-hush-farms": ["S04-01", "MAP-LOC-the-hanging-office"],
        "MAP-LOC-the-hanging-office": ["S04-02", "S04-03", "S04-04", "S04-05"],
        "MAP-LOC-sablewoodtm-logistics-preserve": ["S04-01", "MAP-LOC-the-hanging-office"],
        "MAP-LOC-old-sable": ["MAP-LOC-the-hanging-office"],
        "MAP-LOC-open-vale-ward-lines": ["S04-05", "S05-01"],
    }
    for sid, expected_edges in expected_map_edges.items():
        text = "\n".join(str(row) for row in (by_id.get(sid, {}).get("mapData", {}) or {}).get("transitions", []) if str(row).strip()).lower()
        for edge in expected_edges:
            if edge.lower() not in text:
                issues["transitions"].append({"slide": sid, "missingEdge": edge})
    return issues


def act_five_upgrade_issues(slides: list[dict]) -> dict[str, list[dict[str, object]]]:
    by_id = {slide.get("id"): slide for slide in slides}
    issues: dict[str, list[dict[str, object]]] = {
        "missing_slides": [],
        "missing_fields": [],
        "takeaway_quality": [],
        "player_leaks": [],
        "per_character": [],
        "map_data": [],
        "state_branch": [],
        "transitions": [],
        "convergence": [],
    }
    missing = sorted(ACT_FIVE_UPGRADE_TARGETS - set(by_id))
    issues["missing_slides"].extend({"slide": sid} for sid in missing)

    expected_scene_order = ["S05-01", "S05-02", "S05-03", "S05-04", "S05-05", "S05-06", "S05-07"]
    actual_scene_order = [
        sid
        for sid, _order in sorted(
            ((sid, by_id.get(sid, {}).get("order", 9999)) for sid in expected_scene_order),
            key=lambda row: row[1],
        )
    ]
    if actual_scene_order != expected_scene_order:
        issues["transitions"].append({"expectedSceneOrder": expected_scene_order, "actual": actual_scene_order})

    for sid in sorted(ACT_FIVE_UPGRADE_TARGETS):
        slide = by_id.get(sid)
        if not slide:
            continue
        required = ACT_FIVE_REQUIRED_FIELDS
        if sid.startswith("S05-"):
            required = ACT_FIVE_SCENE_REQUIRED_FIELDS
        elif sid.startswith("MAP-") and sid in {
            "MAP-S05-03",
            "MAP-COMBAT-S05-05",
            "MAP-COMBAT-S05-06",
            "MAP-LOC-open-valetm-ritual-site",
            "MAP-LOC-the-miremist",
            "MAP-LOC-the-stones-of-the-vale",
        }:
            required = [*ACT_FIVE_REQUIRED_FIELDS, "stateControls", "perCharacterLayer", "takeawayHelp"]
        for field in required:
            value = slide.get(field)
            missing_field = field not in slide if field == "beatAutoplayDefault" else value in (None, "", [])
            if missing_field:
                issues["missing_fields"].append({"slide": sid, "field": field})

        if sid != "ACT-FIVE" and sid.startswith(("S05-", "MAP-S05", "MAP-COMBAT-S05", "MAP-LOC-open-valetm", "MAP-LOC-the-miremist", "MAP-LOC-the-stones")) and not slide.get("perCharacterLayer"):
            issues["per_character"].append({"slide": sid, "issue": "missing perCharacterLayer"})
        gm_notes_blob = json.dumps(slide.get("gmNotes", []), ensure_ascii=False)
        if sid != "ACT-FIVE" and any(name in gm_notes_blob for name in ["Varian", "Garrick", "Barnacle", "Khari", "Marlowe"]):
            issues["per_character"].append({"slide": sid, "issue": "PC-specific content appears in gmNotes"})

        _inspect_takeaway_quality(sid, slide, issues["takeaway_quality"])
        for gm_beat in slide.get("gmBeats", []):
            _inspect_takeaway_quality(f"{sid}/{gm_beat.get('id', '')}", gm_beat, issues["takeaway_quality"])

        safe_projection = slide.get("playerSafeProjection") or {}
        safe_text = player_text_blob(safe_projection or slide)
        for term in ["Market Correction", "Open Vale™", "Open Vale(TM)", "soul-economy", "soul economy", "ward-infrastructure", "GM-only"]:
            if term.lower() in safe_text.lower():
                issues["player_leaks"].append({"slide": sid, "term": term})
        if sid != "S05-07" and "report_choice" in json.dumps(safe_projection, ensure_ascii=False):
            issues["player_leaks"].append({"slide": sid, "term": "report_choice before final report"})

        if sid.startswith("MAP-") and sid in {
            "MAP-S05-03",
            "MAP-COMBAT-S05-05",
            "MAP-COMBAT-S05-06",
            "MAP-LOC-open-valetm-ritual-site",
            "MAP-LOC-the-miremist",
            "MAP-LOC-the-stones-of-the-vale",
        }:
            map_data = slide.get("mapData") or {}
            for field in ACT_FIVE_MAP_REQUIRED_FIELDS:
                if not map_data.get(field):
                    issues["map_data"].append({"slide": sid, "field": field})
            if len(json.dumps(map_data.get("gmDetails", []), ensure_ascii=False)) < 120:
                issues["map_data"].append({"slide": sid, "field": "gmDetails", "issue": "stub-length"})
            if not slide.get("playerBeats"):
                issues["map_data"].append({"slide": sid, "field": "playerBeats"})

    carry_keys = [
        "strixwolf_disposition",
        "strixwolf_outcome",
        "strixwolf_trust",
        "strixwolf_blood_debt",
        "bramble_outcome",
        "bramble_truth_learned",
        "package_status",
        "hush_trust",
        "custodian_route",
        "ward_awareness",
        "festival_boon",
        "custodian_trust",
        "ward_stability",
        "ritual_prep",
        "keystone_understanding",
        "hush_clues",
    ]
    for sid in ["S05-01", "S05-03", "S05-07"]:
        present = {row.get("key") for row in by_id.get(sid, {}).get("stateControls", [])}
        for key in carry_keys:
            if key not in present:
                issues["state_branch"].append({"slide": sid, "missingCarryState": key})

    for sid in ["S05-03", "S05-04", "S05-05", "S05-06", "S05-07", "MAP-S05-03", "MAP-COMBAT-S05-05", "MAP-COMBAT-S05-06"]:
        present = {row.get("key") for row in by_id.get(sid, {}).get("stateControls", [])}
        for key in ["ritual_countdown", "ritual_outcome", "protected_whom", "custodian_fate"]:
            if key not in present:
                issues["state_branch"].append({"slide": sid, "missingRitualState": key})
    s0507_keys = {row.get("key") for row in by_id.get("S05-07", {}).get("stateControls", [])}
    for key in ["report_choice", "relay_hook_accepted"]:
        if key not in s0507_keys:
            issues["state_branch"].append({"slide": "S05-07", "missingReportState": key})

    act5_blob = json.dumps([by_id.get(sid, {}) for sid in ACT_FIVE_UPGRADE_TARGETS], ensure_ascii=False).lower()
    for term in ["d8", "8", "-1", "+1", "custodian hit", "clamp", "package_status=lost", "ward_stability", "fragile"]:
        if term.lower() not in act5_blob:
            issues["convergence"].append({"missingCountdownOrFallbackTerm": term})
    for term in ["file-honest", "spin-corporate", "refuse", "withhold-the-truth", "relay_hook_accepted", "s06"]:
        if term.lower() not in json.dumps(by_id.get("S05-07", {}), ensure_ascii=False).lower():
            issues["convergence"].append({"slide": "S05-07", "missingReportBridge": term})
    for pc_name in ["Marlowe", "Barnacle", "Garrick", "Khari", "Varian"]:
        if pc_name.lower() not in json.dumps(by_id.get("S05-05", {}).get("perCharacterLayer", []), ensure_ascii=False).lower():
            issues["convergence"].append({"slide": "S05-05", "missingMemoryDelvePc": pc_name})

    expected_map_edges = {
        "MAP-LOC-open-valetm-ritual-site": ["S05-01", "S05-02", "S05-06", "S05-07", "S06"],
        "MAP-S05-03": ["S05-03", "MAP-COMBAT-S05-05"],
        "MAP-COMBAT-S05-05": ["S05-05", "S05-06", "MAP-COMBAT-S05-06"],
        "MAP-COMBAT-S05-06": ["S05-04", "S05-06", "S05-07"],
        "MAP-LOC-the-stones-of-the-vale": ["S05-01", "S05-02", "MAP-S05-03"],
        "MAP-LOC-the-miremist": ["S05-04", "MAP-COMBAT-S05-06"],
    }
    for sid, expected_edges in expected_map_edges.items():
        text = "\n".join(str(row) for row in (by_id.get(sid, {}).get("mapData", {}) or {}).get("transitions", []) if str(row).strip()).lower()
        for edge in expected_edges:
            if edge.lower() not in text:
                issues["transitions"].append({"slide": sid, "missingEdge": edge})

    for sid in ["MAP-LOC-sablewoodtm-logistics-preserve", "MAP-LOC-old-sable"]:
        blob = json.dumps(by_id.get(sid, {}).get("mapData", {}), ensure_ascii=False).lower()
        if "backdrop" not in blob or "do not create a new act 5 side route" not in blob:
            issues["transitions"].append({"slide": sid, "issue": "cross-act map not clearly adjudicated as Act 5 backdrop"})
    return issues


def epilogue_upgrade_issues(slides: list[dict]) -> dict[str, list[dict[str, object]]]:
    by_id = {slide.get("id"): slide for slide in slides}
    issues: dict[str, list[dict[str, object]]] = {
        "missing_slides": [],
        "missing_fields": [],
        "takeaway_quality": [],
        "player_leaks": [],
        "per_character": [],
        "map_data": [],
        "state_branch": [],
        "transitions": [],
        "closure": [],
    }
    missing = sorted(EPILOGUE_UPGRADE_TARGETS - set(by_id))
    issues["missing_slides"].extend({"slide": sid} for sid in missing)

    for sid in sorted(EPILOGUE_UPGRADE_TARGETS):
        slide = by_id.get(sid)
        if not slide:
            continue
        required = EPILOGUE_REQUIRED_FIELDS
        if sid.startswith("S06-"):
            required = EPILOGUE_SCENE_REQUIRED_FIELDS
        elif sid.startswith("MAP-"):
            required = [*EPILOGUE_REQUIRED_FIELDS, "stateControls", "perCharacterLayer"]
        for field in required:
            value = slide.get(field)
            missing_field = field not in slide if field == "beatAutoplayDefault" else value in (None, "", [])
            if missing_field:
                issues["missing_fields"].append({"slide": sid, "field": field})

        if sid.startswith(("S06-", "MAP-")) and not slide.get("perCharacterLayer"):
            issues["per_character"].append({"slide": sid, "issue": "missing perCharacterLayer"})
        gm_notes_blob = json.dumps(slide.get("gmNotes", []), ensure_ascii=False)
        if sid.startswith("S06-") and any(name in gm_notes_blob for name in ["Varian", "Garrick", "Barnacle", "Khari", "Marlowe"]):
            issues["per_character"].append({"slide": sid, "issue": "PC-specific content appears in gmNotes"})

        _inspect_takeaway_quality(sid, slide, issues["takeaway_quality"])
        for gm_beat in slide.get("gmBeats", []):
            _inspect_takeaway_quality(f"{sid}/{gm_beat.get('id', '')}", gm_beat, issues["takeaway_quality"])

        safe_projection = slide.get("playerSafeProjection") or {}
        safe_text = player_text_blob(safe_projection or slide).lower()
        for term in [
            "manufactures the peril",
            "manufactured peril",
            "corporation is behind",
            "corporation behind",
            "soul-economy",
            "soul economy",
            "hush™",
            "sablewood™",
            "open vale™",
            "goldspire™",
            "old sable",
            "gm-only",
        ]:
            if term in safe_text:
                issues["player_leaks"].append({"slide": sid, "term": term})

        if sid.startswith("MAP-"):
            map_data = slide.get("mapData") or {}
            for field in EPILOGUE_MAP_REQUIRED_FIELDS:
                if not map_data.get(field):
                    issues["map_data"].append({"slide": sid, "field": field})
            map_blob = json.dumps(map_data, ensure_ascii=False).lower()
            if sid in {"MAP-LOC-relay-spire", "MAP-LOC-the-goldspire-relay"} and "not playable" not in map_blob and "not a playable" not in map_blob:
                issues["map_data"].append({"slide": sid, "issue": "relay map not clearly hook-context only"})
            if sid == "MAP-LOC-old-sable" and "backdrop" not in map_blob:
                issues["map_data"].append({"slide": sid, "issue": "old-sable not clearly backdrop-only"})
            if slide.get("liveTools", {}).get("mode") == "encounter" or map_data.get("combatBlock"):
                issues["closure"].append({"slide": sid, "issue": "epilogue map has combat/encounter behavior"})

    carry_keys = [
        "strixwolf_disposition",
        "strixwolf_outcome",
        "strixwolf_trust",
        "strixwolf_blood_debt",
        "bramble_outcome",
        "bramble_truth_learned",
        "package_status",
        "hush_trust",
        "custodian_route",
        "ward_awareness",
        "festival_boon",
        "custodian_trust",
        "ward_stability",
        "ritual_prep",
        "keystone_understanding",
        "hush_clues",
        "ritual_outcome",
        "protected_whom",
        "custodian_fate",
        "report_choice",
        "relay_hook_accepted",
    ]
    for sid in ["S06-01", "S06-02"]:
        present = {row.get("key") for row in by_id.get(sid, {}).get("stateControls", [])}
        for key in carry_keys:
            if key not in present:
                issues["state_branch"].append({"slide": sid, "missingCarryState": key})
    for sid in ["EPILOGUE", "S06-01", "S06-02"]:
        present = {row.get("key") for row in by_id.get(sid, {}).get("stateControls", [])}
        if sid == "EPILOGUE":
            continue
        for key in ["epilogue_tone", "hidden_hook_discovered", "sequel_direction", "rewards_granted"]:
            if key not in present:
                issues["state_branch"].append({"slide": sid, "missingEpilogueState": key})

    s0601_blob = json.dumps(by_id.get("S06-01", {}), ensure_ascii=False).lower()
    for term in ["file-honest", "spin-corporate", "refuse", "withhold-the-truth", "level up", "rewards_granted"]:
        if term not in s0601_blob:
            issues["closure"].append({"slide": "S06-01", "missingRewardOrReportTerm": term})
    s0602_blob = json.dumps(by_id.get("S06-02", {}), ensure_ascii=False).lower()
    for term in ["relay_hook_accepted", "hidden_hook_discovered", "sequel_direction", "relay", "keeper", "map"]:
        if term not in s0602_blob:
            issues["closure"].append({"slide": "S06-02", "missingHookTerm": term})

    orders = {sid: by_id.get(sid, {}).get("order", 99999) for sid in ["S05-07", "S06-01", "S06-02"]}
    if not (orders["S05-07"] < orders["S06-01"] < orders["S06-02"]):
        issues["transitions"].append({"expected": "S05-07 -> S06-01 -> S06-02", "actual": orders})
    for sid, expected in {
        "MAP-LOC-relay-spire": ["S06-02", "open-ended"],
        "MAP-LOC-the-goldspire-relay": ["S06-02", "open-ended"],
        "MAP-LOC-old-sable": ["S06-02", "backdrop"],
    }.items():
        text = json.dumps(by_id.get(sid, {}).get("mapData", {}), ensure_ascii=False).lower()
        for edge in expected:
            if edge.lower() not in text:
                issues["transitions"].append({"slide": sid, "missingEdgeOrRole": edge})
    if "s07" in s0602_blob or "act seven" in s0602_blob:
        issues["transitions"].append({"slide": "S06-02", "issue": "epilogue appears to point to non-existent next act"})

    for sid in ["EPILOGUE", "S06-01", "S06-02"]:
        blob = json.dumps(by_id.get(sid, {}), ensure_ascii=False).lower()
        if "ritual_countdown" in blob:
            issues["closure"].append({"slide": sid, "issue": "epilogue carries countdown control"})
        if "combatblock" in blob or "legacy skeleton" in blob or "soul-audit wraith" in blob:
            issues["closure"].append({"slide": sid, "issue": "epilogue carries combat content"})
    return issues


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def static_checks(checks: list[dict[str, Any]]) -> tuple[list[dict], list[dict]]:
    for rel in REQUIRED_FILES:
        add(checks, f"required file exists: {rel}", (DIST / rel).exists(), rel)

    slides_path = DIST / "data" / "slides.json"
    scenes_path = DIST / "data" / "scenes.json"
    slides = read_json(slides_path) if slides_path.exists() else []
    scenes = read_json(scenes_path) if scenes_path.exists() else []

    add(checks, "slides.json is a non-empty list", isinstance(slides, list) and bool(slides), len(slides))

    ids: set[str] = set()
    duplicate_ids: list[str] = []
    missing_fields: list[dict[str, str]] = []
    missing_scene_images: list[str] = []
    bad_player_safe: list[dict[str, str]] = []
    svg_images: list[dict[str, str]] = []
    bad_safe_projection: list[str] = []
    bad_session_zero_projection: list[str] = []

    for slide in slides:
        sid = slide.get("id", "")
        if sid in ids:
            duplicate_ids.append(sid)
        ids.add(sid)
        for field in REQUIRED_SLIDE_FIELDS:
            if field not in slide:
                missing_fields.append({"slide": sid, "field": field})
        if slide.get("type") == "scene" and not slide.get("image"):
            missing_scene_images.append(sid)
        if str(slide.get("image", "")).lower().endswith(".svg"):
            svg_images.append({"slide": sid, "image": slide.get("image", "")})
        safe_projection = slide.get("playerSafeProjection", {})
        if safe_projection:
            extra = sorted(set(safe_projection) - PLAYER_SAFE_FIELDS)
            if extra:
                bad_safe_projection.append(f"{sid}: {', '.join(extra)}")
            if slide.get("sectionId") == "SESSION-ZERO":
                leaked = sorted(set(safe_projection) & SESSION_ZERO_BANNED_SAFE_KEYS)
                if leaked:
                    bad_session_zero_projection.append(f"{sid}: {', '.join(leaked)}")
            safe_text = json.dumps(safe_projection, ensure_ascii=False)
            for pattern in BANNED_PLAYER_PATTERNS:
                if pattern.search(safe_text):
                    bad_player_safe.append({"slide": sid, "pattern": pattern.pattern})

    add(checks, "every slide has required fields", not missing_fields, missing_fields[:20])
    add(checks, "slide ids are unique", not duplicate_ids, duplicate_ids)
    add(checks, "every scene slide has image", not missing_scene_images, missing_scene_images)
    add(checks, "no slide image references SVG", not svg_images, svg_images)
    add(checks, "player-safe projections contain only safe fields", not bad_safe_projection, bad_safe_projection[:20])
    add(checks, "Session Zero player projections hide scaffolding", not bad_session_zero_projection, bad_session_zero_projection[:20])
    add(checks, "player-safe projections have no GM/dev strings", not bad_player_safe, bad_player_safe[:20])

    slides_by_id = {slide.get("id"): slide for slide in slides}
    missing_per_character_layers: list[dict[str, Any]] = []
    per_character_safe_leaks: list[str] = []
    missing_player_cues: list[dict[str, str]] = []
    for slide_id in PER_CHARACTER_REQUIRED_SLIDES:
        slide = slides_by_id.get(slide_id, {})
        layer = slide.get("perCharacterLayer", [])
        pc_ids = {entry.get("pcId") for entry in layer}
        if pc_ids != EXPECTED_PER_CHARACTER_PCS:
            missing_per_character_layers.append({"slide": slide_id, "pcIds": sorted(pc_ids)})
        if "perCharacterLayer" in slide.get("playerSafeProjection", {}):
            per_character_safe_leaks.append(slide_id)
        for entry in layer:
            if not entry.get("playerCue"):
                missing_player_cues.append({"slide": slide_id, "pc": entry.get("pcName", "")})
    add(checks, "Session Zero and Prologue target slides have five-PC per-character layers", not missing_per_character_layers, missing_per_character_layers)
    add(checks, "per-character layers stay out of player-safe projections", not per_character_safe_leaks, per_character_safe_leaks)
    add(checks, "per-character entries include player-safe throw cues", not missing_player_cues, missing_player_cues[:20])

    scene_ids = {scene["id"] for scene in scenes}
    slide_scene_ids = {slide["id"] for slide in slides if slide.get("type") == "scene"}
    add(checks, "every story scene has a scene slide", scene_ids <= slide_scene_ids, sorted(scene_ids - slide_scene_ids))
    add(checks, "Session Zero slides exist", any(slide.get("sectionId") == "SESSION-ZERO" and slide.get("id", "").startswith("SZ-") for slide in slides), "")
    session_zero_slides = [slide for slide in slides if slide.get("sectionId") == "SESSION-ZERO"]
    add(checks, "Session Zero starts with standby carousel", bool(session_zero_slides) and session_zero_slides[0].get("id") == "SZ-00-STANDBY", session_zero_slides[0].get("id") if session_zero_slides else "")
    standby = next((slide for slide in session_zero_slides if slide.get("id") == "SZ-00-STANDBY"), {})
    standby_beats = standby.get("playerSafeProjection", {}).get("playerBeats", [])
    add(checks, "Session Zero standby carousel has multiple player beats", standby.get("displayMode") == "standby-carousel" and len(standby_beats) >= 5, len(standby_beats))
    add(checks, "Session Zero standby carousel auto-rotates by default", standby.get("beatAutoplayEligible") is True and standby.get("beatAutoplayDefault") is True, {key: standby.get(key) for key in ["beatAutoplayEligible", "beatAutoplayDefault", "beatAutoplayIntervalMs"]})
    autoplay_default_leaks = [slide.get("id") for slide in session_zero_slides + [slide for slide in slides if slide.get("sectionId") == "PROLOGUE"] if slide.get("id") != "SZ-00-STANDBY" and slide.get("beatAutoplayDefault")]
    add(checks, "only standby carousel auto-rotates by default", not autoplay_default_leaks, autoplay_default_leaks)
    decorative_image_beat_slides = []
    for slide_id in ["SZ-01B", "SZ-02", "SZ-02B", "SZ-03"]:
        slide = next((item for item in session_zero_slides if item.get("id") == slide_id), {})
        modes = [beat.get("displayMode") for beat in slide.get("playerBeats", [])]
        if any(mode in {"image-only", "image-title-caption"} for mode in modes):
            decorative_image_beat_slides.append({"slide": slide_id, "modes": modes})
    add(checks, "decorative Session Zero slides do not expose image-only beats", not decorative_image_beat_slides, decorative_image_beat_slides)
    sz04 = next((slide for slide in session_zero_slides if slide.get("id") == "SZ-04"), {})
    sz04_beats = sz04.get("playerBeats", [])
    add(checks, "Character sheet slide has progressive player beats", len(sz04_beats) >= 4, [beat.get("label") for beat in sz04_beats])
    session_zero_text = json.dumps([slide.get("playerSafeProjection", {}) for slide in session_zero_slides], ensure_ascii=False)
    missing_session_zero_text = [text for text in SESSION_ZERO_REQUIRED_TEXT if text.lower() not in session_zero_text.lower()]
    add(checks, "Session Zero player projections include core onboarding content", not missing_session_zero_text, missing_session_zero_text)
    missing_takeaway_help = [slide.get("id") for slide in session_zero_slides if not slide.get("takeawayHelp")]
    add(checks, "Session Zero slides include hoverable takeaway help", not missing_takeaway_help, missing_takeaway_help)
    prologue_slides = [slide for slide in slides if slide.get("sectionId") == "PROLOGUE"]
    prologue_scene_ids = [
        slide.get("id")
        for slide in prologue_slides
        if slide.get("id") == "PROLOGUE" or not str(slide.get("id", "")).startswith("MAP-")
    ][:3]
    add(checks, "Prologue starts Contract -> Job -> Entering Sablewood", prologue_scene_ids == ["PROLOGUE", "S00-01", "S01-01"], prologue_scene_ids)
    contract = next((slide for slide in slides if slide.get("id") == "PROLOGUE"), {})
    job = next((slide for slide in slides if slide.get("id") == "S00-01"), {})
    threshold = next((slide for slide in slides if slide.get("id") == "S01-01"), {})
    add(checks, "Prologue Contract overview has progressive beats", len(contract.get("playerBeats", [])) >= 4 and len(contract.get("gmBeats", [])) >= 4, [beat.get("label") for beat in contract.get("playerBeats", [])])
    for slide in [job, threshold]:
        sid = slide.get("id", "")
        add(
            checks,
            f"{sid} has five-field Prologue beats",
            len(slide.get("playerBeats", [])) >= 3
            and len(slide.get("gmBeats", [])) == len(slide.get("playerBeats", []))
            and bool(slide.get("gmScript"))
            and bool(slide.get("playerTakeaway"))
            and bool(slide.get("storyTakeaway"))
            and bool(slide.get("mechanicTakeaway")),
            {"playerBeats": [beat.get("label") for beat in slide.get("playerBeats", [])], "gmBeats": len(slide.get("gmBeats", []))},
        )
    prologue_missing_takeaway_help = [slide.get("id") for slide in prologue_slides if not slide.get("takeawayHelp")]
    add(checks, "Prologue slides include hoverable takeaway help", not prologue_missing_takeaway_help, prologue_missing_takeaway_help)
    takeaway_issues = takeaway_content_issues(session_zero_slides + prologue_slides)
    add(checks, "Session Zero and Prologue takeaway Q-cards add detail beyond the visible takeaway", not takeaway_issues["duplicate_body"], takeaway_issues["duplicate_body"][:20])
    add(checks, "Session Zero and Prologue takeaway Q-cards contain content, not meta-instructions", not takeaway_issues["banned_meta"], takeaway_issues["banned_meta"][:20])
    add(checks, "Session Zero and Prologue takeaways never use No mechanic or No roll placeholders", not takeaway_issues["non_takeaway"], takeaway_issues["non_takeaway"][:20])
    add(checks, "Session Zero and Prologue takeaway Q-cards include speakable Say it like this content", not takeaway_issues["missing_say"], takeaway_issues["missing_say"][:20])
    add(checks, "Session Zero and Prologue takeaway Q-cards include actual If players ask answers", not takeaway_issues["missing_ask"], takeaway_issues["missing_ask"][:20])
    act_one_issues = act_one_upgrade_issues(slides)
    add(checks, "Act 1 upgraded target slides exist", not act_one_issues["missing_slides"], act_one_issues["missing_slides"])
    add(checks, "Act 1 upgraded target slides have required Run Mode fields", not act_one_issues["missing_fields"], act_one_issues["missing_fields"][:30])
    add(checks, "Act 1 upgraded target takeaway Q-cards are content-complete", not act_one_issues["takeaway_quality"], act_one_issues["takeaway_quality"][:30])
    add(checks, "Act 1 upgraded target player projections do not leak GM-only terms", not act_one_issues["player_leaks"], act_one_issues["player_leaks"][:20])
    add(checks, "Act 1 per-character data stays in perCharacterLayer", not act_one_issues["per_character"], act_one_issues["per_character"][:20])
    add(checks, "Act 1 map boards include operating mapData", not act_one_issues["map_data"], act_one_issues["map_data"][:30])
    add(checks, "Act 1 scene/map order preserves cart -> map -> creature -> combat map -> first roll", not act_one_issues["state_order"], act_one_issues["state_order"])
    act_two_issues = act_two_upgrade_issues(slides)
    add(checks, "Act 2 upgraded target slides exist", not act_two_issues["missing_slides"], act_two_issues["missing_slides"])
    add(checks, "Act 2 upgraded target slides have required Run Mode fields", not act_two_issues["missing_fields"], act_two_issues["missing_fields"][:40])
    add(checks, "Act 2 upgraded target takeaway Q-cards are content-complete", not act_two_issues["takeaway_quality"], act_two_issues["takeaway_quality"][:40])
    add(checks, "Act 2 upgraded target player projections do not leak gated spoiler terms", not act_two_issues["player_leaks"], act_two_issues["player_leaks"][:20])
    add(checks, "Act 2 per-character data stays in perCharacterLayer", not act_two_issues["per_character"], act_two_issues["per_character"][:20])
    add(checks, "Act 2 map boards include operating mapData", not act_two_issues["map_data"], act_two_issues["map_data"][:40])
    add(checks, "Act 2 state controls preserve strixwolf and bramble branch continuity", not act_two_issues["state_branch"], act_two_issues["state_branch"][:30])
    add(checks, "Act 2 transitions preserve ambush -> aftermath and optional location paths", not act_two_issues["transitions"], act_two_issues["transitions"][:30])
    act_three_issues = act_three_upgrade_issues(slides)
    add(checks, "Act 3 upgraded target slides exist", not act_three_issues["missing_slides"], act_three_issues["missing_slides"])
    add(checks, "Act 3 upgraded target slides have required Run Mode fields", not act_three_issues["missing_fields"], act_three_issues["missing_fields"][:50])
    add(checks, "Act 3 upgraded target takeaway Q-cards are content-complete", not act_three_issues["takeaway_quality"], act_three_issues["takeaway_quality"][:50])
    add(checks, "Act 3 target player projections do not leak gated spoiler terms", not act_three_issues["player_leaks"], act_three_issues["player_leaks"][:30])
    add(checks, "Act 3 per-character data stays in perCharacterLayer", not act_three_issues["per_character"], act_three_issues["per_character"][:30])
    add(checks, "Act 3 map boards include operating mapData", not act_three_issues["map_data"], act_three_issues["map_data"][:50])
    add(checks, "Act 3 state controls preserve carry-in and new branch continuity", not act_three_issues["state_branch"], act_three_issues["state_branch"][:40])
    add(checks, "Act 3 maps preserve hub loops and gated Act 4 bridge", not act_three_issues["transitions"], act_three_issues["transitions"][:50])
    act_four_issues = act_four_upgrade_issues(slides)
    add(checks, "Act 4 upgraded target slides exist", not act_four_issues["missing_slides"], act_four_issues["missing_slides"])
    add(checks, "Act 4 upgraded target slides have required Run Mode fields", not act_four_issues["missing_fields"], act_four_issues["missing_fields"][:60])
    add(checks, "Act 4 upgraded target takeaway Q-cards are content-complete", not act_four_issues["takeaway_quality"], act_four_issues["takeaway_quality"][:60])
    add(checks, "Act 4 target player projections preserve Keystone and ward spoiler gates", not act_four_issues["player_leaks"], act_four_issues["player_leaks"][:40])
    add(checks, "Act 4 per-character data stays in perCharacterLayer", not act_four_issues["per_character"], act_four_issues["per_character"][:40])
    add(checks, "Act 4 map boards include operating mapData", not act_four_issues["map_data"], act_four_issues["map_data"][:60])
    add(checks, "Act 4 state controls preserve carry-in and reveal branch continuity", not act_four_issues["state_branch"], act_four_issues["state_branch"][:50])
    add(checks, "Act 4 maps preserve treehouse loop, inactive Athervast lock, and Act 5 bridge", not act_four_issues["transitions"], act_four_issues["transitions"][:60])
    add(checks, "Act 4 reveal is Custodian-routed and S04-04-gated", not act_four_issues["reveal_gating"], act_four_issues["reveal_gating"][:50])
    act_five_issues = act_five_upgrade_issues(slides)
    add(checks, "Act 5 upgraded target slides exist", not act_five_issues["missing_slides"], act_five_issues["missing_slides"])
    add(checks, "Act 5 upgraded target slides have required Run Mode fields", not act_five_issues["missing_fields"], act_five_issues["missing_fields"][:70])
    add(checks, "Act 5 upgraded target takeaway Q-cards are content-complete", not act_five_issues["takeaway_quality"], act_five_issues["takeaway_quality"][:70])
    add(checks, "Act 5 target player projections preserve corporate and soul-economy spoiler gates", not act_five_issues["player_leaks"], act_five_issues["player_leaks"][:50])
    add(checks, "Act 5 per-character data stays in perCharacterLayer", not act_five_issues["per_character"], act_five_issues["per_character"][:50])
    add(checks, "Act 5 maps and combat boards include operating mapData", not act_five_issues["map_data"], act_five_issues["map_data"][:70])
    add(checks, "Act 5 state controls preserve full carry-in, countdown, and report branch continuity", not act_five_issues["state_branch"], act_five_issues["state_branch"][:70])
    add(checks, "Act 5 maps preserve finale transitions and Epilogue bridge", not act_five_issues["transitions"], act_five_issues["transitions"][:70])
    add(checks, "Act 5 convergence includes countdown, lost-package fallback, Memory Delve hooks, and report choices", not act_five_issues["convergence"], act_five_issues["convergence"][:70])
    epilogue_issues = epilogue_upgrade_issues(slides)
    add(checks, "Epilogue upgraded target slides exist", not epilogue_issues["missing_slides"], epilogue_issues["missing_slides"])
    add(checks, "Epilogue upgraded target slides have required Run Mode fields", not epilogue_issues["missing_fields"], epilogue_issues["missing_fields"][:50])
    add(checks, "Epilogue takeaway Q-cards are content-complete", not epilogue_issues["takeaway_quality"], epilogue_issues["takeaway_quality"][:50])
    add(checks, "Epilogue player projections preserve hidden-thesis spoiler gates", not epilogue_issues["player_leaks"], epilogue_issues["player_leaks"][:40])
    add(checks, "Epilogue per-character payoffs stay in perCharacterLayer", not epilogue_issues["per_character"], epilogue_issues["per_character"][:40])
    add(checks, "Epilogue maps are populated as hook context only", not epilogue_issues["map_data"], epilogue_issues["map_data"][:50])
    add(checks, "Epilogue state controls preserve carry-in and closure branch continuity", not epilogue_issues["state_branch"], epilogue_issues["state_branch"][:50])
    add(checks, "Epilogue transitions preserve S05-07 -> S06-01 -> S06-02 terminus", not epilogue_issues["transitions"], epilogue_issues["transitions"][:50])
    add(checks, "Epilogue closure has rewards, report branches, hooks, and no combat/countdown", not epilogue_issues["closure"], epilogue_issues["closure"][:50])
    handling_scripts_without_readaloud: list[str] = []
    for slide in [*session_zero_slides, *prologue_slides]:
        slide_readaloud = bool(slide.get("gmReadAloud"))
        if slide.get("gmScript"):
            blob = f"{slide.get('id')}: {slide.get('gmScript')}"
            if not slide_readaloud:
                handling_scripts_without_readaloud.append(blob)
        for beat in slide.get("gmBeats", []):
            if beat.get("gmScript"):
                blob = f"{slide.get('id')}/{beat.get('id')}: {beat.get('gmScript')}"
                if not beat.get("gmReadAloud"):
                    handling_scripts_without_readaloud.append(blob)
    banned_script_fragments = [
        "say welcome plainly",
        "name the concept",
        "confirm the players see",
        "then tell the table",
        "use the player-facing beat",
        "no mechanic yet. this is orientation.",
    ]
    bad_script_fragments = [blob for blob in handling_scripts_without_readaloud for fragment in banned_script_fragments if fragment in blob.lower()]
    add(checks, "GM handling scripts with action language have explicit read-aloud alternatives", not bad_script_fragments, bad_script_fragments[:10])
    prologue_safe_text = player_text_blob([slide.get("playerSafeProjection", {}) for slide in prologue_slides])
    leaked_prologue_terms = [term for term in ["Keystone Asset", "Marlowe Fairwind", "Hush", "Sablewood™ Logistics Preserve"] if term.lower() in prologue_safe_text.lower()]
    add(checks, "Prologue player-safe text is description-first", not leaked_prologue_terms, leaked_prologue_terms)
    scenes_by_id = {scene.get("id"): scene for scene in scenes}
    add(checks, "Entering Sablewood is now a Prologue transition scene", scenes_by_id.get("S01-01", {}).get("act") == "Prologue", scenes_by_id.get("S01-01", {}).get("act"))
    add(checks, "Act One now starts after the Prologue transition", scenes_by_id.get("S01-02", {}).get("act") == "Act One", scenes_by_id.get("S01-02", {}).get("act"))
    for section in REQUIRED_SECTIONS:
        add(checks, f"section slide exists: {section}", section in ids, section)
    for cheat in REQUIRED_CHEATS:
        add(checks, f"cheat slide exists: {cheat}", cheat in ids, cheat)

    run_html = (DIST / "run.html").read_text(encoding="utf-8", errors="ignore")
    display_html = (DIST / "player-display.html").read_text(encoding="utf-8", errors="ignore")
    follow_html = (DIST / "player-follow.html").read_text(encoding="utf-8", errors="ignore")
    run_js = (DIST / "js" / "run-mode.js").read_text(encoding="utf-8", errors="ignore")
    display_js = (DIST / "js" / "display-sync.js").read_text(encoding="utf-8", errors="ignore")
    player_js = (DIST / "js" / "player-display.js").read_text(encoding="utf-8", errors="ignore")
    music_js = (DIST / "js" / "music-player.js").read_text(encoding="utf-8", errors="ignore")
    music_css = (DIST / "css" / "music-player.css").read_text(encoding="utf-8", errors="ignore")
    music_library = read_json(DIST / "data" / "music-library.json") if (DIST / "data" / "music-library.json").exists() else {}
    music_tracks = music_library.get("tracks", [])
    missing_music_files = [
        {"track": track.get("id"), "src": track.get("src")}
        for track in music_tracks
        if not (DIST / str(track.get("src", ""))).exists()
    ]

    add(checks, "run.html loads data/slides-data.js", "data/slides-data.js" in run_html, "")
    add(checks, "run.html loads js/display-sync.js", "js/display-sync.js" in run_html, "")
    add(checks, "run.html loads js/run-mode.js", "js/run-mode.js" in run_html, "")
    add(checks, "run.html loads music player assets", all(token in run_html for token in ["css/music-player.css", "data/music-library-data.js", "js/music-player.js", "data-music-player"]), "")
    add(checks, "Run Mode music player is collapsible by default", '<details class="music-player-panel" data-music-panel open' not in run_html and "data-music-summary-now" in run_html, "")
    add(checks, "player-display loads sync and display scripts", "js/display-sync.js" in display_html and "js/player-display.js" in display_html, "")
    add(checks, "player-display owns music audio output", "data-music-audio" in display_html and "data-music-player" not in display_html, "")
    add(checks, "player-display loads music player assets", all(token in display_html for token in ["css/music-player.css", "data/music-library-data.js", "js/music-player.js"]), "")
    add(checks, "Run Mode does not own an audio element", "data-music-audio" not in run_html and "<audio" not in run_html.lower(), "")
    add(checks, "music library has copied audio files", bool(music_tracks) and not missing_music_files, missing_music_files[:10])
    add(checks, "music player JS wires GM controls to Player Display", all(token in music_js for token in ["musicPlay", "musicPause", "musicSetTrack", "musicSetVolume", "musicRestart", "GoldspireDisplaySync"]), "")
    add(checks, "music player handles browser audio unlock", "audio-locked" in music_js and ".player-audio-unlock" in music_css, "")
    add(checks, "music player expands as overlay sheet", all(token in music_css for token in ["position: absolute", ".music-player-panel:not([open]) .music-player", "max-height: min(68vh, 32rem)"]) and all(token in music_js for token in ["function setMusicPanelOpen", "pointerdown", 'event.key !== "Escape"']), "")
    add(checks, "player-follow exists as static non-sync mode", "does not promise automatic phone sync" in follow_html.lower() or "does not promise" in follow_html.lower(), "")
    add(checks, "sync protocol constant exists", "goldspire-run-sync-v1" in display_js and "BroadcastChannel" in display_js and "localStorage" in display_js, "")
    for shortcut in ["ArrowRight", "ArrowLeft", "Home", "End", "show-text", "show-image", "blackout", "CHEAT-GM"]:
        add(checks, f"run mode shortcut/action wired: {shortcut}", shortcut in run_js, shortcut)
    add(checks, "pinned slide recall shortcuts are wired", "PINNED_SHORTCUT_KEYS" in run_js and "goToLatestPinned" in run_js and "goToPinnedIndex" in run_js, "")
    add(checks, "player display actions auto-open display", "ensurePlayerDisplay" in run_js and "playerDisplayWindow" in run_js and "sendToPlayer" in run_js, "")
    add(checks, "player display heartbeat prevents duplicate windows", "PLAYER_DISPLAY_HEARTBEAT_KEY" in run_js and "playerDisplayAlive" in run_js and "autoOpen = options.autoOpen !== false" in run_js and "PLAYER_DISPLAY_HEARTBEAT_KEY" in player_js and "pulseHeartbeat" in player_js, "")
    add(checks, "blackout toggles back to the current player payload", "state.playerDisplayBlackout" in run_js and "Player Display restored" in run_js and "currentPlayerPayload()" in run_js, "")
    add(checks, "beat autoplay toggle is wired in Run Mode", "beatAutoplayBySlide" in run_js and "toggle-beat-autoplay" in run_js and "toggleBeatAutoplay" in run_js, "")
    add(checks, "standby carousel sync sends the full beat projection", "ignoreActiveBeat" in run_js and 'displayMode === "standby-carousel"' in run_js, "")
    add(checks, "persistent beat tool row is shared", "show-current-text" in run_js and "Player Display / Text" in run_js and "activeBeatBySlide" in run_js, "")
    add(checks, "Run Mode inline throw/copy controls are generated", "data-run-inline-action" in run_js and "run-throwable-text" in run_js and "runPlayerPayloadFromElement" in run_js, "")
    add(checks, "Run Mode entity hover-card image/text controls are generated", "hover-card-media-wrap run-throwable-image" in run_js and "hover-card-player-text" in run_js and "bindRunInlineActions(card)" in run_js, "")
    add(checks, "Run Mode system copy shortcuts are not swallowed", "event.metaKey || event.ctrlKey || event.altKey" in run_js and "hasTextSelection()" in run_js, "")
    add(checks, "Run Mode supports explicit GM read-aloud chunks", "gmReadAloud" in run_js and "GM read-aloud" in run_js, "")
    add(checks, "entity image show-to-players buttons are wired", "data-show-entity-image" in run_js and "showEntityImageToPlayers" in run_js, "")
    add(checks, "per-character Run Mode panel and cue buttons are wired", "perCharacterPanel" in run_js and "data-character-cue-index" in run_js and "showCharacterCueToPlayers" in run_js, "")
    add(checks, "per-character panel supports roster-aware filtering", "activePerCharacterEntries" in run_js and "pcProfileExplicitlyPresent" in run_js and "pc_profiles" in run_js, "")
    add(checks, "GM-side mechanics and takeaways use cue-card links", "inline-mechanic-link" in run_js and "data-takeaway-kind" in run_js and "fillTakeaway" in run_js and "data-mechanic" in run_js, "")
    add(checks, "standalone Will alias is excluded from cue-card matching", 'IGNORED_ENTITY_ALIASES = new Set(["will"])' in run_js, "")
    player_display_cue_leaks = [term for term in ["data-entity", "data-mechanic", "data-takeaway-kind", "inline-mechanic-link", "inline-entity-link"] if term in player_js or term in display_html]
    add(checks, "player display has no cue-card/linkification hooks", not player_display_cue_leaks, player_display_cue_leaks)

    static_pages = sorted((DIST / "pages").rglob("*.html"))
    static_page_text = {str(path.relative_to(DIST)): path.read_text(encoding="utf-8", errors="ignore") for path in static_pages}
    missing_display_sync = [rel for rel, text in static_page_text.items() if "js/display-sync.js" not in text]
    add(checks, "generated wiki pages load player-display sync", not missing_display_sync, missing_display_sync[:10])

    cue_html = static_page_text.get("pages/session-zero-cue-cards.html", "")
    add(checks, "cue cards expose player-safe throw payloads", "session-zero-cue-card" in cue_html and "data-player-display-payload" in cue_html, "")
    add(checks, "cue card text chunks preserve selectable body/actions split", "throwable-text-body" in cue_html and "throwable-text-actions" in cue_html, "")
    gm_cue_blocks = re.findall(r"<details>\s*<summary>GM cue</summary>[\s\S]*?</details>", cue_html)
    gm_cue_payloads = [block[:200] for block in gm_cue_blocks if "data-player-display-payload" in block]
    add(checks, "cue card GM cues are not throwable", not gm_cue_payloads, gm_cue_payloads[:3])
    all_static_html = "\n".join(static_page_text.values())
    add(checks, "image throw buttons use Player Display icon", "live-player-display.png" in all_static_html and "throwable-image-send" in all_static_html, "")
    add(checks, "text throw buttons use reveal icon", "action-reveal.png" in all_static_html and "throwable-send-text" in all_static_html, "")
    add(checks, "quick-copy text buttons are generated", "action-copy.png" in all_static_html and "data-copy-player-payload" in all_static_html, "")
    static_css = (DIST / "styles.css").read_text(encoding="utf-8", errors="ignore") if (DIST / "styles.css").exists() else ""
    add(checks, "throwable text controls do not block native selection", "user-select: text" in static_css and ".throwable-text-actions" in static_css and "user-select: none" in static_css, "")
    add(checks, "cue-card image CSS does not override send icon", ".cue-card-art > img" in static_css and ".cue-card-art .throwable-image-send img" in static_css and "max-height: none" in static_css, "")
    app_js = (DIST / "app.js").read_text(encoding="utf-8", errors="ignore") if (DIST / "app.js").exists() else ""
    add(checks, "static hover-card image/text controls are generated and rebound", "hover-card-media-wrap throwable-image-inline" in app_js and "staticThrowableTextChunk" in app_js and "setupPlayerSafeActions();" in app_js and "playerActionBound" in app_js, "")
    run_css = (DIST / "css" / "run-mode.css").read_text(encoding="utf-8", errors="ignore") if (DIST / "css" / "run-mode.css").exists() else ""
    add(checks, "spotlight tray is tucked and expandable", all(token in run_js for token in ["SPOTLIGHT_PANEL_KEY", "SPOTLIGHT_ATTENTION_KEY", "data-spotlight-toggle", "function setSpotlightTrayOpen"]) and all(token in run_css for token in [".spotlight-tray-toggle", ".spotlight-tray-body", ".spotlight-channel[hidden]", "spotlight-tray-nudge"]), "")
    add(checks, "Run Clock controls are not countdown cue-card references", all(token not in run_html for token in ['data-run-clock-start data-mechanic="countdown"', 'data-run-clock-toggle data-mechanic="countdown"', 'data-mechanic="countdown">Run Clock']) and "data-run-clock-start data-mechanic" not in run_js, "")
    add(checks, "Run Mode hover cards can be closed, temporarily suppressed, and avoid blocking new chips", all(token in run_js for token in ["data-hover-card-close", "suppressedTarget", "activeTarget", "close(true)"]) and "#hover-card.is-visible { pointer-events: none; }" in run_css and "#hover-card .hover-card-close" in run_css, "")
    add(checks, "optional Run Mode panels start collapsed by default", all(token not in run_js for token in ['per-character-panel" open', 'story-scope-panel" open', 'world-connection-panel" open', 'map-actions-panel" open', 'open><summary>Scene mechanics', 'open><summary>Roll cards', 'open><summary>Relevant state controls', 'open><summary>Key entities']) and 'player-beat-panel" open' in run_js, "")
    add(checks, "Run Clock has one canonical reset control plus explicit restart", "data-run-clock-restart" in run_html and "data-run-clock-restart" in app_js and "function runClockRestart" in app_js and run_html.count("data-run-clock-reset") == 1, {"resetCount": run_html.count("data-run-clock-reset"), "restartInHtml": "data-run-clock-restart" in run_html, "restartInJs": "data-run-clock-restart" in app_js})
    add(checks, "Run Clock uses explicit status/elapsed state model", "status: safeStatus" in app_js and "elapsedMs" in app_js and "segmentIndex" in app_js and "sceneIndex" in app_js and "sceneStartMs" in app_js and "segmentStartMs" in app_js, "")
    add(checks, "Run Clock reset stops at idle zero instead of hiding/deleting", "function runClockReset" in app_js and 'newRunClockState(Date.now(), existing.settings, "stopped")' in app_js and "localStorage.removeItem(runClockKey)" not in app_js, "")
    add(checks, "Run Clock start/pause/stop handlers use canonical functions", "function runClockStart" in app_js and "function runClockPauseToggle" in app_js and "function runClockStop" in app_js and "syncRunClockLoop" in app_js, "")
    add(checks, "Run Clock has scene, segment, session, and break settings", all(term in run_html for term in ["data-run-clock-scene-target", "data-run-clock-session-target", "scenePacingAlerts", "playerBreakAlerts", "softCheckIns"]), "")
    add(checks, "Run Clock alert ladder includes scene/segment/session thresholds", all(term in app_js for term in ["Scene boundary soon", "Scene overrun", "Five-minute pacing nudge", "Soft wall reached", "Hard wall reached", "Nominal session target reached"]), "")
    add(checks, "Run Clock player-facing notices are break-only", "runClockMaybeSendPlayerBreakNotice" in app_js and "notice.playerSafe" in app_js and "action !== \"break\"" in app_js, "")
    clock_css_blob = static_css + "\n" + run_css
    add(checks, "Run Clock critical layer has visible styling", ".run-clock.is-critical" in clock_css_blob and "run-clock-modal" in clock_css_blob, "")

    unsafe_payload_blocks: list[dict[str, str]] = []
    for rel, text in static_page_text.items():
        for marker in ["gm-block", "source-reference", "dev-only", "prompt-block"]:
            for match in re.finditer(rf'class="[^"]*{re.escape(marker)}[^"]*"', text):
                end = text.find("</div>", match.end())
                if end < 0:
                    end = text.find("</details>", match.end())
                segment = text[match.start(): end if end > 0 else match.start() + 1200]
                if "data-player-display-payload" in segment:
                    unsafe_payload_blocks.append({"file": rel, "marker": marker})
                    break
        if "Hidden Truth Layer" in text:
            start = text.find("Hidden Truth Layer")
            end = text.find("</details>", start)
            segment = text[start:end if end > start else start + 1200]
            if "data-player-display-payload" in segment:
                unsafe_payload_blocks.append({"file": rel, "marker": "Hidden Truth Layer"})
    add(checks, "GM-only/source/dev/hidden-truth blocks have no throw payloads", not unsafe_payload_blocks, unsafe_payload_blocks[:10])

    banned_static: list[dict[str, str]] = []
    for rel, text in [("player-display.html", display_html), ("player-follow.html", follow_html)]:
        for pattern in BANNED_PLAYER_PATTERNS:
            if pattern.search(text):
                banned_static.append({"file": rel, "pattern": pattern.pattern})
    add(checks, "player static pages have no GM/dev strings", not banned_static, banned_static)
    return slides, scenes


@contextlib.contextmanager
def static_server():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *_args):  # noqa: D401
            return

    class QuietTCPServer(socketserver.TCPServer):
        def handle_error(self, request, client_address):  # noqa: D401
            return

    with QuietTCPServer(("127.0.0.1", 0), Handler) as httpd:
        httpd.allow_reuse_address = True
        port = httpd.server_address[1]
        old_cwd = Path.cwd()
        try:
            import os

            os.chdir(DIST)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            yield f"http://127.0.0.1:{port}"
        finally:
            httpd.shutdown()
            httpd.server_close()
            import os

            os.chdir(old_cwd)


def browser_checks(checks: list[dict[str, Any]]) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:  # pragma: no cover - environment failure path
        if node_browser_checks(checks, str(exc)):
            return
        add(checks, "Playwright available for rendered slideshow QA", False, str(exc))
        return

    browser = None
    slides_for_count = read_json(DIST / "data" / "slides.json") if (DIST / "data" / "slides.json").exists() else []
    with static_server() as base_url:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1366, "height": 768}, permissions=["clipboard-read", "clipboard-write"])
            run = context.new_page()
            player = context.new_page()
            run.goto(f"{base_url}/run.html?slide=S01-01", wait_until="domcontentloaded")
            player.goto(f"{base_url}/player-display.html?slide=S01-01", wait_until="domcontentloaded")
            run.wait_for_selector("[data-slide-root] h2", timeout=10000)
            player.wait_for_selector("#player-screen", timeout=10000)

            def run_state() -> dict:
                return run.evaluate("() => JSON.parse(localStorage.getItem('goldspire-run-mode-state-v1') || '{}')")

            def current_id() -> str:
                return run_state().get("currentSlideId", "")

            add(checks, "run.html rendered current slide", bool(run.locator("[data-slide-root] h2").inner_text()), run.locator("[data-slide-root] h2").inner_text())
            add(checks, "run icon buttons have accessible names", run.locator(".run-icon-button:not([aria-label])").count() == 0, run.locator(".run-icon-button:not([aria-label])").count())
            add(checks, "slide images have alt text", run.locator(".slide-media img:not([alt])").count() == 0, run.locator(".slide-media img:not([alt])").count())
            add(checks, "Run Mode music controls render", run.locator("[data-music-player]").count() == 1 and run.locator("[data-music-track] option").count() > 0, run.locator("[data-music-track] option").count())
            music_panel = run.locator("[data-music-panel]")
            add(checks, "Run Mode music panel starts collapsed in browser", music_panel.evaluate("node => !node.open"), "")
            side_before = run.locator(".run-side-panel").bounding_box() or {}
            heading_before = run.locator("[data-slide-root] h2").bounding_box() or {}
            music_panel.locator("summary").click()
            add(checks, "Run Mode music panel expands on demand", music_panel.evaluate("node => node.open"), "")
            side_after = run.locator(".run-side-panel").bounding_box() or {}
            heading_after = run.locator("[data-slide-root] h2").bounding_box() or {}
            music_overlay_stable = (
                bool(side_before and side_after and heading_before and heading_after)
                and abs(side_before.get("height", 0) - side_after.get("height", 0)) < 2
                and abs(heading_before.get("y", 0) - heading_after.get("y", 0)) < 2
            )
            add(checks, "music sheet opens without moving side panel or active slide", music_overlay_stable, {"sideBefore": side_before, "sideAfter": side_after, "headingBefore": heading_before, "headingAfter": heading_after})
            add(checks, "Player Display has single music audio output", player.locator("[data-music-audio]").count() == 1 and run.locator("[data-music-audio]").count() == 0, "")
            run.locator('[data-music-action="play-pause"]').click()
            player.wait_for_function("() => !!document.querySelector('[data-music-audio]')?.getAttribute('src')", timeout=5000)
            first_music_src = player.evaluate("() => document.querySelector('[data-music-audio]')?.getAttribute('src') || ''")
            add(checks, "music play command reaches Player Display audio element", "assets/audio/" in first_music_src and first_music_src.endswith(".mp3"), first_music_src)
            run.locator('[data-music-action="next"]').click()
            player.wait_for_function("(oldSrc) => (document.querySelector('[data-music-audio]')?.getAttribute('src') || '') !== oldSrc", arg=first_music_src, timeout=5000)
            next_music_src = player.evaluate("() => document.querySelector('[data-music-audio]')?.getAttribute('src') || ''")
            add(checks, "music next command changes Player Display audio source", next_music_src != first_music_src and next_music_src.endswith(".mp3"), {"before": first_music_src, "after": next_music_src})
            run.locator('[data-music-action="lobby-volume"]').click()
            player.wait_for_function("() => Math.abs((document.querySelector('[data-music-audio]')?.volume || 0) - 0.45) < 0.02", timeout=5000)
            add(checks, "music volume command reaches Player Display", abs(player.evaluate("() => document.querySelector('[data-music-audio]')?.volume || 0") - 0.45) < 0.02, "")
            run.locator('[data-music-action="play-pause"]').click()
            run.locator('[data-music-action="collapse-panel"]').click()
            run.locator(".run-side-panel [data-run-clock-start]").hover()
            run.wait_for_timeout(350)
            add(checks, "Start Run Clock hover does not open countdown cue card", run.locator("#hover-card.is-visible").count() == 0, "")

            run.evaluate(
                """() => {
                  localStorage.removeItem('goldspire-run-spotlights-v1');
                  localStorage.removeItem('goldspire-run-spotlight-panel-open-v1');
                  localStorage.removeItem('goldspire-run-spotlight-attention-v1');
                }"""
            )
            run.goto(f"{base_url}/run.html?slide=S01-03", wait_until="domcontentloaded")
            run.wait_for_selector("[data-spotlight-toggle]", timeout=10000)
            spotlight_body_hidden = run.locator("[data-spotlight-tray-body]").evaluate("node => node.hidden")
            spotlight_attention = run.locator("[data-spotlight-channel]").evaluate("node => node.classList.contains('has-active') && node.classList.contains('has-attention')")
            add(checks, "spotlight tray starts tucked with active-slide attention", spotlight_body_hidden and spotlight_attention, "")
            run.locator("[data-spotlight-toggle]").click()
            run.wait_for_selector("[data-spotlight-card]", timeout=5000)
            add(checks, "spotlight tray expands on click", run.locator("[data-spotlight-card]").count() > 0 and not run.locator("[data-spotlight-tray-body]").evaluate("node => node.hidden"), "")
            run.evaluate(
                """() => {
                  const state = { acknowledged: {}, snoozed: {}, characters: {} };
                  (window.GOLDSPIRE_SLIDES || []).forEach((slide) => {
                    (slide.spotlights || []).forEach((spotlight) => {
                      if (spotlight.spotlight_id) state.acknowledged[spotlight.spotlight_id] = Date.now();
                      if (spotlight.type === 'character' && spotlight.character_ref) {
                        state.characters[spotlight.character_ref] = state.characters[spotlight.character_ref] || {};
                        state.characters[spotlight.character_ref][spotlight.half || 'early'] = true;
                      }
                    });
                  });
                  localStorage.setItem('goldspire-run-spotlights-v1', JSON.stringify(state));
                  localStorage.removeItem('goldspire-run-spotlight-panel-open-v1');
                }"""
            )
            run.reload(wait_until="domcontentloaded")
            run.wait_for_selector("[data-slide-root] h2", timeout=10000)
            run.wait_for_timeout(500)
            add(checks, "spotlight tray hides when there is no active or pending content", run.locator("[data-spotlight-channel]").evaluate("node => node.hidden || !node.textContent.trim()"), "")

            run.evaluate("() => localStorage.removeItem('goldspire-run-mode-state-v1')")
            run.goto(f"{base_url}/run.html?slide=PROLOGUE", wait_until="domcontentloaded")
            run.wait_for_selector("[data-slide-root] h2", timeout=10000)
            add(checks, "PROLOGUE has inline player-safe throw controls", run.locator('.progressive-active-beat [data-run-inline-action="send-text"]').count() > 0 and run.locator('.progressive-active-beat [data-run-inline-action="copy-text"]').count() > 0, "")
            add(checks, "action-only GM script block is not throwable", run.locator('.progressive-gm-script [data-run-inline-action]').count() == 0, "")
            add(checks, "explicit GM read-aloud block is throwable", run.locator('.progressive-gm-readaloud [data-run-inline-action="send-text"]').count() > 0, "")

            run.evaluate(
                """() => {
                  const target = document.querySelector('#run-position');
                  const range = document.createRange();
                  range.selectNodeContents(target);
                  const selection = window.getSelection();
                  selection.removeAllRanges();
                  selection.addRange(range);
                }"""
            )
            run.keyboard.press("Meta+C")
            native_copy = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            if "Slide" not in native_copy:
                run.keyboard.press("Control+C")
                native_copy = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            add(checks, "Run Mode native copy shortcut copies selected text", "Slide" in native_copy and "PROLOGUE" in native_copy, native_copy)

            run.evaluate("() => { window.getSelection()?.removeAllRanges(); navigator.clipboard.writeText('').catch(() => {}); }")
            run.keyboard.press("c")
            shortcut_copy = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            add(checks, "unmodified c still copies current player text", bool(shortcut_copy.strip()) and "Slide" not in shortcut_copy, shortcut_copy[:120])

            run.locator('.progressive-active-beat [data-run-inline-action="copy-text"]').first.click()
            inline_copy = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            add(checks, "inline Run Mode copy copies only selected chunk", "capital" in inline_copy.lower() or "courier" in inline_copy.lower(), inline_copy[:160])

            run.locator('.progressive-active-beat [data-run-inline-action="send-text"]').first.click()
            player.wait_for_function("() => document.body.dataset.displayMode === 'read-aloud-fullscreen'", timeout=5000)
            inline_player_text = player.locator(".player-text-fullscreen").inner_text()
            add(checks, "inline Run Mode send shows selected chunk on Player Display", "capital" in inline_player_text.lower() or "courier" in inline_player_text.lower(), inline_player_text[:160])

            run.goto(f"{base_url}/run.html?slide=S03-02", wait_until="domcontentloaded")
            run.wait_for_selector("[data-slide-root] h2", timeout=10000)
            run.wait_for_selector(".entity-panel", state="attached", timeout=10000)
            optional_panels_closed = run.evaluate(
                """() => {
                  const optional = [...document.querySelectorAll('.per-character-panel, .entity-panel, .story-scope-panel, .world-connection-panel, .map-actions-panel')];
                  const playerBeatsOpen = [...document.querySelectorAll('.player-beat-panel')].every((panel) => panel.open);
                  return optional.length > 0 && optional.every((panel) => !panel.open) && playerBeatsOpen;
                }"""
            )
            add(checks, "optional Run Mode reference panels are collapsed while player beats stay open", optional_panels_closed, "")
            run.locator(".entity-panel").evaluate("(node) => { node.open = true; }")
            run.wait_for_selector('#run-slide-root [data-entity="goldspire-waymarkers"]', state="visible", timeout=10000)
            run.locator('#run-slide-root [data-entity="goldspire-waymarkers"]').first.hover()
            run.wait_for_selector('#hover-card.is-visible .hover-card-media-wrap [data-run-inline-action="send-image"]', timeout=5000)
            hover_image_controls = run.locator('#hover-card .hover-card-media-wrap [data-run-inline-action="send-image"]').count()
            hover_text_controls = run.locator('#hover-card .hover-card-player-text [data-run-inline-action="send-text"]').count()
            add(checks, "Run Mode entity hover-card image/text controls appear", hover_image_controls > 0 and hover_text_controls > 0, {"hoverImageControls": hover_image_controls, "hoverTextControls": hover_text_controls})
            run.locator('#hover-card .hover-card-media-wrap [data-run-inline-action="send-image"]').click()
            player.wait_for_function("() => document.body.dataset.displayMode === 'image-title-caption'", timeout=5000)
            hover_player_title = player.locator(".player-caption h1").inner_text()
            add(checks, "Run Mode entity hover-card image sends to Player Display", bool(re.search("Goldspire Waymarkers", hover_player_title, re.I)), hover_player_title)
            add(checks, "Run Mode hover-card close button appears", run.locator("#hover-card [data-hover-card-close]").count() == 1, "")
            run.locator("#hover-card [data-hover-card-close]").click()
            run.wait_for_function("() => !document.querySelector('#hover-card')?.classList.contains('is-visible')", timeout=2000)
            add(checks, "Run Mode hover-card close hides cue card", run.locator("#hover-card.is-visible").count() == 0, "")
            run.locator("#run-position").hover()
            run.wait_for_timeout(450)
            run.locator('#run-slide-root [data-entity="goldspire-waymarkers"]').first.hover()
            run.wait_for_selector("#hover-card.is-visible", timeout=5000)
            add(checks, "Run Mode hover-card reappears after pointer-away rehover", run.locator("#hover-card.is-visible").count() == 1, "")

            run.goto(f"{base_url}/pages/session-zero-cue-cards.html", wait_until="domcontentloaded")
            run.wait_for_selector(".session-zero-cue-card", timeout=10000)
            run.locator(".throwable-text-body").first.evaluate(
                """(target) => {
                  const range = document.createRange();
                  range.selectNodeContents(target);
                  const selection = window.getSelection();
                  selection.removeAllRanges();
                  selection.addRange(range);
                }"""
            )
            run.keyboard.press("Meta+C")
            cue_native_copy = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            if "beginner-friendly" not in cue_native_copy.lower():
                run.keyboard.press("Control+C")
                cue_native_copy = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            add(checks, "cue-card native copy shortcut copies selected text", "beginner-friendly" in cue_native_copy.lower(), cue_native_copy[:160])
            run.locator(".cue-card-art").first.hover()
            run.wait_for_function("() => Number(getComputedStyle(document.querySelector('.cue-card-art .throwable-image-send')).opacity) > 0.5", timeout=2000)
            cue_icon_opacity = run.locator(".cue-card-art .throwable-image-send").first.evaluate("(node) => getComputedStyle(node).opacity")
            add(checks, "cue-card image hover reveals send icon", float(cue_icon_opacity) > 0.5, cue_icon_opacity)

            run.evaluate("() => localStorage.removeItem('goldspire-run-mode-state-v1')")
            run.goto(f"{base_url}/run.html?slide=S01-01", wait_until="domcontentloaded")
            run.wait_for_selector("[data-slide-root] h2", timeout=10000)

            add(checks, "Run Mode has side deck arrows", run.locator(".deck-arrow-prev").count() == 1 and run.locator(".deck-arrow-next").count() == 1, "")
            add(checks, "thumbnail scrubber uses slide images", run.locator(".scrub-dot img").count() >= len(slides_for_count) - 1, run.locator(".scrub-dot img").count())
            run_image = run.locator(".slide-media img").first
            image_box = run_image.bounding_box()
            add(checks, "Run Mode shows visible slide image anchor by default", bool(image_box and image_box["width"] > 480 and image_box["height"] > 240), image_box)
            add(checks, "current slide completion checkbox is visible", run.locator("[data-run-current-complete]").count() == 1, "")
            add(checks, "Run Mode details live inside slide card", run.locator("[data-slide-root] .run-detail-stack").count() == 1, "")

            run.locator('[data-run-action="toggle-image"]').click()
            add(checks, "image can be hidden from Run Mode", run.locator(".slide-media").first.bounding_box() is None, "")
            run.locator('[data-run-action="toggle-image"]').click()
            add(checks, "image can be restored in Run Mode", run.locator(".slide-media").first.bounding_box() is not None, "")
            if run.locator(".run-scrubber-track").first.bounding_box() is None:
                run.locator('[data-run-action="toggle-filmstrip"]').first.click()
            run.locator('[data-run-action="toggle-filmstrip"]').first.click()
            add(checks, "filmstrip can be hidden from Run Mode", run.locator(".run-scrubber-track").first.bounding_box() is None, "")
            run.locator('[data-run-action="toggle-filmstrip"]').first.click()
            add(checks, "filmstrip can be restored in Run Mode", run.locator(".run-scrubber-track").first.bounding_box() is not None, "")

            run.locator('[data-run-go-slide="CHEAT-CONDITIONS"]').click()
            condition_text = run.locator(".cheat-reference-list").inner_text()
            add(checks, "condition cheat slide shows real content by default", "Vulnerable" in condition_text or "Restrained" in condition_text or "Hidden" in condition_text, condition_text[:200])
            run.locator('[data-run-go-slide="CHEAT-PC"]').click()
            pc_text = run.locator(".cheat-reference-list").inner_text()
            add(checks, "PC cheat slide shows real stats by default", "Evasion" in pc_text and "Traits:" in pc_text and "Experiences:" in pc_text, pc_text[:240])
            run.locator('[data-run-go-slide="CHEAT-LOOT"]').click()
            loot_text = run.locator(".cheat-reference-list").inner_text()
            add(checks, "loot cheat slide shows real content by default", "Hexmart" in loot_text or "Pocket Ward" in loot_text or "Stride Salve" in loot_text, loot_text[:240])
            buttons = run.locator(".run-cheat-menu button").evaluate_all("(nodes) => nodes.map((n) => n.textContent.trim())")
            fixed_shortcuts = ["1 GM Rules", "2 Conditions", "3 PCs", "4 Loot", "5 Pronunciation", "6 Sablewood"]
            add(checks, "Run Mode fixed shortcut order is protected", buttons[:6] == fixed_shortcuts, buttons)
            add(checks, "Run Mode pinned shortcut strip starts empty", buttons == fixed_shortcuts, buttons)
            add(checks, "Run Mode floating quick reference exists", run.locator("[data-run-quick-ref]").count() == 1, "")

            run.evaluate("() => localStorage.removeItem('goldspire-run-mode-state-v1')")
            run.goto(f"{base_url}/run.html?slide=S01-01", wait_until="domcontentloaded")
            run.wait_for_selector("[data-slide-root] h2", timeout=10000)
            run.locator('[data-run-action="pin"]').click()
            first_pin_state = run_state().get("pinnedSlides", [])
            first_pin_buttons = run.locator(".run-cheat-menu button").evaluate_all("(nodes) => nodes.map((n) => n.textContent.trim())")
            add(checks, "Pin current slide assigns shortcut 7 after fixed shortcuts", first_pin_state == ["S01-01"] and len(first_pin_buttons) > 6 and first_pin_buttons[6].startswith("7 Latest"), {"state": first_pin_state, "buttons": first_pin_buttons})

            run.locator(".deck-arrow-next").click()
            moved_after_pin = current_id()
            run.keyboard.press("p")
            add(checks, "P jumps to latest pinned slide", current_id() == "S01-01", {"from": moved_after_pin, "actual": current_id()})
            run.locator(".deck-arrow-next").click()
            run.keyboard.press("7")
            add(checks, "7 jumps to first pinned slide", current_id() == "S01-01", current_id())

            for slide_id in ["S02-01", "S03-02", "S04-01"]:
                run.locator(f'[data-scrub-slide-id="{slide_id}"]').evaluate("(node) => node.click()")
                run.locator('[data-run-action="pin"]').click()
            four_pin_state = run_state().get("pinnedSlides", [])
            four_pin_buttons = run.locator(".run-cheat-menu button").evaluate_all("(nodes) => nodes.map((n) => n.textContent.trim())")
            add(checks, "Pinned slides fill 7/8/9/0 in recency order", four_pin_state == ["S04-01", "S03-02", "S02-01", "S01-01"] and [text.split()[0] for text in four_pin_buttons[6:10]] == ["7", "8", "9", "0"], {"state": four_pin_state, "buttons": four_pin_buttons})
            run.keyboard.press("0")
            add(checks, "0 jumps to oldest pinned slide", current_id() == "S01-01", current_id())

            run.locator('[data-scrub-slide-id="S05-01"]').evaluate("(node) => node.click()")
            run.locator('[data-run-action="pin"]').click()
            capped_pin_state = run_state().get("pinnedSlides", [])
            run.keyboard.press("0")
            add(checks, "Fifth pin drops oldest shortcut and keeps four pins", capped_pin_state == ["S05-01", "S04-01", "S03-02", "S02-01"] and current_id() == "S02-01", {"state": capped_pin_state, "after_0": current_id()})

            before = current_id()
            run.locator(".deck-arrow-next").click()
            after_next = current_id()
            add(checks, "Next control advances slide", after_next != before, {"before": before, "after": after_next})

            run.locator(".deck-arrow-prev").click()
            add(checks, "Previous control moves back", current_id() == before, {"expected": before, "actual": current_id()})

            run.keyboard.press("ArrowRight")
            after_arrow = current_id()
            add(checks, "ArrowRight advances slide", after_arrow != before, {"before": before, "after": after_arrow})

            run.locator(".run-scratch summary").click()
            run.locator("#run-scratch-note").fill("Typing should block shortcuts")
            typed_before = current_id()
            run.keyboard.press("ArrowRight")
            add(checks, "shortcuts do not fire while typing", current_id() == typed_before, {"before": typed_before, "after": current_id()})
            run.keyboard.press("p")
            run.keyboard.press("7")
            add(checks, "pinned shortcuts do not fire while typing", current_id() == typed_before, {"before": typed_before, "after": current_id()})
            run.locator("#run-slide-select").focus()
            run.keyboard.press("Escape")

            run.locator('[data-scrub-slide-id="S03-02"]').evaluate("(node) => node.click()")
            add(checks, "scrubber jumps between slides", current_id() == "S03-02", current_id())

            run.locator("#run-auto-complete").set_checked(True)
            run.evaluate(
                """() => {
                  const state = JSON.parse(localStorage.getItem('goldspire-run-mode-state-v1') || '{}');
                  state.currentSlideId = 'S01-01';
                  state.completedSlides = [];
                  state.autoCompletePreviousSceneOnNext = true;
                  localStorage.setItem('goldspire-run-mode-state-v1', JSON.stringify(state));
                }"""
            )
            run.reload(wait_until="domcontentloaded")
            run.locator(".deck-arrow-next").click()
            completed = run_state().get("completedSlides", [])
            undo_visible = run.locator('[data-run-action="undo-complete"]').count() == 1
            run.locator('[data-run-action="undo-complete"]').click()
            undone = run_state().get("completedSlides", [])
            run.reload(wait_until="domcontentloaded")
            completed_after_reload = run_state().get("completedSlides", [])
            add(checks, "completion state persists", "S01-01" in completed, completed)
            add(checks, "auto-complete can be undone", undo_visible and "S01-01" not in undone and "S01-01" not in completed_after_reload, {"undo_visible": undo_visible, "after_undo": undone, "after_reload": completed_after_reload})

            run.locator('[data-scrub-slide-id="S03-02"]').evaluate("(node) => node.click()")
            player.wait_for_function("() => document.body.dataset.displayMode === 'image-title-caption'", timeout=5000)
            player_title = player.locator(".player-caption h1").inner_text()
            add(checks, "player display receives setSlide messages", "Local Clues" in player_title, player_title)

            run.locator('[data-run-action="blackout"]').click()
            player.wait_for_function("() => document.body.dataset.displayMode === 'blackout'", timeout=5000)
            add(checks, "blackout works", player.evaluate("() => document.body.dataset.displayMode") == "blackout", "")

            run.locator('[data-run-action="show-image"]').first.click()
            player.wait_for_function("() => document.body.dataset.displayMode === 'image-only'", timeout=5000)
            player.wait_for_function("() => !!document.querySelector('.player-slide img')?.naturalWidth", timeout=5000)
            image_ok = player.evaluate("() => !!document.querySelector('.player-slide img')?.complete && document.querySelector('.player-slide img')?.naturalWidth > 0")
            add(checks, "Show Image to Players works", image_ok, "")

            run.locator('[data-run-action="show-text"]').first.click()
            player.wait_for_function("() => document.body.dataset.displayMode === 'read-aloud-fullscreen'", timeout=5000)
            text_visible = player.locator(".player-text-fullscreen").inner_text()
            add(checks, "Show Text to Players works", bool(text_visible.strip()), text_visible[:120])

            run.locator('[data-run-action="expand-image"]').click()
            add(checks, "image expansion works", run.locator("#run-image-dialog[open]").count() == 1, "")
            run.keyboard.press("Escape")
            run.locator('[data-run-action="show-text"]').first.click()
            player.wait_for_function("() => document.body.dataset.displayMode === 'read-aloud-fullscreen'", timeout=5000)
            add(checks, "Full tool sends fullscreen player text", player.evaluate("() => document.body.dataset.displayMode") == "read-aloud-fullscreen", "")

            run.locator('[data-run-action="copy-text"]').first.click()
            clipboard_text = run.evaluate("() => navigator.clipboard.readText().catch(() => '')")
            add(checks, "Copy Player Text works or has fallback", bool(clipboard_text) or "prompt(" in (DIST / "js" / "run-mode.js").read_text(encoding="utf-8"), clipboard_text[:80] if clipboard_text else "fallback present")

            run.keyboard.press("?")
            add(checks, "shortcut help opens", run.locator("#shortcut-help[open]").count() == 1, "")
            run.keyboard.press("Escape")

            player_text = player.locator("body").inner_text()
            leaked = [pattern.pattern for pattern in BANNED_PLAYER_PATTERNS if pattern.search(player_text)]
            add(checks, "player display has no GM/dev content", not leaked, leaked)

            run.goto(f"{base_url}/player-follow.html?slide=S03-02", wait_until="domcontentloaded")
            add(checks, "player-follow supports direct slide links", "Local Clues" in run.locator("#follow-current").inner_text(), run.locator("#follow-current").inner_text()[:120])

            context.close()
            browser.close()
            browser = None
    if browser is not None:
        browser.close()


def node_browser_checks(checks: list[dict[str, Any]], python_error: str) -> bool:
    """Fallback rendered QA using bundled Node Playwright when Python lacks it."""
    node = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
    node_modules = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
    if not node.exists() or not node_modules.exists():
        return False
    chrome = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    script = r"""
const { chromium } = require('playwright');
const checks = [];
const add = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const banned = [/GM-only/i, /GM notes?/i, /image prompt/i, /asset status/i, /future spoiler/i, /secret lore/i, /dev mode/i, /continuity instruction/i];
const renderTimeout = 30000;
async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const run = await context.newPage();
    const player = await context.newPage();
    const base = process.env.BASE_URL;
    await run.goto(`${base}/run.html?slide=S01-01`, { waitUntil: 'domcontentloaded' });
    await player.goto(`${base}/player-display.html?slide=S01-01`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-slide-root] h2', { timeout: renderTimeout });
    await player.waitForSelector('#player-screen', { timeout: renderTimeout });
    add('Playwright available for rendered slideshow QA', true, 'node-playwright fallback; Python module missing: ' + process.env.PYTHON_PLAYWRIGHT_ERROR);
    const state = async () => JSON.parse(await run.evaluate(() => localStorage.getItem('goldspire-run-mode-state-v1') || '{}'));
    const currentId = async () => (await state()).currentSlideId || '';
    const title = await run.locator('[data-slide-root] h2').innerText();
    add('run.html rendered current slide', title.length > 0, title);
    add('run icon buttons have accessible names', await run.locator('.run-icon-button:not([aria-label])').count() === 0, '');
    add('slide images have alt text', await run.locator('.slide-media img:not([alt])').count() === 0, '');
    const musicOptions = await run.locator('[data-music-track] option').count();
    add('Run Mode music controls render', await run.locator('[data-music-player]').count() === 1 && musicOptions > 0, musicOptions);
    const musicPanel = run.locator('[data-music-panel]');
    add('Run Mode music panel starts collapsed in browser', await musicPanel.evaluate((node) => !node.open), '');
    const sideBeforeMusic = await run.locator('.run-side-panel').boundingBox();
    const headingBeforeMusic = await run.locator('[data-slide-root] h2').boundingBox();
    await musicPanel.locator('summary').click();
    add('Run Mode music panel expands on demand', await musicPanel.evaluate((node) => node.open), '');
    const sideAfterMusic = await run.locator('.run-side-panel').boundingBox();
    const headingAfterMusic = await run.locator('[data-slide-root] h2').boundingBox();
    const musicOverlayStable = !!sideBeforeMusic && !!sideAfterMusic && !!headingBeforeMusic && !!headingAfterMusic
      && Math.abs(sideBeforeMusic.height - sideAfterMusic.height) < 2
      && Math.abs(headingBeforeMusic.y - headingAfterMusic.y) < 2;
    add('music sheet opens without moving side panel or active slide', musicOverlayStable, { sideBeforeMusic, sideAfterMusic, headingBeforeMusic, headingAfterMusic });
    add('Player Display has single music audio output', await player.locator('[data-music-audio]').count() === 1 && await run.locator('[data-music-audio]').count() === 0, '');
    await run.locator('[data-music-action="play-pause"]').click();
    await player.waitForFunction(() => !!document.querySelector('[data-music-audio]')?.getAttribute('src'), null, { timeout: 5000 });
    const firstMusicSrc = await player.evaluate(() => document.querySelector('[data-music-audio]')?.getAttribute('src') || '');
    add('music play command sets Player Display audio source', firstMusicSrc.includes('assets/audio/') && firstMusicSrc.endsWith('.mp3'), firstMusicSrc);
    await run.locator('[data-music-action="next"]').click();
    await player.waitForFunction((oldSrc) => (document.querySelector('[data-music-audio]')?.getAttribute('src') || '') !== oldSrc, firstMusicSrc, { timeout: 5000 });
    const nextMusicSrc = await player.evaluate(() => document.querySelector('[data-music-audio]')?.getAttribute('src') || '');
    add('music next command changes Player Display audio source', nextMusicSrc !== firstMusicSrc && nextMusicSrc.includes('assets/audio/') && nextMusicSrc.endsWith('.mp3'), nextMusicSrc);
    await run.locator('[data-music-action="lobby-volume"]').click();
    await player.waitForFunction(() => Math.abs((document.querySelector('[data-music-audio]')?.volume || 0) - 0.45) < 0.02, null, { timeout: 5000 });
    const musicVolume = await player.evaluate(() => document.querySelector('[data-music-audio]')?.volume || 0);
    add('music volume command reaches Player Display', Math.abs(musicVolume - 0.45) < 0.02, musicVolume);
    await run.locator('[data-music-action="play-pause"]').click();
    await run.locator('[data-music-action="collapse-panel"]').click();
    await run.locator('.run-side-panel [data-run-clock-start]').hover();
    await run.waitForTimeout(350);
    add('Start Run Clock hover does not open countdown cue card', await run.locator('#hover-card.is-visible').count() === 0, '');
    await run.evaluate(() => {
      localStorage.removeItem('goldspire-run-spotlights-v1');
      localStorage.removeItem('goldspire-run-spotlight-panel-open-v1');
      localStorage.removeItem('goldspire-run-spotlight-attention-v1');
    });
    await run.goto(`${base}/run.html?slide=S01-03`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-spotlight-toggle]', { timeout: 10000 });
    const spotlightBodyHidden = await run.locator('[data-spotlight-tray-body]').evaluate((node) => node.hidden);
    const spotlightAttention = await run.locator('[data-spotlight-channel]').evaluate((node) => node.classList.contains('has-active') && node.classList.contains('has-attention'));
    add('spotlight tray starts tucked with active-slide attention', spotlightBodyHidden && spotlightAttention, '');
    await run.locator('[data-spotlight-toggle]').click();
    await run.waitForSelector('[data-spotlight-card]', { timeout: 5000 });
    add('spotlight tray expands on click', await run.locator('[data-spotlight-card]').count() > 0 && !(await run.locator('[data-spotlight-tray-body]').evaluate((node) => node.hidden)), '');
    await run.evaluate(() => {
      const state = { acknowledged: {}, snoozed: {}, characters: {} };
      (window.GOLDSPIRE_SLIDES || []).forEach((slide) => {
        (slide.spotlights || []).forEach((spotlight) => {
          if (spotlight.spotlight_id) state.acknowledged[spotlight.spotlight_id] = Date.now();
          if (spotlight.type === 'character' && spotlight.character_ref) {
            state.characters[spotlight.character_ref] = state.characters[spotlight.character_ref] || {};
            state.characters[spotlight.character_ref][spotlight.half || 'early'] = true;
          }
        });
      });
      localStorage.setItem('goldspire-run-spotlights-v1', JSON.stringify(state));
      localStorage.removeItem('goldspire-run-spotlight-panel-open-v1');
    });
    await run.reload({ waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-slide-root] h2', { timeout: renderTimeout });
    await run.waitForTimeout(500);
    add('spotlight tray hides when there is no active or pending content', await run.locator('[data-spotlight-channel]').evaluate((node) => node.hidden || !node.textContent.trim()), '');
    await run.evaluate(() => localStorage.removeItem('goldspire-run-mode-state-v1'));
    await run.goto(`${base}/run.html?slide=PROLOGUE`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-slide-root] h2', { timeout: renderTimeout });
    add('PROLOGUE has inline player-safe throw controls', await run.locator('.progressive-active-beat [data-run-inline-action="send-text"]').count() > 0 && await run.locator('.progressive-active-beat [data-run-inline-action="copy-text"]').count() > 0, '');
    add('action-only GM script block is not throwable', await run.locator('.progressive-gm-script [data-run-inline-action]').count() === 0, '');
    add('explicit GM read-aloud block is throwable', await run.locator('.progressive-gm-readaloud [data-run-inline-action="send-text"]').count() > 0, '');
    await run.evaluate(() => {
      const target = document.querySelector('#run-position');
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await run.keyboard.press('Meta+C');
    let nativeCopy = await run.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    if (!nativeCopy.includes('Slide')) {
      await run.keyboard.press('Control+C');
      nativeCopy = await run.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    }
    add('Run Mode native copy shortcut copies selected text', nativeCopy.includes('Slide') && nativeCopy.includes('PROLOGUE'), nativeCopy);
    await run.evaluate(() => { window.getSelection()?.removeAllRanges(); navigator.clipboard.writeText('').catch(() => {}); });
    await run.keyboard.press('c');
    const shortcutCopy = await run.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    add('unmodified c still copies current player text', shortcutCopy.trim().length > 0 && !shortcutCopy.includes('Slide'), shortcutCopy.slice(0, 120));
    await run.locator('.progressive-active-beat [data-run-inline-action="copy-text"]').first().click();
    const inlineCopy = await run.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    add('inline Run Mode copy copies only selected chunk', /capital|courier/i.test(inlineCopy), inlineCopy.slice(0, 160));
    await run.locator('.progressive-active-beat [data-run-inline-action="send-text"]').first().click();
    await player.waitForFunction(() => document.body.dataset.displayMode === 'read-aloud-fullscreen', null, { timeout: 5000 });
    const inlinePlayerText = await player.locator('.player-text-fullscreen').innerText();
    add('inline Run Mode send shows selected chunk on Player Display', /capital|courier/i.test(inlinePlayerText), inlinePlayerText.slice(0, 160));
    await run.goto(`${base}/run.html?slide=S03-02`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-slide-root] h2', { timeout: renderTimeout });
    await run.waitForSelector('.entity-panel', { state: 'attached', timeout: 10000 });
    const optionalPanelsClosed = await run.evaluate(() => {
      const optional = [...document.querySelectorAll('.per-character-panel, .entity-panel, .story-scope-panel, .world-connection-panel, .map-actions-panel')];
      const playerBeatsOpen = [...document.querySelectorAll('.player-beat-panel')].every((panel) => panel.open);
      return optional.length > 0 && optional.every((panel) => !panel.open) && playerBeatsOpen;
    });
    add('optional Run Mode reference panels are collapsed while player beats stay open', optionalPanelsClosed, '');
    await run.locator('.entity-panel').evaluate((node) => { node.open = true; });
    await run.waitForSelector('#run-slide-root [data-entity="goldspire-waymarkers"]', { state: 'visible', timeout: 10000 });
    await run.locator('#run-slide-root [data-entity="goldspire-waymarkers"]').first().hover();
    await run.waitForSelector('#hover-card.is-visible .hover-card-media-wrap [data-run-inline-action="send-image"]', { timeout: 5000 });
    const hoverImageControls = await run.locator('#hover-card .hover-card-media-wrap [data-run-inline-action="send-image"]').count();
    const hoverTextControls = await run.locator('#hover-card .hover-card-player-text [data-run-inline-action="send-text"]').count();
    add('Run Mode entity hover-card image/text controls appear', hoverImageControls > 0 && hoverTextControls > 0, { hoverImageControls, hoverTextControls });
    await run.locator('#hover-card .hover-card-media-wrap [data-run-inline-action="send-image"]').click();
    await player.waitForFunction(() => document.body.dataset.displayMode === 'image-title-caption', null, { timeout: 5000 });
    const hoverPlayerTitle = await player.locator('.player-caption h1').innerText();
    add('Run Mode entity hover-card image sends to Player Display', /Goldspire Waymarkers/i.test(hoverPlayerTitle), hoverPlayerTitle);
    add('Run Mode hover-card close button appears', await run.locator('#hover-card [data-hover-card-close]').count() === 1, '');
    await run.locator('#hover-card [data-hover-card-close]').click();
    await run.waitForFunction(() => !document.querySelector('#hover-card')?.classList.contains('is-visible'), null, { timeout: 2000 });
    add('Run Mode hover-card close hides cue card', await run.locator('#hover-card.is-visible').count() === 0, '');
    await run.locator('#run-position').hover();
    await run.waitForTimeout(450);
    await run.locator('#run-slide-root [data-entity="goldspire-waymarkers"]').first().hover();
    await run.waitForSelector('#hover-card.is-visible', { timeout: 5000 });
    add('Run Mode hover-card reappears after pointer-away rehover', await run.locator('#hover-card.is-visible').count() === 1, '');
    await run.goto(`${base}/pages/session-zero-cue-cards.html`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('.session-zero-cue-card', { timeout: 10000 });
    await run.locator('.throwable-text-body').first().evaluate((target) => {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await run.keyboard.press('Meta+C');
    let cueNativeCopy = await run.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    if (!/beginner-friendly/i.test(cueNativeCopy)) {
      await run.keyboard.press('Control+C');
      cueNativeCopy = await run.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    }
    add('cue-card native copy shortcut copies selected text', /beginner-friendly/i.test(cueNativeCopy), cueNativeCopy.slice(0, 160));
    await run.locator('.cue-card-art').first().hover();
    await run.waitForFunction(() => Number(getComputedStyle(document.querySelector('.cue-card-art .throwable-image-send')).opacity) > 0.5, null, { timeout: 2000 });
    const cueOpacity = await run.locator('.cue-card-art .throwable-image-send').first().evaluate((node) => getComputedStyle(node).opacity);
    add('cue-card image hover reveals send icon', Number(cueOpacity) > 0.5, cueOpacity);
    const cueIconBox = await run.locator('.cue-card-art .throwable-image-send img').first().boundingBox();
    add('cue-card image send icon stays compact', !!cueIconBox && cueIconBox.width <= 32 && cueIconBox.height <= 32, cueIconBox || '');
    await run.locator('.cue-card-art .throwable-image-send').first().click({ force: true });
    await player.waitForFunction(() => document.body.dataset.displayMode === 'image-title-caption', null, { timeout: 5000 });
    const cuePlayerTitle = await player.locator('.player-caption h1').innerText();
    add('cue-card image send shows image on Player Display', /Welcome to the Goldspire Messengers/i.test(cuePlayerTitle), cuePlayerTitle);
    await run.evaluate(() => localStorage.removeItem('goldspire-run-mode-state-v1'));
    await run.goto(`${base}/run.html?slide=S01-01`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-slide-root] h2', { timeout: renderTimeout });
    add('Run Mode has side deck arrows', await run.locator('.deck-arrow-prev').count() === 1 && await run.locator('.deck-arrow-next').count() === 1, '');
    add('thumbnail scrubber uses slide images', await run.locator('.scrub-dot img').count() >= 75, await run.locator('.scrub-dot img').count());
    const imageBox = await run.locator('.slide-media img').first().boundingBox();
    add('Run Mode shows visible slide image anchor by default', !!imageBox && imageBox.width > 320 && imageBox.height > 180, imageBox || '');
    add('current slide completion checkbox is visible', await run.locator('[data-run-current-complete]').count() === 1, '');
    add('Run Mode details live inside slide card', await run.locator('[data-slide-root] .run-detail-stack').count() === 1, '');
    await run.locator('[data-run-action="toggle-image"]').click();
    add('image can be hidden from Run Mode', await run.locator('.slide-media').first().boundingBox() === null, '');
    await run.locator('[data-run-action="toggle-image"]').click();
    add('image can be restored in Run Mode', await run.locator('.slide-media').first().boundingBox() !== null, '');
    await run.locator('[data-run-go-slide="CHEAT-CONDITIONS"]').click();
    const conditionText = await run.locator('.cheat-reference-list').innerText();
    add('condition cheat slide shows real content by default', /Vulnerable|Restrained|Hidden/.test(conditionText), conditionText.slice(0, 160));
    await run.locator('[data-run-go-slide="CHEAT-PC"]').click();
    const pcText = await run.locator('.cheat-reference-list').innerText();
    add('PC cheat slide shows real stats by default', pcText.includes('Evasion') && pcText.includes('Traits:') && pcText.includes('Experiences:'), pcText.slice(0, 160));
    await run.locator('[data-run-go-slide="CHEAT-LOOT"]').click();
    const lootText = await run.locator('.cheat-reference-list').innerText();
    add('loot cheat slide shows real content by default', /Hexmart|Pocket Ward|Stride Salve/.test(lootText), lootText.slice(0, 160));
    const fixedShortcuts = ['1 GM Rules', '2 Conditions', '3 PCs', '4 Loot', '5 Pronunciation', '6 Sablewood'];
    let shortcutButtons = await run.locator('.run-cheat-menu button').evaluateAll((nodes) => nodes.map((n) => n.textContent.trim()));
    add('Run Mode fixed shortcut order is protected', JSON.stringify(shortcutButtons.slice(0, 6)) === JSON.stringify(fixedShortcuts), shortcutButtons);
    add('Run Mode pinned shortcut strip starts empty', JSON.stringify(shortcutButtons) === JSON.stringify(fixedShortcuts), shortcutButtons);
    await run.evaluate(() => localStorage.removeItem('goldspire-run-mode-state-v1'));
    await run.goto(`${base}/run.html?slide=S01-01`, { waitUntil: 'domcontentloaded' });
    await run.waitForSelector('[data-slide-root] h2', { timeout: renderTimeout });
    await run.locator('[data-run-action="pin"]').click();
    const firstPinState = (await state()).pinnedSlides || [];
    shortcutButtons = await run.locator('.run-cheat-menu button').evaluateAll((nodes) => nodes.map((n) => n.textContent.trim()));
    add('Pin current slide assigns shortcut 7 after fixed shortcuts', JSON.stringify(firstPinState) === JSON.stringify(['S01-01']) && shortcutButtons[6]?.startsWith('7 Latest'), { state: firstPinState, buttons: shortcutButtons });
    await run.locator('.deck-arrow-next').click();
    const movedAfterPin = await currentId();
    await run.keyboard.press('p');
    add('P jumps to latest pinned slide', await currentId() === 'S01-01', { from: movedAfterPin, actual: await currentId() });
    await run.locator('.deck-arrow-next').click();
    await run.keyboard.press('7');
    add('7 jumps to first pinned slide', await currentId() === 'S01-01', await currentId());
    for (const slideId of ['S02-01', 'S03-02', 'S04-01']) {
      await run.locator(`[data-scrub-slide-id="${slideId}"]`).evaluate((node) => node.click());
      await run.locator('[data-run-action="pin"]').click();
    }
    const fourPinState = (await state()).pinnedSlides || [];
    shortcutButtons = await run.locator('.run-cheat-menu button').evaluateAll((nodes) => nodes.map((n) => n.textContent.trim()));
    add('Pinned slides fill 7/8/9/0 in recency order', JSON.stringify(fourPinState) === JSON.stringify(['S04-01', 'S03-02', 'S02-01', 'S01-01']) && JSON.stringify(shortcutButtons.slice(6, 10).map((text) => text.split(' ')[0])) === JSON.stringify(['7', '8', '9', '0']), { state: fourPinState, buttons: shortcutButtons });
    await run.keyboard.press('0');
    add('0 jumps to oldest pinned slide', await currentId() === 'S01-01', await currentId());
    await run.locator('[data-scrub-slide-id="S05-01"]').evaluate((node) => node.click());
    await run.locator('[data-run-action="pin"]').click();
    const cappedPinState = (await state()).pinnedSlides || [];
    await run.keyboard.press('0');
    add('Fifth pin drops oldest shortcut and keeps four pins', JSON.stringify(cappedPinState) === JSON.stringify(['S05-01', 'S04-01', 'S03-02', 'S02-01']) && await currentId() === 'S02-01', { state: cappedPinState, after0: await currentId() });
    const before = await currentId();
    await run.locator('.deck-arrow-next').click();
    const afterNext = await currentId();
    add('Next control advances slide', before !== afterNext, { before, afterNext });
    await run.locator('.deck-arrow-prev').click();
    add('Previous control moves back', await currentId() === before, { expected: before, actual: await currentId() });
    await run.keyboard.press('ArrowRight');
    add('ArrowRight advances slide', await currentId() !== before, { before, actual: await currentId() });
    await run.locator('.run-scratch summary').click();
    await run.locator('#run-scratch-note').fill('Typing should block shortcuts');
    const typedBefore = await currentId();
    await run.keyboard.press('ArrowRight');
    add('shortcuts do not fire while typing', await currentId() === typedBefore, { before: typedBefore, after: await currentId() });
    await run.keyboard.press('p');
    await run.keyboard.press('7');
    add('pinned shortcuts do not fire while typing', await currentId() === typedBefore, { before: typedBefore, after: await currentId() });
    await run.locator('#run-slide-select').focus();
    await run.keyboard.press('Escape');
    await run.locator('[data-scrub-slide-id="S03-02"]').evaluate((node) => node.click());
    add('scrubber jumps between slides', await currentId() === 'S03-02', await currentId());
    await player.waitForFunction(() => document.body.dataset.displayMode === 'image-title-caption', null, { timeout: 5000 });
    const playerTitle = await player.locator('.player-caption h1').innerText();
    add('player display receives setSlide messages', playerTitle.includes('Local Clues'), playerTitle);
    await run.locator('[data-run-action="blackout"]').click();
    await player.waitForFunction(() => document.body.dataset.displayMode === 'blackout', null, { timeout: 5000 });
    add('blackout works', await player.evaluate(() => document.body.dataset.displayMode) === 'blackout', '');
    await run.locator('[data-run-action="show-image"]').first().click();
    await player.waitForFunction(() => document.body.dataset.displayMode === 'image-only', null, { timeout: 5000 });
    await player.waitForFunction(() => !!document.querySelector('.player-slide img')?.naturalWidth, null, { timeout: 5000 });
    add('Show Image to Players works', await player.evaluate(() => !!document.querySelector('.player-slide img')?.complete && document.querySelector('.player-slide img')?.naturalWidth > 0), '');
    await run.locator('[data-run-action="show-text"]').first().click();
    await player.waitForFunction(() => document.body.dataset.displayMode === 'read-aloud-fullscreen', null, { timeout: 5000 });
    const shownText = await player.locator('.player-text-fullscreen').innerText();
    add('Show Text to Players works', shownText.trim().length > 0, shownText.slice(0, 120));
    await run.locator('[data-run-action="expand-image"]').click();
    add('image expansion works', await run.locator('#run-image-dialog[open]').count() === 1, '');
    await run.keyboard.press('Escape');
    await run.locator('[data-run-action="show-text"]').first().click();
    await player.waitForFunction(() => document.body.dataset.displayMode === 'read-aloud-fullscreen', null, { timeout: 5000 });
    add('Full tool sends fullscreen player text', await player.evaluate(() => document.body.dataset.displayMode) === 'read-aloud-fullscreen', '');
    const playerBody = await player.locator('body').innerText();
    const leaked = banned.filter((pattern) => pattern.test(playerBody)).map(String);
    add('player display has no GM/dev content', leaked.length === 0, leaked);
    await run.goto(`${base}/player-follow.html?slide=S03-02`, { waitUntil: 'domcontentloaded' });
    const followText = await run.locator('#follow-current').innerText();
    add('player-follow supports direct slide links', followText.includes('Local Clues'), followText.slice(0, 120));
    await context.close();
    await browser.close();
    console.log(JSON.stringify({ ok: true, checks }));
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    add('Node Playwright rendered slideshow QA completed', false, error && error.stack ? error.stack : String(error));
    console.log(JSON.stringify({ ok: false, checks }));
  }
}
main();
"""
    with static_server() as base_url, tempfile.NamedTemporaryFile("w", suffix=".cjs", delete=False) as handle:
        handle.write(script)
        handle.flush()
        script_path = Path(handle.name)
        env = os.environ.copy()
        env["NODE_PATH"] = str(node_modules)
        env["BASE_URL"] = base_url
        env["PYTHON_PLAYWRIGHT_ERROR"] = python_error
        if chrome.exists():
            env["CHROME_PATH"] = str(chrome)
        try:
            result = subprocess.run([str(node), str(script_path)], text=True, capture_output=True, timeout=180, env=env)
            stdout = (result.stdout or "").strip().splitlines()
            payload = json.loads(stdout[-1]) if stdout else {"ok": False, "checks": []}
        except Exception as exc:
            checks.append({"name": "Node Playwright rendered slideshow QA completed", "ok": False, "detail": str(exc)})
            return True
        finally:
            script_path.unlink(missing_ok=True)
    for check in payload.get("checks", []):
        checks.append(check)
    if result.returncode != 0 and not payload.get("checks"):
        checks.append({"name": "Node Playwright rendered slideshow QA completed", "ok": False, "detail": result.stderr})
    return True


def write_report(checks: list[dict[str, Any]]) -> dict:
    issues = [check for check in checks if not check["ok"]]
    report = {
        "pass": not issues,
        "check_count": len(checks),
        "issue_count": len(issues),
        "checks": checks,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    summary = [
        "\n## Dedicated Slideshow / Run Mode QA",
        "",
        f"Checks passed: **{len(checks) - len(issues)} / {len(checks)}**",
        f"Checks failed: **{len(issues)}**",
        "",
        "- `data/slides.json`, `run.html`, `player-display.html`, `player-follow.html`, and dedicated `js/` files are generated.",
        "- Browser QA covers next/previous, ArrowRight, shortcut suppression while typing, scrubber jumps, persistence, player-display sync, blackout, image/text reveal, copy fallback, and expansion dialogs.",
        "",
        "Detailed JSON: `data/qa-slideshow-report.json`.",
    ]
    text = "\n".join(summary) + "\n"
    QA_REPORT.write_text((QA_REPORT.read_text(encoding="utf-8") if QA_REPORT.exists() else "") + text, encoding="utf-8")
    DOC_REPORT.write_text((DOC_REPORT.read_text(encoding="utf-8") if DOC_REPORT.exists() else "") + text, encoding="utf-8")
    return report


def main() -> None:
    checks: list[dict[str, Any]] = []
    static_checks(checks)
    browser_checks(checks)
    report = write_report(checks)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    sys.exit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
