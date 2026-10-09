import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MembershipSection } from "@/components/MembershipSection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <MembershipSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
