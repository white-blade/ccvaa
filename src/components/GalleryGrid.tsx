"use client";

import Image from "next/image";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import { ColumnControl } from "@/components/ColumnControl";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import type { GalleryPhoto } from "@/lib/gallery";
import { galleryContent, galleryPageContent } from "@/lib/site";
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

  /** Which tile opened the viewer, so focus can go back to it on close. */
  const tileRefs = useRef(new Map<number, HTMLButtonElement | null>());

  const closeViewer = useCallback(() => {
    setOpenIndex((previous) => {
      if (previous !== null) {
        tileRefs.current.get(previous)?.focus();
      }
      return null;
    });
  }, []);

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
      ? galleryPageContent.countNoun
      : galleryPageContent.countNounPlural
  }`;

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm lining-nums tabular-nums text-ocean-500">
          {countLabel}
        </p>

        <ColumnControl
          id="gallery-columns"
          label={galleryPageContent.columnsLabel}
          options={COLUMN_OPTIONS}
          value={columns}
          onChange={columnStore.choose}
        />
      </div>

      <ul className={`mt-6 grid gap-3 sm:gap-4 ${GRID_CLASS[columns]}`}>
        {photos.map((photo, index) => (
          <li key={photo.file}>
            <button
              type="button"
              ref={(node) => {
                tileRefs.current.set(index, node);
              }}
              onClick={() => setOpenIndex(index)}
              aria-haspopup="dialog"
              // Square tiles keep the grid even and reserve their space before the
              // file loads, so changing the column count never shifts the page. The
              // crop is only the tile — the viewer shows the whole photograph.
              className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-ocean-100 bg-ocean-100 shadow-sm transition-colors hover:border-ocean-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                unoptimized
                loading="lazy"
                sizes={`(min-width: 1024px) ${Math.round(72 / columns)}rem, 50vw`}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="sr-only">{galleryContent.zoomLabel}</span>
            </button>
          </li>
        ))}
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
