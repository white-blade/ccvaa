import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { EventsSection } from "@/components/EventsSection";
import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Header overlayHero />
      <main>
        <Hero />
        <AboutSection />
        <GallerySection />
        <EventsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
