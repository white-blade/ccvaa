import { GallerySlider } from "@/components/GallerySlider";
import { Section } from "@/components/Section";
import { readGalleryPhotos } from "@/lib/gallery";
import { galleryContent } from "@/lib/site";

/**
 * Server component: resolves the photo list at build time, then hands it to the
 * client slideshow. Renders nothing at all when there are no photos, so an empty folder
 * leaves no hollow section behind.
 */
export async function GallerySection() {
  const photos = await readGalleryPhotos();

  if (photos.length === 0) {
    return null;
  }

  return (
    <Section
      id="gallery"
      tone="dark"
      eyebrow={galleryContent.eyebrow}
      title={galleryContent.title}
      description={galleryContent.description}
      glow
    >
      <div className="mt-10">
        <GallerySlider photos={photos} />
      </div>
    </Section>
  );
}
