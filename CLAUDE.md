# CCVAA Web — project guide

Public website for the **Coast to Coast Visual Arts Association**, a non-profit
registered in British Columbia, Canada.

## What this is

A **static site**. Next.js App Router compiled with `output: "export"` and served by
GitHub Pages. There is no server, no database, no API routes, and no secrets — by
design, not by omission. See
[`specs/platform-0002-github-pages-static-migration.md`](specs/platform-0002-github-pages-static-migration.md)
for what was removed and why.

Do not reintroduce server-dependent code (route handlers, `next/headers`, middleware,
`cookies()`, server-side data fetching). `next build` will fail, and if it somehow
passes, Pages cannot run it.

## This is NOT the Next.js you may know

Next.js 16 has breaking changes from earlier versions. Read the relevant guide under
`node_modules/next/dist/docs/` before using an unfamiliar API, and heed deprecation
notices. Notably: `proxy.ts` replaces `middleware.ts` — but neither applies here, since
static export supports no middleware at all.

## The page

One page, `/`, no other routes:

```
Hero → #about (board, purposes) → #gallery → #events → #contact → footer
Nav: About · Gallery · Events · Contact
```

- **About**: the board — a group photograph and a card per member that opens a profile
  (portrait, bio, website) — and the ten purposes as an accordion.
- **Gallery**: the works listed in `src/lib/gallery-photos.ts`, as a sliding gallery —
  one work at a time, prev/next and a sliding window of at most 7 dots (any number of
  works), swipe on touch, a 6s slideshow with a pause button. From 768 the work fills
  the stage with its author, medium, date, caption, and licence at the top right over
  a frosted veil; below, a card with the credits under it. Selecting it opens the
  full-size viewer (with a full view). Pictures are progressive: a blurred preview,
  then the smallest prepared size that is sharp (`srcset`). See `specs/gallery-0003`,
  `gallery-0004`.
- **Events**: listings, beside a date-scaled **timeline** (≥ 1024px) or a sticky
  **date rail** (below) whose chips show the date with its year and the city and country.
- **Contact**: the email, set large, and the postal address.

**Devices** are told apart by CSS media features — width for layout, `pointer-coarse:`
for touch — never by user agent. Phones (< 768) get a bottom tab bar instead of header
links, and below 640 dialogs are bottom sheets. See
[`specs/home-0003-device-optimized.md`](specs/home-0003-device-optimized.md).

**Navigation** between sections goes through one document listener (`SectionLinks`):
an eased, interruptible glide; focus and an arrival flourish on landing; the nav marks
only the destination while gliding; Back/Forward glide too; the address follows the
section being read.

**Motion**: a CSS-only entrance on first load (the photograph settles, the headline
rises word by word), scroll-driven transitions (`animation-timeline: view()`: tinted
sections open like a window, ghost numerals drift, the hero recedes; inside sections a
divider draws, titles settle, the gallery stage unfolds, event cards glide in, purposes
rise, the email writes itself, the board photo drifts), and the glide. Scroll effects
on text move by transform or clip only — never opacity or colour — so contrast holds
wherever the scroll stops. All of it is `motion-safe` and progressive — reduced motion, or a browser
without scroll timelines, gets the page as is, nothing hidden.

History of the design decisions: `specs/home-0001` … `home-0008`, `gallery-0003`.

## Layout

```
src/app/         page.tsx (the one page), layout.tsx, globals.css, icon.svg
src/components/  Header, TabBar, BackToTop, Hero, Footer, BrandMark, CoastToCoastLogo
                 AboutSection, BoardSection, BoardMemberDialog, PurposesSection
                 GallerySection, GallerySlider, GalleryLightbox
                 EventsSection, EventsBrowser, EventsTimeline, EventsDateRail,
                 EventCard, EventDialog
                 ContactSection
                 shared: Section (numbered section shell), Reveal, Modal (dialog
                 shell; a bottom sheet on phones), SectionLinks, styles.ts
                 (shared class strings: subsection heading, round buttons)
src/lib/site.ts  ALL copy and config — edit here first
src/lib/         events.ts, timeline.ts, gallery.ts (joins works with their sizes),
                 gallery-photos.ts (each work's alt, caption, author, date, licence),
                 gallery-photo-sizes.json (written by `npm run photos`), dot-window.ts,
                 asset.ts, scroll-to-section.ts, use-active-section.ts (one shared
                 store), use-dialog.ts, use-autoplay.ts, use-today.ts, hover-focus.ts,
                 swipe.ts, strip.ts, text.ts
src/test/        shared test helpers (fixtures, axe)
e2e/             Playwright browser suite and the static server it uses
public/          photos/ (gallery, generated), events/, board/, images/
scripts/         gallery-photos.mjs (`npm run photos`)
specs/           specs and decision records — start with quality-0001
assets/          source originals, not deployed
```

**Content changes go in `src/lib/site.ts`.** Org details, navigation, hero copy, the
board (bios, portraits, website), the ten purposes, and contact info all live there;
event listings live in `src/lib/events.ts`; each gallery work's alt text, caption,
author, date, medium, and licence live in `src/lib/gallery-photos.ts`. Gallery images
are never hand-sized: `npm run photos -- <folder of originals>` writes three AVIF
sizes per work into `public/photos/` (≤ 300 KB each) and a blurred preview; the
originals stay out of the repo. Works under CC BY / BY-SA keep their real creator,
licence, and source link — that is the licence's condition. Components read from them and stay
presentational. Images are pre-sized before committing (≤ 1920px, ≤ 300 KB) — Pages
serves exactly what is committed.

## Commands

```bash
npm install
npm run dev          # http://localhost:3000/ccvaa/
npm run build        # static export to out/
npm run lint
npm run typecheck
npm test             # Vitest, once; `npm run test:watch` to keep it running
npm run test:e2e     # Playwright against out/ — build first; E2E_PORT=4180 to run
                     # beside a test server already on 4173
npm run photos -- <dir>  # gallery originals → public/photos/ sizes + previews
```

## Tests and the regression checklist

**[`specs/quality-0001-regression-checklist.md`](specs/quality-0001-regression-checklist.md)
is the bar for "done".** It lists every behaviour the site promises — layout per
device, touch, section navigation, accessibility, content — and the test that guards
each. A big change is finished only when every line still holds. Change a behaviour on
purpose? Change its checklist line and its test in the same pull request.

- **Unit** (Vitest, `src/**/*.test.ts(x)`): jsdom, pinned to `America/Vancouver` so
  date bugs west of Greenwich show up; pure-logic files run in Node. Files run in
  parallel. Logic worth testing goes in `src/lib/` as plain functions. Component tests
  call `expectNoAxeViolations` from `src/test/axe.ts`.
- **Browser** (Playwright, `e2e/`): serves `out/` under `/ccvaa` as Pages does and runs
  every test in parallel on six devices — Chromium desktop, touch tablet, and touch
  phone; WebKit (Safari's engine) iPhone, iPad, and portrait iPad. Layout and overflow,
  full-page axe with contrast, touch input, stickiness, and section navigation are
  checked here because jsdom cannot. Device rules come from each project's width and
  touch, not its name. Locally the Chromium projects drive the installed Chrome (run
  `npx playwright install webkit` once); CI installs both.
- **CI** runs lint, typecheck, unit, and browser tests as parallel jobs on every push
  and pull request. The browser suite is split into a job per device, each WebKit
  device in two shards; a pull request that changes only docs (`*.md`, `specs/`,
  `assets/`) skips the unit and browser suites. A final `ci-ok` job passes only if
  every job passed or was rightly skipped. Deploys also run the unit suite before
  building.
- **`main` is protected** (GitHub ruleset "main: CI must pass"): changes land only by
  pull request, and only once `ci-ok` is green on a branch up to date with `main`.
  No force pushes, no deletion, and no bypass — for admins too. A new CI job needs no
  ruleset change: `ci-ok` waits on it once it is added to `ci-ok`'s `needs`.

## Deploy

Push to `main` → `.github/workflows/deploy-pages.yml` builds and publishes to GitHub
Pages. Pages source must be set to **GitHub Actions** in repo settings.

`basePath` is `/ccvaa`, so the site serves from the project page and every local URL
carries that prefix too (`http://localhost:3000/ccvaa/`). There is **no `public/CNAME`**
— `ccvaa.ca` is not pinned yet, despite `siteConfig.url` naming it. Switching to the
custom domain means adding `public/CNAME` *and* setting `basePath` to `""`; one without
the other breaks every asset path.

## Conventions

- Branch for changes; don't commit to `main` directly. Don't push unless asked.
- Never commit secrets. There are none to commit — keep it that way.
- **No personal email addresses, anywhere on the page.** The organization's
  `info@ccvaa.ca` is the only address the site shows; board members and everyone
  else are reached through it. This holds for bios and any future content too. A
  member's own public website may be linked. Tests fail on any other address
  (`src/lib/site.test.ts`, and the browser suite on the built page).
- Match surrounding style: Tailwind utility classes, `@/` import alias, comments only
  where intent isn't obvious from the code.
- New sections go through `Section`; its number comes from the section's place in
  `navigation`, so add the nav entry too. In-page links are plain `href="#id"` —
  `SectionLinks` gives them the glide; don't wire scrolling per link.
- Fixed and sticky elements read the header's measured height from `--header-h` and
  pad for notches with `env(safe-area-inset-*)`.
- Never put `overflow-hidden` on an ancestor of something sticky: it makes a scroll
  container and the sticky element stops sticking. Use `overflow-clip`.
- Dialogs go through `Modal` (or portal like `GalleryLightbox`): sections are stacking
  contexts, so a dialog rendered inside one sits under the fixed header.
- Floating controls must not cover content: check them at 320, 768, and 1024px.
- Reuse before writing: swipes go through `lib/swipe.ts`, horizontal strips centre
  with `lib/strip.ts`, round icon buttons and subsection headings use
  `components/styles.ts`, dialogs use `Modal`, sections use `Section`. Before adding
  a helper, look for one; before adding an export, check it has a second user.
- Accessibility is a requirement, not a polish pass: every control reachable and
  operable by keyboard with a visible `focus-visible` ring; hover effects mirrored on
  focus (`hoverFocusHandlers`, which also keeps a tap from stranding a highlight);
  nothing that only works on hover (touch has none); tap targets of 40px or more;
  motion behind `motion-safe`; visible text included in accessible names; small text
  on light backgrounds in `coral-dark` or `ocean-500`+ (lighter shades fail 4.5:1).
- Before calling work done: `lint`, `typecheck`, `test`, `build`, `test:e2e`, and the
  manual lines of the regression checklist when the change touches layout or input.
