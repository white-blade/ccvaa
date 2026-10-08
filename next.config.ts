import type { NextConfig } from "next";

/**
 * Served from a GitHub project page at https://<user>.github.io/ccvaa/, so every
 * route and asset is prefixed with the repo name. To move to a custom domain, set this
 * to "" and add a `public/CNAME`; to serve from a user page, rename the repo to
 * `<user>.github.io` and set this to "".
 */
const basePath = "/ccvaa";

const nextConfig: NextConfig = {
  /** Static HTML export — GitHub Pages serves `out/` with no server runtime. */
  output: "export",
  basePath,
  /**
   * `basePath` covers routes and `_next/*`, but NOT `src` strings we pass to
   * next/image. Re-export it so `assetPath()` can prefix `public/` references.
   */
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  /** Pages cannot run the Image Optimization API. */
  images: { unoptimized: true },
  /** Emit `about/index.html` style paths so Pages resolves routes without a rewriter. */
  trailingSlash: true,
};

export default nextConfig;
