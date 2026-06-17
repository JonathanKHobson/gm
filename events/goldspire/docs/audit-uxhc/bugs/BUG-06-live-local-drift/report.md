# BUG-06 — Live site copy differs from the local working copy (version drift)

**Severity:** Medium (process / deploy hygiene) · UXHC: not a heuristic finding; release-quality risk
**Status:** Complete · **Type:** Content drift / source-of-truth

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
The **live** hero copy differs from the **local working copy** of `events/goldspire/index.html` (which shows as modified/uncommitted in git). Two diverging sources of truth for the headline message is a release-hygiene risk: edits can be lost, or stale copy can ship.

## Evidence (live vs local)
| Element | Live (rendered) | Local working copy |
|---|---|---|
| Hook | "A simple delivery. A suspicious crate. One night of cinematic fantasy chaos." | "Learn Daggerheart in one night with a funny, cinematic fantasy delivery that goes wildly off-script." |
| Lede | "No tabletop experience needed… management insists the crate is completely normal." | "No tabletop or Daggerheart experience needed. Heroes provided, rules taught as you play, and acting voices are entirely optional." |
| Strip | "Corporate Notice: no experience needed" | "Corporate Notice: no Daggerheart experience needed" |

> Note the irony relevant to [BUG-09](../BUG-09-dropped-daggerheart-reassurance/report.md): the **local** copy actually contains the stronger "no Daggerheart experience needed" line that the **live** copy dropped.

## URL
`https://jonathankhobson.github.io/gm/events/goldspire/` vs local `events/goldspire/index.html`

## Steps to reproduce
1. View the live hero copy.
2. Open the local `index.html` hero section.
3. Compare the hook/lede/strip text — they differ.
4. `git status` shows `index.html` modified (uncommitted).

## Expected behavior
One canonical source. Local edits committed and deployed, or intentionally reverted — not left diverging from production.

## Actual behavior
Live and local disagree on the headline message; uncommitted local changes exist.

## Environment
- **Device type:** Desktop (content-level issue, platform-independent)
- **Operating system:** macOS (repo on KyleSSD)
- **Browser(s):** Chromium (Playwright) for live capture
- **Browser version:** current bundled (2026-06)

## Additional context
The live copy is, on balance, the stronger/punchier of the two — *except* it dropped the explicit Daggerheart reassurance. Best of both: take the live hook + restore the local's "no tabletop or Daggerheart experience needed" line.

## Applied fix
- Canonicalized hero and supporting copy in `events/goldspire/index.html` to:
  - hook with cinematic one-shot language,
  - explicit "No tabletop or Daggerheart experience needed",
  - consistent strip/reassurance text.
- Confirmed local source and deployed output references now match the same canonical phrase set.
- Updated this same reassurance language in meta descriptions and FAQ anchors for one-source behavior.

## Verification
- [x] Canonical copy defined and implemented consistently in index copy + metadata
- [x] `index.html` and related meta text use the same source-of-truth phrasing
