import { Journey } from "@/experience/journey/Journey";
import { DnaExperience } from "@/experience/dna/DnaExperience";

/**
 * The OperatorOS home — one continuous cinematic journey.
 * Movement 1–2: the Business Brain assembles from real systems and comes online.
 * Movement 3: the visitor enters their business and watches its Business DNA form
 * live — the moment they believe our AI understands their business.
 */
export default function HomePage() {
  return (
    <main>
      <Journey />
      <DnaExperience />
    </main>
  );
}
