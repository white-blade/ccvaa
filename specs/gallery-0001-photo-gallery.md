# gallery-0001 — Home-page photo gallery

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`platform-0002`](platform-0002-github-pages-static-migration.md) |
| **Source** | CEO (2026-10-08) |

## Goal

A photo gallery on the home page, between **Our Purposes** and **Contact**, that:

- draws its photos from a folder in the repo — drop a file in, it appears
- **auto-plays** through them
- lets a visitor **stop on one** and **zoom** it

Must work as a static export on GitHub Pages: no server, no image API, no secrets.

## Placement

"Our Purposes" is rendered *inside* `AboutSection` (via `PurposesSection`), so the
gallery is a sibling section in `src/app/page.tsx`, not a child of About:

```
Hero → AboutSection (intro, Board, Purposes) → GallerySection → ContactSection → Footer
```

Section id `#gallery`, matching the `scroll-mt-24` convention of its neighbours. Adding
it to the header nav is **out of scope** — the nav is already four items.

## How photos get into the page

`public/photos/` holds the images. Nothing lists a directory at runtime on a static
host, so the file list is resolved **at build time**:

```
GallerySection (server component)
  └─ node:fs readdir("public/photos") at build
       └─ <GalleryCarousel photos={…} />   (client component)
```

`next build` executes the server component once, reads the folder, and bakes the
filenames into the static HTML. Adding a photo is then **drop the file in the folder
and push** — no code edit, which is what "auto play photos in photos folder" requires.

Must not throw when `public/photos/` is absent or empty: the read is wrapped, and the
section renders nothing at all rather than an empty frame.

### Alt text and captions

Filenames make poor alt text, and a visual arts association needs titles and credits.
An **optional** manifest in `src/lib/gallery.ts` maps filename → `{ alt, title, credit }`.
Photos with no entry fall back to a generic alt and render without a caption. The
manifest lives in `src/`, not `public/`, so it is never served as a file.

## Behaviour

### Autoplay

- Advances every ~5s with a crossfade
- **Pauses** on hover, on keyboard focus, and when the lightbox is open
- An explicit **Play/Pause** control — required by WCAG 2.2.2 for any content that
  auto-updates; hover-pause alone does not satisfy it
- Honours `prefers-reduced-motion`: starts **paused** and does not auto-advance

### Stop and zoom

- Clicking a photo opens a **lightbox** — dark backdrop, image scaled to fit (`contain`)
- Closes on **Escape**, backdrop click, or an explicit close button
- **←/→** move between photos; focus is trapped while open and restored to the
  triggering thumbnail on close
- Page scroll locked while open
- *Optional second level:* click inside the lightbox to magnify ~2× with drag-to-pan.
  Defer unless wanted — it is most of the complexity for a minority of the value.

## Constraints this host imposes

`images.unoptimized: true` is set because GitHub Pages cannot run Next's Image
Optimization API. **Nothing resizes these files** — whatever is committed is what every
visitor downloads, at full size.

So source photos must be pre-sized before committing:

| Property | Target |
|---|---|
| Format | WebP (JPEG acceptable) |
| Longest edge | ≤ 1920px |
| Per file | ≤ 300KB |
| Total gallery | ≤ 10MB |

For scale: the whole site is currently **2.5MB**. Ten unprocessed phone photos would be
~50MB — a twenty-fold regression in load time, and material against Pages' 1GB repo and
100GB/month bandwidth limits.

Mitigations in the implementation: fixed aspect-ratio containers with `object-fit: cover`
(so no layout shift and no need to read image dimensions at build, keeping the dependency
count at zero), `loading="lazy"` on every slide but the first, and `decoding="async"`.

## Scope

### In

- `public/photos/` + a short README on sizing
- `src/lib/gallery.ts` — build-time read, extension filter, optional caption manifest
- `src/components/GallerySection.tsx` — server component
- `src/components/GalleryCarousel.tsx` — client component (autoplay, lightbox)
- `galleryContent` in `src/lib/site.ts` — heading, intro, control labels
- Wired into `src/app/page.tsx` between About and Contact

### Out

- Nav entry for `#gallery`
- Albums, categories, filtering, or per-photo pages
- Uploads through the site — adding photos is a git commit, by design. An upload
  feature needs a server and a write credential, which this architecture does not have.
- Automatic resizing or thumbnail generation. Could be added later as a build step or
  a GitHub Action, but it introduces a dependency and is not needed at this volume.

## Photos as delivered (2026-10-08)

Six photographs supplied by CEO — a deliberate mix of JPEG and AVIF, mostly portrait
with one landscape. Two needed work before they could ship:

| File | Before | After |
|------|--------|-------|
| `5.avif` | 5760×8640, 832KB | → `5.jpg` 1066×1600, 312KB |
| `3.jpg` | 1616×2267, 2.1MB | 1140×1600, 628KB |

`5.avif` was the serious one: at ~50 megapixels a browser must allocate roughly 200MB to
decode it, which stalls or crashes mobile Safari regardless of the modest file size. File
size alone is a misleading metric — **pixel count is what costs memory.**

Originals are preserved in `assets/photos-original/`, outside the deployed tree.
Folder total: **3.4MB → 1.4MB**; whole site 2.5MB → 4.0MB.

Alt text for all six is written in `src/lib/gallery.ts`. These read as generic landscape
photography rather than CCVAA's own work — swap in the association's photographs when
available; no code change needed, and add matching `PHOTO_ALT` entries.

## Acceptance criteria

- [ ] `lint`, `typecheck`, `build` pass; `/` still prerenders as `○ (Static)`
- [ ] Adding a file to `public/photos/` makes it appear after a rebuild, with no code edit
- [ ] Build succeeds and the section is omitted when the folder is missing or empty
- [ ] Autoplay advances, and pauses on hover, focus, and lightbox open
- [ ] Play/Pause control present and keyboard reachable
- [ ] `prefers-reduced-motion` starts paused with no auto-advance
- [ ] Lightbox: Escape / backdrop / button all close; ←/→ navigate; focus trapped
      and restored; background scroll locked
- [ ] Every image has meaningful alt text
- [ ] No layout shift as photos load
- [ ] Total page weight stays under ~12MB with a representative photo set

## Risks

| Risk | Mitigation |
|------|-----------|
| Oversized photos tank load time | documented budget; check `du -sh out` before merge |
| Autoplay as an accessibility failure | pause control + reduced-motion, both in acceptance |
| First substantial client JS on the site | isolated to one component; the rest of the page stays server-rendered |
| Folder missing at build | read is wrapped; section renders nothing |
