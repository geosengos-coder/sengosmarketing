import type { z } from "zod";

/**
 * The LLM provider seam (ADR-0002). Everything the platform does with a language
 * model goes through this interface, so providers are swappable and the rest of
 * the code never imports a vendor SDK.
 */
export interface StructuredRequest<T> {
  system: string;
  user: string;
  /** The output is parsed and validated against this schema. */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  schemaName: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  readonly name: string;
  /** Returns JSON validated against `schema`. Throws on transport or validation failure. */
  generateStructured<T>(request: StructuredRequest<T>): Promise<T>;
}
