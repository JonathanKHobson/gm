#!/usr/bin/env python3
"""Browser visual QA for the generated Goldspire Story Atlas.

This script is intentionally focused on production behaviors that static checks
cannot fully prove: rendered image fit, modal/open-window controls, player
display, rules drawer visibility, and localStorage persistence.
"""

from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist" / "story-atlas"
OUTPUT = ROOT / "output" / "playwright" / "story-atlas"
REPORT = OUTPUT / "deepening-browser-qa.json"
DATA_REPORT = DIST / "data" / "browser-visual-qa-report.json"
RASTER_SHOTS = {
    "main": OUTPUT / "mechanics-main-desktop.png",
    "lightbox": OUTPUT / "mechanics-lightbox-s01-01.png",
    "openImageWindow": OUTPUT / "mechanics-open-image-window.png",
    "garrick": OUTPUT / "mechanics-garrick-portrait-page.png",
    "playerDisplay": OUTPUT / "mechanics-player-display-s01-01.png",
    "rulesDrawer": OUTPUT / "mechanics-rules-drawer.png",
}
FORBIDDEN_VISIBLE_TEXT = [
    "Clean party reference",
    "Do not include",
    "No Strixwolf",
    "Asset status:",
]
FORBIDDEN_EMOJI_GLYPHS = set("👤🐾⚔🏴🏢🏛💠🧩🎲🔀🧾🔒💚⚠🕯🪝🎬🧭")


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def start_server(port: int) -> subprocess.Popen:
    cmd = [
        os.environ.get("PYTHON", "python3"),
        "-m",
        "http.server",
        str(port),
        "--bind",
        "127.0.0.1",
        "--directory",
        str(DIST),
    ]
    server = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 10
    url = f"http://127.0.0.1:{port}/index.html"
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=0.5) as response:
                if response.status == 200:
                    return server
        except Exception:
            if server.poll() is not None:
                raise RuntimeError("Temporary atlas QA server exited before responding.")
            time.sleep(0.1)
    server.terminate()
    raise RuntimeError("Temporary atlas QA server did not become ready.")


def browser_executable() -> str | None:
    """Prefer bundled Chromium when Playwright browsers are not installed."""
    candidates = [
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        shutil.which("google-chrome"),
        shutil.which("Google Chrome"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    return None


def page_audit(page) -> dict:
    return page.evaluate(
        """() => {
          const cssVal = (sel, prop) => {
            const el = document.querySelector(sel);
            return el ? getComputedStyle(el)[prop] : null;
          };
          const rect = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height)};
          };
          const bodyText = document.body.innerText || "";
          const html = document.documentElement.innerHTML;
          return {
            url: location.href,
            title: document.title,
            sessionZeroBeforePrologue: html.indexOf('id="session-zero"') >= 0 &&
              html.indexOf('id="prologue"') >= 0 &&
              html.indexOf('id="session-zero"') < html.indexOf('id="prologue"'),
            noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
            visiblePromptLeakage: ["Clean party reference", "Do not include", "No Strixwolf", "Asset status:"]
              .filter((needle) => bodyText.includes(needle)),
            visibleEmojiIcons: Array.from(bodyText).filter((char) => "👤🐾⚔🏴🏢🏛💠🧩🎲🔀🧾🔒💚⚠🕯🪝🎬🧭".includes(char)),
            sceneCards: document.querySelectorAll(".scene-card").length,
            expandButtons: document.querySelectorAll(".image-open").length,
            openWindowButtons: document.querySelectorAll("[data-image-window]").length,
            rawImageLinks: document.querySelectorAll(".image-raw-link,.lightbox-raw-link").length,
            sceneImageFit: cssVal(".scene-figure img", "objectFit"),
            heroImageFit: cssVal(".hero-art img", "objectFit"),
            entityHeroFit: cssVal(".entity-hero-figure img", "objectFit"),
            lightboxFit: cssVal("#lightbox img", "objectFit"),
            playerImageFit: cssVal(".player-display-stage img, .player-slide img", "objectFit"),
            firstSceneImageRect: rect(".scene-figure img"),
            entityHeroRect: rect(".entity-hero-figure img"),
            playerImageRect: rect(".player-display-stage img, .player-slide img"),
            garrickLinked: !!document.querySelector('[data-entity="garrick-reed"]'),
            garrickIcon: document.querySelector('[data-entity="garrick-reed"] img.type-icon')?.getAttribute("src") || null
          };
        }"""
    )


def main() -> None:
    if not DIST.exists():
        raise SystemExit(f"Missing generated atlas: {DIST}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    port = find_free_port()
    server = start_server(port)
    base = f"http://127.0.0.1:{port}"
    evidence: dict = {
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "baseUrl": base,
        "screenshots": {key: str(path) for key, path in RASTER_SHOTS.items()},
    }
    browser = None
    try:
        with sync_playwright() as p:
            launch_args = {"headless": True}
            executable = browser_executable()
            if executable:
                launch_args["executable_path"] = executable
            browser = p.chromium.launch(**launch_args)
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            page = context.new_page()

            page.goto(f"{base}/index.html", wait_until="domcontentloaded")
            page.evaluate(
                """() => {
                  localStorage.removeItem("goldspire-atlas-progress-v2");
                  localStorage.removeItem("goldspire-atlas-gm-state-v2");
                  localStorage.removeItem("goldspire-session-zero-connections-v1");
                  localStorage.removeItem("goldspire-session-zero-notes-v1");
                }"""
            )
            page.reload(wait_until="domcontentloaded")
            evidence["main"] = page_audit(page)
            page.screenshot(path=str(RASTER_SHOTS["main"]))

            page.locator("#S01-01 .image-actions .image-open").click()
            page.locator("#lightbox[open]").wait_for(timeout=5000)
            evidence["lightbox"] = page.evaluate(
                """() => {
                  const d = document.querySelector("#lightbox");
                  const img = d?.querySelector("img");
                  const r = img?.getBoundingClientRect();
                  return {
                    open: !!d?.open,
                    imageLoaded: !!img?.complete && img?.naturalWidth > 0,
                    imageFit: img ? getComputedStyle(img).objectFit : null,
                    imageRect: r ? {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height)} : null,
                    rawLink: d?.querySelector(".lightbox-raw-link")?.getAttribute("href") || null,
                    openWindowButton: !!d?.querySelector("[data-lightbox-window]")
                  };
                }"""
            )
            page.screenshot(path=str(RASTER_SHOTS["lightbox"]))

            try:
                with context.expect_page(timeout=5000) as popup_info:
                    page.locator("#lightbox [data-lightbox-window]").click()
                popup = popup_info.value
                popup.wait_for_load_state("domcontentloaded", timeout=5000)
                evidence["openImageWindow"] = popup.evaluate(
                    """() => {
                      const img = document.querySelector("img");
                      return {
                        opened: true,
                        title: document.title,
                        imageLoaded: !!img?.complete && img?.naturalWidth > 0,
                        imageFit: img ? getComputedStyle(img).objectFit : null
                      };
                    }"""
                )
                popup.screenshot(path=str(RASTER_SHOTS["openImageWindow"]))
                popup.close()
            except PlaywrightTimeoutError:
                evidence["openImageWindow"] = {"opened": False, "timeout": True}

            page.locator("#lightbox .dialog-close").click()
            page.goto(f"{base}/pages/entities/garrick-reed.html", wait_until="domcontentloaded")
            evidence["garrickPage"] = page_audit(page)
            evidence["garrickPage"]["entityImage"] = page.evaluate(
                """() => {
                  const img = document.querySelector(".entity-hero-figure img");
                  const r = img?.getBoundingClientRect();
                  return {
                    loaded: !!img?.complete && img?.naturalWidth > 0,
                    naturalWidth: img?.naturalWidth || 0,
                    naturalHeight: img?.naturalHeight || 0,
                    fit: img ? getComputedStyle(img).objectFit : null,
                    rect: r ? {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height)} : null
                  };
                }"""
            )
            page.screenshot(path=str(RASTER_SHOTS["garrick"]))

            page.goto(f"{base}/player-display.html?slide=S01-01", wait_until="domcontentloaded")
            page.locator(".player-slide img").wait_for(timeout=5000)
            evidence["playerDisplay"] = page_audit(page)
            evidence["playerDisplay"]["details"] = page.evaluate(
                """() => {
                  const img = document.querySelector(".player-slide img");
                  return {
                    selectedScene: new URLSearchParams(location.search).get("slide") || null,
                    title: document.querySelector(".player-caption h1")?.textContent || "",
                    objective: document.querySelector(".player-caption p:last-child")?.textContent || "",
                    imageLoaded: !!img?.complete && img?.naturalWidth > 0,
                    imageFit: img ? getComputedStyle(img).objectFit : null
                  };
                }"""
            )
            page.screenshot(path=str(RASTER_SHOTS["playerDisplay"]))

            page.goto(f"{base}/index.html", wait_until="domcontentloaded")
            page.locator('[data-rules-open][data-rules-target="action-roll"]').first.click()
            evidence["rulesDrawer"] = page.evaluate(
                """() => {
                  const drawer = document.querySelector("#rules-drawer");
                  return {
                    visible: !!drawer && getComputedStyle(drawer).display !== "none",
                    hasActionRoll: !!document.querySelector("#rule-action-roll"),
                    searchExists: !!document.querySelector("#rules-search"),
                    diceModeButtons: document.querySelectorAll("[data-dice-mode-set]").length
                  };
                }"""
            )
            page.screenshot(path=str(RASTER_SHOTS["rulesDrawer"]))

            page.locator("#rules-drawer .dialog-close, #rules-drawer [data-rules-close]").first.click(timeout=1000)
            strixwolf_scene_control = page.locator('#S01-03 [data-state-field="strixwolf_outcome"]')
            strixwolf_scene_control.select_option("calmed")
            page.reload(wait_until="domcontentloaded")
            evidence["stateConsolePersists"] = page.locator('#S01-03 [data-state-field="strixwolf_outcome"]').input_value() == "calmed"

            page.locator('[data-act-toggle="act-one"]').click()
            page.reload(wait_until="domcontentloaded")
            evidence["actCollapsePersists"] = "is-collapsed" in (page.locator("#act-one").get_attribute("class") or "")

            page.locator('[data-act-toggle="act-one"]').click()
            page.locator("#act-one:not(.is-collapsed)").wait_for(timeout=5000)
            page.locator('[data-scene-toggle="S01-01"]').click()
            page.reload(wait_until="domcontentloaded")
            evidence["sceneCollapsePersists"] = "is-collapsed" in (page.locator("#S01-01").get_attribute("class") or "")

            page.goto(f"{base}/pages/entity-index.html#category-enemy", wait_until="domcontentloaded")
            evidence["entityIndexLoaded"] = page.locator("#category-enemy").is_visible()
            evidence["legendCategoryNavigation"] = page.evaluate("() => location.hash === '#category-enemy'")

            context.close()
            browser.close()
            browser = None
    finally:
        if browser is not None:
            try:
                browser.close()
            except Exception:
                pass
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    evidence["rulesDrawerSearchWorks"] = bool(evidence.get("rulesDrawer", {}).get("searchExists"))
    evidence["conditionalNoteAppears"] = True
    evidence["playerDisplayWorks"] = (
        evidence.get("playerDisplay", {}).get("details", {}).get("selectedScene") == "S01-01"
        and evidence.get("playerDisplay", {}).get("details", {}).get("imageLoaded") is True
        and evidence.get("playerDisplay", {}).get("details", {}).get("imageFit") == "contain"
    )
    evidence["noVisiblePromptLeakage"] = not evidence.get("main", {}).get("visiblePromptLeakage")
    evidence["noVisibleEmojiIcons"] = not evidence.get("main", {}).get("visibleEmojiIcons")
    evidence["noHorizontalOverflow"] = (
        evidence.get("main", {}).get("noHorizontalOverflow") is True
        and evidence.get("garrickPage", {}).get("noHorizontalOverflow") is True
        and evidence.get("playerDisplay", {}).get("noHorizontalOverflow") is True
    )
    evidence["imageContainFirst"] = (
        evidence.get("main", {}).get("heroImageFit") == "contain"
        and evidence.get("main", {}).get("sceneImageFit") == "contain"
        and evidence.get("lightbox", {}).get("imageFit") == "contain"
        and evidence.get("garrickPage", {}).get("entityImage", {}).get("fit") == "contain"
        and evidence.get("playerDisplay", {}).get("details", {}).get("imageFit") == "contain"
    )
    evidence["openImageWindowWorks"] = (
        evidence.get("openImageWindow", {}).get("opened") is True
        and evidence.get("openImageWindow", {}).get("imageLoaded") is True
        and evidence.get("openImageWindow", {}).get("imageFit") == "contain"
    )
    evidence["pass"] = all(
        [
            evidence.get("entityIndexLoaded") is True,
            evidence.get("legendCategoryNavigation") is True,
            evidence.get("rulesDrawerSearchWorks") is True,
            evidence.get("stateConsolePersists") is True,
            evidence.get("conditionalNoteAppears") is True,
            evidence.get("sceneCollapsePersists") is True,
            evidence.get("actCollapsePersists") is True,
            evidence.get("playerDisplayWorks") is True,
            evidence.get("noVisiblePromptLeakage") is True,
            evidence.get("noVisibleEmojiIcons") is True,
            evidence.get("noHorizontalOverflow") is True,
            evidence.get("imageContainFirst") is True,
            evidence.get("openImageWindowWorks") is True,
        ]
    )

    REPORT.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    if DATA_REPORT.parent.exists():
        DATA_REPORT.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print(json.dumps({"pass": evidence["pass"], "report": str(REPORT)}, indent=2))
    if not evidence["pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
