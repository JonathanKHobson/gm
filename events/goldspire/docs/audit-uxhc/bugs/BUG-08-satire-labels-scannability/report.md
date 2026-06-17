# BUG-08 — Satirical section labels reduce scannability for total newcomers

**Severity:** Low–Medium · UXHC: H14 sev 2 (jargon/scan load), H07 sev 1, H04 sev 1
**Status:** Complete · **Type:** Content design / scannability

![Section labels in context](../../screenshots/goldspire-desktop-full.png)

---

## Bug Report Checklist
**Before you start**
- [x] Searched existing issues to confirm it's not a duplicate

**Required fields**
- [x] Clear, specific title
- [x] Concise bug description
- [x] URL where the issue occurs
- [x] Full step-by-step reproduction steps
- [x] Expected behavior stated
- [x] Device type selected
- [x] Operating system selected

**Environment details**
- [x] Browser(s) selected
- [x] Browser version(s) included

**Helpful additions**
- [x] Screenshots or video attached
- [x] Relevant feature flags noted (none)
- [x] Additional context added

**Before submitting**
- [x] Reviewed contributing guidelines, security policy, and code of conduct (N/A — internal audit)

---

## Description
Several standard sections are labeled purely in corporate-satire voice, so a nervous first-timer scanning the page can't tell what the section *is* without reading it. Examples: **"Provisional hire info"** = logistics (when/where/price/bring); **"Things Management is willing to clarify"** = the FAQ; the "What you will do at the table" cards are titled **"Training Memo / Safety Update / Crew Protocol."** The jokes are good; the problem is they sit on the *labels* (the scanning layer) rather than only in the *prose*.

> This is **not** a request to reduce the humor. The voice is an asset and is canon to the Peril to Profit world. The fix keeps every joke and adds a literal signpost.

## URL
`https://jonathankhobson.github.io/gm/events/goldspire/`

## Steps to reproduce
1. Open the event page as a total newcomer.
2. Skim section eyebrows/headings looking for "the practical details" and "FAQ."
3. Observe that "Provisional hire info" and "Things Management is willing to clarify" require decoding; some readers won't be sure a label is a joke vs. real info.

## Expected behavior
A reader can scan and find function (logistics, FAQ, what-happens, safety, etiquette) from labels alone, with the satire delivered in body copy.

## Actual behavior
Function is encoded in jokes at the label level, adding scan load for the exact audience (Total Newcomer, Reluctant Plus-One) the page is for. Two usability personas flagged this independently; the focus group reached consensus ("joke in the prose, clarity in the label").

## Environment
- **Device type:** Desktop + Mobile
- **Operating system:** OS-independent; verified macOS
- **Browser(s):** Chromium (Playwright)
- **Browser version:** current bundled (2026-06)

## Screenshots
- `../../screenshots/goldspire-desktop-full.png`

## Applied fix
Keep the satire; add a literal signpost (full mapping in [`06-copy-rewrites/02-section-labels-and-faq.md`](../../06-copy-rewrites/02-section-labels-and-faq.md)):
- "Provisional hire info" → eyebrow **"Event details"** + keep satirical heading.
- "Things Management is willing to clarify" → **"FAQ · Things Management is willing to clarify."**
- Card titles retained for tone with a plain descriptor under each (Training Memo / Safety Update / Crew Protocol).

## Verification
- [x] Each section's function is clear from its label
- [x] Existing jokes retained in prose
- [x] Scan task passed in local checks
