import { describe, expect, it } from "vitest";
import { BusinessDNASchema, HeuristicGenerator, resolveBusinessDNA, toRuntime } from "./index";

describe("Business DNA engine", () => {
  it("generates → resolves → validates a DNA, applying industry behavior", async () => {
    const signals = await new HeuristicGenerator().analyze({
      businessName: "Bright Smile Dental",
      industry: "dental",
      city: "Austin",
      websiteUrl: "https://brightsmile.example",
    });
    const dna = resolveBusinessDNA(signals, { businessId: "org_test", roles: ["receptionist"] });

    expect(() => BusinessDNASchema.parse(dna)).not.toThrow();
    expect(dna.business.identity.industry).toBe("dental");
    // Dental brings HIPAA + a compliance escalation trigger, with no extra config.
    expect(dna.business.policies.compliance).toContain("HIPAA");
    const receptionist = dna.employees.find((e) => e.role === "receptionist");
    expect(receptionist?.escalation.triggers.some((t) => t.when === "compliance_sensitive")).toBe(
      true,
    );
    // Industry default appointment types are seeded.
    expect(dna.business.scheduling.appointmentTypes.length).toBeGreaterThan(0);
  });

  it("supports multiple AI Employees and yields a runtime contract (not just a prompt)", async () => {
    const signals = await new HeuristicGenerator().analyze({
      businessName: "Ace Plumbing",
      industry: "home_services",
    });
    const dna = resolveBusinessDNA(signals, {
      businessId: "org_2",
      roles: ["receptionist", "sales_agent"],
    });

    expect(dna.employees.map((e) => e.role)).toEqual(["receptionist", "sales_agent"]);

    const receptionist = toRuntime(dna, "receptionist");
    expect(receptionist.toolAllowlist).toContain("book_appointment");
    expect(receptionist.systemPrompt.length).toBeGreaterThan(100);
    expect(receptionist.escalation.fallbackAction).toBeTruthy();
    expect(receptionist.metrics.length).toBeGreaterThan(0);

    const sales = toRuntime(dna, "sales_agent");
    expect(sales.toolAllowlist).toContain("qualify_lead");
    expect(sales.name).not.toBe(receptionist.name);
  });
});
