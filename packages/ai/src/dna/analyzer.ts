import {
  BusinessSignalsSchema,
  IndustrySchema,
  type BusinessInput,
  type BusinessSignals,
} from "@operatoros/dna";
import type { LLMProvider } from "../provider/llm";
import type { CollectedSource } from "./sources";

const INDUSTRIES = IndustrySchema.options.join(", ");
const MAX_CORPUS_CHARS = 24_000;

const SYSTEM = `You are Sengos Digital Systems's Business DNA analyst. From the supplied evidence about a business, produce a precise, grounded understanding of it.

Output ONLY a JSON object with exactly these fields:
{
  "displayName": string,
  "industry": one of [${INDUSTRIES}] (choose the closest),
  "city": string (optional),
  "tagline": string (optional),
  "description": string (2-3 sentences, optional),
  "valueProps": string[] (what sets them apart),
  "services": [{ "name": string, "description": string (optional) }],
  "faqs": [{ "q": string, "a": string }],
  "facts": string[] (must-know facts the AI should always have right),
  "analysis": {
    "strengths": string[],
    "weaknesses": string[],
    "seoOpportunities": string[],
    "conversionOpportunities": string[]
  },
  "confidence": number between 0 and 1
}

Rules:
- Ground every field in the evidence. Do NOT invent prices, hours, or facts that are not supported.
- Keep each array concise (max 6 items) and specific to this business.
- "confidence" reflects how much real evidence you had (a fetched website ≫ just a name).`;

/**
 * The analysis step — the one LLM call that turns collected evidence into validated
 * BusinessSignals. Output is parsed against the schema, so a malformed model
 * response fails loudly (and the generator falls back) rather than corrupting the DNA.
 */
export async function analyzeToSignals(
  provider: LLMProvider,
  input: BusinessInput,
  sources: CollectedSource[],
): Promise<BusinessSignals> {
  const corpus = sources
    .map((s) => `## ${s.kind}${s.label ? ` — ${s.label}` : ""}\n${s.text}`)
    .join("\n\n")
    .slice(0, MAX_CORPUS_CHARS);

  const user = `Business: ${input.businessName}\n${input.websiteUrl ? `Website: ${input.websiteUrl}\n` : ""}\nEVIDENCE:\n${corpus}`;

  const signals = await provider.generateStructured<BusinessSignals>({
    system: SYSTEM,
    user,
    schema: BusinessSignalsSchema,
    schemaName: "BusinessSignals",
    maxOutputTokens: 1800,
  });

  // Carry through the caller's ground-truth fields if the model dropped them.
  return {
    ...signals,
    website: signals.website ?? input.websiteUrl,
    city: signals.city ?? input.city,
  };
}
