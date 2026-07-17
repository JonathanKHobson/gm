---
project: stargate-phx-event-page
type: source-asset-manifest
status: prompt-11-complete
updated: 2026-07-16
---

# Source and asset manifest

## Public asset root

`assets/events/stargate-phx/`

## Generation provenance

Public images are original generated compositions guided by a private,
page-cited reference index at
`site-build-packet/09-visual-reference-index.md` in the private Stargate PHX
project. Licensed rulebook pages, episode art, pregen illustrations, tactical
maps, and purchaser-marked captures remain private and are not public assets.

Jonathan's private `img/` folder is the primary character, species, Stargate,
DHD, uniform, weapon, and command-space fidelity source. The first three drafts
were rejected for drift before any public asset was copied into this repo.

## Accepted public inventory

Prompt 11 produced 53 public files beneath the canonical root:

- `hero/`: one lossless A01 master, matched WebP/AVIF 1920 and 1280 variants,
  and matched 900x1125 mobile variants
- `scenes/`: one lossless A09 master and matched WebP/AVIF 1440 and 960 variants
- `characters/`: seven 1024x1536 RGBA masters
- `characters/optimized/`: seven characters at 800 and 480 in WebP and AVIF
- `social/`: 1200x630 Open Graph JPEG derived from A01
- `registration/`: 960x540 WebP/AVIF status atmosphere derived from A01
- `display/`: 1920x1080 JPEG derived from A01
- `ui/`: two original accessible line SVGs

All 51 rasters decode. Full prompts, master SHA-256 checksums, cleanup method,
reproducible scripts, rejection record, and private QA evidence live in
`site-build-packet/11-generated-asset-manifest.md`.

### Master continuity

- A01: Rodriguez, A'tir, Oringo, and Maste/Bythal at an established Stargate
  and DHD; no generic substitute species or technology.
- A02–A08: faithful pregen identities, species, costume colors/silhouettes, and
  signature equipment; final character comparison caused Bervell and Lanni
  color/gear corrections before publication.
- A09: established Lanni, Bervell, and Oringo investigating a familiar DHD and
  Stargate in spoiler-neutral ruins.

## Existing shared public asset

- `assets/portraits/gamemasterkyle-stargate-avatar.webp`: approved existing GM
  profile image; reuse is planned without synthetic replacement.

## Route usage

- Landing page: A01 responsive hero, A09 mission scene, all seven optimized
  character figures, social image metadata, GM avatar, and restrained UI marks.
- Rules/resources: A09 responsive scene only. The route uses it as a compact
  canon-grounded lead and introduces no additional art or invented technology.
- Character guide: all seven 480/800 WebP/AVIF cutouts with lossless PNG
  fallbacks. Every profile retains the complete supplied silhouette and
  signature equipment inside a stable 2:3 well.
- Dates and pending routes: the 960x540 A01 registration AVIF/WebP with the
  lossless A01 hero fallback. The crop is used only as status atmosphere and
  does not imply a pictured venue, episode, or confirmed date.

## Player PDF inventory

`events/stargate-phx/assets/player-pdfs/` contains the verified Prompt 08
package: seven four-page individual files beneath `individual/` and one
28-page bookmarked combined packet. Their public SHA-256 values match the
private `site-build-packet/08-player-pdf-manifest.md`; no licensed source file
was copied directly or silently substituted.

## Exclusions

- source screenshots and full rulebook/episode pages
- tactical maps and internal location layouts
- spoilers, GM answers, private contact information, purchaser metadata
- fake venue imagery, generated table proof, or unsupported endorsement marks
- every rejected generation in the private `drafts/rejected/` workbench
