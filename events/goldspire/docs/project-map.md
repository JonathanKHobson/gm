---
project: goldspire-landing-page
type: project-map
status: active
---

# Goldspire Landing Page Project Map

## Public Routes

- `events/goldspire/index.html`: player-facing landing page for Peril to Profit: The Goldspire Messengers.
- `events/goldspire/characters/index.html`: optional player-facing courier guide with plain-language character profiles, PDF links, and sheet-reading help.
- `events/goldspire/dates/index.html`: lean date-options route for confirmed Goldspire tables; currently lists July 15 and July 25, both booking through the same Mox listing. More dates may be added later.
- `events/goldspire/coming-soon/index.html`: noindex fallback route for old registration-status links; it now points users to the live Mox listing.
- `resources/daggerheart.html`: optional official Daggerheart resources page.

## Local Page Files

- `events/goldspire/goldspire.css`: page-specific layout, visual rhythm, mobile behavior, and asset placement.
- `events/goldspire/goldspire-registration.js`: shared registration state, pending/live labels, and pending/live CTA targets.
- `events/goldspire/characters/characters.css`: lightweight route-specific CSS for the courier guide.
- `events/goldspire/goldspire.js`: page behavior for nav scroll state and reveal animation.
- `events/goldspire/assets/`: page-local copies of approved public Goldspire art, icons, character cutouts, locations, and poster elements.
- `events/goldspire/assets/player-pdfs/`: optional player-facing PDF packets for the intended Goldspire couriers.
- `assets/events/goldspire/pc-social/`: public character poster cards used by the courier guide.
- `assets/events/goldspire/npcs/`: public story-world character accents used by Goldspire event pages.
- `assets/events/goldspire/marketing/`: public Goldspire marketing CTA images, including the wide Mox booking/QR poster.
- `events/goldspire/docs/`: maintenance notes, source manifest, and QA record.

## Registration CTA

Current live CTA label: `Book now at Mox`.

Current live target in `goldspire-registration.js`:

```js
registration_state: "live"
booking_mode: "single"
single_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5"
multi_url: "dates/"
checkout_url: "https://events.moxboardinghouse.com/p/n/xnP6r62v/v5/checkout"
```

The `/checkout` URL is retained as an optional future switch, but current verification shows it redirects back to the event listing. The Goldspire and Daggerheart resource CTAs use the same script. Mox uses one listing for the currently confirmed July 15 and July 25 table times, so the shared CTA remains `Book now at Mox`. If future dates receive separate Mox listing URLs, set `booking_mode: "multi"` so global CTAs read `View Times` and route to `events/goldspire/dates/`; each date card should then link to its own Mox listing.
