---
project: pro-gm-website
type: qa-results
status: passed
updated: 2026-07-24
---

# Pro GM Site QA Results

## Result

The July 2026 experience upgrade passed local route, link, responsive, image,
structured-data, syntax, and visual checks before publication.

The July 24 booking-switchboard pass also passed verified-event rotation,
lead-capture, share-tool, responsive, contrast, and rendered visual checks.

## Booking Switchboard Icon Anchor Map

| ID | Source and viewport | Region / selector | Verified result |
| --- | --- | --- | --- |
| `Icon01` | `/tmp/gm-links-switchboard-qa/icons-mobile.png`, 390x844; `icons-desktop.png`, 1366x900 | Header, `.links-header-action .lucide-icon` | The prototype's 18px Lucide mail icon is restored, aligned with the label, and no longer rendered as a tiny platform-dependent glyph. |
| `Icon02` | Both icon QA screenshots | Featured event, `.event-facts .lucide-icon` | Calendar and map-pin icons are distinct, consistently sized at 18px, and aligned to their date and venue text. |
| `Icon03` | Both icon QA screenshots | Follow/resource rows, `.utility-links` | Contextual Lucide icons render at 20px with consistent 17px destination arrows; labels retain full usable width. |
| `Icon04` | Rendered page and expanded share controls | `.share-tools`, `.share-actions` | Chevron, share, copy, and CTA arrows use the same local icon system; all sprite references render nonblank and controls retain text or accessible labels. |

## Booking Switchboard Anchor Map

| ID | Source and viewport | Region / selector | Verified result |
| --- | --- | --- | --- |
| `Booking01` | `/tmp/gm-links-switchboard-qa/mobile-before.png`, 390x844; `desktop-before.png`, 1366x900 | First conversion card, `[data-featured-event]` | Goldspire is the earliest future verified event before its start; sold-out status and Mox waitlist action are clear and unwrapped. |
| `Rotate01` | `/tmp/gm-links-switchboard-qa/mobile-after.png`, 390x844; `desktop-after.png`, 1366x900 | Featured card and `[data-also-booking]` | At 10:31 AM on July 25, the featured card automatically becomes `Stargate PHX: Groundbreaking`; the secondary band advances to `Watershed`. |
| `Lead01` | Both before/after screenshots | `.lead-capture` | Copy is game-agnostic, the email-only action is clear, and `See all public events` remains a quiet secondary route. Mocked EmailJS success returned the intended confirmation. |
| `Share01` | `/tmp/gm-links-switchboard-qa/mobile-share.png`, 390x844 | `.share-tools` | Summary reads `Share`; disclosure opens without layout shift or overflow; both QR images load at their natural 230px size. |
| `Responsive01` | 390x844, 430x932, 1024x768, 1366x900, 1440x900 | Full page | No horizontal overflow; primary CTA remains 48px high with `white-space: nowrap`; header remains 73px high. |

## Visual Anchor Map

| ID | Source and viewport | Region / selector | Verified result |
| --- | --- | --- | --- |
| `Nav01` | All primary routes, 390x844 and 1366x900 | Top 0-13%, `.site-header .nav` | Brand remains visible; mobile links scroll horizontally; active state is clear; visible nav targets are at least 44px high. |
| `Home01` | `/gm/`, both viewports | First viewport, `.website-hero` | Offer, audience, public-game action, private-table action, portrait, and trust stats read in a clear order with no overlap. |
| `Events01` | `/gm/events/`, both viewports | Hero and `.events-card-grid` | Beginner promise is immediate; Goldspire and Stargate compare side by side on desktop and stack cleanly on mobile. |
| `Games01` | `/gm/projects.html`, both viewports | Hero and first portfolio band | Page purpose is concise; category labels scan cleanly; campaign work remains the visual focus. |
| `Links01` | `/gm/links.html`, both viewports | Booking-switchboard first viewport | Next verified event, booking/waitlist action, and game-agnostic reminder path scan in a clear order without horizontal overflow. |
| `Goldspire01` | `/gm/events/goldspire/`, both viewports | Campaign hero | Transparent party art remains intact; facts stay readable; no character/text collision; AVIF/WebP delivery is active. |
| `Stargate01` | `/gm/events/stargate-phx/`, both viewports | Campaign hero | Campaign identity remains distinct; premise, beginner reassurance, and booking action fit without overlap. |
| `Utility01` | Daggerheart, Stargate resources, and 404, both viewports | First viewport and recovery actions | Resource pages retain clear return/booking paths; 404 provides concise recovery without a dead end. |

Rendered evidence was captured under `/tmp/pro-gm-overhaul-final/` during the
local audit. Baseline and intermediate evidence remains under
`/tmp/pro-gm-overhaul-before/` and `/tmp/pro-gm-overhaul-after-1/` for this run.

## Automated Checks

- Audited 23 sitemap/recovery routes and 43 internal links.
- Confirmed one `h1`, one `main`, a skip link, and a footer on audited routes.
- Found no broken local links, broken images, duplicate IDs, horizontal page
  overflow, unlabeled controls, or malformed JSON-LD after remediation.
- Rechecked ten primary routes at 390x844: no visible undersized navigation
  targets, broken first-viewport images, or page overflow.
- Rechecked primary routes at 1366x900 and captured 20 final screenshots total.
- `node --check` passed for shared and campaign JavaScript.
- `git diff --check` passed.
- Visitor-facing copy sweep found no production-status language in primary public
  routes; `EmailJS` appears only in the implementation script URL/API code.
- Axe found no WCAG A/AA violations on the booking switchboard.
- Axe found no WCAG A/AA violations after restoring the local Lucide icon set.
- All 24 external SVG sprite references rendered with nonzero geometry; no icon
  request failed and no console error or warning was emitted.
- Simulated pre-start and post-start states confirmed chronological event
  rotation uses `scripts/public-events.js`, not hardcoded page copy.

## Performance Evidence

- Goldspire event art: 2.81 MB PNG fallback -> 162 KB AVIF delivery asset.
- Goldspire wide background: 1.89 MB PNG fallback -> 184 KB AVIF delivery asset.
- Transparent party art: 2.19 MB PNG fallback -> 323 KB WebP delivery asset.
- Browser resource inspection confirmed AVIF for the event card/background and
  WebP for the transparent party image.

## External Handoffs

The Goldspire listing, Stargate PHX listing, and Mox Chandler venue page all
returned HTTP `200` on 2026-07-22. Their continued availability remains outside
this static site's control.

## Residual Risk / Backlog

- Third-party TikTok embeds can emit provider-side console warnings; the page
  retains direct links when embeds are unavailable.
- A production Lighthouse/axe benchmark remains a follow-up measurement, not a
  blocker; local semantic, contrast, interaction, and responsive checks passed.
- Additional legacy portfolio evidence images can be converted only where live
  performance data shows a meaningful benefit.
