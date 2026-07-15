/**
 * @operatoros/ai — the AI service layer. Houses the LLM provider seam (ADR-0002)
 * and the real, OpenAI-backed Business DNA generator (ADR-0015, ADR-0016).
 * Framework-free (ADR-0005): no Next.js, no React.
 */
export * from "./provider";
export * from "./dna/fetch";
export * from "./dna/sources";
export * from "./dna/analyzer";
export * from "./dna/generator";
export * from "./stream";
