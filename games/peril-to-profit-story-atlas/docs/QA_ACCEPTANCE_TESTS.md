# QA Acceptance Tests

The atlas is not complete until all of these pass.

## Asset coverage

- [ ] Zero `SVG` references in `index.html`, entity pages, scene pages, Obsidian notes, CSS, JS, and data files.
- [ ] Every scene has a real raster image: `.png`, `.jpg`, `.jpeg`, or `.webp`.
- [ ] Every major entity has a real raster image.
- [ ] Every faction/company has either a raster logo/mark or a styled non-emoji CSS mark.
- [ ] No `prompt_fallback` asset statuses remain.
- [ ] No placeholder boxes.
- [ ] No emoji primary icons.

## Link coverage

- [ ] Every registered entity has a dedicated HTML wiki page.
- [ ] Every registered entity has an Obsidian note.
- [ ] Every alias in `required_entity_registry.json` is linkified in scene body text wherever it appears.
- [ ] Entity links are color-coded by type.
- [ ] Entity links are hoverable and keyboard-focusable.
- [ ] Hover cards contain image, type, summary, scenes, and click-through.

## Content depth

- [ ] Every NPC/enemy/creature page has specific, non-generic wants/fears/dialogue/equipment.
- [ ] Every enemy page has stat block summary and loot/search results.
- [ ] Every location page has sensory palette, discoverable details, and connected locations.
- [ ] Every company/faction page has origin, public face, real function, and module relevance.
- [ ] Every scene has read-aloud, GM-only notes, checks, choices, clues, loot, and payoff tracks.

## Continuity

- [ ] Strixwolf only appears in Act One and optional Act Two payoff.
- [ ] No Strixwolf images in Hush, Hanging Office, Open Vale, or epilogue unless explicitly enabled as payoff.
- [ ] Bramble Union only appears in Act Two, plus evidence/future-hook references.
- [ ] Legacy Security Skeletons and Soul-Audit Wraiths only appear in Act Five.
- [ ] Hush is treated warmly, not as the joke.
- [ ] Bramble Union is morally complicated, not cartoon evil.

## Deliverables

- [ ] `index.html` loads locally.
- [ ] `pages/entities/*.html` exist for every entity.
- [ ] `pages/scenes/*.html` exist for every scene.
- [ ] `obsidian_vault` has working wikilinks.
- [ ] `data/qa-coverage-report.json` exists.
- [ ] `QA_REPORT.md` exists and states pass/fail results.
