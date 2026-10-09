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
src/app/         page.tsx (home), gallery/, events/, membership/,
                 layout.tsx, globals.css, icon.svg
src/components/  Header, Hero, AboutSection, BoardSection, PurposesSection,
                 GallerySection/Carousel/Grid/Lightbox, EventsBrowser/Card/Dialog,
                 MembershipSection, ContactSection, Footer, BrandMark,
                 CoastToCoastLogo, ColumnControl
src/lib/site.ts  ALL copy and config — edit here first
src/lib/         events.ts, gallery.ts, membership.ts, asset.ts,
                 use-dialog.ts, use-columns.ts
specs/           architecture specs / decision records
assets/          source originals, not deployed
```

Pages: `/` (hero, about, gallery carousel, contact), `/gallery`, `/events`,
`/membership`. Gallery photos come from `public/photos/`, read at build time — adding
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
```

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
- Run `lint`, `typecheck`, and `build` before calling work done.
