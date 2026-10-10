// @vitest-environment node
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import photoSizes from "@/lib/gallery-photo-sizes.json";
import { PHOTO_DIR } from "@/lib/gallery";
import { galleryPhotoDetails } from "@/lib/gallery-photos";
import { formatIsoDate } from "@/lib/text";

/** Checks the authored list against what `npm run photos` produced, so a bad edit fails here. */
const directory = path.join(process.cwd(), "public", PHOTO_DIR);
const filesOnDisk = readdirSync(directory).filter((name) => !name.startsWith("."));
const sizes = photoSizes as Record<string, { variants: { file: string; width: number; height: number }[]; blurDataURL: string }>;
const names = galleryPhotoDetails.map((details) => details.name);

describe("gallery-photos.ts, the works' details", () => {
  it("lists each work once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it("has three prepared sizes for every work, each on disk and within budget", () => {
    for (const name of names) {
      const prepared = sizes[name];
      expect(prepared, `${name} has no sizes: run npm run photos`).toBeDefined();
      expect(prepared.variants.map((variant) => variant.file).sort()).toEqual(
        [`${name}-lg.avif`, `${name}-md.avif`, `${name}-sm.avif`],
      );
      for (const variant of prepared.variants) {
        const bytes = statSync(path.join(directory, variant.file)).size;
        expect(bytes, `${variant.file} is over the 300 KB budget`).toBeLessThanOrEqual(300_000);
        expect(Math.max(variant.width, variant.height), `${variant.file} is too large`).toBeLessThanOrEqual(1920);
      }
      expect(prepared.blurDataURL).toMatch(/^data:image\/webp;base64,/);
      // A preview is a few hundred bytes, inlined in the page for every work.
      expect(prepared.blurDataURL.length).toBeLessThan(1_500);
    }
  });

  it("leaves nothing in public/photos/ that no work uses", () => {
    const used = new Set(names.flatMap((name) => sizes[name]?.variants.map((variant) => variant.file) ?? []));
    expect(filesOnDisk.filter((file) => !used.has(file))).toEqual([]);
  });

  it("gives real calendar dates, as YYYY-MM-DD, none in the future", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const { name, takenAt } of galleryPhotoDetails) {
      if (takenAt === undefined) continue;
      expect(formatIsoDate(takenAt), `${name}: ${takenAt}`).not.toBeNull();
      expect(takenAt <= today, `${name} is dated in the future`).toBe(true);
    }
  });

  it("credits every licensed work with its creator, licence, and source", () => {
    for (const { name, author, license, source } of galleryPhotoDetails) {
      if (!license) continue;
      expect(author?.trim(), `${name}: a licensed work names its creator`).toBeTruthy();
      expect(license.url, name).toMatch(/^https:\/\/creativecommons\.org\//);
      expect(source, `${name}: a licensed work links its source`).toMatch(/^https:\/\//);
    }
  });

  it("leaves no field blank", () => {
    for (const details of galleryPhotoDetails) {
      for (const [field, value] of Object.entries(details)) {
        expect(JSON.stringify(value).replace(/"/g, "").trim(), `${details.name}: ${field}`).not.toBe("");
      }
    }
  });
});
