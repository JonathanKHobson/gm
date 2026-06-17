# Copy Rewrites — CTA & Coming-Soon Page

This is the highest-impact copy in the whole package, because it sits on the broken conversion step. → [BUG-01](../bugs/BUG-01-cta-dead-end/report.md)

## A. The CTA label must match the destination (until registration is live)

Right now the button says **"Claim a Seat"** but the destination cannot claim a seat. That's a promise the page can't keep (H01 link-name mismatch, H14 CTA honesty).

**Two honest options while the listing is being finalized:**

| If you add email capture (recommended) | If you keep a plain notice |
|---|---|
| **`Get the seat alert`** or **`Hold my seat`** | **`Seats open soon`** (and make it a non-button styled note, not a primary button) |

When the real registration URL is live, use the approved live CTA **`Book now at Mox`** and point the shared registration config at the official Mox listing.

---

## B. Rewrite the coming-soon page to capture intent (don't waste the click)

**Before (live coming-soon body):**
> Event listing link — Almost posted. The registration listing for Peril to Profit: The Goldspire Messengers is being finalized. Once the listing is live, the Claim a Seat button will point directly there. No homework in the meantime. That clause survived legal review.
> [Back to event page] [Ask Kyle a question]

The voice is great. The problem is it asks for nothing. A visitor at peak intent leaves empty-handed.

**After (keep the voice, add a capture):**

> ## Seat reservations are processing
> The official registration listing for **Peril to Profit™: The Goldspire Messengers** is clearing final approvals. (That clause survived legal review.)
>
> **Want the seat alert?** Drop your email and Management will notify you the moment the five seats open — first come, first hired.
>
> `[ email field ]` **[ Notify me when seats open ]**
>
> No homework, no spam, one message. Or **[hold the date →]** (add to calendar) and **[ask Kyle a question]** if you can't wait.

**No-backend implementation options (described, not applied):**
- A `mailto:` button: `mailto:kyle@…?subject=Goldspire%20seat%20alert&body=Notify%20me%20when%20seats%20open` (works today, zero infra).
- An embedded form: Tally / Google Forms / Mailchimp / Buttondown (captures to a list you can blast when seats open).
- An "Add to calendar" `.ics` "hold the date" link so the date survives even if they don't subscribe.

**Why it matters:** With "5 seats only" scarcity, the people who hit this page are your hottest leads. Capturing even an email turns the current 0% capture into a warm list you can convert in one send when the listing goes live.

---

## C. Privacy microcopy (Low, becomes required once you capture email) → [BUG (journey) h13_d_06]
If you add email capture, add a one-line privacy note ("We'll only email you about this event") near the field. No need for a full policy on a microsite, but say what you'll do with the address.
