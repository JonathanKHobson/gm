# Code QA — Goldspire Event + Daggerheart Resource

Static GitHub Pages site. Reviewed: `events/goldspire/index.html`, `events/goldspire/goldspire.css`, `events/goldspire/goldspire.js`, `resources/daggerheart.html`, shared `styles/*`, `sitemap.xml`, `robots.txt`, plus live rendered behavior.

**Overall code health: B+ / strong.** Clean, semantic, accessible-leaning markup with good performance hygiene. The defects are mostly *absences* (structured data, custom 404, dead mobile-menu code) rather than broken code. No console errors, no broken assets, no layout overflow.

## Execution status — 2026-06-17

| Finding | Status | Evidence / note |
|---|---|---|
| C1 Event JSON-LD | Complete | `events/goldspire/index.html` now includes valid `application/ld+json` with factual event fields. Static parser passed. |
| C2 Custom 404 | Complete | Root `404.html` exists and was screenshot-checked at mobile width. |
| C3 Mobile menu dead code | Complete | Mobile row nav is visible/reachable; dead menu toggle JS path removed from `goldspire.js`. |
| C4 Daggerheart footer/meta/CSS | Complete | Resource page now has CTA/footer, Twitter metadata, and `resources/daggerheart.css`. |
| C5 Nav consistency | Complete | Event and resource nav labels now align around `New players / Characters / FAQ / Daggerheart / Portfolio`. |
| C6 Image format/performance | Backlog | PNG-to-WebP/AVIF plus responsive `srcset/sizes` remains the next performance slice; not completed in this remediation pass. |
| C7 Contrast verification | Partially complete | Rendered review found no readability break; resource secondary button contrast was strengthened. Full axe/Lighthouse contrast certification remains a future check. |
| C8 Sitemap hygiene | Complete | `events/goldspire/coming-soon/` is absent from `sitemap.xml`; coming-soon page has `noindex, nofollow`. |

## ✅ What's solid
- **Semantics:** `header / main / footer / section / article / aside`, `aria-labelledby` per section, skip-link (`.skip → #main`), `aria-label`ed nav. Good document outline (single H1 → H2 → H3).
- **Images:** explicit `width`/`height` on every `<img>` (protects CLS); `loading="eager"`+`decoding="async"` on hero, `loading="lazy"` below the fold; decorative images correctly use `alt=""`; meaningful images have descriptive alt.
- **New-tab links:** every `target="_blank"` carries `rel="noopener noreferrer"` and `aria-describedby="new-tab-note"` (sr-only "Opens in a new tab"). This is better than most production sites.
- **Motion:** `goldspire.js` reveal-on-scroll uses `IntersectionObserver` and **respects `prefers-reduced-motion`** with a non-animated fallback.
- **CTA single source of truth:** `goldspire-registration.js` rewrites all `[data-event-cta]` hrefs/labels from the shared registration config — flip one value to repoint every CTA when registration state changes.
- **Fonts:** `preconnect` to Google Fonts + `display=swap`; reasonable family count.
- **Canonicals** present on both pages; `robots.txt` + `sitemap.xml` present; sitemap includes both primary pages.

## 🔴 Findings

### C1 — No `schema.org/Event` structured data (High, SEO) 
- **Where:** `events/goldspire/index.html` (0 `application/ld+json`; root `index.html` has 1).
- **Impact:** An event page with a date, price, and venue is the *canonical* case for Google event rich results / event experiences. Without `Event` JSON-LD you forfeit rich snippets, the "Events" surface, and machine-readable date/price/location. This is a free, high-leverage SEO win.
- **Fix (described):** Add a JSON-LD `Event` block with `name`, `startDate`/`endDate` (2026-07-07T17:00–21:00, America/Phoenix), `eventAttendanceMode`, `location` (Mox Boarding House Chandler + postalAddress), `image`, `description`, `organizer` (GameMasterKyle), and `offers` (price `25` USD, `availability`, and the registration `url` once live). Keep the satire out of the structured data — use plain factual values.

### C2 — No custom `404.html` (Medium) → [BUG-04](../bugs/BUG-04-no-custom-404/report.md)
- **Where:** site root; confirmed live (generic "Page not found · GitHub Pages").
- **Fix:** add `/404.html` (GitHub Pages serves it automatically) with brand voice + links home and to the event.

### C3 — Mobile menu is dead code (Medium) → [BUG-02](../bugs/BUG-02-mobile-nav-stranded/report.md)
- **Where:** `styles/responsive.css:111` sets `.menu-btn{display:none}` at ≤900px; `goldspire.css:1042` sets `.goldspire-header .navlink{display:none}`.
- **Impact:** The hamburger `<button id="menuBtn">` and its full ARIA wiring + the toggle handler in `goldspire.js` can never fire on the Goldspire page — the button is hidden at every width, and the navlinks it would reveal are also hidden. Net: unreachable nav on mobile + ~15 lines of dead JS/markup.
- **Fix:** Pick one model. Either let the global horizontal-scroll navlink row render on the event page (delete the `.goldspire-header .navlink{display:none}` override) — the Daggerheart page already proves this works on mobile — or restore the hamburger by removing the `display:none` at the relevant breakpoint and confirming the JS toggle.

### C4 — Daggerheart page: no footer + inconsistent head/meta (Medium) → [BUG-03](../bugs/BUG-03-daggerheart-no-footer/report.md)
- **Where:** `resources/daggerheart.html`.
- **Issues:** (a) **no `<footer>`** at all → page dead-ends with no CTA/nav home; (b) **no `twitter:` card meta** (event page has full Twitter card; resource page has only OG) — inconsistent social previews; (c) styling lives in a large inline `<style>` block rather than the shared token/component system used elsewhere — works, but is a maintenance/consistency drift.
- **Fix:** add the shared footer + a closing CTA band; add Twitter card meta mirroring OG; consider migrating the inline styles into a shared `resources.css`.

### C5 — Nav inconsistency across pages (Low) → [BUG-07](../bugs/BUG-07-redundant-microcopy-nav/report.md)
- Event nav: New players / Characters / FAQ / Daggerheart / Portfolio / Claim a Seat.
- Resource nav: Games / About / Goldspire Event / Get in touch.
- Two different global navs + labels ("Portfolio" vs "About", "Get in touch" vs "Contact") weaken cross-page consistency (H04). Align to one global nav component.

### C6 — Image format & sizing / performance (Low–Medium, perf)
- All imagery is **PNG**, including large photographic-style renders (hero 1774×887, location art 1024×1024, group art 1536×1024). PNG is the wrong format for photographic content — **serve WebP/AVIF** with PNG fallback for a large byte reduction.
- Icons are authored at **256×256 but rendered small** (~24–40px) — ship them at display size (or as SVG) and/or add `srcset`.
- Add responsive `srcset`/`sizes` to the hero and location images so phones don't download desktop-sized assets.
- *No exact byte audit performed here — run Lighthouse to quantify; the formats above are the structural issue.*

### C7 — Contrast not numerically verified (Low, a11y to confirm)
- Hero H1/sub copy (`rgb(255,249,236)`) sits over the forest image with a CSS gradient scrim. It *looks* readable in capture, but the value over the lightest part of the image was not sampled. **Run axe / Lighthouse** to confirm ≥4.5:1 (normal) / ≥3:1 (large) before claiming WCAG AA. Same check for the gold/cream pill text and `--ink-muted` meta text.

### C8 — `coming-soon/` in sitemap (Low, SEO hygiene)
- The interim coming-soon page is listed in `sitemap.xml`. Indexing a "being finalized" placeholder is low value; drop it from the sitemap (or `noindex` it) until it becomes the real registration page.

## Suggested fix order (code)
1. C3 mobile nav (also a top UX finding) · 2. C1 Event JSON-LD (SEO leverage) · 3. C4 Daggerheart footer/meta · 4. C2 custom 404 · 5. C6 image formats · 6. C5/C7/C8 polish.

## Verification checklist after fixes
- [ ] Lighthouse (Perf / A11y / SEO / Best Practices) on both pages, mobile + desktop
- [ ] axe DevTools pass (contrast, names/roles, landmarks)
- [ ] Rich Results Test validates the `Event` JSON-LD
- [ ] Mobile (≤390px) header exposes nav (hamburger or scroll row)
- [ ] `/404.html` renders branded page on a bad URL
- [ ] No new console errors; assets still 200
