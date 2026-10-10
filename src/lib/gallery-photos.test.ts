// @vitest-environment node
import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PHOTO_DIR, SUPPORTED_FORMATS } from "@/lib/gallery";
import { galleryPhotoDetails } from "@/lib/gallery-photos";
import { formatIsoDate } from "@/lib/text";

const filesOnDisk = readdirSync(path.join(process.cwd(), "public", PHOTO_DIR)).filter((name) =>
  SUPPORTED_FORMATS.test(name),
);
const listed = galleryPhotoDetails.map((details) => details.file);

describe("gallery-photos.ts, the photographs' details", () => {
  it("has an entry for every photograph in public/photos/", () => {
    expect(filesOnDisk.filter((file) => !listed.includes(file))).toEqual([]);
  });

  it("names only files that exist, each once", () => {
    expect(listed.filter((file) => !filesOnDisk.includes(file))).toEqual([]);
    expect(new Set(listed).size).toBe(listed.length);
  });

  it("gives real calendar dates, as YYYY-MM-DD, none in the future", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const { file, takenAt } of galleryPhotoDetails) {
      if (takenAt === undefined) continue;
      expect(formatIsoDate(takenAt), `${file}: ${takenAt}`).not.toBeNull();
      expect(takenAt <= today, `${file} is dated in the future`).toBe(true);
    }
  });

  it("leaves no field blank", () => {
    for (const details of galleryPhotoDetails) {
      for (const [field, value] of Object.entries(details)) {
        expect(String(value).trim(), `${details.file}: ${field}`).not.toBe("");
      }
    }
  });
});
