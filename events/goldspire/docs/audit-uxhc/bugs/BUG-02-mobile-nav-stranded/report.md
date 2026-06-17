# BUG-02 — Mobile header strands all navigation except the CTA

**Severity:** High · UXHC: H11 sev 2 (operability), H03 sev 2
**Status:** Complete · **Type:** Navigation / responsive / dead code

![Mobile header — only logo + Claim a Seat](../../screenshots/goldspire-mobile-hero.png)

---

## Bug Report Checklist
**Before you start**
- [x] Searched existing issues to confirm it's not a duplicate

**Required fields**
- [x] Clear, specific title
- [x] Concise bug description (what you did, what happened)
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
- [x] Relevant feature flags noted
- [x] Additional context added

**Before submitting**
- [x] Reviewed contributing guidelines, security policy, and code of conduct (N/A — internal audit)

---

## Description
At mobile widths (≤900px; verified at 390px) the Goldspire event header shows **only the logo and "Claim a Seat."** The five nav links (New players, Characters, FAQ, Daggerheart, Portfolio) are hidden, and the hamburger button is also hidden, so there is **no way to open them**. Header-based wayfinding is gone on mobile.

## Root cause (confirmed in code)
- `styles/responsive.css:111` → `.menu-btn { display: none; }` at `@media (max-width:900px)` (site-wide hamburger off).
- `events/goldspire/goldspire.css:1042` → `.goldspire-header .navlink { display: none; }` (hides the text links on the event page specifically).
- Net: the `#menuBtn` button + its ARIA + the toggle handler in `goldspire.js` are **dead code** — the button can never be visible to fire. The Daggerheart page, which lacks the override, renders its nav as a horizontal-scroll row and works fine on mobile (proof the pattern exists).

## URL
`https://jonathankhobson.github.io/gm/events/goldspire/` at ≤900px viewport.

## Steps to reproduce
1. Open the event page on a phone (or DevTools at 390×844).
2. Look at the header.
3. Try to reach FAQ or Characters from the header.
4. Observe: only logo + "Claim a Seat"; no links, no hamburger.

## Expected behavior
On mobile, users can reach the primary sections (FAQ, Characters, Daggerheart, Portfolio) from the header — via a working hamburger menu or a visible/scrollable nav row.

## Actual behavior
Only the CTA is reachable from the header; other destinations require scrolling and hunting through the body.

## Environment
- **Device type:** Mobile (also affects tablet ≤900px)
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled Chromium (2026-06); `getComputedStyle(.menu-btn).display === "none"`, visible nav links = ["Claim a Seat"]

## Screenshots
- `../../screenshots/goldspire-mobile-hero.png`

## Relevant flags / config
- CSS breakpoints listed above; no JS feature flag.

## Additional context
All 7 usability personas lost header wayfinding on mobile. The Total Newcomer specifically wanted a fast path to the FAQ for reassurance. Event-listing traffic skews mobile, raising impact.

## Applied fix
- Removed `.goldspire-header .navlink { display:none }` in `events/goldspire/goldspire.css` for mobile.
- Reused the global horizontal-scroll nav-row behavior already present in shared responsive styles.
- Removed dead menu-toggle JavaScript path from `events/goldspire/goldspire.js`.
- Confirmed nav links and CTA are directly visible in the mobile header.

## Verification
- [x] At 390px, FAQ + Characters + Daggerheart + Portfolio reachable from the header
- [x] No hamburger dead code path remains
- [x] No horizontal overflow introduced
- [x] Menu-toggle JS dead path removed
