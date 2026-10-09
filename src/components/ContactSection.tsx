import { contactContent, organization } from "@/lib/site";

export function ContactSection() {
  const { address } = organization;

  return (
    <section id="contact" className="scroll-mt-24 bg-ocean-50 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-ocean-100 bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ocean-900 sm:text-3xl">
            {contactContent.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ocean-600">
            {contactContent.description}
          </p>

          <div className="mt-6 grid gap-6 border-t border-ocean-100 pt-6 sm:grid-cols-2 sm:gap-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ocean-500">
                {contactContent.emailLabel}
              </p>
              <a
                href={`mailto:${organization.email}`}
                className="mt-1 inline-block font-display text-lg font-semibold text-ocean-800 transition-colors hover:text-coral-dark"
              >
                {organization.email}
              </a>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ocean-500">
                {contactContent.addressLabel}
              </p>
              <address className="mt-1 text-sm not-italic leading-relaxed text-ocean-700">
                {organization.legalName}
                <br />
                {address.line1}
                <br />
                {address.city}, {address.province} {address.postalCode}
                <br />
                {address.country}
              </address>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
