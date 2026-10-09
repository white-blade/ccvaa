import { readdir } from "node:fs/promises";
import path from "node:path";

import { assetPath } from "@/lib/asset";

/** Folder under `public/` that holds gallery photos. */
const PHOTO_DIR = "photos";

/**
 * Raster formats browsers can display. AVIF and WebP are included deliberately —
 * the folder is expected to hold a mix.
 */
const SUPPORTED_FORMATS = /\.(jpe?g|png|webp|avif|gif)$/i;

export type GalleryPhoto = {
  /** File name, used as the React key and the caption lookup. */
  file: string;
  /** Base-path-prefixed URL. */
  src: string;
  alt: string;
};

/**
 * Alt text per file. Entries are optional — anything missing falls back to a
 * generic description, so dropping in a new photo never breaks the build.
 */
const PHOTO_ALT: Record<string, string> = {
  "1.jpg":
    "A wooden dock reaching into a still, mist-covered lake, its planks scattered with red and pink maple leaves beneath an autumn tree.",
  "2.avif":
    "A terraced hillside garden of pink and red flowering shrubs looking down over a lake ringed by hazy blue mountains.",
  "3.jpg":
    "An empty wooden bench on a lakeshore in low golden light, framed by bare branches and dry winter grasses.",
  "4.jpg":
    "Branches of magenta bougainvillea against a pink and orange sunset sky, with hills and distant town lights below.",
  "5.jpg":
    "Sunrise breaking over a ridge above a green mountain valley, a lone figure crossing the meadow among moss-covered boulders.",
  "6.avif":
    "A high alpine valley seen over a foreground of pale granite boulders, with conifers and cloud-covered peaks beyond.",
};

const FALLBACK_ALT = "A photograph from the Coast to Coast Visual Arts Association gallery.";

/**
 * Reads `public/photos/` at **build time**.
 *
 * A static export has no server, so nothing can list a directory per request.
 * This runs once during `next build` and the file names are baked into the HTML,
 * which is what makes "drop a photo in the folder and it appears" work without a
 * backend. Returns an empty list when the folder is missing or unreadable so a
 * fresh clone still builds.
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
    .map((file) => ({
      file,
      src: assetPath(`/${PHOTO_DIR}/${file}`),
      alt: PHOTO_ALT[file] ?? FALLBACK_ALT,
    }));
}
