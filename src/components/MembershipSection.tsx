import { isLinkConfigured, membershipLinks } from "@/lib/membership";
import { membershipContent } from "@/lib/site";

/**
 * Membership section — all destinations are external (Stripe, ESP).
 *
 * Deliberately a server component with no client JS: every control is a plain anchor,
 * so the section adds no bundle weight and makes no network calls. Links that are still
 * placeholders render as disabled text rather than dead anchors.
 */

type ExternalCtaProps = {
  href: string;
  children: string;
  /** Solid driftwood for the primary action; cream outline otherwise. */
  variant?: "solid" | "outline";
  describedBy?: string;
};

function ExternalCta({
  href,
  children,
  variant = "solid",
  describedBy,
}: ExternalCtaProps) {
  const base =
    "inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors";

  if (!isLinkConfigured(href)) {
    return (
      <span
        className={`${base} cursor-not-allowed border border-ocean-100 bg-ocean-50 text-ocean-400`}
        aria-disabled="true"
      >
        {membershipContent.comingSoonLabel}
      </span>
    );
  }

  const styles =
    variant === "solid"
      ? "bg-coral text-ocean-950 hover:bg-coral-dark hover:text-white"
      : "border border-ocean-200 bg-white text-ocean-800 hover:border-ocean-400 hover:bg-ocean-50";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={describedBy}
      className={`${base} ${styles}`}
    >
      {children}
    </a>
  );
}

export function MembershipSection() {
  const { register, paid, plans, manageBilling } = membershipContent;

  return (
    <section
      id="membership"
      className="scroll-mt-24 bg-cream py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl">
            {membershipContent.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ocean-700">
            {membershipContent.description}
          </p>
        </div>

        {/* Free registration — the low-commitment entry point, so it leads. */}
        <div className="mt-12 rounded-3xl border border-ocean-100 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-display text-xl font-semibold text-ocean-900 sm:text-2xl">
                {register.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ocean-600">
                {register.description}
              </p>
            </div>
            <div className="w-full shrink-0 sm:w-56">
              <ExternalCta href={membershipLinks.register}>
                {register.cta}
              </ExternalCta>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="font-display text-xl font-semibold text-ocean-900 sm:text-2xl">
            {paid.heading}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ocean-600">
            {paid.description}
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  plan.featured ? "border-coral" : "border-ocean-100"
                }`}
              >
                <div
                  className={`px-6 py-4 ${
                    plan.featured
                      ? "bg-coral/15 text-ocean-900"
                      : "bg-ocean-100 text-ocean-700"
                  }`}
                >
                  <h4 className="font-display text-lg font-semibold">
                    {plan.name}
                  </h4>
                </div>

                <div className="flex flex-1 flex-col border-t border-ocean-100 px-6 py-6">
                  <p className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-semibold lining-nums tabular-nums text-ocean-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-ocean-500">
                      {plan.cadence}
                    </span>
                  </p>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ocean-600">
                    {plan.description}
                  </p>

                  <div className="mt-6">
                    <ExternalCta
                      href={membershipLinks[plan.id]}
                      variant={plan.featured ? "solid" : "outline"}
                    >
                      {`Join — ${plan.name}`}
                    </ExternalCta>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-relaxed text-ocean-500">
            {membershipContent.currencyNote}
          </p>
        </div>

        <div className="mt-10 border-t border-ocean-100 pt-6 text-sm text-ocean-600">
          {manageBilling.text}{" "}
          {isLinkConfigured(membershipLinks.portal) ? (
            <a
              href={membershipLinks.portal}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ocean-800 underline underline-offset-4 transition-colors hover:text-coral-dark"
            >
              {manageBilling.cta}
            </a>
          ) : (
            <span className="text-ocean-400">
              {membershipContent.comingSoonLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
