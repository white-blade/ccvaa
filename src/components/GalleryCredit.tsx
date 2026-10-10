import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";

type GalleryCreditProps = {
  photo: Pick<GalleryPhoto, "license" | "source">;
  className?: string;
};

const linkClass =
  "underline decoration-white/30 underline-offset-4 transition-colors hover:text-coral hover:decoration-coral focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-coral pointer-coarse:inline-block pointer-coarse:py-3";

/**
 * The licence line under a work that is not the association's own: its licence,
 * linked to the licence text, and a link to where the original is published. CC BY
 * and CC BY-SA require both alongside the creator's name. Renders nothing for a
 * work with neither.
 */
export function GalleryCredit({ photo, className = "" }: GalleryCreditProps) {
  if (!photo.license && !photo.source) return null;
  return (
    <p className={`text-xs text-ocean-200 ${className}`}>
      {photo.license ? (
        <a href={photo.license.url} target="_blank" rel="noopener noreferrer license" className={linkClass}>
          {photo.license.name}
        </a>
      ) : null}
      {photo.license && photo.source ? (
        <span aria-hidden="true" className="mx-2 text-ocean-400">
          ·
        </span>
      ) : null}
      {photo.source ? (
        <a href={photo.source} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {galleryContent.sourceLabel}{" "}
          <span className="sr-only">{galleryContent.newTabNote}</span>
          <span aria-hidden="true"> ↗</span>
        </a>
      ) : null}
    </p>
  );
}
