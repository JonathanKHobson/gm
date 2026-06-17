---
project: goldspire-landing-page
type: project-map
status: active
---

# Goldspire Landing Page Project Map

## Public Routes

- `events/goldspire/index.html`: player-facing landing page for Peril to Profit: The Goldspire Messengers.
- `events/goldspire/coming-soon/index.html`: temporary target for the registration CTA until the real event listing URL is available.
- `resources/daggerheart.html`: optional official Daggerheart resources page.

## Local Page Files

- `events/goldspire/goldspire.css`: page-specific layout, visual rhythm, mobile behavior, and asset placement.
- `events/goldspire/goldspire-registration.js`: shared registration state, pending/live labels, and pending/live CTA targets.
- `events/goldspire/goldspire.js`: page behavior for nav scroll state and reveal animation.
- `events/goldspire/assets/`: page-local copies of approved public Goldspire art, icons, character cutouts, locations, and poster elements.
- `events/goldspire/assets/player-pdfs/`: optional player-facing PDF packets for the intended Goldspire couriers.
- `events/goldspire/docs/`: maintenance notes, source manifest, and QA record.

## Future Update Path

Current temporary CTA label: `Registration coming soon`.

When the event listing goes live, update these values in `goldspire-registration.js`:

```js
registration_state: "live"
live_url: "https://real-event-listing-url.example"
```

The live label is already set to `Claim a Seat` in the shared registration config. The Daggerheart resource CTAs use the same script, so no HTML copy hunt should be needed for cutover.
