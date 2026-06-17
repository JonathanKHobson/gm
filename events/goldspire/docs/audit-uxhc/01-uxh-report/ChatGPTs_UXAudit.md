Kyle, you were exactly right to catch the “crate gravity” problem. The current page source looks **much better than the earlier draft**: the live/source copy now frames the object as **magical cargo / ward-stone**, not “the mysterious crate,” and the main premise line says to protect magical cargo while letting the road go off-script. That is a strong correction. The bigger UX opportunity now is **fine-tuning conversion, reducing AI-ish repetition, protecting the hidden plot, and making the page feel even safer for total newcomers while still exciting Daggerheart-curious players**.

I could not reliably fetch the live rendered page through the browser tool, but I was able to inspect the GitHub source for the Goldspire event page, the Daggerheart resource page, and the shared CSS. The event source includes the hero, CTA, beginner section, event facts, premise, and character-card structure; the Daggerheart source includes the optional-prep framing and character PDFs; the base CSS confirms skip links, focus states, global link styling, reduced-motion support, and layout defaults.

Below is a **comprehensive Markdown prompt** you can give to the AI dev.

---

````markdown
# Advanced UXHC / UXH Compass Audit & Fine-Tuning Prompt  
## Project: Peril to Profit™: The Goldspire Messengers Landing Page

Run a full UX writing, usability, visual QA, accessibility, and code QA pass on the following primary pages:

- Primary event page: https://jonathankhobson.github.io/gm/events/goldspire/
- Daggerheart resource page: https://jonathankhobson.github.io/gm/resources/daggerheart.html

Do **not** directly fix files yet. Produce audit reports, recommended changes, and issue markdowns only.

Use the P2P / Peril to Profit™ voice and lore context as the tone guide:

- Corporate fantasy satire.
- Heroic adventure first; absurd corporate bureaucracy second.
- Warm, funny, cinematic, beginner-friendly.
- The page should feel like: **friendly game-store invitation + cinematic fantasy trailer + absurd corporate memo**.
- Avoid generic fantasy blandness.
- Avoid over-explaining the hidden plot.
- Avoid sounding like AI-generated marketing filler.

The goal is not a rewrite from scratch. The current page is directionally strong. This pass is for **precision, conversion, tone, trust, beginner reassurance, and spoiler control**.

---

# 1. Current Audit Summary

## What is working

The page already has a strong foundation:

- Clear event title: **Peril to Profit™: The Goldspire Messengers**
- Clear system framing: **Beginner-friendly Daggerheart one-shot**
- Strong reassurance: no tabletop or Daggerheart experience needed, heroes provided, rules taught as you play, voices optional.
- Practical details are visible early: date, time, session length, price, seats, and venue.
- The current premise language mostly avoids the earlier mistake of over-focusing on “the crate.”
- “Ward-stone” / “magical cargo” is more accessible and genre-readable than “keystone.”
- The Daggerheart resource page correctly says no prep is required and frames character PDFs as optional.

## Biggest risks to address

1. **CTA trust issue**
   - The page uses “Claim a Seat,” but the CTA appears to route to `coming-soon/`.
   - This can create friction or disappointment if registration is not actually open.

2. **Date clarity**
   - The hero facts say “Tuesday, July 7” but should include the year: **Tuesday, July 7, 2026**.
   - This matters because event pages can be shared, screenshotted, cached, or revisited later.

3. **Beginner mental model**
   - The page says beginners are welcome, but add one small section or microcopy explaining what actually happens at the table.
   - Total newcomers need to picture the experience: “You pick a hero, the GM explains the scene, you say what you try, dice come out when the outcome is uncertain.”

4. **AI-feel risk**
   - The page has good language, but repeated phrases like “funny, cinematic,” “corporate-approved chaos,” “goes wildly off-script,” and “heroes provided” can feel synthetic if repeated too often.
   - Keep these anchor phrases, but vary supporting language.

5. **Daggerheart-first-timer conversion**
   - The page is beginner-friendly, but avoid making experienced TTRPG players think the session is only a slow tutorial.
   - Add or preserve language that says this is a fast, fun way to try Daggerheart without buying the book or building a character.

6. **Hidden plot protection**
   - Do not reveal that the village threat, protection economy, ward-stone need, or corporate dynamics may be manufactured or manipulated.
   - Keep the mystery experiential.
   - Sell the feeling of discovery, not the twist.

7. **Visual QA needed**
   - Verify desktop, tablet, and mobile rendering.
   - Pay special attention to nav behavior, hero density, CTA visibility, character-card layout, image cropping, and long-text wrapping.

8. **Code QA needed**
   - Confirm hamburger/menu behavior.
   - Confirm focus states are visible.
   - Confirm body `overflow-x: hidden` is not hiding layout issues.
   - Confirm external links and PDF links are accessible.
   - Confirm images have correct alt text and lazy/eager loading choices.

---

# 2. UXH Compass Audit

Use this UXH Compass scoring model:

- **Orientation**: Can users immediately understand what this is?
- **Reassurance**: Does it calm beginner anxiety?
- **Motivation**: Does it make the event sound fun enough to attend?
- **Trust**: Are logistics, cost, venue, and expectations clear?
- **Momentum**: Is the CTA obvious and honest?
- **Tone Fit**: Does it feel like Peril to Profit™?
- **Accessibility**: Can users navigate, read, and understand it comfortably?
- **Spoiler Control**: Does it avoid revealing the hidden plot?
- **AI-Feel Check**: Does the writing sound human, specific, and intentional?

## Scorecard

| Dimension | Current Score | Target Score | Findings | Recommendation |
|---|---:|---:|---|---|
| Orientation | 4.5/5 | 5/5 | Event type, system, and beginner framing are clear. | Add year to date and make CTA state clearer. |
| Reassurance | 4/5 | 5/5 | Good “no experience” copy. Needs one simple “what happens at the table” explanation. | Add a compact “How the night works” section or card. |
| Motivation | 4.5/5 | 5/5 | Corporate fantasy tone is fresh and fun. | Add one more visceral adventure image in copy: strange road, odd creatures, team choices. |
| Trust | 3.75/5 | 5/5 | Cost and venue visible, but CTA may lead to coming soon. | Fix CTA state: live registration or clearly “Registration opening soon.” |
| Momentum | 3.5/5 | 5/5 | “Claim a Seat” is strong, but only if active. | If registration not open, use “Notify me / Registration opens soon” instead. |
| Tone Fit | 4.25/5 | 5/5 | Strong P2P vibe. Some repeated phrasing may feel AI-ish. | Preserve tone but vary repeated terms. |
| Accessibility | 4/5 | 5/5 | Skip link, focus visible, reduced motion are present. | Recheck global link styling and mobile nav. |
| Spoiler Control | 4.5/5 | 5/5 | Current ward-stone/magical cargo framing is good. | Avoid “manufactured threat” or “village scam” language anywhere public. |
| AI-Feel Check | 3.75/5 | 5/5 | Polished but occasionally phrase-stacky. | Add more concrete, human, table-specific details. |

---

# 3. Multi-Agent Usability Test

Run a no-human-in-the-loop usability simulation using the personas below. Use a Moderator agent and one participant agent per persona. Each participant should complete the same tasks independently, then join a focus group.

## Test Method

### Moderator tasks

Ask each participant to complete:

1. Land on the Goldspire event page.
2. Explain what the event is in one sentence.
3. Decide whether the event is for them.
4. Find date, time, cost, venue, and seat count.
5. Find whether they need experience.
6. Find whether characters and dice are provided.
7. Find what Daggerheart is or where to learn more.
8. Decide whether to click the CTA.
9. State anything confusing, intimidating, or too vague.
10. Answer: “Does this feel written by a human GM or like AI marketing?”

### Participant rules

Each agent must report:

- First impression.
- Confidence level.
- What they understood.
- What made them hesitate.
- What they would click next.
- Whether they would attend.
- One quote in their own voice.
- Severity of friction: Low / Medium / High / Critical.

---

## Participant 1: The Total Newcomer

### Expected behavior

This user has never played a tabletop RPG. They need reassurance more than hype.

### Observed likely positives

- “Never played a tabletop roleplaying game before? Excellent.” is excellent.
- “No tabletop or Daggerheart experience needed” is clear.
- “Heroes provided” and “rules taught as you play” reduce anxiety.
- “Acting voices are optional” directly addresses a major fear.

### Likely friction

- They may still not fully understand what actually happens during play.
- “Daggerheart” may still sound like a thing they should know.
- Character PDFs might look like homework if encountered too early.
- “Claim a Seat” going to a coming-soon page could break trust.

### Recommendation

Add a small plain-language section:

```markdown
## How the night works

1. You arrive and choose a ready-to-play hero.
2. Kyle explains the basics in plain language.
3. The story begins with your courier crew on the road.
4. When something risky happens, you roll dice.
5. You can speak in character, describe actions normally, or ask for help at any time.
````

### Persona quote

> “I feel like I’m allowed to be new, but I still want a tiny preview of what I’ll actually do at the table.”

### Severity

Medium.

---

## Participant 2: The Daggerheart First-Timer

### Expected behavior

This user has played D&D or other TTRPGs but has not played Daggerheart.

### Observed likely positives

* “Beginner-friendly Daggerheart one-shot” is clear.
* “No Daggerheart experience needed” keeps them from self-excluding.
* The Daggerheart resources page gives optional rules basics.
* The corporate fantasy satire differentiates this from generic 5e fantasy.

### Likely friction

* If copy leans too much toward “never played anything,” they may assume the session will be slow.
* They may want one stronger line that says this is still satisfying for experienced players.
* They may want to know how much of Daggerheart they will actually experience.

### Recommendation

Add a line near the hero or FAQ:

```markdown
Played other RPGs before? This is a low-commitment way to try Daggerheart’s Hope and Fear rhythm without buying the book or building a character first.
```

### Persona quote

> “I like that it’s beginner-friendly, but I want to know it won’t just be a four-hour rules tutorial.”

### Severity

Medium.

---

## Participant 3: Critical Role / Actual Play Curious

### Expected behavior

They have watched actual play but never played.

### Observed likely positives

* Daggerheart name has strong draw.
* One-night, premade heroes, no prep: excellent fit.
* Cinematic tone lands well.

### Likely friction

* They may worry they need to perform like an actual-play cast member.
* “Interactive theater” might excite some but intimidate others.

### Recommendation

If “interactive theater” appears, balance it with reassurance:

```markdown
It is interactive and story-driven, but this is not a performance test. You can talk in your normal voice, describe what your hero does, and learn as you go.
```

### Persona quote

> “I love the vibe, but I need permission not to be good at roleplay yet.”

### Severity

Low to Medium.

---

## Participant 4: Mox Regular / Board-Game Crossover

### Expected behavior

They trust the venue and want a low-friction game-night option.

### Observed likely positives

* Mox Boarding House Chandler is visible.
* Time, price, and seats are listed.
* One-shot framing is clear.

### Likely friction

* They may not know if this is a class, a performance, or a game.
* They may need an extra line that says “this is social and guided like a game night.”

### Recommendation

Add a microcopy line near the venue or facts:

```markdown
A guided four-hour RPG table for curious players, board gamers, and friends who want a complete story in one evening.
```

### Persona quote

> “I’m already going to Mox; I just need to know this is easy to walk into.”

### Severity

Low.

---

## Participant 5: Connection Seeker

### Expected behavior

They want a friendly social hobby and a low-risk way to meet people.

### Observed likely positives

* Warm copy helps.
* Small table of five seats signals intimacy.
* Complete one-evening story lowers commitment.

### Likely friction

* The page may not explicitly say whether more sessions or community opportunities may follow.
* They may wonder if they are joining an existing friend group.

### Recommendation

Add one line in FAQ:

```markdown
Coming solo is completely welcome. One-shots are a low-pressure way to meet the table, try the hobby, and see whether future games are your thing.
```

### Persona quote

> “I want to know I won’t be the odd person out if I show up alone.”

### Severity

Medium.

---

## Participant 6: Reluctant Plus-One

### Expected behavior

They are attending because someone invited them.

### Observed likely positives

* “No acting required” helps.
* “Questions welcome” helps.
* “Heroes provided” helps.

### Likely friction

* They may still be scared of being put on the spot.
* They might bounce if character PDFs look mandatory.

### Recommendation

Add direct reassurance:

```markdown
You will not be quizzed, tested, or forced into a spotlight. The GM will help you ease in.
```

Do not overuse this line; one appearance in FAQ or “For New Players” is enough.

### Persona quote

> “I can say yes if I know I won’t have to act in front of strangers.”

### Severity

Medium.

---

## Participant 7: Severance / Office-Comedy Fan

### Expected behavior

They are pulled in by corporate satire more than fantasy rules.

### Observed likely positives

* “Corporate-approved chaos” works.
* “Management regrets the confusion” works.
* “Adventure mandatory; survival encouraged” works.

### Likely friction

* Too much beginner-rule copy could dull the comedy hook.
* The satire needs one or two sharper examples without spoiling.

### Recommendation

Add a concise flavor line, not a lore dump:

```markdown
Expect heroic fantasy with workplace absurdity: cheerful notices, magical paperwork, dangerous roads, and a corporation that would love to circle back after the monster attack.
```

### Persona quote

> “The office-comedy fantasy thing is the reason I’d click.”

### Severity

Low.

---

## Participant 8: Forever-GM Who Finally Gets to Play

### Expected behavior

They are experienced, helpful, and likely to convert if the table sounds thoughtful.

### Observed likely positives

* Premade heroes lower prep burden.
* Daggerheart demo angle is appealing.
* The GM style and care are visible.

### Likely friction

* They may want to know table tone, safety, and pacing.
* They may wonder if they can bring their own character.

### Recommendation

Keep custom-character flexibility on the resource page, but make it clearly secondary:

```markdown
Custom or altered characters are optional and require GM approval. New players should skip this completely; the provided heroes are ready to go.
```

### Persona quote

> “I don’t need a lot, but I do want to know the GM has the table under control.”

### Severity

Low.

---

# 4. Focus Group Synthesis

## Moderator prompt

After individual testing, run a focus group with all participants. Ask:

1. What part of the page made you want to attend?
2. What part made you hesitate?
3. What felt most human?
4. What felt most AI-written?
5. Did the story hook reveal too much?
6. Did the beginner support feel reassuring or repetitive?
7. What single change would most increase conversion?

## Focus group consensus

### What works

* The page feels welcoming.
* The event sounds more distinctive than a generic fantasy one-shot.
* “Heroes provided” and “rules taught at the table” are high-conversion phrases.
* The corporate fantasy tone is memorable.
* The move from “crate” to “ward-stone / magical cargo” is a major improvement.

### What still needs tuning

* The CTA state must be honest.
* The page needs a tiny “what actually happens at the table” explanation.
* The Daggerheart resource page should not accidentally feel like homework.
* Copy should vary repeated marketing phrases.
* Add small human details from the real table experience.

### Focus group’s highest-priority change

```markdown
Fix the CTA state and add a compact “How the night works” section.
```

### Focus group’s best tone direction

```markdown
Warm invitation first.
Adventure trailer second.
Corporate satire as seasoning.
No lore dump.
No hidden-plot reveal.
No mysterious-crate fixation.
```

---

# 5. UX Writing Recommendations

## Global copy principles

Use three layers of copy:

1. **Plain reassurance**

   * “No experience needed.”
   * “Rules taught as you play.”
   * “Heroes provided.”
   * “No pressure to perform voices.”

2. **Adventure promise**

   * “A simple delivery through the Goldspire Territories goes off-script.”
   * “Strange roads, dangerous choices, and heroic moments.”
   * “One evening, one complete story.”

3. **P2P satire**

   * “Corporate-approved.”
   * “Management regrets the confusion.”
   * “Adventure mandatory; survival encouraged.”
   * “No profit without peril.”

Do not stack all three layers in every paragraph. Rotate them.

---

## Current hero copy assessment

The current hero direction is strong:

```markdown
Beginner-friendly Daggerheart one-shot
Peril to Profit™: The Goldspire Messengers
Learn Daggerheart in one night with a funny, cinematic fantasy delivery that goes wildly off-script.
No tabletop or Daggerheart experience needed. Heroes provided, rules taught as you play, and acting voices are entirely optional.
```

## Suggested hero refinement

Use this if the current version feels slightly too abstract or “AI marketing”:

```markdown
Beginner-friendly Daggerheart one-shot

# Peril to Profit™: The Goldspire Messengers

Learn Daggerheart in one night through a funny, cinematic fantasy adventure in the Goldspire Territories.

No tabletop or Daggerheart experience needed. Choose a ready-to-play hero, learn as you go, and take on a corporate-approved delivery job that absolutely, definitely, probably will not become everyone’s problem.
```

## Why this helps

* “Fantasy adventure” is broader than “fantasy delivery.”
* It keeps the delivery premise but does not over-focus on the cargo.
* “Absolutely, definitely, probably” gives P2P voice without revealing plot.
* It speaks to both total newcomers and Daggerheart-first-timers.

---

## Short description recommendation

Use this for listings, cards, social previews, or page summaries:

```markdown
Learn Daggerheart in one night with Peril to Profit™: The Goldspire Messengers. Join a funny, cinematic fantasy adventure where your crew takes on a simple delivery through the Goldspire Territories and learns how quickly a corporate-approved quest can go wildly off-script. Beginners welcome. Heroes provided.
```

This is good. Keep it.

Do not add:

```markdown
the threat is manufactured
the village is being manipulated
the corporation created the problem
the ward-stone is not needed
```

Those are table discoveries, not marketing copy.

---

## “For New Players” copy addition

Add this after the current beginner reassurance:

```markdown
## How the night works

You will pick a ready-to-play hero, get a quick guided introduction, and start playing right away. Kyle describes the scene, you say what your character tries, and dice come out when the outcome is uncertain. You can speak in character, use your normal voice, ask questions, or pause to think. The table is built to help new players succeed.
```

## Keep this concise

Do not turn this into a rule explanation. This is a fear-reduction section, not a manual.

---

## “For experienced RPG players” addition

Add a small line or card:

```markdown
Already played D&D or another RPG? This is a low-commitment way to try Daggerheart’s Hope and Fear rhythm without buying the book, building a character, or joining a campaign.
```

This protects against the “too beginner, not for me” bounce.

---

## “Coming solo” FAQ addition

```markdown
### Can I come by myself?

Yes. Coming solo is completely welcome. This is a small, guided one-shot designed to help new people settle in quickly, meet the table, and play a complete story in one evening.
```

This helps the Connection Seeker.

---

## “Do I have to act?” FAQ addition

```markdown
### Do I have to do a character voice?

No. Character voices are optional. You can talk normally, describe what your hero does, or ask the GM for help finding the words. Roleplaying is not a performance test.
```

This helps Total Newcomers, Critical Role Curious players, and Reluctant Plus-Ones.

---

## Daggerheart resource page copy adjustment

Current direction is good, but make the “optional” framing impossible to miss.

Add near the top:

```markdown
You can skip this entire page and still be fully ready to play. These resources are for curious players who enjoy peeking ahead.
```

Add near the character PDF section:

```markdown
Printed character sheets will be provided at the table. Reading these PDFs is optional, not required prep.
```

Add near the custom character section:

```markdown
New players should use the provided heroes. Custom characters are only for experienced players who enjoy tinkering and are comfortable getting GM approval before play.
```

---

# 6. Spoiler Control & Plot Accuracy

## Public-facing story rule

The page may say:

* simple delivery
* courier crew
* magical cargo
* ward-stone
* old forest route
* Goldspire Territories
* corporate-approved job
* road goes off-script
* strange dangers
* heroic choices
* corporate absurdity

The page should not say:

* the threat is manufactured
* the village does not need the ward-stone
* the ward-stone is part of a corporate scheme
* the company created the danger
* the protection economy is false
* the hidden plot behind the village

## Ward-stone language

“Ward-stone” is better for public copy than “keystone” because it immediately communicates fantasy protection magic.

Use “ward-stone” sparingly. One or two appearances are enough.

Recommended phrasing:

```markdown
Your crew is hired to deliver a magical ward-stone along an old forest route.
```

Avoid:

```markdown
What is really inside the crate?
Why is the crate suspicious?
Should you open the crate?
The crate changes everything.
```

Those over-center the object and can misrepresent the plot.

---

# 7. “Does it feel AI?” Audit

## Current risk

Some of the copy risks feeling AI-generated because it repeats polished phrases:

* funny, cinematic
* corporate-approved chaos
* goes wildly off-script
* heroes provided
* rules taught as you play
* no experience needed

These are good phrases. The issue is repetition, not quality.

## Fix strategy

Keep the anchor phrases, but add concrete human details:

* “Pick by vibe when you sit down.”
* “Ask questions at any time.”
* “You can talk in your normal voice.”
* “Printed sheets will be ready.”
* “The table is small so everyone gets help.”
* “Coming solo is welcome.”
* “Dice are optional; curiosity is enough.”

## Replace generic lines with table-specific lines

### Less human

```markdown
A funny, cinematic adventure where corporate-approved chaos unfolds.
```

### More human

```markdown
A strange road, five ready-to-play couriers, a table full of bad corporate decisions, and a GM ready to teach the rules as the story unfolds.
```

### Less human

```markdown
No experience needed. Heroes provided.
```

### More human

```markdown
You can sit down with zero prep, pick a hero by vibe, and learn the rules as choices come up.
```

---

# 8. Visual QA Report

Create a folder:

```markdown
/audit-output/visual-qa/
```

Include:

```markdown
visual-qa-summary.md
desktop-1440.md
tablet-768.md
mobile-390.md
screenshots/
```

## Required screenshots

Capture:

1. Desktop 1440px

   * Hero top
   * Fact grid and CTA
   * New players section
   * Premise section
   * Character cards
   * FAQ
   * Footer

2. Tablet 768px

   * Nav behavior
   * Hero layout
   * Fact grid
   * Character cards

3. Mobile 390px

   * Top of page
   * Nav wrapping / horizontal scroll
   * Hero CTA
   * Venue card
   * New players section
   * Daggerheart resource page top
   * PDF cards

## Visual QA checks

### Hero

Check:

* Is the title legible over the background?
* Does the hero feel exciting without being cluttered?
* Is the cast image cropped well?
* Are the CTA buttons visible before scrolling on desktop and mobile?
* Does the “Mox” venue information appear trustworthy and not buried?

### Navigation

Check:

* Is the hamburger/menu button visible when it should not be?
* Are nav links wrapping awkwardly on mobile?
* Is “Claim a Seat” always visible?
* Does “Portfolio” distract from event conversion?

### Character cards

Check:

* Are portraits visually consistent?
* Do any character images feel AI-weird, distorted, or mismatched?
* Are the class/ancestry labels readable?
* Is “Open character PDF” clearly optional?

### Daggerheart resource page

Check:

* Does the page feel like optional curiosity or required homework?
* Is “No prep required” visible before any PDF links?
* Are the PDF cards scannable on mobile?
* Is the custom-character section safely framed as optional/experienced-player-only?

## Visual QA issue template

For each visual bug, create a markdown file:

```markdown
# [Visual QA] Clear issue title

## Bug Report Checklist

### Before you start
- [ ] Searched existing issues to confirm it's not a duplicate

### Required fields
- [ ] Clear, specific title
- [ ] Concise bug description
- [ ] URL where the issue occurs
- [ ] Full step-by-step reproduction steps
- [ ] Expected behavior stated
- [ ] Device type selected
- [ ] Operating system selected

### Environment details
- [ ] Browser(s) selected
- [ ] Browser version(s) included

### Helpful additions
- [ ] Screenshots or video attached
- [ ] Relevant feature flags noted
- [ ] Additional context added if needed

### Before submitting
- [ ] Reviewed contributing guidelines, security policy, and code of conduct

## URL

## Device / viewport

## Browser / version

## Steps to reproduce

1.
2.
3.

## Actual behavior

## Expected behavior

## Severity

Critical / High / Medium / Low

## Screenshot

Attach screenshot path.

## Recommendation

## Notes
```

---

# 9. Code QA Report

Create a folder:

```markdown
/audit-output/code-qa/
```

Include:

```markdown
code-qa-summary.md
issues/
```

## Code QA checks

### 1. CTA link integrity

Current concern:

* CTA text appears to say “Claim a Seat.”
* Source indicates CTA href may be `coming-soon/`.

Expected behavior:

* If registration is live, CTA should go directly to the registration page.
* If registration is not live, CTA text should say “Registration opening soon,” “Join waitlist,” or “Get notified,” not “Claim a Seat.”

Issue severity: High.

Recommended issue file:

```markdown
/audit-output/code-qa/issues/cta-claim-seat-coming-soon.md
```

---

### 2. Date includes no year in quick facts

Current concern:

* Hero fact grid says “Tuesday, July 7.”
* Needs **Tuesday, July 7, 2026**.

Expected behavior:

* Public event pages should include year wherever date appears in summary/fact cards.

Severity: Medium.

Recommended issue file:

```markdown
/audit-output/code-qa/issues/event-date-missing-year.md
```

---

### 3. Menu button visibility

Current concern:

* Verify whether the menu button appears on desktop while nav links are also visible.
* Source CSS shows `.menu-btn` display behavior should be manually checked at desktop/tablet/mobile breakpoints.

Expected behavior:

* Desktop: no unnecessary hamburger if full nav is visible.
* Mobile: either a working menu button or clear accessible wrapped nav.
* No duplicate or confusing nav controls.

Severity: Medium if visible incorrectly; Low if intentional.

Recommended issue file:

```markdown
/audit-output/code-qa/issues/nav-menu-button-visibility.md
```

---

### 4. Global link styling

Current concern:

* Global CSS removes underline from all links.
* This can harm discoverability in body copy unless links have other clear visual treatment.

Expected behavior:

* Body text links should have a visible cue: underline, color contrast, icon, chip style, or card styling.
* Do not rely on color alone.

Severity: Medium.

Recommended issue file:

```markdown
/audit-output/code-qa/issues/body-links-need-visible-affordance.md
```

---

### 5. `overflow-x: hidden` may mask layout bugs

Current concern:

* Body uses `overflow-x: hidden`.
* This can hide horizontal overflow rather than fixing it.

Expected behavior:

* Run mobile viewport QA without relying on overflow hiding.
* Identify any element causing horizontal overflow.

Severity: Low to Medium.

Recommended issue file:

```markdown
/audit-output/code-qa/issues/mobile-horizontal-overflow-check.md
```

---

### 6. Reduced motion support

Current finding:

* Reduced-motion support appears present.

Expected behavior:

* Confirm reveal animations, hover animations, smooth scroll, and transitions respect reduced motion.

Severity: Low unless failing.

Recommended issue file only if failure is found:

```markdown
/audit-output/code-qa/issues/reduced-motion-audit.md
```

---

### 7. PDF accessibility

Check:

* Do character PDFs have descriptive link text?
* Do PDF links warn that they open in new tabs?
* Are PDFs optional and not framed as required?
* Do PDFs have accessible names or at minimum clear link context?

Severity: Medium if unclear.

Recommended issue file:

```markdown
/audit-output/code-qa/issues/character-pdf-accessibility-and-optional-framing.md
```

---

# 10. Copy QA Report

Create a folder:

```markdown
/audit-output/copy-qa/
```

Include:

```markdown
copy-qa-summary.md
recommended-copy-replacements.md
spoiler-control.md
ai-feel-pass.md
```

## Copy issues to search for

Search the entire Goldspire page and Daggerheart resource page for:

```markdown
crate
mysterious crate
suspicious crate
do not open
manufactured threat
village manipulated
corporation created
not actually needed
secret scam
```

## Required copy behavior

* If “crate” appears once as flavor, that may be okay.
* If “crate” appears repeatedly or becomes the main hook, reduce it.
* Prefer “magical cargo” or “ward-stone” in public-facing premise copy.
* Do not reveal hidden plot logic.

## Suggested copy replacements

### Hero hook

Replace if needed:

```markdown
Learn Daggerheart in one night with a funny, cinematic fantasy delivery that goes wildly off-script.
```

With:

```markdown
Learn Daggerheart in one night through a funny, cinematic fantasy adventure in the Goldspire Territories.
```

Or:

```markdown
Learn Daggerheart in one night as a simple courier job becomes a strange, cinematic fantasy adventure.
```

### Beginner reassurance

Use:

```markdown
No tabletop or Daggerheart experience needed. Choose a ready-to-play hero, learn as you go, and ask questions whenever they come up.
```

### Premise

Use:

```markdown
Your courier crew has been hired for a simple delivery through the Goldspire Territories: protect a magical ward-stone, follow the old forest road, and reach the destination before the job becomes more complicated than the paperwork promised.
```

### Anti-homework resource page line

Use:

```markdown
You can skip this entire page and still be fully ready to play. These resources are only here if curiosity wins.
```

### Experienced player hook

Use:

```markdown
Already played D&D or another RPG? This is a low-commitment way to try Daggerheart’s Hope and Fear rhythm without buying the book or building a character first.
```

### Coming solo FAQ

Use:

```markdown
Coming solo is completely welcome. This is a small, guided one-shot designed to help new people settle in quickly and play a complete story in one evening.
```

---

# 11. Accessibility QA Report

Create a folder:

```markdown
/audit-output/accessibility-qa/
```

Include:

```markdown
accessibility-summary.md
keyboard-nav.md
color-contrast.md
screen-reader-check.md
motion-check.md
issues/
```

## Checkpoints

### Keyboard

* Can user tab through nav, CTA, venue card, character PDFs, FAQ accordions, and footer?
* Is focus order logical?
* Is focus visible against dark and light backgrounds?
* Does skip link work?

### Screen reader

* Page has one logical H1.
* Sections have meaningful H2s.
* Images that are decorative have empty alt text.
* Character portraits have meaningful alt text.
* External links indicate they open in a new tab.

### Motion

* Reduced motion preference disables animation and smooth scrolling.
* No critical content depends on animation.

### Color / contrast

* Check CTA text contrast.
* Check gold/brass text on dark backgrounds.
* Check muted text on parchment backgrounds.
* Check link affordances in body copy.

---

# 12. Required Markdown Output Structure

Produce the following folder structure:

```markdown
/audit-output/
  README.md

  /uxh-compass/
    uxh-compass-report.md
    priority-recommendations.md

  /usability-tests/
    usability-test-summary.md
    participant-01-total-newcomer.md
    participant-02-daggerheart-first-timer.md
    participant-03-critical-role-curious.md
    participant-04-mox-regular.md
    participant-05-connection-seeker.md
    participant-06-reluctant-plus-one.md
    participant-07-office-comedy-fan.md
    participant-08-forever-gm.md

  /focus-group/
    focus-group-summary.md
    focus-group-transcript-simulated.md
    consensus-recommendations.md

  /copy-qa/
    copy-qa-summary.md
    recommended-copy-replacements.md
    spoiler-control.md
    ai-feel-pass.md

  /visual-qa/
    visual-qa-summary.md
    desktop-1440.md
    tablet-768.md
    mobile-390.md
    screenshots/

  /code-qa/
    code-qa-summary.md
    issues/
      cta-claim-seat-coming-soon.md
      event-date-missing-year.md
      nav-menu-button-visibility.md
      body-links-need-visible-affordance.md
      mobile-horizontal-overflow-check.md
      character-pdf-accessibility-and-optional-framing.md

  /accessibility-qa/
    accessibility-summary.md
    keyboard-nav.md
    color-contrast.md
    screen-reader-check.md
    motion-check.md
    issues/
```

Each bug markdown must include this checklist:

```markdown
## Bug Report Checklist

### Before you start
- [ ] Searched existing issues to confirm it's not a duplicate

### Required fields
- [ ] Clear, specific title
- [ ] Concise bug description (what you did, what happened)
- [ ] URL where the issue occurs (or N/A)
- [ ] Full step-by-step reproduction steps (no inferred steps, no "watch the video")
- [ ] Expected behavior stated
- [ ] Device type selected
- [ ] Operating system selected

### Environment details
- [ ] Browser(s) selected
- [ ] Browser version(s) included

### Helpful additions
- [ ] Screenshots or video attached (if applicable)
- [ ] Relevant feature flags noted (devs)
- [ ] Additional context added if needed

### Before submitting
- [ ] Reviewed contributing guidelines, security policy, and code of conduct
```

---

# 13. Prioritized Fix Map

## P0 / Must fix before sharing widely

### P0.1 CTA state

If registration is not open:

```markdown
Change “Claim a Seat” to “Registration Opening Soon” or “Get Notified.”
```

If registration is open:

```markdown
Replace `coming-soon/` with the real registration link.
```

Do not show an active “Claim a Seat” button unless a user can actually claim a seat.

---

## P1 / High value before promotion

### P1.1 Add “How the night works”

Add compact explanation for total newcomers.

### P1.2 Add year to event date

Use:

```markdown
Tuesday, July 7, 2026
```

### P1.3 Add experienced-player reassurance

Use:

```markdown
Already played another RPG? This is a fast, low-commitment way to try Daggerheart.
```

### P1.4 Strengthen “coming solo” reassurance

Add FAQ entry.

### P1.5 Make resource page anti-homework framing louder

Use:

```markdown
You can skip this entire page and still be ready.
```

---

## P2 / Polish

### P2.1 Reduce repeated polished phrases

Vary:

* funny, cinematic
* corporate-approved chaos
* goes wildly off-script
* heroes provided

### P2.2 Add more human specificity

Add details like:

* printed sheets
* pick by vibe
* questions welcome
* talk in normal voice
* small table
* coming solo welcome

### P2.3 Add one sharper P2P flavor line

Example:

```markdown
Expect heroic fantasy with workplace absurdity: cheerful notices, magical paperwork, dangerous roads, and a corporation that would love to circle back after the monster attack.
```

### P2.4 Verify image consistency

Check whether art feels cohesive or visibly AI-generated.

---

# 14. Final Acceptance Criteria

The final page should pass these checks:

* A total newcomer understands the event within 10 seconds.
* A Daggerheart-curious TTRPG player knows this is a good system demo.
* A Mox regular understands price, time, location, and seat count without hunting.
* A reluctant plus-one feels safe saying yes.
* A solo attendee knows they are welcome.
* The CTA is honest and actionable.
* The ward-stone / magical cargo premise is clear but not over-explained.
* The hidden plot remains hidden.
* The writing feels like a human GM inviting people to a table, not generic AI event copy.
* The Peril to Profit™ tone is present but not overwhelming.
* The Daggerheart resource page feels optional, not like homework.
* Keyboard, screen-reader, reduced-motion, and mobile layout checks pass.

---

# 15. One-Sentence North Star

Write and design the page so the visitor thinks:

> “I can actually try this, I do not need to know anything first, and this sounds weird in a fun way.”

```

---

## My top 5 recommendations, distilled

1. **Fix the CTA state first.** “Claim a Seat” cannot go to a coming-soon page unless the page clearly says registration is not open yet.

2. **Add “How the night works.”** This is the missing bridge for true newcomers.

3. **Add “Already played another RPG?”** This keeps Daggerheart-curious players from assuming the event is too basic.

4. **Keep ward-stone language, but do not over-center it.** “Magical cargo” and “simple courier job” are safer broad hooks.

5. **Do an “AI-feel” pass by adding human table details.** “Pick by vibe,” “talk in your normal voice,” “printed sheets ready,” and “coming solo welcome” will make the page feel much more grounded.
```
