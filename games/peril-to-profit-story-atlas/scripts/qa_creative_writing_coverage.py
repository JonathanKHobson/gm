#!/usr/bin/env python3
"""QA for the creative-writing recovery and visual-gallery pass."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
REPORT = DIST / "data" / "creative-writing-coverage-report.json"

RELEVANT_TYPES = {"pc", "npc", "creature", "enemy", "faction", "corporation", "location"}
REQUIRED_LOCATION_IMAGINE = {
    "goldspire-territories",
    "emeris-capital-gate",
    "emeris-capital",
    "athervast",
}
SPOT_CHECK_GALLERY = {
    "hush",
    "athervast",
    "strixwolf-mother",
    "strixwolf-pup-one",
    "strixwolf-pup-two",
    "strixwolf",
    "fire-solutions",
}
SCAFFOLD_PATTERNS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"confirm or override",
        r"profile_fallback",
        r"describe what should go",
        r"write (the|a) description",
        r"todo\b",
        r"\btbd\b",
        r"lorem ipsum",
    ]
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def add(checks: list[dict], name: str, passed: bool, details=None) -> None:
    checks.append({"name": name, "passed": bool(passed), "details": details or []})


def text_values(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from text_values(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from text_values(item)


def entity_by_id(entities: dict[str, dict]) -> dict[str, dict]:
    return {entity["id"]: entity for entity in entities.values() if entity.get("id")}


def page_for(entity_id: str) -> Path:
    return DIST / "pages" / "entities" / f"{entity_id}.html"


def imagine_for(entity: dict) -> str:
    return (
        entity.get("imagine_it_like")
        or entity.get("location_profile", {}).get("imagine_it_like")
        or entity.get("npc_profile", {}).get("imagine_it_like")
        or entity.get("faction_profile", {}).get("imagine_it_like")
        or ""
    )


def main() -> int:
    checks: list[dict] = []
    entities = load_json(DIST / "data" / "entities.json")
    by_id = entity_by_id(entities)
    gallery = load_json(DIST / "data" / "entity-visual-gallery.json")
    inventory = load_json(DIST / "data" / "image-inventory.json")

    relevant = [entity for entity in by_id.values() if entity.get("type") in RELEVANT_TYPES]
    missing_pages = [entity["id"] for entity in relevant if not page_for(entity["id"]).exists()]
    add(checks, "Every relevant entity has a rendered wiki page", not missing_pages, missing_pages[:30])

    blank_core = []
    for entity in relevant:
        core = [entity.get("summary", ""), entity.get("role", "")]
        if entity.get("type") == "location":
            core.append(entity.get("location_profile", {}).get("player_safe", {}).get("one_line", ""))
        if entity.get("npc_profile"):
            core.append(entity.get("npc_profile", {}).get("block1", {}).get("one_line", ""))
        if entity.get("faction_profile"):
            core.append(entity.get("faction_profile", {}).get("player_safe", {}).get("short_description", ""))
        if not any(str(value).strip() for value in core):
            blank_core.append(entity["id"])
    add(checks, "Relevant entities have core prose", not blank_core, blank_core[:30])

    scaffold_hits = []
    for entity in relevant:
        for value in text_values(entity):
            if any(pattern.search(value) for pattern in SCAFFOLD_PATTERNS):
                scaffold_hits.append({"id": entity["id"], "text": value[:180]})
                break
    add(checks, "Relevant entity prose has no scaffold/review marker leaks", not scaffold_hits, scaffold_hits[:30])

    location_missing_imagine = [
        entity["id"]
        for entity in relevant
        if entity.get("type") == "location" and not imagine_for(entity)
    ]
    add(checks, "All location profiles have Imagine This Like content", not location_missing_imagine, location_missing_imagine)

    known_missing = [slug for slug in REQUIRED_LOCATION_IMAGINE if not imagine_for(by_id.get(slug, {}))]
    add(checks, "Known previously missing locations now have Imagine This Like", not known_missing, known_missing)

    imagine_not_rendered = []
    for entity in relevant:
        imagine = imagine_for(entity)
        if not imagine:
            continue
        page = page_for(entity["id"])
        text = page.read_text(encoding="utf-8") if page.exists() else ""
        if "Imagine This Like" not in text:
            imagine_not_rendered.append(entity["id"])
    add(checks, "Imagine This Like renders on wiki pages when present", not imagine_not_rendered, imagine_not_rendered[:40])

    gallery_missing = [slug for slug in SPOT_CHECK_GALLERY if slug not in gallery or len(gallery.get(slug, [])) < 2]
    add(checks, "Spot-check entities have visual galleries with variants", not gallery_missing, gallery_missing)

    gallery_not_rendered = []
    for slug in SPOT_CHECK_GALLERY:
        page = page_for(slug)
        if page.exists() and "Visual Asset Gallery" not in page.read_text(encoding="utf-8"):
            gallery_not_rendered.append(slug)
    add(checks, "Spot-check visual galleries render on wiki pages", not gallery_not_rendered, gallery_not_rendered)

    missing_slots = inventory.get("missing", [])
    fire_missing = [slot for slot in missing_slots if "fire-solutions" in str(slot).lower() or "fire solutions" in str(slot).lower()]
    add(checks, "Fire Solutions has no missing image slots", not fire_missing, fire_missing)

    pup_status = {
        slug: {
            "image": by_id.get(slug, {}).get("image"),
            "status": by_id.get(slug, {}).get("image_asset_status"),
        }
        for slug in ["strixwolf-pup-one", "strixwolf-pup-two"]
    }
    pup_fail = [slug for slug, row in pup_status.items() if row["status"] != "creature_images" or "creature-images" not in str(row["image"])]
    add(checks, "Strixwolf pup primary images use creature_images overrides", not pup_fail, pup_status)

    run_js = (DIST / "js" / "run-mode.js").read_text(encoding="utf-8")
    add(checks, "Run Mode includes new-tab reference link safety", "decorateRunReferenceLinks" in run_js and "MutationObserver" in run_js)

    report = {
        "checks": checks,
        "passed": all(check["passed"] for check in checks),
        "checked_entity_count": len(relevant),
        "relevant_types": sorted(RELEVANT_TYPES),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    for check in checks:
        status = "PASS" if check["passed"] else "FAIL"
        print(f"{status}: {check['name']}")
        if not check["passed"]:
            print(json.dumps(check["details"], indent=2, ensure_ascii=False))
    print(f"Wrote {REPORT}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
