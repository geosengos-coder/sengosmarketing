import { randomUUID } from "node:crypto";
import { buildAgentBlueprint } from "./mapping";
import { createSession, endSession as endSessionStore, setProviderRef } from "./session-store";
import type { CreateSessionInput, VoiceProvider, VoiceSessionHandle } from "./types";

/**
 * Retell as the concrete VoiceProvider (ADR-0017). This is the ONLY file in the
 * platform that knows Retell's wire format — everything above it (DNA mapping,
 * tool execution, UI) is provider-agnostic and swaps to a different backend by
 * writing a new class here, not by touching callers.
 *
 * Endpoints used (api.retellai.com): POST /create-retell-llm, POST /create-agent,
 * POST /v2/create-web-call. Custom function tools are declared on the LLM as
 * `{ type: "custom", name, description, parameters, url }`; Retell calls that URL
 * mid-conversation and speaks the JSON `result` it gets back. Verify field names
 * against Retell's current API reference before pointing this at a live account —
 * managed-platform APIs evolve, and this was implemented from established,
 * long-standing patterns rather than a fresh docs fetch.
 */

const RETELL_BASE = "https://api.retellai.com";

export interface RetellConfig {
  apiKey: string;
  voiceId: string;
  model: string;
}

export class RetellVoiceProvider implements VoiceProvider {
  readonly name = "retell";
  constructor(private readonly config: RetellConfig) {}

  async createSession(input: CreateSessionInput): Promise<VoiceSessionHandle> {
    const sessionId = randomUUID();
    const webhookSecret = randomUUID();
    const blueprint = buildAgentBlueprint(input.dna, input.role);
    const toolWebhookUrl = `${input.publicBaseUrl}/api/voice/tools?session=${sessionId}&secret=${webhookSecret}`;

    const llm = await this.call<{ llm_id: string }>("/create-retell-llm", {
      general_prompt: blueprint.systemPrompt,
      begin_message: blueprint.greeting,
      model: this.config.model,
      general_tools: blueprint.tools.map((t) => ({
        type: "custom",
        name: t.name,
        description: t.description,
        parameters: t.parameters,
        url: toolWebhookUrl,
        speak_during_execution: true,
        speak_after_execution: true,
      })),
    });

    const agent = await this.call<{ agent_id: string }>("/create-agent", {
      agent_name: blueprint.agentName,
      voice_id: this.config.voiceId,
      response_engine: { type: "retell-llm", llm_id: llm.llm_id },
      language: "en-US",
      max_call_duration_ms: blueprint.maxCallDurationMs,
    });

    const webCall = await this.call<{ call_id: string; access_token: string }>("/v2/create-web-call", {
      agent_id: agent.agent_id,
      metadata: { sessionId },
    });

    const record = createSession({
      sessionId,
      dna: input.dna,
      role: input.role,
      provider: this.name,
      webhookSecret,
    });
    setProviderRef(sessionId, "llmId", llm.llm_id);
    setProviderRef(sessionId, "agentId", agent.agent_id);
    setProviderRef(sessionId, "callId", webCall.call_id);

    return {
      sessionId,
      provider: this.name,
      connection: { accessToken: webCall.access_token, callId: webCall.call_id },
      expiresAt: new Date(record.expiresAt).toISOString(),
    };
  }

  async endSession(sessionId: string): Promise<void> {
    endSessionStore(sessionId);
  }

  private async call<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${RETELL_BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Retell ${path} failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<T>;
  }
}
