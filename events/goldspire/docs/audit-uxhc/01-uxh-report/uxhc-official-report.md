# Goldspire + Daggerheart UXHC Audit (Live)

Generated: 2026-06-17

## Executive Summary

- Platform: desktop
- Core grade: A+ (90.41%) - Excellent - exceeds standard
- Expanded grade: A (87.49%)
- Overall label: A - Strong - meets standard
- Plain-language read: The biggest visible usability risk is customer Journey and Satisfaction needs targeted review. It affects Customer Journey and Satisfaction and should be fixed before broader polish.
- Before using this interface: Before using this interface, address Customer Journey and Satisfaction first: Review the affected element against Customer Journey and Satisfaction and make the next user action clearer, safer, or easier to recover from.
- Top priority: Customer Journey and Satisfaction: Customer Journey and Satisfaction needs targeted review
- One recommendation: Review the affected element against Customer Journey and Satisfaction and make the next user action clearer, safer, or easier to recover from.
- Source status: partial
- Active scope: Active scope: H1-H14, 102/102 scored
- Accessibility Readiness Signal: WCAG AAA-level criteria are implicated by Surface accessibility needs targeted review; this remains evidence-limited until manual accessibility testing.
- Cultural Context Signal: Local Contexts And Traditional Knowledge Labels flags Consistency and trust cues need review as needing evidence-bound local or community-context validation.

## Heuristic Grade Table

| Heuristic | Items | Avg Severity | Quality | Grade |
|---|---:|---:|---:|---|
| Visibility of System Status | 9 | 0.56 | 86.11% | A |
| Match Between System and the Real World | 3 | 0.0 | 100.0% | A++ |
| User Control and Freedom | 5 | 0.6 | 85.0% | A |
| Consistency and Standards | 21 | 0.19 | 95.24% | A++ |
| Error Prevention | 5 | 0.0 | 100.0% | A++ |
| Recognition Rather Than Recall | 4 | 0.0 | 100.0% | A++ |
| Flexibility and Efficiency of Use | 9 | 0.67 | 83.33% | A- |
| Aesthetic and Minimalist Design | 16 | 0.12 | 96.88% | A++ |
| Help Users Recognize, Diagnose, and Recover from Errors | 2 | 1.5 | 62.5% | C+ |
| Help and Documentation | 5 | 0.2 | 95.0% | A++ |
| Accessibility and Ease of Access | 4 | 1.0 | 75.0% | B+ |
| Empathetic Engagement and Inclusion | 6 | 0.33 | 91.67% | A+ |
| Customer Journey and Satisfaction | 6 | 0.83 | 79.17% | B+ |
| UX Writing / Content and Tone | 7 | 1.0 | 75.0% | B+ |

## Audit Scope and Omitted Profiles

- Active scope: Active scope: H1-H14, 102/102 scored
- Scope status: all_optionals_active
- Optional profile mode: scoped
- Full advanced requested: False
- Scored optional profiles: accessibility (h11), inclusion (h12), journey (h13), ux_writing (h14)
- Omitted optional profiles: none

## Severity Summary

- Severity 4: 0
- Severity 3: 1
- Severity 2: 7
- Severity 1: 25
- Severity 0: 69

## Top Findings

### Customer Journey and Satisfaction needs targeted review

- Checklist item: h13_d_02
- Heuristic: Customer Journey and Satisfaction
- Severity: 3 - Major - high priority fix
- Evidence: coming-soon:A4
- Confidence: high
- Issue: Journey breaks at conversion: CTA dead-ends, mobile nav stranded, resource page no path back.
- Recommendation: Review the affected element against Customer Journey and Satisfaction and make the next user action clearer, safer, or easier to recover from.
- Supporting lenses: CX Cumulative Perception, CX Channel Memory

### Surface accessibility needs targeted review

- Checklist item: h11_d_02
- Heuristic: Accessibility and Ease of Access
- Severity: 2 - Minor - low priority fix
- Evidence: goldspire-mobile:A3
- Confidence: high
- Issue: Mobile operability gap: header nav links unreachable (hamburger display:none, navlinks hidden).
- Recommendation: Run a surface accessibility pass on the affected screen and fix the visible access barrier before deeper compliance review.
- Supporting lenses: WCAG POUR Principles, Mobile, Touch, Orientation, And Responsive Access

### Consistency and trust cues need review

- Checklist item: h04_d_13
- Heuristic: Consistency and Standards
- Severity: 2 - Minor - low priority fix
- Evidence: goldspire-desktop:A5
- Confidence: high
- Issue: No testimonials/social proof.
- Recommendation: Audit repeated navigation, labels, components, and trust cues, then align any pattern that changes meaning across screens.
- Supporting lenses: Local Contexts And Traditional Knowledge Labels, Shneiderman's Eight Golden Rules

### Flexibility and Efficiency of Use needs targeted review

- Checklist item: h07_d_03
- Heuristic: Flexibility and Efficiency of Use
- Severity: 2 - Minor - low priority fix
- Evidence: coming-soon:A4
- Confidence: high
- Issue: Registration path cannot be completed.
- Recommendation: Review the affected element against Flexibility and Efficiency of Use and make the next user action clearer, safer, or easier to recover from.
- Supporting lenses: ISO 9241-11 Usability In Context, ISO/IEC 25019 And 25022 Quality In Use

### Missing-page recovery may leave users stuck

- Checklist item: h09_d_01
- Heuristic: Help Users Recognize, Diagnose, and Recover from Errors
- Severity: 2 - Minor - low priority fix
- Evidence: 404:A7
- Confidence: high
- Issue: Generic GitHub 404, no custom page.
- Recommendation: Create a helpful missing-page state with plain language, search, home, and the most likely recovery links.
- Supporting lenses: Plain Language Principle, Peak-End Rule

### Interface copy may be too hard to scan

- Checklist item: h14_d_03
- Heuristic: UX Writing / Content and Tone
- Severity: 2 - Minor - low priority fix
- Evidence: host_supplied-1
- Confidence: medium
- Issue: Intentional corporate jargon raises load for the total newcomer; some labels obscure function.
- Recommendation: Replace internal language with short, everyday wording that users can scan at the smallest supported viewport.
- Supporting lenses: Plain Language Principle, Cognitive Load

### Users may lack clear recovery paths

- Checklist item: h03_d_02
- Heuristic: User Control and Freedom
- Severity: 2 - Minor - low priority fix
- Evidence: goldspire-mobile:A3
- Confidence: high
- Issue: Mobile header strands nav; resource page dead-ends.
- Recommendation: Add or clarify exits, back behavior, and recovery controls so users can leave wrong paths without losing context.
- Supporting lenses: Peak-End Rule, Mediated Payment And Trust Recovery

### Page status and purpose need clearer cues

- Checklist item: h01_d_07
- Heuristic: Visibility of System Status
- Severity: 2 - Minor - low priority fix
- Evidence: coming-soon:A4
- Confidence: high
- Issue: 'Claim a Seat' link name does not match destination.
- Recommendation: Add clearer page titles, state cues, and primary-action emphasis so users know where they are and what is available.
- Supporting lenses: Information Scent, CX Acknowledgement Clock

### Content may not be perceivable for everyone

- Checklist item: h11_d_01
- Heuristic: Accessibility and Ease of Access
- Severity: 1 - Cosmetic - fix if time permits
- Evidence: url-1
- Confidence: medium
- Issue: Decorative icons empty alt; meaningful images have alt; minor nuances to verify.
- Recommendation: Add text alternatives and non-color cues so critical content remains perceivable across assistive and display settings.
- Supporting lenses: WCAG POUR Principles, Text Alternatives And Media Equivalents

### Surface accessibility needs targeted review

- Checklist item: h11_d_03
- Heuristic: Accessibility and Ease of Access
- Severity: 1 - Cosmetic - fix if time permits
- Evidence: host_supplied-1
- Confidence: medium
- Issue: Hero text over imagery + heavy satire warrant contrast/readability check.
- Recommendation: Run a surface accessibility pass on the affected screen and fix the visible access barrier before deeper compliance review.
- Supporting lenses: WCAG POUR Principles, Language, Readability, And Predictability


## Owner-Role Triage Matrix

| Owner | Linked finding | Next action | Impact | Effort | Confidence | Supporting roles |
|---|---|---|---|---|---|---|
| Research | h13 / h13_d_02 | Review the affected element against Customer Journey and Satisfaction and make the next user action clearer, safer, or easier to recover from. | high | Low-Medium | high |  |
| Engineer | h11 / h11_d_02 | Run a surface accessibility pass on the affected screen and fix the visible access barrier before deeper compliance review. | medium | Medium | high |  |
| Product | h04 / h04_d_13 | Audit repeated navigation, labels, components, and trust cues, then align any pattern that changes meaning across screens. | medium | Low | high |  |
| Product | h07 / h07_d_03 | Review the affected element against Flexibility and Efficiency of Use and make the next user action clearer, safer, or easier to recover from. | medium | Low-Medium | high |  |
| Engineer | h09 / h09_d_01 | Create a helpful missing-page state with plain language, search, home, and the most likely recovery links. | medium | Medium | high |  |
| Designer | h14 / h14_d_03 | Replace internal language with short, everyday wording that users can scan at the smallest supported viewport. | medium | Low | medium |  |
| Engineer | h03 / h03_d_02 | Add or clarify exits, back behavior, and recovery controls so users can leave wrong paths without losing context. | medium | Medium | high |  |
| Product | h01 / h01_d_07 | Add clearer page titles, state cues, and primary-action emphasis so users know where they are and what is available. | medium | Low-Medium | high |  |
| Engineer | h11 / h11_d_01 | Add text alternatives and non-color cues so critical content remains perceivable across assistive and display settings. | low | Medium | medium |  |
| Engineer | h11 / h11_d_03 | Run a surface accessibility pass on the affected screen and fix the visible access barrier before deeper compliance review. | low | Medium | medium |  |

## Checklist Issue Ledger

| Item | Rating | Confidence | Evidence | Rationale |
|---|---:|---|---|---|
| h01_d_04 | 1.0 | high | coming-soon:A4 | Primary action prominent but resolves to a coming-soon page. |
| h01_d_06 | 1.0 | medium | url-1 | No active-state indicator for current page in nav. |
| h01_d_07 | 2.0 | high | coming-soon:A4 | 'Claim a Seat' link name does not match destination. |
| h01_d_08 | 1.0 | high | daggerheart-desktop:A6 | Resource page lacks a footer with standard nav. |
| h03_d_01 | 1.0 | medium | url-1 | No search; acceptable for a microsite. |
| h03_d_02 | 2.0 | high | goldspire-mobile:A3, daggerheart-desktop:A6 | Mobile header strands nav; resource page dead-ends. |
| h04_d_07 | 1.0 | medium | host_supplied-1 | Satirical relabeling departs from general web usage. |
| h04_d_11 | 1.0 | high | daggerheart-desktop:A6 | Nav differs between pages; resource page has no footer. |
| h04_d_13 | 2.0 | high | goldspire-desktop:A5 | No testimonials/social proof. |
| h07_d_02 | 1.0 | medium | host_supplied-1 | Satirical section eyebrows less unambiguous. |
| h07_d_03 | 2.0 | high | coming-soon:A4 | Registration path cannot be completed. |
| h07_d_04 | 1.0 | medium | host_supplied-1 | Corporate-satire vocab may be unfamiliar to newcomers. |
| h07_d_06 | 1.0 | medium | host_supplied-1 | Live lede dropped explicit 'no Daggerheart experience needed'. |
| h07_d_08 | 1.0 | medium | url-1 | Custom game icons may be opaque; decorative. |
| h08_d_07 | 1.0 | medium | url-1 | Reassurance repeats 6+ times. |
| h08_d_10 | 1.0 | medium | url-1 | Some narrative paragraphs run long. |
| h09_d_01 | 2.0 | high | 404:A7 | Generic GitHub 404, no custom page. |
| h09_d_02 | 1.0 | high | coming-soon:A4 | Coming-soon explains state but no capture. |
| h10_d_05 | 1.0 | medium | coming-soon:A4 | Indirect contact; no direct channel on event page. |
| h11_d_01 | 1.0 | medium | url-1 | Decorative icons empty alt; meaningful images have alt; minor nuances to verify. |
| h11_d_02 | 2.0 | high | goldspire-mobile:A3 | Mobile operability gap: header nav links unreachable (hamburger display:none, navlinks hidden). |
| h11_d_03 | 1.0 | medium | host_supplied-1 | Hero text over imagery + heavy satire warrant contrast/readability check. |
| h12_d_05 | 1.0 | medium | goldspire-mobile:A3 | Warm a11y note but mobile nav + contrast caveats. |
| h12_d_06 | 1.0 | high | coming-soon:A4 | Agency emphasized but key action not completable. |
| h13_d_02 | 3.0 | high | coming-soon:A4, goldspire-mobile:A3, daggerheart-desktop:A6 | Journey breaks at conversion: CTA dead-ends, mobile nav stranded, resource page no path back. |
| h13_d_04 | 1.0 | medium | coming-soon:A4 | Indirect support/feedback path. |
| h13_d_06 | 1.0 | medium | coming-soon:A4 | No privacy note; needed once capture is added. |
| h14_d_02 | 1.0 | medium | host_supplied-1 | Mostly clear; satire occasionally buries the literal fact. |
| h14_d_03 | 2.0 | medium | host_supplied-1 | Intentional corporate jargon raises load for the total newcomer; some labels obscure function. |
| h14_d_04 | 1.0 | medium | host_supplied-1 | Nav labels simple; section eyebrows trade clarity for voice. |
| h14_d_05 | 1.0 | high | coming-soon:A4 | CTAs active/ranked but primary promises an action it cannot deliver. |
| h14_d_06 | 1.0 | medium | url-1 | A few paragraphs exceed three lines. |
| h14_d_07 | 1.0 | medium | goldspire-desktop:A1 | Above-fold hook cinematic but plain 'what this is' is a small kicker; beginner/system reassurance lighter on live. |

## Complete Checklist Scores

<details>
<summary>Visibility of System Status (h01) - 9 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h01_d_01 | Every interface begins with a title/header that describes page contents | 0.0 | high |  | url-1 | Both pages open with clear descriptive H1s. |
| h01_d_02 | Headings and subheadings are short, straightforward and descriptive | 0.0 | high |  | url-1 | Headings descriptive though satirical. |
| h01_d_03 | Value proposition is clearly stated on the home page (tagline or welcome blurb) | 0.0 | high |  | goldspire-desktop:A1 | Value prop clear: beginner Daggerheart one-shot, heroes provided. |
| h01_d_04 | The items on the home page are clearly focused on primary actions | 1.0 | high |  | coming-soon:A4 | Primary action prominent but resolves to a coming-soon page. |
| h01_d_05 | Each page is clearly branded so that the user knows they are on the same site | 0.0 | high |  | url-1 | Consistent branding. |
| h01_d_06 | Navigation makes it clear which page I am on | 1.0 | medium |  | url-1 | No active-state indicator for current page in nav. |
| h01_d_07 | Link names match the title of destination pages, so users will know when they have reached the intended page | 2.0 | high |  | coming-soon:A4 | 'Claim a Seat' link name does not match destination. |
| h01_d_08 | Standard elements (page titles, site navigation, page navigation, privacy policy, etc.) are easy to locate | 1.0 | high |  | daggerheart-desktop:A6 | Resource page lacks a footer with standard nav. |
| h01_d_09 | Logo is in a consistent location, and clicking the logo returns the user back to the home page | 0.0 | high |  | url-1 | Logo links home consistently. |

</details>

<details>
<summary>Match Between System and the Real World (h02) - 3 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h02_d_01 | Navigation tabs are located at the top of the page, and look like clickable versions of real-world tabs | 0.0 | high |  | url-1 | Top nav, clearly clickable. |
| h02_d_02 | Items that are not clickable do not have characteristics that suggest that they are clickable | 0.0 | medium |  | url-1 | No misleading affordances. |
| h02_d_03 | Items that are clickable look like they are clickable | 0.0 | high |  | url-1 | Clickables look clickable. |

</details>

<details>
<summary>User Control and Freedom (h03) - 5 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h03_d_01 | There is a search box | 1.0 | medium |  | url-1 | No search; acceptable for a microsite. |
| h03_d_02 | There are clearly marked exits on every page allowing the user to bail out of the current task without having to depend on the browser Back button | 2.0 | high |  | goldspire-mobile:A3, daggerheart-desktop:A6 | Mobile header strands nav; resource page dead-ends. |
| h03_d_03 | The site does not disable the browser Back button and the Back button appears on the browser toolbar on every page | 0.0 | high |  | url-1 | Back button intact. |
| h03_d_04 | Clicking the back button always takes the user back to the page they came from | 0.0 | high |  | url-1 | Back behaves normally. |
| h03_d_05 | Undo and redo are supported | 0.0 | high |  | url-1 | No destructive actions. |

</details>

<details>
<summary>Consistency and Standards (h04) - 21 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h04_d_01 | In your expert opinion, site content does not look like advertisements | 0.0 | high |  | url-1 | Not ad-like. |
| h04_d_02 | Clickable elements use a consistent style/color for primary, secondary, and tertiary actions | 0.0 | high |  | url-1 | Consistent button styles. |
| h04_d_03 | Value proposition is clearly stated on the home page (tagline or welcome blurb) | 0.0 | high |  | goldspire-desktop:A1 | Value prop restated. |
| h04_d_04 | Navigation choices are ordered in the most logical or task-oriented manner, with less important corporate information at the bottom | 0.0 | medium |  | url-1 | Nav ordered logically. |
| h04_d_05 | All corporate information is grouped in one distinct area, such as About Us | 0.0 | medium |  | url-1 | Host info grouped. |
| h04_d_06 | The home page of the site has a memorable URL | 0.0 | high |  | url-1 | Clean URL. |
| h04_d_07 | Terminology is consistent with general web usage | 1.0 | medium |  | host_supplied-1 | Satirical relabeling departs from general web usage. |
| h04_d_08 | There is a visible change when the mouse points at something clickable, excluding cursor changes | 0.0 | high |  | url-1 | Hover states present. |
| h04_d_09 | Hypertext links that invoke actions, such as downloads or new windows, are clearly distinguished from hypertext links that load another page | 0.0 | high |  | url-1 | New-tab sr-only note present. |
| h04_d_10 | If the site spawns new windows, these will not confuse the user and can be easily closed | 0.0 | high |  | url-1 | New tabs easily closed. |
| h04_d_11 | Menu instructions, prompts and messages appear in the same place on each screen | 1.0 | high |  | daggerheart-desktop:A6 | Nav differs between pages; resource page has no footer. |
| h04_d_12 | The content is up-to-date, authoritative and trustworthy | 0.0 | high |  | url-1 | Authoritative content. |
| h04_d_13 | The site contains third-party support, such as citations or testimonials, to verify the accuracy of information | 2.0 | high |  | goldspire-desktop:A5 | No testimonials/social proof. |
| h04_d_14 | It is clear that there is a real organization behind the site, such as a physical address or office photo | 0.0 | high |  | url-1 | Real venue/address/map. |
| h04_d_15 | The content is fresh: the site includes recent content | 0.0 | high |  | url-1 | Fresh dated event. |
| h04_d_16 | The site is free of typographic errors and spelling mistakes | 0.0 | high |  | url-1 | No typos. |
| h04_d_17 | The visual design is consistent, including colors, layout, iconography, etc. | 0.0 | high |  | url-1 | Consistent visual design. |
| h04_d_18 | On content pages, line lengths are neither too short (under 50 characters per line) nor too long (over 100 characters per line) when viewed in a standard browser width window | 0.0 | medium |  | url-1 | Comfortable line lengths. |
| h04_d_19 | Fonts are used consistently and are legible | 0.0 | high |  | url-1 | Legible consistent fonts. |
| h04_d_20 | The site can be used without scrolling horizontally | 0.0 | high |  | url-1 | No horizontal scroll. |
| h04_d_21 | Design components, such as radio buttons and checkboxes, are used appropriately | 0.0 | high |  | url-1 | No form components yet. |

</details>

<details>
<summary>Error Prevention (h05) - 5 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h05_d_01 | Pages are free of scroll stoppers: headings or page elements that create the illusion that users have reached the top or bottom of a page when they have not | 0.0 | medium |  | url-1 | No scroll stoppers. |
| h05_d_02 | The user does not need to consult user manuals or other external information to use the site | 0.0 | high |  | url-1 | No external manual needed. |
| h05_d_03 | User confirmation is required before carrying out potentially dangerous actions, such as deleting something | 0.0 | high |  | url-1 | No dangerous actions. |
| h05_d_04 | The site provides feedback that helps the user learn how to use the site | 0.0 | medium |  | url-1 | Reassurance teaches expectations. |
| h05_d_05 | There is sufficient space between targets to prevent the user from hitting multiple or incorrect targets | 0.0 | medium |  | url-1 | Adequate target spacing. |

</details>

<details>
<summary>Recognition Rather Than Recall (h06) - 4 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h06_d_01 | Search suggestions or filters are provided | 0.0 | medium |  | url-1 | Search N/A. |
| h06_d_02 | Each page is clearly labeled with a descriptive and useful title that makes sense as a bookmark | 0.0 | high |  | url-1 | Descriptive bookmarkable titles. |
| h06_d_03 | Links and link titles are descriptive and predictive, and there are no Click here links | 0.0 | high |  | url-1 | Descriptive link text. |
| h06_d_04 | Buttons and links show that they have been clicked | 0.0 | medium |  | url-1 | Focus/active states present. |

</details>

<details>
<summary>Flexibility and Efficiency of Use (h07) - 9 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h07_d_01 | Useful content is presented on the home page or within one click of the home page | 0.0 | high |  | url-1 | Key content on first page. |
| h07_d_02 | The terms used for navigation items and hypertext links are unambiguous and jargon-free | 1.0 | medium |  | host_supplied-1 | Satirical section eyebrows less unambiguous. |
| h07_d_03 | If there are product pages, they contain the detail necessary to make a purchase, and users can zoom in on product images | 2.0 | high |  | coming-soon:A4 | Registration path cannot be completed. |
| h07_d_04 | The words, phrases and concepts used will be familiar to the typical user | 1.0 | medium |  | host_supplied-1 | Corporate-satire vocab may be unfamiliar to newcomers. |
| h07_d_05 | Content feels friendly for new users | 0.0 | high |  | url-1 | Very friendly to new users. |
| h07_d_06 | Content feels customizable or useable for frequent or expert users | 1.0 | medium |  | host_supplied-1 | Live lede dropped explicit 'no Daggerheart experience needed'. |
| h07_d_07 | The screen density is appropriate for the target users and their tasks | 0.0 | high |  | url-1 | Appropriate density. |
| h07_d_08 | Icons and graphics are standard and/or intuitive (concrete and familiar) | 1.0 | medium |  | url-1 | Custom game icons may be opaque; decorative. |
| h07_d_09 | Where tooltips are used, they provide useful additional help and do not simply duplicate text in the icon, link or field label | 0.0 | high |  | url-1 | No tooltips. |

</details>

<details>
<summary>Aesthetic and Minimalist Design (h08) - 16 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h08_d_01 | By just looking at the home page, the first time user will understand where to start | 0.0 | high |  | goldspire-desktop:A1 | Clear starting point. |
| h08_d_02 | Primary actions are easy to find and understand | 0.0 | high |  | goldspire-desktop:A1 | Primary CTA easy to find. |
| h08_d_03 | Individual pages are free of clutter and irrelevant information, and attention-attracting features are used sparingly and only where relevant | 0.0 | high |  | url-1 | Free of clutter. |
| h08_d_04 | The home page is professionally designed and will create a positive first impression | 0.0 | high |  | goldspire-desktop:A1 | Professional first impression. |
| h08_d_05 | The home page looks like a home page; pages lower in the site will not be confused with it | 0.0 | high |  | url-1 | Landing reads as landing. |
| h08_d_06 | The site avoids advertisements, especially pop-ups | 0.0 | high |  | url-1 | No ads/popups. |
| h08_d_07 | Text is concise, with no needless instructions or welcome notes | 1.0 | medium |  | url-1 | Reassurance repeats 6+ times. |
| h08_d_08 | Pages use bulleted and numbered lists in preference to narrative text | 0.0 | high |  | url-1 | Lists used where helpful. |
| h08_d_09 | The most important items in a list are placed at the top | 0.0 | medium |  | url-1 | Important items lead. |
| h08_d_10 | Pages are quick to scan, with ample headings and subheadings and short paragraphs | 1.0 | medium |  | url-1 | Some narrative paragraphs run long. |
| h08_d_11 | Information is organized hierarchically, from the general to the specific, and the organization is clear and logical | 0.0 | high |  | url-1 | General-to-specific hierarchy. |
| h08_d_12 | Text links are long enough to be understood, but short enough to minimize wrapping, especially when used as a navigation list | 0.0 | high |  | url-1 | Good link text length. |
| h08_d_13 | On all pages, the most important information, such as frequently used topics, features and functions, is presented on the first screenful of information above the fold | 0.0 | medium |  | url-1 | Key info above fold. |
| h08_d_14 | The relationship between controls and their actions is obvious | 0.0 | high |  | url-1 | Controls map to actions. |
| h08_d_15 | There is a clear visual starting point to every page | 0.0 | high |  | goldspire-desktop:A1 | Clear visual entry point. |
| h08_d_16 | The site is pleasant to look at | 0.0 | high |  | goldspire-desktop:A1 | Attractive, cinematic. |

</details>

<details>
<summary>Help Users Recognize, Diagnose, and Recover from Errors (h09) - 2 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h09_d_01 | The site uses a customised 404 page, which includes tips on how to find the missing page and links to Home and Search | 2.0 | high |  | 404:A7 | Generic GitHub 404, no custom page. |
| h09_d_02 | Error messages contain clear instructions on what to do next, including form error states | 1.0 | high |  | coming-soon:A4 | Coming-soon explains state but no capture. |

</details>

<details>
<summary>Help and Documentation (h10) - 5 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h10_d_01 | Help is available and easy to find | 0.0 | high |  | url-1 | Help/FAQ easy to find. |
| h10_d_02 | FAQs are present if appropriate | 0.0 | high |  | url-1 | Strong FAQ targeting fears. |
| h10_d_03 | When giving instructions, pages tell users what to do rather than what to avoid doing | 0.0 | high |  | url-1 | Affirmative instructions. |
| h10_d_04 | The site shows users how to do common tasks where appropriate, such as demonstrations of the site's functionality | 0.0 | high |  | url-1 | Explains how a session works. |
| h10_d_05 | It is easy to contact someone for assistance and a reply is received quickly | 1.0 | medium |  | coming-soon:A4 | Indirect contact; no direct channel on event page. |

</details>

<details>
<summary>Accessibility and Ease of Access (h11) - 4 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h11_d_01 | P - Content alternatives are provided, content is adaptable, and content is easy to hear and see | 1.0 | medium |  | url-1 | Decorative icons empty alt; meaningful images have alt; minor nuances to verify. |
| h11_d_02 | O - All functionality is available and flexible, enough time is provided, content is safe, and content is easy to find | 2.0 | high |  | goldspire-mobile:A3 | Mobile operability gap: header nav links unreachable (hamburger display:none, navlinks hidden). |
| h11_d_03 | U - Content text is readable and understandable, content appears and operates in predictable ways, and users are helped to avoid and correct mistakes | 1.0 | medium |  | host_supplied-1 | Hero text over imagery + heavy satire warrant contrast/readability check. |
| h11_d_04 | R - Compatibility is maximized for current and future user agents | 0.0 | medium |  | url-1 | Standards-based, robust. |

</details>

<details>
<summary>Empathetic Engagement and Inclusion (h12) - 6 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h12_d_01 | The interface acknowledges and responds to user emotions, either through design, content, or interactive elements | 0.0 | high |  | url-1 | Names and soothes newcomer fears. |
| h12_d_02 | The design ensures users feel safe and secure, minimizing anxiety-inducing elements | 0.0 | high |  | url-1 | Safety/comfort messaging strong. |
| h12_d_03 | The content and design elements respect and reflect a wide range of cultural norms and values | 0.0 | high |  | url-1 | Inclusive pronouns and varied cast. |
| h12_d_04 | Information is presented in a way that shows understanding and consideration for the user's emotional state | 0.0 | high |  | url-1 | Emotionally considerate. |
| h12_d_05 | Design and content are accessible to users with various physical and cognitive abilities, promoting inclusivity | 1.0 | medium |  | goldspire-mobile:A3 | Warm a11y note but mobile nav + contrast caveats. |
| h12_d_06 | Features and functionalities empower users, giving them control and choice in their interactions | 1.0 | high |  | coming-soon:A4 | Agency emphasized but key action not completable. |

</details>

<details>
<summary>Customer Journey and Satisfaction (h13) - 6 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h13_d_01 | The interface reflects the brand's values and aesthetics consistently across all elements | 0.0 | high |  | url-1 | Highly consistent brand. |
| h13_d_02 | Navigation and workflows are intuitive, creating a seamless experience from start to finish | 3.0 | high |  | coming-soon:A4, goldspire-mobile:A3, daggerheart-desktop:A6 | Journey breaks at conversion: CTA dead-ends, mobile nav stranded, resource page no path back. |
| h13_d_03 | The system offers personalized options or content based on user data and preferences | 0.0 | high |  | url-1 | Personalization N/A. |
| h13_d_04 | Easy access to support and a straightforward method for users to provide feedback | 1.0 | medium |  | coming-soon:A4 | Indirect support/feedback path. |
| h13_d_05 | Features or elements make the user feel valued and rewarded for their engagement | 0.0 | medium |  | url-1 | Warm rewarding tone. |
| h13_d_06 | Clear communication about data usage, privacy policies, and other aspects that build user trust | 1.0 | medium |  | coming-soon:A4 | No privacy note; needed once capture is added. |

</details>

<details>
<summary>UX Writing / Content and Tone (h14) - 7 checklist items</summary>

| Item | Checklist text | Score | Confidence | Severity basis | Evidence | Rationale |
|---|---|---:|---|---|---|---|
| h14_d_01 | Follows the current product's established style guide and brand voice | 0.0 | high |  | host_supplied-1 | Exemplary on-canon corporate-fantasy voice; not generic AI filler. |
| h14_d_02 | Content is clear | 1.0 | medium |  | host_supplied-1 | Mostly clear; satire occasionally buries the literal fact. |
| h14_d_03 | Content avoids jargon and uses simple, everyday language | 2.0 | medium |  | host_supplied-1 | Intentional corporate jargon raises load for the total newcomer; some labels obscure function. |
| h14_d_04 | All UI labels use simple and concise words | 1.0 | medium |  | host_supplied-1 | Nav labels simple; section eyebrows trade clarity for voice. |
| h14_d_05 | Calls to action are specific, use active language, and are clearly organized by importance | 1.0 | high |  | coming-soon:A4 | CTAs active/ranked but primary promises an action it cannot deliver. |
| h14_d_06 | No paragraphs more than three lines | 1.0 | medium |  | url-1 | A few paragraphs exceed three lines. |
| h14_d_07 | The content above the fold, including headings, subheadings, and copy, makes each page's purpose clear and obvious | 1.0 | medium |  | goldspire-desktop:A1 | Above-fold hook cinematic but plain 'what this is' is a small kicker; beginner/system reassurance lighter on live. |

</details>


## Evidence Limits

- source: source preparation status was partial (ratings may be incomplete or unavailable)
- 404:A7 missing across 1 checklist rating; rating remains usable but traceability is reduced.
- coming-soon:A4 missing across 10 checklist ratings; rating remains usable but traceability is reduced.
- daggerheart-desktop:A6 missing across 4 checklist ratings; rating remains usable but traceability is reduced.
- 5 additional evidence-limit summary row(s) are collapsed below.

<details><summary>Show detailed evidence-limit notes (106 source notes)</summary>

- source: source preparation status was partial (ratings may be incomplete or unavailable)
- 404:A7: 1 checklist rating cite this missing evidence ref. Affected items: h09_d_01.
- coming-soon:A4: 10 checklist ratings cite this missing evidence ref. Affected items: h01_d_04, h01_d_07, h07_d_03, h09_d_02, h10_d_05, h12_d_06, h13_d_02, h13_d_04, h13_d_06, h14_d_05.
- daggerheart-desktop:A6: 4 checklist ratings cite this missing evidence ref. Affected items: h01_d_08, h03_d_02, h04_d_11, h13_d_02.
- goldspire-desktop:A1: 8 checklist ratings cite this missing evidence ref. Affected items: h01_d_03, h04_d_03, h08_d_01, h08_d_02, h08_d_04, h08_d_15, h08_d_16, h14_d_07.
- goldspire-desktop:A5: 1 checklist rating cite this missing evidence ref. Affected items: h04_d_13.
- goldspire-mobile:A3: 4 checklist ratings cite this missing evidence ref. Affected items: h03_d_02, h11_d_02, h12_d_05, h13_d_02.
- host_supplied-1: 9 checklist ratings cite this missing evidence ref. Affected items: h04_d_07, h07_d_02, h07_d_04, h07_d_06, h11_d_03, h14_d_01, h14_d_02, h14_d_03, h14_d_04.
- url-1: 68 checklist ratings cite this missing evidence ref. Affected items: h01_d_01, h01_d_02, h01_d_05, h01_d_06, h01_d_09, h02_d_01, h02_d_02, h02_d_03, h03_d_01, h03_d_03, h03_d_04, h03_d_05; plus 56 more.

</details>

## WCAG-Informed Accessibility Readiness

- Role: support-only advisory. This section does not change H01-H14 scores, 0-4 checklist ratings, report readiness, or finding order.
- WCAG Level Signal: AAA
- Top signal: Accessibility Readiness Signal: WCAG AAA-level criteria are implicated by Surface accessibility needs targeted review; this remains evidence-limited until manual accessibility testing.
- Caveat: Evidence-limited accessibility support guidance only; not WCAG, ADA, legal, procurement, or conformance certification.

| Lens / cue | Applies to | Evidence | Why it matters | Caveat |
|---|---|---|---|---|
| WCAG POUR Principles | h11/h11_d_02 | goldspire-mobile:A3 | The finding is supported by WCAG POUR framing, but the report remains a heuristic audit rather than a compliance certification. | UXHC can cite surface evidence but does not certify WCAG compliance. |
| Mobile, Touch, Orientation, And Responsive Access | h11/h11_d_02 | goldspire-mobile:A3 | The finding connects to WCAG mobile and responsive-access guidance: users should not lose content or function on touch and small-screen contexts. | UXHC can flag mobile access risk, but device and viewport testing are needed before WCAG conformance claims. |
| WCAG POUR Principles | h11/h11_d_01 | url-1 | The finding is supported by WCAG POUR framing, but the report remains a heuristic audit rather than a compliance certification. | UXHC can cite surface evidence but does not certify WCAG compliance. |
| WCAG POUR Principles | h11/h11_d_03 | host_supplied-1 | The finding is supported by WCAG POUR framing, but the report remains a heuristic audit rather than a compliance certification. | UXHC can cite surface evidence but does not certify WCAG compliance. |
| Bypass Blocks, Navigation, Headings, And Labels | h01/h01_d_06 | url-1 | The finding connects to WCAG navigation guidance: page structure, headings, labels, and bypass paths should help users find the task. | UXHC can flag navigation clarity risk, but source and assistive-technology review are required before WCAG conformance claims. |
| Error Identification, Suggestion, And Prevention | h14/h14_d_05 | coming-soon:A4 | The finding connects to WCAG input-assistance guidance: errors should be identified, explained, and recoverable without unnecessary re-entry. | UXHC can flag error-support risk, but WCAG evaluation needs rendered form states, programmatic associations, and assistive-technology checks; this is not conformance certification. |

## Cultural Context Integrity Advisory

- Role: support-only advisory. This section does not change H01-H14 scores, 0-4 checklist ratings, report readiness, or finding order.
- Context Integrity Index: 37 - High Context Risk
- Top signal: Cultural Context Signal: Local Contexts And Traditional Knowledge Labels flags Consistency and trust cues need review as needing evidence-bound local or community-context validation.
- Caveat: Evidence-limited support guidance only; not a cultural certification, moral judgment, universal cultural claim, or substitute for affected-community review.

| Lens / cue | Applies to | Evidence | Why it matters | Caveat |
|---|---|---|---|---|
| Local Contexts And Traditional Knowledge Labels | h04/h04_d_13 | goldspire-desktop:A5 | The finding may need stronger cultural provenance or permission cues at the point where users view, reuse, or export content. | Labels depend on community-defined protocols; absence of a label in the evidence is not proof that no protocol applies. |
| Mediated Payment And Trust Recovery | h03/h03_d_02 | goldspire-mobile:A3 | The finding may create trust or recovery risk in mediated payment contexts where fees, receipts, agent support, and disputes must be visible. | Financial-service risk depends on local regulation, agent networks, cost, literacy, and trust channels; UXHC cannot validate the business or legal model. |
| CJK Layout And Typography Requirements | h04/h04_d_11 | daggerheart-desktop:A6 | The finding may need CJK layout review because typography, line breaking, punctuation, or annotations could change the user's reading path. | CJK layout quality varies by language context and requires target-language content and rendered typography evidence, not translated strings alone. |
| Dadirri / Deep Listening | h10/h10_d_05 | coming-soon:A4 | The finding suggests a need for slower, relational feedback or support before the interface claims to understand user context. | Deep listening is culturally grounded in specific context and cannot be claimed from a generic interview or survey pattern. |
| Faith-Aware Observance Settings | h12/h12_d_06 | coming-soon:A4 | The finding may need faith-aware review because interaction timing, notifications, or settings could conflict with observance needs. | Faith-aware UX must be opt-in, private, and validated by the relevant tradition or community; it cannot be inferred from identity alone. |
| Mediated Payment And Trust Recovery | h01/h01_d_08 | daggerheart-desktop:A6 | The finding may create trust or recovery risk in mediated payment contexts where fees, receipts, agent support, and disputes must be visible. | Financial-service risk depends on local regulation, agent networks, cost, literacy, and trust channels; UXHC cannot validate the business or legal model. |

## Evidence Appendix

- No evidence references were supplied.

## Supporting UX Laws And Principles

- Role: support-only explanation. These lenses do not create findings, change 0-4 checklist ratings, or certify compliance.

| Lens | Source family | Applies to | Why it matters | Caveat / evidence needed |
|---|---|---|---|---|
| Peak-End Rule | UX/UI Support Lens | h09/h09_d_01, h03/h03_d_02, h09/h09_d_02 | The finding is supported by peak-end risk: this moment may heavily shape how users remember the experience. Applicability: Use only when it helps explain an evidence-backed UXHC finding or bounded host observation. | Memory effects need real user evidence to confirm; use this as a risk lens. Evidence needed: Visible interface evidence, source context, or a stated evidence limit must remain the basis for the finding. |
| Plain Language Principle | UX/UI Support Lens | h09/h09_d_01, h14/h14_d_03, h07/h07_d_02 | The finding is supported by plain-language risk: the wording may slow understanding or recovery. Applicability: Use only when it helps explain an evidence-backed UXHC finding or bounded host observation. | Plain language depends on audience, domain vocabulary, localization, and risk level. Evidence needed: Visible interface evidence, source context, or a stated evidence limit must remain the basis for the finding. |
| ISO 9241-11 Usability In Context | ISO UX/UI/HCI Support | h07/h07_d_03, h07/h07_d_02, h07/h07_d_04 | This finding connects to ISO 9241-11 style usability-in-context framing: usable for whom, for what task, and in what context. Applicability: Use when the finding benefits from ISO-informed framing around context of use, interaction quality, evidence traceability, process quality, or operational risk. | ISO-informed support reference only; not formal ISO standards compliance, conformance, certification, procurement proof, or legal assurance. Evidence needed: Requires project, process, technical, or audit evidence before standards-strength claims. |
| WCAG POUR Principles | WCAG Accessibility Support | h11/h11_d_02, h11/h11_d_01, h11/h11_d_03 | The finding is supported by WCAG POUR framing, but the report remains a heuristic audit rather than a compliance certification. Applicability: Use when evidence suggests a perceivable, operable, understandable, robust, component, keyboard, focus, contrast, media, authentication, or input-assistance risk. | UXHC can cite surface evidence but does not certify WCAG compliance. Evidence needed: Requires rendered/code/manual accessibility evidence before any conformance-strength statement. |
| Jakob's Law / Familiar Conventions | UX/UI Support Lens | h04/h04_d_07, h07/h07_d_04, h07/h07_d_08 | The finding is supported by convention risk: users may bring expectations the interface does not satisfy. Applicability: Use only when it helps explain an evidence-backed UXHC finding or bounded host observation. | Conventions vary by platform, culture, domain, and user expertise. Evidence needed: Visible interface evidence, source context, or a stated evidence limit must remain the basis for the finding. |
| Cognitive Load | UX/UI Support Lens | h14/h14_d_03, h08/h08_d_07 | The finding is supported by cognitive-load risk: users must spend effort understanding the interface before doing the task. Applicability: Use only when it helps explain an evidence-backed UXHC finding or bounded host observation. | Some complexity is inherent; the design question is whether the system carries the avoidable burden. Evidence needed: Visible interface evidence, source context, or a stated evidence limit must remain the basis for the finding. |

Misuse guardrails:
- Support-only context; not a separate score, proof of user behavior, compliance claim, or replacement for the H01-H14 checklist.
- Do not compensate for broken flows with a pleasant ending; fix the friction first.
- Do not remove precise domain terms that expert users need; explain them when needed.
- ISO-informed support reference only; not formal ISO standards compliance, conformance, certification, procurement proof, or legal assurance.
- Do not present this lens as an ISO audit result, standards-conformance evidence, certification evidence, procurement proof, or legal assurance.

## Follow-Up Activity

### Try This Next: Navigation Recovery Walkthrough

- Why this fits: H3 issues often show up when users take a wrong path and cannot recover without friction.
- Content focus: User control, exits, back behavior, and undo/recovery paths.
- Thinking focus: Where can the user safely go next if their first choice is wrong?
- Source note: Curated from UX Heuristic Compass.
- Steps:
  - Pick the affected screen.
  - Ask one person what they notice first.
  - Compare their answer to the intended task.

### Solo Activity: Navigation Recovery Walkthrough

- Why this fits: H3 issues often show up when users take a wrong path and cannot recover without friction.
- Content focus: User control, exits, back behavior, and undo/recovery paths.
- Thinking focus: Where can the user safely go next if their first choice is wrong?
- Source note: Curated from UX Heuristic Compass.
- Steps:
  - Write the target task.
  - Walk the screen slowly from the user's point of view.
  - Mark each moment of hesitation, uncertainty, or extra memory load.

### Group Activity: Navigation Recovery Walkthrough

- Why this fits: H3 issues often show up when users take a wrong path and cannot recover without friction.
- Content focus: User control, exits, back behavior, and undo/recovery paths.
- Thinking focus: Where can the user safely go next if their first choice is wrong?
- Source note: Curated from UX Heuristic Compass.
- Steps:
  - Give each reviewer the same task.
  - Have reviewers mark friction independently.
  - Discuss only the mismatches and choose one fix to test.

- Fit check: After the activity, ask whether the result confirmed the audit finding, weakened it, or revealed a different priority.

## Additional Validation Activities

### Affinity Mapping: Affinity Mapping

- Why this fits: Turns checklist findings into stakeholder-readable themes without losing traceability.
- Content focus: 
- Thinking focus: 
- Source note: Curated from UX Heuristic Compass.
- Steps:
  - Write each checklist finding on a separate card.
  - Group related cards without forcing categories in advance.
  - Name each group with a user-facing theme.
  - Identify the most representative finding per group.
  - Sequence groups by affected users, severity, and fixability.


## Reasoning Flow Suggestions

### Cross-Cultural Audit

- Heuristic: h12
- Use when: H12 optional profile is active, or the target audience includes non-Western or multilingual users.
- Source: authored_uxhc_v1
- Steps:
  - Name the primary target cultural contexts.
  - List icons, colors, metaphors, or conventions that assume a specific cultural reading.
  - Check whether each has a different meaning in target contexts.
  - Flag navigation patterns that assume left-to-right reading, Western calendars, or English-only labels.
  - Flag items needing deeper localization or cultural UX review.
- Atlas status: imported_static (authored_uxhc_v1:cross-cultural-audit)

### Inclusive Language Audit

- Heuristic: h14
- Use when: H14 scores below A- on labels, CTAs, instructions, errors, or help text.
- Source: knowledge_atlas_adapted
- Steps:
  - List visible UI copy from source evidence.
  - Flag metaphors that may not translate across cultures.
  - Flag terms that assume ability or unnecessary ease.
  - Flag gendered defaults or culturally specific references.
  - Propose a plain-language replacement for each flagged item.
  - Check that revised copy fits the UI character and space constraints.
- Atlas status: imported_static (task-templates:ux-microcopy-write)

### Opportunity Scoring

- Heuristic: overall
- Use when: Post-audit, when multiple heuristics score in the B-C range and a prioritization decision is needed.
- Source: authored_uxhc_v1
- Steps:
  - List all heuristics that scored below A-.
  - Rate importance to the user core task from 1-10.
  - Rate current satisfaction from the audit score from 1-10.
  - Calculate Opportunity = Importance + (Importance - Satisfaction).
  - Rank by opportunity score.
  - Use this ranking to sequence the fix roadmap.
- Atlas status: imported_static (authored_uxhc_v1:opportunity-scoring)


## Evaluator Bias Advisories

- Halo Effect: H8 is very high while functional heuristics have issues. Separate visual polish from task success. Mitigation: Audit functional heuristics before aesthetic ones and separate visual polish from task success.

## Prioritization Flow

- Not needed because the overall score is above B.

## Human Review

- HIL used: False
- Native question UI status: unknown
- Outcome: skipped
- Resolved gates: 0
- Unresolved gates: 0
- Note: HIL was not used for this report payload.

## Recommended Next Validation

- Fix severity 3-4 checklist items first, then rerun the same source state for comparison.

## Scope Note

This report is a heuristic evaluation artifact. It does not replace usability testing, analytics, accessibility compliance review, or direct user research.
