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
- `events/goldspire/goldspire.js`: one config object for event facts and CTA target.
- `events/goldspire/assets/`: page-local copies of approved public Goldspire art, icons, character cutouts, locations, and poster elements.
- `events/goldspire/assets/player-pdfs/`: optional player-facing PDF packets for the intended Goldspire couriers.
- `events/goldspire/docs/`: maintenance notes, source manifest, and QA record.

## Future Update Path

Current temporary CTA label: `Registration has not started yet`.

When the event listing goes live, update two values in `goldspire.js`:

```js
event_signup_url: "https://real-event-listing-url.example"
cta_text: "Claim a Seat"
```

Also mirror the visible CTA label in `resources/daggerheart.html` back to `Claim a Seat` unless the event listing platform requires different wording.
