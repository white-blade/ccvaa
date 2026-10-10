# home-0006 — Gallery viewer, scroll transitions, first-load entrance, profile layout

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0005`](home-0005-purposes-and-section-switching.md) |
| **Source** | CEO (2026-10-09) |

## Goal

1. Improve the gallery experience.
2. A transition effect between sections while scrolling.
3. Something to catch the eye on first entering the page.
4. No empty space below the photo in board profiles.
5. No personal email addresses on the page (policy; see
   [`home-0004`](home-0004-board-photos-bios.md)).

## 1. Photo viewer

A review against how people browse photographs found the viewer stepped one at a
time with no view of the set, fetched each photograph only when asked (a visible
wait), swapped instantly, had no touch dismissal, and hid its keyboard shortcuts.

- **Thumbnail strip** under the photograph: the whole set, the current one ringed
  (`aria-current`), any one a tap away; the strip keeps the current one centred
  by scrolling itself, never the page.
- **Neighbours fetched ahead**: opening or stepping preloads the next and previous
  photographs, so a step never waits.
- **Directional slide**: the photograph enters from the side the visitor moved
  toward (a gentle zoom on first open); a soft shimmer holds the space while one
  loads.
- **Swipe down to close** on touch, as in photo apps (`useDialog`'s new
  `onSwipeDown`); left/right still step.
- **Keyboard hint** ("← → to browse · Esc to close") for mouse and keyboard users
  only (`pointer-fine`); touch has its gestures.
- Opens with a short fade; respects the notch; long captions clamp to two lines.

## 2. Scroll-driven section transitions

Progress follows the scroll position (`animation-timeline: view()`), so effects run
as fast as the visitor — or the section glide — scrolls, and reverse going back up.
Pure CSS, behind `@supports (animation-timeline: view())` and
`prefers-reduced-motion: no-preference`; elsewhere the page is unchanged.

- **Aperture**: tinted sections (Gallery, Contact) open like a window — inset with
  rounded corners as they enter, full bleed by the time they fill the lower part of
  the screen. Light sections are left alone: cream on cream shows no edge.
- **Ghost numerals**: each section's number, huge and outlined, drifts behind its
  heading against the scroll. Drawn by CSS from `data-ghost` (`::before`), so it is
  decoration only — not text to screen readers or contrast checks. The outline has
  its own ink per tone (`--ghost-ink`): the first version stroked in `currentColor`,
  which was the transparent fill, and drew nothing.
- **Hero recede**: the hero's copy dims, blurs slightly, and sinks as About slides
  over it.

### Round two: motion inside the sections

Same timelines and gates as above:

| Effect | Where |
|--------|-------|
| A coral hairline draws outward across the top of each arriving section | every section (`.fx-divider::before`) |
| Titles rise into place as their letters draw together | section headings (`.fx-title`) |
| Tiles unfold from an inset frame while the photograph zooms out to fit | gallery (`.fx-tile`, `.fx-tile-image`) |
| Cards glide in from alternate sides, a slight tilt straightening | event listings (`.fx-cards > li`) |
| Rows rise into place as they arrive | purposes (`.fx-rise`) |
| The email is written left to right as it comes into view | contact (`.fx-write`) |
| The photograph drifts inside its frame | board group photo (`.fx-parallax`) |

**Text never fades.** Every text-bearing effect moves by transform or clip only, so
text is at full contrast wherever the scroll stops; a browser test samples the whole
page to hold that. The tile effects animate `clip-path` and `transform`, which
compose with the hover lift (`translate`) and zoom (`scale`) — separate properties
in Tailwind v4 — so hover still works mid-effect. On phones the ghost numerals are
smaller (6rem), clear of the eyebrow.

Found while checking these on a portrait tablet: jumping back up to Events left the
date rail marking the last card read. The rail now clears its mark when that card
leaves the middle of the screen **downward** (the visitor went back above it), and
keeps it when it leaves upward (read past — as when a chip glides the last card to
the top of a tall screen). Browser tests hold both.

## 3. First-load entrance

CSS keyframes, so it starts with the first paint and needs no script:

| t (ms) | What |
|--------|------|
| 0 | The photograph fades up from dark and settles from a 1.12× zoom (2.4 s) |
| 150 | The header drops in |
| 250–350 | A coral rule draws; the eyebrow fades in |
| 450 + 80/word | The headline rises word by word from behind a mask |
| ~1.5 s | Subheadline, then the calls to action, then the scroll cue |

Every step ends at the resting layout, and every one is `motion-safe:` — with
reduced motion nothing animates and nothing is hidden. The dark veil rests at
`opacity: 0`, so it can never be left covering the photograph. The headline stays
one heading to assistive technology. The browser suite waits for the entrance to
finish before measuring contrast.

## 4. Profile layout

The photo column stretched with the bio; below the fixed-frame photo was empty dark
space, and the name scrolled away with long bios. Now the dark column carries who
the person is: the portrait (its lower edge melting into the panel), then role,
name, and website, with ← → pinned to its foot. The white column holds only the
bio, centred when short (`my-auto`, which still starts at the top when long). An
empty bio shows a styled "Bio coming soon."

## 5. Email policy

No personal email was on the site — `Bios.docx` held none — so nothing was removed.
The rule is recorded (`site.ts`, `CLAUDE.md`, `quality-0001` C5) and enforced: the
content test and the browser suite both fail on any address other than
`info@ccvaa.ca`.

## Verified

165 unit tests and 196 browser runs (six devices) pass; axe clean, contrast included;
entrance frames and scroll effects reviewed in screenshots.
