import { z } from "zod";
import { IndustrySchema, type Industry } from "./schema";

/**
 * The generation seam: turn evidence about a business into validated
 * BusinessSignals, which `resolveBusinessDNA` composes into a Business DNA.
 * Provider-agnostic — a deterministic `HeuristicGenerator` ships here; the real
 * OpenAI-backed, multi-source generator lives in `@operatoros/ai` behind this same
 * interface (ADR-0016), so nothing downstream changes when it swaps in.
 */

/** A unit of evidence the generator can consume — extensible for future integrations. */
export const DNARawSourceSchema = z.object({
  kind: z.enum(["website", "document", "faq", "review", "metadata", "integration"]),
  label: z.string().optional(),
  text: z.string(),
});
export type DNARawSource = z.infer<typeof DNARawSourceSchema>;

export interface BusinessInput {
  businessName: string;
  websiteUrl?: string;
  industry?: Industry;
  city?: string;
  /** Documents, FAQs, reviews, integration exports — additional evidence. */
  sources?: DNARawSource[];
}

export const WebsiteAnalysisSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  seoOpportunities: z.array(z.string()).default([]),
  conversionOpportunities: z.array(z.string()).default([]),
});
export type WebsiteAnalysis = z.infer<typeof WebsiteAnalysisSchema>;

export const BusinessSignalsSchema = z.object({
  displayName: z.string(),
  industry: IndustrySchema,
  city: z.string().optional(),
  website: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  valueProps: z.array(z.string()).default([]),
  services: z.array(z.object({ name: z.string(), description: z.string().optional() })).default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  facts: z.array(z.string()).default([]),
  analysis: WebsiteAnalysisSchema,
  /** 0–1 confidence in these signals (LLM+site ≫ heuristic). */
  confidence: z.number().min(0).max(1),
});
export type BusinessSignals = z.infer<typeof BusinessSignalsSchema>;

export interface BusinessDNAGenerator {
  analyze(input: BusinessInput): Promise<BusinessSignals>;
}

const INDUSTRY_SERVICE_SEEDS: Partial<Record<Industry, string[]>> = {
  dental: ["Cleaning & exam", "Whitening", "Emergency visit", "Invisalign consult"],
  home_services: ["Diagnostic visit", "Repair", "Installation", "Maintenance plan"],
  beauty: ["Haircut & style", "Color", "Manicure", "Facial"],
  legal: ["Initial consultation", "Case review", "Document prep"],
  medical: ["New patient visit", "Follow-up", "Telehealth consult"],
  fitness: ["Intro session", "Personal training", "Membership tour"],
  restaurant: ["Reservation", "Private event inquiry", "Catering quote"],
  real_estate: ["Buyer consult", "Listing appointment", "Home valuation"],
  automotive: ["Diagnostic", "Oil change", "Repair estimate"],
  professional_services: ["Discovery call", "Proposal review", "Onboarding"],
  general: ["Consultation", "Service request", "Follow-up"],
};

/**
 * Deterministic, dependency-free signals from the inputs alone. No live fetch, no
 * LLM — a believable default that keeps the demo whole before keys exist and the
 * guaranteed fallback when the real generator fails.
 */
export class HeuristicGenerator implements BusinessDNAGenerator {
  async analyze(input: BusinessInput): Promise<BusinessSignals> {
    const industry = input.industry ?? "general";
    const name = input.businessName.trim() || "Your Business";
    const cityPart = input.city ? ` in ${input.city}` : "";
    const services = (INDUSTRY_SERVICE_SEEDS[industry] ?? INDUSTRY_SERVICE_SEEDS.general ?? []).map(
      (s) => ({ name: s }),
    );

    return {
      displayName: name,
      industry,
      city: input.city,
      website: input.websiteUrl,
      tagline: `${name} — ${industry.replace("_", " ")}${cityPart}`,
      description: `${name} is a ${industry.replace("_", " ")} business${cityPart}.`,
      valueProps: ["Trusted local service", "Fast response", "Clear pricing"],
      services,
      faqs: [],
      facts: [],
      analysis: {
        strengths: ["Clear service offering", "Established local presence"],
        weaknesses: [
          "No way to book or capture leads after hours",
          "Phone goes unanswered during busy periods",
        ],
        seoOpportunities: [
          `Rank for "${industry.replace("_", " ")}${cityPart}"`,
          "Add service + FAQ pages to capture long-tail search",
        ],
        conversionOpportunities: [
          "Add an always-on booking path",
          "Answer every call to stop losing new customers",
        ],
      },
      confidence: input.websiteUrl ? 0.45 : 0.3,
    };
  }
}
