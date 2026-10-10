import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { contactContent, organization } from "@/lib/site";

/**
 * One gesture: the email, set large enough to be the section's image, with the
 * postal address as a single quiet line beneath it.
 */
export function ContactSection() {
  const { address } = organization;
  const addressParts = [
    address.line1,
    `${address.city}, ${address.province} ${address.postalCode}`,
    address.country,
  ];

  return (
    <Section
      id="contact"
      tone="mist"
      eyebrow={contactContent.eyebrow}
      title={contactContent.title}
      description={contactContent.description}
      glow
    >
      <Reveal className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ocean-600">
          {contactContent.emailPrompt}
        </p>
        <a
          href={`mailto:${organization.email}`}
          className="group mt-3 inline-flex max-w-full items-center gap-4 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-4 focus-visible:ring-offset-ocean-50 sm:gap-6"
        >
          <span className="relative min-w-0 break-words font-display text-4xl font-semibold tracking-tight text-ocean-900 sm:text-6xl lg:text-7xl">
            {organization.email}
            {/* The underline draws in from the left on hover and focus. */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-[3px] w-full origin-left scale-x-0 bg-coral transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
            />
          </span>
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ocean-900 text-xl text-cream transition-all duration-300 group-hover:translate-x-1 group-hover:bg-coral group-hover:text-ocean-950 sm:h-16 sm:w-16 sm:text-2xl"
          >
            →
          </span>
        </a>

        <div className="mt-12 flex flex-col gap-2 border-t border-ocean-200 pt-6 sm:flex-row sm:items-baseline sm:gap-6">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-ocean-600">
            {contactContent.addressLabel}
          </p>
          <address className="text-sm not-italic leading-relaxed text-ocean-700 sm:text-base">
            {organization.legalName}
            {addressParts.map((part) => (
              <span key={part}>
                <span aria-hidden="true" className="mx-2 text-coral-dark">
                  ·
                </span>
                {part}
              </span>
            ))}
          </address>
        </div>
      </Reveal>
    </Section>
  );
}
