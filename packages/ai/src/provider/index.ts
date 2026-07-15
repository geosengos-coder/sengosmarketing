import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./llm";

export type { LLMProvider, StructuredRequest } from "./llm";
export { OpenAIProvider } from "./openai";

/**
 * Resolves the active LLM provider from the environment. Returns null when no key
 * is configured, so callers degrade to deterministic behavior instead of failing.
 */
export function getLLMProvider(env: NodeJS.ProcessEnv = process.env): LLMProvider | null {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAIProvider({ apiKey, model: env.OPENAI_DNA_MODEL });
}
