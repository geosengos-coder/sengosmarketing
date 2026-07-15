/**
 * @operatoros/voice — the VoiceProvider abstraction and the "Talk to Ava" demo's
 * server-side support: DNA→agent mapping, tool execution, session state, and the
 * live UI event bus (ADR-0017). Concrete providers (Retell today) are isolated
 * behind `VoiceProvider`.
 */
export * from "./types";
export * from "./tools";
export * from "./mapping";
export * from "./executor";
export * from "./provider";
export * from "./retell-provider";
export {
  createSession,
  getSession,
  endSession,
  recordAppointment,
  setProviderRef,
  verifyWebhookSecret,
  activeSessionCount,
  type VoiceSession,
  type BookedAppointment,
} from "./session-store";
export { publishVoiceEvent, subscribeVoiceEvents, type VoiceUiEvent } from "./events";
