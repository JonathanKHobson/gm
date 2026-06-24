#!/usr/bin/env python3
"""QA for the Story Atlas clue/evidence profile, image, and Run Mode layer."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
SRC = ROOT / "story-atlas" / "src"
sys.path.insert(0, str(SRC))

from atlas_clues import CLUE_PROFILES  # noqa: E402


TRAITS = {"Agility", "Strength", "Finesse", "Instinct", "Presence", "Knowledge"}
PC_IDS = {"marlowe-fairwind", "barnacle", "garrick-reed", "khari-nix", "varian-soto"}

BANNED_PLACEHOLDERS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"^\s*none\s*$",
        r"todo",
        r"tbd",
        r"placeholder",
        r"answer what",
        r"say the player-safe",
    ]
]

FORBIDDEN_PLAYER_REVEALS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"\bGoldspire Board\b",
        r"\bmanufactured[- ]?(?:failure|peril|threat)\b",
        r"\bcorporation planned\b",
        r"\bplanned for this ward to fail\b",
        r"\bBramble.*good guys\b",
        r"\bsoul[- ]economy\b",
        r"\bBoard tie\b",
    ]
]


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def nonempty(value) -> bool:
    if isinstance(value, str):
        return bool(value.strip()) and not any(rx.search(value) for rx in BANNED_PLACEHOLDERS)
    if isinstance(value, list):
        return bool(value) and all(nonempty(row) for row in value)
    if isinstance(value, dict):
        return bool(value)
    return value is not None


def check_required_fields(clue_id: str, profile: dict, failures: list[str]) -> None:
    required = [
        ("block0.pronunciation", profile.get("block0", {}).get("pronunciation")),
        ("block0.clue_kind", profile.get("block0", {}).get("clue_kind")),
        ("block1.points_to", profile.get("block1", {}).get("points_to")),
        ("block1.plot_track", profile.get("block1", {}).get("plot_track")),
        ("block1.reveal_cluster", profile.get("block1", {}).get("reveal_cluster")),
        ("block1.why_it_matters", profile.get("block1", {}).get("why_it_matters")),
        ("block2.the_show", profile.get("block2", {}).get("the_show")),
        ("block2.the_tell", profile.get("block2", {}).get("the_tell")),
        ("block3.whisper", profile.get("block3", {}).get("whisper")),
        ("block3.nudge", profile.get("block3", {}).get("nudge")),
        ("block3.spell_it_out", profile.get("block3", {}).get("spell_it_out")),
        ("block3.just_tell_them", profile.get("block3", {}).get("just_tell_them")),
        ("block4.sibling_clues", profile.get("block4", {}).get("sibling_clues")),
        ("block5.found_in", profile.get("block5", {}).get("found_in")),
        ("block5.earn_it_hooks", profile.get("block5", {}).get("earn_it_hooks")),
        ("block6.run_mode_tier", profile.get("block6", {}).get("run_mode_tier")),
        ("block6.scene_role", profile.get("block6", {}).get("scene_role")),
        ("block8.image_prompt", profile.get("block8", {}).get("image_prompt")),
    ]
    for label, value in required:
        if not nonempty(value):
            failures.append(f"{clue_id}: missing/weak {label}")
    if profile.get("player_safe", {}).get("the_show", "").strip() == profile.get("block1", {}).get("points_to", "").strip():
        failures.append(f"{clue_id}: player-safe SHOW duplicates GM points_to")


def check_player_safe(clue_id: str, profile: dict, failures: list[str]) -> None:
    text = json.dumps(profile.get("player_safe", {}), ensure_ascii=False) + " " + profile.get("block2", {}).get("the_show", "")
    for rx in FORBIDDEN_PLAYER_REVEALS:
        if rx.search(text):
            failures.append(f"{clue_id}: forbidden hidden-player reveal in SHOW/player_safe: {rx.pattern}")


def check_images(clue_id: str, profile: dict, failures: list[str]) -> None:
    slot = profile.get("visual_assets", {}).get("profile_image", {})
    source = Path(slot.get("source_path") or profile.get("block8", {}).get("source_path", ""))
    runtime = DIST / (slot.get("runtime_path") or profile.get("block8", {}).get("runtime_path", ""))
    if not source.exists():
        failures.append(f"{clue_id}: missing source image {source}")
    if not runtime.exists():
        failures.append(f"{clue_id}: missing generated runtime image {runtime}")


def check_mechanics(clue_id: str, profile: dict, failures: list[str]) -> None:
    block9 = profile.get("block9") or {}
    if not nonempty(block9.get("rule_status")):
        failures.append(f"{clue_id}: missing block9.rule_status")
    primary = block9.get("primary_rolls") or []
    if len(primary) < 3:
        failures.append(f"{clue_id}: fewer than three primary roll labels")
    roll_paths = block9.get("roll_paths") or []
    traits = {path.get("trait") for path in roll_paths}
    if traits != TRAITS:
        failures.append(f"{clue_id}: roll_paths do not cover all six traits ({sorted(traits)})")
    for path in roll_paths:
        label = f"{clue_id}:{path.get('trait', 'trait')}"
        if not isinstance(path.get("difficulty"), int):
            failures.append(f"{label}: difficulty is not an integer")
        for key in ["rank", "approach", "call_for", "hope_spin", "fear_spin"]:
            if not nonempty(path.get(key)):
                failures.append(f"{label}: missing/weak {key}")
        scale = path.get("result_scale") or {}
        for key in ["botch", "miss", "hit", "clean", "soar", "crit"]:
            if not nonempty(scale.get(key)):
                failures.append(f"{label}: missing/weak result_scale.{key}")
        text = json.dumps(path, ensure_ascii=False)
        if re.search(r"\bNo roll\b|\bNo mechanic\b|\bnone\b", text, re.I):
            failures.append(f"{label}: contains non-takeaway roll placeholder")
    pc_rows = block9.get("per_character_discovery") or []
    pc_ids = {row.get("pc_id") for row in pc_rows}
    if pc_ids != PC_IDS:
        failures.append(f"{clue_id}: per-character discovery does not cover all pregens ({sorted(pc_ids)})")
    seen_text = set()
    for row in pc_rows:
        label = f"{clue_id}:{row.get('pc_id', 'pc')}"
        for key in ["pc_name", "trait", "difficulty", "focus", "discovery", "roleplay_cue", "on_success", "on_fear"]:
            if not nonempty(row.get(key)):
                failures.append(f"{label}: missing/weak {key}")
        if row.get("trait") not in TRAITS:
            failures.append(f"{label}: non-Daggerheart trait {row.get('trait')}")
        signature = (row.get("discovery", ""), row.get("roleplay_cue", ""))
        if signature in seen_text:
            failures.append(f"{label}: duplicate per-character discovery text")
        seen_text.add(signature)


def main() -> int:
    failures: list[str] = []
    try:
        profiles = load_json(DIST / "data" / "clue-profiles.json")
        picker = load_json(DIST / "data" / "clue-picker.json")
        groups = load_json(DIST / "data" / "clue-reveal-groups.json")
        entities = load_json(DIST / "data" / "entities.json")
        slides = load_json(DIST / "data" / "slides.json")
    except FileNotFoundError as exc:
        print(f"FAIL missing generated file: {exc}")
        return 1

    expected = set(CLUE_PROFILES)
    missing = sorted(expected - set(profiles))
    if missing:
        failures.append(f"missing clue profiles: {', '.join(missing)}")
    extra = sorted(set(profiles) - expected)
    if extra:
        print(f"INFO additional clue profiles present: {', '.join(extra)}")

    for clue_id, profile in sorted(profiles.items()):
        check_required_fields(clue_id, profile, failures)
        check_player_safe(clue_id, profile, failures)
        check_images(clue_id, profile, failures)
        check_mechanics(clue_id, profile, failures)
        entity = next((candidate for candidate in entities.values() if candidate.get("id") == clue_id), None)
        if not entity:
            failures.append(f"{clue_id}: no clue entity page record")
        elif entity.get("clue_profile", {}).get("clue_id") != clue_id:
            failures.append(f"{clue_id}: entity missing embedded clue_profile")

    picker_ids = {row.get("id") for row in picker}
    if set(profiles) - picker_ids:
        failures.append(f"clue picker missing profiles: {', '.join(sorted(set(profiles) - picker_ids))}")
    if len(groups) < 7:
        failures.append(f"too few reveal groups: {len(groups)}")
    for group_id, group in groups.items():
        if len(group.get("clue_ids", [])) < 2:
            failures.append(f"{group_id}: reveal group has fewer than two parallel clues")
        page = DIST / "pages" / "clues" / f"{group_id}.html"
        if not page.exists():
            failures.append(f"{group_id}: missing reveal cluster page {page}")

    surfaced = set()
    for slide in slides:
        surfaced.update(slide.get("clueIds") or [])
    for required_scene in ["S00-01", "S01-02", "S02-01", "S04-04", "S05-06", "S06-01"]:
        slide = next((row for row in slides if row.get("id") == required_scene), None)
        if not slide or not slide.get("clueIds"):
            failures.append(f"{required_scene}: missing scene clue surfacing")
    if len(surfaced) < 20:
        failures.append(f"too few surfaced clue IDs in slides: {len(surfaced)}")

    linked_sources = sum(len(entity.get("clue_links") or []) for entity in entities.values())
    if linked_sources < 20:
        failures.append(f"too few two-way entity clue links: {linked_sources}")

    html = (DIST / "run.html").read_text(encoding="utf-8") if (DIST / "run.html").exists() else ""
    js = (DIST / "js" / "run-mode.js").read_text(encoding="utf-8") if (DIST / "js" / "run-mode.js").exists() else ""
    for token in ["data-clue-channel", "clue-picker-dialog", "clue-profile-dialog"]:
        if token not in html:
            failures.append(f"run.html missing {token}")
    for token in ["loadClueData", "renderClueChannel", "clue-profiles.json", "data-clue-player-show", "Discovery rolls", "clueMechanicDetailsMarkup"]:
        if token not in js:
            failures.append(f"run-mode.js missing {token}")

    board = DIST / "pages" / "clue-board.html"
    if not board.exists():
        failures.append("missing pages/clue-board.html")
    else:
        board_text = board.read_text(encoding="utf-8")
        if "Primary Rolls" not in board_text:
            failures.append("clue-board.html missing Primary Rolls column")
    sample_page = DIST / "pages" / "entities" / "the-drained-water.html"
    if sample_page.exists() and "Daggerheart Clue Stat Block" not in sample_page.read_text(encoding="utf-8"):
        failures.append("sample clue page missing Daggerheart Clue Stat Block")

    if failures:
        print("Clue system QA FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Clue system QA passed: {len(profiles)} profiles, {len(groups)} reveal groups, {linked_sources} source links.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
