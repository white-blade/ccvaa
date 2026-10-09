# Original photos (not deployed)

Full-resolution sources for files in `public/photos/` that had to be downscaled for
the web. Nothing here is served — it sits outside `public/`.

| File | Why |
|------|-----|
| `5.avif` | 5760×8640 (~50MP). Browsers allocate ~200MB to decode that, stalling mobile. Shipped as `5.jpg` at 1600px. |
| `3.jpg` | 2.1MB. Shipped recompressed at 1600px. |

Budget for new gallery photos: WebP/AVIF/JPEG, longest edge ≤1920px, ≤300KB each.
`images.unoptimized` is required on GitHub Pages, so nothing resizes these at build —
whatever is committed is exactly what visitors download.
