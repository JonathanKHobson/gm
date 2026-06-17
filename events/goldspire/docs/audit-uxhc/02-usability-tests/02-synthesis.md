# Usability Test — Thematic Synthesis

Synthesized via the UXHC Transcript-Analysis flow (sentiment → themes → representative quote → severity → heuristic mapping → next step).

## Task success matrix

| Task | P1 | P2 | P3 | P4 | P5 | P6 | P7 | Success rate |
|---|---|---|---|---|---|---|---|---|
| T1 Is this for me? | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | 5✅/2⚠️ |
| T2 Find the facts | ✅ | ✅ | ✅ | ✅ | ✅ | – | ✅ | 6✅ |
| T3 No forced acting? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **7✅** |
| T4 Reach FAQ/explainer | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | 6✅/1⚠️ |
| T5 **Claim a seat** | ❌ | ❌ | ❌ | ❌ | ❌ | – | ❌ | **0✅ / 6❌** |
| T6 Mobile header nav | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | **0✅ / 7⚠️** |

## Themes (ranked by impact)

### Theme 1 — "I decided yes and couldn't act on it." (severity 3)
The defining theme. Every persona that tried to convert was stopped by the coming-soon interstitial.
> *Representative quote (P3, Critical Role Curious):* "I'm the easiest yes you'll ever get and I can't give it to you."
- **Frequency:** 6/7 · **Severity:** Major · **Heuristics:** H13, H07, H01, H09
- **Next step:** Add waitlist/notify capture now; wire registration when live. → [BUG-01](../bugs/BUG-01-cta-dead-end/report.md)

### Theme 2 — "On my phone, I lost the map." (severity 2)
> *Representative quote (P1):* "It just keeps scrolling — where did the FAQ link go?"
- **Frequency:** 7/7 · **Severity:** Moderate · **Heuristics:** H11, H03
- **Next step:** Restore mobile header nav (proven pattern exists on the Daggerheart page). → [BUG-02](../bugs/BUG-02-mobile-nav-stranded/report.md)

### Theme 3 — "Reassured, but is it real?" (severity 2, conversion-limiting)
The trust/vibe personas (P5, and P6 by proxy) wanted proof the table is real people, plus a hint about future sessions.
> *Representative quote (P5, Connection Seeker):* "The page is all promise, no proof."
- **Frequency:** 2/7 (but the highest-LTV personas) · **Severity:** Moderate · **Heuristics:** H04, H13
- **Next step:** Add 2–3 player testimonials + a "more sessions may follow" line. → [BUG-05](../bugs/BUG-05-no-social-proof/report.md)

### Theme 4 — "Tell me *this system* is fine, not just beginners." (severity 1–2)
> *Representative quote (P2):* "It doesn't say 'no *Daggerheart* experience needed' up top — that's the line I care about."
- **Frequency:** 2/7 (P2, P3) · **Severity:** Moderate for system-tourists · **Heuristics:** H07, H14
- **Next step:** Restore explicit "no Daggerheart experience needed" above the fold. → [BUG-09](../bugs/BUG-09-dropped-daggerheart-reassurance/report.md)

### Theme 5 — "The jokes are why I clicked." (positive — protect)
> *Representative quote (P7):* "Don't sand off the jokes."
- **Frequency:** 3/7 explicitly delighted · **Severity:** n/a (strength) · **Heuristics:** H02, H12, H14
- **Next step:** Keep the voice; only relocate jokes that block scanning (eyebrows/headings), not remove them. → [06-copy-rewrites](../06-copy-rewrites/)

### Theme 6 — "Okay, I get it." (severity 1)
A couple of personas noticed the reassurance repeats often enough to feel like protesting-too-much.
- **Frequency:** 2/7 · **Severity:** Cosmetic · **Heuristics:** H08, H14
- **Next step:** Consolidate reassurance to ~3 placements.

## Interview-validity check (UXHC guard)
No self-report discrepancies that *inflate* the score; in fact the opposite — several personas rated the page highly (4–5) **despite** failing T5. Per the guard, **behavior is weighted over self-report**: the page *feels* great and *converts* poorly. Do not let the warm sentiment hide the conversion failure.

## One-line conclusion
**The page wins hearts and loses signups.** The persuasion layer is excellent; the transaction layer is missing. Close the transaction layer and this becomes a high-converting event page.
