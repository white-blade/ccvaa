# home-0001 — One page: gallery and events on home, timeline, no membership

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, in review with [`home-0002`](home-0002-polish-accessibility-touch.md) |
| **Supersedes** | [`events-0002`](events-0002-events-page.md) (the `/events` page), [`gallery-0002`](gallery-0002-gallery-page.md) (the `/gallery` page), [`membership-0001`](membership-0001-static-stripe-membership.md) |
| **Source** | CEO (2026-10-09) |

## Goal

1. Remove the Gallery and Events tabs; both move into the home page.
2. Replace the events calendar with a **timeline** to the right of the listings: a
   line with a dot on each event's start date that zooms in and highlights the event
   on hover.
3. Remove membership and all code for it — not supported for now.

## Shape

```
/   Hero → #about → #gallery → #events → #contact
Nav: About · Gallery · Events
```

There is no other route. The nav links are anchors on `/`.

- **Gallery** — a dark band holding the full grid (2–5 per row, enlarged lead photo,
  full-size viewer). It replaces the home-page carousel, which showed the same
  photographs a second way and is removed.
- **Events** — search above a list of wide cards, with the timeline in a sticky right
  column. The per-row control is gone: the list sits beside the timeline, so its width
  is fixed.

## Timeline

No library fit. The vertical timeline packages (`react-vertical-timeline-component`,
`react-chrono`) stack cards with free-text dates; none places dots on a time scale.
Placing them is a linear map from date to position — a few lines in
`src/lib/timeline.ts`, unit-tested — so it is built in place rather than pulled in.

- The line runs from the first of the first event's month to the end of the last
  event's month, with a labelled tick per month (the year on the first and on
  January).
- Dots sit on **start dates**, as asked. Dots closer than 6% of the line are pushed
  apart, keeping order, so neighbouring labels never collide.
- **Hover or focus a dot** → it zooms and its title opens into a preview card
  (picture, date, place), and the event's card in the list is ringed. Hovering a card
  does the same in reverse. Clicking a dot opens the detail dialog.
- **Scrolling** the list moves the zoom to the card crossing the middle of the
  screen, so the timeline follows reading even without a pointer.
- Past events dim to grey; a **Today** marker and a coloured line run to today once
  the season is under way. Search dims the dots of hidden events rather than removing
  them, so the season keeps its shape.
- **Below `lg`** the timeline is hidden: a narrow screen has no room beside the list,
  and each card carries its own date.

## Membership removed

Deleted: `src/app/membership/`, `MembershipSection`, `src/lib/membership.ts`,
`membershipContent`, and the nav link. The Stripe Payment Links and the customer
portal still exist in the Stripe dashboard; the site simply no longer links to them.
Deactivate them there if no one should be able to pay. To bring membership back,
restore those files from git history (last present in `b8d50f1`) — the approach in
`membership-0001` still holds.

## Also removed

`/gallery`, `/events`, `PageBanner`, `GalleryCarousel`, `EventsCalendar`, and
`src/lib/calendar.ts` with its tests. Old `/gallery/` and `/events/` URLs now 404 on
Pages; nothing external links to them yet.

## Next

The Contact tab, the visual pass, accessibility, board profiles, touch support, and
the test suite that followed are in [`home-0002`](home-0002-polish-accessibility-touch.md).
