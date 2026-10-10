# quality-0001 — Regression checklist

| Field | Value |
|-------|--------|
| **Type** | `standard` |
| **Status** | `active` — applies to every change |
| **Source** | CEO (2026-10-09) |

## Purpose

The behaviours the site promises, in one list, each tied to what guards it. A big
change — a new section, a layout rework, a dependency upgrade — is done only when
every line below still holds. Most are enforced by tests; the rest need a person.

## How to use it

1. Before merging, run everything:

   ```bash
   npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
   ```

   CI runs the same four checks in parallel on every pull request, the browser suite
   split into a job per device. Green there covers every **Auto** line. (A pull
   request that changes only docs runs lint and typecheck alone.)
2. Walk the **Manual** lines on a real phone and tablet (`npm run dev`, then open the
   Network URL + `/ccvaa/` on the device).
3. Changing a behaviour on purpose? Change its line here **and** its test in the same
   pull request. Adding one? Add a line and a test. A line with no guard is a wish.

**Guard** names a test: `e2e › <describe> › <title>` is in `e2e/site.spec.ts` and
runs on all six devices, or only those its device tag fits — Chromium
desktop (1440), touch tablet (1180), touch phone (Pixel 7), and WebKit iPhone 15, iPad
Pro 11 landscape and portrait; the tags are in `e2e/device-tags.ts`. `unit:<file>` is
a Vitest file under `src/`.

## Devices and layout

| ID | Behaviour | Guard |
|----|-----------|-------|
| L1 | No sideways scrolling at any width from 320 to 1920px | Auto — e2e › layout › never scrolls sideways |
| L2 | Phones (< 768): section links in a bottom tab bar, flush with the bottom edge; no header links, no menu button | Auto — e2e › device layouts › phones: a bottom tab bar… |
| L3 | Tablets and up (≥ 768): header links, no tab bar | Auto — e2e › device layouts › tablets and up: header links, no tab bar |
| L4 | Nothing at the end of the page hides behind the tab bar | Auto — e2e › device layouts › phones: the end of the page is not hidden… |
| L5 | Below 640: dialogs are bottom sheets, full width, flush with the bottom; a swipe down on the handle dismisses | Auto — e2e › device layouts › small phones: dialogs are bottom sheets…; unit:Modal |
| L5b | Below 640: dialog sheets enter with a gradual, eased slide and fade | Auto — e2e › device layouts › small phones: dialogs are bottom sheets… |
| L6 | 640 and up: dialogs are centred | Auto — e2e › device layouts › tablets and up: dialogs stay centred |
| L7 | Below 1024: the date rail replaces the side timeline; a chip glides its card to just below the rail | Auto — e2e › device layouts › below lg: a date rail…; unit:EventsDateRail |
| L7b | Below 1024: each rail chip shows the full date with its year and the city and country (or "Online"), not the title; the title is still in its accessible name | Auto — e2e › device layouts › below lg: each chip shows the full date…; unit:EventsDateRail |
| L7c | The event listings have no search or filter, on any device | Auto — e2e › device layouts › every device: the listings have no search…; unit:EventsBrowser |
| L8 | 1024 and up: the side timeline, no rail | Auto — e2e › device layouts › lg and up… |
| L8b | 1024 and up: the timeline's month labels are three-letter monospace capitals in one fixed-width column (equal widths, left edges within 1px); years sit in their own column to the left, bold `coral-dark`, set apart from the months by weight and colour | Auto — e2e › device layouts › lg and up: timeline months and years each line up…; unit:EventsBrowser; unit:timeline |
| L8c | 1024 and up: no month or year label prints under the "Today" badge (a tick that close hides its labels, keeps its mark) | Auto — e2e › events polish › lg and up: no month or year label…; unit:timeline |
| L8d | Every event card ends with "View details" at the same bottom-right place, whatever its admission note; an event without a picture shows its place, set large, in the picture's frame | Auto — e2e › events polish › every event card…; …an event without a picture…; unit:EventsBrowser |
| L9 | The side timeline and the date rail stay pinned while the listings scroll (never `overflow-hidden` above a sticky element) | Auto — e2e › device layouts › … stays pinned while the listings scroll |
| L9b | The date rail marks the card read past, and clears a stale mark after jumping back up | Auto — e2e › device layouts › below lg: a date rail…; …jumping back up to Events… |
| L10 | *Retired in gallery-0003: the per-row control is gone.* Phones (< 768): the gallery is a card — the photograph, then author and date below it, no veil | Auto — e2e › device layouts › phones: the gallery is a card… |
| L10b | 768 and up: one photograph fills the stage (cover), the veil is on, and the credits sit at its top right | Auto — e2e › device layouts › md and up: one photograph fills the stage… |
| L11 | Dialogs and the photo viewer cover the fixed header | Auto — e2e › layout › dialogs cover the fixed header |
| L12 | Back to top only from 1280px, where it cannot cover content | Auto — e2e › moving between sections › back to top never covers content…; unit:BackToTop |
| L13 | Every board portrait renders at the same size, whatever the bio length | Auto — e2e › board profiles › every portrait gets the same frame… |
| L14 | Nothing sits under a notch or the home indicator (safe-area insets) | **Manual** — real notched iPhone, portrait and landscape |
| L15 | Board profiles: identity (role, name, website, arrows) under the portrait, no empty column; short bios centred | Auto — unit:BoardSection; e2e › board profiles; **Manual** — glance at the longest and shortest bio |

## Gallery slideshow

| ID | Behaviour | Guard |
|----|-----------|-------|
| S1 | One photograph at a time; previous/next wrap at the ends | Auto — unit:GallerySlider; e2e › device layouts › md and up… |
| S2 | A dot per photograph jumps to it; the current dot is marked (`aria-current`) by one coral pill that glides from dot to dot (stretching toward the next, then settling; it simply moves under reduced motion), on a frosted track; dots are named "Show photograph n" | Auto — e2e › device layouts › every device: a dot jumps…; e2e › gallery works › one pill marks the current dot…; unit:GallerySlider |
| S3 | Author and date show when present; without them nothing is empty and the alt text stands in as caption; dates never shift a day | Auto — unit:GallerySlider; unit:text; unit:gallery |
| S4 | Every work in `gallery-photos.ts` has three prepared sizes on disk, each ≤ 1920px and ≤ 300 KB, and a blurred preview; no file in `public/photos/` is unused; dates are real and past; a licensed work names its creator, licence, and source; no blank fields | Auto — unit:gallery-photos |
| S11 | At most 7 dots show, a window starting one before the current work (11th → dots 10–16), stopping at the ends; edge dots with more beyond are smaller, never the current one; the row fits at 320px | Auto — unit:dot-window; unit:GallerySlider › a large gallery; e2e › gallery works › the dots stay seven wide… |
| S11b | First and last buttons jump to either end; the button for the end reached is `aria-disabled`, still focusable; ⏮ ‹ dots › ⏭ in one row on every screen down to 320px (five dots below 640, seven from 640), every button ≥ 40px | Auto — unit:GallerySlider › first and last; unit:dot-window › narrows to five…; e2e › gallery works › first and last…; …one row on every screen…; …at 320px… |
| S11c | While the slideshow runs, the current dot's pill fills as it counts down to the next work and the work drifts slowly closer; neither under reduced motion; on pause the pill is solid | Auto — unit:GallerySlider › the slideshow's countdown and drift; e2e › gallery works › the current dot's pill fills… |
| S11d | A dot under the mouse or keyboard focus lifts a preview of its work (picture, number, author) centred above it; none for a touch or for the current work; it never takes a click | Auto — unit:GallerySlider › dot previews; e2e › mouse › hovering a gallery dot lifts a preview… |
| S12 | Progressive pictures: a blurred preview shows until the picture loads, then it fades in; a phone fetches a phone-sized file (`srcset`), never the 1920px one; a failed picture still uncovers its alt text | Auto — unit:GallerySlider › progressive pictures…; e2e › gallery works › a phone downloads… |
| S13 | Each licensed work shows its licence and source as links (new tab), clickable over the veil, ≥ 40px tall on touch | Auto — unit:GallerySlider › progressive pictures and credits; e2e › gallery works › the credit links…; e2e › touch › controls are big enough to tap |
| S5 | The slideshow advances every `galleryContent.autoplaySeconds` (6s); a step by hand restarts the count | Auto — e2e › gallery slideshow › advances on its own…; unit:GallerySlider |
| S6 | It holds on mouse hover, keyboard focus inside, while the viewer is open, and while the tab is hidden; a visible button pauses and plays it (WCAG 2.2.2) | Auto — e2e › gallery slideshow › …; unit:GallerySlider |
| S7 | Reduced motion: it never starts on its own (play still works if pressed) | Auto — e2e › gallery slideshow › reduced motion…; unit:GallerySlider |
| S8 | Swipe left/right on the slideshow steps it; a vertical drag scrolls the page and does not | Auto — e2e › touch › swiping the slideshow…; unit:GallerySlider |
| S9 | Slide changes are announced only when the visitor makes them (`aria-live` off while playing) | Auto — unit:GallerySlider |
| S10 | The veil reads well over every photograph and the credits feel balanced | **Manual** — desktop and iPad, step through all six |

## Gallery viewer

| ID | Behaviour | Guard |
|----|-----------|-------|
| G1 | Thumbnails show the whole set, mark the current photograph, and jump to any | Auto — e2e › photo viewer › thumbnails…; unit:GallerySlider |
| G2 | Neighbouring photographs are fetched ahead of a step | Auto — unit:GallerySlider |
| G3 | The photograph slides in from the side the visitor moved toward | Auto — unit:GallerySlider |
| G4 | Swipe down closes it on touch; left/right step | Auto — e2e › photo viewer › a swipe down…; e2e › touch › …swipes…; unit:use-dialog |
| G5 | Keyboard hint for mouse users only | Auto — unit:GallerySlider |
| G6 | The photograph is shown whole (contained, inside the screen); author and date sit above the caption when present; focus returns to the photograph on close | Auto — e2e › photo viewer › shows the whole photograph…; unit:GallerySlider |
| G7 | Expand (the button beside close, or a click on the photograph) gives the photograph the whole screen, still contained; caption, counter, and thumbnails step aside; arrows and swipes still step; Escape leaves full view, then closes | Auto — e2e › photo viewer: full view › expand gives…; unit:GallerySlider |

## Motion

| ID | Behaviour | Guard |
|----|-----------|-------|
| M1 | The first-load entrance ends with the hero fully in place (heading opaque, veil transparent) | Auto — e2e › motion › the first-load entrance ends… |
| M2 | Scroll-driven effects run where `animation-timeline` is supported, never under reduced motion | Auto — e2e › motion › scroll-driven section effects… |
| M3 | Reduced motion: no entrance animation at all | Auto — e2e › motion › reduced motion: no entrance…; unit:Hero |
| M4 | Decorative motion (ghost numerals) is not text: hidden from screen readers and contrast checks | Auto — unit:Section; A1 |
| M5 | The entrance and transitions feel smooth on a real phone | **Manual** — real iPhone and Android |
| M6 | Scroll effects never fade text: everything text-bearing is opaque at every scroll position | Auto — e2e › motion › scroll effects never fade text… |
| M7 | Every round-two section effect (titles, gallery stage, cards, purposes, email, board photo) runs where supported and is off under reduced motion | Auto — e2e › motion › scroll-driven section effects… |
| M8 | Hover effects still work on the gallery photograph while its scroll effect runs | **Manual** — desktop, hover the photograph mid-scroll |
| M9 | Slide changes move the caption by transform only — text never fades — and are off under reduced motion | Auto — unit:GallerySlider (classes); e2e › accessibility › has no axe violations… |

## Touch

| ID | Behaviour | Guard |
|----|-----------|-------|
| T1 | Tap targets are at least 40px tall | Auto — e2e › touch › controls are big enough to tap |
| T2 | *Retired in home-0008: the events search was removed, and with it the only text field.* | — |
| T3 | Nothing depends on hover: the gallery's "View full size" mark and credits show on touch screens | Auto — e2e › touch › gallery labels show without hover |
| T4 | A tap never strands a hover highlight | Auto — unit:hover-focus; unit:EventsBrowser (touch) |
| T5 | Timeline on touch: first tap previews, a second tap (or a tap on the preview) opens | Auto — e2e › touch › timeline: first tap…; …tapping the open preview card… |
| T6 | Swipe left/right steps the gallery slideshow, the photo viewer, and board profiles; vertical swipes and pinch are left alone | Auto — e2e › touch › …swipes…; unit:use-dialog |
| T7 | Press feedback on cards, tiles, chips, and tabs; no grey iOS tap flash | **Manual** — real phone |
| T8 | Pinch-zoom works in the photo viewer | **Manual** — real phone |

## Navigation between sections

| ID | Behaviour | Guard |
|----|-----------|-------|
| N1 | Every in-page link glides (eased, interruptible) and lands the section just under the header | Auto — e2e › section navigation › … glides there, lands under the header…; unit:scroll-to-section |
| N2 | On arrival focus moves to the section and the heading plays its flourish | Auto — same e2e tests; unit:scroll-to-section |
| N3 | The nav marks the section on screen — header on tablets and up, tab bar on phones | Auto — e2e › section navigation › the navigation marks the section on screen |
| N4 | During a glide only the destination is marked | Auto — e2e › moving between sections › the nav marks only the destination…; unit:use-active-section |
| N5 | At the end of the page the last section is marked; at the very top nothing is | Auto — e2e › …the last section is marked at the end…; unit:use-active-section |
| N6 | Back/Forward glide between section entries | Auto — e2e › moving between sections › Back glides…; unit:SectionLinks |
| N7 | The address follows the section being read; the bare URL over the hero | Auto — e2e › moving between sections › the address follows… |
| N8 | Modified clicks (new tab/window) and unknown anchors are left to the browser | Auto — unit:SectionLinks |
| N9 | Reduced motion: no glide, no reveal, no flourish — and nothing hidden | Auto — e2e › accessibility › reduced motion… |

## Accessibility and keyboard

| ID | Behaviour | Guard |
|----|-----------|-------|
| A1 | No axe violations on the full page, colour contrast included, on every device | Auto — e2e › accessibility › has no axe violations… |
| A2 | Each component is axe-clean in isolation | Auto — unit tests calling `expectNoAxeViolations` |
| A3 | Skip link is the first Tab stop and lands on the content | Auto — e2e › accessibility › keyboard… |
| A4 | Dialogs: focus in on open, back to the opener on close, Tab trapped, Escape closes, arrows step | Auto — unit:GallerySlider, unit:BoardSection, unit:EventsBrowser |
| A5 | Timeline dots step with the arrow keys | Auto — unit:EventsBrowser |
| A4b | Stacked dialogs (an event's picture viewer over the event): keys go to the top one only; Escape closes the viewer and leaves the event open | Auto — unit:use-dialog; unit:EventsBrowser; e2e › event pictures |
| A6 | Purposes: each opens on its own; closed descriptions are inert; Expand/Collapse all | Auto — unit:PurposesSection; e2e › purposes |
| A6b | Open purpose cards share one height (tallest heading + longest description); closed cards share another (tallest heading); an open card never stretches a closed neighbour | Auto — e2e › purposes › open cards share one height…; unit:PurposesSection › card alignment |
| A7 | Visible text and accessible names agree (timeline dots, date chips) | Auto — A1 (axe `label-content-name-mismatch`) |
| A8 | A real screen reader reads the page sensibly | **Manual** — VoiceOver (Cmd+F5) |

## Content

| ID | Behaviour | Guard |
|----|-----------|-------|
| C1 | Event listings: chronological, unique ids, valid dates, every picture exists and is described; every place reads "City, Country" or "Online"; the founding (June 27, 2026) comes first | Auto — unit:events |
| C2 | Board photographs exist, are ≤ 300 KB, and are described; bios hold no "lorem ipsum" or "TODO" | Auto — unit:site |
| C3 | The gallery lists the works in `gallery-photos.ts` order, each joined with its prepared sizes; a work with none is left out | Auto — unit:gallery |
| C4 | Dates are never shifted a day by the time zone (tests run in America/Vancouver) | Auto — unit:events |
| C6 | Every board member has a bio (none shows "Bio coming soon.") | Auto — unit:site; unit:BoardSection |
| C7 | Every event picture, cover or in the details, opens whole in the photo viewer | Auto — unit:EventsBrowser; e2e › event pictures › a cropped picture opens whole… |
| C5 | **No personal email addresses anywhere on the page** — `info@ccvaa.ca` is the only address shown; board members are reached through it | Auto — unit:site › email policy; e2e › content policy |

## Pipeline

| ID | Behaviour | Guard |
|----|-----------|-------|
| P1 | Lint, typecheck, unit, and browser tests run in parallel on every pull request | Auto — `.github/workflows/ci.yml` |
| P1b | **Nothing merges to `main` unless CI passed**: the `main` ruleset requires a pull request, the `ci-ok` check (green only if every CI job is), and an up-to-date branch; no force pushes, no deletion, no bypass — admins included | Auto — GitHub ruleset "main: CI must pass" |
| P2 | A failing unit test stops a deploy | Auto — `.github/workflows/deploy-pages.yml` |
| P3 | Static export only: no route handlers, middleware, or server data | Auto — `npm run build` fails otherwise |
