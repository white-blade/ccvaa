import Link from "next/link";
import { CoastToCoastLogo } from "@/components/CoastToCoastLogo";
import { siteConfig } from "@/lib/site";

/** Shared logo size, so every surface that shows the wordmark stays in sync. */
export const BRAND_LOGO_CLASSNAME = "h-7 w-auto object-contain sm:h-8";

type BrandMarkProps = {
  priority?: boolean;
  /** Use on-light wordmark (scrolled public header). Default: on-dark. */
  onLight?: boolean;
  subtitleClassName?: string;
  className?: string;
  align?: "start" | "center";
};

/**
 * Logo + “Visual Arts Association” block, used in the header and on the board page.
 * `align="center"` centres the whole group in its parent; logo and subtitle stay
 * start-aligned to each other (same as the header).
 */
export function BrandMark({
  priority = false,
  onLight = false,
  subtitleClassName = "text-ocean-600",
  className = "",
  align = "start",
}: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={[
        "group flex w-fit flex-col items-start gap-1",
        align === "center" ? "mx-auto" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CoastToCoastLogo
        priority={priority}
        onLight={onLight}
        className={`${BRAND_LOGO_CLASSNAME} transition-opacity group-hover:opacity-90`}
      />
      <span className={["text-xs", subtitleClassName].filter(Boolean).join(" ")}>
        {siteConfig.navSubtitle}
      </span>
    </Link>
  );
}
