---
project: pro-gm-website
type: project-map
status: active
updated: 2026-09-08
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
| Soulspire's Secret | `events/soulspires-secret/` | October 17 Halloween Daggerheart horror event and Mox booking funnel |
| Stargate PHX | `events/stargate-phx/` | Episodic event, dates, and characters |
| Player resources | `resources/` | Beginner-facing rules and prep support |
| Booking switchboard | `links.html` | Next verified game, lead capture, event directory, contact, and share tools |
| Recovery | `404.html` | Branded route recovery |

## Shared Ownership

- `styles/tokens.css`: color, type, spacing, radius, and shadow tokens.
- `styles/base.css`: reset, typography, shell, shared navigation, and forms.
- `styles/components.css`: reusable buttons, cards, bands, and page components.
- `styles/responsive.css`: shared breakpoints and mobile/desktop adaptations.
- `scripts/main.js`: shared interactions and contact form behavior.
- `styles/links.css`: booking-switchboard presentation only.
- `scripts/links-page.js`: next-event rotation, game-agnostic reminder form,
  optional featured-event priority, distinct-listing secondary booking display,
  tentative-date display, and share controls for `links.html`.
- Campaign folders own only their campaign-specific HTML, CSS, JS, and assets.

## Event Configuration

- Site-wide next public event registry: `scripts/public-events.js`.
- `GameMasterKyle.publicEvents` contains verified bookable listings and drives
  the future-event CTAs on `links.html`. Events default to chronological order;
  optional `featurePriority` can promote one upcoming listing while earlier
  verified listings remain available as compact secondary actions. Multiple
  dates sharing one Mox source are grouped into one booking action.
- `GameMasterKyle.tentativeEvents` contains informational dates only and cannot
  become the featured booking CTA.
- Scheduled registry and known-listing watcher:
  `.github/workflows/public-event-watch.yml` and
  `tools/check-public-events.mjs`.
- Goldspire registration and date state: `events/goldspire/goldspire-registration.js`.
- Stargate PHX registration and date state: `events/stargate-phx/stargate-registration.js`.
- Venue listings remain external Mox pages; this repository does not implement
  event registration or checkout.

## Safe Change Sequence

1. Confirm the edit is in this canonical checkout.
2. Preserve unrelated local changes and campaign-specific visual identity.
3. Update shared styles only when the behavior should apply site-wide.
4. Render-check affected routes at mobile and desktop sizes.
5. Run route, link, overflow, image, and accessibility checks.
6. Commit, push to `origin/main`, and verify the live Pages routes.

## September 2026 shared shell

- `templates/site-header.tpl`, `site-footer.tpl`: one static site-level header and footer.
- `tools/render-site-shell.py`: explicit 28-page route set; run after shell changes, then `--check` to detect drift. It does not traverse the large Story Atlas or Stargate rules archive.
- `styles/site-shell.css`, `scripts/site-shell.js`: isolated navigation classes and native disclosure behavior; campaign-level links sit below the global header.
- `styles/home.css`: host introduction and first-game guide; the campaign pages retain their own artwork and accents.
- `resources/index.html`: player-resource chooser.
- `scripts/media.js`: user-initiated YouTube embeds with native external-link fallbacks.
- `assets/optimized/`: responsive derivatives of existing public images. Originals remain in their existing locations.

Current booking is derived from `scripts/public-events.js`; registration scripts remove expired booking actions at event start. Venue links own seat availability. Tentative records never become booking CTAs. Feedback redirects, EmailJS contract, campaign rules/app internals, and source resume are preserved.

The public case study remains separate from the live Story Atlas application. Campaign illustration is creative work, not documentary proof of table experience. Player testimonials require verified final wording and public display-name approval.

## Shared site orientation
The Kyle Hobson bar links this product to the portfolio, Compass Suite, AI Glossary, Workshop Studio, GameMasterKyle, and the Building with AI case study. The shared home is https://jonathankhobson.github.io/portfolio/spaces/. Each product retains its own local navigation. Shared navigation sources live in the portfolio-suite authoring project under `src/network/`; regenerate static copies with `scripts/sync_network.py` when destinations change.

## Theme-aware shared navigation (September 16)
Shared network tokens, destinations and static footer are owned by portfolio-suite `src/network/` and distributed with `scripts/sync_network.py`. Host palettes preserve local identity. CLARE hash routes compact the top bar below the homepage; Workshop uses a compact bar without a network footer and preserves focused tasks with new-tab links. The Workshop public overview lives at `https://jonathankhobson.github.io/portfolio/workshop-studio/`; the app remains separate.
