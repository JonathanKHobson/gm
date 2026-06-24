#!/usr/bin/env python3
"""QA checks for NPC profile depth, player-safe surfacing, and Run Mode controls."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"

REQUIRED_BLOCK1 = [
    "name",
    "pronunciation",
    "one_line",
    "story_role",
    "game_role",
    "critical_info",
    "offers_players",
    "disposition_default",
    "the_lever",
]
REQUIRED_BLOCK2 = [
    "wants_now",
    "larger_motivation",
    "personality",
    "voice",
    "secrets",
    "fears",
    "likes",
    "dislikes",
    "favorite_thing",
    "loved_ones",
    "day_to_day",
    "physical",
    "visual_read_aloud",
    "image_lore",
    "appearance",
    "carries",
    "voice_style",
    "body_language",
    "quirks",
    "npc_relationships",
    "wealth_status",
    "animal_companion",
]
REQUIRED_BLOCK3 = [
    "how_they_expect_pcs_to_behave",
    "persuasion_levers",
    "what_moves_them",
    "combat_lever",
]
REQUIRED_BLOCK4 = [
    "knows_about",
    "disposition_to_corporations",
    "p2p_universe_tie",
    "hidden_plot_hooks",
    "ties_to_pcs",
]
REQUIRED_BLOCK5 = [
    "combat_lever",
    "combat_summary",
    "combat_stat_block",
]

REQUIRED_COMBAT_STAT_FIELDS = [
    "mode",
    "source",
    "difficulty",
    "hp",
    "stress",
    "attack_modifier",
    "standard_attack",
    "abilities",
    "fear_abilities",
    "gm_ready_notes",
]

BANNED_PROFILE_PHRASES = [
    "confirm or override",
    "Confirm or override",
    "Use the sample lines",
    "Use the listed trait",
    "included because the Atlas already names",
    "Do not add hidden plot",
    "No combat",
    "No stat summary",
    "No roll",
    "No mechanic",
    "profile_fallback",
    "placeholder",
    "No forced reveal",
    "Being flattened into a function",
    "One ordinary sign that life continues",
    "Keep personal attachments player-safe",
    "A practical local life interrupted",
    "None established in the packet",
    "They expect outsiders to move fast",
    "Precarious unless the packet",
    "Violence changes position",
    "Drop this NPC only",
    "[verify against rules packet]",
]

BANNED_ENTITY_PHRASES = [
    "No combat stat summary needed",
    "No stat summary needed",
    "confirm or override",
    "Use as setting texture unless",
    "No default loot",
]

PLAYER_PROJECTION_LEAK_KEYS = [
    "npcProfile",
    "story_role",
    "game_role",
    "critical_info",
    "the_lever",
    "hidden_plot_hooks",
    "person_under_the_fight",
    "soul-economy",
]

REQUIRED_CREATURE_IMAGE_IDS = [
    "bullfrog",
    "eeligator",
    "fire-falcons",
    "goldwater-grail-toll-crew",
    "halython-s-fox-bat-companion",
    "hunting-trees",
    "mountain-crabs",
    "strixwolf",
    "the-glimpse",
    "young-dryads",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def load_json(path: Path):
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def missing_fields(row: dict, block_name: str, keys: list[str]) -> list[str]:
    block = row.get(block_name) or {}
    missing: list[str] = []
    for key in keys:
        value = block.get(key)
        if value is None or value == "" or value == [] or value == {}:
            missing.append(f"{block_name}.{key}")
    return missing


def main() -> None:
    profiles = load_json(DIST / "data" / "npc-profiles.json")
    backups = load_json(DIST / "data" / "backup-npcs.json")
    slides = load_json(DIST / "data" / "slides.json")
    entities = load_json(DIST / "data" / "entities.json")
    entities_by_id = {entity.get("id"): entity for entity in entities.values()}

    if len(profiles) < 32:
        fail(f"expected at least 32 NPC profiles, found {len(profiles)}")
    if len(backups) < 7:
        fail(f"expected at least 7 backup NPCs, found {len(backups)}")

    failures: list[str] = []
    combatants = 0
    backups_seen = 0
    for npc_id, profile in sorted(profiles.items()):
        profile_text = json.dumps(profile, ensure_ascii=False)
        entity = entities_by_id.get(npc_id) or {}
        image = entity.get("image", "")
        if not image.startswith("assets/npc-images/"):
            failures.append(f"{npc_id}: entity image does not use generated NPC portrait lane: {image}")
        elif not (DIST / image).exists():
            failures.append(f"{npc_id}: generated NPC portrait missing from dist: {image}")
        raw_name = str(profile.get("block1", {}).get("name") or entity.get("name") or "").strip().casefold()
        pron = str(entity.get("short_pronunciation") or entity.get("pronunciation") or "").strip()
        if not pron:
            failures.append(f"{npc_id}: missing entity pronunciation")
        elif pron.casefold() == raw_name:
            failures.append(f"{npc_id}: pronunciation falls back to raw name")
        profile_pron = str(profile.get("block1", {}).get("pronunciation") or "").strip()
        if not profile_pron:
            failures.append(f"{npc_id}: missing profile block1 pronunciation")
        elif profile_pron.casefold() == raw_name:
            failures.append(f"{npc_id}: profile block1 pronunciation falls back to raw name")
        for phrase in BANNED_PROFILE_PHRASES:
            if phrase in profile_text:
                failures.append(f"{npc_id}: banned placeholder phrase: {phrase}")
        if "—" in profile_text:
            failures.append(f"{npc_id}: em dash found in NPC profile text")
        player_safe = profile.get("player_safe") or {}
        if not player_safe.get("physical_description"):
            failures.append(f"{npc_id}: missing player_safe.physical_description")
        if not player_safe.get("name") or not player_safe.get("one_line"):
            failures.append(f"{npc_id}: missing player-safe name/one_line")
        for block_name, keys in [
            ("block1", REQUIRED_BLOCK1),
            ("block2", REQUIRED_BLOCK2),
            ("block3", REQUIRED_BLOCK3),
            ("block4", REQUIRED_BLOCK4),
            ("block5", REQUIRED_BLOCK5),
        ]:
            failures.extend(f"{npc_id}: {field} missing" for field in missing_fields(profile, block_name, keys))
        block5 = profile.get("block5") or {}
        stat_block = block5.get("combat_stat_block") or {}
        for field in REQUIRED_COMBAT_STAT_FIELDS:
            if stat_block.get(field) in (None, "", [], {}):
                failures.append(f"{npc_id}: combat_stat_block.{field} missing")
        if profile.get("combatant") or block5.get("stat_block_ref"):
            combatants += 1
            if not block5.get("stat_block_ref"):
                failures.append(f"{npc_id}: combatant missing canonical stat_block_ref")
            if not block5.get("person_under_the_fight"):
                failures.append(f"{npc_id}: combatant missing person_under_the_fight")
            if stat_block.get("mode") != "combatant":
                failures.append(f"{npc_id}: combatant missing combatant-mode stat block")
            for field in ["tier", "type", "thresholds", "motives_tactics"]:
                if stat_block.get(field) in (None, "", [], {}):
                    failures.append(f"{npc_id}: combat_stat_block.{field} missing")
            if "not listed" in str(stat_block.get("attack_modifier", "")).lower() and npc_id in {"legacy-security-skeleton", "soul-audit-wraith", "old-gregor"}:
                failures.append(f"{npc_id}: known combatant should have an explicit attack modifier")
        if profile.get("backup"):
            backups_seen += 1
        if profile.get("portrait", {}).get("source_status") != "npc_images":
            failures.append(f"{npc_id}: portrait source_status is not npc_images")

    if backups_seen < 7:
        failures.append(f"expected 7 backup profiles in npc-profiles.json, found {backups_seen}")

    for creature_id in REQUIRED_CREATURE_IMAGE_IDS:
        entity = entities_by_id.get(creature_id) or {}
        image = entity.get("image", "")
        entity_text = json.dumps(entity, ensure_ascii=False)
        if not image.startswith(f"assets/creature-images/{creature_id}/"):
            failures.append(f"{creature_id}: missing generated creature/combatant image lane: {image}")
        elif not (DIST / image).exists():
            failures.append(f"{creature_id}: generated creature/combatant image missing from dist: {image}")
        if entity.get("image_asset_status") == "fallback_type_icon":
            failures.append(f"{creature_id}: still using fallback type icon")
        robust = entity.get("robust") or {}
        for field in ["player_description", "appearance", "image_lore", "story_use"]:
            if robust.get(field) in (None, "", [], {}):
                failures.append(f"{creature_id}: robust.{field} missing")
        if entity.get("type") == "enemy" and not (entity.get("stat_summary") or robust.get("stat_block_summary")):
            failures.append(f"{creature_id}: enemy/combatant missing stat summary")
        for phrase in BANNED_ENTITY_PHRASES:
            if phrase in entity_text:
                failures.append(f"{creature_id}: banned entity placeholder phrase: {phrase}")
        if "—" in entity_text:
            failures.append(f"{creature_id}: em dash found in creature/entity text")

    for row in backups:
        backup_id = row.get("id") or "unknown-backup"
        profile = row.get("profile") or {}
        if not profile:
            failures.append(f"{backup_id}: backup picker row missing nested profile")
            continue
        block5 = profile.get("block5") or {}
        stat_block = block5.get("combat_stat_block") or {}
        if not block5.get("combat_summary"):
            failures.append(f"{backup_id}: backup picker profile missing combat_summary")
        for field in REQUIRED_COMBAT_STAT_FIELDS:
            if stat_block.get(field) in (None, "", [], {}):
                failures.append(f"{backup_id}: backup picker combat_stat_block.{field} missing")
        if backup_id == "old-gregor":
            if stat_block.get("mode") != "combatant":
                failures.append("old-gregor: backup picker profile should expose combatant-mode Legacy Skeleton stat block")
            if "not listed" in str(stat_block.get("attack_modifier", "")).lower():
                failures.append("old-gregor: backup picker profile should expose explicit Legacy Skeleton ATK +0")

    for slide in slides:
        projection = json.dumps(slide.get("playerSafeProjection") or {}, ensure_ascii=False)
        for key in PLAYER_PROJECTION_LEAK_KEYS:
            if key in projection:
                failures.append(f"{slide.get('id')}: playerSafeProjection leaks {key}")

    run_js = (DIST / "js" / "run-mode.js").read_text(encoding="utf-8")
    for token in [
        "function renderNpcChannel",
        "function sendNpcDescription",
        "function sendNpcPlayerLine",
        "data-npc-description",
        "data-npc-player-line",
        "clockCriticalActive()",
    ]:
        if token not in run_js:
            failures.append(f"run-mode.js missing NPC runtime token: {token}")
    if "Send player line" in run_js:
        failures.append("run-mode.js still labels NPC reveal action as Send player line")

    run_html = (DIST / "run.html").read_text(encoding="utf-8")
    if 'data-npc-channel' not in run_html or 'data-npc-summon-list' not in run_html:
        failures.append("run.html missing NPC channel or summon picker container")

    if failures:
        print("NPC QA failures:")
        for failure in failures:
            print(f"- {failure}")
        sys.exit(1)

    print("NPC system QA passed.")
    print(f"Profiles: {len(profiles)}")
    print(f"Backup NPCs: {len(backups)}")
    print(f"Combat-capable profiles: {combatants}")
    print("Player-safe projection leak scan: clean")


if __name__ == "__main__":
    main()
