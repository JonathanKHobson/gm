# BUG-07 — "Seats: 5 seats" redundancy + nav label inconsistency across pages

**Severity:** Low · UXHC: H01 sev 1, H04 sev 1
**Status:** Complete · **Type:** Microcopy / consistency

![Fact grid + nav](../../screenshots/goldspire-desktop-hero.png)

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
Two small consistency issues:
1. **Redundant fact value:** the quick-fact tile labeled **Seats** shows the value **"5 seats"** — the label is repeated in the value.
2. **Nav inconsistency across pages:** the event page nav is *New players / Characters / FAQ / Daggerheart / Portfolio / Claim a Seat*; the Daggerheart page nav is *Games / About / Goldspire Event / Get in touch*. Different link sets and different labels for similar destinations ("Portfolio" vs "About", "Get in touch" vs "Contact").

## URL(s)
- `https://jonathankhobson.github.io/gm/events/goldspire/` (fact tile + event nav)
- `https://jonathankhobson.github.io/gm/resources/daggerheart.html` (resource nav)

## Steps to reproduce
1. View the hero fact grid → "Seats / 5 seats."
2. Compare the header nav on the event page vs the Daggerheart page.

## Expected behavior
- Fact value reads "5" (label already says Seats).
- A single, consistent global nav across pages (or at least consistent labels for the same destinations).

## Actual behavior
Label/value redundancy; two different navs.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled (2026-06)

## Screenshots
- `../../screenshots/goldspire-desktop-hero.png`
- `../../screenshots/daggerheart-desktop-full.png`

## Applied fix
- Fact tile value changed to `"5"` to remove label/value redundancy.
- Daggerheart page nav labels aligned with Goldspire funnel labels:
  - `New players`
  - `Characters`
  - `FAQ`
  - `Daggerheart`
  - `Portfolio`

## Verification
- [x] Fact tile reads `5`
- [x] Nav labels are consistent across core pages
