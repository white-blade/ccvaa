# home-0008 — Purpose alignment, events without search, date-rail places, the founding

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0007`](home-0007-profile-sheet-purpose-card-alignment.md), [`home-0003`](home-0003-device-optimized.md), [`events-0002`](events-0002-events-page.md) |
| **Source** | CEO (2026-10-09) |

## Goal

Six requests from one review:

1. The board profile sheet arrives too abruptly on narrow screens.
2. Purposes: cards equal in height when expanded, sized by the tallest; each opens
   and closes on its own. Look at how established sites handle this.
3. Remove the filter (the search) from Events.
4. Below `lg`, the date rail's chips show year, month, and day, and the city and
   country instead of the title. At `lg` and up, nothing changes.
5. Phones: should the section tabs sit at the top or the bottom?
6. Add the association's founding as the first event, with its certificate.
7. Update Albert Zang's bio from the board's Bios document.
8. Let event pictures expand to be seen in full.

## 1. Profile sheet

Done in home-0007: a 560ms slide with a strong ease-out and a slight fade, behind
`motion-safe`, with focus moved without scrolling. This spec does not change it.

## 2. Purposes

**What others do.** The GOV.UK Design System accordion, the best-documented
public example, lets every section open independently and adds a "Show all
sections" / "Hide all sections" control. Multi-open suits content whose sections
stand on their own and invite comparison, which the ten purposes do. The same
guidance warns against long or numerous sections (eight to ten at most), which
this list stays within. No widely used accordion stretches closed sections to
match an open one. A grid of cards that equalises height does so only across like
cards.

**What we do.** We keep GOV.UK's model, independent toggles plus Expand/Collapse
all, and align like with like:

- Every **open** card has the same height: the tallest heading plus the longest
  description. Opening "Education" (short) beside "Advancement of Visual Arts"
  (long) gives two cards of one height, so a fully expanded list reads as an even
  grid.
- Every **closed** card has the same height: the tallest heading.
- An open card does not stretch its closed neighbour (`items-start`). home-0007's
  first pass did, turning nine closed purposes into empty boxes whenever one opened.

The heights are measured, not guessed. The component reads the natural height of
every heading button and every description, then sets the largest as
`--purpose-head-h` and `--purpose-body-h` minimums on the list. It clears them
before measuring, so a reflow can shrink as well as grow. It remeasures when the
list's width changes and once web fonts load. Opening and closing changes no
measurement, so the 0fr → 1fr height animation runs as before. Without layout (no
JS, jsdom), no minimum is set and the cards size to their content.

## 3. Events without search

The search field, its result count, the "no results" state, and the dimming of
hidden timeline dots and rail chips are gone, along with `lib/event-search.ts`. At
a handful of listings, the timeline and rail already make every event one tap away.
The description no longer mentions searching. Checklist T2 (the 16px search field)
is retired.

## 4. Date rail: date and place

Each chip now shows two lines:

```
 NOV 14, 2026
 Richmond, Canada
```

- The first line is the start date with its year. The rail now spans more than one
  year (the founding is in 2026, the retreat in 2027), so month and day alone are
  ambiguous.
- The second line is `City, Country` from a new optional `place` field on each
  listing, derived into `placeLabel`. Events with no `place` read "Online".
- The title is not shown, because the card below carries it. It stays in the
  chip's accessible name after the visible text ("Nov 14, 2026 Richmond, Canada —
  Coastal Light: Members' Exhibition"), so a screen reader still names the event
  and visible text still starts the name (WCAG 2.5.3).

At `lg` and up the side timeline is unchanged.

## 5. Phone navigation: bottom, as it is

The tab bar stays at the bottom. Reasons:

- **Reach.** Steven Hoober's field observations found about half of phone use is
  one-handed, with the thumb comfortable in the lower-centre of the screen. On
  today's tall phones the top edge is out of reach without shifting grip.
- **Platform convention.** Material Design's navigation bar and Apple's tab bar
  both put three to five top-level destinations at the bottom. We have four.
- **Evidence on the web.** A Waikato study comparing a top hamburger menu with a
  bottom bar on mobile shops found users preferred the bottom bar. A retailer's A/B
  test reported more use of features moved into a bottom bar. Both are small
  studies, but they agree with the reach argument.
- **Visibility.** A bottom bar shows every destination at once. A top hamburger
  hides them behind a tap, which costs discovery.

The costs, and how the site meets them: iOS Safari and Chrome put their own
toolbar at the bottom, so the bar pads with `env(safe-area-inset-bottom)` and
nothing at the end of the page hides behind it (L4). The header still holds the
name at the top. No change to code; this records the decision.

## 6. The founding

The association's Drive folder (Events / "20260726 - Our Birthday") holds a PDF of
the BC Societies Act Certificate of Incorporation. Its text says the society was
incorporated on **June 27, 2026**, which disagrees with the file name's 2026-07-26.
The listing follows the certificate. The page was rendered to
`public/events/certificate-of-incorporation.jpg` (1236 × 1600, 253 KB) and is the
first event: "Our Birthday: CCVAA Is Founded", Victoria, Canada (where the
certificate was issued).

## 7. Albert Zang's bio

Three paragraphs from the board's "Bios" document replace the "Bio coming soon."
placeholder. The other two bios already matched the document. Every member now has
a bio (C6). The placeholder path stays, tested by rendering a member without one.

## 8. Event pictures open whole

The dialog crops its cover (16:9, or 21:9 from `sm`) and its detail pictures. That
is fine for a landscape but hides most of a portrait certificate. Every event picture
is now a button ("View the full picture: <description>", with a ⤢ mark in the
corner) that opens the gallery's viewer (`GalleryLightbox`, reused) with every
picture in the event, cover first, shown whole (`object-contain`). Arrows and swipes
step through them.

The viewer opens over the event dialog, so `useDialog` now keeps a stack of open
dialogs, and only the top one answers the keyboard. Escape closes the viewer, focus
returns to the picture, and a second Escape closes the event.

## 9. Section glide on slow devices (CI fix)

The WebKit browser tests for section navigation failed intermittently in CI (and on
`main`). Three causes, all real on a slow or busy phone:

- The glide's clock started when it was called, not on its first frame, so a
  late first frame jumped straight to the end: a snap, not a glide. It now
  starts on the first frame.
- The destination was measured once, so a page that changed height above it
  mid-glide (pictures loading, purpose cards measuring once fonts arrive) left
  the glide short of its section. The target is now re-read every frame.
- When a glide landed, the nav briefly showed the last section passed on the way
  until the observer reported the destination. A glide that arrives (rather than
  being cancelled) now marks its destination at once.

Guards: unit:scroll-to-section (late first frame; page growing mid-glide; `arrived`
on the settle event) and unit:use-active-section (destination kept on landing).

## Regression guards

`quality-0001`: L7b, L7c, A4b, C6, and C7 added; T2 retired; A6b rewritten; C1 extended.

- unit:PurposesSection › card alignment: headings sized to the tallest, descriptions
  to the longest; sizes unchanged as cards toggle; no minimum without layout.
- unit:EventsDateRail: date with year and place shown, title only in the name.
- unit:EventsBrowser: no search box.
- unit:events: year in the badge, `placeLabel` format, founding first with its
  certificate.
- e2e › purposes › open cards share one height…: two open cards of different
  lengths match, closed cards are unchanged, and each closes on its own.
- e2e › device layouts: rail chips show date and place (below lg); no search
  anywhere.

## Sources

- GOV.UK Design System, Accordion — https://design-system.service.gov.uk/components/accordion
- Inside GOV.UK, making the accordion more accessible — https://insidegovuk.blog.gov.uk/2021/10/29/how-we-made-the-gov-uk-accordion-component-more-accessible
- Visa Design System, Accordion usage — https://design.visa.com/components/accordion/usage/
- Smashing Magazine, Bottom navigation pattern on mobile web pages — https://smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages
- University of Waikato, bottom bar vs. hamburger on mobile — https://researchcommons.waikato.ac.nz/bitstreams/05825e44-00b0-44c4-8bba-ceb3f04e9c33/download
- BodyguardZ, bottom navigation A/B test — https://www.bodyguardz.com/blog/bottom-navigation-menu-smartphone-hand-pain-study.html
