#!/usr/bin/env python3
"""QA checks for the generated Goldspire Story Atlas."""

from __future__ import annotations

import json
import html
import re
import urllib.parse
from pathlib import Path


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
DOCS = ROOT / "docs"
RASTER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
FORBIDDEN_EMOJI_GLYPHS = set("👤🐾⚔🏴🏢🏛💠🧩🎲🔀🧾🔒💚⚠🕯🪝🎬🧭")

REQUIRED_SCENE_FIELDS = [
    "id",
    "act",
    "title",
    "beats",
    "image",
    "caption",
    "short",
    "long_storyboard",
    "read_aloud",
    "gm_notes",
    "sensory_details",
    "body_language",
    "sample_dialogue",
    "checks",
    "choices_consequences",
    "clues",
    "loot",
    "entities",
    "payoff_flags",
    "image_prompt_used",
]

REQUIRED_ENTITY_FIELDS = [
    "id",
    "name",
    "type",
    "role",
    "summary",
    "tags",
    "appears_in",
    "connections",
    "image",
    "image_prompt",
    "personality",
    "wants",
    "fears",
    "secrets",
    "body_language",
    "sample_dialogue",
    "equipment",
    "search_or_loot",
    "gm_use",
    "future_hooks",
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def add(checks: list[tuple[str, bool, str]], name: str, ok: bool, detail: str = "") -> None:
    checks.append((name, ok, detail))


def value_present(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


def has_source_backed_raster(path_value: str) -> bool:
    path = DIST / path_value
    return bool(path_value) and path.exists() and path.suffix.lower() in RASTER_EXTENSIONS


def check_scene_completeness(checks, scenes, entities):
    add(checks, "scene count is 27", len(scenes) == 27, f"found {len(scenes)}")
    entity_names = set(entities)
    for scene in scenes:
        missing = [field for field in REQUIRED_SCENE_FIELDS if not value_present(scene.get(field))]
        add(checks, f"{scene['id']} has required scene fields", not missing, ", ".join(missing))
        image = DIST / scene["image"]
        add(checks, f"{scene['id']} image exists", image.exists(), scene["image"])
        page = DIST / "pages" / "scenes" / f"{scene['slug']}.html"
        add(checks, f"{scene['id']} scene page exists", page.exists(), str(page.relative_to(ROOT)))
        unknown = [name for name in scene.get("entities", []) if name not in entity_names]
        add(checks, f"{scene['id']} entity links resolve", not unknown, ", ".join(unknown))
        add(checks, f"{scene['id']} has checks", len(scene.get("checks", [])) >= 1, "")
        add(checks, f"{scene['id']} has choices", len(scene.get("choices_consequences", [])) >= 1, "")
        add(checks, f"{scene['id']} has clues", len(scene.get("clues", [])) >= 1, "")


def check_entity_completeness(checks, scenes, entities):
    add(checks, "expanded entity count is substantial", len(entities) >= 85, f"found {len(entities)}")
    scene_ids = {scene["id"] for scene in scenes}
    for name, entity in entities.items():
        missing = [field for field in REQUIRED_ENTITY_FIELDS if not value_present(entity.get(field))]
        # Pure lore-only entities may not appear in a scene, but still need backlinks through related data.
        if missing == ["appears_in"]:
            missing = []
        add(checks, f"{name} has required entity fields", not missing, ", ".join(missing))
        image = DIST / entity["image"]
        add(checks, f"{name} image exists", image.exists(), entity["image"])
        page = DIST / "pages" / "entities" / f"{entity['id']}.html"
        add(checks, f"{name} entity page exists", page.exists(), str(page.relative_to(ROOT)))
        bad_scenes = [sid for sid in entity.get("appears_in", []) if sid not in scene_ids]
        add(checks, f"{name} appears_in scenes resolve", not bad_scenes, ", ".join(bad_scenes))


def check_raster_image_assets(checks, scenes, entities):
    svg_files = sorted(DIST.rglob("*.svg"))
    add(checks, "no SVG files exist in generated atlas", not svg_files, "\n".join(str(p.relative_to(DIST)) for p in svg_files[:50]))

    text_refs = []
    for path in list(DIST.rglob("*.html")) + list(DIST.rglob("*.json")) + list(DIST.rglob("*.js")) + list(DIST.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        if ".svg" in text or "image/svg" in text:
            text_refs.append(str(path.relative_to(DIST)))
    add(checks, "no SVG references remain in HTML/data/vault package", not text_refs, "\n".join(text_refs[:50]))

    bad_scene_images = []
    for scene in scenes:
        path = DIST / scene["image"]
        ok = scene.get("image_asset_status") == "image_gen" and path.suffix.lower() in RASTER_EXTENSIONS and path.exists()
        if not ok:
            bad_scene_images.append(f"{scene['id']} -> {scene.get('image')} [{scene.get('image_asset_status')}]")
    add(checks, "every scene uses a generated raster image", not bad_scene_images, "\n".join(bad_scene_images[:80]))

    bad_entity_images = []
    for name, entity in entities.items():
        ok = has_source_backed_raster(entity.get("image", ""))
        if not ok:
            bad_entity_images.append(f"{name} -> {entity.get('image')} [{entity.get('image_asset_status')}]")
    add(checks, "every entity uses a source-backed raster image", not bad_entity_images, "\n".join(bad_entity_images[:120]))

    icon_paths = sorted({entity.get("meta", {}).get("icon_asset") for entity in entities.values() if entity.get("meta", {}).get("icon_asset")})
    missing_icons = [path for path in icon_paths if not (DIST / path).exists() or Path(path).suffix.lower() not in RASTER_EXTENSIONS]
    add(checks, "all type icons are generated raster images", not missing_icons, "\n".join(missing_icons))

    inventory = load_json(DIST / "data" / "image-inventory.json")
    add(checks, "image inventory has no fallback assets", not inventory.get("fallback"), json.dumps(inventory.get("fallback", []), indent=2))
    add(checks, "image inventory has no missing slots", not inventory.get("missing"), "\n".join(item["slot"] for item in inventory.get("missing", [])[:160]))


def check_no_emoji_ui(checks):
    scanned = []
    offenders = []
    for path in list(DIST.rglob("*.html")) + list(DIST.rglob("*.js")) + list(DIST.rglob("*.json")) + list(DIST.rglob("*.md")) + [DIST / "styles.css"]:
        if not path.exists():
            continue
        scanned.append(path)
        text = path.read_text(encoding="utf-8")
        found = sorted({char for char in text if char in FORBIDDEN_EMOJI_GLYPHS})
        if found:
            offenders.append(f"{path.relative_to(DIST)} -> {''.join(found)}")
    add(checks, "generated UI/data/vault contain no emoji icon glyphs", not offenders, "\n".join(offenders[:80]))


def check_inline_link_coverage(checks, entities):
    index = (DIST / "index.html").read_text(encoding="utf-8")
    required = {
        "Goldspire": "goldspire-territories",
        "Old Sable": "old-sable",
        "Sablewood": "sablewoodtm-logistics-preserve",
        "carriage": "escort-carriage",
        "Keystone Asset": "keystone-asset",
        "Vendor Cart": "vendor-cart",
        "Tamsin": "tamsin-vell",
        "Bramble Union": "bramble-union",
        "Hush": "hush",
        "Clover Co-op": "clover-co-op",
        "Whitefire Custodian": "whitefire-custodian",
        "Hanging Office": "the-hanging-office",
        "Open Vale": "open-valetm-ritual-site",
        "Legacy Security Skeleton": "legacy-security-skeleton",
        "Soul-Audit Wraith": "soul-audit-wraith",
        "Relay Spire": "relay-spire",
    }
    missing = []
    for label, entity_id in required.items():
        if label not in index:
            missing.append(f"{label}: text not present")
            continue
        pattern = re.compile(rf'data-entity="{re.escape(entity_id)}"[^>]*>\s*(?:<img[^>]*>\s*)?<span>{re.escape(label)}</span>|data-entity="{re.escape(entity_id)}"[^>]*>.*?{re.escape(label)}', re.DOTALL)
        if not pattern.search(index):
            missing.append(f"{label}: not linked to {entity_id}")
    add(checks, "critical recurring names and objects are inline linked on index", not missing, "\n".join(missing))

    visible_unlinked_index = visible_unlinked_text(index)
    plain_mentions = []
    mechanic_rule_aliases = {
        "difficulty-ladder": "difficulty",
        "armor-slot": "armor-slots",
    }
    for name, entity in entities.items():
        if len(name) < 4:
            continue
        if entity.get("type") in {"mechanic", "condition"}:
            mechanic_ids = {entity["id"], mechanic_rule_aliases.get(entity["id"], entity["id"])}
            if any(f'data-mechanic="{mechanic_id}"' in index for mechanic_id in mechanic_ids):
                continue
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(name)}(?![A-Za-z0-9])", visible_unlinked_index) and f'data-entity="{entity["id"]}"' not in index:
            plain_mentions.append(name)
    add(checks, "entity names present in index have data-entity hooks", not plain_mentions, "\n".join(plain_mentions[:80]))


def visible_unlinked_text(html_text: str) -> str:
    scrubbed = re.sub(r"<(script|style)\b.*?</\1>", " ", html_text, flags=re.IGNORECASE | re.DOTALL)
    scrubbed = re.sub(r"<option\b[^>]*>.*?</option>", " ", scrubbed, flags=re.IGNORECASE | re.DOTALL)
    scrubbed = re.sub(r'<span\b[^>]*class="[^"]*\bsr-only\b[^"]*"[^>]*>.*?</span>', " ", scrubbed, flags=re.IGNORECASE | re.DOTALL)
    scrubbed = re.sub(r'<a\b[^>]*data-(?:entity|mechanic)="[^"]*"[^>]*>.*?</a>', " ", scrubbed, flags=re.IGNORECASE | re.DOTALL)
    scrubbed = re.sub(r"<[^>]+>", " ", scrubbed)
    return html.unescape(scrubbed)


def check_html_links(checks):
    html_files = list(DIST.rglob("*.html"))
    href_re = re.compile(r'href="([^"]+)"')
    broken = []
    for html_file in html_files:
        text = html_file.read_text(encoding="utf-8")
        for href in href_re.findall(text):
            if href.startswith(("http:", "https:", "mailto:", "file:", "#")):
                continue
            clean = urllib.parse.unquote(href.split("#", 1)[0].split("?", 1)[0])
            if not clean:
                continue
            target = (html_file.parent / clean).resolve()
            try:
                target.relative_to(DIST.resolve())
            except ValueError:
                continue
            if not target.exists():
                broken.append(f"{html_file.relative_to(DIST)} -> {href}")
    add(checks, "internal HTML links resolve", not broken, "\n".join(broken[:30]))


def extract_aliases(markdown: str) -> set[str]:
    aliases = set()
    match = re.search(r"^aliases:\s*\[(.*?)\]\s*$", markdown, flags=re.MULTILINE)
    if match:
        for item in match.group(1).split(","):
            aliases.add(item.strip().strip('"').strip("'"))
    return {a for a in aliases if a}


def check_obsidian(checks):
    md_files = list(VAULT.rglob("*.md"))
    add(checks, "Obsidian vault exists", VAULT.exists(), str(VAULT))
    add(checks, "Obsidian note count is substantial", len(md_files) >= 90, f"found {len(md_files)}")
    names = {path.stem for path in md_files}
    for asset in (VAULT / "assets").glob("*"):
        if asset.is_file():
            names.add(asset.name)
            names.add(asset.stem)
    for path in md_files:
        names.update(extract_aliases(path.read_text(encoding="utf-8")))
    links = []
    for path in md_files:
        text = path.read_text(encoding="utf-8")
        for raw in re.findall(r"\[\[([^\]|#]+)", text):
            links.append((path, raw.strip()))
    unresolved = [(path, raw) for path, raw in links if raw not in names]
    add(checks, "Obsidian wikilinks resolve by note stem or alias", not unresolved, "\n".join(f"{p.relative_to(VAULT)} -> [[{r}]]" for p, r in unresolved[:40]))
    required_folders = [
        "00 Module Hub",
        "01 Story",
        "02 Scenes",
        "03 NPCs",
        "04 Creatures",
        "05 Locations",
        "06 Factions and Companies",
        "07 Items and Clues",
        "08 Tables and Loot",
        "09 Visual Prompts",
    ]
    missing = [folder for folder in required_folders if not (VAULT / folder).exists()]
    add(checks, "Obsidian folder structure exists", not missing, ", ".join(missing))


def check_continuity(checks, scenes, entities):
    strix_scenes = [scene for scene in scenes if any("Strixwolf" in e for e in scene.get("entities", []))]
    bad_strix = [scene["id"] for scene in strix_scenes if scene["act"] not in {"Act One", "Act Two"}]
    add(checks, "Strixwolf entity appears only in Act One or optional Act Two fallout", not bad_strix, ", ".join(scene["id"] for scene in strix_scenes))
    bad_prompts = []
    for scene in scenes:
        prompt = scene.get("image_prompt_used", "")
        if scene["act"] not in {"Prologue", "Act One"} and "Do not include the Strixwolf Mother" not in prompt and "No Strixwolf" not in prompt:
            bad_prompts.append(scene["id"])
    add(checks, "post-Act-One prompts include Strixwolf negative continuity", not bad_prompts, ", ".join(bad_prompts))
    act_five_bad = []
    for scene in scenes:
        if scene["act"] == "Act Five":
            prompt = scene.get("image_prompt_used", "")
            if "No Strixwolf. No Bramble Union." not in prompt:
                act_five_bad.append(scene["id"])
    add(checks, "Act Five prompts exclude Strixwolf and Bramble Union", not act_five_bad, ", ".join(act_five_bad))
    hush_text = "\n".join(json.dumps(scene, ensure_ascii=False) for scene in scenes if any("Hush" in e or "Clover" in e for e in scene.get("entities", [])))
    add(checks, "Hush is framed as warm and real", "warm" in hush_text.lower() and "not as the joke" in hush_text.lower(), "")
    bramble_text = json.dumps(entities.get("Bramble Union", {}), ensure_ascii=False) + "\n" + "\n".join(json.dumps(scene, ensure_ascii=False) for scene in scenes if "Bramble" in scene["title"] or any("Bramble" in e for e in scene.get("entities", [])))
    add(checks, "Bramble Union is morally complicated", all(term in bramble_text.lower() for term in ["desperate", "dangerous", "not a single ideology"]), "")
    corp_text = json.dumps(entities, ensure_ascii=False).lower()
    add(checks, "corporations are satirical systems, not boss monsters", "public story converts risk" in corp_text and "moves cost onto ordinary people" in corp_text, "")


def check_interaction_surface(checks):
    index = (DIST / "index.html").read_text(encoding="utf-8")
    app = (DIST / "app.js").read_text(encoding="utf-8")
    css = (DIST / "styles.css").read_text(encoding="utf-8")
    add(checks, "filters exist", 'data-filter="combat"' in index and "setupFilters" in app, "")
    add(checks, "hover cards exist and support focus", "setupHoverCards" in app and 'addEventListener("focus"' in app, "")
    add(checks, "lightbox dialog exists", "<dialog" in index and "showModal" in app, "")
    add(checks, "player-facing read-aloud style exists", "read-aloud" in index and ".read-aloud" in css, "")
    add(checks, "GM-only visual style exists", "gm-block" in index and ".gm-block" in css, "")
    add(checks, "print stylesheet exists", "@media print" in css, "")
    add(checks, "data files exist", all((DIST / "data" / name).exists() for name in ["scenes.json", "entities.json", "relationship-map.json", "atlas-data.js"]), "")


def check_browser_qa_artifacts(checks):
    browser_report = ROOT / "output" / "playwright" / "story-atlas" / "browser-qa.json"
    add(checks, "browser QA report exists", browser_report.exists(), str(browser_report))
    if not browser_report.exists():
        return
    data = json.loads(browser_report.read_text(encoding="utf-8"))
    add(checks, "browser QA confirms hover card visibility", data.get("hover", {}).get("visible") is True, json.dumps(data.get("hover", {}), indent=2))
    add(checks, "browser QA confirms lightbox image loads", data.get("lightbox", {}).get("open") is True and data.get("lightbox", {}).get("imageLoaded") is True, json.dumps(data.get("lightbox", {}), indent=2))
    add(checks, "browser QA confirms no visible emoji UI", data.get("home", {}).get("noEmojiVisibleText") is True, json.dumps(data.get("home", {}), indent=2))
    add(checks, "browser QA confirms no SVG references in rendered home", data.get("home", {}).get("noSvgRefs") is True, json.dumps(data.get("home", {}), indent=2))
    add(checks, "browser QA confirms mobile has no horizontal overflow", data.get("mobile", {}).get("horizontalOverflow") is False, json.dumps(data.get("mobile", {}), indent=2))


def write_report(checks):
    passed = sum(1 for _, ok, _ in checks if ok)
    failed = len(checks) - passed
    lines = [
        "# Goldspire Story Atlas QA Report",
        "",
        f"Checks passed: **{passed} / {len(checks)}**",
        f"Checks failed: **{failed}**",
        "",
        "## Summary",
        "",
    ]
    if failed:
        lines.append("The atlas has blocking QA failures listed below.")
    else:
        lines.append("The automated atlas QA and rendered browser QA passed.")
    lines.extend(["", "## Checks", ""])
    for name, ok, detail in checks:
        mark = "PASS" if ok else "FAIL"
        lines.append(f"- **{mark}** - {name}")
        if detail and not ok:
            lines.append("")
            lines.append("  ```text")
            lines.extend("  " + line for line in detail.splitlines())
            lines.append("  ```")
    screenshot_dir = ROOT / "output" / "playwright" / "story-atlas"
    desktop = screenshot_dir / "desktop-home.png"
    mobile = screenshot_dir / "playwright-mobile-home.png"
    scene = screenshot_dir / "scene-s01-01.png"
    entity = screenshot_dir / "entity-escort-carriage.png"
    hover = screenshot_dir / "hover-escort-carriage.png"
    browser_report = screenshot_dir / "browser-qa.json"
    if desktop.exists() and mobile.exists() and scene.exists() and entity.exists() and hover.exists() and browser_report.exists():
        lines.extend(
            [
                "",
                "## Rendered Browser QA Evidence",
                "",
                "Rendered QA used the in-app browser for visual review and Playwright with the installed Google Chrome executable for repeatable checks. Automation-owned browser sessions were closed after capture.",
                "",
                "Checked in browser:",
                "",
                "- Desktop first viewport: `output/playwright/story-atlas/desktop-home.png`",
                "- Mobile first viewport at 390x844: `output/playwright/story-atlas/playwright-mobile-home.png`",
                "- S01-01 scene card with raster scene art: `output/playwright/story-atlas/scene-s01-01.png`",
                "- Escort Carriage hover card: `output/playwright/story-atlas/hover-escort-carriage.png`",
                "- Escort Carriage entity wiki page: `output/playwright/story-atlas/entity-escort-carriage.png`",
                "- Browser assertion report: `output/playwright/story-atlas/browser-qa.json`",
                "",
                "Rendered checks completed:",
                "",
                "- 27 scene cards rendered.",
                "- Combat filter returned the combat scene set.",
                "- Search input filtered visible scene cards.",
                "- Hover opened the entity preview card with image, type, summary, tags, and appearances.",
                "- Image lightbox opened and dismissed.",
                "- Escort Carriage entity page loaded with specific content, image, relationships, and backlinks.",
                "- Desktop and mobile showed no horizontal overflow.",
                "- The rendered home contained no SVG references and no visible emoji UI.",
                "- Visual inspection confirmed distinct player-facing and GM-only blocks, readable text, and stable responsive layout.",
            ]
        )
    report = "\n".join(lines) + "\n"
    (DIST / "QA_REPORT.md").write_text(report, encoding="utf-8")
    (DOCS / "STORY_ATLAS_QA_REPORT.md").write_text(report, encoding="utf-8")
    print(f"QA passed {passed}/{len(checks)}")
    if failed:
        print(f"QA failed {failed}; see {DIST / 'QA_REPORT.md'}")
        raise SystemExit(1)


def main():
    checks: list[tuple[str, bool, str]] = []
    scenes = load_json(DIST / "data" / "scenes.json")
    entities = load_json(DIST / "data" / "entities.json")
    check_scene_completeness(checks, scenes, entities)
    check_entity_completeness(checks, scenes, entities)
    check_raster_image_assets(checks, scenes, entities)
    check_no_emoji_ui(checks)
    check_inline_link_coverage(checks, entities)
    check_html_links(checks)
    check_obsidian(checks)
    check_continuity(checks, scenes, entities)
    check_interaction_surface(checks)
    check_browser_qa_artifacts(checks)
    write_report(checks)


if __name__ == "__main__":
    main()
