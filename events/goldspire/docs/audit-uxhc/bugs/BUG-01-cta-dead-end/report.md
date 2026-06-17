# BUG-01 — "Claim a Seat" dead-ends on a coming-soon page (no registration, no waitlist)

**Severity:** Critical (conversion-blocking) · UXHC: H13 sev 3 (top finding), H07/H01/H09 sev 2
**Status:** Deferred · **Type:** Conversion / external listing dependency

![Coming-soon dead-end](../../screenshots/coming-soon-desktop.png)

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
- [x] Reviewed contributing guidelines, security policy, and code of conduct (N/A — internal audit artifact)

---

## Description
The single most important action on the site — **"Claim a Seat"** (rendered 4× on the event page plus nav and footer) — links to `coming-soon/`, an interstitial reading *"Almost posted… the registration listing is being finalized."* It offers only **Back to event page** and **Ask Kyle a question**. There is **no registration, no email/waitlist capture, no calendar hold**. A visitor at peak intent cannot complete or defer the action and leaves with nothing captured.

## URL(s)
- Trigger: `https://jonathankhobson.github.io/gm/events/goldspire/` (any "Claim a Seat" button)
- Destination: `https://jonathankhobson.github.io/gm/events/goldspire/coming-soon/`

## Steps to reproduce
1. Open the event page.
2. Click any **Claim a Seat** button (hero, nav, sticky/secondary, or footer).
3. Land on `coming-soon/`.
4. Attempt to register or to be notified when seats open.

## Expected behavior
Clicking the primary CTA should let the user **complete the conversion** (open the registration listing) or, while the listing is pending, **capture intent** (email/waitlist "notify me," plus an optional "add to calendar"). The CTA label should match what the destination can deliver.

## Actual behavior
The destination cannot register the user and captures nothing. Only "ask Kyle a question" is offered, which mismatches the intent ("I have a yes, not a question"). 6 of 7 usability personas were blocked here.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** macOS (Darwin 25.3.0); behavior is platform-independent (static HTML)
- **Browser(s):** Chromium via Playwright MCP
- **Browser version:** Playwright-bundled Chromium (current channel, 2026-06)

## Screenshots
- `../../screenshots/coming-soon-desktop.png` (destination)
- `../../screenshots/goldspire-desktop-hero.png` (CTA origin)

## Relevant flags / config
- `goldspire.js` → `eventConfig.event_signup_url = "coming-soon/"` and `cta_text = "Claim a Seat"`. All `[data-event-cta]` links are rewritten from this single value.

## Additional context
For an event sold on scarcity ("5 seats only"), losing peak-intent visitors with zero capture is the highest-cost issue in the audit. Highest-intent personas (Critical Role Curious, Mox Regular) are hurt most.

## Proposed fix (not applied)
1. **Now:** add a waitlist/notify email capture on `coming-soon/` (embedded form or `mailto:`), plus an "add to calendar" `.ics` hold-the-date. Change the CTA label to **"Get the seat alert" / "Hold my seat."**
2. **When listing is live:** set `event_signup_url` to the registration URL; revert label to "Claim a Seat."
3. Copy provided in [`06-copy-rewrites/03-cta-and-coming-soon.md`](../../06-copy-rewrites/03-cta-and-coming-soon.md).

## Execution decision — 2026-06-17
- Owner decision: do not build a waitlist, event listing, signup capture, or larger coming-soon conversion system in this pass.
- Keep visible CTA text as `Claim a Seat`.
- Keep `event_signup_url: "coming-soon/"` as the single future switch point.
- Keep `events/goldspire/coming-soon/` out of `sitemap.xml` and preserve `noindex, nofollow`.
- Future cutover: replace only `event_signup_url` with the real listing URL, then verify all `[data-event-cta]` links.

## Verification
- [ ] Real listing URL available
- [x] CTA text remains `Claim a Seat`
- [x] CTA URL remains one config value in `goldspire.js`
- [x] Coming-soon route excluded from sitemap
- [x] Coming-soon route marked `noindex, nofollow`
