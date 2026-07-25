# Public Event Registry

The booking spotlight on `links.html` is driven by
`scripts/public-events.js`. It is a game-agnostic chronological list: the page
selects the earliest verified event whose `start` time is still in the future.
When that start time passes, the next verified event is promoted without an
HTML edit.

## Add An Event

Add one object to `GameMasterKyle.publicEvents` with:

- a unique `id`
- the game and visitor-facing title
- short name, time, and venue labels
- an ISO start time with the Phoenix offset (`-07:00`)
- the external booking URL
- the local details-page URL
- a `sourceId` matching `GameMasterKyle.publicEventSources`
- a `status` of `live` or `sold_out` when the booking CTA needs special wording

The order in the file does not control the featured card. If a newly verified
August 4 event is added later, its earlier `start` time will place it ahead of
the current Stargate listing automatically.

Add a new source entry when a new recurring Mox listing URL is introduced.
Set `discoverDates` to `true` when that listing prints its dated sessions in
the public page copy. Add `watchText` to an event when the watcher should
confirm a specific listing line remains present.

## Tentative Dates

Tentative dates belong in `GameMasterKyle.tentativeEvents`. They can appear as
an informational schedule note, but they never become booking CTAs and are not
treated as verified listings.

When Mox publishes a real listing:

1. add the source URL if it is new;
2. add the dated event to `GameMasterKyle.publicEvents`;
3. remove the matching item from `GameMasterKyle.tentativeEvents`;
4. run the watcher locally.

Do not maintain a second CSV. The browser-safe JavaScript registry is the
single structured source used by the page and the watcher.

## Watcher

`.github/workflows/public-event-watch.yml` runs every six hours and can also be
run manually. It:

1. validates the registry structure and chronological state;
2. checks known Mox listing URLs;
3. verifies configured event text;
4. detects unregistered future dates printed on discoverable known listings;
5. opens or updates a GitHub issue when attention is needed.

The watcher cannot discover a completely new Mox listing URL that has never
been registered. Add that URL once under `publicEventSources`; subsequent
scheduled checks can monitor it.

Run the same check locally:

```bash
node tools/check-public-events.mjs
```

Use `--offline` to validate registry structure without contacting Mox.
