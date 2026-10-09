import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Header } from "@/components/Header";
import { PageBanner } from "@/components/PageBanner";
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
      {/* pt clears the fixed header; the banner is not a full hero, so the header
          stays in its light state rather than overlaying it. */}
      <main className="pt-16 sm:pt-20">
        <PageBanner
          eyebrow={galleryPageContent.eyebrow}
          title={galleryPageContent.title}
          description={galleryPageContent.description}
          imageSrc={photos[0]?.src}
        />

        <section className="bg-cream pb-16 sm:pb-20">
          {/* Pulled up so the toolbar and lead photograph straddle the banner's edge. */}
          <div className="relative mx-auto -mt-28 max-w-6xl px-6 sm:-mt-32">
            {photos.length > 0 ? (
              <GalleryGrid photos={photos} />
            ) : (
              <p className="rounded-3xl bg-white p-10 text-sm text-ocean-500 shadow-xl ring-1 ring-ocean-100">
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
