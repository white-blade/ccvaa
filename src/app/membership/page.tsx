import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MembershipSection } from "@/components/MembershipSection";
import { membershipContent } from "@/lib/site";

export const metadata: Metadata = {
  title: membershipContent.title,
  description: membershipContent.description,
};

export default function MembershipPage() {
  return (
    <>
      <Header />
      {/* pt clears the fixed header — this page has no hero to sit beneath it. */}
      <main className="pt-16 sm:pt-20">
        <MembershipSection />
      </main>
      <Footer />
    </>
  );
}
