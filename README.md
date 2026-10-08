# Coast to Coast Visual Arts Association (CCVAA)

Public website for the Coast to Coast Visual Arts Association — a non-profit organization registered in British Columbia, Canada.

**Static site.** No server, no database, no secrets. Built with Next.js static export and hosted on GitHub Pages.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router, `output: "export"`) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [GitHub Actions](https://github.com/features/actions) for CI (lint, typecheck, build) and deploy
- [GitHub Pages](https://pages.github.com/) for hosting

## Getting started

**Requirements:** Node.js 20+ (see `.nvmrc`)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No `.env.local` is needed — see `.env.example`.

### Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start development server           |
| `npm run build`     | Static export to `out/`            |
| `npm run lint`      | Run ESLint                         |
| `npm run typecheck` | TypeScript check                   |

There is no `start` script — `out/` is plain static files. Serve them with any static
file server to preview a production build locally.

## Project structure

```
src/
├── app/              # Next.js App Router page & layout
├── components/       # UI components (Header, Hero, About, Contact, Footer)
└── lib/
    └── site.ts       # Organization content & site config (edit here first)
specs/                # Architecture specs / work items
```

**Updating content:** Edit `src/lib/site.ts` — all copy, contact info, board roster,
purposes, and navigation live in one place.

## Deployment

`.github/workflows/deploy-pages.yml` builds the static export and publishes it to
GitHub Pages on every push to `main`.

One-time setup: **Settings → Pages → Build and deployment → Source = GitHub Actions**.

Custom domain `ccvaa.ca` is pinned by `public/CNAME`, which the export copies into
`out/`. DNS is CEO-managed at Hover.

## CI

Every push and pull request to `main` runs ESLint, TypeScript typecheck, and the
production build. No tests are configured — add a `test` script and CI step when
logic grows more complex.

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
