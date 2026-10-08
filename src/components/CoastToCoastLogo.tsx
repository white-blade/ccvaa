import Image from "next/image";
import { assetPath } from "@/lib/asset";
import { siteConfig } from "@/lib/site";

type CoastToCoastLogoProps = {
  className?: string;
  priority?: boolean;
  onLight?: boolean;
};

export function CoastToCoastLogo({
  className,
  priority = false,
  onLight = false,
}: CoastToCoastLogoProps) {
  const { logo } = siteConfig;

  return (
    <Image
      src={assetPath(onLight ? logo.srcOnLight : logo.src)}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      unoptimized
      className={["object-contain", className].filter(Boolean).join(" ")}
    />
  );
}
