#!/usr/bin/env python3
"""QA checks for the Goldspire location profile layer."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"


REQUIRED_PROFILES = [
    "goldspire-territories",
    "emeris-capital",
    "athervast",
    "emeris-capital-gate",
    "sablewoodtm-logistics-preserve",
    "old-sable",
    "hush",
    "clover-co-op",
    "the-hanging-office",
    "open-valetm-ritual-site",
    "open-vale-ward-lines",
    "the-goldspire-relay",
    "relay-spire",
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def entity_by_id(entities: dict) -> dict:
    return {entity.get("id"): entity for entity in entities.values()}


def nonempty(value) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return bool(value)
    return value is not None


def main() -> int:
    failures: list[str] = []
    data = DIST / "data"
    for filename in ["location-profiles.json", "location-picker.json", "location-canon-decisions.json"]:
        if not (data / filename).exists():
            failures.append(f"Missing generated data file: {filename}")

    entities = load_json(data / "entities.json")
    profiles = load_json(data / "location-profiles.json")
    slides = load_json(data / "slides.json")
    by_id = entity_by_id(entities)

    goldspire = by_id.get("goldspire-territories", {})
    if goldspire.get("type") != "location":
        failures.append("Goldspire Territories must be type=location, not faction/corporation.")
    goldspire_text = goldspire.get("summary", "") + goldspire.get("role", "")
    if "Emeris" not in goldspire_text or "Athervast" not in goldspire_text:
        failures.append("Goldspire Territories summary/role must identify both Emeris and Athervast as separate capital contexts.")

    emeris = by_id.get("emeris-capital", {})
    if emeris.get("type") != "location":
        failures.append("Emeris must be restored as first-class location id=emeris-capital.")
    emeris_text = (emeris.get("summary", "") + emeris.get("role", "")).lower()
    if "territory capital" not in emeris_text or "sablewood" not in emeris_text:
        failures.append("Emeris must be described as a territory capital at the Sablewood edge.")
    if "athervast" in emeris_text:
        failures.append("Emeris location text must not collapse Emeris into Athervast.")

    athervast = by_id.get("athervast", {})
    if athervast.get("type") != "location":
        failures.append("Athervast must remain a location.")
    athervast_text = (athervast.get("summary", "") + athervast.get("role", "")).lower()
    if "grand capital" not in athervast_text and "faraway" not in athervast_text:
        failures.append("Athervast must be described as the faraway grand capital, not an active route location.")
    for forbidden in ["missing keystone", "empty ward socket", "missing wardstone", "capital grid is missing", "hush's ward"]:
        if forbidden in athervast_text:
            failures.append(f"Athervast entity text leaks forbidden one-shot plot phrase: {forbidden}.")

    gate = by_id.get("emeris-capital-gate", {})
    gate_text = (gate.get("summary", "") + gate.get("role", "")).lower()
    if "athervast" in gate_text:
        failures.append("Emeris Capital Gate must not be described as Athervast or an Athervast archway.")
    if "emeris" not in gate_text or "sablewood" not in gate_text:
        failures.append("Emeris Capital Gate must be described as Emeris's forest-threshold gate.")
    for forbidden in ["empty ward socket", "missing keystone", "missing wardstone", "source site", "temporarily unwarded"]:
        if forbidden in gate_text:
            failures.append(f"Emeris Capital Gate entity text leaks forbidden false-canon phrase: {forbidden}.")
    forbidden_positive_claims = [
        "emeris is the capital.",
        "emeris is the capital city",
        "emeris is goldspire's capital",
        "emeris is the goldspire-wide capital.",
    ]
    if any(claim in gate_text for claim in forbidden_positive_claims):
        failures.append("Emeris must not be described as the Goldspire-wide capital.")

    for profile_id in REQUIRED_PROFILES:
        profile = profiles.get(profile_id)
        if not profile:
            failures.append(f"Missing required location profile: {profile_id}")
            continue
        for path, value in [
            ("player_safe.one_line", profile.get("player_safe", {}).get("one_line")),
            ("player_safe.short", profile.get("player_safe", {}).get("short")),
            ("player_safe.read_aloud", profile.get("player_safe", {}).get("read_aloud")),
            ("player_safe.long_body", profile.get("player_safe", {}).get("long_body")),
            ("player_safe.known_for", profile.get("player_safe", {}).get("known_for")),
            ("player_safe.culture_food", profile.get("player_safe", {}).get("culture_food")),
            ("player_safe.travel_texture", profile.get("player_safe", {}).get("travel_texture")),
            ("block1.gm_orientation", profile.get("block1", {}).get("gm_orientation")),
            ("block1.what_it_is", profile.get("block1", {}).get("what_it_is")),
            ("block1.place_in_story", profile.get("block1", {}).get("place_in_story")),
            ("block1.the_hook", profile.get("block1", {}).get("the_hook")),
            ("block1.story_function", profile.get("block1", {}).get("story_function")),
            ("block2", profile.get("block2")),
            ("block3", profile.get("block3")),
            ("block4", profile.get("block4")),
            ("block5", profile.get("block5")),
            ("what_here", profile.get("what_here")),
            ("districts_or_subareas", profile.get("districts_or_subareas")),
            ("sensory_signature", profile.get("sensory_signature")),
            ("living_place.scale", profile.get("living_place", {}).get("scale")),
            ("living_place.subareas", profile.get("living_place", {}).get("subareas")),
            ("living_place.ecosystem", profile.get("living_place", {}).get("ecosystem")),
            ("living_place.exploration_prompts", profile.get("living_place", {}).get("exploration_prompts")),
            ("living_place.off_path", profile.get("living_place", {}).get("off_path")),
            ("block6.player_safe_boundary", profile.get("block6", {}).get("player_safe_boundary")),
        ]:
            if not nonempty(value):
                failures.append(f"{profile_id} missing {path}")
        long_body = profile.get("player_safe", {}).get("long_body", "")
        if len(long_body.strip()) < 220:
            failures.append(f"{profile_id} player_safe.long_body is too thin; expected lush place description.")
        player_blob = json.dumps(profile.get("player_safe", {}), ensure_ascii=False).lower()
        if profile_id in {"athervast", "emeris-capital", "emeris-capital-gate"}:
            for forbidden in ["missing keystone", "empty ward socket", "missing wardstone", "temporarily unwarded", "capital grid is missing"]:
                if forbidden in player_blob:
                    failures.append(f"{profile_id} player-safe text leaks forbidden phrase: {forbidden}.")
        if profile_id == "emeris-capital-gate" and "athervast" in player_blob:
            failures.append("Emeris Capital Gate player-safe text must not mention Athervast.")

    for profile_id, profile in profiles.items():
        living = profile.get("living_place", {})
        subareas = living.get("subareas") or []
        ecosystem = living.get("ecosystem") or {}
        if len(subareas) < 3:
            failures.append(f"{profile_id} living_place should have at least 3 explorable subareas.")
        for key in ["plants", "animals", "phenomena", "cycle"]:
            if not nonempty(ecosystem.get(key)):
                failures.append(f"{profile_id} living_place.ecosystem missing {key}.")
        if profile_id in {"athervast", "hush", "sablewoodtm-logistics-preserve", "goldspire-territories"}:
            text = json.dumps(living, ensure_ascii=False).lower()
            for needle in ["off_path", "ecosystem", "subareas"]:
                if needle not in text:
                    failures.append(f"{profile_id} living_place missing explorable-system cue: {needle}.")
        if profile_id == "athervast":
            text = json.dumps(living, ensure_ascii=False).lower()
            for needle in ["crown", "bright rings", "workrings", "sky-illusion", "manufactories"]:
                if needle not in text:
                    failures.append(f"Athervast living_place missing city detail cue: {needle}.")
            for forbidden in ["emeris gate quarter", "ward socket", "missing"]:
                if forbidden in text:
                    failures.append(f"Athervast living_place retains old false-canon cue: {forbidden}.")
        if profile_id == "emeris-capital":
            text = json.dumps(living, ensure_ascii=False).lower()
            for needle in ["honey-stone", "courier", "gate market", "sablewood"]:
                if needle not in text:
                    failures.append(f"Emeris living_place missing start-city cue: {needle}.")
        if profile_id == "emeris-capital-gate":
            text = json.dumps(living, ensure_ascii=False).lower()
            for needle in ["toll counters", "fried dough", "forest threshold", "sablewood"]:
                if needle not in text:
                    failures.append(f"Emeris Capital Gate living_place missing gate cue: {needle}.")
            for forbidden in ["athervast", "empty socket", "ward socket", "missing piece"]:
                if forbidden in text:
                    failures.append(f"Emeris Capital Gate living_place retains old false-canon cue: {forbidden}.")
        if profile_id == "sablewoodtm-logistics-preserve":
            text = json.dumps(living, ensure_ascii=False).lower()
            for needle in ["car-wide", "off-road", "animal trail", "moss"]:
                if needle not in text:
                    failures.append(f"Sablewood living_place missing forest-ecology cue: {needle}.")

    slides_with_locations = [slide for slide in slides if slide.get("locationIds")]
    if len(slides_with_locations) < 20:
        failures.append(f"Expected broad slide location coverage; found only {len(slides_with_locations)} slides with locationIds.")
    s0404 = next((slide for slide in slides if slide.get("id") == "S04-04"), {})
    for required in ["open-vale-ward-lines"]:
        if required not in s0404.get("locationIds", []):
            failures.append(f"S04-04 should include locationIds entry for {required}.")
    if "athervast" in s0404.get("locationIds", []) or "emeris-capital-gate" in s0404.get("locationIds", []):
        failures.append("S04-04 must not force Athervast or Emeris Capital Gate into the Keystone reveal.")

    run_html = (DIST / "run.html").read_text(encoding="utf-8")
    run_js = (DIST / "js" / "run-mode.js").read_text(encoding="utf-8")
    for needle in [
        "data-location-channel",
        "location-picker-dialog",
        "location-profiles.json",
        "renderLocationChannel",
        "openLocationPickerDialog",
    ]:
        if needle not in run_html + run_js:
            failures.append(f"Run Mode missing location surfacing hook: {needle}")

    goldspire_page = (DIST / "pages" / "entities" / "goldspire-territories.html").read_text(encoding="utf-8")
    if "Location Profile" not in goldspire_page:
        failures.append("Goldspire Territories wiki page missing Location Profile section.")
    if 'data-entity="the-grail"><img' in goldspire_page and "<span>the</span>" in goldspire_page:
        failures.append("Stopword alias leak: standalone 'the' is linked to The Grail on Goldspire page.")
    if "<span>capital</span></a> ward grids" in goldspire_page:
        failures.append("Generic alias leak: standalone 'capital' linked as Athervast in regional text.")

    if failures:
        print("Location system QA failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Location system QA passed: {len(profiles)} profiles, {len(slides_with_locations)} slides with locationIds.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
