#!/usr/bin/env python3
"""Deepening QA for the Goldspire Story Atlas production systems."""

from __future__ import annotations

import json
import re
import urllib.parse
from html import unescape
from pathlib import Path


RASTER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
FORBIDDEN_EMOJI_GLYPHS = set("👤🐾⚔🏴🏢🏛💠🧩🎲🔀🧾🔒💚⚠🕯🪝🎬🧭")
FORBIDDEN_FILLER = [
    "wants to survive the module's immediate pressure with dignity intact",
    "wants to survive the module’s immediate pressure with dignity intact",
    "fears being flattened into a function",
    "shaped by the pressure of the Goldspire route",
    "use as tactical pressure with story residue",
]
REQUIRED_PAGES = [
    "index.html",
    "pages/entity-index.html",
    "pages/handouts.html",
    "pages/session-zero.html",
    "player-display.html",
]
STATE_FIELDS = [
    "strixwolf_outcome",
    "strixwolf_trust",
    "strixwolf_blood_debt",
    "bramble_outcome",
    "bramble_truth_learned",
    "hush_trust",
    "custodian_trust",
    "ward_stability",
    "report_choice",
]
ROBUST_ENTITY_KEYS = [
    "player_description",
    "gm_truth",
    "story_use",
    "wants_pressures",
    "fears_vulnerabilities",
    "appearance",
    "checks",
    "class_reveals",
    "investigation",
    "handout_text",
    "tv_safe",
    "future_hooks",
]
CHECK_KEYS = [
    "dc",
    "critical_success",
    "success_with_hope",
    "success_with_fear",
    "failure_with_hope",
    "failure_with_fear",
    "gm_fear_spend",
]
HANDOUT_IDS = [
    "premise",
    "contract",
    "incident-placard",
    "route-ledger",
    "bramble-slips",
    "hush-welcome",
    "clover-gifts",
    "keystone-warning",
    "open-vale-reference",
    "gm-quick-sheet",
    "conditions",
]


def resolve_paths() -> tuple[Path, Path]:
    here = Path(__file__).resolve()
    if (here.parents[1] / "data" / "scenes.json").exists():
        dist = here.parents[1]
        root = dist.parents[1]
        return root, dist
    root = here.parents[2]
    return root, root / "dist" / "story-atlas"


ROOT, DIST = resolve_paths()
VAULT = ROOT / "obsidian_vault"
OUTPUT = ROOT / "output" / "playwright" / "story-atlas"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def add(checks: list[dict], name: str, ok: bool, detail: str = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def value_present(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


def note_link_title(title: str) -> str:
    return title.replace("/", "-").replace("  ", " ").strip()


def has_source_backed_raster(path_value: str) -> bool:
    path = DIST / path_value
    return bool(path_value) and path.exists() and path.suffix.lower() in RASTER_EXTENSIONS


def plain_html_text(markup: str) -> str:
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", markup))).strip()


def all_project_text_files() -> list[Path]:
    patterns = ["*.html", "*.css", "*.js", "*.json", "*.md"]
    files: list[Path] = []
    for pattern in patterns:
        files.extend(DIST.rglob(pattern))
    return sorted(set(files))


def check_assets_and_icons(checks, scenes, entities) -> None:
    svg_files = sorted(DIST.rglob("*.svg"))
    add(checks, "zero SVG files exist in final atlas package", not svg_files, "\n".join(str(p.relative_to(DIST)) for p in svg_files[:80]))

    svg_refs = []
    emoji_refs = []
    for path in all_project_text_files():
        body = text(path)
        if ".svg" in body or "image/svg" in body:
            svg_refs.append(str(path.relative_to(DIST)))
        found = sorted({char for char in body if char in FORBIDDEN_EMOJI_GLYPHS})
        if found:
            emoji_refs.append(f"{path.relative_to(DIST)} -> {''.join(found)}")
    add(checks, "zero SVG references remain in HTML, CSS, JS, JSON, Markdown, or pages", not svg_refs, "\n".join(svg_refs[:80]))
    add(checks, "zero emoji remain as primary UI icon glyphs", not emoji_refs, "\n".join(emoji_refs[:80]))

    bad_scenes = [
        f"{scene['id']} -> {scene.get('image')} [{scene.get('image_asset_status')}]"
        for scene in scenes
        if scene.get("image_asset_status") != "image_gen"
        or not (DIST / scene.get("image", "")).exists()
        or Path(scene.get("image", "")).suffix.lower() not in RASTER_EXTENSIONS
    ]
    add(checks, "every scene has a real raster Image Gen asset", not bad_scenes, "\n".join(bad_scenes[:80]))

    bad_entities = [
        f"{name} -> {entity.get('image')} [{entity.get('image_asset_status')}]"
        for name, entity in entities.items()
        if not has_source_backed_raster(entity.get("image", ""))
    ]
    add(checks, "every major entity has a real source-backed raster asset", not bad_entities, "\n".join(bad_entities[:120]))

    icon_paths = sorted({entity.get("meta", {}).get("icon_asset", "") for entity in entities.values() if entity.get("meta", {}).get("icon_asset")})
    bad_icons = [path for path in icon_paths if not (DIST / path).exists() or Path(path).suffix.lower() not in RASTER_EXTENSIONS]
    add(checks, "type icons are raster assets, not emoji or SVG", not bad_icons, "\n".join(bad_icons))


def check_required_pages_and_navigation(checks, entities) -> None:
    missing_pages = [page for page in REQUIRED_PAGES if not (DIST / page).exists()]
    add(checks, "required production pages exist", not missing_pages, "\n".join(missing_pages))

    index = text(DIST / "index.html")
    primary_nav_match = re.search(r"<nav[^>]*class=\"main-nav\".*?</nav>", index, flags=re.S)
    primary_nav = primary_nav_match.group(0) if primary_nav_match else index[:5000]
    add(checks, "hero navigation uses production pages, not raw Markdown", ".md" not in primary_nav and "Vault Hub" not in primary_nav and "Open Entity Wiki" not in primary_nav, "")
    for label, href in [
        ("Browse the story", "#acts"),
        ("Entity Wiki", "pages/entity-index.html"),
        ("Player Display", "player-display.html"),
        ("Handouts", "pages/handouts.html"),
        ("Session Zero", "pages/session-zero.html"),
    ]:
        add(checks, f"hero navigation includes {label}", label in index and href in index, href)
    add(checks, "hero navigation includes GM Rules Drawer button", "GM Rules Drawer" in index and "data-rules-open" in index, "")

    for kind in sorted({entity.get("type") for entity in entities.values()}):
        add(checks, f"legend chip links to {kind} category", f'href="pages/entity-index.html#category-{kind}"' in index, "")


def check_entity_index(checks, entities) -> None:
    page = text(DIST / "pages" / "entity-index.html")
    for kind in sorted({entity.get("type") for entity in entities.values()}):
        add(checks, f"entity index category exists for {kind}", f'id="category-{kind}"' in page, "")
    missing_cards = [name for name, entity in entities.items() if f'entities/{entity["id"]}.html' not in page or f'data-entity="{entity["id"]}"' not in page]
    add(checks, "entity index lists every entity with thumbnail and link", not missing_cards, "\n".join(missing_cards[:120]))
    add(checks, "entity index has search, filters, and sorting controls", all(token in page for token in ["entity-index-search", "entity-type-filter", "entity-sort"]), "")


def check_linkification(checks, scenes, entities) -> None:
    index = text(DIST / "index.html")
    missing_scene_entities = []
    for scene in scenes:
        page_path = DIST / "pages" / "scenes" / f"{scene['slug']}.html"
        page = text(page_path)
        for name in scene.get("entities", []):
            entity = entities.get(name)
            if not entity:
                missing_scene_entities.append(f"{scene['id']} unknown {name}")
                continue
            if f'data-entity="{entity["id"]}"' not in index:
                missing_scene_entities.append(f"index missing {scene['id']} -> {name}")
            if f'data-entity="{entity["id"]}"' not in page:
                missing_scene_entities.append(f"{scene['id']} page missing {name}")
    add(checks, "every registered scene entity is clickable/hoverable on scene cards and scene pages", not missing_scene_entities, "\n".join(missing_scene_entities[:160]))

    critical_aliases = {
        "Goldspire": "goldspire-territories",
        "Old Sable": "old-sable",
        "carriage": "escort-carriage",
        "Vendor Cart": "vendor-cart",
        "Tamsin": "tamsin-vell",
        "Bramble Union": "bramble-union",
        "Hush": "hush",
        "Whitefire Custodian": "whitefire-custodian",
        "Wardstone": "wardstone",
        "ward infrastructure": "ward-infrastructure",
        "capital gate": "emeris-capital-gate",
        "Athervast": "athervast",
        "Soulspire Solutions": "soulspire-solutions",
        "Kazrak Industries": "kazrak-industries",
        "Relay Spire": "relay-spire",
    }
    missing_aliases = []
    for label, entity_id in critical_aliases.items():
        if label in index and f'data-entity="{entity_id}"' not in index:
            missing_aliases.append(f"{label} -> {entity_id}")
    add(checks, "critical aliases are inline-linked on the main atlas", not missing_aliases, "\n".join(missing_aliases))


def check_production_systems(checks, scenes) -> None:
    index = text(DIST / "index.html")
    app = text(DIST / "app.js")
    css = text(DIST / "styles.css")
    for field in STATE_FIELDS:
        add(checks, f"GM State Console field exists: {field}", f'data-state-field="{field}"' in index, "")
    add(checks, "GM State Console persists to localStorage", "goldspire-atlas-gm-state-v2" in app and "setupStateConsole" in app, "")
    add(checks, "conditional payoff notes are data-driven", "data-when" in index and "applyConditionalNotes" in app, "")
    add(checks, "act collapse, complete, and persistence are wired", all(token in index + app for token in ["data-act-toggle", "data-act-complete", "goldspire-atlas-progress-v2"]), "")
    add(checks, "scene collapse, complete, pin, and show-to-players controls are wired", all(token in index + app for token in ["data-scene-toggle", "data-scene-complete", "data-scene-pin", "data-show-player"]), "")
    add(checks, "dev-only toggles exist and default hidden", all(token in index + css + app for token in ["data-dev-toggle=\"prompts\"", "data-dev-toggle=\"assets\"", "data-dev-toggle=\"qa\"", ".dev-only", "show-dev-prompts"]), "")
    add(
        checks,
        "searchable GM Rules Drawer exists",
        all(
            token in index + app
            for token in [
                "rules-drawer",
                "rules-search",
                "Very Easy 5",
                "Average 15",
                "Nearly Impossible 30",
                "setupRulesDrawer",
            ]
        ),
        "",
    )
    add(checks, "print stylesheet remains present", "@media print" in css, "")

    bad_visible_prompt_contexts = []
    for html_path in sorted(DIST.rglob("*.html")):
        body = text(html_path)
        for pattern in ["Clean party reference", "Do not include", "No Strixwolf", "Asset status:", "Image Prompt"]:
            for match in re.finditer(re.escape(pattern), body, re.IGNORECASE):
                details_start = body.rfind("<details", 0, match.start())
                details_end = body.find("</details>", match.end())
                enclosing_details = body[details_start:details_end] if details_start != -1 and details_end != -1 else ""
                is_dev_prompt = "prompt-block" in enclosing_details and "dev-only" in enclosing_details
                context = body[max(0, match.start() - 250) : match.end() + 250]
                if not is_dev_prompt and "dialog-prompt" not in context and "dev-toolbar" not in context:
                    bad_visible_prompt_contexts.append(f"{html_path.relative_to(DIST)} -> {pattern}")
    add(checks, "internal prompt/status language is hidden behind dev-only UI", not bad_visible_prompt_contexts, "\n".join(bad_visible_prompt_contexts[:80]))

    handouts = text(DIST / "pages" / "handouts.html")
    missing_handouts = [hid for hid in HANDOUT_IDS if f"handout-{hid}" not in handouts]
    add(checks, "Handouts Hub includes required handouts", not missing_handouts, "\n".join(missing_handouts))

    display = text(DIST / "player-display.html")
    add(checks, "Player Display / TV Mode is player-safe by default", "GM-Only" not in display and "image_prompt" not in display and "future" not in display.lower(), "")
    add(
        checks,
        "Player Display supports scene selection and fullscreen",
        ("?slide=" in display or "slides-data.js" in display)
        and "display-sync.js" in display
        and "fullscreen" in display.lower(),
        "",
    )

    session = text(DIST / "pages" / "session-zero.html")
    session_visible_text = plain_html_text(session)
    add(checks, "Session Zero includes onboarding essentials", all(token in session_visible_text for token in ["Quick Premise", "Tone and Safety Check", "What PCs Know", "What PCs Do Not Know Yet", "Marlowe"]), "")


def check_scene_depth(checks, scenes) -> None:
    bad_questions = [scene["id"] for scene in scenes if not 2 <= len(scene.get("player_questions", [])) <= 4]
    add(checks, "every scene has 2-4 player-facing questions", not bad_questions, "\n".join(bad_questions))
    bad_relationships = [scene["id"] for scene in scenes if len(scene.get("relationship_prompts", [])) < 1]
    add(checks, "every scene has relationship prompts", not bad_relationships, "\n".join(bad_relationships))
    bad_ownership = [scene["id"] for scene in scenes if not scene.get("ownership_prompt")]
    add(checks, "every scene has a scene ownership prompt", not bad_ownership, "\n".join(bad_ownership))
    bad_reveals = [scene["id"] for scene in scenes if len(scene.get("reveal_hooks", [])) < 3]
    add(checks, "every scene has class/ancestry/community reveal hooks", not bad_reveals, "\n".join(bad_reveals))
    bad_fear = [scene["id"] for scene in scenes if not scene.get("fear_spends")]
    add(checks, "every scene has Fear spend ideas", not bad_fear, "\n".join(bad_fear))
    bad_checks = []
    for scene in scenes:
        for idx, check in enumerate(scene.get("checks", []), 1):
            missing = [key for key in CHECK_KEYS if not value_present(check.get(key))]
            if missing:
                bad_checks.append(f"{scene['id']} check {idx}: {', '.join(missing)}")
    add(checks, "every scene check has DCs and Hope/Fear outcomes", not bad_checks, "\n".join(bad_checks[:120]))


def check_entity_depth(checks, entities) -> None:
    bad_robust = []
    for name, entity in entities.items():
        robust = entity.get("robust", {})
        missing = [key for key in ROBUST_ENTITY_KEYS if not value_present(robust.get(key))]
        if missing:
            bad_robust.append(f"{name}: {', '.join(missing)}")
    add(checks, "every entity has robust schema data", not bad_robust, "\n".join(bad_robust[:120]))

    bad_pages = []
    required_headings = [
        "Player-Facing Description",
        "GM-Only Truth",
        "Wants / Pressures",
        "Fears / Vulnerabilities",
        "Checks / Rolls",
        "Class / Ancestry / Community Reveals",
        "Questions to Ask Players",
        "Future Hooks",
    ]
    for name, entity in entities.items():
        page_path = DIST / "pages" / "entities" / f"{entity['id']}.html"
        page = text(page_path)
        missing = [heading for heading in required_headings if heading not in page]
        if missing:
            bad_pages.append(f"{name}: {', '.join(missing)}")
    add(checks, "every entity page renders the robust schema", not bad_pages, "\n".join(bad_pages[:120]))

    all_data = json.dumps(entities, ensure_ascii=False).lower()
    filler_hits = [phrase for phrase in FORBIDDEN_FILLER if phrase.lower() in all_data]
    add(checks, "forbidden generic filler phrases are absent", not filler_hits, "\n".join(filler_hits))


def check_lore_corrections(checks, entities) -> None:
    kazrak = entities.get("Kazrak Industries", {})
    kazrak_text = json.dumps(kazrak, ensure_ascii=False).lower()
    add(checks, "Kazrak is framed as a peer megacorp, not parent/umbrella", "peer" in kazrak_text and "umbrella megacorp" not in kazrak_text and "parent company" in kazrak_text, "")
    all_generated = "\n".join(text(path) for path in all_project_text_files() if "goldspire_atlas_deepening_support" not in str(path))
    add(checks, "Soulspire Solutions is the verified spelling in production output", "Soulspire Solutions" in all_generated and "Solspire" not in all_generated and "Soulspire Industries" not in all_generated, "")
    gterritories = json.dumps(entities.get("Goldspire Territories", {}), ensure_ascii=False).lower()
    add(checks, "Goldspire Territories are treated as frontier/extraction hinterland", all(term in gterritories for term in ["frontier", "outside athervast"]), "")

    keystone = entities.get("Keystone Asset", {}).get("robust", {}).get("keystone_profile", {})
    required_keystone_keys = ["what", "wardstone", "source_gate", "capital_city", "custody", "built_by", "protects", "profit", "value", "damage", "magic_nearby", "communities_notice"]
    missing_keys = [key for key in required_keystone_keys if not value_present(keystone.get(key))]
    add(checks, "Keystone Asset answers the wardstone/capital gate questions", not missing_keys, "\n".join(missing_keys))
    keystone_page = text(DIST / "pages" / "entities" / "keystone-asset.html")
    for token in ["Athervast", "Emeris Capital Gate", "Wardstone", "Soulspire Solutions", "Public-Private Ward Compact", "Goldspire Ward Network"]:
        add(checks, f"Keystone page explains {token}", token in keystone_page, "")

    ward_stack = json.dumps([entities.get(name, {}) for name in ["Kazrak Industries", "Mithril & Mortar", "Soulspire Solutions", "The Grail", "Goldwater Financial Institution", "Emeris Crown Holdings", "RuneSpark Entertainment", "Hexmart"]], ensure_ascii=False).lower()
    for term in ["creates/monetizes danger", "builds/maintains", "powers/skims", "guards/responds", "finances/insures", "holds the concession", "spins the story", "cheap consumer protection"]:
        add(checks, f"ward economy stack includes: {term}", term in ward_stack, "")


def check_obsidian_deepening(checks, scenes, entities) -> None:
    scene_missing = []
    for scene in scenes:
        path = VAULT / "02 Scenes" / f"{scene['id']} - {scene['title']}.md"
        if not path.exists():
            scene_missing.append(f"{scene['id']} missing note")
            continue
        body = text(path)
        for token in ["Player Questions / RP Hooks", "How to Spend Fear Here", "Success with Hope", "GM Fear Spend", "Class / Ancestry / Community Reveals"]:
            if token not in body:
                scene_missing.append(f"{scene['id']} missing {token}")
    add(checks, "Obsidian scene notes mirror deepening fields", not scene_missing, "\n".join(scene_missing[:120]))

    entity_missing = []
    for name, entity in entities.items():
        path = VAULT / entity["meta"]["folder"] / f"{note_link_title(entity['name'])}.md"
        if not path.exists():
            entity_missing.append(f"{name} missing note")
            continue
        body = text(path)
        for token in ["Player-Facing Description", "GM-Only Truth", "Investigation Table", "Checks / Rolls", "TV-Safe Description"]:
            if token not in body:
                entity_missing.append(f"{name} missing {token}")
    add(checks, "Obsidian entity notes mirror robust schema", not entity_missing, "\n".join(entity_missing[:120]))

    for name in ["Keystone Asset", "Wardstone", "Ward Infrastructure", "Public-Private Ward Compact", "Emeris Capital Gate", "Athervast", "Goldspire Ward Network"]:
        note_exists = any((folder / f"{name}.md").exists() for folder in VAULT.iterdir() if folder.is_dir())
        add(checks, f"Obsidian vault includes {name}", note_exists, "")


def check_html_links(checks) -> None:
    html_files = list(DIST.rglob("*.html"))
    href_re = re.compile(r'href="([^"]+)"')
    broken = []
    for html_file in html_files:
        body = text(html_file)
        for href in href_re.findall(body):
            if href.startswith(("http:", "https:", "mailto:", "tel:", "javascript:", "#")):
                continue
            parsed = urllib.parse.urlsplit(href)
            clean = urllib.parse.unquote(parsed.path)
            if not clean:
                continue
            target = (html_file.parent / clean).resolve()
            try:
                target.relative_to(DIST.resolve())
            except ValueError:
                continue
            if not target.exists():
                broken.append(f"{html_file.relative_to(DIST)} -> {href}")
    add(checks, "internal HTML links resolve", not broken, "\n".join(broken[:80]))


def check_browser_deepening_artifacts(checks) -> None:
    report = OUTPUT / "deepening-browser-qa.json"
    add(checks, "deepening browser QA report exists", report.exists(), str(report))
    if not report.exists():
        return
    data = load_json(report)
    expectations = {
        "entityIndexLoaded": True,
        "legendCategoryNavigation": True,
        "rulesDrawerSearchWorks": True,
        "stateConsolePersists": True,
        "conditionalNoteAppears": True,
        "sceneCollapsePersists": True,
        "actCollapsePersists": True,
        "playerDisplayWorks": True,
        "noVisiblePromptLeakage": True,
        "noVisibleEmojiIcons": True,
        "noHorizontalOverflow": True,
        "imageContainFirst": True,
        "openImageWindowWorks": True,
    }
    for key, expected in expectations.items():
        add(checks, f"browser QA confirms {key}", data.get(key) is expected, json.dumps(data, indent=2))


def write_report(checks, scenes, entities) -> None:
    passed = sum(1 for check in checks if check["ok"])
    failed = len(checks) - passed
    coverage = {
        "summary": {
            "passed": passed,
            "failed": failed,
            "total": len(checks),
            "scene_count": len(scenes),
            "entity_count": len(entities),
        },
        "checks": checks,
        "requirements": {
            "zero_svg": next((c["ok"] for c in checks if c["name"].startswith("zero SVG files")), False),
            "zero_emoji_primary_icons": next((c["ok"] for c in checks if c["name"].startswith("zero emoji")), False),
            "all_scene_images_raster": next((c["ok"] for c in checks if c["name"].startswith("every scene has")), False),
            "all_entity_images_raster": next((c["ok"] for c in checks if c["name"].startswith("every major entity")), False),
            "entity_index_complete": next((c["ok"] for c in checks if c["name"].startswith("entity index lists")), False),
            "state_console": next((c["ok"] for c in checks if c["name"].startswith("GM State Console persists")), False),
            "obsidian_mirrored": next((c["ok"] for c in checks if c["name"].startswith("Obsidian entity notes")), False),
            "browser_deepening": next((c["ok"] for c in checks if c["name"].startswith("browser QA confirms playerDisplayWorks")), False),
        },
    }
    write_path = DIST / "data" / "qa-coverage-report.json"
    write_path.write_text(json.dumps(coverage, indent=2, ensure_ascii=False), encoding="utf-8")

    lines = [
        "",
        "## Deepening Production QA",
        "",
        f"Checks passed: **{passed} / {len(checks)}**",
        f"Checks failed: **{failed}**",
        "",
    ]
    if failed:
        lines.append("Blocking deepening QA failures remain:")
    else:
        lines.append("Deepening production QA passed: entity wiki, GM state console, rules drawer, handouts, player display, robust pages, lore corrections, Obsidian mirror, raster assets, and browser evidence are all covered.")
    lines.append("")
    for check in checks:
        mark = "PASS" if check["ok"] else "FAIL"
        lines.append(f"- **{mark}** - {check['name']}")
        if check["detail"] and not check["ok"]:
            lines.append("")
            lines.append("  ```text")
            lines.extend("  " + line for line in check["detail"].splitlines())
            lines.append("  ```")

    report = DIST / "QA_REPORT.md"
    existing = report.read_text(encoding="utf-8") if report.exists() else "# Goldspire Story Atlas QA Report\n"
    existing = re.split(r"\n## Deepening Production QA\n", existing, maxsplit=1)[0].rstrip()
    report.write_text(existing + "\n" + "\n".join(lines) + "\n", encoding="utf-8")

    docs_report = ROOT / "docs" / "STORY_ATLAS_QA_REPORT.md"
    if docs_report.parent.exists():
        docs_report.write_text(report.read_text(encoding="utf-8"), encoding="utf-8")

    print(f"Deepening QA passed {passed}/{len(checks)}")
    if failed:
        print(f"Deepening QA failed {failed}; see {report}")
        raise SystemExit(1)


def main() -> None:
    checks: list[dict] = []
    scenes = load_json(DIST / "data" / "scenes.json")
    entities = load_json(DIST / "data" / "entities.json")
    check_assets_and_icons(checks, scenes, entities)
    check_required_pages_and_navigation(checks, entities)
    check_entity_index(checks, entities)
    check_linkification(checks, scenes, entities)
    check_production_systems(checks, scenes)
    check_scene_depth(checks, scenes)
    check_entity_depth(checks, entities)
    check_lore_corrections(checks, entities)
    check_obsidian_deepening(checks, scenes, entities)
    check_html_links(checks)
    check_browser_deepening_artifacts(checks)
    write_report(checks, scenes, entities)


if __name__ == "__main__":
    main()
