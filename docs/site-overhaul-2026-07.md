---
project: pro-gm-website
type: implementation-notes
status: complete
updated: 2026-07-22
---

# July 2026 Site Experience Upgrade

## Objective

Improve the complete Pro GM public journey without flattening the distinct
Goldspire, Stargate PHX, and portfolio identities. The work focused on faster
comprehension, clearer paths to public and private games, stronger mobile
wayfinding, cleaner writing, and more consistent visual rhythm.

## Implemented

- Reworked shared mobile navigation into a compact, horizontally scrollable row.
- Added current-page navigation states and missing shared footers.
- Tightened homepage, events, games, about, links, resources, and recovery copy.
- Shortened oversized first folds while retaining the strongest approved art.
- Rebuilt the event chooser for direct comparison on desktop and clean stacking
  on mobile.
- Removed visitor-facing production language from portfolio case studies.
- Removed dead hamburger behavior and fixed the digital-card field label.
- Added AVIF delivery for the heaviest shared Goldspire forest imagery.
- Improved the 404 page with clear recovery routes instead of competing actions.

## Design Decisions

- The site remains lightweight static HTML, CSS, and JavaScript.
- Shared typography and navigation are consistent; campaign color and imagery
  remain intentionally distinct.
- Public-event booking remains on Mox. The site explains and routes; it does not
  duplicate registration.
- Progressive disclosure remains the default for rules, preparation, and FAQs.
- Existing proof is retained and presented as actual table/player work; generated
  mood art is not described as documentary proof.

## Backlog

- Convert additional large legacy portfolio evidence images to WebP/AVIF and add
  responsive `srcset`/`sizes` where a measured route still needs it.
- Run a production Lighthouse/axe benchmark after GitHub Pages deployment and
  tune only issues that reproduce on the live origin.
- Consider locally hosting the three shared font families if third-party font
  latency becomes measurable on repeat production tests.
