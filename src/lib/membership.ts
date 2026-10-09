/**
 * External membership destinations.
 *
 * The site is a static export with no server, so it cannot create a Stripe Checkout
 * session, verify an identity, or hold a member list. Every entry here is a plain URL
 * to a system that already does those things properly — Stripe for payment and billing
 * self-service, an ESP for the free mailing list. See
 * `specs/membership-0001-static-stripe-membership.md`.
 *
 * These URLs are public by design. Never put a secret key or price ID here.
 */

/** Sentinel for a link that has not been created yet. */
const PLACEHOLDER = "REPLACE_ME";

export const membershipLinks = {
  /** Stripe Payment Link — Founding, $360 CAD one-time, seat-capped in the dashboard. */
  founding: "https://buy.stripe.com/fZu4gz9Ohaey6JNfPq0Jq02",
  /** Stripe Payment Link — Lifetime, $500 CAD one-time. */
  lifetime: "https://buy.stripe.com/5kQ3cvaSlbiC0lp7iU0Jq01",
  /** Stripe Payment Link — Annual, $36 CAD recurring yearly. */
  annual: "https://buy.stripe.com/00w8wPgcF2M63xBeLm0Jq00",
  /** Stripe customer-portal login page — member enters email, Stripe mails a link. */
  portal: `https://billing.stripe.com/p/login/${PLACEHOLDER}`,
  /** ESP-hosted signup form for free membership (provider-agnostic). */
  register: PLACEHOLDER,
} as const;

export type MembershipLinkKey = keyof typeof membershipLinks;

/**
 * True once a real URL has replaced the sentinel. Callers render a disabled
 * "Coming soon" control when false, so an unconfigured link is never a dead anchor.
 */
export function isLinkConfigured(url: string): boolean {
  return !url.includes(PLACEHOLDER);
}
