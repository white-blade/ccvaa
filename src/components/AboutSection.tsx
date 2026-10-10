import { BoardSection } from "@/components/BoardSection";
import { PurposesSection } from "@/components/PurposesSection";
import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { aboutContent, organization } from "@/lib/site";

export function AboutSection() {
  return (
    <Section id="about" tone="light" eyebrow={aboutContent.eyebrow} title={aboutContent.title} glow>
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="space-y-5 text-base leading-relaxed text-ocean-700 sm:text-lg">
          {aboutContent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>

        <Reveal delay={150}>
          <figure className="relative overflow-hidden rounded-3xl bg-ocean-950 p-8 text-white shadow-2xl shadow-ocean-950/20 sm:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral/30 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="block font-display text-7xl leading-none text-coral"
            >
              “
            </span>
            <blockquote className="relative -mt-4 font-display text-2xl italic leading-snug sm:text-3xl">
              {aboutContent.quote}
            </blockquote>
            <figcaption className="relative mt-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ocean-200">
              <span aria-hidden="true" className="h-px w-10 bg-coral" />
              {aboutContent.quoteAttribution}
            </figcaption>
            <p className="relative mt-6 border-t border-white/10 pt-6 text-sm text-ocean-200">
              {organization.registrationNote}
            </p>
          </figure>
        </Reveal>
      </div>

      <BoardSection />
      <PurposesSection />
    </Section>
  );
}
