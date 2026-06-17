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
- Courier cards link to optional character PDFs. These should remain framed as optional review, not required prep.
- Location art supports atmosphere only; it should not become a lore gallery.
- Icons are decorative supports and should not carry essential meaning by themselves.

## Technical Notes

- Static HTML/CSS/JS only.
- Shared GM site CSS remains imported from `../../styles/`.
- Page-specific layout lives in `goldspire.css`.
- CTA wiring lives in `goldspire.js` through one config object.
- Current CTA target is `events/goldspire/coming-soon/`; replacing the real listing URL is a one-value change in `goldspire.js`.
- Player-facing character PDFs are published under `events/goldspire/assets/player-pdfs/`.
- Private table edition PDFs, sheet previews, and GM-only story/rules material remain intentionally excluded from the public route.
