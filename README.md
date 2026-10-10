# Coast to Coast Visual Arts Association (CCVAA)

Public website for the Coast to Coast Visual Arts Association — a non-profit
organization registered in British Columbia, Canada.

**Static site.** No server, no database, no secrets. Built with Next.js static export
and hosted on GitHub Pages.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router, `output: "export"`) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [GitHub Actions](https://github.com/features/actions) for CI (lint, typecheck, build) and deploy
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
| `npm test`          | Vitest suite, once       |
| `npm run test:e2e`  | Playwright, after a build |

There is no `start` script — `out/` is plain static files. Preview a production build
with `npm run build && npx serve out`.

## Page

One page, `/`, in sections the header links to:

| Section    | What it is                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| Hero       | Headline over the coast photograph                                          |
| `#about`   | About, the board, and the ten purposes                                      |
| `#gallery` | Every photograph, 2–5 per row, each opening a full-size viewer              |
| `#events`  | Searchable listings beside a date-scaled timeline; each opens a detail dialog |
| `#contact` | Email and mailing address                                                   |

The header links all four sections and marks the one on screen. Phones and tablets get
their own layouts rather than a squeezed desktop: a bottom tab bar, bottom-sheet
dialogs, and a date rail in place of the side timeline — see
[`specs/home-0003-device-optimized.md`](specs/home-0003-device-optimized.md). The page is keyboard-operable throughout (skip link, focus rings, arrow keys
on the timeline and in the photo viewer) and is checked with axe in the test suite.

## Project structure

```
src/
├── app/
│   ├── page.tsx            the one page
│   ├── layout.tsx, globals.css, icon.svg
├── components/             presentational; they read content from lib/
└── lib/
    ├── site.ts             ALL copy and config — edit here first
    ├── events.ts           event listings (content, not data)
    ├── event-search.ts     listing search
    ├── timeline.ts         where each event sits on the timeline
    ├── gallery.ts          build-time read of public/photos/
    ├── asset.ts            basePath prefixing for public/ files
    ├── use-dialog.ts       shared modal behaviour
    └── use-columns.ts      shared "per row" preference
public/
├── photos/                 gallery — drop a file in, it appears after a rebuild
├── events/                 event pictures
└── images/                 logo, hero
assets/                     source originals, never deployed
specs/                      architecture specs / decision records
```

### Updating content

| To change…                  | Edit…                                            |
| --------------------------- | ------------------------------------------------ |
| Copy, nav, board, purposes  | `src/lib/site.ts`                                |
| Event listings              | `src/lib/events.ts`                              |
| Gallery photographs         | add or remove files in `public/photos/`          |

**Adding a photograph takes no code change.** `src/lib/gallery.ts` reads
`public/photos/` at build time, so dropping a file in the folder and pushing is enough
— add a matching `PHOTO_ALT` entry to give it real alt text. Pre-size it first:
WebP/AVIF/JPEG, longest edge ≤1920px, ≤300KB. `images.unoptimized` is required on
Pages, so nothing resizes at build — whatever is committed is what visitors download.

Event pictures work the same way, except the file name is referenced from
`src/lib/events.ts`. An event's `details` may hold paragraphs *and* picture blocks.

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

## CI

Every push and pull request runs four jobs in parallel: lint, typecheck, the Vitest
unit suite (`src/**/*.test.ts(x)`), and the Playwright browser suite (`e2e/`) on six
devices across Chromium and WebKit (Safari's engine). The deploy also runs the unit suite before
building, so a failing test stops it.

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
[`specs/home-0001-single-page.md`](specs/home-0001-single-page.md), and
[`specs/home-0002-polish-accessibility-touch.md`](specs/home-0002-polish-accessibility-touch.md)
for the polish, accessibility, touch, and test work that followed.

## License

Copyright © Coast to Coast Visual Arts Association. All rights reserved.
