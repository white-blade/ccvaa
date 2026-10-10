/**
 * Prepares gallery photographs for the web: `npm run photos -- <folder of originals>`.
 *
 * GitHub Pages serves exactly what is committed (no image optimizer), so this does
 * that work ahead of time. For each original it writes, into public/photos/:
 *
 *   <name>-sm.avif, <name>-md.avif, <name>-lg.avif
 *
 * three sizes for `srcset` (the longest side about 640, 1280, 1920px), so a phone
 * downloads a phone-sized file, each within the size budget. AVIF, because detailed
 * scenes (foliage, water) only fit the 300 KB budget at 1920px as AVIF: WebP at the
 * same size needs a quality that visibly smears them. Every current browser shows it; and it records each size's real dimensions (for `srcset`) and a tiny blurred
 * preview in src/lib/gallery-photo-sizes.json, shown while the real one loads.
 *
 * <name> is the original's file name without its extension or a leading "NN-".
 * Originals stay outside the repository (they run to megabytes each); keep them
 * wherever the association keeps its archive, and run this again to regenerate.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/**
 * Three sizes per photograph: the longest side at most this many pixels, within
 * this many bytes (the large one is the site-wide 300 KB image budget). A scene too
 * detailed to fit the large budget at 1920px at a decent quality is made a little
 * smaller instead of a lot blurrier.
 */
const TIERS = [
  { name: "sm", sides: [640], budget: 60_000 },
  { name: "md", sides: [1280, 1120], budget: 160_000 },
  { name: "lg", sides: [1920, 1760, 1600, 1440], budget: 300_000 },
];
/** Lowest AVIF quality we accept before stepping the size down instead. */
const MIN_QUALITY = 34;
const SOURCE = /\.(jpe?g|png|webp|avif|tiff?)$/i;

const source = process.argv[2];
if (!source) {
  console.error("Usage: npm run photos -- <folder of original photographs>");
  process.exit(1);
}

const root = process.cwd();
const outDir = path.join(root, "public", "photos");
const sizesFile = path.join(root, "src", "lib", "gallery-photo-sizes.json");
await mkdir(outDir, { recursive: true });

let sizes = {};
try {
  sizes = JSON.parse(await readFile(sizesFile, "utf8"));
} catch {}

const files = (await readdir(source)).filter((file) => SOURCE.test(file)).sort();
for (const file of files) {
  const name = path.parse(file).name.replace(/^\d+-/, "");
  const original = sharp(path.join(source, file)).rotate(); // honour camera orientation

  const variants = [];
  for (const tier of TIERS) {
    let output;
    let quality;
    let side;
    fit: for (side of tier.sides) {
      for (quality = 62; quality >= MIN_QUALITY; quality -= 4) {
        output = await original
          .clone()
          .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
          .avif({ quality, effort: 5 })
          .toBuffer();
        if (output.length <= tier.budget) break fit;
      }
    }
    if (output.length > tier.budget) throw new Error(`${file} does not fit ${tier.budget} bytes`);
    const out = `${name}-${tier.name}.avif`;
    await writeFile(path.join(outDir, out), output);
    const { width, height } = await sharp(output).metadata();
    variants.push({ file: out, width, height });
    console.log(`${out}  ${width}×${height}  ${Math.round(output.length / 1024)} KB  q${quality}`);
  }

  const blur = await original.clone().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  sizes[name] = { variants, blurDataURL: `data:image/webp;base64,${blur.toString("base64")}` };
}

const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(sizesFile, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`\n${files.length} photographs → public/photos/, sizes → src/lib/gallery-photo-sizes.json`);
