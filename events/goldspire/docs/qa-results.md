---
project: goldspire-landing-page
type: qa-results
status: local-qa-passed
---

# QA Results

## Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| A1 | `/tmp/goldspire-qa-final4/hero-desktop-1440x900.png`, `/tmp/goldspire-qa-final4/hero-tablet-1024x900.png`, `/tmp/goldspire-qa-final4/hero-mobile-390x844.png` | Hero | Title, premise, logistics, venue, CTA, and character visuals fit without text/image collision. Desktop and tablet show a hint of the reassurance strip. Mobile shows a compact individual-PC strip before logistics. | Keep staged individual PCs; do not use party-reference image in hero. | Passed screenshot review and DOM metrics. |
| A2 | Local page / desktop, tablet, mobile | CTA links | Visible CTA text is `Claim a Seat`; href is `coming-soon/` until the real listing URL is available. | Keep CTA conversion-ready and change only `event_signup_url` later. | Passed link sweep and Playwright CTA check. |
| A3 | `/tmp/goldspire-qa-sections/couriers-desktop.png`, `/tmp/goldspire-qa-sections/couriers-mobile.png` | Character deck | Five premade characters render from cropped individual portraits with beginner-safe vibe copy and no blank image cards. | Keep cards scannable; avoid overstuffed tags. | Passed screenshot review. |
| A4 | `/tmp/goldspire-qa-sections/world-mobile.png`, `/tmp/goldspire-qa-sections/world-desktop.png` | Location art | Location images lazy-load on scroll and support mood without exposing plot details. | Keep captions plain and player-safe. | Passed targeted scroll screenshot and asset sweep. |
| A5 | `/tmp/goldspire-qa-sections/faq-mobile.png` | FAQ/details | FAQ answers are closed by default; tapping a summary opens exactly one optional reading block in QA. | Preserve progressive disclosure. | Passed Playwright toggle check. |
| A6 | `/tmp/goldspire-qa-sections/care-mobile.png`, `/tmp/goldspire-qa-sections/care-desktop.png` | Accessibility note | Accommodation note is visible, plain-language, and includes the best-effort caveat without overpromising. | Keep copy direct and non-legalistic. | Passed copy and screenshot review. |
| A7 | Local route sweep | Footer CTA and support routes | Portfolio, Peril to Profit context, Daggerheart resources, Mox page, directions, and CTA routes resolve. | Verify again after publish. | Passed local route/link sweep. |

## Checklist

- [x] Local static server run at `http://127.0.0.1:8765/events/goldspire/`.
- [x] Desktop screenshot checked.
- [x] Tablet screenshot checked.
- [x] Mobile screenshot checked.
- [x] Local asset existence sweep passed.
- [x] Lazy image behavior checked through targeted scroll screenshots.
- [x] CTA/link click test passed.
- [x] FAQ/details progressive disclosure test passed.
- [x] Text sweep for internal notes, visible placeholders, and spoilers passed.
- [x] `visual_qa` quality gate marked.
- [x] `design_taste` quality gate marked.
- [x] `communication_review` quality gate marked.
- [x] GitHub Pages live URL verified at `https://jonathankhobson.github.io/gm/events/goldspire/` after commit `b2cdf06`.

## Publish Smoke Test

- Live route returned `200` after GitHub Pages propagated.
- Live HTML contained `Peril to Profit: The Goldspire Messengers`, `Mox Boarding House Chandler`, and `Claim a Seat`.
- Final CTA still points to `coming-soon/` pending the real event listing URL.
