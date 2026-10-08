import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Static HTML export — GitHub Pages serves `out/` with no server runtime. */
  output: "export",
  /** Pages cannot run the Image Optimization API. */
  images: { unoptimized: true },
  /** Emit `about/index.html` style paths so Pages resolves routes without a rewriter. */
  trailingSlash: true,
};

export default nextConfig;
