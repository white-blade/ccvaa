// @vitest-environment node
import { describe, expect, it } from "vitest";

import { readGalleryPhotos } from "@/lib/gallery";
import { galleryPhotoDetails } from "@/lib/gallery-photos";

const sizes = {
  dock: {
    variants: [
      { file: "dock-lg.avif", width: 1920, height: 1280 },
      { file: "dock-sm.avif", width: 640, height: 427 },
      { file: "dock-md.avif", width: 1280, height: 853 },
    ],
    blurDataURL: "data:image/webp;base64,AAAA",
  },
};

describe("readGalleryPhotos", () => {
  it("lists every authored work, in the authored order", () => {
    const photos = readGalleryPhotos();
    expect(photos.map((photo) => photo.file)).toEqual(galleryPhotoDetails.map((details) => details.name));
  });

  it("points at the largest size, base-path-prefixed, with every size in srcset", () => {
    const [photo] = readGalleryPhotos([{ name: "dock", alt: "A dock" }], sizes);
    expect(photo.src).toBe("/ccvaa/photos/dock-lg.avif");
    expect(photo.srcSet).toBe(
      "/ccvaa/photos/dock-sm.avif 640w, /ccvaa/photos/dock-md.avif 1280w, /ccvaa/photos/dock-lg.avif 1920w",
    );
    expect(photo).toMatchObject({ width: 1920, height: 1280, blurDataURL: "data:image/webp;base64,AAAA" });
  });

  it("carries the details through: alt, caption, author, date, medium, licence, source", () => {
    const details = {
      name: "dock",
      alt: "A dock",
      description: "A caption",
      author: "Ada",
      takenAt: "2024-01-01",
      medium: "Photograph",
      license: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
      source: "https://example.org/dock",
    };
    const [photo] = readGalleryPhotos([details], sizes);
    const { name, ...rest } = details;
    expect(photo).toMatchObject({ ...rest, file: name });
  });

  it("leaves out a work with no prepared sizes rather than show it broken", () => {
    expect(readGalleryPhotos([{ name: "missing", alt: "Gone" }], sizes)).toEqual([]);
  });
});
