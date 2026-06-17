# BUG-04 — No custom 404 page (broken links hit the generic GitHub Pages error)

**Severity:** Medium · UXHC: H09 sev 2 (recover from errors)
**Status:** Complete · **Type:** Error recovery / brand

---

## Bug Report Checklist
**Before you start**
- [x] Searched existing issues to confirm it's not a duplicate

**Required fields**
- [x] Clear, specific title
- [x] Concise bug description
- [x] URL where the issue occurs
- [x] Full step-by-step reproduction steps
- [x] Expected behavior stated
- [x] Device type selected
- [x] Operating system selected

**Environment details**
- [x] Browser(s) selected
- [x] Browser version(s) included

**Helpful additions**
- [x] Screenshots or video attached (text-captured; see Actual behavior)
- [x] Relevant feature flags noted (none)
- [x] Additional context added

**Before submitting**
- [x] Reviewed contributing guidelines, security policy, and code of conduct (N/A — internal audit)

---

## Description
The site has **no custom `404.html`**. Any mistyped, stale, or shared-deep link that 404s renders the **generic "Page not found · GitHub Pages"** screen — off-brand, with no links home or to the event, and a console error. Confirmed: `test -f 404.html` → NO.

## URL (repro example)
`https://jonathankhobson.github.io/gm/events/goldspire/does-not-exist-xyz`

## Steps to reproduce
1. Navigate to any non-existent path under the site.
2. Observe the page title "Page not found · GitHub Pages" and a default GitHub error page (1 console error logged).

## Expected behavior
A branded `404.html` in the site's voice with clear links home and to the Goldspire event, so a lost or stale-link visitor recovers instead of bouncing.

## Actual behavior
Generic GitHub Pages 404; dead end; no recovery path; not on-brand.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled (2026-06)

## Screenshots
- Not applicable (default GitHub error page). Reproducible via the URL above.

## Additional context
GitHub Pages automatically serves `/404.html` if present. This is a quick, high-polish win and an opportunity for an on-voice joke (e.g., "This route did not pass inspection.").

## Applied fix
- Added root-level `404.html` with on-brand tone, lightweight styling, and direct recovery links.
- Added links to Home, Goldspire event, and Daggerheart resources.

## Verification
- [x] Bad URL renders the branded 404
- [x] Home and Goldspire event links work
- [x] Daggerheart resource recovery link works
