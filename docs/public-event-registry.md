# Public Event Registry

The next-game banner on `links.html` is driven by
`scripts/public-events.js`. It is a game-agnostic chronological list: the
banner selects the earliest event whose `start` time is still in the future.

## Add An Event

Add one object to `GameMasterKyle.publicEvents` with:

- a unique `id`
- the game and visitor-facing title
- short name, time, and venue labels
- an ISO start time with the Phoenix offset (`-07:00`)
- the external booking URL
- the local details-page URL
- a `sourceId` matching `GameMasterKyle.publicEventSources`

Add a new source entry when a new recurring Mox listing URL is introduced.
Set `discoverDates` to `true` when that listing prints its dated sessions in
the public page copy. Add `watchText` to an event when the watcher should
confirm a specific listing line remains present.

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
