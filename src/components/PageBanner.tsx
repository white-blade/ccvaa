import Image from "next/image";

type PageBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  /** Base-path-prefixed URL of a photograph, dimmed behind the copy. */
  imageSrc?: string;
};

/**
 * Dark photographic banner for inner pages. It leaves deep bottom padding so the
 * page's first card can be pulled up over its lower edge with a negative margin.
 * Not a full hero: the header stays in its light state above it.
 */
export function PageBanner({ eyebrow, title, description, imageSrc }: PageBannerProps) {
  return (
    <section className="relative isolate overflow-hidden bg-ocean-950 pb-40 pt-16 text-white sm:pb-44 sm:pt-20">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-30"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-950 via-ocean-950/85 to-ocean-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-coral">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ocean-100 sm:text-lg">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
