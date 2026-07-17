import type { AvaCallStatus } from "./useAvaCall";

/**
 * The visual states the voice orb can render. Deliberately decoupled from the
 * Retell call status so the orb stays a pure, reusable presentational component:
 * anything that can produce an `OrbState` can drive it.
 */
export type OrbState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "ended"
  | "error";

/**
 * Derive the orb's visual state from the live call signals.
 *
 * During an active call we have three conversational phases:
 *  - speaking  — the agent's voice is playing (Retell talking events).
 *  - thinking  — the caller just finished (last transcript turn is theirs) and the
 *                agent hasn't started responding yet: the "processing" beat.
 *  - listening — otherwise: mic is open, waiting on / hearing the caller.
 */
export function toOrbState(
  status: AvaCallStatus,
  agentTalking: boolean,
  lastRole?: "agent" | "user",
): OrbState {
  switch (status) {
    case "connecting":
      return "connecting";
    case "unavailable":
    case "error":
      return "error";
    case "ended":
      return "ended";
    case "active":
      if (agentTalking) return "speaking";
      if (lastRole === "user") return "thinking";
      return "listening";
    case "idle":
    default:
      return "idle";
  }
}
