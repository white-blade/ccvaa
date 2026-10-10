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

## Layout

```
src/app/         page.tsx (the one page), layout.tsx, globals.css, icon.svg
src/components/  Header, Hero, AboutSection, BoardSection, PurposesSection,
                 GallerySection/Grid/Lightbox,
                 EventsSection/Browser/Timeline/DateRail/Card/Dialog, TabBar,
                 ContactSection, Footer, BrandMark, CoastToCoastLogo, ColumnControl
                 shared: Section (numbered section shell), Disclosure, Reveal,
                 Modal (dialog shell; a bottom sheet on phones), SectionLinks
src/lib/site.ts  ALL copy and config — edit here first
src/lib/         events.ts, event-search.ts, timeline.ts, gallery.ts, asset.ts,
                 use-dialog.ts, use-columns.ts, use-today.ts, use-active-section.ts,
                 hover-focus.ts
src/test/        shared test fixtures
specs/           architecture specs / decision records
assets/          source originals, not deployed
```

One page, `/`: hero, `#about`, `#gallery`, `#events` (listings beside a timeline),
`#contact`. There are no other routes and no membership — see
[`specs/home-0001-single-page.md`](specs/home-0001-single-page.md). Gallery photos come from `public/photos/`, read at build time — adding
one is a file drop, not a code change.

**Content changes go in `src/lib/site.ts`.** Org details, navigation, hero copy, the
board roster, the ten purposes, and contact info all live there. Components read from it
and should stay presentational.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
npm run lint
npm run typecheck
npm test           # Vitest, once; `npm run test:watch` to keep it running
npm run build && npm run test:e2e   # Playwright against out/: desktop, tablet, phone
```

Tests live beside the code as `*.test.ts(x)` and run in jsdom, pinned to
`America/Vancouver` so date bugs west of Greenwich show up. Logic worth testing goes
in `src/lib/` as plain functions (see `timeline.ts`, `event-search.ts`); components
stay presentational. Deploys run `npm test` before building.

`e2e/` holds the browser suite (Playwright). It serves `out/` under `/ccvaa` as Pages
does and runs every test in parallel on six devices — Chromium desktop, touch tablet,
and touch phone, and WebKit (Safari's engine) iPhone, iPad, and portrait iPad —
layout overflow, full-page axe with contrast, touch input, and section navigation are
checked there because jsdom cannot. Locally the Chromium projects drive the
installed Chrome (`npx playwright install webkit` once for WebKit); CI installs both. CI runs lint, typecheck, unit, and browser tests as parallel jobs.

Preview a production build: `npm run build && npx serve out` (or
`python3 -m http.server 4000 --directory out`).

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
- Match surrounding style: Tailwind utility classes, `@/` import alias, comments only
  where intent isn't obvious from the code.
- Devices are told apart by CSS media features — width breakpoints for layout,
  `pointer-coarse:` for touch — never by user agent (static HTML, no server). Phones
  (< md) get the bottom `TabBar`, < sm bottom-sheet dialogs, < lg the `EventsDateRail`;
  see [`specs/home-0003-device-optimized.md`](specs/home-0003-device-optimized.md).
  Fixed and sticky elements read the header's measured height from `--header-h` and
  pad for notches with `env(safe-area-inset-*)`.
- Never put `overflow-hidden` on an ancestor of something sticky: it makes a scroll
  container and the sticky element stops sticking. Use `overflow-clip`.
- New sections go through `Section`; its number comes from the section's place in
  `navigation`, so add the nav entry too.
- Accessibility is a requirement, not a polish pass: every control reachable and
  operable by keyboard with a visible `focus-visible` ring, hover effects mirrored on
  focus (`hoverFocusHandlers`, which also keeps touch from stranding a highlight),
  nothing that only works on hover (touch has none), tap targets of 40px or more,
  motion behind `motion-safe`, and small text on light
  backgrounds in `coral-dark` or `ocean-500`+ (the lighter shades fail 4.5:1).
  Component tests call `expectNoAxeViolations` from `src/test/axe.ts`.
- Run `lint`, `typecheck`, `test`, and `build` before calling work done.
