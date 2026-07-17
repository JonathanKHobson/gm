---
project: stargate-phx-event-page
type: qa-results
status: active
updated: 2026-07-16
---

# QA results

## Prompt 11 asset gate

Pass after correction. Initial A01, A09, A08, and later costume/species-drift
drafts were rejected and remain outside the public root.

- Canon: inspected A01 against the team and named pregen anchors; inspected all
  seven final character cutouts above their supplied full-figure anchors. The
  board caught and corrected Bervell's uniform/tablet colors and Lanni's desert
  uniform/vest before approval.
- Technology/species: accepted scenes use familiar Stargate rings, chevrons,
  event horizons, and DHD forms; Oringo is the supplied Unas, A'tir the supplied
  Jaffa, and no invented alien or creature remains.
- Alpha: seven 1024x1536 RGBA masters pass light and dark proofs with complete
  heads, hands, feet, weapons/gear, and no visible magenta/white fringe.
- Derivatives: all 51 public rasters decode; WebP/AVIF alpha survives; 1920,
  1440, 1280, 960, 900 mobile, 800, 480, social, registration, and display
  dimensions match the manifest.
- Crop/layout: representative 1440x900 and 390x844 proofs preserve the hero text
  zone and keep meaningful mobile imagery in a separate block.
- Evidence: private Prompt 11 manifest, accepted/rejected logs, master
  checksums, canon boards, alpha contact sheet, family contact sheet, and layout
  proofs are current.

## Route QA

### Prompt 14 landing page

Pass. Local static-server evidence is stored privately at
`site-build-packet/qa/landing/summary.json` with four full-page captures and
eight anchor captures per viewport.

- Viewports: 390x844, 430x932, 1366x900, and 1440x900.
- Layout: zero horizontal overflow; hero copy/media separate on mobile; no
  clipped or broken raster, character crop, or awkward CTA wrapping.
- Accessibility structure: one H1, no heading-level skips, no button or summary
  under 44px, visible native disclosures, reduced-motion context, and meaningful
  image alternatives.
- Content/state: seven pregens, 14 progressive disclosures, eight named visual
  anchors, and three configuration-controlled CTA instances. Pending,
  scheduled, live, and sold-out simulations return consistent labels and links.
- Loading/runtime: final local cold hero readiness 313–459ms; zero console or
  page errors; zero unresolved internal references.
- Visual inspection: reviewed phone and desktop hero, premise, roster, proof,
  FAQ, and full-page compositions. All accepted Stargate imagery remains tied
  to the supplied character, species, gate, DHD, uniform, and equipment anchors.

### Prompt 15 rules/resources

Pass. Local evidence is stored privately at
`site-build-packet/qa/rules/summary.json` with full-page and six named-anchor
captures for 390x844, 430x932, and 1366x900.

- Structure: one H1, sequential headings, newcomer path before the 5e path,
  nine native disclosures, and all six required anchors.
- Layout: zero horizontal overflow; no wrapped CTA; all buttons and summaries
  are at least 44px; no broken or stretched A09 media.
- Responsive behavior: the contents rail is inline on both phone widths and
  sticky at 1366px. The 5e table becomes labeled block rows on mobile and never
  overflows its region.
- Interaction/runtime: native disclosure opening verified at every width;
  pending registration labels remain configuration-derived; no console or page
  errors; every internal reference and same-page hash resolves.
- Visual review: inspected the route lead, beginner loop, phone/desktop 5e
  comparison, optional depth, downloads/prep, and return funnel. Dark-band
  secondary text contrast and the phone comparison caption were corrected
  before the passing run.

### Prompt 16 character guide and PDFs

Pass. Private evidence is at `site-build-packet/qa/characters/summary.json`
with full-page and six required-anchor captures at 390x844, 430x932, and
1366x900.

- Roster: seven and only seven profiles, in verified manifest order, with
  distinct names, roles, complexity labels, play promises, hooks, and actions.
- Media: seven complete figures; every decoded image reports
  `object-fit: contain`; mobile order is heading, full figure, profile, PDF.
- Cold load: first figure ready in 299–394ms locally; all seven sequentially
  ready in 368–506ms. No blank, broken, stretched, or clipped character.
- PDFs: seven distinct individual links plus one combined link. All eight public
  files exist and match Prompt 08 SHA-256 checksums exactly.
- Layout/accessibility: no overflow, missing anchors, wrapped buttons,
  sub-44px buttons, heading skips, console errors, or page errors.
- Visual review: inspected phone and desktop intro/index/profile, individual
  action, combined packet, and custom-character path. The long combined action
  was shortened before the passing run.

### Prompt 17 dates, session picker, and pending route

Pass. Private evidence is in `site-build-packet/qa/dates/summary.json` with
both routes at 390x844, 430x932, and 1366x900, plus pending and representative
live-state captures.

- Central state: pending, scheduled, live with separate Mox URLs, live with one
  shared listing, and sold out all render from `stargate-registration.js`.
- Session schema: two simulated rows expose episode, day, date, time,
  availability, URL, and action. The shared-listing mode shows its explanatory
  note and points both actions to the same URL.
- Pending truth: production config contains zero sessions and no registration
  URL. Both routes render the confirmed price, seven-seat maximum, expected
  duration, venue, address, and useful next paths without a fake date.
- Fallback controls: `coming-soon/` has `noindex,nofollow`, no registration
  self-loop, a compact first viewport, and no sitemap entry.
- Layout/runtime: no overflow, broken/clipped art, wrapped CTA, sub-44px button,
  missing anchor, heading skip, console error, or page error in pending or live
  representative layouts. The desktop live CTA column was widened before the
  passing run.

### Prompt 18 shared Pro GM integration

Pass. Private rendered evidence is in
`site-build-packet/qa/shared/summary.json` with anchor and full-page captures at
390x844 and 1366x900.

- Discovery: the shared events index and durable links page expose Stargate PHX
  without removing their existing Goldspire, portfolio, community, or contact
  paths.
- Portfolio/recovery: the verified Echoes of Stargate source points into the
  beginner-safe event funnel; the 404 page offers Stargate recovery alongside
  its existing destinations.
- Indexing: the sitemap contains four indexable Stargate routes and omits the
  `noindex,nofollow` coming-soon route.
- Layout/runtime: all eight shared-page/viewport combinations have one H1, no
  overflow, broken image, missing Stargate anchor, wrapped CTA, sub-44px action,
  console error, or page error.
- Visual review: inspected event cards, links discovery, 404 recovery, and
  portfolio CTA on phone and desktop. A low-contrast secondary action and
  legacy shared touch targets were corrected before the passing run.

Prompt 19 remains active.

### Prompt 19 local integrated publish gate

Pass locally; publication and live verification are the remaining Prompt 19
steps. The compact anchor contract is in private
`site-build-packet/19-visual-anchor-map.md`; rendered evidence is in
`site-build-packet/qa/final/`.

- Rendered matrix: nine audited routes at 390x844, 430x932, 1366x900, and
  1440x900; all 36 route/viewport combinations pass.
- Layout/media: zero overflow, collision, broken/blank image, distorted image,
  missing or off-canvas anchor, sub-44px action, or awkward CTA wrap.
- Accessibility/interaction: one H1 and sequential headings per route, visible
  keyboard focus, working keyboard disclosures, reduced-motion matching, and
  useful mobile content at every anchor.
- Registration: production remains `pending` with zero sessions and no Mox
  registration URL. Separate simulation passes pending, scheduled, live with
  per-session URLs, live with one shared listing, and sold-out behavior.
- Links: 515 internal asset/route/hash references and 20 external destinations
  pass; the coming-soon route remains absent from the sitemap.
- Documents/code: all nine HTML documents have zero Nu HTML errors; XML, JS,
  JSON-LD, and Python QA syntax parse; browser execution reports no local
  resource, console, or page errors.
- PDFs: seven four-page individual packets and the bookmarked 28-page combined
  packet are unencrypted Letter-size files, open as `application/pdf`, and
  match the Prompt 08 SHA-256 manifest exactly.
- Visual inspection: phone and desktop hero, pending state, complete character,
  5e comparison, shared event card, Echoes bridge, links discovery, and 404
  recovery anchors were reviewed after the final target-size and contrast
  corrections.
