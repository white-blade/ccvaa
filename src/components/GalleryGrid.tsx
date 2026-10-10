"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";

import { ColumnControl } from "@/components/ColumnControl";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";
import { createColumnStore } from "@/lib/use-columns";

const COLUMN_OPTIONS = [2, 3, 4, 5] as const;
type ColumnCount = (typeof COLUMN_OPTIONS)[number];

const columnStore = createColumnStore<ColumnCount>(
  "ccvaa:gallery-columns",
  COLUMN_OPTIONS,
  3,
);

function useColumns() {
  return useSyncExternalStore(
    columnStore.subscribe,
    columnStore.getSnapshot,
    columnStore.getServerSnapshot,
  );
}

/**
 * Written out in full because Tailwind scans source text for class names — a count
 * interpolated into `grid-cols-${n}` would never be generated. Phones hold at two
 * across whatever is chosen; five thumbnails on a phone are too small to read.
 */
const GRID_CLASS: Record<ColumnCount, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5",
};

type GalleryGridProps = {
  photos: GalleryPhoto[];
};

export function GalleryGrid({ photos }: GalleryGridProps) {
  const columns = useColumns();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const closeViewer = useCallback(() => setOpenIndex(null), []);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  const goNext = useCallback(() => step(1), [step]);
  const goPrevious = useCallback(() => step(-1), [step]);

  const countLabel = `${photos.length} ${
    photos.length === 1
      ? galleryContent.countNoun
      : galleryContent.countNounPlural
  }`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/5 px-5 py-3 ring-1 ring-white/10 backdrop-blur">
        <p className="text-sm font-medium lining-nums tabular-nums text-ocean-100">
          {countLabel}
        </p>

        <ColumnControl
          id="gallery-columns"
          label={galleryContent.columnsLabel}
          options={COLUMN_OPTIONS}
          value={columns}
          onChange={columnStore.choose}
          onDark
        />
      </div>

      {/* Dense flow lets the smaller tiles pack in around the 2×2 lead photograph. */}
      <ul className={`mt-6 grid grid-flow-dense gap-3 sm:gap-4 ${GRID_CLASS[columns]}`}>
        {photos.map((photo, index) => {
          const lead = index === 0 && photos.length > 2;
          return (
            <li
              key={photo.file}
              className={`motion-safe:animate-rise-in ${lead ? "col-span-2 row-span-2" : ""}`}
              style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-haspopup="dialog"
                // Square tiles keep the grid even and reserve their space before the
                // file loads, so changing the column count never shifts the page. The
                // crop is only the tile — the viewer shows the whole photograph.
                className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-ocean-900 shadow-lg shadow-black/20 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40 hover:ring-coral/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  unoptimized
                  loading={lead ? "eager" : "lazy"}
                  sizes={
                    lead
                      ? `(min-width: 1024px) ${Math.round(144 / columns)}rem, 100vw`
                      : `(min-width: 1024px) ${Math.round(72 / columns)}rem, 50vw`
                  }
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <span
                  aria-hidden="true"
                  // Touch screens never hover, so there the overlay simply stays on.
                  className="absolute inset-0 bg-gradient-to-t from-ocean-950/70 via-ocean-950/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100 sm:p-4"
                >
                  <span className="font-display text-lg font-semibold text-white lining-nums tabular-nums sm:text-xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ocean-900 shadow-sm backdrop-blur">
                    {galleryContent.viewLabel}
                    <span className="text-coral-dark">⤢</span>
                  </span>
                </span>
                <span className="sr-only">{galleryContent.zoomLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {openIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={openIndex}
          onClose={closeViewer}
          onNext={goNext}
          onPrevious={goPrevious}
        />
      )}
    </>
  );
}
