// @vitest-environment node
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import { readGalleryPhotos } from "@/lib/gallery";
import { galleryPhotoDetails } from "@/lib/gallery-photos";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readdir: vi.fn(actual.readdir) };
});

function entry(name: string, isFile = true): Dirent {
  return { name, isFile: () => isFile } as Dirent;
}

afterEach(() => {
  vi.mocked(readdir).mockReset();
});

describe("readGalleryPhotos", () => {
  it("reads the real public/photos folder with base-path URLs and alt text", async () => {
    vi.mocked(readdir).mockImplementation(
      (await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises"))
        .readdir as typeof readdir,
    );
    const photos = await readGalleryPhotos();
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.src).toBe(`/ccvaa/photos/${photo.file}`);
      expect(photo.alt.trim()).not.toBe("");
    }
  });

  it("keeps only image files and sorts them numerically", async () => {
    vi.mocked(readdir).mockResolvedValue([
      entry("10.jpg"),
      entry("2.avif"),
      entry("notes.txt"),
      entry("9.PNG"),
      entry("drafts.jpg", false),
    ] as never);

    const photos = await readGalleryPhotos();
    expect(photos.map((photo) => photo.file)).toEqual(["2.avif", "9.PNG", "10.jpg"]);
  });

  it("joins each file with its details: alt text, caption, author, date", async () => {
    vi.mocked(readdir).mockResolvedValue([entry("1.jpg")] as never);
    const [photo] = await readGalleryPhotos();
    const details = galleryPhotoDetails.find((each) => each.file === "1.jpg")!;
    expect(photo).toEqual({ ...details, src: "/ccvaa/photos/1.jpg" });
  });

  it("gives a photo without an entry a generic description and no credits", async () => {
    vi.mocked(readdir).mockResolvedValue([entry("99.jpg")] as never);
    const [photo] = await readGalleryPhotos();
    expect(photo.alt).toMatch(/Coast to Coast Visual Arts Association/);
    expect(Object.keys(photo).sort()).toEqual(["alt", "file", "src"]);
  });

  it("returns nothing when the folder is missing", async () => {
    vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
    expect(await readGalleryPhotos()).toEqual([]);
  });
});
