import { CoastToCoastLogo } from "@/components/CoastToCoastLogo";
import { siteConfig } from "@/lib/site";

type BrandMarkProps = {
  priority?: boolean;
  /** Use the on-light wordmark. Default: on-dark. */
  onLight?: boolean;
};

/** Logo + “Visual Arts Association”, linking back to the top of the page. */
export function BrandMark({ priority = false, onLight = false }: BrandMarkProps) {
  return (
    <a
      href="#top"
      aria-label={`${siteConfig.name} — back to top`}
      className="group flex w-fit shrink-0 flex-col items-start gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
    >
      <CoastToCoastLogo
        priority={priority}
        onLight={onLight}
        className="h-7 w-auto object-contain transition-opacity group-hover:opacity-90 sm:h-8"
      />
      <span
        aria-hidden="true"
        className={`text-xs transition-colors ${onLight ? "text-ocean-600" : "text-ocean-200"}`}
      >
        {siteConfig.navSubtitle}
      </span>
    </a>
  );
}
