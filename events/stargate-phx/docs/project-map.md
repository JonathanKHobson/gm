---
project: stargate-phx-event-page
type: project-map
status: active
updated: 2026-07-16
---

# Stargate PHX public site project map

## Public routes

- `events/stargate-phx/index.html`: primary event landing page.
- `resources/stargate-phx.html`: optional player rules and resources.
- `events/stargate-phx/characters/index.html`: pregenerated-character guide.
- `events/stargate-phx/dates/index.html`: dates/session picker.
- `events/stargate-phx/coming-soon/index.html`: noindex registration fallback.

## Shared configuration and route files

- `events/stargate-phx/stargate-phx.css`: event-family layout and visual system.
- `events/stargate-phx/stargate-phx.js`: minimal progressive enhancement.
- `events/stargate-phx/stargate-registration.js`: single registration/session
  source for pending, scheduled, live, and sold-out states.
- `resources/stargate-phx.css`: resource-route additions.
- `events/stargate-phx/characters/characters.css`: character-guide additions.

## Asset ownership

- `assets/events/stargate-phx/`: canonical generated public visuals, responsive
  derivatives, social image, display crop, and UI accents.
- `events/stargate-phx/assets/player-pdfs/`: public individual and combined
  character packets.
- `events/stargate-phx/docs/`: project map, implementation notes, source/asset
  provenance, and QA evidence.
- `.gitattributes`: marks the route-local player PDFs as binary so repository
  review does not treat approved packet bytes as text.

## Integrated shared surfaces

- `events/index.html`
- `links.html`
- `sitemap.xml`
- `404.html`
- `games/echoes-of-stargate.html`
- `styles/components.css` and `styles/responsive.css` for shared CTA contrast
  and minimum touch-target corrections

Prompts 11–18 are complete. The Phoenix Threshold event family, registration
engine, rules route, seven-profile character guide, eight-file PDF package,
dates/session route, noindex pending route, and shared Pro GM discovery surfaces
are built and locally verified. Prompt 19 owns integrated QA, publication, and
live verification.
