---
project: stargate-phx-event-page
type: implementation-notes
status: active
updated: 2026-07-16
---

# Implementation notes

- Static GitHub Pages under `/gm/`; no SPA, CMS, database, or competing event
  registration system.
- Public routes use semantic HTML, route-local CSS, minimal JavaScript, and one
  central registration/session configuration.
- Generated visuals live only under `assets/events/stargate-phx/`; downloadable
  player PDFs remain route-local.
- Image masters and responsive derivatives are produced before route layout so
  aspect ratios, text-safe zones, and cold-load budgets are known.
- Private source screenshots and visual references are never copied into this
  repository.
- Goldspire provides architecture and QA precedent only; Stargate PHX receives
  its own mission-briefing composition and must not inherit the fantasy skin.
- Prompt 13 selected `Phoenix Threshold`: an asymmetric graphite briefing field
  meeting canon-grounded gate art, balanced by warm stone/paper content bands.
  Headings use the existing Space Grotesk/Inter family; Fraunces is reserved for
  approved player reflections.
- Hero copy and media separate on mobile. Character art always uses
  `object-fit: contain`; no head, hand, foot, staff, helmet, notebook, tablet,
  or satchel may be cropped. A01 is the only verified text-safe scene and still
  receives a solid local backing.
- Registration state is never communicated by color alone. Every instance
  carries the configuration-derived label, explanation, and action.
- Prompt 14 owns the family base layer in `stargate-phx.css`; later routes may
  add route-local CSS but must reuse its tokens, focus rules, section rhythm,
  buttons, disclosures, and mobile conventions.
- The landing page now routes directly to the verified rules, character,
  dates, and pending-status destinations.
- The pending-state CTA is `Dates coming soon`; the fuller
  `Dates and registration coming soon` message remains visible in status copy.
  Scheduled, live, and sold-out labels and targets are controlled by
  `stargate-registration.js`.
- The rules route imports the Stargate family CSS and adds only its operational
  field-guide layout in `resources/stargate-phx.css`. The contents rail is
  sticky at 1366px but ordinary inline navigation below 1100px. Its 5e table
  becomes labeled blocks below 700px rather than an overflowing scroll table.
- The rules route does not expose the internal rules index or source notes. Its
  preparation section links directly to the verified character guide and
  combined seven-character PDF while preserving the no-homework promise.
- The character route uses one semantic profile per verified pregen in Prompt
  08 manifest order. Desktop alternates figure/copy columns; mobile always
  restores name and role, complete figure, profile copy, then PDF action.
- Character media wells have stable 2:3 geometry and every figure uses
  `object-fit: contain` with bottom alignment. The first two assets load eagerly;
  later profiles are lazy, but sequential cold-cache checks confirmed that all
  seven become nonblank before inspection.
- Public character PDFs are byte-for-byte copies of the QA-approved Prompt 08
  outputs. Do not replace them from the owned source files without rebuilding
  and re-running the PDF manifest checks.
- `stargate-registration.js` owns all session records and their public fields.
  The dates page contains an empty semantic host only; setting `sessions` and
  changing `state` renders scheduled, live, or sold-out rows without HTML edits.
- `registrationFlow: "per_session"` supports distinct Mox URLs. Set
  `registrationFlow: "shared_listing"`, provide `defaultRegistrationUrl`, and
  update `registrationFlowNote` when one Mox listing contains its own date
  selector.
- Pending CTAs resolve to `coming-soon/`; scheduled, live, and sold-out CTAs
  resolve to `dates/` unless a verified default live registration URL is set.
  The coming-soon route intentionally has no self-referential registration CTA.
- `coming-soon/` is `noindex,nofollow` and must never enter the sitemap. It
  remains a meaningful status page with facts, event, rules, heroes, dates, and
  question paths.
- Shared Pro GM discovery is deliberately date-neutral. The events index,
  links page, 404 recovery page, and Echoes portfolio route point visitors into
  the event family while the central Stargate configuration remains the only
  authority for current registration status.
- Shared light-paper secondary actions use `btn-secondary-paper`; shared
  buttons, nav CTAs, and link-directory actions keep a 44px minimum target.
- Final conformance fixes give shared nav links a 44px minimum target, make the
  Echoes recap summary fully tappable, make the landing consent label a 44px
  target, and use valid labeled-group semantics on shared page clusters.
- Avoid neon cyberpunk, dark-blue dashboard tiles, classified-dossier clichés,
  logo/glyph wallpaper, glass panels, decorative blobs, and card grids as a
  default section pattern.
