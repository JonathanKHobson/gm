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

Pending for the current revision after push.
