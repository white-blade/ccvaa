# events-0001 — Events section

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `superseded` — the home-page events grid moved to its own page in [`events-0002`](events-0002-events-page.md), then back onto the one page with a timeline in [`home-0001`](home-0001-single-page.md) |
| **Depends on** | [`gallery-0001`](gallery-0001-photo-gallery.md) |
| **Source** | CEO (2026-10-08) |

## Goal

An **Events** section on the home page, directly after Gallery: a grid of compact
cards, each showing a title, a short summary, and a picture where one exists.
Selecting a card opens a dialog with the full details.

Static export on GitHub Pages — no server, no database, no secrets.

## Placement

```
Hero → AboutSection (Board, Purposes) → GallerySection → EventsSection → ContactSection
```

Section id `#events`, `scroll-mt-24` like its neighbours. No nav entry: the header is
already four items, and Events sits one scroll below Gallery.

## Content model

Events are **content, not data** — there is no backend to query, and at this volume a
typed array is clearer than any CMS. They live in `src/lib/events.ts`:

```ts
type CcvaaEvent = {
  id: string;             // dialog ids and React keys
  title: string;
  startsAt: string;       // ISO — machine-readable <time dateTime>
  dateLabel: string;      // human-readable, en-CA
  location: string;
  summary: string;        // the card
  details: string[];      // dialog paragraphs
  admission?: string;
  image?: { src: string; alt: string };   // optional, per the brief
};
```

`image` is optional throughout: a card without one renders as a text card rather than
leaving a broken frame.

### Ordering

Sorted by `startsAt`. Past events are **not** filtered out — a static build has no
notion of "now" after it is published, so a date-based filter would silently empty the
section until someone pushed a commit. Editors remove stale events by deleting them,
which is honest about how a static site works.

## Interaction

Card → dialog, which is the same behaviour the gallery lightbox already implements:
Escape and a close button dismiss, Tab is trapped, focus returns to the originating
card, and body scroll locks while open.

Rather than write that twice, this item **extracts the behaviour into
`src/lib/use-dialog.ts`** and refactors `GalleryCarousel` onto it. One copy of the
fiddly accessibility logic, two consumers. The hook takes optional `onNext`/`onPrevious`
so the gallery keeps arrow-key navigation while the events dialog, which has no
next/previous, simply omits them.

Cards are `<button>` elements, not divs with click handlers, so keyboard and screen
reader support come for free.

## Images

`public/events/` holds event pictures, separate from `public/photos/` so the gallery
and the events calendar can change independently.

For this demo the five images are **copies of gallery photos, downscaled to 800px** —
cards display small, and shipping 1600px originals for a thumbnail would double the
page weight for no visible gain. 596KB for five.

Same constraint as the gallery: `images.unoptimized` is required on Pages, so nothing
resizes at build time. Whatever is committed is what visitors download.

## Demo content

Five invented events, written to be plausible for a BC visual arts non-profit:
a members' exhibition, a plein air session, an artist talk, a printmaking retreat, and
the AGM with a community showcase. **These are placeholders** — real listings replace
them by editing `src/lib/events.ts`.

The artist talk deliberately carries **no image**: it is an online event with no venue
to photograph, so it exercises the text-only card path in real content rather than
leaving `image?` untested. Four images ship, five cards render.

## Scope

### In

- `src/lib/events.ts` — typed events + demo content
- `src/lib/use-dialog.ts` — shared dialog behaviour
- `src/components/EventsSection.tsx` — server component, card grid
- `src/components/EventCard.tsx` / `EventDialog.tsx` — client
- `eventsContent` in `src/lib/site.ts`
- `GalleryCarousel` refactored onto the shared hook
- `public/events/`

### Out

- Nav entry for `#events`
- Registration or ticketing. Both need a server; if wanted, the membership pattern
  applies — link out to a hosted form or a Stripe Payment Link per event.
- Calendar feeds (`.ics`), recurring events, filtering by date or category
- A CMS or admin UI for editing events — adding one is a commit, by design

## Acceptance criteria

- [ ] `lint`, `typecheck`, `build` pass; `/` still `○ (Static)`
- [ ] Cards show title, date, location, summary, and image when present
- [ ] An event with no `image` renders cleanly as a text card
- [ ] Card opens its dialog; Escape and the close button both dismiss
- [ ] Focus moves into the dialog, is trapped, and returns to the card on close
- [ ] Background scroll locked while open
- [ ] Gallery lightbox still behaves identically after the refactor
- [ ] Dates use `<time dateTime>` with a machine-readable value
- [ ] Every image has meaningful alt text

## Risks

| Risk | Mitigation |
|------|-----------|
| Refactoring the gallery breaks its lightbox | shared hook keeps the same semantics; gallery behaviour is an explicit acceptance criterion |
| Event images inflate page weight | 800px copies, 596KB for five; budget documented |
| Stale events linger after their date | deliberate — a static build cannot evaluate "now"; editors delete them |
