# BUG-09 — Live hero dropped the explicit "no Daggerheart experience needed" line

**Severity:** Medium · UXHC: H07 sev 1 (expert/system-tourist fit), H14 sev 1
**Status:** Complete · **Type:** Copy / conversion

![Hero lede on live](../../screenshots/goldspire-desktop-hero.png)

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
On the **live** page, the hero lede reads *"No tabletop experience needed…"* and the gold strip reads *"Corporate Notice: no experience needed."* Both **dropped the explicit "Daggerheart"** qualifier. The phrase **"no Daggerheart experience needed"** is the specific reassurance the Daggerheart First-Timer / Daggerheart Tourist / Critical Role Curious convert on — they already play other systems and need to know *this system* is no barrier. It currently appears only lower in the body and in the FAQ.

## URL
`https://jonathankhobson.github.io/gm/events/goldspire/`

## Steps to reproduce
1. View the hero lede and the gold "Corporate Notice" strip on the live page.
2. Look above the fold for the exact phrase "no Daggerheart experience needed."
3. Observe it's absent above the fold (present only further down / FAQ).

## Expected behavior
The explicit "no Daggerheart experience needed" reassurance appears above the fold, where system-curious players decide.

## Actual behavior
Only "no tabletop experience needed" is above the fold; the system-specific reassurance is buried. Two usability personas (P2, P3) flagged this; the focus group ranked it Priority 4.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled (2026-06)

## Screenshots
- `../../screenshots/goldspire-desktop-hero.png`

## Additional context
The **local** working copy still contains this line ("No tabletop or Daggerheart experience needed"), so this likely regressed in a copy edit — see version drift [BUG-06](../BUG-06-live-local-drift/report.md).

## Applied fix
- Restored explicit language in hero lede and strip:
  - *"No tabletop or Daggerheart experience needed."*
- Kept reinforcement in `FAQ`, logistics and CTA blocks for system-curve entry points.

## Verification
- [x] Phrase "no Daggerheart experience needed" present above the fold
- [x] Strip reinforced with Daggerheart-specific reassurance
- [x] Canonical copy references the same line in SEO and landing text
