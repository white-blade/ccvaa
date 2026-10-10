# gallery-0004 — New works, progressive pictures, and a gallery of any size

| Field | Value |
|-------|--------|
| **Type** | `task` |
| **Priority** | `now` |
| **Status** | `in-progress` — implemented, awaiting review |
| **Depends on** | [`gallery-0003`](gallery-0003-sliding-gallery.md) |
| **Source** | CEO (2026-10-10) |

## Goal

1. Replace the six placeholder photographs with 20 better ones the CEO collected,
   with credits that match what each picture is.
2. Answer: why `assets/photos-original`? Do we render progressively?
3. Keep the gallery workable when it holds more than 20 works — more dots is not
   the answer.
4. Word the gallery for every kind of visual art, not only photography.

## The works

The 20 downloads are landscape photographs from Wikimedia Commons. Two (`10-` and
`19-`) are the same picture, so **19** are used.

**Credits are real, not invented.** CC BY and CC BY-SA licences require the
creator's name, the licence, and a link; inventing an author would breach them. The
creator, licence, and date of each come from the Commons API (`extmetadata`):
`DateTimeOriginal`, `Artist`, `LicenseShortName`. One (the U.S. Fish and Wildlife
desert scene) records no date, so it shows none. Alt text and captions were written
from looking at each picture.

Each work now carries `medium` ("Photograph") and, for licensed work, `license`
(name + URL) and `source` (its Commons page). The credit line shows the licence and
"Source ↗", both opening in a new tab.

**Flag for the CEO:** these are other people's photographs, credited as such. The
section copy no longer says they are the community's work (see Wording); replace
them with members' work as it comes in.

## Why `assets/photos-original` existed — and why it is gone

It held full-resolution originals of two old photographs that had to be downscaled
for the web, so they could be regenerated. With those photographs replaced it is
dead weight, and keeping originals in git does not scale: the 19 new originals are
~90 MB. They now live outside the repository (the association's archive), and the
web sizes are regenerated from them by script. `assets/README.md` says so.

## Progressive rendering

Before: no. Each slide loaded one full file (up to 640 KB), on a phone as on a
desktop, with nothing shown until it arrived.

Now, `npm run photos -- <originals>` (`scripts/gallery-photos.mjs`, using sharp,
which Next already ships) prepares every work ahead of time, because GitHub Pages
has no image optimizer:

- **Three sizes**, AVIF, longest side about 640 / 1280 / 1920px, within 60 / 160 /
  300 KB. Quality steps down until a size fits; a scene too detailed to fit at a
  decent quality (≥ q34) is made a little smaller (1760, 1600, 1440) instead of a
  lot blurrier. AVIF because foliage and water only fit 300 KB at 1920px as AVIF;
  WebP needed a quality that smeared them. 7.5 MB in all, from ~90 MB of originals.
- **A blurred preview**: 24px wide, ~300 bytes, inlined in the page.

`GalleryPicture` renders a plain `<img srcset sizes>` (next/image drops `srcset`
when unoptimized) over the preview, and fades the picture in on load
(`motion-safe`). The browser picks the smallest sharp size — a phone takes the
1280px file, never the 1920px one. Without JavaScript the picture just shows; the
fade is armed only under `html.js`. A failed picture still uncovers, so its alt text
shows. The next work is prefetched at the size this screen will use.

## A gallery of any size

A dot per work stops working long before 20. The slideshow now shows **at most 7
dots**: a window that slides to keep the current work near its middle, with the dots
at an edge that has more beyond drawn smaller (the page indicator phones use). The
row is the same width for 7 works or 700. Where you are is said exactly by the
counter ("10 / 19"); to jump far, the viewer's thumbnail strip holds every work and
scrolls. Logic: `lib/dot-window.ts`.

Not built: a "View all" grid. Worth adding if the gallery reaches many dozens.

## Wording

The section said "Work and moments from our community, one photograph at a time."
It now reads: "A changing selection of visual art — photography, painting,
printmaking, and more. Choose any work to see it in full." Controls say *work* and
*image* rather than *photograph* ("Show work 3", "Previous work", "Expand image");
screen readers hear "By …" and "Made …"; `medium` names what each work is.

## Devices

Unchanged rules: from `md` the work fills the stage with the veil; below, a card;
swipe on touch; tap targets ≥ 40px (the credit links grow to 40px on coarse
pointers); the dot row fits beside the arrows at 320px.

## Regression guards

`quality-0001`: S4 rewritten, S11–S13 added, C3 rewritten.

- unit:dot-window — window size, centring, edge scales, pinned ends.
- unit:gallery-photos — three sizes per work, on disk, within budget; no unused file;
  real past dates; licensed works credited; nothing blank.
- unit:gallery — authored order, srcset, details carried through, missing sizes left out.
- unit:GallerySlider — a 20-work gallery's dots; srcset, preview, fade-in, error;
  credit links; viewer credit; axe.
- e2e › gallery works — size chosen per device (phones never the 1920px file); the
  dots stay seven wide and fit; the credit links are clickable over the veil.
