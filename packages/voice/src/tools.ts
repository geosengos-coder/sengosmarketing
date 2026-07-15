import type { ToolKey } from "@operatoros/dna";

/**
 * The demo-scoped tool surface. Real ToolKeys exist for the full platform (see
 * @operatoros/dna schema); v1 of the live voice experience implements SERVER
 * EXECUTION for this subset only — enough to prove "it answers, it books, the UI
 * updates" end to end. Only tools BOTH allow-listed by the DNA and present here are
 * ever registered with the voice provider.
 */
export const SUPPORTED_TOOL_KEYS: ToolKey[] = [
  "check_availability",
  "book_appointment",
  "lookup_contact",
  "take_message",
];

export interface ToolDefinition {
  key: ToolKey;
  name: string;
  description: string;
  /** JSON Schema for the tool's arguments (provider-agnostic shape). */
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required: string[];
  };
}

function buildToolDefinition(key: ToolKey, appointmentTypeNames: string[]): ToolDefinition {
  switch (key) {
    case "check_availability":
      return {
        key,
        name: "check_availability",
        description: "Check whether a given appointment type has openings on or near a requested date.",
        parameters: {
          type: "object",
          properties: {
            appointmentType: {
              type: "string",
              description: "Which service/appointment type",
              enum: appointmentTypeNames.length ? appointmentTypeNames : undefined,
            },
            preferredDate: { type: "string", description: "The date or day the caller wants, in their own words" },
          },
          required: ["appointmentType"],
        },
      };
    case "book_appointment":
      return {
        key,
        name: "book_appointment",
        description: "Book a real appointment for the caller once they've confirmed a time.",
        parameters: {
          type: "object",
          properties: {
            customerName: { type: "string", description: "The caller's name" },
            phone: { type: "string", description: "The caller's phone number, if given" },
            appointmentType: {
              type: "string",
              description: "Which service/appointment type",
              enum: appointmentTypeNames.length ? appointmentTypeNames : undefined,
            },
            preferredTime: { type: "string", description: "The day/time the caller agreed to, in their own words" },
            notes: { type: "string", description: "Anything else relevant to the visit" },
          },
          required: ["customerName", "appointmentType", "preferredTime"],
        },
      };
    case "lookup_contact":
      return {
        key,
        name: "lookup_contact",
        description: "Look up whether this caller is an existing customer by phone number.",
        parameters: {
          type: "object",
          properties: { phone: { type: "string", description: "The caller's phone number" } },
          required: ["phone"],
        },
      };
    case "take_message":
      return {
        key,
        name: "take_message",
        description: "Take a message when you cannot help directly or the caller asks for a callback.",
        parameters: {
          type: "object",
          properties: {
            customerName: { type: "string", description: "The caller's name" },
            phone: { type: "string", description: "A callback number" },
            message: { type: "string", description: "What the caller needs" },
          },
          required: ["customerName", "message"],
        },
      };
    default:
      // Exhaustiveness guard: adding a ToolKey to SUPPORTED_TOOL_KEYS without a case here is a type error.
      throw new Error(`No tool definition for supported key "${key}"`);
  }
}

/** Builds the concrete, callable tool set for a session: DNA allow-list ∩ what we can execute. */
export function buildToolDefinitions(
  allowlist: ToolKey[],
  appointmentTypeNames: string[],
): ToolDefinition[] {
  return allowlist
    .filter((key): key is ToolKey => SUPPORTED_TOOL_KEYS.includes(key))
    .map((key) => buildToolDefinition(key, appointmentTypeNames));
}
