import { describe, expect, it } from "vitest";
import { createBusinessDNAGenerator, generateBusinessDNA, getLLMProvider } from "../index";

describe("BusinessDNAGenerator", () => {
  it("has no provider without a key", () => {
    expect(getLLMProvider({} as NodeJS.ProcessEnv)).toBeNull();
  });

  it("still produces a valid Business DNA end-to-end (fallback path)", async () => {
    // With no key (or a failed LLM call), the generator degrades to the heuristic,
    // so the platform always yields a usable DNA.
    const gen = createBusinessDNAGenerator();
    const signals = await gen.analyze({
      businessName: "Bright Smile Dental",
      industry: "dental",
      city: "Austin",
    });
    expect(signals.displayName).toBe("Bright Smile Dental");
    expect(signals.industry).toBe("dental");

    const dna = await generateBusinessDNA(
      { businessName: "Ace Plumbing", industry: "home_services" },
      { businessId: "org_x", roles: ["receptionist"] },
    );
    expect(dna.business.identity.displayName).toBe("Ace Plumbing");
    expect(dna.employees[0]?.role).toBe("receptionist");
  });
});
