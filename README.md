# Coast to Coast Visual Arts Association (CCVAA)

Public website for the Coast to Coast Visual Arts Association — a non-profit
organization registered in British Columbia, Canada.

**Static site.** No server, no database, no secrets. Built with Next.js static export
and hosted on GitHub Pages.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router, `output: "export"`) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Vitest](https://vitest.dev/) + Testing Library + axe for unit tests;
  [Playwright](https://playwright.dev/) for the browser suite (Chromium and WebKit)
- [GitHub Actions](https://github.com/features/actions) for CI (lint, typecheck, unit,
  browser — in parallel) and deploy
- [GitHub Pages](https://pages.github.com/) for hosting

No runtime dependencies beyond `next`, `react`, and `react-dom`.

## Getting started

**Requirements:** Node.js 20+ (see `.nvmrc`)

```bash
npm install
npm run dev
```

Open [http://localhost:3000/ccvaa/](http://localhost:3000/ccvaa/) — note the path.
`next.config.ts` sets `basePath: "/ccvaa"` for a GitHub project page, and that prefix
applies in development too.

**There are no environment variables.** Nothing to copy, nothing to set; `npm run dev`
and `npm run build` both work with an empty environment. The one public value,
`NEXT_PUBLIC_BASE_PATH`, is injected by `next.config.ts` so that `assetPath()` can
prefix files in `public/`.

### Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Static export to `out/`  |
| `npm run lint`      | Run ESLint               |
| `npm run typecheck` | TypeScript check         |
| `npm test`          | Vitest unit suite, once  |
| `npm run test:watch`| Vitest, re-running on change |
| `npm run test:e2e`  | Playwright browser suite on six devices — build first |

For the browser suite locally, run `npx playwright install webkit` once; the Chromium
devices use your installed Google Chrome.

There is no `start` script — `out/` is plain static files. Preview a production build
with `npm run build && npx serve out`.

## Page

One page, `/`, in sections the header links to:

| Section    | What it is                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| Hero       | Headline over the coast photograph                                          |
| `#about`   | About; the board (group photo, profiles with portrait and bio); the ten purposes, each opening on its own |
| `#gallery` | A sliding gallery: one photograph at a time with its author, date, and caption; dots, arrows, swipe, and a pausable slideshow; each opens a full-size viewer |
| `#events`  | Listings beside a date-scaled timeline (a date rail of dates and places on smaller screens); each opens a detail dialog |
| `#contact` | Email and mailing address                                                   |

- **Navigation**: the header (or, on phones, a bottom tab bar) marks the section being
  read. Links glide to their section; Back/Forward glide too; the address follows
  along, so a shared link lands where you were. From 1280px a back-to-top button
  appears deep in the page.
- **Devices**: phones and tablets get their own layouts rather than a squeezed desktop
  — bottom tab bar, bottom-sheet dialogs, a date rail — see
  [`specs/home-0003-device-optimized.md`](specs/home-0003-device-optimized.md). Touch
  works throughout: tap-to-preview on the timeline, swipe in viewers, no hover-only
  controls.
- **Motion**: an entrance on first load, scroll-driven transitions between sections,
  and a photo viewer with thumbnails, directional slides, and swipe gestures — all
  switched off under reduced motion.
- **Accessibility**: keyboard-operable throughout (skip link, focus rings, arrow keys
  on the timeline and in viewers), reduced motion respected, axe-clean with colour
  contrast.

## Project structure

```
src/
├── app/
│   ├── page.tsx            the one page
│   ├── layout.tsx, globals.css, icon.svg
├── components/             presentational; they read content from lib/
├── lib/
│   ├── site.ts             ALL copy and config — edit here first
│   ├── events.ts           event listings (content, not data)
│   ├── timeline.ts         where each event sits on the timeline
│   ├── gallery.ts          joins each work with its prepared sizes
│   ├── gallery-photos.ts   each work's alt text, caption, author, date, medium, licence
│   ├── scroll-to-section.ts  the section glide
│   ├── use-active-section.ts which section is being read
│   ├── use-dialog.ts       shared dialog behaviour (keys, focus, swipe)
│   ├── swipe.ts, strip.ts, text.ts   small shared helpers
│   └── asset.ts, use-autoplay.ts, use-today.ts, hover-focus.ts
└── test/                   test helpers (fixtures, axe)
e2e/                        Playwright browser suite
public/
├── photos/                 gallery — drop a file in, it appears after a rebuild
├── events/                 event pictures
├── board/                  board group photo and portraits
└── images/                 logo, hero
assets/                     source originals, never deployed
specs/                      specs and decision records
```

### Updating content

| To change…                  | Edit…                                            |
| --------------------------- | ------------------------------------------------ |
| Copy, nav, purposes         | `src/lib/site.ts`                                |
| Board bios, roles, website  | `boardContent` in `src/lib/site.ts` — no personal email addresses, ever |
| Board photographs           | files in `public/board/`, named in `boardContent` |
| Event listings              | `src/lib/events.ts`                              |
| Gallery works               | `npm run photos -- <originals>`, then an entry in `src/lib/gallery-photos.ts` |
| Gallery credits and captions | `src/lib/gallery-photos.ts`, one entry per work  |

**Adding a work to the gallery** takes two steps and no component change:

1. `npm run photos -- <folder of originals>` — writes `<name>-sm/md/lg.avif` into
   `public/photos/` (longest side about 640 / 1280 / 1920px, each within budget,
   the large one ≤ 300 KB) and records their sizes and a tiny blurred preview in
   `src/lib/gallery-photo-sizes.json`. `<name>` is the file name without its
   extension or a leading `NN-`. Keep the originals outside the repo (they are
   megabytes each); run it again to regenerate.
2. Add an entry to `src/lib/gallery-photos.ts` with that `name`: alt text, caption,
   author, date, medium, and — for work that is not the association's own — its
   licence and source. Its order is the slideshow's order.

Unit tests fail if a work has no sizes, a file belongs to no work, a size is over
budget, or a licensed work lacks its creator, licence, or source. The current set is
landscape photography from Wikimedia Commons, credited to its real creators under CC
BY / BY-SA / public domain — replace it with members' work as it arrives.

Event pictures and board photographs work the same way, except their file names are
referenced from `src/lib/events.ts` and `boardContent` respectively. An event's
`details` may hold paragraphs *and* picture blocks. A board member with an empty `bio`
shows "Bio coming soon."; one without a `portrait` shows a monogram.

## Deployment

`.github/workflows/deploy-pages.yml` builds the static export and publishes it to
GitHub Pages on every push to `main`.

One-time setup: **Settings → Pages → Build and deployment → Source = GitHub Actions**.

### Custom domain — not currently wired

`next.config.ts` sets `basePath: "/ccvaa"`, which serves the site from the project page
at `https://<owner>.github.io/ccvaa/`. There is **no `public/CNAME`**, so `ccvaa.ca` is
not pinned, even though `siteConfig.url` already names it. Moving to the custom domain
takes both halves together:

1. add `public/CNAME` containing `ccvaa.ca`
2. set `basePath` to `""` in `next.config.ts`

Changing one without the other breaks every asset path. DNS is CEO-managed at Hover.

## Testing and CI

Every push and pull request runs four jobs in parallel: lint, typecheck, the Vitest
unit suite (`src/**/*.test.ts(x)`), and the Playwright browser suite (`e2e/`) on six
devices — Chromium desktop, touch tablet, and touch phone; WebKit (Safari's engine)
iPhone, iPad, and portrait iPad. The deploy also runs the unit suite before building,
so a failing test stops it.

**`main` only accepts changes through pull requests that pass CI.** A ruleset requires
the `ci-ok` check — green only when every CI job is — on a branch up to date with
`main`; there is no bypass, for admins included. Direct pushes and force pushes to
`main` are blocked.

**Before a big change merges**, walk
[`specs/quality-0001-regression-checklist.md`](specs/quality-0001-regression-checklist.md):
every behaviour the site promises, each with the test that guards it, plus the few
checks that need a real phone or a screen reader.

## Constraints worth knowing before you build

This is a static export. Route handlers, `middleware`/`proxy.ts`, `next/headers`,
`cookies()`, and server-side data fetching all fail the build — and could not run on
Pages even if they passed. Anything needing a server belongs with a service that
already does it properly, linked out from here.

Next.js 16 also differs from earlier versions in ways worth checking: read the relevant
guide under `node_modules/next/dist/docs/` before using an unfamiliar API.

## History

This site previously ran on Vercel with a members portal (email OTP, Stripe
memberships, newsletter), an admin console, and an embedded webmail proxy backed by
Neon Postgres. All of it required a server runtime and was removed in the move to
GitHub Pages. See
[`specs/platform-0002-github-pages-static-migration.md`](specs/platform-0002-github-pages-static-migration.md)
for the full rationale, the file inventory, and what would be required to bring any of
it back.

The static site later carried a `/membership` page of Stripe Payment Links and a Google
Form signup, and separate `/gallery` and `/events` pages. Membership was withdrawn and
the gallery and events folded into the home page — see
[`specs/home-0001-single-page.md`](specs/home-0001-single-page.md). What followed is
recorded in order: polish, accessibility, touch, and tests
([`home-0002`](specs/home-0002-polish-accessibility-touch.md)); phone and tablet layouts
([`home-0003`](specs/home-0003-device-optimized.md)); board photographs and bios
([`home-0004`](specs/home-0004-board-photos-bios.md)); the purposes accordion and
section-to-section navigation
([`home-0005`](specs/home-0005-purposes-and-section-switching.md)); the gallery viewer,
motion, and profile layout ([`home-0006`](specs/home-0006-gallery-viewer-motion-profile.md));
the sliding gallery with photo credits
([`gallery-0003`](specs/gallery-0003-sliding-gallery.md)).

## License

Copyright © Coast to Coast Visual Arts Association. All rights reserved.
