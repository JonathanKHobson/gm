#!/usr/bin/env python3
"""QA for the Story Atlas item/profile/image surfacing layer."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
SRC = ROOT / "story-atlas" / "src"

REQUIRED_ITEM_IDS = {
    "keystone-asset",
    "incident-response-placard",
    "sableblade",
    "eeligator-scale-shield",
    "bramble-union-stoneweave",
    "recall-stone",
    "whitefire-ward-charm",
    "sableleaf-shoes",
    "bugbane-berry",
    "sable-sap",
    "vial-of-briarpowder",
    "lucent-water",
    "restorative-ash",
    "fire-wine",
    "goldwater-liability-token",
    "kazrak-adventurer-certification",
    "tamsins-home-token",
    "cracked-pocket-ward",
    "bramble-ward-scrap-charm-cluster",
    "claimrunner-serrated-blade",
    "spirekeeper-relay-keyring",
    "auditors-verdict-ledger",
}

FORBIDDEN_PLAYER_REVEALS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"\bGoldspire Board\b",
        r"\bmanufactured[- ]peril\b",
        r"\bmanufactured threat\b",
        r"\bsoul[- ]economy\b",
    ]
]

BANNED_PLACEHOLDERS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"^\s*none\s*$",
        r"no mechanic",
        r"no roll",
        r"todo",
        r"tbd",
        r"placeholder",
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
        return bool(value) and all(nonempty(row.get("content", row)) if isinstance(row, dict) else nonempty(row) for row in value)
    if isinstance(value, dict):
        return bool(value)
    return value is not None


def check_required_fields(item_id: str, profile: dict, failures: list[str]) -> None:
    required = [
        ("block0.pronunciation", profile.get("block0", {}).get("pronunciation")),
        ("block0.item_kind", profile.get("block0", {}).get("item_kind")),
        ("block1.first_impression", profile.get("block1", {}).get("first_impression")),
        ("block1.the_tell", profile.get("block1", {}).get("the_tell")),
        ("block1.what_it_is", profile.get("block1", {}).get("what_it_is")),
        ("block1.the_hook", profile.get("block1", {}).get("the_hook")),
        ("block2.maker", profile.get("block2", {}).get("maker")),
        ("block2.made_or_wild", profile.get("block2", {}).get("made_or_wild")),
        ("block2.comedy_beat", profile.get("block2", {}).get("comedy_beat")),
        ("block4.loot_group", profile.get("block4", {}).get("loot_group")),
        ("block4.eligibility", profile.get("block4", {}).get("eligibility")),
        ("block4.surface_ids", profile.get("block4", {}).get("surface_ids")),
        ("block5.disclosure", profile.get("block5", {}).get("disclosure")),
        ("block5.earn_it_hooks", profile.get("block5", {}).get("earn_it_hooks")),
        ("block6.image_prompt", profile.get("block6", {}).get("image_prompt")),
    ]
    for label, value in required:
        if not nonempty(value):
            failures.append(f"{item_id}: missing/weak {label}")
    block2 = profile.get("block2", {})
    if not (nonempty(block2.get("ad_copy")) or nonempty(block2.get("corporate_propaganda"))):
        failures.append(f"{item_id}: missing ad_copy or corporate_propaganda")
    block3 = profile.get("block3", {})
    if not (nonempty(block3.get("mechanics")) or nonempty(block3.get("narrative_function"))):
        failures.append(f"{item_id}: missing mechanical or narrative profile")
    stat_block = block3.get("stat_block", {})
    for label in ["stat_block_type", "canon_status", "mechanical_grammar", "table_effect", "player_benefit", "activation", "limits", "earn_gate", "outcome_spectrum"]:
        if not nonempty(stat_block.get(label)):
            failures.append(f"{item_id}: missing item stat_block.{label}")
    earn_gate = stat_block.get("earn_gate", {})
    for route in ["roleplay", "Knowledge", "Instinct", "Finesse", "Presence"]:
        if not nonempty(earn_gate.get(route)):
            failures.append(f"{item_id}: missing item earn gate route {route}")
    outcome_spectrum = stat_block.get("outcome_spectrum", {})
    for outcome in ["critical_success", "success_with_hope", "success_with_fear", "failure_with_hope", "failure_with_fear", "plain_low_roll"]:
        if not nonempty(outcome_spectrum.get(outcome)):
            failures.append(f"{item_id}: missing item outcome {outcome}")


def check_player_safe(item_id: str, profile: dict, failures: list[str]) -> None:
    text = json.dumps(profile.get("player_safe", {}), ensure_ascii=False)
    for rx in FORBIDDEN_PLAYER_REVEALS:
        if rx.search(text):
            failures.append(f"{item_id}: forbidden player-safe reveal: {rx.pattern}")
    first = profile.get("block1", {}).get("first_impression", "")
    tell = profile.get("block1", {}).get("the_tell", "")
    if first and tell and first.strip() == tell.strip():
        failures.append(f"{item_id}: SHOW first_impression duplicates earned TELL")


def check_images(item_id: str, profile: dict, failures: list[str]) -> None:
    slot = profile.get("visual_assets", {}).get("profile_image", {})
    source = Path(slot.get("source_path") or profile.get("block6", {}).get("source_path", ""))
    runtime = DIST / (slot.get("runtime_path") or profile.get("block6", {}).get("runtime_path", ""))
    if not source.exists():
        failures.append(f"{item_id}: missing source image {source}")
    if not runtime.exists():
        failures.append(f"{item_id}: missing generated runtime image {runtime}")


def main() -> int:
    failures: list[str] = []
    try:
        profiles = load_json(DIST / "data" / "item-profiles.json")
        picker = load_json(DIST / "data" / "item-picker.json")
        groups = load_json(DIST / "data" / "loot-groups.json")
        entities = load_json(DIST / "data" / "entities.json")
        slides = load_json(DIST / "data" / "slides.json")
    except FileNotFoundError as exc:
        print(f"FAIL missing generated file: {exc}")
        return 1

    missing = sorted(REQUIRED_ITEM_IDS - set(profiles))
    if missing:
        failures.append(f"missing item profiles: {', '.join(missing)}")
    extra_required = sorted(set(profiles) - REQUIRED_ITEM_IDS)
    if extra_required:
        print(f"INFO additional item profiles present: {', '.join(extra_required)}")

    for item_id, profile in sorted(profiles.items()):
        check_required_fields(item_id, profile, failures)
        check_player_safe(item_id, profile, failures)
        check_images(item_id, profile, failures)
        name = profile.get("item_name", "")
        entity = entities.get(name) or next((candidate for candidate in entities.values() if candidate.get("id") == item_id), None)
        if not entity:
            failures.append(f"{item_id}: no entity wiki keyed by item_name {name!r}")
        elif entity.get("item_profile", {}).get("item_id") != item_id:
            failures.append(f"{item_id}: entity wiki missing embedded item_profile")

    picker_ids = {row.get("id") for row in picker}
    if set(profiles) - picker_ids:
        failures.append(f"item picker missing profiles: {', '.join(sorted(set(profiles) - picker_ids))}")
    if not groups:
        failures.append("loot-groups.json is empty")

    surfaced_ids = set()
    for slide in slides:
        surfaced_ids.update(slide.get("itemIds") or [])
    for item_id, profile in profiles.items():
        surfaces = set(profile.get("block4", {}).get("surface_ids", []))
        if not (item_id in surfaced_ids or surfaces):
            failures.append(f"{item_id}: no Run Mode scene surface ids")
    if len(surfaced_ids) < 8:
        failures.append(f"too few item surfacing slide ids found: {len(surfaced_ids)}")

    html = (DIST / "run.html").read_text(encoding="utf-8") if (DIST / "run.html").exists() else ""
    js = (DIST / "js" / "run-mode.js").read_text(encoding="utf-8") if (DIST / "js" / "run-mode.js").exists() else ""
    for token in ["data-item-channel", "item-picker-dialog", "item-profile-dialog"]:
        if token not in html:
            failures.append(f"run.html missing {token}")
    for token in ["loadItemData", "renderItemChannel", "item-profiles.json", "data-item-player-tell"]:
        if token not in js:
            failures.append(f"run-mode.js missing {token}")

    linked_sources = 0
    for entity in entities.values():
        linked_sources += len(entity.get("item_links") or [])
    if linked_sources < 8:
        failures.append(f"too few two-way NPC/location item links: {linked_sources}")

    if failures:
        print("Item system QA FAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Item system QA passed: {len(profiles)} profiles, {len(picker)} picker rows, {linked_sources} source links.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
