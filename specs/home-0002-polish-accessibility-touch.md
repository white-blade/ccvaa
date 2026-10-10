# home-0002 — Contact tab, art-site polish, accessibility, board profiles, touch, tests

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`home-0001`](home-0001-single-page.md) |
| **Source** | CEO (2026-10-09) |

## Goal

Requests made against the one-page site from `home-0001`, in order:

1. A nav tab for the Contact section.
2. Review the whole page and make it feel like an art website.
3. Reuse code where possible; refactor and fix what needs it.
4. Stay responsive at every viewport size.
5. Support disability access and keyboard use throughout.
6. A simpler but more striking Contact section.
7. Board role cards (President, …) open a profile with photo and description —
   placeholder text for now.
8. Click, hover, and scroll behaviour that works on touch devices of every size.
9. A more elaborate scroll-to-section effect.
10. Sufficient tests, run in parallel where possible.

## Navigation

```
Nav:  About · Gallery · Events · Contact      (anchors on /)
```

- `navigation` in `site.ts` holds `{ label, id }`; section numbers (01–04) are derived
  from its order by `sectionNumber()`, so numbering and nav cannot disagree.
- The header marks the section on screen (`useActiveSection`, `aria-current`), shows
  a reading-progress line along its lower edge, and below `md` folds into a menu
  button. The menu closes on a link, on Escape (focus returns to the button), and on
  a tap outside the header.

### Section glide

Every same-page link (`href="#…"`: nav, menu, hero buttons, footer, skip link) is
routed by one document listener (`SectionLinks`) through `scrollToSection`:

- An eased glide (cubic in-out), 450–1100 ms scaled by distance.
- Any wheel, touch, or key from the visitor cancels it — the page never fights them.
- On landing: focus moves to the section (`tabIndex={-1}`), the URL hash updates
  (`pushState`, so Back works), and `data-arrived` is set for 1.4 s, which plays the
  arrival flourish in `globals.css` — the eyebrow rule stretches and a coral
  underline sweeps through the title.
- `prefers-reduced-motion`: a plain jump; no flourish.
- Modified clicks (new tab/window) and unknown anchors are left to the browser.

CSS `scroll-behavior: smooth` is removed from `<html>`: it would animate every step
of the scripted glide.

## Look

- **Sections** share one shell (`Section`): numbered eyebrow (`01 — Who we are`),
  large display title, optional description, soft colour blooms, and a tone —
  `light`, `mist`, or `dark`. Order and rhythm: About (light) → Gallery (dark) →
  Events (light) → Contact (mist) → footer (dark).
- **Film grain**: a fixed, click-through SVG-noise overlay at 5% opacity.
- **Scroll reveal** (`Reveal`): content fades up once as it enters view. It starts
  hidden only under `html.js` (set by an inline script) and
  `prefers-reduced-motion: no-preference`, reveals on focus as well as on scroll, and
  is always visible in print — so no visitor ever meets an empty section.
- **Hero**: two calls to action (gallery, events) and an animated scroll cue.
- **About**: paragraphs beside a dark pull-quote card; purposes as a hairline grid
  with large italic numerals.
- **Contact**: one gesture — the email set large as a link, with an underline that
  draws in on hover/focus and a round arrow — and the postal address as a single line
  beneath. Replaces two cards.
- **Footer**: wordmark and tagline, the section links, and contact details.

## Board profiles

- Each board card opens `BoardMemberDialog`: portrait beside role, name, and bio, with
  ←/→ buttons, arrow keys, and swipe stepping through the board (wrapping). The
  "Show bios" toggle is removed — the cards are the way in.
- **Placeholders, deliberately**: with no portraits yet, the dialog shows a monogram
  labelled "Portrait coming soon"; every `bio` is lorem ipsum — unmistakably filler,
  rather than invented text about real, named people. **Replace before launch.** A
  portrait is a file in `public/board/` plus `portrait: "file.jpg"` on the member.

## Reuse and fixes

| Was | Now |
|-----|-----|
| Two copies of the expand/collapse heading (Board, Purposes) | `Disclosure` |
| Section heading, container, and blooms written per section | `Section` |
| Backdrop + panel + `useDialog` written per dialog | `Modal` (event and board dialogs) |
| Each dialog's caller tracking its opener; the gallery's inside a state updater (a side effect in a pure function) | `useDialog` restores focus to the opener itself |
| Hover handlers repeated on cards and dots | `hoverFocusHandlers` |
| `BrandMark` props nothing passed; `Header`'s `overlayHero` flag | removed |

Bugs fixed along the way:

- **Dialogs sat beneath the fixed header** — every section is an `isolate` stacking
  context, so a dialog rendered inside one could not rise above it. All dialogs and
  the photo viewer are now portalled to `<body>`.
- **Hero image warning** — `next/image` `fill` had a `sticky` parent; it now has a
  positioned wrapper.
- **Calendar-era leftovers** in comments and copy cleaned up.

## Accessibility

- Skip link as the first Tab stop, to a focusable `<main>`.
- Every control has a visible `focus-visible` ring; the brand link is named
  ("… — back to top").
- Disclosure toggles keep the heading as their name and report `aria-expanded`.
- Dialogs: focus moves in on open and back to the opener on close, Tab is trapped,
  Escape closes, arrow keys step where there is a collection.
- Timeline: ↑/↓ (and ←/→) step between dots; each dot's name carries title, dates,
  and place; the zoomed preview sits outside the button so the visible text and the
  accessible name agree.
- Contrast: `coral-dark` darkened to `#83603d`, which holds 4.5:1 on cream, white,
  and `ocean-50`; small text that used `ocean-400` moved to `ocean-500`.
- Motion: everything animated sits behind `motion-safe`, and the glide becomes a jump.

## Touch

- `hoverFocusHandlers` counts mouse and pen hover and keyboard (`:focus-visible`)
  focus only. A tap fires emulated enter/focus with no matching leave, which had left
  highlights stranded on cards and dots.
- Timeline on touch: the first tap previews a dot, a second tap (or a tap on the
  preview) opens it. The preview lasts until another card becomes the one being read,
  or a tap lands outside the timeline. An earlier version cleared it on any scroll and
  then on 48 px of scroll; the browser suite showed a tap's own drift can exceed
  that, cancelling the second tap.
- Nothing depends on hover alone: gallery labels show permanently on touch screens
  (`pointer-coarse:`).
- Tap targets ≥ 40 px (dots, per-row buttons, search clear); close buttons 44 px.
- The search field is 16 px on touch screens, so iOS does not zoom into it.
- Dialogs use `90dvh` and `overscroll-contain`, so mobile toolbars and scroll
  chaining do not break them.
- Swipe left/right in the photo viewer and board profiles (in `useDialog`); only a
  clearly horizontal one-finger swipe counts, leaving vertical scroll and pinch-zoom
  alone.
- The timeline stays hidden below `lg` (1024 px); there is no room beside the list,
  and every card carries its own date.

## Tests

| Suite | Runs in | Covers |
|-------|---------|--------|
| **Unit** — Vitest, `src/**/*.test.ts(x)`, 103 tests | jsdom; pure-logic files in Node | logic (timeline layout, search, listings, gallery read, column store, glide, swipe, hover rules), components (header, sections, disclosure, board, gallery, events, contact, links), axe on each component |
| **Browser** — Playwright, `e2e/`, 54 runs | real Chrome on desktop, touch tablet, touch phone | sideways overflow at 320–1920 px, full-page axe **with colour contrast**, keyboard path, reduced motion, section glide and arrival, tap-to-preview, swipes, tap-target sizes, dialogs over the header |

`src/test/axe.ts` turns off two axe rules in component tests, both whole-page rules
the browser suite does check: `color-contrast` (jsdom computes no styles) and `region`
(a component alone has no `<main>`).

### Parallel

- **Vitest** runs test files in parallel workers: ~1.5 s, against ~8.2 s serially on
  the same machine. Thread workers measured ~0.15 s faster; process workers are kept
  for isolation. Files that need no DOM run in the Node environment.
- **Playwright** runs fully parallel across the three device projects (~18 s).
- **CI** (`ci.yml`) runs lint, typecheck, unit, and browser tests as four parallel
  jobs on every push and pull request; it previously ran lint, typecheck, and build
  in sequence with no tests. The browser job builds the export, serves it under
  `/ccvaa` with a dependency-free static server, and keeps traces of failures.
  `deploy-pages.yml` still gates publishing on the unit suite.

Locally the browser suite drives the installed Google Chrome (`channel: "chrome"`), so
nothing is downloaded; CI installs Playwright's Chromium.

## Open

- **Board bios are lorem ipsum** and portraits are monograms — replace before launch.
- The dev server twice served stale CSS after `globals.css` edits made while a
  production build ran; restarting `npm run dev` fixes it.
