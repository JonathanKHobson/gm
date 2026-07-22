---
project: pro-gm-website
type: project-map
status: active
updated: 2026-07-22
---

# Pro GM Website Project Map

## Canonical Publish Checkout

The authoritative GitHub Pages checkout is:

`/Volumes/KyleSSD/Documents/My Projects/Websites/gm`

It publishes to `https://jonathankhobson.github.io/gm/` from the
`JonathanKHobson/gm` repository. Make public-site edits here.

`/Volumes/KyleSSD/Documents/My Work/Pro GM` is the source-material and older
portfolio workspace. It contains campaign packets, evidence, visual sources,
and archived implementations, but it is not the canonical publish checkout.
Do not mirror or overwrite the live site from that folder.

## Route Families

| Family | Source | Purpose |
| --- | --- | --- |
| Portfolio home | `index.html` | Primary credibility, public games, and private booking funnel |
| About | `about.html` | GM profile, table philosophy, and trust |
| Games | `projects.html`, `games/*.html` | Campaign portfolio and individual case studies |
| Public events | `events/index.html` | Current event chooser |
| Goldspire | `events/goldspire/` | Daggerheart event, dates, and characters |
| Stargate PHX | `events/stargate-phx/` | Episodic event, dates, and characters |
| Player resources | `resources/` | Beginner-facing rules and prep support |
| Link card | `links.html` | Compact social/profile navigation |
| Recovery | `404.html` | Branded route recovery |

## Shared Ownership

- `styles/tokens.css`: color, type, spacing, radius, and shadow tokens.
- `styles/base.css`: reset, typography, shell, shared navigation, and forms.
- `styles/components.css`: reusable buttons, cards, bands, and page components.
- `styles/responsive.css`: shared breakpoints and mobile/desktop adaptations.
- `scripts/main.js`: shared interactions and contact form behavior.
- Campaign folders own only their campaign-specific HTML, CSS, JS, and assets.

## Event Configuration

- Goldspire registration and date state: `events/goldspire/goldspire.js`.
- Stargate PHX registration and date state: `events/stargate-phx/stargate-phx.js`.
- Venue listings remain external Mox pages; this repository does not implement
  event registration or checkout.

## Safe Change Sequence

1. Confirm the edit is in this canonical checkout.
2. Preserve unrelated local changes and campaign-specific visual identity.
3. Update shared styles only when the behavior should apply site-wide.
4. Render-check affected routes at mobile and desktop sizes.
5. Run route, link, overflow, image, and accessibility checks.
6. Commit, push to `origin/main`, and verify the live Pages routes.
