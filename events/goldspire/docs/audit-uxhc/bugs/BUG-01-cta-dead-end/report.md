# BUG-01 — registration CTA dead-end resolved by live Mox listing

**Severity:** Critical (conversion-blocking) · UXHC: H13 sev 3 (top finding), H07/H01/H09 sev 2
**Status:** Complete · **Type:** Conversion / external listing dependency

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

## Original description
The single most important action on the site — **"Claim a Seat"** (rendered 4× on the event page plus nav and footer) — links to `coming-soon/`, an interstitial reading *"Almost posted… the registration listing is being finalized."* It offers only **Back to event page** and **Ask Kyle a question**. There is **no registration, no email/waitlist capture, no calendar hold**. A visitor at peak intent cannot complete or defer the action and leaves with nothing captured.

## Resolution — 2026-06-17
The official Mox event listing is live. The shared registration config now uses `registration_state: "live"`, label `Book now at Mox`, and `live_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5"`. Goldspire event CTAs and the Daggerheart resource CTAs use `[data-event-cta]` and resolve to the live listing. The old modal-only `data-registration-coming-soon` path has been removed.

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
Resolved. The primary CTA now opens the official Mox listing where the visitor can book the event.

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** macOS (Darwin 25.3.0); behavior is platform-independent (static HTML)
- **Browser(s):** Chromium via Playwright MCP
- **Browser version:** Playwright-bundled Chromium (current channel, 2026-06)

## Screenshots
- `../../screenshots/coming-soon-desktop.png` (destination)
- `../../screenshots/goldspire-desktop-hero.png` (CTA origin)

## Relevant flags / config
- Current implementation: `goldspire-registration.js` owns `registration_state`, pending/live labels, and pending/live URLs. All `[data-event-cta]` links are rewritten from this shared state.

## Additional context
For an event sold on scarcity ("5 seats only"), losing peak-intent visitors with zero capture is the highest-cost issue in the audit. Highest-intent personas (Critical Role Curious, Mox Regular) are hurt most.

## Proposed fix
1. **Now:** add a waitlist/notify email capture on `coming-soon/` (embedded form or `mailto:`), plus an "add to calendar" `.ics` hold-the-date. Change the CTA label to **"Get the seat alert" / "Hold my seat."**
2. **When listing is live:** set `registration_state` to `live` and set `live_url` to the registration URL; the shared live label is `Book now at Mox`.
3. Copy provided in [`06-copy-rewrites/03-cta-and-coming-soon.md`](../../06-copy-rewrites/03-cta-and-coming-soon.md).

## Execution decision — 2026-06-17
- The live listing URL is now available and verified.
- Visible CTA text is `Book now at Mox`.
- `goldspire-registration.js` remains the shared pending/live switch point for the event page and Daggerheart resources page.
- `events/goldspire/coming-soon/` remains out of `sitemap.xml` and preserves `noindex, nofollow` as a stale-link fallback.
- The direct `/checkout` URL is documented in config, but current verification shows it redirects back to the event listing.

## Verification
- [x] Real listing URL available
- [x] CTA text reflects current registration state
- [x] CTA URL remains in the shared registration config
- [x] Coming-soon route excluded from sitemap
- [x] Coming-soon route marked `noindex, nofollow`
