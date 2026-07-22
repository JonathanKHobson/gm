---
project: pro-gm-website
type: qa-results
status: passed
updated: 2026-07-22
---

# Pro GM Site QA Results

## Result

The July 2026 experience upgrade passed local route, link, responsive, image,
structured-data, syntax, and visual checks before publication.

## Visual Anchor Map

| ID | Source and viewport | Region / selector | Verified result |
| --- | --- | --- | --- |
| `Nav01` | All primary routes, 390x844 and 1366x900 | Top 0-13%, `.site-header .nav` | Brand remains visible; mobile links scroll horizontally; active state is clear; visible nav targets are at least 44px high. |
| `Home01` | `/gm/`, both viewports | First viewport, `.website-hero` | Offer, audience, public-game action, private-table action, portrait, and trust stats read in a clear order with no overlap. |
| `Events01` | `/gm/events/`, both viewports | Hero and `.events-card-grid` | Beginner promise is immediate; Goldspire and Stargate compare side by side on desktop and stack cleanly on mobile. |
| `Games01` | `/gm/projects.html`, both viewports | Hero and first portfolio band | Page purpose is concise; category labels scan cleanly; campaign work remains the visual focus. |
| `Links01` | `/gm/links.html`, both viewports | Digital-card first viewport | Name, portrait, core actions, and fast links fit without horizontal overflow; share field has an accessible name. |
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
