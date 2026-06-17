# Goldspire UXHC Audit — Index

**Subject:** Live audit of *Peril to Profit™: The Goldspire Messengers* event page and the Daggerheart resources page
**Method:** UX Heuristics Compass (UXHC) advanced audit + multi-agent synthetic usability tests + focus group + Code QA + Visual QA
**Lore/voice grounding:** P2P-GM-MCP (Peril to Profit campaign canon)
**Date:** 2026-06-17
**Auditor:** Claude (Opus 4.8) via UXHC, Playwright (live rendered evidence), P2P-GM-MCP
**Primary URLs:**
- https://jonathankhobson.github.io/gm/events/goldspire/
- https://jonathankhobson.github.io/gm/resources/daggerheart.html
- (secondary) https://jonathankhobson.github.io/gm/events/goldspire/coming-soon/

> **Original audit note:** no fixes were applied during the audit capture.  
> **Remediation update, 2026-06-17:** BUG-02 through BUG-09 have now been completed or reconciled in the local repo. BUG-01 remains intentionally deferred because the real external event listing URL is not available yet; the CTA remains `Claim a Seat` and still uses the single `event_signup_url` switch point.

---

## Headline result

| Scope | Grade | Score |
|---|---|---|
| Core heuristics (H1–H10) | **A+** | 90.41% |
| Full scope incl. accessibility, inclusion, journey, UX writing (H1–H14) | **A** | 87.49% |

**Top finding (Major / severity 3):** The conversion journey breaks at the finish line — **"Claim a Seat"** leads to a *coming-soon* page with no way to register or join a waitlist.

**"Does it feel AI?":** Copy = **no, authored voice**. Visuals = **partly** (location renders / group art). See [05-visual-qa](05-visual-qa/visual-qa-report.md).

---

## Folder map
| Folder | Contents |
|---|---|
| [`00-MASTER-AUDIT-REPORT.md`](00-MASTER-AUDIT-REPORT.md) | Full audit report + prioritized recommendations |
| [`01-uxh-report/`](01-uxh-report/) | UXHC rendered report + readable summary |
| [`02-usability-tests/`](02-usability-tests/) | Moderator protocol + 7 persona walkthroughs + synthesis |
| [`03-focus-group/`](03-focus-group/) | Synthetic focus-group transcript + consensus |
| [`04-code-qa/`](04-code-qa/) | HTML/CSS/JS/SEO/a11y/perf review |
| [`05-visual-qa/`](05-visual-qa/) | Layout, hierarchy, responsive, image quality, "feels AI?" |
| [`06-copy-rewrites/`](06-copy-rewrites/) | Specific copy changes (before → after) |
| [`bugs/`](bugs/) | One folder per bug, each with the Bug Report Checklist + screenshot |
| [`screenshots/`](screenshots/) | Live rendered evidence (desktop 1440 + mobile 390) |

## Bug register
| ID | Severity | Title |
|---|---|---|
| [BUG-01](bugs/BUG-01-cta-dead-end/report.md) | Critical | "Claim a Seat" dead-ends; no registration or waitlist |
| [BUG-02](bugs/BUG-02-mobile-nav-stranded/report.md) | High | Mobile header strands all navigation except the CTA |
| [BUG-03](bugs/BUG-03-daggerheart-no-footer/report.md) | Medium | Daggerheart page has no footer / no CTA (dead-end) |
| [BUG-04](bugs/BUG-04-no-custom-404/report.md) | Medium | No custom 404 — broken links hit generic GitHub error |
| [BUG-05](bugs/BUG-05-no-social-proof/report.md) | Medium | No testimonials / social proof |
| [BUG-06](bugs/BUG-06-live-local-drift/report.md) | Medium | Live copy differs from local working copy (drift) |
| [BUG-07](bugs/BUG-07-redundant-microcopy-nav/report.md) | Low | "Seats: 5 seats" redundancy + nav inconsistency |
| [BUG-08](bugs/BUG-08-satire-labels-scannability/report.md) | Low–Med | Satirical section labels reduce scannability |
| [BUG-09](bugs/BUG-09-dropped-daggerheart-reassurance/report.md) | Medium | Live hero dropped "no Daggerheart experience needed" |

## Remediation register
| ID | Current status | Resolution |
|---|---|---|
| BUG-01 | Deferred | External event listing dependency. `Claim a Seat` stays active-looking by request; `event_signup_url` remains `coming-soon/` for one-value cutover. |
| BUG-02 | Complete | Mobile header uses the horizontal-scroll nav row; dead hamburger JS path removed. |
| BUG-03 | Complete | Daggerheart resources page has footer, return CTA, `Claim a Seat`, portfolio route, Twitter/OG metadata, and extracted CSS. |
| BUG-04 | Complete | Root `404.html` added with branded recovery links. |
| BUG-05 | Complete | Social-proof section now uses real player reflections, compact proof media, and `Book me` links to the existing contact form. |
| BUG-06 | Complete | Hero, metadata, and deployed/source copy aligned around the current beginner-friendly Daggerheart framing. |
| BUG-07 | Complete | Seats tile trimmed to `5`; nav labels aligned across event/resource routes. |
| BUG-08 | Complete | Section labels now expose literal function while preserving satire in headings/body copy. |
| BUG-09 | Complete | "No tabletop or Daggerheart experience needed" restored above the fold and reinforced in the assurance strip. |
| C6 media optimization | Backlog | WebP/AVIF + `srcset/sizes` remains the next performance slice. |

## Evidence integrity
- Console clean (0 errors/warnings) on both primary pages.
- All images and PDFs return HTTP 200 — no broken assets.
- No horizontal overflow at 1440px or 390px.
- Reveal-on-scroll respects `prefers-reduced-motion`.
- Usability personas are **synthetic, host-interpreted walkthroughs** (UXHC policy), not real-participant research. Confirm with 3–5 real beginners.
