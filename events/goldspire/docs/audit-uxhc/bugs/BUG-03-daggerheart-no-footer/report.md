# BUG-03 — Daggerheart resource page dead-ends (no footer, no closing CTA)

**Severity:** Medium · UXHC: H03 sev 2 (exits), H01 sev 1 (standard elements)
**Status:** Complete · **Type:** Navigation / conversion

![Daggerheart page ends with no footer/CTA](../../screenshots/daggerheart-desktop-full.png)

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
- [x] Screenshots or video attached
- [x] Relevant feature flags noted (none)
- [x] Additional context added

**Before submitting**
- [x] Reviewed contributing guidelines, security policy, and code of conduct (N/A — internal audit)

---

## Description
The Daggerheart resources page has **no `<footer>` and no closing call to action**. After reading the basics, the page ends on the "Official links" section ("Go deeper only if it sounds fun") and simply stops. There is no path back to the event and no "Claim a Seat." Confirmed in code (`document.querySelector('footer')` → null) and in the full-page capture.

## URL
`https://jonathankhobson.github.io/gm/resources/daggerheart.html`

## Steps to reproduce
1. Open the resource page (or follow "Read Daggerheart basics" from the event page).
2. Scroll to the bottom.
3. Look for a footer / next action.
4. Observe: page ends with the official-links list; no footer, no CTA. (Only a breadcrumb at the very top links back.)

## Expected behavior
The page should end with a footer (consistent with the event page) and a closing CTA returning the warmed-up reader to the event / registration.

## Actual behavior
Dead-end. The reassurance detour does not loop back into the funnel.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled (2026-06)

## Screenshots
- `../../screenshots/daggerheart-desktop-full.png`
- `../../screenshots/daggerheart-mobile-full.png`

## Additional context
This page is a reassurance step *inside* the conversion funnel (Daggerheart Tourist, Critical Role Curious land here). Stranding them wastes the warm-up. Also missing: Twitter-card meta (OG only) — see [Code QA C4](../../04-code-qa/code-qa-report.md).

## Applied fix
- Added shared site footer to the resource page.
- Added closing CTA band before the footer with:
  - `Back to Goldspire event`
  - `Claim a Seat`
  - `View GM portfolio`
- Added Twitter-card meta tags to match OG metadata.
- Moved embedded styles from inline `<style>` to dedicated `resources/daggerheart.css`.

## Verification
- [x] Footer present and consistent with site pattern
- [x] CTA loop back into event conversion path
- [x] Social preview parity (OG + Twitter tags)
