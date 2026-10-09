import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Header } from "@/components/Header";
import { readGalleryPhotos } from "@/lib/gallery";
import { galleryPageContent } from "@/lib/site";

export const metadata: Metadata = {
  title: galleryPageContent.title,
  description: galleryPageContent.description,
};

/**
 * Every photograph, in a grid the visitor sizes. Same build-time folder read as the
 * home-page carousel, so a file dropped into `public/photos/` shows up in both.
 */
export default async function GalleryPage() {
  const photos = await readGalleryPhotos();

  return (
    <>
      <Header />
      {/* pt clears the fixed header — this page has no hero to sit beneath it. */}
      <main className="pt-16 sm:pt-20">
        <section className="bg-cream py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl">
                {galleryPageContent.title}
              </h1>
              <p className="mt-6 text-base leading-relaxed text-ocean-700">
                {galleryPageContent.description}
              </p>
            </div>

            {photos.length > 0 ? (
              <GalleryGrid photos={photos} />
            ) : (
              <p className="mt-10 text-sm text-ocean-500">
                {galleryPageContent.emptyNote}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
