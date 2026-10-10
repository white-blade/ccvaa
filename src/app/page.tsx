import { AboutSection } from "@/components/AboutSection";
import { BackToTop } from "@/components/BackToTop";
import { ContactSection } from "@/components/ContactSection";
import { EventsSection } from "@/components/EventsSection";
import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SectionLinks } from "@/components/SectionLinks";
import { TabBar } from "@/components/TabBar";
import { headerContent } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* First stop for keyboard users: past the header straight to the content. */}
      <a
        href="#main"
        className="sr-only z-[110] rounded-full bg-ocean-900 px-5 py-3 text-sm font-semibold text-cream shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-coral"
      >
        {headerContent.skipLabel}
      </a>
      <SectionLinks />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <AboutSection />
        <GallerySection />
        <EventsSection />
        <ContactSection />
      </main>
      <Footer />
      <TabBar />
      <BackToTop />
    </>
  );
}
