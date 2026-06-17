---
project: goldspire-landing-page
type: qa-results
status: local-qa-passed
---

# QA Results

## Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| A1 | Playwright desktop `1366x900` and mobile `390x844` | Hero | Hero now uses one prepared background-removed courier crew reference. No CSS-composed individual portrait overlap remains. | Keep one controlled party image in the hero; use individual portraits in character cards below. | Passed rendered screenshot review and DOM metrics: no overflow, one `.hero-party-reference`, zero `.cast-member` nodes. |
| A2 | Local page / desktop and mobile | Top CTA | Visible CTA text is `Claim a Seat`; href is `coming-soon/` until the real listing URL is available. Mobile first fold keeps the primary CTA visible. | Keep CTA conversion-ready and change only `event_signup_url` later. | Passed Playwright CTA visibility check and link sweep. |
| A3 | Playwright desktop `1366x900` | Beginner section image | Welcome image renders at its natural 16:9 ratio without clipping or stretched crop. | Preserve full image and concise caption. | Passed rendered screenshot review and ratio metric. |
| A4 | Playwright desktop `1366x900` and mobile `390x844` | Premise image | Forest route image renders square without the tall crop/stretch shown in earlier screenshots. | Keep stable square treatment. | Passed rendered screenshot review and ratio metric. |
| A5 | Playwright desktop `1366x900` and mobile `390x844` | GM/table-style side art | Courier accent is contained inside its panel; the stray wolf accent is removed from HTML and CSS. | Keep only one restrained accent here. | Passed side-art bounds metric and source sweep. |
| A6 | Playwright desktop `1366x900` | Eyebrow label contrast | `.goldspire-label` on light backgrounds now uses `rgb(109, 64, 16)`, improving contrast over the previous pale gold. | Keep labels readable on warm paper backgrounds. | Passed screenshot review and computed-style check. |
| A7 | Playwright desktop `1366x900` and mobile `390x844` | Location art grid | Location images lazy-load and render at stable square ratios without public-facing source-status wording. | Keep captions plain and spoiler-light. | Passed scroll screenshot, ratio check, and text sweep. |
| A8 | Local FAQ/details | Progressive disclosure | FAQ answers are closed by default; optional details remain in accordions/details. | Preserve optional reading below the high-signal first fold. | Passed previous Playwright toggle check; no markup changes since. |

## Checklist

- [x] Local static server run at `http://127.0.0.1:8765/events/goldspire/`.
- [x] Desktop hero screenshot checked.
- [x] Mobile hero screenshot checked.
- [x] Beginner image, premise image, side-art, expectations label, and route-grid screenshots checked.
- [x] Local asset existence sweep passed.
- [x] Lazy image behavior checked through targeted scroll screenshots.
- [x] CTA/link click test passed.
- [x] FAQ/details progressive disclosure test passed.
- [x] Public text sweep for internal source-status wording, stale venue shorthand, placeholders, and spoilers passed.
- [x] Removed the stray wolf accent from the active page implementation.
- [x] Manual `visual_qa` gate recorded in the Pro GM gate log.
- [x] Manual `design_taste` gate recorded in the Pro GM gate log.
- [x] Manual `communication_review` gate recorded in the Pro GM gate log.

## Latest Local Metrics

- Desktop `1366x900`: no horizontal overflow; primary CTA visible; hero party image rendered at `1.5` ratio matching the source.
- Mobile `390x844`: no horizontal overflow; primary CTA visible; mobile party image rendered at `1.5` ratio matching the source.
- Public surface sweep found no internal source-status wording, stale venue shorthand, stray wolf accent references, placeholders, or spoilers.

## Publish Smoke Test

- Page revision published at commit `2b93ab9`.
- Live HTML returned `200` at `https://jonathankhobson.github.io/gm/events/goldspire/`.
- Live HTML contains the prepared party-reference hero markers, `Claim a Seat`, `Mox Boarding House Chandler`, and `Peril to Profit`.
- Live HTML source sweep found zero stale cast-member, stray wolf accent, internal source-status, or stale venue shorthand markers.
- Live CSS returned `200`, contains the new hero party image styles and label contrast token, and contains zero old `.cast-*` or wolf accent rules.

## 2026-06-17 Player PDFs And Rules Basics QA

### Additional Visual Anchors

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| C1 | Playwright desktop `1366x900` and mobile `390x900` | Goldspire `.courier-grid` | Five courier cards are clickable PDF links, retain individual portrait art, and do not create horizontal overflow. | Keep the card itself as the PDF target while preserving the visual character chooser. | Passed local rendered checks; all five courier images reported complete with natural dimensions on desktop and mobile. |
| C2 | Playwright desktop `1366x900` and mobile `390x900` | Goldspire optional prep panel | The panel explains intended PCs, other Level 1 sheets, Demiplane character building, and printed in-person sheets without making prep feel required. | Keep as optional depth below the courier cards. | Passed screenshot review and source text check. |
| R2 | Playwright desktop `1366x900` and mobile `390x900` | `/resources/daggerheart.html` PDF section | Six PDF cards are readable and touch-friendly; all open in a new tab with `noopener noreferrer`. | Let players browse all sheets or one PC sheet without requiring prep. | Passed screenshot review, link check, and copy scan. |
| R3 | Playwright desktop `1366x900` and mobile `390x900` | `/resources/daggerheart.html` rules basics | Six plain-language rule cards are visible; denser HP/Stress/conditions/table-reminder notes remain behind optional details. | Keep player-facing basics lighter than the official rules site. | Passed screenshot review and disclosure count check. |

### Local Verification

- Local server: `http://127.0.0.1:8765/`.
- Checked routes: `/events/goldspire/` and `/resources/daggerheart.html`.
- Desktop `1366x900` and mobile `390x900`: no horizontal overflow.
- Goldspire landing page: 6 PDF links, 5 courier cards, 1 Demiplane link, printed-sheet note present, all five courier images loaded.
- Daggerheart resources page: 6 PDF links, 6 PDF cards, 6 basics cards, 3 optional rules details, 2 Demiplane links, printed-sheet note present.
- Local link sweep: 16 same-origin links checked, 0 failures.
- Public text/source sweep: no private-table identifiers, GM-only rules labels, internal safety-stage wording, placeholders, or known spoiler strings found in the active page sources/docs checked.
- Quality-gate note: manual `visual_qa`, `design_taste`, and `communication_review` recorded in the Pro GM gate log for this focused slice; the requested `codex_artifact_quality_gate.py` helper was not present in the workspace.
