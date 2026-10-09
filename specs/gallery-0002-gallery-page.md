# gallery-0002 — Gallery page and carousel polish

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`gallery-0001`](gallery-0001-photo-gallery.md) |
| **Source** | CEO (2026-10-09) |

## Goal

Two things, from one request:

1. **Make the home-page gallery look better.**
2. **A gallery tab showing every photograph**, where the visitor controls the
   layout — "3 in a line, 4 in a line".

Still a static export: no server, no image API, no new dependencies.

## 1 — Carousel polish

`gallery-0001` deliberately chose `object-contain` over `cover`, because the set mixes
portrait with landscape and cropping artwork is wrong. The cost was visible: a flat
`bg-ocean-100` bar down each side of every portrait photograph.

| Before | After |
|---|---|
| Flat grey bars beside each photo | The same file, `object-cover` + `blur-2xl` + 40% opacity, behind the contained image — a matted frame rather than empty space. Costs no extra request; the browser already has the file. |
| Caption paragraph below the stage, re-flowing on every advance | Caption overlaid on a bottom gradient, `line-clamp-3`, so a longer description cannot shift the page |
| Six 10px dots | 48px thumbnails — they show *which* photograph you are picking. Same URLs as the slides, so no added bytes. |
| Counter in the control row | Counter as a pill on the image, control row reduced to prev / play / next |
| — | `View all photographs →` link to the new page |

Stage grew from `h-[22rem] sm:h-[30rem]` to `h-[24rem] sm:h-[32rem]`.

## 2 — `/gallery`

A route, not an anchor — `gallery-0001` left `#gallery` out of the nav on the grounds
that the nav was full. A page with its own URL earns an entry, so `navigation` now
reads **About · Gallery · Contact · Membership**.

```
src/app/gallery/page.tsx     server: readGalleryPhotos() at build, metadata, Header/Footer
src/components/GalleryGrid.tsx   client: column control + grid + viewer
```

### The column control

Segmented buttons: **2 / 3 / 4 / 5** per row, `aria-pressed` on the active one,
remembered in `localStorage` under `ccvaa:gallery-columns`.

The choice is read through `useSyncExternalStore` — the same shape as the carousel's
reduced-motion hook, and what React 19's `set-state-in-effect` rule pushes you toward.
The server snapshot is the default, because the HTML is built once at `next build` with
no visitor and no storage; React swaps in the stored value right after hydration. An
in-memory mirror keeps the control working when storage is blocked, and both the read
and the write are wrapped — private browsing must forget the preference, not break the
page.

Class names are written out per option, not interpolated. Tailwind scans source text,
so `grid-cols-${n}` would never be generated:

| Choice | Phone | `sm` | `lg` |
|---|---|---|---|
| 2 | 2 | 2 | 2 |
| 3 | 2 | 3 | 3 |
| 4 | 2 | 3 | 4 |
| 5 | 2 | 4 | 5 |

Phones hold at two across regardless — five tiles on a phone are too small to read.

### Tiles

Square, `object-cover`. Cropping in the *grid* is a different question from cropping in
the *carousel*: a square tile reserves its space before the file loads, so switching
column count never shifts the page, and every tile opens the whole uncropped
photograph in the viewer. Fixed aspect ratios also avoid reading image dimensions at
build time, which would mean a new dependency — the same reasoning as `gallery-0001`.

## Shared lightbox

The carousel's inline lightbox is now `src/components/GalleryLightbox.tsx`, used by
both the carousel and the grid. It picks up what `gallery-0001` specified but the
inline version missed: **backdrop click to close**, guarded with
`event.target === event.currentTarget` so a click on the image is not a close.

## Weight

No new files in `public/`. The grid page serves the same six photographs the home page
already does — 1.4MB — and nothing is loaded twice: thumbnails, tiles, slides, and the
viewer all reference identical URLs.

## Scope

### In

- `GalleryLightbox` extracted and shared; backdrop close added
- `GalleryCarousel` visual rework (matted backdrop, overlay caption, thumbnails)
- `GalleryGrid` + `/gallery` route
- `Gallery` nav entry; `galleryPageContent` and `viewAllLabel` in `src/lib/site.ts`

### Out

- Albums, tags, filtering, sorting, per-photo pages
- Masonry layout. It preserves aspect ratios, but without build-time image dimensions
  it cannot reserve space, so photographs would land with visible layout shift.
- Build-time thumbnail generation. Worth revisiting if the folder passes ~30 photos:
  the grid then downloads every full-size file, and `images.unoptimized` means nothing
  resizes them.

## Acceptance criteria

- [ ] `lint`, `typecheck`, `build` pass; `/` and `/gallery` both prerender as `○ (Static)`
- [ ] `/gallery` lists every file in `public/photos/`, with no code edit to add one
- [ ] 2 / 3 / 4 / 5 all change the layout; the choice survives a reload
- [ ] Choice is forgotten, not fatal, when storage is blocked
- [ ] Tiles and the carousel open the same viewer: Escape, backdrop, and button close;
      ←/→ navigate; focus trapped, and restored to the tile that opened it
- [ ] No layout shift when switching column count or on first load
- [ ] Carousel autoplay, pause control, and `prefers-reduced-motion` still behave
- [ ] Build succeeds and `/gallery` shows its empty note when the folder is empty

## Risks

| Risk | Mitigation |
|------|-----------|
| Grid downloads every photograph at full size | `loading="lazy"`; sizing budget from `gallery-0001` still applies; thumbnail step noted above |
| Hydration mismatch from the stored preference | `useSyncExternalStore` with a default server snapshot |
| Blurred backdrop reads as a rendering fault rather than a mat | low opacity and heavy blur, so it reads as atmosphere; revisit if it distracts |
