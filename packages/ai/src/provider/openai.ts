import OpenAI from "openai";
import type { LLMProvider, StructuredRequest } from "./llm";

export interface OpenAIProviderOptions {
  apiKey: string;
  model?: string;
}

/**
 * OpenAI implementation of the LLM seam. Uses JSON-object responses and validates
 * the result against the caller's zod schema (so the vendor's output can never
 * silently violate our contract). One retry on a parse/validation miss.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(opts: OpenAIProviderOptions) {
    this.client = new OpenAI({ apiKey: opts.apiKey });
    this.model = opts.model ?? "gpt-4o-mini";
  }

  async generateStructured<T>(request: StructuredRequest<T>): Promise<T> {
    const call = async (nudge?: string): Promise<T> => {
      const res = await this.client.chat.completions.create({
        model: this.model,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxOutputTokens ?? 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: nudge ? `${request.user}\n\n${nudge}` : request.user },
        ],
      });
      const raw = res.choices[0]?.message?.content ?? "{}";
      return request.schema.parse(JSON.parse(raw));
    };

    try {
      return await call();
    } catch {
      return call("Return ONLY valid JSON that matches the required shape exactly.");
    }
  }
}
