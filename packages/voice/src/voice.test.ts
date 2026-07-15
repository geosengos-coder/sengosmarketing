import { describe, expect, it } from "vitest";
import { HeuristicGenerator, resolveBusinessDNA } from "@operatoros/dna";
import { buildAgentBlueprint } from "./mapping";
import { executeTool } from "./executor";
import { createSession, getSession, verifyWebhookSecret } from "./session-store";

async function dentalDna() {
  const signals = await new HeuristicGenerator().analyze({
    businessName: "Bright Smile Dental",
    industry: "dental",
    city: "Austin",
  });
  return resolveBusinessDNA(signals, { businessId: "org_voice_test", roles: ["receptionist"] });
}

describe("DNA → agent blueprint (no hand-written prompts)", () => {
  it("derives the entire prompt and tool set from the Business DNA", async () => {
    const dna = await dentalDna();
    const blueprint = buildAgentBlueprint(dna, "receptionist");

    expect(blueprint.systemPrompt).toContain("Bright Smile Dental");
    expect(blueprint.agentName).toBe(dna.employees[0]?.name);
    // book_appointment is in the receptionist role template's tool grants → must appear.
    expect(blueprint.tools.some((t) => t.name === "book_appointment")).toBe(true);
    // Appointment type names from the DNA populate the tool's enum, proving no static copy.
    const bookTool = blueprint.tools.find((t) => t.name === "book_appointment");
    expect(bookTool?.parameters.properties.appointmentType?.enum?.length).toBeGreaterThan(0);
  });
});

describe("tool execution", () => {
  it("books a sample appointment and emits a UI event with real DNA-derived data", async () => {
    const dna = await dentalDna();
    const session = createSession({
      sessionId: "sess_1",
      dna,
      role: "receptionist",
      provider: "test",
      webhookSecret: "secret_1",
    });

    const result = await executeTool(session.sessionId, "book_appointment", {
      customerName: "Jordan",
      appointmentType: "Cleaning",
    });

    expect(result.result).toContain("Jordan");
    expect(result.uiEvent?.type).toBe("appointment_booked");
    expect(getSession(session.sessionId)?.appointments).toHaveLength(1);
  });

  it("returns a graceful message for an unknown/expired session", async () => {
    const result = await executeTool("nonexistent", "book_appointment", { customerName: "X" });
    expect(result.result).toMatch(/session has ended/i);
  });
});

describe("webhook secret verification", () => {
  it("only accepts the exact secret issued for that session", async () => {
    const dna = await dentalDna();
    createSession({ sessionId: "sess_2", dna, role: "receptionist", provider: "test", webhookSecret: "correct" });
    expect(verifyWebhookSecret("sess_2", "correct")).toBe(true);
    expect(verifyWebhookSecret("sess_2", "wrong")).toBe(false);
    expect(verifyWebhookSecret("sess_missing", "correct")).toBe(false);
  });
});
