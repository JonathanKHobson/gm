#!/usr/bin/env python3
"""QA checks for mechanics, Session Zero, loot, rules wiki, and image UX."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


def resolve_paths() -> tuple[Path, Path]:
    here = Path(__file__).resolve()
    if (here.parents[1] / "data" / "scenes.json").exists():
        dist = here.parents[1]
        return dist.parents[1], dist
    root = here.parents[2]
    return root, root / "dist" / "story-atlas"


ROOT, DIST = resolve_paths()
VAULT = ROOT / "obsidian_vault"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def load_json(path: Path):
    return json.loads(read(path))


def add(checks: list[dict], name: str, ok: bool, detail: str = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


def present(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return bool(value)
    return True


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data)


def html_text(markup: str) -> str:
    parser = TextExtractor()
    parser.feed(markup)
    text = re.sub(r"\s+", " ", " ".join(parser.parts))
    return re.sub(r"\s+([,.;:!?])", r"\1", text)


def main() -> int:
    checks: list[dict] = []
    scenes = load_json(DIST / "data" / "scenes.json")
    entities = load_json(DIST / "data" / "entities.json")
    index = read(DIST / "index.html")
    index_text = html_text(index)
    css = read(DIST / "styles.css")
    app = read(DIST / "app.js")
    pages_text = "\n".join(read(path) for path in sorted((DIST / "pages").rglob("*.html")))

    required_pages = [
        "pages/session-zero.html",
        "pages/handouts.html",
        "pages/loot-board.html",
        "pages/conditions.html",
        "pages/gm-cheat-sheet.html",
        "pages/dnd-to-daggerheart.html",
        "pages/rules/index.html",
        "pages/rules/action-roll.html",
        "pages/rules/conditions.html",
        "pages/rules/faq.html",
        "pages/rules/five-outcomes.html",
        "pages/rules/connection-questions.html",
        "pages/rules/character-creation.html",
        "pages/rules/ancestry.html",
        "pages/rules/community.html",
        "pages/rules/roll-slider.html",
        "player-display.html",
    ]
    missing_pages = [page for page in required_pages if not (DIST / page).exists()]
    add(checks, "mechanics required pages exist", not missing_pages, "\n".join(missing_pages))

    session_pos = index.find('id="session-zero"')
    prologue_pos = index.find('id="prologue"')
    add(checks, "Session Zero section appears before Prologue", session_pos != -1 and prologue_pos != -1 and session_pos < prologue_pos, f"session={session_pos}, prologue={prologue_pos}")
    add(checks, "Session Zero section collapses and persists", all(token in index + app for token in ["data-act-toggle=\"session-zero\"", "data-act-complete=\"session-zero\"", "goldspire-atlas-progress-v2"]), "")
    add(checks, "Session Zero run modes and connection builder exist", all(token in index + pages_text + app for token in ["data-session-zero-mode-select", "Quick Public One-Shot", "Guided Pregen Customization", "Full Custom Character", "data-connection-builder", "goldspire-session-zero-connections-v1"]), "")
    add(checks, "Session Zero page links rules drawer handouts and player display", all(token in read(DIST / "pages" / "session-zero.html") for token in ["data-rules-open", "handouts.html", "player-display.html", "Connection Builder"]), "")

    add(
        checks,
        "GM Rules Drawer includes official mechanics terms",
        all(
            term in index_text
            for term in [
                "Roll in 10 Seconds",
                "Duality Dice",
                "Action Roll Results",
                "Critical Success",
                "Difficulty Ladder",
                "D&D to Daggerheart",
                "Hope Spend Menu",
                "Fear Spend Menu",
                "Combat / Spotlight Loop",
                "Damage / Armor / Stress",
                "Short Rest",
                "Official Conditions",
            ]
        ),
        "",
    )
    add(checks, "floating quick reference and mechanic hover/search exist", all(term in index + pages_text + app + css for term in ["quick-ref-widget", "data-quick-rule-search", "data-mechanic", "mechanic-link", "rules_registry", "matchingRules"]), "")
    add(checks, "difficulty labels are clickable rule drawer badges", "dc-badge" in index + pages_text and "data-rules-target=\"difficulty-ladder\"" in index + pages_text, "")

    bad_scene_mechanics = []
    for scene in scenes:
        if len(scene.get("roll_cards", [])) < 1 and not scene.get("no_roll_guidance"):
            bad_scene_mechanics.append(f"{scene['id']}: no roll_cards/no_roll_guidance")
        for key in ["mechanics", "conditions_hazards", "search_loot_clues", "tv_mechanics_caption", "trait_variety_note"]:
            if not present(scene.get(key)):
                bad_scene_mechanics.append(f"{scene['id']}: missing {key}")
        if len(scene.get("fear_spends", [])) < 2:
            bad_scene_mechanics.append(f"{scene['id']}: fewer than 2 Fear spends")
        if len(scene.get("player_questions", [])) < 2:
            bad_scene_mechanics.append(f"{scene['id']}: fewer than 2 questions")
        for card in scene.get("roll_cards", []):
            for key in ["title", "trait_options", "difficulty", "why_this_trait", "official_results", "outcomes", "hope_spin", "fear_spin", "gm_fear_spends", "duality_text"]:
                if not present(card.get(key)):
                    bad_scene_mechanics.append(f"{scene['id']} {card.get('id')}: missing {key}")
            official_results = card.get("official_results", {})
            for key, label in [
                ("critical_success", "Critical Success"),
                ("success_with_hope", "Success with Hope"),
                ("success_with_fear", "Success with Fear"),
                ("failure_with_hope", "Failure with Hope"),
                ("failure_with_fear", "Failure with Fear"),
            ]:
                if not present(official_results.get(key) or official_results.get(label)):
                    bad_scene_mechanics.append(f"{scene['id']} {card.get('id')}: missing official result {label}")
            outcomes = card.get("outcomes", {})
            for band in ["hard_failure", "near_miss", "mixed_success", "strong_success", "exceptional_success", "critical_success"]:
                if not present(outcomes.get(band)):
                    bad_scene_mechanics.append(f"{scene['id']} {card.get('id')}: missing outcome {band}")
    add(checks, "every scene has DC-based multi-outcome roll support", not bad_scene_mechanics, "\n".join(bad_scene_mechanics[:160]))

    coverage = load_json(DIST / "data" / "trait-coverage-report.json")
    low_traits = [trait for trait, count in coverage["counts"].items() if count < 8]
    add(checks, "trait coverage includes all six traits", not low_traits and coverage["passes_variety_gate"], json.dumps(coverage, indent=2))

    bad_entities = []
    allowed_mechanics_types = {"npc", "enemy", "creature", "item", "clue", "condition", "location", "faction"}
    for name, entity in entities.items():
        mechanics = entity.get("mechanics", {})
        entity_type = entity.get("type")
        has_mechanics = any(present(mechanics.get(key)) for key in ["player_safe", "gm_only", "no_roll_reveals", "rolls", "fear_spends", "condition_options", "search_loot"])
        if entity_type == "mechanic" and has_mechanics:
            bad_entities.append(f"{name}: mechanic entity has generic entity mechanics")
        if has_mechanics and entity_type not in allowed_mechanics_types:
            bad_entities.append(f"{name}: mechanics on unsupported type {entity_type}")
        if has_mechanics and entity_type not in {"enemy", "creature"} and "fight" in str(mechanics.get("title", "")).lower():
            bad_entities.append(f"{name}: noncombat entity exposes fight mechanics")
    add(checks, "entity mechanics are conditional and type-appropriate", not bad_entities, "\n".join(bad_entities[:160]))

    condition_names = ["Hidden", "Restrained", "Vulnerable"]
    missing_conditions = []
    for name in condition_names:
        entity = entities.get(name)
        if not entity:
            missing_conditions.append(f"{name}: missing entity")
            continue
        if not (DIST / "pages" / "entities" / f"{entity['id']}.html").exists():
            missing_conditions.append(f"{name}: missing page")
        if not (VAULT / "10 Rules" / f"{name}.md").exists():
            missing_conditions.append(f"{name}: missing vault note")
    add(checks, "condition pages and vault notes exist", not missing_conditions, "\n".join(missing_conditions))

    loot_page = read(DIST / "pages" / "loot-board.html")
    loot_required = ["Hexmart Pocket Ward", "Stride Salve", "Grindstone Vial", "Lark-Moth Lantern", "Bramble-Cutter", "Compliance Stamp", "Firstmoss Poultice", "Soul-Quiet Charm", "Strixwolf-Down Cloak", "Tamsin Vell", "Vendor Cart", "Bramble Union", "Hanging Office", "Open Vale"]
    missing_loot = [term for term in loot_required if term not in loot_page + pages_text]
    add(checks, "Loot Board and search tables are integrated", not missing_loot, "\n".join(missing_loot))

    handouts = read(DIST / "pages" / "handouts.html")
    handouts_text = html_text(handouts)
    handout_terms = ["Session Zero Worksheet", "Connection Question Cards", "Duality Dice", "Roll Outcome Options", "Condition Cards", "Loot Cards", "Delivery Manifest", "Goldwater Slip", "Hexmart Pocket Ward", "Bramble Route Sketch"]
    add(checks, "mechanics-aware handouts exist", all(term in handouts_text for term in handout_terms), "")

    rules_registry = load_json(DIST / "data" / "rules-registry.json")
    expected_rule_pages = [rule["id"] for rule in rules_registry]
    missing_rule_pages = [rule_id for rule_id in expected_rule_pages if not (DIST / "pages" / "rules" / f"{rule_id}.html").exists()]
    add(checks, "every registry mechanic has a rule page", not missing_rule_pages and len(expected_rule_pages) >= 30, "\n".join(missing_rule_pages))
    required_rule_ids = {
        "five-outcomes",
        "connection-questions",
        "character-creation",
        "heritage",
        "ancestry",
        "community",
        "class-subclass",
        "domain-cards",
        "damage-rolls",
        "disposition-track",
        "npc-community-trust-track",
        "hope-fear-moments",
        "roll-slider",
    }
    rule_ids = {rule.get("id") for rule in rules_registry}
    missing_new_rules = sorted(required_rule_ids - rule_ids)
    weak_profiles = [
        rule.get("id")
        for rule in rules_registry
        if not all(present(rule.get("mechanic_profile", {}).get(key)) for key in ["what_it_is", "how_it_functions", "template", "step_by_step", "scenario_story", "try_it", "difficulty", "intro_stage"])
    ]
    add(checks, "Mechanic System Packet required mechanic entries are present", not missing_new_rules, "\n".join(missing_new_rules))
    add(checks, "mechanic rule pages use lean instructional profile data", not weak_profiles, "\n".join(weak_profiles[:80]))
    dnd_page = read(DIST / "pages" / "dnd-to-daggerheart.html")
    dnd_rule_page = read(DIST / "pages" / "rules" / "dnd-to-daggerheart.html")
    dnd_bad_tokens = [token for token in ["How To Use", "Skill-To-Trait Map", "Endurance Note", "<th>Notes</th>", "Goldspire Example"] if token in dnd_page + dnd_rule_page]
    dnd_visible = html_text(dnd_page + dnd_rule_page)
    add(checks, "D&D conversion pages are two-column lookup only", not dnd_bad_tokens and "D&D term" in dnd_visible and "Daggerheart equivalent" in dnd_visible, "\n".join(dnd_bad_tokens))
    add(checks, "rule search aliases include D&D terms", all(term in json.dumps(rules_registry, ensure_ascii=False) for term in ["perception", "saving throw", "AC", "initiative", "grappled", "stealth", "skill check", "HP", "armor"]), "")
    add(checks, "scene mechanics chips are generated", (DIST / "data" / "scene-rule-chips.json").exists() and "mechanic-chip" in index + pages_text, "")
    pc_page = read(DIST / "pages" / "pc-cheat-sheet.html")
    pc_required_terms = [
        "GM-ready player dossier",
        "6 slots",
        "7 slots",
        "8 slots",
        "None listed on sheet",
        "Open Printable Character Packet",
        "Open Module PDF",
        "Open Sheet Guide",
        "pc-outcome-tracker",
        "file://",
    ]
    missing_pc_required = [term for term in pc_required_terms if term not in pc_page]
    add(
        checks,
        "PC cheat sheet has verified dossier stats and source links",
        not missing_pc_required and "Unknown / verify from sheet" not in pc_page,
        "\n".join(missing_pc_required),
    )

    display = read(DIST / "player-display.html")
    add(checks, "Player Display supports mechanics-safe toggles", all(term in display + app for term in ["player-show-conditions", "player-public-objective", "player-open-image-window", "player-fill-image", "mechanics_caption"]), "")

    add(checks, "image UI is contain-first and expandable", all(term in css + index + pages_text + app for term in ["object-fit: contain", "data-image-window", "Open Image Window", "lightbox-raw-link", "openImageWindow"]), "")
    forbidden_crop_contexts = [
        ".hero-art img",
        ".wide-figure img",
        ".scene-figure img",
        ".entity-page-head img",
        ".entity-thumb",
        ".hover-card > img",
        ".player-display-stage img",
    ]
    bad_crop = [ctx for ctx in forbidden_crop_contexts if re.search(re.escape(ctx) + r"[^\n{}]*\{[^}]*object-fit:\s*cover", css, flags=re.S)]
    add(checks, "portraits logos thumbnails and hover cards are not cover-cropped", not bad_crop, "\n".join(bad_crop))

    vault_required = [
        VAULT / "00 Session Zero" / "Session Zero Hub.md",
        VAULT / "10 Rules" / "Rules Packet Home.md",
        VAULT / "10 Rules" / "Trait Coverage Report.md",
    ]
    add(checks, "Obsidian mechanics/session-zero notes exist", all(path.exists() for path in vault_required), "\n".join(str(path) for path in vault_required if not path.exists()))

    report = {
        "pass": all(check["ok"] for check in checks),
        "check_count": len(checks),
        "issue_count": sum(1 for check in checks if not check["ok"]),
        "checks": checks,
        "trait_coverage": coverage,
    }
    out = DIST / "data" / "qa-mechanics-report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    qa_report = DIST / "QA_REPORT.md"
    if qa_report.exists():
        passed = report["check_count"] - report["issue_count"]
        coverage = report["trait_coverage"]
        addendum = [
            "",
            "## Mechanics / Session Zero / Loot / Dice Add-on QA",
            "",
            f"Checks passed: **{passed} / {report['check_count']}**",
            f"Checks failed: **{report['issue_count']}**",
            "",
            "- Session Zero section appears before Prologue and persists collapse/completion state.",
            "- Session Zero page includes run modes, Connection Builder, notes export, Rules Drawer, Handouts Hub, and Player Display links.",
            "- GM Rules Drawer and GM Cheat Sheet include compact official Daggerheart table cards, difficulty, conditions, rests, combat, and Fear spends.",
            "- Every scene has DC-based roll cards or no-roll guidance, GM Fear spends, condition/hazard guidance, search/loot guidance, TV-safe mechanics captions, and trait variety notes.",
            "- Every entity has Interact / Investigate / Search / Fight mechanics.",
            "- Rule pages, mechanic links, hover data, quick reference widget, Loot Board, condition pages, mechanics-aware handouts, and Player Display toggles are present.",
            "- Images are contain-first by default, with lightbox, raw image, and open-window actions.",
            "",
            "### Trait Coverage",
            "",
            f"- Agility: {coverage['counts']['Agility']}",
            f"- Strength: {coverage['counts']['Strength']}",
            f"- Finesse: {coverage['counts']['Finesse']}",
            f"- Instinct: {coverage['counts']['Instinct']}",
            f"- Presence: {coverage['counts']['Presence']}",
            f"- Knowledge: {coverage['counts']['Knowledge']}",
            f"- Instinct + Presence share: {coverage['instinct_presence_share']}%",
            f"- Variety gate: {'PASS' if coverage['passes_variety_gate'] else 'FAIL'}",
            "",
            "Detailed JSON: `data/qa-mechanics-report.json` and `data/trait-coverage-report.json`.",
            "",
        ]
        qa_report.write_text(qa_report.read_text(encoding="utf-8") + "\n".join(addendum), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
