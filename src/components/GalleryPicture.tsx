"use client";

import { useEffect, useRef, useState } from "react";

import type { GalleryPhoto } from "@/lib/gallery";

type GalleryPictureProps = {
  photo: Pick<GalleryPhoto, "src" | "srcSet" | "alt" | "blurDataURL" | "width" | "height">;
  /** How wide it is drawn, for picking from `srcSet` (an `<img sizes>` value). */
  sizes: string;
  /** Cropped to fill its frame, or shown whole inside it. */
  fit: "cover" | "contain";
  /** The slideshow's first picture loads at once; everything else when needed. */
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
};

/**
 * A gallery picture that renders progressively: a tiny blurred preview (inlined in
 * the page, so it is there at once) fills the frame, and the real picture — the
 * smallest prepared size that is sharp at this width — fades in over it when it
 * arrives.
 *
 * Plain `<img srcset>` rather than next/image: on GitHub Pages next/image runs
 * unoptimized and drops `srcset` altogether, while these sizes are prepared ahead
 * of time by `npm run photos`. Without JavaScript the picture simply shows; the
 * fade-in is only armed once scripts run (`html.js`).
 */
export function GalleryPicture({ photo, sizes, fit, priority = false, className = "", onLoad }: GalleryPictureProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === photo.src;

  // A cached picture can finish before hydration attaches onLoad.
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoadedSrc(photo.src);
      onLoad?.();
    }
    // Only when the picture changes; onLoad may be a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.src]);

  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  // The preview only fills a cropped frame: behind a contained picture it would
  // show as a blurred box around the real one.
  const preview =
    fit === "cover" && photo.blurDataURL && !loaded
      ? { backgroundImage: `url("${photo.blurDataURL}")` }
      : undefined;

  return (
    <span
      data-picture-loaded={loaded ? "" : undefined}
      className={`absolute inset-0 block bg-cover bg-center ${className}`}
      style={preview}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- prepared srcset; see above */}
      <img
        ref={imageRef}
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={photo.srcSet ? sizes : undefined}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        onLoad={() => {
          setLoadedSrc(photo.src);
          onLoad?.();
        }}
        // A picture that fails still uncovers, so its alt text shows.
        onError={() => setLoadedSrc(photo.src)}
        className={`absolute inset-0 h-full w-full ${fitClass} motion-safe:transition-opacity motion-safe:duration-500 ${
          loaded ? "opacity-100" : "[html.js_&]:opacity-0"
        }`}
      />
    </span>
  );
}
