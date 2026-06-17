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

### Player Character PDFs

Copied from `event-visual-asset-pack/player-pdfs/` into `events/goldspire/assets/player-pdfs/` and linked from both the Goldspire landing page and `/resources/daggerheart.html`.

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

### Icons

All curated icons from `event-visual-asset-pack/assets/icons/` are copied into `events/goldspire/assets/icons/` and used for quick facts, expectations, resources, and FAQ support.

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

## Venue Source

- Official place link: `https://www.moxboardinghouse.com/pages/chandler`
- Public venue name used on page: `Mox Boarding House Chandler`
- Address used on page: `1371 N Alma School Rd, Chandler, AZ 85224`
