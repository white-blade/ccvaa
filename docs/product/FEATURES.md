# CCVAA Web — Feature Inventory

> **Owner:** Product Manager agent  
> **Updated:** 2026-07-29  
> Keep this document current whenever features ship or change. Work-to-do: [`BACKLOG.md`](BACKLOG.md).

> ## ⚠️ Superseded in part — static migration (2026-10-08)
>
> The site moved to **GitHub Pages as a static export**. The **Members** platform,
> the **Admin console** (`/admin`, webmail proxy, roster), Stripe, Neon, Resend, and
> Edge Config flags were **deleted** — not disabled. The sections below describing them
> are retained as history, not current state. Live surface is: Header → Hero → About
> (Board, Purposes) → Contact → Footer.
>
> See [`specs/platform-0002-github-pages-static-migration.md`](../../specs/platform-0002-github-pages-static-migration.md).

## Product summary

**Coast to Coast Visual Arts Association (CCVAA)** — BC-registered non-profit website promoting visual arts across Canada.

- **Legal / contact:** Coast to Coast Visual Arts Association, 4 – 8800 Hazelbridge Way, Richmond, BC V6X 0S3, `info@ccvaa.ca`
- **Public site:** marketing homepage
- **Private admin:** `/admin` console

---

## Public site (`/`)

**Page order (top → bottom):** Nav → Hero → Membership (`#membership`, when enabled) → About (`#about`) → Contact (`#contact`) → Footer.

### Header / nav
- Fixed overlay header; style switches when leaving the sticky hero stage (hero + membership when present)
- Brush wordmark logos: `logo-ondark.png` (hero) / `logo-onlight.png` (scrolled)
- Subtitle: “Visual Arts Association”
- Nav anchors: Membership (`#membership`, **only when verified**), About (`#about`), Contact (`#contact`)

### Hero
- Full-bleed coastal hero image (`hero-background.webp`); sticky while verified `#membership` scrolls over it; stage min-height prevents bleed into About
- Eyebrow, headline, subheadline from `src/lib/site.ts`; hero copy is content-height (not full image tall)
- Text is non-selectable
- **Logged out (Members On):** row 1 = Subscribe / Join count CTAs; row 2 = Email [| Code] | Send/Verify; gate headline under the form
- **Verified:** Subscribe / Join only (anchor `#membership`); live counts refresh after newsletter toggle / join activation
- Cohesive coastal CTA pair: Subscribe = solid coral; Join = cream glass; ocean-950/cream compact (`K`/`M`/`B`) badges; exact counts in `aria-label`
- Counts stub to `0` when members DB unavailable; Members feature switch hides CTAs when Off

### Membership (`#membership`)
- **Only after email OTP verify** (section + nav hidden when logged out)
- Verified strip: Email (+ change with re-OTP); newsletter toggle (default **off**; on/off without OTP while session active); non-members → Stripe Checkout; current membership → plan copy (**Annual until** / **Lifetime** / **Founding**) + **Manage billing** when Stripe Customer linked (opens Stripe Customer portal in a **new tab**); `active` → perks placeholder; `past_due` → perks off, no Join. Identity is **email-only** (no member name)
- Plans: **Founding** (capped one-time) while seats remain → then **Lifetime**; **Annual** always offered (short plan copy; seats remaining on Founding card)
- Checkout return carries `session_id`; client activates membership (webhook backstop); strips `joined`/`session_id` from URL after success; cookie + plan are truth
- Top banners: info (cream) / error (coral-dark); dismissible; form `noValidate` → banner field errors
- One-click unsub → `#membership` + verified session when applicable
- APIs: verify, newsletter preference, join checkout/session/plans, profile, Stripe webhook, `GET /api/members/hero-counts`. Fail closed without Stripe/`DATABASE_URL`/session secrets.
- Edge Config `members` gates public portal + user-initiated member APIs (webhooks/unsub/admin stay live)

### About (`#about`)
- Intro paragraphs
- **Our Board** (collapsible section): group photo placeholder stays visible; member cards show name/role always; section expand reveals all portraits + bio placeholders together (Zhong Liu / President, Yaqi Jing / VP, Albert Zang / Secretary; 1:1 portraits)
- **Our Purposes** (collapsible): 10 purpose cards; titles always visible; descriptions toggle together

### Contact (`#contact`)
- Email + mailing address card (inquiry only — no newsletter UI)

### Footer
- Org name, tagline, copyright (no duplicate contact block)

### Branding / assets
- Favicon: `src/app/icon.svg` (cream C + teal wave on forest green)
- Theme: coastal fog/forest palette in `globals.css` (ocean + driftwood tokens)
- Logo wave: ocean teal (not gold); on-light wordmark text is brown

---

## Admin (`/admin`)

### Access control
- `robots: noindex` on admin page
- Available on phone, tablet, and desktop

### Layout (left sidebar)
- Dark ocean nav (`ocean-950`): left sidebar on `md+`; on small screens brand + **collapsed menu toggle** (expands to full nav list); cream main pane
- Brand mark (logo + “Visual Arts Association”) shared with public header via `BrandMark` — same logo size (`h-7` / `sm:h-8`), centered
- Nav order: **Webmail**, **Members**, **Events**, **Financial**
- Members / Events / Financial require mailbox sign-in; **Log out** when authenticated
- Main pane shows the active panel (Webmail embed, Members roster, or scaffold placeholders)

### Webmail
- Full-pane Hover webmail via same-origin proxy `/admin/mail` (iframe; Hover blocks direct embed via `X-Frame-Options`)
- Proxy handles Roundcube paths/cookies/CSRF, auth `postMessage` bridge, task switches, and minor chrome fixes
- Known fragility: third-party Roundcube reverse proxy (session/cookie/browser differences)

### Admin auth (Hover mailbox session)
- Admin chrome is authenticated **iff** the Hover mailbox session in the mail iframe is logged in
- Detection: Roundcube session cookie + fail-closed upstream probe (`/api/admin/session`); iframe `postMessage` while Webmail is open
- Sidebar **Log out** clears proxied Roundcube cookies and remounts the mail iframe
- Privilege = anyone who can sign into `info@ccvaa.ca` via embedded webmail

### Members roster
- Mail-session gated roster at **Members** (same Hover login as Webmail)
- List / search by email; **plan** and **newsletter** filters are separate axes
- Table shows email, current plan, membership status, newsletter flag; **Annual** rows show period end (no name column)
- Edit (modal + confirm) and delete (confirm dialog); mutations validated with Zod; API routes under `/api/admin/members`
- Fail closed when `DATABASE_URL` is missing or Neon schema is unmigrated (503) — UI shows error state

### Post-auth scaffolds (placeholders only)
- **Events** — coming soon
- **Financial** — coming soon

---

## Members

> Work IDs: [`backlogs/members-BACKLOG.md`](backlogs/members-BACKLOG.md). First epic milestone on Production (PR #8); public surface gated by Edge Config `production.members` (default Off) until CEO go-live (`members-0009`).

**Two orthogonal axes:** Newsletter ⊥ Membership — both managed under `#membership` after verified email. A paid member may or may not be on the newsletter.

| | Newsletter | Membership |
|--|------------|------------|
| **Meaning** | Mailing-list opt-in | Paid association (Stripe) |
| **UI** | `#membership` toggle after verify; ESP unsub → `#membership` + verified session | `#membership` Join Checkout or current plan copy + Manage billing / perks after verify |
| **Count** | Anyone with newsletter on | Active paid memberships (`memberships.status = active`) |

**Hero / membership:** Logged-out OTP + Sub/Join in Hero; `#membership` only after verify.  
**Stack:** Neon + Drizzle + Zod · Stripe · Resend · ESP · Mailosaur. Admin roster (`0008`); Resend/ESP new-tab links (`0010`); later: in-admin blast, member perks, impersonation.  

**Standing:** No Resend/ESP iframes; member auth = email OTP (no OAuth/passwords); homepage SPA anchors over separate marketing routes.

**Public feature switch (members-0023, epic `feat/members`):** One shared Edge Config store has three top-level JSON-object items: `production = { "members": false }`, `preview = { "members": false }`, and `development = { "members": false }`. Future flags are sibling booleans in each object. The app reads the item matching `VERCEL_ENV` (`development` when local/unset) via `@vercel/edge-config`; missing/unknown environment, bucket, key, invalid value, read failure, or unset `EDGE_CONFIG` fails closed to Off. **Staging** (`staging` branch) is a Vercel Preview deploy, so it reads the **`preview`** bucket — flip `preview` to demo Staging without changing Production. Flags are managed in the Vercel dashboard or by an external API — there is no Admin Console toggle or in-app write path, and the app needs only `EDGE_CONFIG`. **Production values are CEO/Admin-only; agents never flip Production.** CEO/Admin and agents may flip Preview/Development for testing and should restore Off afterward.

**Platform (members-0001 + `members-0024`):** Drizzle schema on Neon — `members` (email, newsletter on/off, lifelong `unsub_token`, `stripe_customer_id`) + `memberships` history (plan/status/period; current = active|past_due). **Invariant:** every `memberships` row requires that member’s `stripe_customer_id` to be a durable Stripe Customer (`cus_*`); enforced in app write path + DB trigger (`0004`). OTP challenges have no purpose column. `stripe_webhook_events` for Join/subscription idempotency. Member identity is email-only (`members-0025`). Shared Zod in `src/lib/members/zod/`. `GET /api/members/health` fails closed (503) without `DATABASE_URL`. Migrate/seed: `npm run db:migrate`, `npm run db:seed` (seeds non-Production only). Schema notes: [`docs/members/schema.md`](../members/schema.md).

**Newsletter (members-0003 / portal `members-0022`, prune `members-0024`):** Preference lives on `#membership` after email verify. First verify defaults newsletter **off** (CASL). Session toggle on/off requires no OTP. Token unsub `/?unsub=<token>#membership` via `members.unsub_token` (idempotent; newsletter off + verified session; membership unchanged). ESP sync stub in `src/lib/members/esp.ts` — footer URL: [`docs/members/esp.md`](../members/esp.md). APIs: `POST /api/members/newsletter/preference` (session), email/token unsub. Legacy subscribe/confirm OTP routes removed.

**Join / Stripe (members-0004 + portal `members-0022` + `members-0024`/`0026`):** Verified session → plan picker → `POST /api/members/join/checkout` → Stripe Checkout (test keys on Dev/Preview). Success return includes Stripe `session_id`; `POST /api/members/join/session` mints httpOnly member cookie (**members-0014**). Pre-cap Founding+Annual; post-cap Lifetime+Annual. Env: `STRIPE_*`, `MEMBERSHIP_FOUNDING_CAP`, fee cents (Lifetime > Founding enforced). Webhook: `POST /api/members/webhooks/stripe` (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) writes `memberships`. Billing binds to **Stripe Customer ID** (`cus_*` required for any `memberships` row). Customer portal via `POST /api/members/billing/portal` when `stripe_customer_id` set — UI opens portal in a **new tab** (invoices/history; Annual cancel/renew in portal — no in-app cancel). `past_due`: perks off, no Join, portal is the fix path. Live keys: `members-0009`.

**Member auth (members-0005 / portal `members-0022`, prune `members-0024`):** Email verify OTP upserts `members` and mints httpOnly `ccvaa_member_session` bound to Member ID UUID (plan may be `none`). 7-day TTL. Logout clears cookie only (does not touch Hover admin). APIs: `POST /api/members/verify/{start,verify}`, `POST /api/members/login/logout`, `GET /api/members/login/session`. Login start/verify removed. **Never grants `/admin`.**

**Member profile (members-0006 / portal `members-0022`; name removed `members-0025`; memberships `members-0024`):** Verified strip — email change requires OTP on the new address; when `stripe_customer_id` is set, Stripe Customer email syncs first (fail closed — `members-0026`). Plan copy: **Annual until {date}** / **Lifetime** / **Founding** (+ won’t-renew / past_due); **Manage billing** when Customer linked; paid `active` sees perks placeholder (`members-0012`). No Member since / history UI. APIs: `GET /api/members/profile`, `POST /api/members/profile/email/{start,verify}`, `POST /api/members/billing/portal`.

---

## Infra & ops

| Item | Detail |
|------|--------|
| Hosting | Vercel |
| Production | https://ccvaa-web.vercel.app/ (`main`) — agent QA Pass 2 |
| Public domain | https://ccvaa.ca/ — **CEO manual only**; out of agent Dev/QA flow |
| Preview | Per-branch/PR Vercel URL (pre-merge QA target) |
| Staging | https://ccvaa-web-git-staging-azang-projects.vercel.app — long-lived `staging` = force-mirrored `main` (demo/testing); Vercel Preview → Edge Config `preview`; Deployment Protection + Preview bypass (`agent-os-0003`) |
| DNS / email | Hover |
| CI | lint, typecheck, build; sync `main` → `staging` (GitHub Actions) |
| Stack | Next.js App Router, React, Tailwind; admin auth = Hover mail-session; Members DB = Neon + Drizzle (`DATABASE_URL`); public feature flags = Vercel Edge Config |
| Ship path | Feature branch → QA Preview → merge → cleanup → QA on `ccvaa-web.vercel.app` (Verifier = `agent`). Each item **main-safe on `main` alone**; public go-live via Edge Config. **Verifier = `ceo`:** CEO verifies (defaults: `direct-to-main` + Production pass2). Work IDs `{feature-slug}-{NNNN}` — [`BACKLOG.md`](BACKLOG.md). **Baseline** pass = Production audit with no PR. See `docs/protocols/GIT_DEPLOY.md`. CEO may manually check `ccvaa.ca`. |

### Important technical notes for Developer
- Next.js 16: prefer `proxy.ts` over deprecated `middleware.ts`
- Read `node_modules/next/dist/docs/` before novel Next APIs
- Never commit `.env.local` or secrets
- Default: feature branch + PR with backlog work ID `{feature-slug}-{NNNN}`; merge/push `main` only when CEO asks (product Dev). **agent-os** after **`verified`:** PM ships same turn.
- Admin mail proxy on Preview needs network reachability to `mail.hover.com`

---

## Known gaps / next candidates

Work-to-do lives in **[`BACKLOG.md`](BACKLOG.md)** (feature files under `backlogs/`). Do not duplicate long lists here.

---

## Changelog (high level)

**Order (required):** rows **descending by date** (`YYYY-MM-DD`). Same-day rows: newest event first. Month-only folds (`YYYY-MM`) sit **after** all dated rows in that month. Keep rows **one line** each. When the table grows past ~30 rows, PM may fold older entries into a single monthly summary row (history remains in git). New entries always go at the **top** of their date group (usually the top of the table).

| When | What |
|------|------|
| 2026-07-29 | **members-0024:** shipped on `main` (PR #11) — `memberships` + Customer portal (Manage billing **new tab**); `cus_*` invariant (write path + `0004` trigger); newsletter/OTP prune; Pass 2 ship confirmed (Members flag Off OK) |
| 2026-07-27 | **members-0024:** `memberships` table + Stripe Customer portal + newsletter/OTP prune — current plan copy; Manage billing; subscription webhooks; past_due rules (Preview) |
| 2026-07-26 | **members-0026:** Stripe Customer ID billing live on `main` (PR #10) — Checkout reuses `customer`; activation by customer id; profile email→Stripe sync (fail closed); Pass 2 ship confirmed |
| 2026-07-26 | **members-0027:** OTP verify soft-reload gap — no Sub/Join flash; gate slot stays invisible so brand copy does not jump |
| 2026-07-26 | **members-0025:** email-only identity live on `main` (PR #9) — drop Name; membership UX polish (MessageBanner, soft-reload recovery, verified glass portal); Pass 2 ship confirmed |
| 2026-07-25 | **members-0025:** remove member Name everywhere — email-only identity (DB/session/APIs/UI/admin/Stripe metadata); drop `personNameSchema` + profile name PATCH |
| 2026-07-25 | **agent-os-0003:** long-lived Staging = force-mirrored `main` → `https://ccvaa-web-git-staging-azang-projects.vercel.app`; Edge Config `preview`; Deployment Protection + Preview bypass |
| 2026-07-25 | **public-homepage-0003:** sticky hero through membership; logged-out OTP+Sub/Join in Hero; `#membership`+nav after verify; glass/banners/copy polish; join return activates without waiting on webhook |
| 2026-07-23 | **agent-os-0016:** main-safe increments — one ship lane; epic/milestone lane retired; Edge Config for public go-live; `agent-os-0003` closed |
| 2026-07-23 | **agent-os-0015:** QA Pass 1 scratch hygiene — ephemeral local scripts/logs; delete with report; `.gitignore`; no commit unless maintained harness backlog |
| 2026-07-23 | **agent-os-0013:** CEO talks only to PM; PM invokes Dev/QA (no CEO Dev/QA chats) |
| 2026-07-18 | **Members epic milestone** merged to Production (PR #8); Pass 2 **ship confirmed** for `members-0001`–`0008`, `0014`–`0023`. Public Members remains behind Edge Config `production.members` (default Off) until CEO go-live (`members-0009`) |
| 2026-07-17 | **members-0023** (epic `feat/members`): one shared Edge Config store with environment buckets; Vercel-managed Members switch hides homepage portal/CTAs and gates public APIs while webhooks, unsubscribe, and admin remain live |
| 2026-07-16 | **members-0022** (epic `feat/members`): `#membership` verified-email portal; newsletter moves from Contact; unsub → `#membership` + session; Hero Subscribe+Join → `#membership` with cohesive coastal CTAs |
| 2026-07-16 | **members-0021** (epic `feat/members`): Contact newsletter tabs Subscribe \| Unsubscribe; email-only unsub with distinct outcomes; one-click `/?unsub=` lands on Unsubscribe tab |
| 2026-07-16 | **members-0020** (epic `feat/members`): Membership UI declutter — no section/Join titles; Sign-in \| Join tabs (Sign-in default); two-column plan grid; compact profile; Hero badges compact K/M/B + brand contrast |
| 2026-07-16 | **members-0019** (epic `feat/members`): `#membership` Join \| Sign-in tabs (Join default); Hero counts as top-right circle badges on Subscribe/Join |
| 2026-07-16 | **members-0018** (epic `feat/members`): trim Join/newsletter/membership UI notes; keep CASL + newsletter≠membership clarity |
| 2026-07-16 | **members-0016** (epic `feat/members`): Hero subscriber/member counts as annotations beside Subscribe/Join CTAs |
| 2026-07-16 | **members-0014** (epic `feat/members`): Checkout success return auto-establishes member session → `#membership` profile (webhook race poll) |
| 2026-07-16 | **members-0015** (epic `feat/members`): Join + newsletter opt-in uses one email OTP only; webhook activates newsletter without a second confirm mail |
| 2026-07-16 | **members-0017** (epic `feat/members`): newsletter Name required; shared international `personNameSchema` for newsletter + Join + profile |
| 2026-07-14 | **members-0006** (epic `feat/members`): `#membership` logged-in profile — name edit, email change with OTP re-verify, Annual anniversary/renewal read-only, perks placeholder |
| 2026-07-14 | **agent-os-0014:** Preview browser bypass requires `x-vercel-set-bypass-cookie` (with protection-bypass) for Pass 1 |
| 2026-07-14 | **members-0005** (epic `feat/members`): `#membership` email OTP login → httpOnly member session + logout; never grants `/admin` |
| 2026-07-14 | **members-0004** (epic `feat/members`): `#membership` Join UI + Stripe Checkout (test); Founding seat cap; webhook activation; Hero Join → `#membership` |
| 2026-07-14 | **members-0003** (epic `feat/members`): Contact newsletter — double opt-in, manage preference, token unsub landing; Hero Subscribe → `#contact`; ESP stub + docs |
| 2026-07-14 | **agent-os-0012** self-evolve: epic status/close/Pass 1 notes; thin-rule defaults; Members epic pre-wire |
| 2026-07-14 | Guiding principle #9: living docs = current state (prune leftovers with every OS change) |
| 2026-07-14 | Agent OS docs prune: align thin rules/`n/a`/epic; drop obsolete FEAT- template; fix `tbd` Ship paths |
| 2026-07-13 | **agent-os-0011:** epic/milestone ship lane (shared branch; merge on milestone) |
| 2026-07-13 | Members backlog final review: build-order waves; ESP stubs; dep/hygiene consistency |
| 2026-07-13 | FEATURES prune: drop obsolete admin OTP/SMTP/Redis negatives; tighten Admin/Infra current-state copy |
| 2026-07-13 | Members backlog + FEATURES: newsletter ⊥ membership; homepage Nav→Hero→Membership→About→Contact→Footer |
| 2026-07-13 | **agent-os-0010:** FEATURES changelog must be descending by date (OS rule + table resort) |
| 2026-07-13 | **Members** feature backlog opened (`members-0001`+); `admin-console-0001` closed as superseded |
| 2026-07-12 | **agent-os-0009** self-evolve: principles↔self-evolve; agent QA gate trim; baseline = Production QA mode; changelog hygiene (PR #6) |
| 2026-07-12 | “Go back to Hover.com” opens in a new tab from mail iframe (`admin-console-0012`) |
| 2026-07-12 | Hide Hover pre-login help block in mail iframe (`admin-console-0011`) |
| 2026-07-12 | **agent-os-0008:** OS **self-evolve** workflow (CEO kickoff; PM loop on feature branch; CEO merge gate) |
| 2026-07-12 | **agent-os-0007:** Guiding principles; stale-doc sweep; role titles; ship/tiny-fix defaults; workflow map + `verified` table + rare paths; HANDOFF gates matrix |
| 2026-07-12 | **agent-os-0005:** PM chat title `Product Manager`; ephemeral fixed-name handoffs/reports; backlog ID-desc + `closed` status; `ADMIN_EMAIL`/`ADMIN_PASS` for QA |
| 2026-07-12 | Embedded Hover mail iframe fixes (`admin-console-0009`): refresh 403, More/Mark reload, hide blank `#header` |
| 2026-07-12 | Admin auth = Hover mailbox iframe session; OTP pruned; dark sidebar console + mail embed UX; mobile gate removed (`admin-console-0010`, PR #4) |
| 2026-07-12 | Admin sidebar dark theme + logo width match nav column; drop “· Admin” (`admin-console-0010` Iteration 12, PR #4) |
| 2026-07-11 | **Verifier** `agent` \| `ceo` \| `n/a` + **Verify passes**; CEO may bypass agent QA; `agent-os` uses `n/a`; **`verified` on agent-os ⇒ ship per Ship path** |
| 2026-07-11 | OTP shared store via Marketplace Redis (`KV_REST_API_*`); `admin-console-0007` closed |
| 2026-07-11 | Feature backlogs replace ROADMAP; work IDs `{feature-slug}-{NNNN}` |
| 2026-07-11 | `/admin` page intro blurb removed (`admin-console-0008`) |
| 2026-07-10 | `/admin` OTP + Hover mail proxy + scaffolds; multi-agent OS bootstrapped |
| 2026-07-10 | Encoded feature-branch → Preview QA → merge → Production QA (`ccvaa-web.vercel.app`); `ccvaa.ca` CEO-manual only |
| 2026-07-10 | Ship path field: CEO owns `direct-to-main` approval; Developer follows handoff literally |
| 2026-07-10 | Post-merge: delete feature branch local+remote before Pass 2; Pass 2 fixes = new branch from main |
| 2026-07-10 | Added standard **baseline** QA pass (Production audit, no PR) |
| 2026-07-10 | QA OTP: single-Send + CEO-in-the-loop protocol (`QA_AUTH.md`) to protect rate limits |
| 2026-07 | Public site, board/purposes UX, branding/logos, favicon |
