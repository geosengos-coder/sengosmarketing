import {
  HeuristicGenerator,
  resolveBusinessDNA,
  type BusinessInput,
  type BusinessSignals,
  type DNAEvent,
  type ResolveOptions,
} from "@operatoros/dna";
import { getLLMProvider } from "./provider";
import { analyzeToSignals } from "./dna/analyzer";
import { collectSources } from "./dna/sources";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the real Business DNA generation and yields staged events. The fetch and
 * analysis stages reflect real work (variable latency); the subsequent stages
 * reveal REAL data from the resolved DNA, paced for comprehension. No fake
 * progress — every event's content is derived from the actual result.
 *
 * The heuristic and OpenAI paths emit the identical event shape, so the UI is
 * provider-agnostic.
 */
export async function* streamBusinessDNA(
  input: BusinessInput,
  options: ResolveOptions,
): AsyncGenerator<DNAEvent> {
  try {
    yield { stage: "started", label: "Waking up…", progress: 0.02, patch: { focus: "core" } };
    await wait(300);

    yield {
      stage: "fetching_site",
      label: input.websiteUrl ? "Reading your website…" : "Reviewing what you told me…",
      progress: 0.1,
      patch: { focus: "website" },
    };
    const { sources, websiteFetched } = await collectSources(input);
    yield {
      stage: "site_read",
      label: websiteFetched ? "Website read" : "Building from your details",
      progress: 0.22,
      patch: { focus: "website" },
    };

    yield {
      stage: "analyzing",
      label: "Understanding your business…",
      progress: 0.32,
      patch: { focus: "core" },
    };
    const provider = getLLMProvider();
    let signals: BusinessSignals;
    try {
      signals = provider
        ? await analyzeToSignals(provider, input, sources)
        : await new HeuristicGenerator().analyze(input);
    } catch {
      signals = await new HeuristicGenerator().analyze(input);
    }
    const dna = resolveBusinessDNA(signals, options);
    const b = dna.business;
    const emp = dna.employees[0];

    await wait(450);
    yield {
      stage: "services_identified",
      label: "Services identified",
      progress: 0.45,
      patch: {
        focus: "website",
        headline: `${b.knowledge.services.length} services`,
        items: b.knowledge.services.map((s) => s.name).slice(0, 6),
      },
    };
    await wait(700);
    yield {
      stage: "customers_understood",
      label: "Customer profile understood",
      progress: 0.56,
      patch: { focus: "crm", headline: b.industryBehavior.commonIntents.slice(0, 3).join(" · ") },
    };
    await wait(700);
    yield {
      stage: "voice_recognized",
      label: "Brand voice recognized",
      progress: 0.68,
      patch: { focus: "phone", headline: b.brandVoice.tone.join(", ") },
    };
    await wait(700);
    yield {
      stage: "scheduling_learned",
      label: "Scheduling learned",
      progress: 0.79,
      patch: {
        focus: "calendar",
        headline: `${b.scheduling.appointmentTypes.length} appointment types`,
        items: b.scheduling.appointmentTypes.map((a) => a.name).slice(0, 6),
      },
    };
    await wait(700);
    yield {
      stage: "personality_formed",
      label: "Receptionist personality formed",
      progress: 0.88,
      patch: { focus: "core", headline: emp?.personality.archetype },
    };
    await wait(550);
    yield {
      stage: "greeting_ready",
      label: "Greeting ready",
      progress: 0.95,
      patch: { focus: "sms", headline: emp?.communication.greeting },
    };
    await wait(450);
    yield {
      stage: "complete",
      label: "Business DNA complete",
      progress: 1,
      confidence: dna.meta.confidence,
      dna,
    };
  } catch (err) {
    yield {
      stage: "error",
      label: "Something interrupted the analysis",
      progress: 1,
      error: String(err),
    };
  }
}
