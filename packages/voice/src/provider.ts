import { RetellVoiceProvider } from "./retell-provider";
import type { VoiceProvider } from "./types";

/**
 * Resolves the active VoiceProvider from the environment — mirrors
 * `getLLMProvider` in @operatoros/ai. Returns null when unconfigured so the caller
 * can show an honest "voice engine not connected" state rather than a fake call
 * (ADR-0017: no simulated conversation for this centerpiece).
 */
export function getVoiceProvider(env: NodeJS.ProcessEnv = process.env): VoiceProvider | null {
  const apiKey = env.RETELL_API_KEY;
  if (!apiKey) return null;
  return new RetellVoiceProvider({
    apiKey,
    voiceId: env.RETELL_DEFAULT_VOICE_ID || "11labs-Cimo",
    model: env.RETELL_LLM_MODEL || "gpt-4o-mini",
  });
}
