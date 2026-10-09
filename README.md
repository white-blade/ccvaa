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

There is no `start` script — `out/` is plain static files. Preview a production build
with `npm run build && npx serve out`.

## Pages

| Route        | What it is                                                              |
| ------------ | ----------------------------------------------------------------------- |
| `/`          | Hero, About (board + the ten purposes), Gallery carousel, Contact       |
| `/gallery`   | Every photograph, in a grid the visitor sizes at 2–5 per row            |
| `/events`    | Searchable listings, 1–4 per row, each opening a detail dialog          |
| `/membership`| Free signup via Google Form, plus Stripe Payment Links for paid tiers   |

## Project structure

```
src/
├── app/
│   ├── page.tsx            home
│   ├── gallery/page.tsx    all photographs
│   ├── events/page.tsx     all listings
│   ├── membership/page.tsx
│   ├── layout.tsx, globals.css, icon.svg
├── components/             presentational; they read content from lib/
└── lib/
    ├── site.ts             ALL copy and config — edit here first
    ├── events.ts           event listings (content, not data)
    ├── gallery.ts          build-time read of public/photos/
    ├── membership.ts       external Stripe / Google Form URLs
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
| Membership links            | `src/lib/membership.ts`                          |
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

Every push and pull request to `main` runs ESLint, TypeScript typecheck, and the
production build. No tests are configured — add a `test` script and CI step when logic
grows more complex.

## Constraints worth knowing before you build

This is a static export. Route handlers, `middleware`/`proxy.ts`, `next/headers`,
`cookies()`, and server-side data fetching all fail the build — and could not run on
Pages even if they passed. Anything needing a server is linked out to a service that
already does it properly (Stripe for payment, Google Forms for signup).

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

## License

Copyright © Coast to Coast Visual Arts Association. All rights reserved.
