import { assetPath } from "@/lib/asset";
import photoSizes from "@/lib/gallery-photo-sizes.json";
import { galleryPhotoDetails, type GalleryPhotoDetails } from "@/lib/gallery-photos";

/** Folder under `public/` that holds the gallery's web-sized images. */
export const PHOTO_DIR = "photos";

/** One prepared size of a work, as `npm run photos` wrote it. */
type PhotoVariant = { file: string; width: number; height: number };
type PhotoSizes = Record<string, { variants: PhotoVariant[]; blurDataURL: string }>;

export type GalleryPhoto = Omit<GalleryPhotoDetails, "name"> & {
  /** The work's name, used as the React key. */
  file: string;
  /** The largest size, base-path-prefixed: the fallback where `srcSet` is not read. */
  src: string;
  /** Every prepared size, so the browser fetches the smallest that is sharp enough. */
  srcSet?: string;
  /** The largest size's dimensions, so the frame is reserved before it loads. */
  width?: number;
  height?: number;
  /** A tiny blurred preview, shown while the real image arrives. */
  blurDataURL?: string;
};

const SIZES = photoSizes as PhotoSizes;

/**
 * The gallery's works, in the order `gallery-photos.ts` lists them, each joined with
 * the sizes `npm run photos` prepared. Everything is known at build time — a static
 * export has no server to ask — so this is plain data, not a directory read.
 *
 * An entry with no prepared sizes is left out rather than shown broken; the
 * gallery-photos tests fail on it first, so it never reaches the site unnoticed.
 */
export function readGalleryPhotos(
  details: GalleryPhotoDetails[] = galleryPhotoDetails,
  sizes: PhotoSizes = SIZES,
): GalleryPhoto[] {
  return details.flatMap(({ name, ...rest }) => {
    const prepared = sizes[name];
    if (!prepared || prepared.variants.length === 0) return [];
    const variants = [...prepared.variants].sort((a, b) => a.width - b.width);
    const largest = variants[variants.length - 1];
    const url = (file: string) => assetPath(`/${PHOTO_DIR}/${file}`);
    return [
      {
        ...rest,
        file: name,
        src: url(largest.file),
        srcSet: variants.map((variant) => `${url(variant.file)} ${variant.width}w`).join(", "),
        width: largest.width,
        height: largest.height,
        blurDataURL: prepared.blurDataURL,
      },
    ];
  });
}
