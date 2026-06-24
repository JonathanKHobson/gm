#!/usr/bin/env python3
"""QA gate for Goldspire maps, combat workspaces, Fear dock, Encounter Cockpit, and Next Move tools."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
DOCS = ROOT / "docs"
REPORT = DIST / "data" / "qa-map-combat-hud-report.json"
QA_REPORT = DIST / "QA_REPORT.md"

OFFICIAL_FEAR_SPENDS = {
    "make-gm-move",
    "additional-gm-move",
    "spotlight-additional-adversary",
    "adversary-fear-feature",
    "environment-fear-feature",
    "add-adversary-experience",
}

REQUIRED_FILES = [
    "data/maps.json",
    "data/maps-data.js",
    "data/next-move-cards.json",
    "data/session-counters-schema.json",
    "data/combat-workspaces.json",
    "css/gm-hud.css",
    "js/gm-hud.js",
    "js/encounter-cockpit.js",
    "js/next-move-kit.js",
    "js/maps-environment-slides.js",
    "pages/combat.html",
]

REQUIRED_COMBAT_SCENES = {"S01-03", "S02-03", "S05-03", "S05-05", "S05-06"}
REQUIRED_MAPS = {"MAP-S01-02", "MAP-S02-03", "MAP-S05-03"}
REQUIRED_COMBAT_MAPS = {"MAP-COMBAT-S01-03", "MAP-S02-03", "MAP-S05-03", "MAP-COMBAT-S05-05", "MAP-COMBAT-S05-06"}
REQUIRED_PACKET_MAPS = {
    "MAP-LOC-sablewoodtm-logistics-preserve",
    "MAP-S01-02",
    "MAP-S02-03",
    "MAP-LOC-hush",
    "MAP-LOC-the-hanging-office",
    "MAP-LOC-open-valetm-ritual-site",
    "MAP-S05-03",
    "MAP-LOC-relay-spire",
}
REQUIRED_PACKET_COMBAT_MAPS = {"MAP-S02-03", "MAP-LOC-open-valetm-ritual-site", "MAP-S05-03"}
OFFICIAL_OUTCOMES = [
    "critical_success",
    "success_with_hope",
    "success_with_fear",
    "failure_with_hope",
    "failure_with_fear",
    "gm_spends_fear",
]
BANNED_CONDITIONS = {"Audited", "Bramble-Snared", "Ward-Sick", "Compliance-Flagged", "Memory-Raw", "Debt-Marked"}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def read_json(path: Path) -> Any:
    return json.loads(read(path)) if path.exists() else None


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: Any = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail if isinstance(detail, str) else json.dumps(detail, indent=2)})


def raster(path: str) -> bool:
    return path.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))


def main() -> int:
    checks: list[dict[str, Any]] = []

    for rel in REQUIRED_FILES:
        add(checks, f"required file exists: {rel}", (DIST / rel).exists(), rel)

    maps = read_json(DIST / "data" / "maps.json") or []
    entities = read_json(DIST / "data" / "entities.json") or {}
    slides = read_json(DIST / "data" / "slides.json") or []
    counters = read_json(DIST / "data" / "session-counters-schema.json") or {}
    next_moves = read_json(DIST / "data" / "next-move-cards.json") or {}
    workspaces = read_json(DIST / "data" / "combat-workspaces.json") or []

    map_ids = {row.get("id") for row in maps}
    add(checks, "maps.json is populated", isinstance(maps, list) and len(maps) >= 20, len(maps))
    add(checks, "priority map/environment slides exist", REQUIRED_MAPS <= map_ids, sorted(REQUIRED_MAPS - map_ids))

    location_entities = [row for row in entities.values() if row.get("type") == "location"]
    missing_location_maps = [entity.get("id") for entity in location_entities if f"MAP-LOC-{entity.get('id')}" not in map_ids]
    add(checks, "every location entity has a generated location map", not missing_location_maps, missing_location_maps)

    missing_assets: list[str] = []
    non_raster_assets: list[str] = []
    missing_ai_sources: list[str] = []
    non_ai_primary: list[str] = []
    non_battlemap_primary: list[str] = []
    missing_battlemap_sources: list[str] = []
    missing_inspiration_assets: list[str] = []
    missing_schematic_assets: list[str] = []
    for row in maps:
        for key in ["image", "playerSafeImage"]:
            rel = row.get(key, "")
            if not raster(rel):
                non_raster_assets.append(f"{row.get('id')}:{key}:{rel}")
            if not (DIST / rel).exists():
                missing_assets.append(f"{row.get('id')}:{key}:{rel}")
        if not row.get("aiGeneratedPrimary") or row.get("assetSourceType") not in {"ai-generated", "ai-generated-battlemap"}:
            non_ai_primary.append(row.get("id"))
        ai_source = row.get("aiSourceImage", "")
        if not ai_source or not (ROOT / ai_source).exists():
            missing_ai_sources.append(f"{row.get('id')}:{ai_source}")
        if row.get("id") in REQUIRED_COMBAT_MAPS:
            if row.get("assetSourceType") != "ai-generated-battlemap":
                non_battlemap_primary.append(f"{row.get('id')}:{row.get('assetSourceType')}")
            battle_source = row.get("battlemapSourceImage", "")
            if not battle_source or not (ROOT / battle_source).exists():
                missing_battlemap_sources.append(f"{row.get('id')}:{battle_source}")
        for key in ["inspirationImage", "inspirationPlayerSafeImage"]:
            rel = row.get(key, "")
            if rel and not (DIST / rel).exists():
                missing_inspiration_assets.append(f"{row.get('id')}:{key}:{rel}")
        for key in ["schematicImage", "schematicPlayerSafeImage"]:
            rel = row.get(key, "")
            if rel and not (DIST / rel).exists():
                missing_schematic_assets.append(f"{row.get('id')}:{key}:{rel}")
    add(checks, "all map image references are raster", not non_raster_assets, non_raster_assets[:30])
    add(checks, "all map image assets exist", not missing_assets, missing_assets[:30])
    add(checks, "all primary map images are AI-generated assets", not non_ai_primary, non_ai_primary[:30])
    add(checks, "all AI map source crops exist", not missing_ai_sources, missing_ai_sources[:30])
    add(checks, "all required combat maps use AI-generated battlemap primaries", not non_battlemap_primary, non_battlemap_primary)
    add(checks, "all required AI battlemap source files exist", not missing_battlemap_sources, missing_battlemap_sources)
    add(checks, "declared visual inspiration alternates exist", not missing_inspiration_assets, missing_inspiration_assets[:30])
    add(checks, "declared schematic alternates exist", not missing_schematic_assets, missing_schematic_assets[:30])

    slide_map_ids = {slide.get("id") for slide in slides if slide.get("type") in {"map", "battlefield", "environment"} or str(slide.get("id", "")).startswith("MAP-")}
    add(checks, "all generated maps have Run Mode map slides", map_ids <= slide_map_ids, sorted(map_ids - slide_map_ids)[:30])

    workspace_scene_ids = {row.get("id") for row in workspaces}
    add(checks, "combat workspaces exist for required combat scenes", REQUIRED_COMBAT_SCENES <= workspace_scene_ids, sorted(REQUIRED_COMBAT_SCENES - workspace_scene_ids))
    for row in workspaces:
        page = DIST / "pages" / "combat" / f"{row.get('slug')}.html"
        text = read(page)
        required_terms = ["Battle Layout", "Starting Position", "Hide", "climb", "Social", "Fear", "Encounter Cockpit", "Oddball Player Action Kit"]
        add(checks, f"combat page is complete: {row.get('id')}", page.exists() and all(term in text for term in required_terms), str(page.relative_to(DIST)))

    for entity in location_entities:
        page = DIST / "pages" / "entities" / f"{entity.get('id')}.html"
        text = read(page)
        add(checks, f"location wiki has map section: {entity.get('id')}", "Location Maps" in text and f"MAP-LOC-{entity.get('id')}" in text, str(page.relative_to(DIST)))

    spend_ids = {row.get("id") for row in counters.get("fearSpendOptions", [])}
    add(checks, "Fear spend menu uses official spend IDs only", spend_ids == OFFICIAL_FEAR_SPENDS, sorted(spend_ids ^ OFFICIAL_FEAR_SPENDS))

    run_html = read(DIST / "run.html")
    run_js = read(DIST / "js" / "run-mode.js")
    display_js = read(DIST / "js" / "player-display.js")
    display_html = read(DIST / "player-display.html")
    add(checks, "Run Mode mounts compact Fear dock, Encounter Cockpit, Next Move, and map scripts", all(term in run_html for term in ["data-gm-hud", "encounter-cockpit.js", "next-move-kit.js", "maps-environment-slides.js"]), "")
    add(checks, "Run Mode dispatches slide render events for live widgets", "goldspire-run-slide-rendered" in run_js, "")
    banned_run_terms = ["Spotlight Tracker", "data-spotlight-dock", "acted this beat", "Reset Beat", "Next PC"]
    add(checks, "Run Mode no longer mounts global tracker/beat UI", not any(term in (run_html + run_js) for term in banned_run_terms), banned_run_terms)
    add(checks, "Run Mode primary UI does not imply fixed initiative", "initiative" not in (run_html + run_js).lower(), "")
    add(checks, "Run Mode uses Encounter Cockpit entry points", "data-encounter-entry" in run_js and "data-encounter-drawer" in run_html, "")
    add(checks, "Run Mode map slides label AI-generated primary maps", "AI-generated map" in run_js, "")
    add(checks, "compact Fear dock avoids mystery-letter controls", all(term not in run_html for term in [">S<", ">U<", ">R<"]), "")
    noncombat_slides = [slide for slide in slides if slide.get("type") == "scene" and slide.get("liveTools", {}).get("mode") != "encounter"]
    encounter_slides = [slide for slide in slides if slide.get("liveTools", {}).get("mode") == "encounter"]
    add(checks, "ordinary scene slides do not receive encounter tools", noncombat_slides and all(slide.get("liveTools", {}).get("mode") != "encounter" for slide in noncombat_slides), len(noncombat_slides))
    add(checks, "combat/potential-combat slides expose encounter mode", REQUIRED_COMBAT_SCENES <= {slide.get("liveTools", {}).get("encounterId") or slide.get("id") for slide in encounter_slides}, sorted(REQUIRED_COMBAT_SCENES - {slide.get("liveTools", {}).get("encounterId") or slide.get("id") for slide in encounter_slides}))
    add(checks, "combat workspace data is exposed to Run Mode JS", "GOLDSPIRE_COMBAT_WORKSPACES" in read(DIST / "data" / "maps-data.js"), "")
    add(checks, "Player Display supports safe map projection", "showMap" in display_js and "mapData" in display_js and "css/gm-hud.css" in display_html, "")
    add(checks, "Player Display map path has no hotspot rendering", "map-hotspot" not in display_js and "hotspots" not in display_js, "")
    add(checks, "Run Mode map slide template no longer mounts hotspot overlays", "mapHotspotsMarkup(map)" not in run_js, "")
    add(checks, "Run Mode no longer renders dead map CTAs", all(term not in run_js for term in ["Show player-safe map", "Toggle GM layer", "data-map-show-player", "data-map-toggle-gm"]), "")
    add(checks, "Run Mode map player actions render as cards, not cramped tables", "map-action-card-list" in run_js and "map-roll-table" not in run_js, "")
    add(checks, "Run Mode labels location Fear guidance as spendable table pressure", "Spend Fear here" in run_js and "Fear / dynamic events" not in run_js, "")

    maps_by_id = {row.get("id"): row for row in maps}
    missing_packet_maps = sorted(REQUIRED_PACKET_MAPS - set(maps_by_id))
    add(checks, "location packet map records exist", not missing_packet_maps, missing_packet_maps)
    missing_packet_fields = []
    leaked_packet_tags = []
    for map_id in REQUIRED_PACKET_MAPS & set(maps_by_id):
        row = maps_by_id[map_id]
        if not row.get("gmOrientation") or not row.get("readAloud") or not row.get("sensoryStack") or not row.get("transitions"):
            missing_packet_fields.append(map_id)
        row_text = json.dumps(row, ensure_ascii=False)
        if "[Atlas addition" in row_text:
            leaked_packet_tags.append(map_id)
    add(checks, "packet-bound location maps include fields 1-8 substance", not missing_packet_fields, missing_packet_fields)
    add(checks, "packet-bound location maps strip optional-tag scaffolding", not leaked_packet_tags, leaked_packet_tags)
    packet_combat_ids = {row.get("id") for row in maps if row.get("packetLocationId") and row.get("hasCombat")}
    add(checks, "packet combat blocks render only for Ambush and Open Vale", packet_combat_ids == REQUIRED_PACKET_COMBAT_MAPS, sorted(packet_combat_ids ^ REQUIRED_PACKET_COMBAT_MAPS))
    packet_noncombat_with_range = sorted(row.get("id") for row in maps if row.get("packetLocationId") and not row.get("hasCombat") and row.get("rangeBands"))
    add(checks, "packet non-combat maps do not expose range bands", not packet_noncombat_with_range, packet_noncombat_with_range)
    packet_hotspot_maps = sorted(row.get("id") for row in maps if row.get("packetLocationId") and row.get("hotspots"))
    add(checks, "packet location maps do not include dot hotspot data", not packet_hotspot_maps, packet_hotspot_maps)
    hotspot_maps = sorted(row.get("id") for row in maps if row.get("hotspots"))
    add(checks, "all map records omit dot hotspot data", not hotspot_maps, hotspot_maps[:30])

    def has_sense(labels: set[str], *needles: str) -> bool:
        return any(any(needle in label for needle in needles) for label in labels)

    required_location_senses = []
    for row in maps:
        map_id = row.get("id", "")
        if not (map_id.startswith("MAP-LOC-") or map_id in {"MAP-S01-02", "MAP-S02-03", "MAP-COMBAT-S01-03", "MAP-S05-03"}):
            continue
        labels = {str(item.get("sense", "")).lower() for item in row.get("sensoryStack", []) if item.get("detail")}
        if not (
            has_sense(labels, "sight")
            and has_sense(labels, "sound")
            and has_sense(labels, "smell")
            and has_sense(labels, "texture", "touch")
            and has_sense(labels, "background", "life")
        ):
            required_location_senses.append({"id": map_id, "labels": sorted(labels)})
    add(checks, "location and encounter maps expose sight/sound/smell/texture/background sensory rows", not required_location_senses, required_location_senses[:30])

    plain_intro_checks = {
        "MAP-LOC-old-sable": ("forest", "Old Sable"),
        "MAP-LOC-hush": ("village", "Hush"),
        "MAP-LOC-the-sunless-farms": ("farms", "Sunless Farms"),
        "MAP-COMBAT-S01-03": ("road", "creature"),
    }
    bad_plain_intros = []
    for map_id, terms in plain_intro_checks.items():
        text = str(maps_by_id.get(map_id, {}).get("readAloud", ""))
        lower_text = text.lower()
        if not all(term.lower() in lower_text for term in terms):
            bad_plain_intros.append({"id": map_id, "readAloud": text})
    add(checks, "priority location read-alouds introduce plain-language place type before lore names", not bad_plain_intros, bad_plain_intros)

    outcome_order = [row.get("id") for row in next_moves.get("officialOutcomeOrder", [])]
    add(checks, "Next Move shows official outcomes first", outcome_order[:6] == OFFICIAL_OUTCOMES, outcome_order)
    scene_cards = next_moves.get("scenes", {})
    add(checks, "at least five scenes have scene-specific Next Move cards", len(scene_cards) >= 5, sorted(scene_cards)[:10])
    banned_hits = []
    next_text = json.dumps(next_moves, ensure_ascii=False)
    for condition in BANNED_CONDITIONS:
        if re.search(rf"\b{re.escape(condition)}\b", next_text):
            banned_hits.append(condition)
    add(checks, "Next Move cards do not invent banned custom conditions", not banned_hits, banned_hits)

    map_slides = [slide for slide in slides if str(slide.get("id", "")).startswith("MAP-")]
    bad_safe_maps = []
    bad_safe_hotspots = []
    bad_map_beats = []
    bad_player_packet_leaks = []
    for slide in map_slides:
        safe = slide.get("playerSafeProjection", {})
        safe_text = json.dumps(safe, ensure_ascii=False).lower()
        if "gmnote" in safe_text or "gm-only" in safe_text or "asset status" in safe_text or "image prompt" in safe_text:
            bad_safe_maps.append(slide.get("id"))
        if "hotspots" in safe_text or "canon source" in safe_text or "[atlas addition" in safe_text:
            bad_safe_hotspots.append(slide.get("id"))
        modes = {beat.get("displayMode") for beat in slide.get("playerBeats", [])}
        if slide.get("id") in REQUIRED_PACKET_MAPS and not {"map-only", "map-text", "text-first"} <= modes:
            bad_map_beats.append({"slide": slide.get("id"), "modes": sorted(modes)})
        if slide.get("id") in REQUIRED_PACKET_MAPS and ("hidden truth" in safe_text or "soul-audit wraiths and legacy skeletons read as corporate instruments" in safe_text):
            bad_player_packet_leaks.append(slide.get("id"))
    add(checks, "map slide player-safe projections hide GM-only/dev text", not bad_safe_maps, bad_safe_maps)
    add(checks, "map slide player-safe projections contain no hotspots/tags/canon notes", not bad_safe_hotspots, bad_safe_hotspots)
    add(checks, "packet map slides expose map/text player beat modes", not bad_map_beats, bad_map_beats)
    add(checks, "packet map player projections do not leak hidden truth", not bad_player_packet_leaks, bad_player_packet_leaks)
    hush_slide = next((slide for slide in slides if slide.get("id") == "MAP-LOC-hush"), {})
    add(checks, "Hush map is placed in Act Three, not Prologue", hush_slide.get("sectionId") == "ACT-THREE" and (hush_slide.get("linkedSceneIds") or [""])[0] == "S03-01", {"section": hush_slide.get("sectionId"), "linked": hush_slide.get("linkedSceneIds")})

    report = {
        "pass": all(check["ok"] for check in checks),
        "check_count": len(checks),
        "issue_count": sum(1 for check in checks if not check["ok"]),
        "location_count": len(location_entities),
        "map_count": len(maps),
        "required_combat_map_count": len(REQUIRED_COMBAT_MAPS),
        "combat_workspace_count": len(workspaces),
        "checks": checks,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    if QA_REPORT.exists():
        passed = report["check_count"] - report["issue_count"]
        QA_REPORT.write_text(
            QA_REPORT.read_text(encoding="utf-8")
            + "\n\n## Maps / Combat HUD / Next Move QA\n\n"
            + f"Checks passed: **{passed} / {report['check_count']}**\n\n"
            + f"Checks failed: **{report['issue_count']}**\n\n"
            + f"- Location maps generated: **{len(location_entities)} / {len(location_entities)}**.\n"
            + f"- Total map records: **{len(maps)}**.\n"
            + f"- Combat battlemap primaries verified: **{len(REQUIRED_COMBAT_MAPS)} / {len(REQUIRED_COMBAT_MAPS)}**.\n"
            + "- Every primary map is declared as an AI-generated raster asset; combat maps use stricter AI-generated battlemap primaries where available.\n"
            + "- Earlier AI map art is preserved as visual inspiration alternates; schematic boards are discreet reference alternates only.\n"
            + f"- Combat workspaces: **{len(workspaces)}**.\n"
            + "- Fear spend menu is restricted to official spend categories.\n"
            + "- Run Mode uses Encounter Cockpit language instead of fixed initiative bookkeeping.\n"
            + "\nDetailed JSON: `data/qa-map-combat-hud-report.json`.\n",
            encoding="utf-8",
        )
        (DOCS / "STORY_ATLAS_QA_REPORT.md").write_text(QA_REPORT.read_text(encoding="utf-8"), encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
