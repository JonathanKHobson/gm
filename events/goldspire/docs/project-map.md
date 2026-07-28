---
project: goldspire-landing-page
type: project-map
status: active
---

# Goldspire Landing Page Project Map

## Public Routes

- `events/goldspire/index.html`: player-facing landing page for Peril to Profit: The Goldspire Messengers.
- `events/goldspire/characters/index.html`: optional player-facing courier guide with plain-language character profiles, PDF links, and sheet-reading help.
- `events/goldspire/dates/index.html`: lean date-options route for confirmed Goldspire tables; currently lists the August 4 Tier 1 table plus the August 25 and September 12 Tier 2 tables.
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

The `/checkout` URL is retained as an optional future switch, but current verification shows it redirects back to the event listing. The Goldspire and Daggerheart resource CTAs use the same script. Tier 1 CTAs target `https://events.moxboardinghouse.com/p/n/xnP6r62v/v5`; Tier 2 CTAs target `https://events.moxboardinghouse.com/p/n/zdRmLjPV/v5`. The Tier 2 listing offers August 25 and September 12. If future dates receive additional listing URLs, keep each tier/adventure explicit on the date-options route instead of silently repointing every Goldspire CTA.
