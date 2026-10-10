import { readdir } from "node:fs/promises";
import path from "node:path";

import { assetPath } from "@/lib/asset";
import { galleryPhotoDetails } from "@/lib/gallery-photos";

/** Folder under `public/` that holds gallery photos. */
export const PHOTO_DIR = "photos";

/**
 * Raster formats browsers can display. AVIF and WebP are included deliberately —
 * the folder is expected to hold a mix.
 */
export const SUPPORTED_FORMATS = /\.(jpe?g|png|webp|avif|gif)$/i;

export type GalleryPhoto = {
  /** File name, used as the React key and the details lookup. */
  file: string;
  /** Base-path-prefixed URL. */
  src: string;
  alt: string;
  /** The caption shown beside the photograph; the alt text when none is given. */
  description?: string;
  author?: string;
  /** When it was taken, YYYY-MM-DD. */
  takenAt?: string;
};

const FALLBACK_ALT = "A photograph from the Coast to Coast Visual Arts Association gallery.";

const DETAILS = new Map(galleryPhotoDetails.map((details) => [details.file, details]));

/**
 * Reads `public/photos/` at **build time** and joins each file with its entry in
 * `gallery-photos.ts`.
 *
 * A static export has no server, so nothing can list a directory per request.
 * This runs once during `next build` and the file names are baked into the HTML,
 * which is what makes "drop a photo in the folder and it appears" work without a
 * backend. A file without an entry still shows, with a generic description. Returns
 * an empty list when the folder is missing or unreadable so a fresh clone still
 * builds.
 */
export async function readGalleryPhotos(): Promise<GalleryPhoto[]> {
  let fileNames: string[];

  try {
    const directory = path.join(process.cwd(), "public", PHOTO_DIR);
    const entries = await readdir(directory, { withFileTypes: true });
    fileNames = entries
      .filter((entry) => entry.isFile() && SUPPORTED_FORMATS.test(entry.name))
      .map((entry) => entry.name);
  } catch {
    return [];
  }

  return fileNames
    // Numeric collation so "10.jpg" sorts after "9.jpg", not after "1.jpg".
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    )
    .map((file) => {
      const details = DETAILS.get(file);
      return {
        file,
        src: assetPath(`/${PHOTO_DIR}/${file}`),
        alt: details?.alt ?? FALLBACK_ALT,
        // Left out rather than undefined, so the props stay plain JSON.
        ...(details?.description ? { description: details.description } : {}),
        ...(details?.author ? { author: details.author } : {}),
        ...(details?.takenAt ? { takenAt: details.takenAt } : {}),
      };
    });
}
