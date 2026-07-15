/**
 * In-memory pub-sub so a tool execution (server-side, triggered by the voice
 * provider) can push a live UI update to the visitor's browser (via SSE) — e.g.
 * "appointment booked" the instant Ava confirms it mid-call. Single-process, same
 * scope/limitation as the session store.
 */

export interface VoiceUiEvent {
  type: string;
  data: Record<string, unknown>;
  at: string;
}

const subscribers = new Map<string, Set<(event: VoiceUiEvent) => void>>();

export function publishVoiceEvent(sessionId: string, event: Omit<VoiceUiEvent, "at">): void {
  const subs = subscribers.get(sessionId);
  if (!subs || subs.size === 0) return;
  const full: VoiceUiEvent = { ...event, at: new Date().toISOString() };
  for (const fn of subs) fn(full);
}

export function subscribeVoiceEvents(sessionId: string, fn: (event: VoiceUiEvent) => void): () => void {
  let set = subscribers.get(sessionId);
  if (!set) {
    set = new Set();
    subscribers.set(sessionId, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) subscribers.delete(sessionId);
  };
}
