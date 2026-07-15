import type { BusinessDNA, EmployeeRole } from "@operatoros/dna";

/**
 * Ephemeral, in-memory session state for the live voice demo (ADR-0017). This is
 * deliberately NOT the multi-tenant Postgres/RLS path — the homepage demo runs for
 * anonymous visitors against a Business DNA that may not correspond to a real
 * tenant, so nothing here touches `@operatoros/database`. Single-process only; a
 * production deployment with multiple instances would move this to Redis, which
 * is a documented follow-up, not a blocker for the demo.
 */

export interface BookedAppointment {
  id: string;
  customerName: string;
  phone?: string;
  appointmentType: string;
  slotLabel: string;
  notes?: string;
  createdAt: string;
}

export interface VoiceSession {
  sessionId: string;
  dna: BusinessDNA;
  role: EmployeeRole;
  provider: string;
  providerRefs: Record<string, string>;
  /** Embedded in the tool webhook URL so we can verify a call to /api/voice/tools belongs to this session. */
  webhookSecret: string;
  createdAt: number;
  expiresAt: number;
  appointments: BookedAppointment[];
}

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes — long enough for a demo call, short enough to bound memory.
const sessions = new Map<string, VoiceSession>();

function sweep() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (s.expiresAt < now) sessions.delete(id);
  }
}

export function createSession(params: {
  sessionId: string;
  dna: BusinessDNA;
  role: EmployeeRole;
  provider: string;
  webhookSecret: string;
}): VoiceSession {
  sweep();
  const now = Date.now();
  const session: VoiceSession = {
    ...params,
    providerRefs: {},
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    appointments: [],
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string): VoiceSession | undefined {
  sweep();
  return sessions.get(sessionId);
}

export function setProviderRef(sessionId: string, key: string, value: string): void {
  const s = sessions.get(sessionId);
  if (s) s.providerRefs[key] = value;
}

export function recordAppointment(sessionId: string, appointment: BookedAppointment): void {
  const s = sessions.get(sessionId);
  if (s) s.appointments.push(appointment);
}

export function endSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/** Confirms a tool-webhook request actually belongs to this session before executing anything. */
export function verifyWebhookSecret(sessionId: string, secret: string): boolean {
  const s = sessions.get(sessionId);
  return Boolean(s && secret && s.webhookSecret === secret);
}

/** Test/ops helper. */
export function activeSessionCount(): number {
  sweep();
  return sessions.size;
}
