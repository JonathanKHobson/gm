#!/usr/bin/env python3
"""Rendered browser QA for the Goldspire Atlas UX / visual pass."""

from __future__ import annotations

import asyncio
import contextlib
import functools
import http.server
import json
import socketserver
import threading
from datetime import datetime, timezone
from pathlib import Path

from playwright.async_api import async_playwright


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
OUT = DIST / "qa" / "screenshots"
DATA = DIST / "data"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args) -> None:
        return


@contextlib.contextmanager
def serve():
    handler = functools.partial(QuietHandler, directory=str(DIST))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        port = httpd.server_address[1]
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{port}"
        finally:
            httpd.shutdown()
            thread.join(timeout=3)


async def page_snapshot(browser, base: str, path: str, viewport: dict, name: str) -> dict:
    page = await browser.new_page(viewport=viewport)
    errors: list[str] = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    await page.goto(f"{base}/{path}", wait_until="networkidle")
    await page.screenshot(path=str(OUT / f"{name}.png"), full_page=False)
    data = await page.evaluate(
        """() => {
          const doc = document.documentElement;
          const visibleText = document.body.innerText || "";
          const lead = document.querySelector('.entity-page-lede');
          const entityImg = document.querySelector('.entity-hero-figure img, .entity-page-head figure img');
          const mainImage = document.querySelector('.scene-figure img, .run-slide-figure img, .slide-media img, .player-display-stage img, .player-slide img, .media-main-image, .hero-art img');
          const iconButtons = [...document.querySelectorAll('button.icon-button, a.icon-button')];
          const rulesDrawer = document.querySelector('#rules-drawer');
          const rectData = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x:r.x, y:r.y, width:r.width, height:r.height, scrollHeight:el.scrollHeight, clientHeight:el.clientHeight };
          };
          return {
            title: document.title,
            noHorizontalOverflow: doc.scrollWidth <= doc.clientWidth + 1,
            visiblePromptLeakage: ['Clean party reference', 'Do not include the Strixwolf', 'no visible text, no UI, no watermark', 'Image Prompt / Asset Status', 'Asset status:'].filter((phrase) => visibleText.includes(phrase)),
            rulesDrawerHidden: rulesDrawer ? (rulesDrawer.hidden && getComputedStyle(rulesDrawer).display === 'none') : true,
            devModeOff: document.body.dataset.devMode !== 'true',
            lightThemeDefault: getComputedStyle(doc).colorScheme.includes('light') || doc.dataset.theme === 'light' || !doc.dataset.theme,
            bodyBg: getComputedStyle(document.body).backgroundColor,
            ledeRect: rectData(lead),
            ledeClipped: lead ? (lead.scrollHeight > lead.clientHeight + 2 && getComputedStyle(lead).overflow !== 'visible') : false,
            entityImageFit: entityImg ? getComputedStyle(entityImg).objectFit : null,
            mainImageFit: mainImage ? getComputedStyle(mainImage).objectFit : null,
            iconButtonsMissingLabels: iconButtons.filter((el) => !(el.getAttribute('aria-label') || el.getAttribute('title'))).length,
            sectionDetails: document.querySelectorAll('.wiki-auto-section, details.scene-block').length
          };
        }"""
    )
    await page.close()
    data["path"] = path
    data["viewport"] = viewport
    data["errors"] = errors
    data["screenshot"] = str(OUT / f"{name}.png")
    return data


async def run_sync_check(browser, base: str) -> dict:
    context = await browser.new_context(viewport={"width": 1280, "height": 720})
    run = await context.new_page()
    player = await context.new_page()
    errors: list[str] = []
    run.on("pageerror", lambda exc: errors.append(f"run: {exc}"))
    player.on("pageerror", lambda exc: errors.append(f"player: {exc}"))
    await player.goto(f"{base}/player-display.html?slide=S01-01", wait_until="networkidle")
    await run.goto(f"{base}/run.html?slide=S01-01", wait_until="networkidle")
    await player.wait_for_selector(".player-caption h1", timeout=5000)
    before = await player.locator(".player-caption h1").inner_text()
    await run.click('[data-run-action="next"]')
    await player.wait_for_timeout(700)
    after = await player.locator(".player-caption h1").inner_text()
    await run.screenshot(path=str(OUT / "run-mode-desktop.png"), full_page=False)
    await player.screenshot(path=str(OUT / "player-display-synced.png"), full_page=False)
    await context.close()
    return {
        "beforeTitle": before,
        "afterTitle": after,
        "advanced": before != after and bool(after),
        "errors": errors,
        "screenshots": {
            "runMode": str(OUT / "run-mode-desktop.png"),
            "playerDisplay": str(OUT / "player-display-synced.png"),
        },
    }


async def main_async() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    with serve() as base:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            checks = []
            targets = [
                ("index.html", {"width": 1366, "height": 768}, "index-desktop"),
                ("index.html", {"width": 390, "height": 844}, "index-mobile"),
                ("run.html?slide=S01-01", {"width": 1366, "height": 768}, "run-desktop"),
                ("pages/gm-dashboard.html", {"width": 1366, "height": 768}, "dashboard-desktop"),
                ("pages/entities/garrick-reed.html", {"width": 1024, "height": 768}, "garrick-tablet"),
                ("pages/entities/garrick-reed.html", {"width": 390, "height": 844}, "garrick-mobile"),
                ("pages/pc-cheat-sheet.html", {"width": 1024, "height": 768}, "pc-cheat-sheet"),
                ("pages/pronunciation-guide.html", {"width": 768, "height": 900}, "pronunciation-guide"),
                ("player-display.html?slide=S01-01", {"width": 1280, "height": 720}, "player-display"),
            ]
            pages = [await page_snapshot(browser, base, path, viewport, name) for path, viewport, name in targets]
            sync = await run_sync_check(browser, base)
            await browser.close()

    for item in pages:
        checks.append({"name": f"{item['path']} has no horizontal overflow at {item['viewport']['width']}", "ok": item["noHorizontalOverflow"], "detail": json.dumps(item)})
        checks.append({"name": f"{item['path']} has no visible prompt leakage", "ok": not item["visiblePromptLeakage"], "detail": json.dumps(item["visiblePromptLeakage"])})
        checks.append({"name": f"{item['path']} keeps rules drawer hidden by default", "ok": item["rulesDrawerHidden"], "detail": json.dumps(item.get("rulesDrawerHidden"))})
        checks.append({"name": f"{item['path']} has Dev Mode off by default", "ok": item["devModeOff"], "detail": json.dumps(item.get("devModeOff"))})
        checks.append({"name": f"{item['path']} has no browser errors", "ok": not item["errors"], "detail": "\n".join(item["errors"])})
        if "garrick-reed" in item["path"]:
            checks.append({"name": f"{item['path']} lede is not clipped", "ok": not item["ledeClipped"], "detail": json.dumps(item["ledeRect"])})
            checks.append({"name": f"{item['path']} portrait uses contain fit", "ok": item["entityImageFit"] == "contain", "detail": item["entityImageFit"] or ""})
        if item["mainImageFit"]:
            checks.append({"name": f"{item['path']} primary image uses contain fit", "ok": item["mainImageFit"] == "contain", "detail": item["mainImageFit"]})
        checks.append({"name": f"{item['path']} icon buttons are labeled", "ok": item["iconButtonsMissingLabels"] == 0, "detail": str(item["iconButtonsMissingLabels"])})

    checks.append({"name": "Run Mode advances Player Display over BroadcastChannel", "ok": sync["advanced"] and not sync["errors"], "detail": json.dumps(sync, indent=2)})

    report = {
        "pass": all(check["ok"] for check in checks),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "check_count": len(checks),
        "issue_count": sum(1 for check in checks if not check["ok"]),
        "checks": checks,
        "pages": pages,
        "sync": sync,
    }
    (DATA / "qa-ux-browser-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    static_path = DATA / "qa-ux-report.json"
    if static_path.exists():
        static = json.loads(static_path.read_text(encoding="utf-8"))
        static["browser_visual"] = {
            "pass": report["pass"],
            "check_count": report["check_count"],
            "issue_count": report["issue_count"],
            "screenshots_dir": str(OUT),
        }
        static["pass"] = bool(static.get("pass")) and report["pass"]
        static_path.write_text(json.dumps(static, indent=2, ensure_ascii=False), encoding="utf-8")

    qa_report = DIST / "QA_REPORT.md"
    if qa_report.exists():
        passed = report["check_count"] - report["issue_count"]
        addendum = [
            "",
            "## Rendered UX Browser QA",
            "",
            f"Checks passed: **{passed} / {report['check_count']}**",
            f"Checks failed: **{report['issue_count']}**",
            "",
            f"Screenshots: `{OUT.relative_to(DIST)}`",
            "",
            "- Checked homepage desktop/mobile, Run Mode, GM Dashboard, Garrick entity page tablet/mobile, PC cheat sheet, pronunciation guide, and Player Display.",
            "- Verified no horizontal overflow, no visible prompt leakage, contain-first image rendering, entity lede not clipped, labeled icon controls, and Run Mode to Player Display sync.",
            "",
        ]
        qa_report.write_text(qa_report.read_text(encoding="utf-8") + "\n".join(addendum), encoding="utf-8")
        (ROOT / "docs" / "STORY_ATLAS_QA_REPORT.md").write_text(qa_report.read_text(encoding="utf-8"), encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["pass"] else 1


def main() -> int:
    return asyncio.run(main_async())


if __name__ == "__main__":
    raise SystemExit(main())
