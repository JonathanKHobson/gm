# BUG-05 — No testimonials / social proof anywhere

**Severity:** Medium · UXHC: H04 sev 2 (third-party support / trust cues)
**Status:** Complete · **Type:** Trust / conversion (enhancement gap)

![Host credentials present, no testimonials](../../screenshots/goldspire-desktop-full.png)

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
The page establishes the host's credibility through self-stated credentials (15+ years, 200+ games run, 200+ players welcomed) but contains **no third-party social proof** — no player testimonials, quotes, reviews, or community signals. The trust-and-belonging personas convert on "are these my people," which a single short player quote answers better than any self-claim.

## URL
`https://jonathankhobson.github.io/gm/events/goldspire/`

## Steps to reproduce
1. Read the full event page.
2. Look for any quote/testimonial/review from a past player or third party.
3. Observe: none present (only self-stated host stats).

## Expected behavior
At least 2–3 short, attributed player testimonials near the host band or final CTA, to provide independent trust signal.

## Actual behavior
No social proof. The Connection Seeker and Reluctant Plus-One leave without the "real people" confirmation they need.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled (2026-06)

## Screenshots
- `../../screenshots/goldspire-desktop-full.png`

## Additional context
This is an enhancement gap rather than a defect, but it directly limits conversion for the highest-LTV (community-seeking) personas and was raised independently in the focus group (Priority 3).

## Applied fix
- Added a social-proof section before final CTA with three attributed player reflections from the Pro GM testimonial bank.
- Added compact proof media using player-made Peril to Profit art and a real past-table photo, framed as past GameMasterKyle/player-creativity evidence.
- Added "more sessions may follow?" reassurance in logistics and FAQ, with a `Book me` path to the existing EmailJS contact form on the portfolio root.

## Verification
- [x] Social proof block exists above final CTA
- [x] No public placeholder or pending-testimony copy is shown
- [x] Quote cards have light attribution
- [x] Proof images are local page assets and are listed in the source asset manifest
- [x] `Book me` links route to `../../index.html#contact`
