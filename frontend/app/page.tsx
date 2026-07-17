import { Journey } from "@/experience/journey/Journey";
import { DnaExperience } from "@/experience/dna/DnaExperience";
import { Industries } from "@/experience/industries/Industries";
import { Features } from "@/experience/features/Features";
import { RoiCalculator } from "@/experience/roi/RoiCalculator";
import { Pricing } from "@/experience/pricing/Pricing";
import { Testimonials } from "@/experience/testimonials/Testimonials";
import { BookingCta } from "@/experience/cta/BookingCta";
import { Footer } from "@/experience/shared/Footer";

/**
 * The OperatorOS home — one continuous cinematic journey into a full landing page.
 * Movement 1–2: the Business Brain assembles from real systems and comes online.
 * Movement 3: the visitor enters their business and watches its Business DNA form
 * live, then talks to the AI employee it just built. The rest of the page carries
 * that moment into a normal marketing site: industries, features, ROI, pricing,
 * outcomes, and a closing CTA.
 */
export default function HomePage() {
  return (
    <main>
      <Journey />
      <DnaExperience />
      <Industries />
      <Features />
      <RoiCalculator />
      <Pricing />
      <Testimonials />
      <BookingCta />
      <Footer />
    </main>
  );
}
