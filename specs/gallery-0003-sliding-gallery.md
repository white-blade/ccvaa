# gallery-0003 — The sliding gallery

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0006`](home-0006-gallery-viewer-motion-profile.md), [`home-0003`](home-0003-device-optimized.md), [`quality-0001`](quality-0001-regression-checklist.md) |
| **Supersedes** | the grid and per-row control of [`gallery-0002`](gallery-0002-gallery-page.md) |
| **Source** | CEO (2026-10-09) |

## Goal

Turn the gallery from a grid of tiles into a sliding gallery: one photograph at a
time, shown large, with who took it and when. Remove the per-row control and the
photo count. Keep the full-size viewer, and make sure it always shows the whole
photograph.

## Design

### Photo details: `src/lib/gallery-photos.ts`

One standalone data file, separate from the loader, that a non-developer can edit:
an array of `{ file, alt, description?, author?, takenAt? }`, one entry per file in
`public/photos/`. `gallery.ts` still reads the folder at build time and joins each
file with its entry; a file without one still shows, with a generic alt text.

- `alt` describes what is in the picture (unchanged from the old `PHOTO_ALT` map).
- `description` is the caption shown beside the photograph — shorter and warmer than
  the alt text. When missing, the alt text stands in.
- `author` and `takenAt` (`YYYY-MM-DD`) are optional. The UI shows what it has; with
  neither, the credits are just the counter and the caption — no empty lines.

> **The authors, dates, and captions now in the file are placeholders** — invented
> names and past dates, so the design could be judged with full information. A note
> at the top of the file says so. They must be replaced with the real credits before
> launch. The alt text is real.

Dates are formatted by `formatIsoDate` in `lib/text.ts`, read straight off the
string ("2024-10-19" → "October 19, 2024") — never through `new Date()`, which shifts
a date-only value a day west of Greenwich (tests run in `America/Vancouver`).

A unit test (`gallery-photos.test.ts`) holds the file to the folder: every photo has
an entry, every entry has a photo, each once; dates are real and not in the future;
no field is blank. So adding a photograph is now a file drop *plus* one entry.

### Wide (≥ 768, `md`)

- One photograph at a time, `object-cover`, filling a stage sized to the section:
  `clamp(26rem, 68svh, 44rem)` tall, the container's width.
- **The veil**: three layers over the photograph — a gradient clear on the left
  deepening to `ocean-950` at ~90% on the right, a `backdrop-blur-xl` masked to the
  right side (the frosted part), and a faint diagonal white sheen masked the same way
  (the gloss). Wide screens only.
- **The credits**, top right, over the veil: the counter (`01 / 06`, coral, tracked
  capitals), the author in `font-display`, the date in `ocean-100`, a short coral
  rule, then the caption. Text is white/`ocean-100`/coral on ≥ 88% `ocean-950`, so it
  meets contrast whatever the photograph (axe colour-contrast runs in e2e).
- Below the stage: previous, the dots, next. The current dot is a coral pill with
  `aria-current="true"`; the others are small pale dots. Each is named "Show
  photograph n".
- Top left of the stage: a round glass pause/play button.
- Bottom left: a "⤢ View full size" mark, always visible. The whole photograph is the
  button; its name is the alt text plus "View full size".

### Narrow (< 768)

- A card: the photograph (4:3, cover), then the same credits beneath it, in flow. No
  veil. The caption clamps to three lines; the card reserves a minimum height so the
  page does not jump as the slideshow changes captions.
- Swipe left/right on the card steps (via `lib/swipe.ts`: a swipe must clearly favour
  the horizontal, so vertical scrolls, diagonals, and pinches are left alone).
  Previous/next and the dots work too — dots are 28 × 40px on touch.
- A tap opens the same viewer.

One markup serves both: the credits block is `md:absolute md:right-0 md:top-0` over
the photograph, or in flow below it. Width alone decides — never the user agent.

### The viewer

Unchanged in behaviour (arrows, swipe, thumbnails, Escape, focus return, scroll lock,
stacked over an event dialog for event pictures). It always shows the photograph
whole (`object-contain`, inside the screen), which is the "expand" the slideshow's
cover crop needs; "View full size" on the slide is the explicit affordance. Above the
caption it now shows the author and date (coral, tracked capitals) when present.
Stepping in the viewer moves the slideshow too, so closing lands on the photograph
last seen, with focus back on it.

### Motion

- A step slides the photograph in from the side moved toward (the viewer's
  `photo-from-left/right` keyframes); the first slide is simply there.
- The credits re-enter with `caption-in`: transform only, never opacity, so text
  contrast holds even mid-change.
- All of it `motion-safe`. The stage keeps the round-two scroll effect (`fx-tile`
  unfold, `fx-tile-image` zoom), on separate wrappers so it composes with the slide
  and the hover zoom.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Autoplay interval | **6 seconds** (`galleryContent.autoplaySeconds`) | Long enough to read a caption of two lines; WAI's carousel guidance and common galleries sit at 5–7s |
| Timer | A fresh timeout per slide, not an interval | A photograph chosen by hand gets its full six seconds |
| Pause rules | Holds on **mouse hover**, on **keyboard focus inside** (`:focus-visible`, as `hoverFocusHandlers` does, so a tap does not strand it), while the **viewer is open**, and while the **tab is hidden**. A visible **pause/play button** stops it until pressed again (WCAG 2.2.2) | Nothing moves while someone is looking, reading, or away |
| Reduced motion | Never starts on its own; the button shows "Play" and works if pressed | Pressing play is the visitor's choice, not autoplay |
| Announcements | `aria-live="off"` while playing, `polite` otherwise | Screen readers hear slides the visitor changed, not one every six seconds (WAI carousel pattern) |
| Carousel semantics | `role=region` + `aria-roledescription="carousel"`, each slide a `role=group` "n / N" with `aria-roledescription="slide"` | WAI-ARIA carousel pattern |
| Breakpoint | `md` (768) | Matches the tab bar / header split; below it the veil would cover too much of a small photograph |
| Dots on touch | 28 × 40px | Six 40 × 40 dots plus two arrows do not fit at 320px; 40px height meets T1, and 28px exceeds WCAG 2.5.8's 24px |
| One photograph | No dots, arrows, pause, or autoplay | Nothing to step through |
| Keyed elements | Only the picture and credits are keyed by photograph; the button stays mounted | So focus can return to it from the viewer |
| `ColumnControl`, `use-columns` | Deleted, with their tests and copy | Their only user was the grid |

## Regression guards

Added to [`quality-0001`](quality-0001-regression-checklist.md): **S1–S10** (the
slideshow), **G6** (the viewer shows the whole photograph with credits), **L10b**
(the wide layout), **M9** (captions never fade); **L10** retired and replaced by the
phone card; G1–G5, A4, M7, M8, T3, T6 re-pointed at `GallerySlider`.

- Unit: `GallerySlider.test.tsx` (steps, wrap, dots and `aria-current`, swipe,
  credits with and without author/date, autoplay with fake timers, every pause rule,
  reduced motion, the viewer's credits, keyboard, focus return, axe),
  `gallery-photos.test.ts`, `gallery.test.ts` (the join), `text.test.ts`
  (`formatIsoDate`).
- Browser (`e2e/site.spec.ts`, six devices): the wide stage, veil, and credits; the
  phone card without a veil; dots jump and highlight; swipe; the viewer shows the
  whole photograph with credits and returns focus; autoplay on `page.clock` — it
  advances, pauses, holds on hover, and stays still under reduced motion; no sideways
  scroll; full-page axe with contrast; tap sizes for every gallery button.

## Open

- **Real credits.** Every author, date, and caption is a placeholder.
- `public/photos/3.jpg` is 625 KB, over the 300 KB budget (pre-existing).
