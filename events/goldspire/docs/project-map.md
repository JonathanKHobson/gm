---
project: goldspire-landing-page
type: project-map
status: active
---

# Goldspire Landing Page Project Map

## Public Routes

- `events/goldspire/index.html`: player-facing landing page for Peril to Profit: The Goldspire Messengers.
- `events/goldspire/coming-soon/index.html`: temporary target for the Claim a Seat CTA until the real event listing URL is available.
- `resources/daggerheart.html`: optional official Daggerheart resources page.

## Local Page Files

- `events/goldspire/goldspire.css`: page-specific layout, visual rhythm, mobile behavior, and asset placement.
- `events/goldspire/goldspire.js`: one config object for event facts and CTA target.
- `events/goldspire/assets/`: page-local copies of approved public Goldspire art, icons, character cutouts, locations, and poster elements.
- `events/goldspire/docs/`: maintenance notes, source manifest, and QA record.

## Future Update Path

When the event listing goes live, update one value in `goldspire.js`:

```js
event_signup_url: "https://real-event-listing-url.example"
```

Do not change CTA copy unless the event listing platform requires different wording.
