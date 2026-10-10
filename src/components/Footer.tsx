import { CoastToCoastLogo } from "@/components/CoastToCoastLogo";
import { footerContent, navigation, organization, siteConfig } from "@/lib/site";

const linkClass =
  "rounded text-sm text-ocean-200 transition-colors hover:text-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-coral";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ocean-950 text-ocean-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="max-w-sm">
            <CoastToCoastLogo className="h-9 w-auto" />
            <p className="mt-4 text-sm leading-relaxed text-ocean-200">{siteConfig.tagline}</p>
            <p className="mt-4 text-xs text-ocean-200">{organization.registrationNote}</p>
          </div>

          <nav aria-label={footerContent.navHeading}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-coral">
              {footerContent.navHeading}
            </h2>
            <ul className="mt-4 space-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={linkClass}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-coral">
              {footerContent.contactHeading}
            </h2>
            <p className="mt-4">
              <a href={`mailto:${organization.email}`} className={linkClass}>
                {organization.email}
              </a>
            </p>
            <p className="mt-2 text-sm text-ocean-200">{organization.location}</p>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-xs text-ocean-200">
          © {year} {organization.legalName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
