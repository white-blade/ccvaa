# membership-0001 — Static membership: Stripe subscriptions + free registration

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` |
| **Depends on** | [`platform-0002`](platform-0002-github-pages-static-migration.md) |
| **Source** | CEO (2026-10-08) |

## Goal

Bring back membership signup and payment on a site with **no server, no database, and
no secrets** — hosted as a static export on GitHub Pages.

Two independent tiers, matching the old product's Newsletter ⊥ Membership split:

| Tier | What it is | Where it is handled |
|------|-----------|---------------------|
| **Free member** | register with an email, no payment | **Google Form → Google Sheet** |
| **Paid member** | Founding / Lifetime / Annual | Stripe Payment Links |

A person can be either, both, or neither. Neither tier is gated by the other.

## The governing constraint

A static page can hold no secret and run no code on a server. Therefore the site
**cannot** hold member identity. Every option that stores members on our side —
a JSON file in the repo, a committed roster, a browser-held token — either exposes
PII publicly or is trivially forged. See `platform-0002`'s decision record.

The resolution is to **invert ownership**: the site is a brochure that links to systems
that already hold member data properly. Stripe and the ESP are not "servers we run" —
they are SaaS with their own auth, compliance, and admin UIs.

## Member list — the answer

**There is no member list in this repo, and there never will be.** Two systems own it:

| Who | System | Admin view | Export |
|-----|--------|-----------|--------|
| Paid members | **Stripe** | Dashboard → Customers / Subscriptions | CSV |
| Free members | **Google Sheet** (fed by a Google Form) | the Sheet itself, shared with named board accounts | CSV / native |

Properties this buys us:

- **No PII in git.** Nothing to leak, and erasure requests are honoured for real
  (git history is immutable — a committed roster could never satisfy one).
- **CASL consent records** live with the ESP, which timestamps opt-in and handles
  unsubscribe. Stronger compliance than the old hand-rolled newsletter table.
- **PCI scope is zero.** No card data touches our page; Stripe hosts checkout.
- **Always current.** No sync job to drift or fail.

Cost: the roster is in two places, not one. For an organisation of this size that is a
CSV export, not a problem. If a single merged view is ever wanted, the cheapest path is
a scheduled GitHub Action reading both APIs with Actions secrets and writing a **private
build artifact** (not a commit) — still no server, still nothing in git. Out of scope here.

## Architecture

```
Static page (GitHub Pages)
  ├── "Become a member" → Google Form           → Google Sheet
  ├── "Join" × 3      → buy.stripe.com/…       → Stripe Customer + Subscription
  └── "Manage billing"→ billing.stripe.com/p/login/… → Stripe-hosted portal
```

Every arrow is a plain `<a href>`. No JavaScript, no fetch, no API keys, no build-time
data. The page does not know who is a member and does not need to.

### Plans (live in Stripe already)

| Plan | Price | Type | Notes |
|------|-------|------|-------|
| Founding | $360 CAD | one-time | seat-capped via Payment Link's payment limit |
| Lifetime | $500 CAD | one-time | must stay priced above Founding |
| Annual | $36 CAD | recurring, yearly | Stripe handles renewal and dunning |

### Member self-service

Stripe's customer-portal **login link** replaces the old `/api/members/billing/portal`
route: the member enters their email, Stripe emails a secure link, and they manage
invoices, cards, and cancellation there. Zero code on our side.

## Placeholder strategy

Real URLs are not yet created. Rather than ship dead buttons, every link is a constant
containing the sentinel `REPLACE_ME`, and the UI **detects an unconfigured link and
renders a disabled "Coming soon" control instead of an anchor**.

This means the section can merge and deploy safely today, and goes live the moment the
real URLs are pasted in — a one-line change per link, no structural edits.

## Scope

### In

- `src/lib/membership.ts` — link constants + `isLinkConfigured()`
- `membershipContent` in `src/lib/site.ts` — all copy and plan metadata
- `src/components/MembershipSection.tsx` — the section (server component, no `"use client"`)
- `src/app/membership/page.tsx` — membership lives on its own route at `/membership`,
  not as a home-page section
- Header nav links become root-relative (`/membership`, `/#about`, `/#contact`) and
  render through `next/link` so `basePath` is applied — a plain `<a>` would not be
  prefixed and would 404 on the project page
- `Header` takes `overlayHero`: the dark glass treatment is opt-in, since a route
  without the hero would otherwise render an unreadable dark header over cream

### Out

- **Member-only content / perks gating.** Impossible on Pages — anything served is
  public. Needs a membership SaaS (Memberstack, Outseta) or a server.
- **Live member/subscriber counts.** No read path without a server.
- **In-app roster, impersonation, email blasts.** Use the Stripe and ESP dashboards.
- **Automatic Founding → Lifetime swap at cap.** The old `getJoinPlans()` did this
  server-side. Payment Links cannot: when the cap fills, Stripe shows an error page.
  Removing the Founding card then is a manual one-line edit.
- ESP / newsletter sending. The Sheet is a roster, not a mailing tool. When CCVAA
  actually wants to send a campaign, import the Sheet into a free ESP tier — that
  handles unsubscribe links and CASL consent tracking, which a Sheet cannot.
- **Member login.** A Sheet is a data store, not an auth system; verifying a member
  client-side would require publishing the whole list. Admin access is Google account
  sharing on the Sheet; paid members self-serve through the Stripe portal.

## Acceptance criteria

- [ ] `lint`, `typecheck`, `build` pass; all routes remain `○ (Static)`
- [ ] Zero network calls and zero JS added by the section (plain anchors)
- [ ] Unconfigured links render as disabled "Coming soon", never as broken anchors
- [ ] Configured links open Stripe / the ESP in a new tab with `rel="noopener"`
- [ ] Section is keyboard reachable and screen-reader labelled
- [ ] No secret, key, price ID, or member datum appears anywhere in the repo
- [ ] Visual language matches the existing coastal palette and card patterns

## Going live

| Link | Status |
|------|--------|
| Founding Payment Link | **live** (`$360 CAD`, live mode) |
| Lifetime Payment Link | **live** (`$500 CAD`, live mode) |
| Annual Payment Link | **live** (`$36 CAD/yr`, live mode) |
| Customer-portal login | **placeholder** — Settings → Billing → Customer portal |
| Google Form (free membership) | **live** — verified publicly submittable, no sign-in required |

The three Stripe links are live-mode and take real payments. The two outstanding
entries render as disabled "Coming soon" until their URLs are pasted into
`src/lib/membership.ts` — one line each, no structural change.

**Still to confirm in the Stripe dashboard:** the Founding link's payment limit (seat
cap) and each link's post-payment redirect back to the site.

## Risks

| Risk | Mitigation |
|------|-----------|
| Dead buttons shipped before URLs exist | sentinel + disabled "Coming soon" state |
| Live-mode links take real money during testing | create test-mode links first; swapping is one line each |
| Founding cap fills silently | Stripe shows an error page; remove the card manually |
| Price changes orphan existing subscribers | Stripe keeps existing subscriptions on the old price — intended |
