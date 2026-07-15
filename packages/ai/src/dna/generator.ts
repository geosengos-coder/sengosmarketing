import {
  HeuristicGenerator,
  resolveBusinessDNA,
  type BusinessDNA,
  type BusinessDNAGenerator,
  type BusinessInput,
  type BusinessSignals,
  type ResolveOptions,
} from "@operatoros/dna";
import { logger } from "@operatoros/core";
import { getLLMProvider, type LLMProvider } from "../provider";
import { analyzeToSignals } from "./analyzer";
import { collectSources } from "./sources";

/**
 * The real, OpenAI-backed Business DNA generator: collect evidence from every
 * source → analyze with the LLM → validated BusinessSignals. Implements the same
 * `BusinessDNAGenerator` seam as the heuristic, and degrades to it on any failure
 * so the experience never breaks (ADR-0016).
 */
export class LLMBusinessDNAGenerator implements BusinessDNAGenerator {
  private readonly log = logger.child({ component: "dna-generator" });

  constructor(
    private readonly provider: LLMProvider,
    private readonly fallback: BusinessDNAGenerator = new HeuristicGenerator(),
  ) {}

  async analyze(input: BusinessInput): Promise<BusinessSignals> {
    try {
      const { sources, websiteFetched } = await collectSources(input);
      const signals = await analyzeToSignals(this.provider, input, sources);
      this.log.info("dna.analyzed", {
        business: input.businessName,
        websiteFetched,
        sources: sources.length,
        confidence: signals.confidence,
      });
      return signals;
    } catch (err) {
      this.log.warn("dna.analyze_failed_fallback", { error: String(err) });
      return this.fallback.analyze(input);
    }
  }
}

/**
 * The single entry point the platform uses: real when a key is configured,
 * deterministic heuristic otherwise. Callers never branch on provider availability.
 */
export function createBusinessDNAGenerator(): BusinessDNAGenerator {
  const provider = getLLMProvider();
  return provider ? new LLMBusinessDNAGenerator(provider) : new HeuristicGenerator();
}

/** Inputs → validated Business DNA in one call — the source of truth for AI Employees. */
export async function generateBusinessDNA(
  input: BusinessInput,
  options: ResolveOptions,
): Promise<BusinessDNA> {
  const signals = await createBusinessDNAGenerator().analyze(input);
  return resolveBusinessDNA(signals, options);
}
