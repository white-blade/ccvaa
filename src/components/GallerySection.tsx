import { GalleryCarousel } from "@/components/GalleryCarousel";
import { readGalleryPhotos } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";

/**
 * Server component: resolves the photo list at build time, then hands it to the
 * client carousel. Renders nothing at all when there are no photos, so an empty
 * folder leaves no hollow section behind.
 */
export async function GallerySection() {
  const photos = await readGalleryPhotos();

  if (photos.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className="scroll-mt-24 bg-ocean-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ocean-900 sm:text-4xl">
            {galleryContent.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ocean-700">
            {galleryContent.description}
          </p>
        </div>

        <div className="mt-10">
          <GalleryCarousel photos={photos} />
        </div>
      </div>
    </section>
  );
}
