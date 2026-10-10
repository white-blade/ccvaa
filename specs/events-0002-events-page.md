# events-0002 — Events page, search, and pictures in descriptions

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `superseded` — the `/events` page folded into the one page in [`home-0001`](home-0001-single-page.md) |
| **Depends on** | [`events-0001`](events-0001-events-section.md), [`gallery-0002`](gallery-0002-gallery-page.md) |
| **Source** | CEO (2026-10-09) |

## Goal

1. An **Events tab**, like `/gallery`, with the events section **moved there** — off the
   home page entirely, not duplicated.
2. **Search** across the listings.
3. The visitor controls **how many cards per row**.
4. Event descriptions may contain **pictures**, not only paragraphs.
5. Both the page and the cards should look better.

## Move, not copy

`events-0001` put the grid on the home page at `#events` and explicitly left it out of
the nav. With its own route that reasoning inverts: the section is deleted from
`src/app/page.tsx` and `/events` is the only place listings live.

```
Home:  Hero → About (Board, Purposes) → Gallery → Contact
Nav:   About · Gallery · Events · Contact · Membership
```

`EventsSection.tsx` and `EventList.tsx` are **removed**, replaced by:

```
src/app/events/page.tsx          server: getEvents() at build, metadata, Header/Footer
src/components/EventsBrowser.tsx client: search + layout control + grid + dialog
src/components/EventCard.tsx     client: one card
```

### Nav pressure

Five items no longer fit beside the wordmark on a narrow phone. The nav row now
scrolls horizontally with its scrollbar hidden, and items tighten to `px-2.5` and
13px below `sm`. **A sixth item needs a real mobile menu** — this is the last one that
fits by tightening.

## Search

Client-side, over a string built once per event from title, summary, location,
`dateLabel`, admission, and every text block of the description. Every whitespace-split
term must match, so "april richmond" narrows rather than widens.

No index, no fuzzy matching, no server: at five listings a `String.includes` over
flattened text is honest and instant. Revisit above ~200 listings.

The result count is `aria-live="polite"` — filtering changes the page without moving
focus, so a screen reader would otherwise get no signal. Empty results get a panel with
a clear-search button rather than a bare line of text.

## Layout control

Segmented **1 / 2 / 3 / 4** per row, default 3, remembered in `localStorage` under
`ccvaa:events-columns`.

`gallery-0002` built this for the gallery; rather than a second copy, both now share:

| File | Role |
|---|---|
| `src/lib/use-columns.ts` | `createColumnStore(key, options, fallback)` — storage-backed store read via `useSyncExternalStore` |
| `src/components/ColumnControl.tsx` | the segmented buttons |

The store returns `subscribe` / `getSnapshot` / `getServerSnapshot` / `choose` rather
than a ready-made hook, so each component calls `useSyncExternalStore` inside its own
`use…` function — which is where the React hooks lint rules expect to find it.

Cards hold a picture, a title, a location, and a summary, so they stay **one across on
phones** at any setting. The gallery's square tiles can take two; these cannot.

## Pictures in descriptions

`details` becomes a list of blocks instead of a list of strings:

```ts
type EventDetail = string | { pictures: EventPicture[]; caption?: string };
```

A plain string stays a paragraph — the common case reads exactly as before, so existing
listings needed no rewriting. A block with one picture renders full width at 3:2; two or
more render as a square grid, two across. Captions are optional.

Both forms resolve their `src` through `assetPath("/events/…")` in `getEvents()`, the
same as the card image, so `basePath` stays handled in one place.

Pictures are **not** clickable into the gallery lightbox. A dialog inside a dialog means
two focus traps and two Escape handlers competing over one keydown listener; the value
does not justify it.

## Fancier

**Cards** — picture under a bottom-up gradient; a cream calendar chip (month over day)
at the top left; the whole card lifts on hover while the picture scales; the arrow in
"View details" slides. Events with no picture get a dark gradient panel instead of a
missing frame, so a row of cards stays aligned whatever mix it holds.

The chip's month and day are read straight off the ISO string, **not** through
`new Date()`: a date-only value parses as UTC midnight, which renders as the previous
day everywhere west of Greenwich — including here.

**Dialog** — the picture became the header, with date, title, and location over it and
a floating close button, instead of a banner the text repeated underneath. The panel is
capped at `90vh` and scrolls internally, so a long description with pictures can never
push the close button off screen. Admission reads as a pill rather than a bordered line.

## Images

Two new 800px files in `public/events/`, named for their subject rather than an event
(`detail-lakeshore-bench.jpg`, `detail-bougainvillea-sunset.jpg`) because, like every
image in this folder, they are **downscaled gallery photos standing in for real event
pictures**. Generic names make the shared use read as deliberate placeholder stock.
Folder is now 784KB.

Dialog pictures mount only when a dialog opens, so they cost nothing on page load.

Demo coverage: the members' exhibition carries a two-picture block, the printmaking
retreat a single-picture block, and the artist talk stays text-only — all three paths
exercised by real content.

## Scope

### Out

- A page per event (`/events/[id]`). The dialog carries everything a listing has; real
  per-event pages want registration, which needs a server.
- Filtering by category, date range, or past/upcoming. A static build cannot evaluate
  "now" after publication — the reasoning from `events-0001` still holds.
- `.ics` feeds, recurrence, ticketing.

## Acceptance criteria

- [ ] `lint`, `typecheck`, `build` pass; `/` and `/events` both prerender as `○ (Static)`
- [ ] Events no longer appear on the home page, and `/events` lists all of them
- [ ] Search matches title, place, and date text; multiple terms narrow
- [ ] Clearing search restores the full list, from the field and the empty state
- [ ] Result count is announced when filtering
- [ ] 1 / 2 / 3 / 4 all change the layout; the choice survives a reload
- [ ] Description pictures render — single full width, several as a grid — with captions
- [ ] A text-only event still renders cleanly, card and dialog
- [ ] Dialog: Escape, backdrop, and button close; focus trapped and returned to the card
- [ ] A long description scrolls inside the dialog, close button always reachable
- [ ] Nav fits a 375px viewport without clipping the wordmark

## Risks

| Risk | Mitigation |
|------|-----------|
| Nav outgrows the header | documented above: a sixth item needs a mobile menu |
| Search over flattened text misses structured queries | acceptable at this volume; revisit with an index above ~200 listings |
| Description pictures inflate the dialog | lazy, mounted only when the dialog opens; 800px budget from `events-0001` |
| Date chip off by one | parsed from the ISO string, never `new Date()` |
