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
| A2 | Local page / desktop and mobile | Top CTA | Visible CTA text is `Registration coming soon`; href is `coming-soon/` until the real listing URL is available. Mobile first fold keeps the primary CTA visible. | Keep registration state honest now; restore `Claim a Seat` when the real listing URL is available. | Passed focused CTA label/link sweep. |
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
- [x] `visual_qa` gate recorded with the local artifact quality helper.
- [x] `design_taste` gate recorded with the local artifact quality helper.
- [x] `communication_review` gate recorded with the local artifact quality helper.

## Latest Local Metrics

- Desktop `1366x900`: no horizontal overflow; primary CTA visible; hero party image rendered at `1.5` ratio matching the source.
- Mobile `390x844`: no horizontal overflow; primary CTA visible; mobile party image rendered at `1.5` ratio matching the source.
- Public surface sweep found no internal source-status wording, stale venue shorthand, stray wolf accent references, placeholders, or spoilers.

## Publish Smoke Test

- Page revision published at commit `2b93ab9`.
- Live HTML returned `200` at `https://jonathankhobson.github.io/gm/events/goldspire/`.
- Live HTML contains the prepared party-reference hero markers, registration-state CTA text, `Mox Boarding House Chandler`, and `Peril to Profit`.
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
- Quality-gate note: `visual_qa`, `design_taste`, and `communication_review` were recorded with the local artifact quality helper during the final audit reconciliation pass.

### Live Publish Smoke Test

- Published `/gm` to commit `8f1fdcb`.
- Live landing page returned `200` at `https://jonathankhobson.github.io/gm/events/goldspire/` and contains the courier PDF markers, all-character packet link, and Demiplane link.
- Live Daggerheart resources page returned `200` at `https://jonathankhobson.github.io/gm/resources/daggerheart.html` and contains the Goldspire PDF cards, rules basics section, all-character packet link, and printed-sheet note.
- Live all-character PDF returned `200` as `application/pdf` at `https://jonathankhobson.github.io/gm/events/goldspire/assets/player-pdfs/all-player-character-packet-pages-02-21.pdf`.
- Live source sweep found no private-table identifiers, GM-only labels, internal safety-stage wording, placeholders, or known spoiler strings in the two public HTML files checked.

## 2026-06-17 UX Writing And Tone Pass QA

### Writing Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| W1 | Playwright desktop `1366x900` and mobile `390x900` | Hero / first fold | Hero now sells the broad experience: learn Daggerheart in one night, funny cinematic fantasy delivery, no tabletop or Daggerheart experience needed, heroes provided. | Keep the first scan clear for total newcomers and Daggerheart-curious RPG players. | Passed screenshot review and rendered text check. |
| W2 | Playwright desktop `1366x900` and mobile `390x900` | New player section | Copy explicitly says no rules knowledge, dice, character creation, or acting voice required, and normalizes questions. | Reduce newcomer and reluctant-plus-one anxiety without making the event sound only for beginners. | Passed screenshot review and rendered text check. |
| W3 | Playwright desktop `1366x900` and mobile `390x900` | Premise section | Premise now frames a simple Goldspire Territories delivery and magical ward-stone without making the adventure a single-object mystery or explaining hidden plot dynamics. | Create curiosity without spoilers or object overemphasis. | Passed source sweep: no repeated delivery-object fixation, 1 ward-stone mention, no blocked spoiler language. |
| W4 | Playwright desktop `1366x900` and mobile `390x900` | FAQ / optional reading | FAQ remains closed by default and reinforces Daggerheart clarity, no prep, one-shot pace, and no acting requirement. | Preserve progressive disclosure and beginner reassurance. | Passed details-closed metric and screenshot review. |

### Local Verification

- Local server: `http://127.0.0.1:8765/events/goldspire/`.
- Desktop `1366x900` and mobile `390x900`: no horizontal overflow.
- Rendered text checks passed for: `Learn Daggerheart in one night`, `No tabletop or Daggerheart experience needed`, `Heroes provided`, `rules taught as you play`, `No acting required`, and one-evening completion language.
- Source and rendered sweeps found no repeated delivery-object fixation, 1 `ward-stone` mention, and no blocked hidden-plot explanation phrases.
- Artifact quality gate helper marked `visual_qa`, `design_taste`, and `communication_review` complete for `events/goldspire/index.html` with evidence at `/tmp/goldspire-writing-qa-2026-06-17/summary.json`.

### Live Publish Smoke Test

- Published `/gm/events/goldspire/` writing pass at commit `c097a86`.
- Live landing page returned `200` and served the updated HTML with the new `Learn Daggerheart in one night`, `No tabletop or Daggerheart experience needed`, optional acting-voice, magical-cargo premise, and `Learn Daggerheart in one evening` copy.
- Live source check found the old repeated delivery-object hooks absent.

## 2026-06-17 Transparent Character Asset Replacement QA

### Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| P1 | Playwright desktop `1366x900` | Hero party panel | Party art now uses the transparent `party-reference.png` source instead of the earlier background-removed file with matte artifacts. | Keep the single controlled party image in the hero. | Passed screenshot review; no broken image; natural size `1536x1024`; no horizontal overflow. |
| P2 | Playwright mobile `390x900` | Mobile hero party strip | Party strip remains visible and centered between the hero copy and logistics chips. | Preserve mobile first-fold clarity while showing the improved crew art. | Passed screenshot review; no collision with facts or CTA; no horizontal overflow. |
| C1 | Playwright desktop `1366x900` and mobile `390x900` | `.courier-grid` | Five courier cards now use regenerated cropped derivatives from the new transparent individual PC sources. | Replace the old card portraits without changing the card/link structure. | Passed screenshot review and metrics: all five images complete with updated natural dimensions and no broken images. |
| M1 | Local source manifest | Character asset source list | Manifest now points to `visual-assets/pc_portrait_assets/transparent/` for party and PC art. | Keep source status accurate and remove reliance on the artifact-prone background-removal outputs. | Passed source review. |

### Local Verification

- Local server: `http://127.0.0.1:8765/events/goldspire/`.
- Desktop `1366x900` and mobile `390x900`: no horizontal overflow and the registration-state CTA remains visible.
- Replaced 11 page-local character image files: 6 full transparent sources and 5 regenerated cropped card portraits.
- Updated character-card `width`/`height` attributes to match the regenerated crop dimensions.
- Evidence: `/tmp/goldspire-new-transparent-assets-qa-2026-06-17/summary.json`, `desktop-hero.png`, `mobile-hero.png`, `desktop-courier-grid.png`, `mobile-courier-grid.png`, and `source-replacement-contact-sheet.jpg`.

## 2026-06-17 UX Audit Execution Slice (BUG-01 Deferred)

### Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| X1 | Playwright desktop `1366x900` and mobile `390x844` | Daggerheart page footer / CTA | Added closing CTA + footer on `/resources/daggerheart.html` with clear return path. | Close reassurance dead-end and keep return-loop into event funnel. | Passed: footer exists and CTA actions are present. |
| X2 | Playwright desktop `1366x900` and mobile `390x844` | 404 route | `/404.html` presents branded recovery and direct links to Home, Goldspire, Daggerheart. | Reduce error confusion on bad URLs. | Passed: branded 404 loaded, recovery buttons rendered. |
| X3 | Playwright desktop `1366x900` and mobile `390x844` | Event nav and resources nav | Nav labels now aligned (`New players / Characters / FAQ / Daggerheart / Portfolio`) and mobile scroll row restored. | Lower header navigation barrier on small widths. | Passed: all labels visible within the nav row. |
| X4 | Playwright desktop `1366x900` and mobile `390x844` | Social proof block | Social proof now uses real player reflections plus compact proof media. | Add trust signal without creating a long blank-scroll proof gallery. | Passed: real quotes and proof thumbnails rendered; no pending/placeholder public copy. |
| X5 | `sitemap.xml` source check | SEO index list | Removed `events/goldspire/coming-soon/` from sitemap while keeping destination in config/CTA. | Avoid indexing placeholder route. | Passed: coming-soon entry absent from sitemap. |

### Checks Completed

- [x] `resources/daggerheart.html` includes closing CTA band, footer, Twitter metadata, and linked `resources/daggerheart.css`.
- [x] `events/goldspire/index.html` retains consistent Daggerheart reassurance and mobile nav visibility.
- [x] Root `404.html` exists and links to Home, Mox route, and Daggerheart resources.
- [x] `events/goldspire/coming-soon/index.html` explicitly set `noindex, nofollow` for SEO safety.
- [x] Bug reports `BUG-02` through `BUG-09` marked complete in `events/goldspire/docs/audit-uxhc/bugs/`.
- [ ] `BUG-01` registration destination lock remains deferred by request until real listing link is available.

## 2026-06-17 Audit Reconciliation And Proof Repair QA

### Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| Nav01 | Playwright `390x844`, `430x844`, `1366x900` | Header nav row | `New players`, `Characters`, `FAQ`, `Daggerheart`, `Portfolio`, and the registration-state CTA are present in the header row; no hidden hamburger path remains. | Preserve mobile wayfinding through the horizontal-scroll row. | Passed: no horizontal overflow; screenshots `event-390--site-header.png`, `event-430--site-header.png`, `event-1366--goldspire-hero.png`. |
| Hero01 | Playwright `390x844`, `1366x900` | First fold / hero CTA | Hero keeps concise Daggerheart/newcomer framing and visible registration-state CTA. | Maintain beginner self-qualification and honest conversion state above the fold. | Passed: screenshots `event-390--goldspire-hero.png`, `event-1366--goldspire-hero.png`; four `[data-event-cta]` links use config destination. |
| Proof01 | Playwright `390x844`, `1366x900` | Social proof section | Proof area is now text-led with three quote cards and two compact evidence thumbnails. No large blank media stack remains. | Fix the previous proof-section scroll/blank-space issue while adding trust evidence. | Passed: screenshots `event-390--goldspire-social-proof.png`, `event-1366--goldspire-social-proof.png`; static sweep found no pending/placeholder copy. |
| Resource01 | Playwright `390x844`, `1366x900` | Daggerheart proof/CTA bands | Resource page now has a proof band, return loop, registration-state CTA, and footer. | Prevent reassurance detour dead-end. | Passed: screenshots `resource-390--resource-proof-band.png`, `resource-390--daggerheart-cta-band.png`, `resource-1366--resource-proof-band.png`, `resource-1366--daggerheart-cta-band.png`. |
| Error01 | Playwright `390x844` | Root `404.html` | Branded 404 recovery links render on mobile. | Recover bad/stale route traffic. | Passed: screenshot `404-390-main.png`. |
| CTA01 | Static + Playwright | All event CTAs and Book me links | Four event CTAs use `registration_state: "pending"`, `pending_url: "coming-soon/"`, and `pending_label: "Registration coming soon"`; two `Book me` links route to `../../index.html#contact`; `coming-soon/` is not in sitemap and is `noindex,nofollow`. | Keep registration dependency deferred while preserving an easy future cutover and private-session inquiry path. | Passed: focused static integrity sweep. |

### Static Integrity Checks

- Checked public routes: `events/goldspire/index.html`, `resources/daggerheart.html`, `404.html`, `events/goldspire/coming-soon/index.html`.
- Local reference sweep: 109 `src`/`href` references checked, 0 missing.
- CSS URL sweep: 17 `url(...)` references checked, 0 missing. Restored the shared `assets/generated/` WebP files referenced by `styles/base.css` and `styles/components.css`.
- Public text sweep: 0 hits for pending/placeholder testimony language, internal source-status terms, private-table identifiers, or known hidden-plot spoiler phrases.
- JSON-LD: parsed successfully; event name is `Peril to Profit™: The Goldspire Messengers`.
- Event CTA config: `registration_state` remains `pending`; `pending_url` remains `coming-soon/`; `pending_label` is `Registration coming soon`; `events/goldspire/coming-soon/` remains absent from `sitemap.xml`.
- Browser QA evidence: `/tmp/goldspire-audit-final-qa-2026-06-17/summary.json`.
- Static QA evidence: `/tmp/goldspire-static-integrity-2026-06-17.json`.

## 2026-06-17 Interim Registration CTA QA

### Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| Nav01 | Playwright `390x844`, `1366x900` | Goldspire header nav | Temporary registration CTA reads `Registration coming soon`, points to `coming-soon/`, and remains readable without internal overflow. | Keep this honest interim state until the real listing URL exists. | Passed: `/tmp/goldspire-registration-cta-qa-2026-06-17/event-mobile.png`, `/tmp/goldspire-registration-cta-qa-2026-06-17/event-desktop.png`. |
| Hero01 | Playwright `390x844`, `1366x900` | Goldspire first-fold CTA | Hero CTA uses the same temporary label, remains visible above the fold, and fits its button. | Restore `Claim a Seat` during final event-listing cutover. | Passed: `/tmp/goldspire-registration-cta-qa-2026-06-17/summary.json`. |
| Resource01 | Playwright `390x844`, `1366x900` | Daggerheart resource nav / CTA band | Resource detour uses the same temporary registration label and routes to the Goldspire coming-soon target. | Mirror final CTA label once the listing URL is live. | Passed: `/tmp/goldspire-registration-cta-qa-2026-06-17/resource-mobile.png`, `/tmp/goldspire-registration-cta-qa-2026-06-17/resource-desktop.png`. |

### Static Integrity Checks

- Public active HTML sweep found zero `Registration has not started yet` strings and zero active `Claim a Seat` fallback labels.
- `events/goldspire/goldspire-registration.js` remains the cutover point: `registration_state: "pending"`, `pending_url: "coming-soon/"`, `pending_label: "Registration coming soon"`.
- `events/goldspire/coming-soon/` remains absent from `sitemap.xml`; event JSON-LD parses successfully.
- Playwright metric check found no horizontal overflow and no CTA internal overflow for Goldspire and Daggerheart routes at `390x844` and `1366x900`.

### Backlog / Deferred

- `BUG-01`: deferred until the real external event listing URL exists.
- Media performance: PNG-to-WebP/AVIF conversion plus responsive `srcset/sizes` remains the next performance slice.
- Full numeric accessibility certification: axe/Lighthouse contrast pass remains a future verification slice; rendered contrast was reviewed and resource secondary-button contrast was strengthened.

## 2026-06-17 Registration Coming Soon CTA Repair QA

### Visual Anchor Map

| ID | Source / viewport | Region | Visual fact / issue | Intended action | Verification |
| --- | --- | --- | --- | --- | --- |
| CTA01 | Playwright `390x844`, `1366x900` | Goldspire nav, hero, final, footer CTAs | Pending CTA reads `Registration coming soon`, routes to `coming-soon/`, and receives aria label `Registration coming soon. Open event listing status.` | Keep until real listing URL exists; switch shared config to live later. | Passed: `/tmp/goldspire-registration-coming-soon-qa-2026-06-17/event-mobile.png`, `/tmp/goldspire-registration-coming-soon-qa-2026-06-17/event-desktop.png`. |
| Soon01 | Playwright `390x844`, `1366x900` | Coming-soon status page | Page now shows status banner, clear explanation, compact event facts, courier art, and three recovery actions. Mobile first viewport includes the primary `Back to event page` action. | Use as polished temporary listing-status route, not a signup system. | Passed: `/tmp/goldspire-registration-coming-soon-qa-2026-06-17/soon-mobile.png`, `/tmp/goldspire-registration-coming-soon-qa-2026-06-17/soon-desktop.png`. |
| ResourceCTA01 | Playwright `390x844`, `1366x900` | Daggerheart nav and closing CTA | Resource page uses the same shared pending CTA label, target, and aria label as the event page. | Prevent label drift during final cutover. | Passed: `/tmp/goldspire-registration-coming-soon-qa-2026-06-17/resource-mobile.png`, `/tmp/goldspire-registration-coming-soon-qa-2026-06-17/resource-desktop.png`. |

### Static Integrity Checks

- Public active HTML sweep found zero `Registration has not started yet` strings and zero active `Claim a Seat` fallback labels.
- `events/goldspire/goldspire-registration.js` owns the reversible cutover state: `registration_state: "pending"`, `pending_label: "Registration coming soon"`, `live_label: "Claim a Seat"`, `pending_url: "coming-soon/"`.
- `events/goldspire/goldspire.js` no longer contains duplicate CTA config.
- `events/goldspire/coming-soon/` remains absent from `sitemap.xml` and the route remains `noindex,nofollow`.
- Playwright metric check found no horizontal overflow, no CTA internal overflow, and no broken courier image on all checked routes.
