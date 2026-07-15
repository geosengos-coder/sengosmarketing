import type { BusinessDNA } from "@operatoros/dna";
import { publishVoiceEvent } from "./events";
import { getSession, recordAppointment, type BookedAppointment } from "./session-store";
import type { ToolCallResult } from "./types";

/**
 * Executes a tool call against a session's Business DNA — the demo's "the AI does
 * things" surface (ADR-0017). This synthesizes a real-feeling sample booking
 * (no live calendar integration exists for anonymous marketing-site visitors); it
 * is intentionally labeled a *sample* appointment, never presented as a booking
 * against a real business's actual calendar.
 */

const SLOT_TIMES = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

function pickSlot(seed: string): { day: string; time: string } {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const time = SLOT_TIMES[hash % SLOT_TIMES.length] ?? "10:00 AM";
  const day = hash % 3 === 0 ? "tomorrow" : "Thursday";
  return { day, time };
}

function matchAppointmentType(dna: BusinessDNA, requested?: string) {
  const types = dna.business.scheduling.appointmentTypes;
  if (!types.length) return { name: requested || "Appointment", durationMinutes: 30 };
  if (!requested) return types[0]!;
  const lower = requested.toLowerCase();
  return types.find((t) => t.name.toLowerCase().includes(lower) || lower.includes(t.name.toLowerCase())) ?? types[0]!;
}

export async function executeTool(
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const session = getSession(sessionId);
  if (!session) {
    return { result: "I'm sorry, this session has ended. Could we start over?" };
  }
  const dna = session.dna;

  switch (toolName) {
    case "check_availability": {
      const type = matchAppointmentType(dna, String(args.appointmentType ?? ""));
      const slot = pickSlot(`${sessionId}:${type.name}:${args.preferredDate ?? ""}`);
      return {
        result: `We have an opening for ${type.name} on ${slot.day} at ${slot.time}.`,
      };
    }

    case "book_appointment": {
      const type = matchAppointmentType(dna, String(args.appointmentType ?? ""));
      const customerName = String(args.customerName ?? "there").trim() || "there";
      const slot = pickSlot(`${sessionId}:${customerName}:${type.name}`);
      const appointment: BookedAppointment = {
        id: `apt_${Math.random().toString(36).slice(2, 10)}`,
        customerName,
        phone: args.phone ? String(args.phone) : undefined,
        appointmentType: type.name,
        slotLabel: `${slot.day} at ${slot.time}`,
        notes: args.notes ? String(args.notes) : undefined,
        createdAt: new Date().toISOString(),
      };
      recordAppointment(sessionId, appointment);
      publishVoiceEvent(sessionId, {
        type: "appointment_booked",
        data: { ...appointment, businessName: dna.business.identity.displayName },
      });
      return {
        result: `You're booked for ${type.name} ${slot.day} at ${slot.time}, ${customerName}. We'll send a confirmation.`,
        uiEvent: { type: "appointment_booked", data: { ...appointment } },
      };
    }

    case "lookup_contact": {
      // No real CRM for anonymous demo visitors — always a clean "new customer" answer.
      publishVoiceEvent(sessionId, { type: "crm_lookup", data: { phone: String(args.phone ?? "") } });
      return { result: "I don't see an existing record for that number — I can add you as a new customer." };
    }

    case "take_message": {
      publishVoiceEvent(sessionId, {
        type: "message_taken",
        data: { customerName: args.customerName, message: args.message },
      });
      return { result: "Got it — I've taken your message and someone will follow up." };
    }

    default:
      return { result: "I can't do that yet, but I can take a message." };
  }
}
