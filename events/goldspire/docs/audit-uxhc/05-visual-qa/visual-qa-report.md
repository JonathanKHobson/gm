# Visual QA — Goldspire Event + Daggerheart Resource

Reviewed from live rendered captures (desktop 1440 / mobile 390) in [`../screenshots/`](../screenshots/).

**Overall visual quality: A− / very strong.** The event page is genuinely well-designed: cinematic hero, confident type system (Fraunces display + Inter body + Space Grotesk accents), disciplined dark/light band rhythm, generous spacing, no clutter, no overflow. The brand color world (forest green / cream / gold / muted teal) is cohesive across both pages. The weak spots are (1) the **AI-art tells in the imagery**, (2) the resource page being **visually flat** next to the event page, and (3) a few small hierarchy/contrast items to verify.

## Execution status — 2026-06-17

| Finding | Status | Resolution |
|---|---|---|
| V1 AI-art/authenticity tell | Improved | Added a compact proof moment using a real past-table photo and player-made Peril to Profit art. The section is framed as past GameMasterKyle/player creativity, not literal Goldspire scene art. |
| V2 Resource page flatness | Improved | Added a restrained proof band and closing CTA/footer to `/resources/daggerheart.html` without redesigning the page. |
| V3 Hero contrast | Monitored | Rendered review found no collision/overlap. Full numeric axe/Lighthouse certification remains a future accessibility slice. |
| V4 Reassurance density | Improved | Copy pass consolidated key reassurance into hero, assurance strip, new-player section, and FAQ while keeping beginner clarity. |
| V5 Quick-fact redundancy | Complete | Seats tile now reads `5`. |
| V6 Location tile legibility | Improved | Current route tiles render without overflow and source-status leakage. Broader media performance/retreatment remains backlog with C6. |

---

## Evidence
| Screenshot | What it shows |
|---|---|
| `goldspire-desktop-full.png` | Full event page, desktop band rhythm |
| `goldspire-desktop-hero.png` | Above-the-fold hero, fact grid, CTAs |
| `goldspire-mobile-hero.png` | Mobile hero + stranded header |
| `daggerheart-desktop-full.png` | Resource page (text-card heavy, no footer) |
| `daggerheart-mobile-full.png` | Resource page mobile |
| `coming-soon-desktop.png` | The CTA dead-end |

---

## ✅ Strengths
- **Hero composition (A1):** strong focal flow — kicker → big serif H1 → punchy hook → fact grid → venue card → two ranked CTAs → witty microline. Cast art on the right balances the text block. Genuinely poster-like.
- **Band rhythm:** alternating dark (hero, route preview, final CTA) and cream sections creates pace and prevents fatigue across a long page.
- **Type hierarchy:** clear, consistent scale; section eyebrows + H2 + lead is a tidy, repeatable pattern.
- **Cards:** courier cards, fact tiles, and FAQ `<details>` are consistent, with hover lift and clear affordance.
- **Mobile (event):** content reflows cleanly; the mobile courier strip + stacked hero read well; no overflow at 390.

---

## 🔴 Findings

### V1 — "Does it feel AI?" → the imagery is the tell (Medium) → [BUG (visual)]
The **copy does not feel AI** (see voice analysis below), but several images do:
- **Location renders** (`forest-route-gate`, `old-canopy-road`, `quiet-destination`, `roadside-co-op`): soft, slightly waxy, generic-fantasy lighting; the kind of midjourney-ish render readers increasingly clock as AI. On the dark "Route preview" band they also read **muddy/low-contrast** at thumbnail size — almost like empty panels at a glance.
- **Group character image** (`courier-crew-background-removed.png`): the "background removed" composite has the floating-cutout look; figures don't share a consistent ground plane.
- **Custom icons** (session-zero, type-pc, creature, item): fine as decoration, but generic.
- **Individual character portraits** fare best — they have enough specificity to read as intentional.

**Why it matters:** for an event whose *credibility* is "a real human GM runs a warm table," AI-looking art subtly undercuts the authenticity the copy works hard to build. None of the trust-driven personas (Connection Seeker, Reluctant Plus-One) get a single *real* human or real-table signal.

**Fixes (described, not applied):**
1. Add **1–2 real photos** — the actual Mox table, Kyle, real dice/character sheets. One authentic photo near the host band does more for trust than any render.
2. Treat location art as **atmospheric texture, not realism**: smaller, duotone/treated to match the palette (forest-green/gold wash), or as background bands with overlaid captions, so the "AI realism" reads as deliberate stylization.
3. Increase contrast/separation of the location tiles on the dark band (lighten the band behind them or add a subtle frame) so they don't read as empty boxes.
4. Re-ground or re-cut the group image so the cast shares one floor/lighting, or replace with the individual portraits laid out as a team.

### V2 — Resource page is visually flat vs. the event page (Medium) → relates to [BUG-03](../bugs/BUG-03-daggerheart-no-footer/report.md)
`daggerheart-desktop-full.png` is a long stack of near-identical cream cards on a warm gradient, **no imagery at all**, and it **dead-ends** with no footer. After the cinematic event page, it feels like a different, plainer site. It risks reading as generic/templated — the one place the *design* (not the copy) edges toward "AI default."
- **Fix:** add light visual texture (a small banner image or a couple of the character portraits), vary card treatment for the "basics" vs "links" groups, and add the closing CTA/footer so it doesn't end on a cliff.

### V3 — Hero text contrast over imagery (Low, verify) → [code C7](../04-code-qa/code-qa-report.md)
Hero copy is near-white over the forest image with a gradient scrim. Looks readable in capture but wasn't numerically sampled over the lightest region. Verify ≥4.5:1 with axe/Lighthouse; if marginal, deepen the scrim on the text side.

### V4 — Reassurance density reads slightly repetitive (Low) 
Visually, the reassurance appears as: gold notice strip → two-path cards → beginners checklist chips → FAQ. Four consecutive "don't worry" modules can feel like the design is over-reassuring. Consolidating (see [copy F9](../00-MASTER-AUDIT-REPORT.md)) would also tighten the visual rhythm.

### V5 — Quick-fact tile redundancy (Low) → [BUG-07](../bugs/BUG-07-redundant-microcopy-nav/report.md)
The "Seats / 5 seats" tile repeats the label in the value. Trim the value to "5" for a cleaner tile grid.

### V6 — Location tiles legibility on dark band (Low) 
On "The road has passed at least one inspection," the four location images + captions sit on a deep green field; at smaller widths the images and their captions lose separation. Add spacing/borders or lighten tile backgrounds.

---

## "Does it feel AI?" — consolidated verdict

| Layer | Verdict | Why |
|---|---|---|
| **Copy / voice** | **No — authored** | Specific, consistent corporate-fantasy satire grounded in real campaign canon; jokes too particular to be generic LLM output. |
| **Layout / design system** | **No — human-considered** | Intentional hierarchy, band rhythm, restraint; not a template default. |
| **Imagery** | **Partly yes** | Location renders + group composite have AI-art tells; no real-human/real-table photo to anchor authenticity. |
| **Resource page** | **Borderline** | Visually flat, all-text cards, dead-end — the one surface that reads "default." |

**Net:** The site does **not** broadly "feel AI" — but the *imagery* is where a skeptical visitor would sense it. The single highest-impact authenticity move is adding one or two **real photos** of the actual table/host.

## Visual fix priority
1. Add a real photo (host/table) + re-treat location art (V1) · 2. Give the resource page texture + footer (V2) · 3. Verify hero contrast (V3) · 4. Trim reassurance + fact redundancy (V4/V5) · 5. Dark-band tile legibility (V6).
