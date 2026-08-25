---
project: goldspire-landing-page
type: source-asset-manifest
status: active
---

# Source Asset Manifest

Source root:

`/Volumes/KyleSSD/Documents/My Work/Pro GM/Daggerheart_PeriltoProfit_TheGoldspireMessengers /goldspire_player_pitch_onboarding_packet/`

## Used Public Assets

### Hero Art

- `event-visual-asset-pack/assets/hero/goldspire-footer-sablewood-scene.png` -> `events/goldspire/assets/hero/forest-road-scene.png`
- `event-visual-asset-pack/assets/hero/goldspire-footer-sablewood-wide-crop.png` -> `events/goldspire/assets/hero/forest-road-wide-crop.png`
- `event-visual-asset-pack/assets/hero/SZ-00-standby-welcome.png` -> `events/goldspire/assets/hero/SZ-00-standby-welcome.png`

Generated performance derivatives from approved hero art:

- `assets/events/goldspire/hero/goldspire-sablewood-scene.png` -> `assets/events/goldspire/hero/goldspire-sablewood-scene-1280.avif`
- `assets/events/goldspire/hero/goldspire-sablewood-wide.png` -> `assets/events/goldspire/hero/goldspire-sablewood-wide.avif`

The original PNG files remain as fallbacks. Browsers with AVIF support receive
the smaller derivatives through `<picture>` or CSS `image-set()`.

### Transparent Character Art

- `visual-assets/pc_portrait_assets/transparent/barnacle.png` -> `events/goldspire/assets/characters/barnacle-background-removed.png`
- `visual-assets/pc_portrait_assets/transparent/garrick-reed.png` -> `events/goldspire/assets/characters/garrick-reed-background-removed.png`
- `visual-assets/pc_portrait_assets/transparent/khari-nix.png` -> `events/goldspire/assets/characters/khari-nix-background-removed.png`
- `visual-assets/pc_portrait_assets/transparent/marlowe-fairwind.png` -> `events/goldspire/assets/characters/marlowe-fairwind-background-removed.png`
- `visual-assets/pc_portrait_assets/transparent/varian-soto.png` -> `events/goldspire/assets/characters/varian-soto-background-removed.png`
- `visual-assets/pc_portrait_assets/transparent/party-reference.png` -> `events/goldspire/assets/characters/courier-crew-background-removed.png`

The hero uses the new chroma-key-derived transparent crew reference as a single controlled party image. This replaced the earlier background-removed crew reference after QA found visible matte artifacts in character gaps.

The five individual card portraits also have page-local cropped derivatives in `events/goldspire/assets/characters/cropped/`. These were regenerated from the transparent source files to remove excess canvas and prevent blank-looking character cards.

### Supplemental PC Art

Copied from `event-visual-asset-pack/assets/pcs/` into `events/goldspire/assets/pcs/` for future page/social variants. The current public page uses the transparent crew reference in the hero and cropped transparent individual portraits in the character cards.

### Character Guide Poster Cards

Copied from `market-material-packet/output/final/` into `assets/events/goldspire/pc-social/` and used on `events/goldspire/characters/`.

- `peril-to-profit-goldspire-pc-marlowe-v1.png` -> `assets/events/goldspire/pc-social/marlowe-fairwind-card.png`
- `peril-to-profit-goldspire-pc-barnacle-v1.png` -> `assets/events/goldspire/pc-social/barnacle-card.png`
- `peril-to-profit-goldspire-pc-garrick-v1.png` -> `assets/events/goldspire/pc-social/garrick-reed-card.png`
- `peril-to-profit-goldspire-pc-khari-v1.png` -> `assets/events/goldspire/pc-social/khari-nix-card.png`
- `peril-to-profit-goldspire-pc-varian-v1.png` -> `assets/events/goldspire/pc-social/varian-soto-card.png`

These assets are used as the visual lead for each player-facing courier profile. They are not cropped in CSS; the guide preserves their 4:5 aspect ratio with `object-fit: contain`.

### Player Character PDFs

Generated from the canonical directly edited table-edition pages by `source/level_1_player_packets/scripts/build_level_1_packets.py` into `events/goldspire/assets/player-pdfs/`. These same files are linked from the Goldspire landing page, the character page, and the root `00 - PLAYER START HANDOUTS/` print pickup folder.

- `01-marlowe-fairwind-pages-02-05.pdf`
- `02-barnacle-pages-06-09.pdf`
- `03-garrick-reed-pages-10-13.pdf`
- `04-khari-nix-pages-14-17.pdf`
- `05-varian-soto-pages-18-21.pdf`
- `all-player-character-packet-pages-02-21.pdf`

These are optional player-facing prep assets. The private table edition PDF at the packet root remains excluded.

### Location Art

- `event-visual-asset-pack/assets/location-art/MAP-LOC-sablewood-route-gate.png`
- `event-visual-asset-pack/assets/location-art/MAP-LOC-old-sable-canopy-road.png`
- `event-visual-asset-pack/assets/location-art/MAP-LOC-hush.png`
- `event-visual-asset-pack/assets/location-art/MAP-LOC-clover-co-op.png`

All four are copied into `events/goldspire/assets/locations/` and used as spoiler-light mood art.

### Poster Elements

- `goldspire-footer-emblem-transparent.png`
- `goldspire-cutout-clean-cart-transparent.png`
- `goldspire-margin-courier-transparent.png`
- `goldspire-margin-waymarker-transparent.png`

These are copied into `events/goldspire/assets/poster-elements/`. The page currently uses the courier accent only; the other poster elements remain available for future variants but are not placed in the active layout.

### Story-World Character Accent

- `visual-assets/npc_images/inspector-pelt/fullbody_transparent.png` -> `assets/events/goldspire/npcs/inspector-pelt.png`

This transparent character art is used as a contained story-world accent in the event-details Daggerheart resource card. It is atmospheric flavor, not proof of a live session and not a spoiler explanation.

### Marketing CTA Art

- `market-material-packet/output/final/ai-generated-qr-variants/goldspire-ai-wide-poster-with-event-qr-1731x909-v1.png` -> `assets/events/goldspire/marketing/goldspire-ai-wide-poster-with-event-qr-1731x909-v1.png`

This wide QR poster is used after the short video proof cards as a booking/reminder banner. The adjacent button remains the primary booking action, because a QR code is not usable as the only action on the same device.

### Optimized Character Delivery Assets

Generated public performance derivatives from the already-approved transparent character PNGs:

- `assets/events/goldspire/pcs/party-reference.png` -> `assets/events/goldspire/pcs/optimized/party-reference-1280.webp`
- `assets/events/goldspire/pcs/marlowe-fairwind.png` -> `assets/events/goldspire/pcs/optimized/marlowe-fairwind-card.webp`
- `assets/events/goldspire/pcs/barnacle.png` -> `assets/events/goldspire/pcs/optimized/barnacle-card.webp`
- `assets/events/goldspire/pcs/garrick-reed.png` -> `assets/events/goldspire/pcs/optimized/garrick-reed-card.webp`
- `assets/events/goldspire/pcs/khari-nix.png` -> `assets/events/goldspire/pcs/optimized/khari-nix-card.webp`
- `assets/events/goldspire/pcs/varian-soto.png` -> `assets/events/goldspire/pcs/optimized/varian-soto-card.webp`

These WebP files preserve transparent character art while reducing cold-load payload for the hero party image and landing-page character cards. The original PNG files remain in place as source/fallback assets.

### Icons

All curated icons from `event-visual-asset-pack/assets/icons/` are copied into `events/goldspire/assets/icons/` and used for quick facts, expectations, resources, and FAQ support.

### Real Table / Player Proof Assets

- `/Volumes/KyleSSD/Documents/My Work/Pro GM/assets/evidence/p2p/amber_player_art_teamP2p.png` -> `events/goldspire/assets/proof/player-made-p2p-art.png`
- `/Volumes/KyleSSD/Documents/My Work/Pro GM/assets/PhotosEvidence/Screenshot 2026-06-17 at 2.19.31 AM.png` -> `events/goldspire/assets/proof/table-session-photo.png`

These are used as authenticity cues near the social-proof and Daggerheart resource surfaces. They are framed as past GameMasterKyle/player-creativity evidence, not literal Goldspire scene art.

Approved but not placed in this compact pass:

- `/Volumes/KyleSSD/Documents/My Work/Pro GM/assets/evidence/p2p/The P2K team.pdf`

This remains available for a future proof-gallery or portfolio-context slice if the page needs more player-art evidence.

### Shared Site Assets Restored

These files are referenced by shared CSS used by the Goldspire and Daggerheart routes. They were restored to prevent missing background-image requests:

- `/Volumes/KyleSSD/Documents/My Work/Pro GM/06_resume_portfolio_assets/portfolio-html/assets/generated/parchment-map-background.webp` -> `assets/generated/parchment-map-background.webp`
- `/Volumes/KyleSSD/Documents/My Work/Pro GM/06_resume_portfolio_assets/portfolio-html/assets/generated/hero-tabletop-warm.webp` -> `assets/generated/hero-tabletop-warm.webp`
- `/Volumes/KyleSSD/Documents/My Work/Pro GM/06_resume_portfolio_assets/portfolio-html/assets/generated/echoes-sci-fi-hero.webp` -> `assets/generated/echoes-sci-fi-hero.webp`
- `/Volumes/KyleSSD/Documents/My Work/Pro GM/06_resume_portfolio_assets/portfolio-html/assets/generated/stargate-card-sci-fi-hero.webp` -> `assets/generated/stargate-card-sci-fi-hero.webp`

## Intentionally Excluded From Public Page

- `event-visual-asset-pack/assets/sheet-page-previews/`
- private table edition PDFs at the packet root
- non-curated map assets
- source HTML pages with absolute local paths
- GM-only story notes, late locations, final encounter details, and hidden story reveals

## Source Copy Files Used

- `12-custom-landing-page-packet.md`
- `Event_Listing_Brief_v2.docx`
- `03-player-show-up-info.md`
- `06-daggerheart-basics.md`
- `07-frequently-asked-questions.md`
- `Goldspire Creative Pass/00_CREATIVE_PASS_NOTES.md`
- `Goldspire Creative Pass/01_discord-pitch_CREATIVE.md`
- `Goldspire Creative Pass/02_one-pager_CREATIVE.md`
- `Goldspire Creative Pass/03_player-invitation_CREATIVE.md`
- `Goldspire Creative Pass/05_synopsis_CREATIVE.md`
- `Goldspire Creative Pass/COPY_BANK_taglines_and_hooks.md`
- `Goldspire Creative Pass/VOICE_AND_MESSAGING_GUIDE.md`
- `event-visual-asset-pack/docs/03-landing-page-asset-and-flow-brief.md`
- `event-visual-asset-pack/docs/05-daggerheart-player-links.md`
- `Rules/Core Rules (Module-Relevant).md`
- `Rules/Conditions (Full Reference).md`
- `Rules/Session Zero & Connection Questions.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/README.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/01_latest_event_listing_v3.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/02_voice_and_tone_guide.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/03_landing_page_copy_blocks.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/04_microcopy_bank.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/05_brand_glossary_tm_usage.md`
- `Peril_to_Profit_Landing_Page_Dev_Packet_Markdown/06_dev_implementation_notes.md`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/data/pc-sheet-registry.json`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/data/pc-profile-schema.json`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/pages/entities/marlowe-fairwind.html`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/pages/entities/barnacle.html`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/pages/entities/garrick-reed.html`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/pages/entities/khari-nix.html`
- `/Volumes/Documents/My Games/Peril To Profit/dist/story-atlas/pages/entities/varian-soto.html`

Story Atlas material was used only for player-facing character facts, plain-language roles, pronouns, ancestry/community/class/subclass, and non-spoiler personality texture. Hidden plot notes, source-status language, private GM material, and late-session reveals remain excluded from public copy.

## Venue Source

- Official place link: `https://www.moxboardinghouse.com/pages/chandler`
- Public venue name used on page: `Mox Boarding House Chandler`
- Address used on page: `1371 N Alma School Rd, Chandler, AZ 85224`
