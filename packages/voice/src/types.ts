import type { BusinessDNA, EmployeeRole } from "@operatoros/dna";

/**
 * The VoiceProvider abstraction (ADR-0002, ADR-0007, amended by ADR-0017). Every
 * concrete voice backend — Retell today, a direct OpenAI Realtime + ElevenLabs
 * pipeline tomorrow — implements this and nothing above it (the DNA-to-behavior
 * mapping, tool execution, and UI) ever imports a vendor SDK.
 */

export interface CreateSessionInput {
  /** The complete Business DNA generated for this visitor — the only knowledge source. */
  dna: BusinessDNA;
  role: EmployeeRole;
  /** Absolute base URL the provider must call back to execute tools (e.g. https://yourapp.com). */
  publicBaseUrl: string;
}

export interface VoiceSessionHandle {
  /** Our internal session id — correlates the call, tool webhook, and SSE updates. */
  sessionId: string;
  /** Provider identifier, e.g. "retell". */
  provider: string;
  /** Client-side connection info. Shape is provider-specific but always JSON-safe. */
  connection: Record<string, unknown>;
  expiresAt: string;
}

export interface ToolCallRequest {
  sessionId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolCallResult {
  /** Spoken back to the caller by the agent — keep it short and confirmable. */
  result: string;
  /** Structured data for the UI (e.g. the booked appointment) — never spoken. */
  uiEvent?: { type: string; data: Record<string, unknown> };
}

export interface VoiceProvider {
  readonly name: string;
  createSession(input: CreateSessionInput): Promise<VoiceSessionHandle>;
  /** Best-effort; providers may no-op if the session already expired server-side. */
  endSession(sessionId: string): Promise<void>;
}
