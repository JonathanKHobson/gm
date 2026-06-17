# Master Audit Report — Goldspire Messengers (Live)

*Peril to Profit™: The Goldspire Messengers* — advanced UXHC audit with multi-agent usability testing, focus group, code QA, and visual QA.

- **Date:** 2026-06-17
- **Event date on page:** Tuesday, July 7, 2026, 5:00–9:00 PM (≈3 weeks out at audit time)
- **Pages:** Goldspire event page (primary), Daggerheart resources (primary), coming-soon interstitial (secondary)
- **Tools:** UX Heuristics Compass (advanced, H1–H14, 102 items, HIL off), Playwright live rendering (desktop 1440 / mobile 390), P2P-GM-MCP (voice/lore canon)

---

## 1. Executive summary

This is a **genuinely good microsite** — professionally designed, warm, on-brand, technically clean. It scores **A (87.49%)** across the full UXHC rubric and **A+ (90.41%)** on the core ten heuristics. The brand voice is a real asset: a consistent corporate-fantasy satire that is **canon to the Peril to Profit world** (the campaign's organizations are literally `Kazrak Industries™`, `Soulspire Solutions™`, `Hexmart™`, with "Management" and "Compliance" as institutions). This is **not** generic AI filler — it is an authored voice with a point of view.

But the audit surfaces **one issue that outweighs all the polish**: the conversion path is broken at the end. The single most important action — **"Claim a Seat"** — leads to a *"coming soon, listing being finalized"* page with **no registration and no way to be notified**. Every persona who decides "yes, I'm in" hits a wall and is told to "Ask Kyle a question." For an event whose whole pitch is **scarcity ("5 seats only")**, that is the worst possible place to lose people.

Three secondary issues compound it: the **mobile header strands all navigation** except the CTA; the **Daggerheart resources page dead-ends** with no footer or CTA; and there is **no social proof** to convert the trust-driven personas.

**If you fix only one thing:** give "Claim a Seat" somewhere real to go — a registration link or, until the listing is live, an email/waitlist capture on the coming-soon page.

## 1A. Remediation status — 2026-06-17

This audit report is preserved as the original findings record. Current implementation status:

| Area | Status | Notes |
|---|---|---|
| BUG-01 primary registration destination | Deferred | External dependency by owner decision. Visible CTA now reads `Registration has not started yet`; all event CTAs still route through `event_signup_url: "coming-soon/"` for cutover. |
| BUG-02 mobile nav | Complete | Header nav links are reachable at mobile widths using the horizontal-scroll row; dead hamburger behavior was removed. |
| BUG-03 Daggerheart dead-end | Complete | Resource page now includes return CTA, registration-state CTA, portfolio path, footer, and Twitter/OG metadata. |
| BUG-04 custom 404 | Complete | Root `404.html` provides branded recovery to Home, Goldspire, and Daggerheart resources. |
| BUG-05 social proof | Complete | Real player reflections and compact proof media were added; no public placeholder/pending-testimony copy remains. |
| BUG-06/07/08/09 copy and consistency | Complete | Canonical hero copy, fact tile, nav labels, section scan labels, and Daggerheart reassurance have been reconciled. |
| Visual authenticity | Improved | Added a compact real-table/player-art proof moment. Larger proof gallery and broader media treatment remain out of scope. |
| Media performance C6 | Backlog | Convert heavy PNGs to WebP/AVIF and add responsive `srcset/sizes` in a future performance slice. |

Latest local evidence: `/tmp/goldspire-audit-final-qa-2026-06-17/summary.json` and `/tmp/goldspire-static-integrity-2026-06-17.json`.

---

## 2. Scorecard

| Scope | Grade | Quality % | Descriptor |
|---|---|---|---|
| Core (H1–H10) | A+ | 90.41% | Excellent — exceeds standard |
| Full (H1–H14) | A | 87.49% | Strong — meets standard |

| # | Heuristic | Grade | % | Read |
|---|---|---|---|---|
| H01 | Visibility of System Status | A | 86.1% | Minor "which page am I on" + CTA-destination cues |
| H02 | Match System ↔ Real World | A++ | 100% | Exemplary |
| H03 | User Control & Freedom | A | 85.0% | Mobile nav + resource dead-end |
| H04 | Consistency & Standards | A++ | 95.2% | Nav/label drift + missing social proof |
| H05 | Error Prevention | A++ | 100% | Exemplary |
| H06 | Recognition not Recall | A++ | 100% | Exemplary |
| H07 | Flexibility & Efficiency | A− | 83.3% | Registration can't complete; satire vs skimmer |
| H08 | Aesthetic & Minimalist | A++ | 96.9% | Beautiful; slight repetition |
| H09 | Recognize/Recover Errors | **C+** | 62.5% | **Lowest.** No custom 404; coming-soon no next step |
| H10 | Help & Documentation | A++ | 95.0% | Strong FAQ |
| H11 | Accessibility | B+ | 75.0% | Mobile operability gap; verify contrast |
| H12 | Empathy & Inclusion | A+ | 91.7% | A genuine strength |
| H13 | Customer Journey & Satisfaction | B+ | 79.2% | **Top finding** — journey breaks at conversion |
| H14 | UX Writing / Content & Tone | B+ | 75.0% | Voice excellent; scannability/jargon cost |

---

## 3. Prioritized findings & recommendations

Severity: 0 none · 1 cosmetic · 2 moderate · 3 major · 4 catastrophic.

### P0 — Fix before any promotion drives traffic

**F1. Primary CTA dead-ends (H13 sev 3; H07/H01/H09 sev 2) — [BUG-01](bugs/BUG-01-cta-dead-end/report.md)**
"Claim a Seat" (4× on page + nav + footer) routes to `coming-soon/`: "listing is being finalized," with only "Back to event page" and "Ask Kyle a question." No register, no email capture, no calendar add, no waitlist. This is the peak-intent moment; with "5 seats only" scarcity, a visitor who can't act won't return.
*Fix:* (1) Now — add waitlist/notify email capture (embedded form or `mailto:`) + "add to calendar" `.ics`; relabel CTA "Hold my seat / Get the seat alert." (2) Live — point `event_signup_url` at registration; revert label. Copy in [06-copy-rewrites/03](06-copy-rewrites/03-cta-and-coming-soon.md).

### P1 — Fix this week

**F2. Mobile header strands nav (H11 sev 2; H03 sev 2) — [BUG-02](bugs/BUG-02-mobile-nav-stranded/report.md)**
≤900px: global CSS hides the hamburger, and `goldspire.css:1042` hides every `.navlink` on the event page → header = logo + "Claim a Seat" only; hamburger + its JS are dead code. *Fix:* let the global horizontal-scroll nav row render (proven on the Daggerheart page) or re-enable the hamburger.

**F3. Daggerheart page dead-ends (H03/H01 sev 1–2) — [BUG-03](bugs/BUG-03-daggerheart-no-footer/report.md)**
No footer, no closing CTA — a reassured reader is stranded mid-funnel. *Fix:* add shared footer + closing CTA back to registration.

### P2 — Fix this month

**F4. No custom 404 (H09 sev 2) — [BUG-04](bugs/BUG-04-no-custom-404/report.md)** — broken links hit the bare GitHub 404. Add branded `/404.html`.

**F5. No social proof (H04 sev 2) — [BUG-05](bugs/BUG-05-no-social-proof/report.md)** — add 2–3 player testimonials near host band / final CTA; converts Connection Seeker + Reluctant Plus-One.

**F6. Live ↔ local version drift (process) — [BUG-06](bugs/BUG-06-live-local-drift/report.md)** — live hero copy ≠ uncommitted local copy. Pick canonical, commit, ship.

**F7. Dropped Daggerheart reassurance (H07 sev 1) — [BUG-09](bugs/BUG-09-dropped-daggerheart-reassurance/report.md)** — restore explicit "no Daggerheart experience needed" above the fold.

### P3 — Polish

**F8. Copy scannability vs satire (H14 sev 2) — [BUG-08](bugs/BUG-08-satire-labels-scannability/report.md)** — keep jokes in prose; let eyebrows/headings carry literal function. See [06-copy-rewrites](06-copy-rewrites/).
**F9. Reassurance repetition (H08 sev 1)** — "no experience / heroes provided / no homework" appears 6+ times; consolidate to ~3 placements.
**F10. Redundant microcopy + nav inconsistency (H01/H04 sev 1) — [BUG-07](bugs/BUG-07-redundant-microcopy-nav/report.md)** — "Seats: 5 seats" → "5"; align the two pages' nav.
**(SEO) C1. Add `schema.org/Event` JSON-LD** — see [04-code-qa](04-code-qa/code-qa-report.md). High-leverage SEO win for an event page.

---

## 4. What is working (keep / protect)
- **The voice.** On-canon, specific, funny, warm. Your differentiator vs every generic fantasy listing.
- **Fear-first reassurance (H12).** Names real fears (math, acting, spotlight) and disarms them.
- **Aesthetics & hierarchy (H08, 96.9%).** Cinematic hero, clean band rhythm, strong type system.
- **Technical hygiene.** Clean console, no broken assets, no overflow, reduced-motion respected, semantic structure, skip-link, new-tab a11y notes.
- **FAQ (H10).** Targets real beginner anxieties with progressive disclosure.

---

## 5. Persona conversion read

| Persona | Verdict | Make-or-break |
|---|---|---|
| Total Newcomer | Converts on copy, lost at CTA | Reassurance lands; then can't claim |
| Daggerheart First-Timer / Tourist | At risk | Wants explicit "no Daggerheart experience needed" (weakened live) |
| Critical Role Curious | Strong fit, lost at CTA | Built for them; dead-end kills it |
| Mox Regular | Warmest lead, lost at CTA | Just needs a working register button |
| Connection Seeker | At risk | Needs "are these my people" proof + "more sessions?" |
| Reluctant Plus-One | Converts at table, not page | Needs easy-win premade surfaced |
| Severance/Office-Comedy Fan | Best-served | The satire *is* the hook; protect it |

Transcripts: [02-usability-tests](02-usability-tests/). Focus group: [03-focus-group](03-focus-group/focus-group.md).

---

## 6. "Does it feel AI?" — explicit verdict
**Copy: No.** Authored brand voice, consistent comedic premise grounded in real campaign canon; jokes too specific to be generic LLM output. Only risk: the reassurance boilerplate repetition (F9).
**Visuals: Partly yes.** Location renders + the group composite read as AI-generated fantasy art; no real-human/real-table photo anchors authenticity. Mitigations in [05-visual-qa](05-visual-qa/visual-qa-report.md): add 1–2 real photos (Mox table, Kyle, real dice/sheets) and treat location art as stylized texture, not hero realism.

---

## 7. Method & limits
- Heuristic scores are evidence-bound to live rendered captures + visual anchors A1–A7 (`screenshots/`).
- Usability personas are **synthetic, host-interpreted walkthroughs** (UXHC policy), not real-participant research. Directional. **Next step:** a 30-min moderated test with 3–5 real beginners on Task 5 (claim a seat) + mobile FAQ path.
- Scoring platform = desktop; mobile findings from live 390px + CSS inspection.
- Hero-over-image contrast not numerically sampled — flagged for axe/Lighthouse in [04-code-qa](04-code-qa/code-qa-report.md).
