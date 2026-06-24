#!/usr/bin/env python3
"""QA checks for the location visual asset queue."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
SRC = ROOT / "story-atlas" / "src"


REQUIRED_SLOT_KEYS = {"profile_scene", "primary_map", "beat_arrival", "beat_detail"}
FORBIDDEN_PROMPT_BITS = [".svg", "vector placeholder", "web asset", "stock photo", "sci-fi", "victorian", "1800s"]
REQUIRED_LOCATION_IDS = {"goldspire-territories", "emeris-capital", "emeris-capital-gate", "athervast"}
REQUIRED_AMBIENT_IMAGE_IDS = {
    "badger-hawks",
    "cat-squirrels",
    "centi-beetles",
    "craymeleon",
    "festival-moths",
    "fox-bats",
    "giraffe-deer",
    "hellbender",
    "horse-goats",
    "lemur-toads",
    "mist-things",
    "moth-possums",
    "rabbit-gliders",
    "ratcoons",
    "sable-sap",
    "spidermanders",
    "sunfire-lily",
    "sunless-farm-moss",
    "tiger-elk",
    "turtle-mice",
    "twilight-plums",
    "ward-moths",
}
CREATURE_IMAGE_IDS = REQUIRED_AMBIENT_IMAGE_IDS - {"sable-sap", "sunfire-lily", "sunless-farm-moss", "twilight-plums"}
REQUIRED_SCENE_ENTITY_BINDINGS = {
    "S01-01": {"cat-squirrels", "giraffe-deer", "lemur-toads", "fox-bats", "horse-goats", "twilight-plums", "sable-sap"},
    "S03-01": {"ratcoons", "festival-moths", "sunless-farm-moss", "young-dryads"},
    "S04-05": {"ward-moths", "sunfire-lily", "mist-things"},
    "S05-03": {"ward-moths", "sunfire-lily", "mist-things", "eeligator"},
}
REQUIRED_MAP_ENTITY_BINDINGS = {
    "MAP-LOC-sablewoodtm-logistics-preserve": {"cat-squirrels", "giraffe-deer", "lemur-toads", "fox-bats", "horse-goats", "twilight-plums", "sable-sap"},
    "MAP-LOC-old-sable": {"strixwolf", "tiger-elk", "mountain-crabs", "craymeleon", "eeligator", "spidermanders", "hellbender"},
    "MAP-LOC-the-lucent-river": {"craymeleon", "eeligator"},
    "MAP-LOC-the-refuge": {"rabbit-gliders", "moth-possums", "turtle-mice", "badger-hawks"},
    "MAP-LOC-hush": {"ratcoons", "festival-moths", "young-dryads", "sunless-farm-moss"},
    "MAP-LOC-open-valetm-ritual-site": {"ward-moths", "sunfire-lily", "mist-things", "eeligator"},
}
FALSE_CANON_BY_LOCATION = {
    "athervast": [
        "missing keystone",
        "empty ward socket",
        "empty keystone socket",
        "missing wardstone",
        "hush ward",
        "hush's ward",
        "keystone delivery",
        "capital grid is missing",
    ],
    "emeris-capital": [
        "athervast gate",
        "athervast archway",
        "missing keystone",
        "empty ward socket",
        "empty keystone socket",
        "missing wardstone",
    ],
    "emeris-capital-gate": [
        "athervast gate",
        "athervast archway",
        "missing keystone",
        "empty ward socket",
        "empty keystone socket",
        "missing wardstone",
        "ward socket",
    ],
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_slides(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8").strip()
    prefix = "window.GOLDSPIRE_SLIDES = "
    if not text.startswith(prefix):
        raise ValueError(f"Unexpected slides-data.js prefix in {path}.")
    return json.loads(text[len(prefix) :].rstrip(";"))


def slot_rows(visuals: dict) -> list[dict]:
    return [
        visuals.get("profile_scene") or {},
        visuals.get("primary_map") or {},
        *(visuals.get("beat_images") or []),
    ]


def main() -> int:
    failures: list[str] = []
    data = DIST / "data"
    profiles_path = data / "location-profiles.json"
    manifest_path = data / "location-visual-assets.json"
    entities_path = data / "entities.json"
    slides_path = data / "slides-data.js"
    if not profiles_path.exists():
        failures.append("Missing generated location-profiles.json.")
    if not manifest_path.exists():
        failures.append("Missing generated location-visual-assets.json.")
    if not entities_path.exists():
        failures.append("Missing generated entities.json.")
    if not slides_path.exists():
        failures.append("Missing generated slides-data.js.")
    if failures:
        print("Location visual asset QA failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    profiles = load_json(profiles_path)
    manifest = load_json(manifest_path)
    entities = load_json(entities_path)
    slides = load_slides(slides_path)
    if len(manifest) != len(profiles):
        failures.append(f"Visual manifest count {len(manifest)} does not match location profile count {len(profiles)}.")
    for loc_id in REQUIRED_LOCATION_IDS:
        if loc_id not in manifest:
            failures.append(f"Visual manifest missing required corrected-canon location: {loc_id}.")

    for loc_id, profile in sorted(profiles.items()):
        visuals = profile.get("visual_assets")
        manifest_visuals = manifest.get(loc_id)
        if not visuals:
            failures.append(f"{loc_id} missing profile.visual_assets.")
            continue
        if not manifest_visuals:
            failures.append(f"{loc_id} missing generated visual manifest entry.")
        keys = {slot.get("key") for slot in slot_rows(visuals)}
        missing_keys = REQUIRED_SLOT_KEYS - keys
        if missing_keys:
            failures.append(f"{loc_id} missing visual slot keys: {sorted(missing_keys)}.")
        if visuals.get("schema_version") != "location-visual-assets-v1":
            failures.append(f"{loc_id} has wrong visual schema version.")
        if loc_id == "goldspire-territories":
            goldspire_text = json.dumps(visuals, ensure_ascii=False).lower()
            for needle in ["world-scale", "multiple biomes", "emeris", "athervast", "sablewood", "hush", "open vale"]:
                if needle not in goldspire_text:
                    failures.append(f"Goldspire Territories visual manifest missing scale/detail cue: {needle}.")
        if loc_id == "athervast":
            athervast_text = json.dumps(visuals, ensure_ascii=False).lower()
            for needle in ["spiral", "gold-capped", "sky-illusions", "potion manufactories", "workrings"]:
                if needle not in athervast_text:
                    failures.append(f"Athervast visual manifest missing corrected capital cue: {needle}.")
        if loc_id == "emeris-capital":
            emeris_text = json.dumps(visuals, ensure_ascii=False).lower()
            for needle in ["honey-stone", "territory capital", "sablewood", "gate market"]:
                if needle not in emeris_text:
                    failures.append(f"Emeris visual manifest missing corrected start-city cue: {needle}.")
        if loc_id == "emeris-capital-gate":
            gate_text = json.dumps(visuals, ensure_ascii=False).lower()
            for needle in ["pale carved", "toll counters", "fried dough", "sablewood"]:
                if needle not in gate_text:
                    failures.append(f"Emeris Capital Gate visual manifest missing corrected gate cue: {needle}.")
        for false_bit in FALSE_CANON_BY_LOCATION.get(loc_id, []):
            if false_bit in json.dumps(visuals, ensure_ascii=False).lower():
                failures.append(f"{loc_id} visual manifest contains false-canon prompt cue: {false_bit}.")
        for slot in slot_rows(visuals):
            key = slot.get("key", "unknown")
            prompt = slot.get("prompt", "")
            source_path = slot.get("source_path", "")
            runtime_path = slot.get("runtime_path", "")
            fallback_runtime = slot.get("fallback_runtime_path", "")
            if not prompt.strip():
                failures.append(f"{loc_id}:{key} missing prompt.")
            if "Use case:" not in prompt or "Style anchor:" not in prompt:
                failures.append(f"{loc_id}:{key} prompt missing structured header/style anchor.")
            prompt_lower = prompt.lower()
            for bit in FORBIDDEN_PROMPT_BITS:
                if bit in prompt_lower and bit not in {"sci-fi", "victorian", "1800s"}:
                    failures.append(f"{loc_id}:{key} prompt contains forbidden asset wording: {bit}.")
            if "no sci-fi" not in prompt_lower or "no readable text" not in prompt_lower:
                failures.append(f"{loc_id}:{key} prompt missing anti-drift/no-text guardrails.")
            if source_path.endswith(".svg") or runtime_path.endswith(".svg") or fallback_runtime.endswith(".svg"):
                failures.append(f"{loc_id}:{key} points at an SVG path.")
            if not source_path.startswith(str(SRC / "location_visual_assets")):
                failures.append(f"{loc_id}:{key} source path is not in story-atlas/src/location_visual_assets.")
            source = Path(source_path)
            if slot.get("source_exists") and not source.exists():
                failures.append(f"{loc_id}:{key} marked source_exists but file is missing: {source}.")
            if key in {"profile_scene", "primary_map"}:
                expected_suffix = "profile_scene_v02.png" if key == "profile_scene" else "primary_map_v02.png"
                if not source_path.endswith(expected_suffix):
                    failures.append(f"{loc_id}:{key} should use corrected v02 source filename {expected_suffix}.")
                if not slot.get("source_exists"):
                    failures.append(f"{loc_id}:{key} must have a saved AI-generated source image.")
                if not runtime_path:
                    failures.append(f"{loc_id}:{key} must have a runtime path for the saved image.")
                runtime_file = DIST / runtime_path if runtime_path else None
                if runtime_file and not runtime_file.exists():
                    failures.append(f"{loc_id}:{key} runtime image missing after build: {runtime_file}.")
            if key == "primary_map" and not (fallback_runtime or runtime_path):
                failures.append(f"{loc_id}:{key} has no existing fallback map runtime path and no saved map yet.")

    entities_by_id = {entity.get("id"): entity for entity in entities.values()}
    for entity_id in sorted(REQUIRED_AMBIENT_IMAGE_IDS):
        entity = entities_by_id.get(entity_id)
        if not entity:
            failures.append(f"Ambient creature/resource entity missing from generated entities.json: {entity_id}.")
            continue
        status = entity.get("image_asset_status", "")
        image = entity.get("image", "")
        if status in {"fallback_type_icon", "missing_image_gen", ""}:
            failures.append(f"{entity_id} is still using a generic or missing image status: {status or 'blank'}.")
        if not image:
            failures.append(f"{entity_id} has no runtime image path.")
        else:
            image_path = DIST / image
            if not image_path.exists():
                failures.append(f"{entity_id} runtime image file missing: {image_path}.")
        if entity_id in CREATURE_IMAGE_IDS and not image.startswith(f"assets/creature-images/{entity_id}/"):
            failures.append(f"{entity_id} should use its generated creature image, got: {image}.")

    slides_by_id = {slide.get("id"): slide for slide in slides}
    for scene_id, required_ids in sorted(REQUIRED_SCENE_ENTITY_BINDINGS.items()):
        slide = slides_by_id.get(scene_id)
        if not slide:
            failures.append(f"Required ambient scene slide missing: {scene_id}.")
            continue
        present = set(slide.get("entityIds") or [])
        missing = required_ids - present
        if missing:
            failures.append(f"{scene_id} missing ambient show-to-player entity bindings: {sorted(missing)}.")

    for map_id, required_ids in sorted(REQUIRED_MAP_ENTITY_BINDINGS.items()):
        slide = slides_by_id.get(map_id)
        if not slide:
            failures.append(f"Required ambient map slide missing: {map_id}.")
            continue
        present = set(slide.get("entityIds") or [])
        missing = required_ids - present
        if missing:
            failures.append(f"{map_id} missing ambient show-to-player entity bindings: {sorted(missing)}.")

    if failures:
        print("Location visual asset QA failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Location visual asset QA passed: {len(manifest)} locations with profile, map, and beat prompts.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
