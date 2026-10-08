# platform-0002 — Migrate to GitHub Pages (static-only)

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` |
| **Verifier** | `ceo` |
| **Verify passes** | `pass2` |
| **Ship path** | `feature-branch` |
| **Source** | CEO (2026-10-08) |

## Goal

Host CCVAA Web as a fully static site on **GitHub Pages**, with no Vercel and no
server runtime of any kind. Everything that requires a server is **deleted**, not
stubbed, flagged off, or reimplemented elsewhere.

The surviving product is the public marketing site: **Header → Hero → About
(Board, Purposes) → Contact → Footer**.

## Decision record

Three architectures were considered before this one (see conversation 2026-10-08):

1. **Members data as a static JSON file in the repo, updated by webhook.**
   Rejected — GitHub Pages publishes without access control, so the roster would be
   world-readable, and git history would make member erasure impossible. Stripe also
   cannot target `repository_dispatch` (no custom headers; GitHub requires `Authorization`),
   and GitHub could not verify `Stripe-Signature`, so activations would be forgeable.
2. **GitHub Actions as the backend** (cron pull from Stripe, counts committed to Pages,
   token-holding static admin page). Technically sound but carries real operating cost:
   stale counts, Pages build limits, a PAT in an admin browser.
3. **Split hosting** — Pages for marketing, Vercel for the members API. Rejected by CEO:
   no extra server.

**Chosen: option 4 — delete the server-dependent product surface entirely.** Simplest,
has no PII exposure, and needs no ongoing automation. Members and admin functionality are
withdrawn rather than relocated.

## Scope

### Removed capabilities (accepted losses)

| Capability | Why it cannot be static |
|---|---|
| Members portal (`#membership`) | Email-OTP auth needs server-held secrets + session signing |
| Email OTP login / email change | `RESEND_API_KEY`, challenge store, `MEMBER_SESSION_SECRET` |
| Newsletter opt-in / preference / unsubscribe | Requires a write path and PII storage |
| Stripe Join / Checkout / webhooks / billing portal | Needs secret key + webhook receiver |
| Hero subscriber & member counts | Requires a database read at request time |
| Admin console (`/admin`) | Auth is an upstream session probe |
| Embedded Hover webmail | Exists only as a same-origin reverse proxy |
| Admin member roster CRUD | Database writes |
| Edge Config feature flags | Runtime read from Vercel |

### Non-goals

- **No replacement** for the above via Stripe Payment Links, ESP hosted forms, or
  GitHub Actions automation. Deliberately out of scope; reopen as a new work ID if wanted.
- Visual redesign. The static render path is kept pixel-identical to today's
  `members` flag = Off output.

## Target architecture

```
GitHub repo (main)
  └── push → GitHub Actions → next build (output: "export") → ./out
                                   └── actions/deploy-pages → ccvaa.ca
```

- `next.config.ts`: `output: "export"`, `images.unoptimized: true`, `trailingSlash: true`
- `public/CNAME` → `ccvaa.ca` (custom domain, so no `basePath` needed)
- Zero runtime env vars. Zero secrets. Zero API routes.
- **Pages source = GitHub Actions** (CEO, 2026-10-08). Branch-root serving was ruled
  out: the repo root has no `index.html`, and `/docs` is occupied by the agent-OS docs.
  Because `actions/deploy-pages` bypasses Jekyll, no `.nojekyll` file is needed.

## File inventory

### Delete — directories

| Path | Reason |
|---|---|
| `src/app/api/` | all 23 route handlers |
| `src/app/admin/` | admin page + Hover mail proxy |
| `src/components/admin/` | admin console UI |
| `src/db/` | Drizzle client + schema |
| `src/lib/members/` | members domain (~30 modules incl. `zod/`) |
| `src/lib/admin/` | mail-session, roster, http helpers |
| `src/lib/flags/` | Edge Config reader |
| `drizzle/` | 5 SQL migrations + journal |
| `scripts/` | migrate, seed, OTP test |
| `docs/` | agent-OS protocols, templates, backlogs, and feature docs — described Vercel/Neon/Stripe infrastructure that no longer exists |
| `.cursor/` | 3-agent PM/Dev/QA definitions, rules, and skills built around the retired ship process |

### Delete — files

| Path | Reason |
|---|---|
| `src/proxy.ts` | middleware: flag gating + Roundcube rewrites |
| `drizzle.config.ts` | Drizzle Kit config |
| `.github/workflows/sync-staging.yml` | Vercel staging mirror |
| `AGENTS.md` | multi-agent operating system; replaced by a lean `CLAUDE.md` |
| `src/components/HeroCtas.tsx` | Subscribe/Join CTAs + counts fetch |
| `src/components/HeroGateCtas.tsx` | hero OTP gate |
| `src/components/HeroLoggedOut.tsx` | logged-out hero variant |
| `src/components/JoinForm.tsx` | Stripe plan picker |
| `src/components/MembershipSection.tsx` | portal section wrapper |
| `src/components/MembershipPanel.tsx` | portal (687 lines) |
| `src/components/MembershipLoggedIn.tsx` | verified strip |
| `src/components/MembershipSocialProof.tsx` | live counts |
| `src/components/MessageBanner.tsx` | only consumed by membership UI |
| `public/{file,globe,next,vercel,window}.svg` | unused Next.js starter assets |

Moved out of the deployed tree (kept in the repo):

| Path | Reason |
|---|---|
| `public/images/hero-background-original.jpg` → `assets/` | 1.7 MB source JPG, unreferenced by `src/`; shipping it made the payload 4.5 MB instead of 2.5 MB |

### Modify

| Path | Change |
|---|---|
| `next.config.ts` | add static export config |
| `package.json` | drop `@neondatabase/serverless`, `@vercel/edge-config`, `drizzle-orm`, `resend`, `stripe`, `zod`, `drizzle-kit`, `dotenv`, `tsx`; drop `db:*` and `members:*` scripts |
| `src/app/page.tsx` | drop `searchParams`, `redirect`, flag read, profile load, membership section; plain static composition |
| `src/components/Hero.tsx` | drop `membersEnabled` / `showMembershipGate` / `compact` / `footer` props and counts fetch; keep sticky image + static copy |
| `src/components/Header.tsx` | drop `membersEnabled` / `showMembershipNav`; render `navigation` unfiltered |
| `src/lib/site.ts` | drop `membershipContent`, `#membership` nav entry, hero CTA/count labels |
| `.env.example` | reduce to a note that no env vars are required |
| `CLAUDE.md` | was `@AGENTS.md`; now a self-contained project guide |
| `README.md` | replace Vercel deploy + "future data storage" with Pages deploy |
| `.github/workflows/ci.yml` | keep lint/typecheck/build (unchanged behavior) |

### Add

| Path | Purpose |
|---|---|
| `.github/workflows/deploy-pages.yml` | build + `actions/deploy-pages` on push to `main` |
| `public/CNAME` | `ccvaa.ca` |
| `specs/` | this spec |

### Keep untouched

`src/app/layout.tsx`, `src/app/globals.css`, `src/app/icon.svg`,
`AboutSection`, `BoardSection`, `PurposesSection`, `ContactSection`, `Footer`,
`BrandMark`, `CoastToCoastLogo`, `public/images/*`.

## Acceptance criteria

- [ ] `npm run build` produces `out/` with `index.html` and no server-runtime warnings
- [ ] `npm run lint` and `npm run typecheck` pass clean
- [ ] No `src/**` reference remains to `@/lib/members`, `@/lib/admin`, `@/lib/flags`, or `@/db`
- [ ] `grep -r "api/members\|api/admin" src/` returns nothing
- [ ] Rendered page is visually identical to today's `members` flag = Off output
- [ ] Nav shows About + Contact only; no `#membership` link
- [ ] `/admin` returns Pages 404
- [ ] `package.json` has no server-only dependency
- [ ] `node_modules` install needs no `DATABASE_URL` / `STRIPE_*` / `RESEND_*`

## Verification status (2026-10-08)

**All local checks pass.** Node 26.11.0 installed via Homebrew; `package-lock.json`
regenerated so `npm ci` is in sync.

| Check | Result |
|---|---|
| `npm run lint` | pass, no output |
| `npm run typecheck` | pass |
| `npm run build` | pass — 4 routes, all `○ (Static)` |
| served `out/` on `:4000` | `/` 200 · hero webp 200 · icon 200 · CNAME 200 · unknown path 404 |

Build output: `out/` = **2.5 MB**, fonts self-hosted under `_next/static/media`
(no runtime Google Fonts request), `CNAME` copied to the export root.

Static checks that also passed:

- `grep` over `src/`: no reference to `@/lib/members`, `@/lib/admin`, `@/lib/flags`,
  `@/db`, `drizzle`, `stripe`, `resend`, `edge-config`, or `next/headers`
- `grep` over `src/`: no reference to `api/members`, `api/admin`, or `/admin`
- no remaining `membership` / `membersEnabled` identifiers in `src/`
- no `zod` import survives in `src/`
- surviving tree is 18 files: 3 under `src/app`, 9 components, `src/lib/site.ts`,
  4 images, `public/CNAME`

**Open:** CEO pass2 on the live Pages URL.

## Risks

| Risk | Mitigation |
|---|---|
| Neon / Stripe / Resend data orphaned | **Out of this spec.** CEO must decide separately whether to export the Neon roster and cancel Stripe subscriptions **before** DNS cuts over. Deleting code does not refund or notify members. |
| Members currently paying | Flag was Off in Production, so no public members exist. CEO to confirm Stripe has no live subscriptions. |
| `ccvaa.ca` DNS cutover | Vercel and Pages cannot both serve the apex. CEO-managed, after Pages verifies on `*.github.io`. |
| Work is hard to reverse | Lands on a feature branch; `main` untouched. Full history recoverable by revert. |

## Rollback

`git revert` the merge commit, or point DNS back at Vercel. The Vercel project and the
Neon database should be left in place until Pages has served `ccvaa.ca` successfully.

## Verification (CEO, pass2)

1. Pages URL renders Hero / About / Board / Purposes / Contact / Footer
2. Board and Purposes expand/collapse
3. Header nav glass switches from dark to cream when scrolling past hero
4. Contact email + mailing address correct
5. `/admin` 404s
