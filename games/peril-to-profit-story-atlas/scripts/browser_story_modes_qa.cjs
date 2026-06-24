#!/usr/bin/env node
/* Rendered browser QA for concise Story Outline, Storyboard, and Story pages. */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("/Users/kyle/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const here = __dirname;
let root = path.resolve(here, "../..");
let dist = path.join(root, "dist", "story-atlas");
if (!fs.existsSync(path.join(dist, "pages", "story-outline.html"))) {
  dist = path.resolve(here, "..");
  root = path.resolve(dist, "../..");
}
const reportPath = path.join(dist, "data", "qa-story-modes-browser-report.json");
const screenshots = path.join(dist, "qa", "screenshots");

const pages = [
  ["outline-desktop", "pages/story-outline.html", { width: 1366, height: 768 }],
  ["outline-mobile", "pages/story-outline.html", { width: 390, height: 844 }],
  ["storyboard-desktop", "pages/storyboard.html", { width: 1366, height: 768 }],
  ["story-mobile", "pages/story.html", { width: 390, height: 844 }],
];

function add(checks, name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

async function evaluatePage(page) {
  return page.evaluate(() => {
    const rootEl = document.querySelector("[data-story-mode-page]");
    const visible = (el) => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden";
    const contentImages = Array.from(document.querySelectorAll("#content img")).filter(visible);
    const nonIconImages = contentImages.filter((img) => !img.classList.contains("type-icon"));
    const cards = Array.from(document.querySelectorAll("[data-story-card]"));
    const visibleCards = cards.filter(visible);
    const entityLinks = document.querySelectorAll("#content [data-entity]").length;
    const hasOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    return {
      title: document.title,
      hasRoot: !!rootEl,
      hasSearch: !!document.querySelector("[data-story-search]"),
      hasFilter: !!document.querySelector("[data-story-act-filter]"),
      entityLinks,
      visibleCards: visibleCards.length,
      contentImages: contentImages.length,
      nonIconImages: nonIconImages.length,
      hasOverflow,
      hasPromptLeak: /image prompt|asset status|do not include the strixwolf|prompt_fallback/i.test(rootEl ? rootEl.innerText : ""),
      hasSpeechControls: !!document.querySelector("[data-story-read]"),
      hasStoryboardGrid: !!document.querySelector(".storyboard-grid"),
    };
  });
}

async function main() {
  fs.mkdirSync(screenshots, { recursive: true });
  const checks = [];
  const pageResults = [];
  const browser = await chromium.launch({ headless: true });
  for (const [label, rel, viewport] of pages) {
    const page = await browser.newPage({ viewport });
    await page.goto(pathToFileURL(path.join(dist, rel)).href, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const data = await evaluatePage(page);
    const shot = path.join(screenshots, `story-modes-${label}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    Object.assign(data, { label, path: rel, viewport, screenshot: shot });
    pageResults.push(data);
    add(checks, `${rel} renders story mode root at ${viewport.width}`, data.hasRoot, data);
    add(checks, `${rel} has no horizontal overflow at ${viewport.width}`, !data.hasOverflow, data);
    add(checks, `${rel} has search and filter at ${viewport.width}`, data.hasSearch && data.hasFilter, data);
    add(checks, `${rel} has no visible prompt/dev leakage at ${viewport.width}`, !data.hasPromptLeak, data);
    add(checks, `${rel} preserves wiki entity links at ${viewport.width}`, data.entityLinks >= 8, data);
    if (rel.includes("story-outline")) {
      add(checks, `${rel} keeps content images out of outline at ${viewport.width}`, data.nonIconImages === 0, data);
    }
    if (rel.includes("storyboard")) {
      add(checks, `${rel} shows visual storyboard cards`, data.hasStoryboardGrid && data.nonIconImages >= 20, data);
    }
    if (rel.endsWith("story.html")) {
      add(checks, `${rel} exposes story read-aloud controls`, data.hasSpeechControls, data);
    }
    await page.close();
  }

  const outline = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await outline.goto(pathToFileURL(path.join(dist, "pages", "story-outline.html")).href, { waitUntil: "networkidle" });
  await outline.fill("[data-story-search]", "Bramble");
  await outline.waitForTimeout(250);
  const searchCount = await outline.locator("[data-story-card]:not(.story-hidden)").count();
  await outline.selectOption("[data-story-act-filter]", "Act Three");
  await outline.waitForTimeout(250);
  const filteredCount = await outline.locator("[data-story-card]:not(.story-hidden)").count();
  add(checks, "story outline search narrows visible cards", searchCount > 0 && searchCount < 36, searchCount);
  add(checks, "story outline filter combines with search without crashing", filteredCount >= 0, filteredCount);
  await outline.close();
  await browser.close();

  const report = {
    pass: checks.every((check) => check.ok),
    check_count: checks.length,
    issue_count: checks.filter((check) => !check.ok).length,
    pages: pageResults,
    checks,
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.pass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
