---
project: goldspire-landing-page
type: implementation-notes
status: active
---

# Implementation Notes

## Intent

The page is a conversion-ready landing page for curious Mox, Discord, and friend-of-player traffic. It is not the event listing and does not include a registration form.

## Copy Direction

- Keep first-fold content short: title, hook, logistics, beginner promise, CTA.
- Use corporate fantasy humor as seasoning, not the meal.
- Avoid unexplained proper nouns and story terms in public copy.
- Keep all story details spoiler-light and limited to what helps a new player decide.
- Use progressive disclosure for Daggerheart basics, FAQ, content comfort, and prep details.

## Visual Direction

- Primary mood: warm cinematic fantasy road plus cheerful corporate risk language.
- Hero character art uses the prepared background-removed courier crew reference as a single controlled image.
- Mobile uses the same crew reference in a compact strip so the PCs are visible without image collision or excessive first-fold height.
- Character art supports choice and emotional buy-in.
- Courier cards link to optional character PDFs and the character guide. These should remain framed as optional review, not required prep.
- The character guide uses the prepared social poster cards as full-aspect visuals. Do not crop these assets unless a new crop is deliberately exported.
- Location art supports atmosphere only; it should not become a lore gallery.
- Icons are decorative supports and should not carry essential meaning by themselves.

## Technical Notes

- Static HTML/CSS/JS only.
- Shared GM site CSS remains imported from `../../styles/`.
- The current landing page uses shared GM CSS in `styles/components.css` and `styles/responsive.css`; the optional character route has its own `events/goldspire/characters/characters.css`.
- CTA wiring lives in `goldspire-registration.js` through one registration state object shared by the event page and Daggerheart resources page.
- Current state is `registration_state: "live"` with label `Book now at Mox` and target `https://events.moxboardinghouse.com/p/n/xnP6r62v/v5`.
- `checkout_url` is retained in the config as an optional future switch, but the verified checkout URL currently redirects back to the event listing.
- The `events/goldspire/coming-soon/` route remains noindex as a recovery fallback for stale links and points visitors to the live Mox listing.
- The events index now uses the shared live CTA script for its Goldspire booking link.
- Player-facing character PDFs are published under `events/goldspire/assets/player-pdfs/`.
- `events/goldspire/characters/` is the progressive-disclosure layer for players who want more character context before game night. Keep the main landing page concise and choice-oriented.
- Private table edition PDFs, sheet previews, and GM-only story/rules material remain intentionally excluded from the public route.

## Character Guide Copy Guardrails

- Explain Daggerheart terms in ordinary language: class is the adventure job, ancestry is what kind of being/body, community is what shaped them, and heritage is the combined sheet area.
- Do not make character prep feel required. Use "optional," "if curiosity wins," and "choose at the table" language.
- Keep the corporate satire small and legible. The page should feel like a helpful pre-flight briefing, not an internal memo dump.
- Keep story copy broad: courier mission, magical cargo, Goldspire Territories, forest road, and table choices. Do not reveal hidden plot logic or later-session details.
