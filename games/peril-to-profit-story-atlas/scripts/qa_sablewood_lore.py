#!/usr/bin/env python3
"""QA gate for the Sablewood PDF lore integration."""

from __future__ import annotations

import json
from pathlib import Path


def resolve_paths() -> tuple[Path, Path]:
    here = Path(__file__).resolve()
    if (here.parents[1] / "data" / "sablewood-entity-registry.json").exists():
        dist = here.parents[1]
        return dist.parents[1], dist
    root = here.parents[2]
    return root, root / "dist" / "story-atlas"


ROOT, DIST = resolve_paths()
REPORT = DIST / "data" / "qa-sablewood-lore-report.json"
QA_REPORT = DIST / "QA_REPORT.md"
DOC_REPORT = ROOT / "docs" / "STORY_ATLAS_QA_REPORT.md"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""


def load_json(path: Path):
    return json.loads(read(path))


def add(checks: list[dict], name: str, ok: bool, detail: object = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail if isinstance(detail, str) else json.dumps(detail, indent=2, ensure_ascii=False)})


def append_markdown(report: dict) -> None:
    passed = report["check_count"] - report["issue_count"]
    lines = [
        "",
        "## Sablewood Lore Integration QA",
        "",
        f"Checks passed: **{passed} / {report['check_count']}**",
        f"Checks failed: **{report['issue_count']}**",
    ]
    for check in report["checks"]:
        status = "PASS" if check["ok"] else "FAIL"
        lines.append(f"- **{status}** - {check['name']}")
        if not check["ok"] and check.get("detail"):
            lines.append(f"  - {check['detail']}")
    block = "\n".join(lines) + "\n"
    if QA_REPORT.exists():
        QA_REPORT.write_text(read(QA_REPORT) + block, encoding="utf-8")
    if DOC_REPORT.exists():
        DOC_REPORT.write_text(read(DOC_REPORT) + block, encoding="utf-8")


def main() -> int:
    checks: list[dict] = []
    registry_path = DIST / "data" / "sablewood-entity-registry.json"
    source_path = DIST / "data" / "sablewood-source-document.json"
    entities_path = DIST / "data" / "entities.json"
    slides_path = DIST / "data" / "slides.json"
    scenes_path = DIST / "data" / "scenes.json"

    add(checks, "Sablewood registry data exists", registry_path.exists(), str(registry_path))
    add(checks, "Sablewood source document data exists", source_path.exists(), str(source_path))
    add(checks, "Atlas entities data exists", entities_path.exists(), str(entities_path))
    add(checks, "Run Mode slides data exists", slides_path.exists(), str(slides_path))
    if not all(path.exists() for path in [registry_path, source_path, entities_path, slides_path, scenes_path]):
        report = {"pass": False, "check_count": len(checks), "issue_count": sum(1 for check in checks if not check["ok"]), "checks": checks}
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        append_markdown(report)
        return 1

    registry = load_json(registry_path)
    source_doc = load_json(source_path)
    entities = load_json(entities_path)
    slides = load_json(slides_path)
    scenes = load_json(scenes_path)

    add(checks, "Sablewood registry has broad PDF coverage", len(registry) >= 60, f"found {len(registry)} rows")
    add(checks, "source PDF is bundled in generated site", (DIST / source_doc["target"]).exists(), source_doc["target"])

    missing_entities = []
    missing_pages = []
    missing_aliases = []
    missing_sources = []
    missing_tags = []
    for row in registry:
        canonical = row["canonical"]
        entity = entities.get(canonical)
        if not entity:
            missing_entities.append(canonical)
            continue
        page = DIST / "pages" / "entities" / f"{entity['id']}.html"
        if not page.exists():
            missing_pages.append(f"{canonical} -> {page.relative_to(DIST)}")
        aliases = set(entity.get("aliases", []))
        expected_aliases = {row["name"], *row.get("aliases", [])}
        if canonical not in expected_aliases:
            expected_aliases.add(canonical)
        if not expected_aliases & aliases and row["name"] != canonical:
            missing_aliases.append(f"{row['name']} -> {canonical}")
        expected_page = f"Sablewood PDF p. {row['source_page']}"
        if expected_page not in entity.get("source_pages", []):
            missing_sources.append(f"{canonical}: {expected_page}")
        if "sablewood-lore" not in entity.get("tags", []):
            missing_tags.append(canonical)

    add(checks, "every registry row resolves to an entity", not missing_entities, "\n".join(sorted(set(missing_entities))[:100]))
    add(checks, "every registry entity has a generated wiki page", not missing_pages, "\n".join(missing_pages[:100]))
    add(checks, "every registry row contributes an alias or canonical name", not missing_aliases, "\n".join(missing_aliases[:100]))
    add(checks, "every registry row records its Sablewood PDF source page", not missing_sources, "\n".join(missing_sources[:120]))
    add(checks, "every registry entity is tagged sablewood-lore", not missing_tags, "\n".join(sorted(set(missing_tags))[:100]))

    sablewood = entities.get("Sablewood™ Logistics Preserve", {})
    sablewood_page = DIST / "pages" / "entities" / f"{sablewood.get('id', 'missing')}.html"
    page_text = read(sablewood_page)
    add(checks, "Sablewood wiki includes direct PDF source link", "Open Sablewood PDF Source" in page_text and source_doc["target"] in page_text, str(sablewood_page))

    slide_ids = {slide.get("id") for slide in slides}
    section_ids = {slide.get("sectionId") for slide in slides}
    add(checks, "Run Mode has Sablewood Field Guide section", "SABLEWOOD" in section_ids, sorted(section_ids))
    for required in ["SABLEWOOD-GUIDE", "SABLEWOOD-ROUTES", "SABLEWOOD-FACTIONS", "SABLEWOOD-GEAR", "SABLEWOOD-RUMORS"]:
        add(checks, f"Run Mode Sablewood slide exists: {required}", required in slide_ids, required)
    run = read(DIST / "run.html")
    add(checks, "Run Mode includes Sablewood shortcut", "SABLEWOOD-GUIDE" in run and "6 Sablewood" in run, "")

    scene_blob = json.dumps(scenes, ensure_ascii=False)
    for term in ["Sablewood Route Network", "Bramble Union Villages", "Guest Privileges", "The Stones of the Vale"]:
        add(checks, f"scene patches include {term}", term in scene_blob, term)

    report = {
        "pass": all(check["ok"] for check in checks),
        "check_count": len(checks),
        "issue_count": sum(1 for check in checks if not check["ok"]),
        "registry_count": len(registry),
        "checks": checks,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    append_markdown(report)
    print(f"Sablewood lore QA: {report['check_count'] - report['issue_count']} / {report['check_count']} passed")
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
