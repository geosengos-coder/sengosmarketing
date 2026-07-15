import type { BusinessDNA } from "./schema";

/**
 * The streamed events a Business DNA generation emits. The UI consumes ONLY these
 * and never knows whether a heuristic or OpenAI produced them (ADR-0016). Every
 * event carries REAL discovered data — there is no fake progress.
 */
export type DNAStage =
  | "started"
  | "fetching_site"
  | "site_read"
  | "analyzing"
  | "services_identified"
  | "customers_understood"
  | "voice_recognized"
  | "scheduling_learned"
  | "personality_formed"
  | "greeting_ready"
  | "complete"
  | "error";

export interface DNAInsightPatch {
  /** Brain node id to bring into focus as this insight lands. */
  focus?: string;
  /** A short, real headline (e.g. the recognized tone, the archetype). */
  headline?: string;
  /** Concrete discovered items (service names, appointment types). */
  items?: string[];
}

export interface DNAEvent {
  stage: DNAStage;
  label: string;
  /** 0–1, for the brain's assembly. */
  progress: number;
  patch?: DNAInsightPatch;
  confidence?: number;
  /** Present only on `complete`. */
  dna?: BusinessDNA;
  error?: string;
}
