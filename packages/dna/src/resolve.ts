import { BusinessDNASchema, type BusinessDNA, type EmployeeRole } from "./schema";
import { industryTemplate, type IndustryTemplate } from "./industries";
import { roleTemplate } from "./roles";
import type { BusinessSignals } from "./generate";

/**
 * The resolution engine: IndustryTemplate ⊕ BusinessSignals ⊕ RoleTemplate → a
 * validated Business DNA. Pure and deterministic, so it is trivially testable and
 * safe to run for thousands of businesses.
 */
export interface ResolveOptions {
  businessId: string;
  /** Which AI Employees to define. Defaults to a receptionist. */
  roles?: EmployeeRole[];
  source?: "analyzed" | "manual" | "template" | "hybrid";
}

const unique = (xs: string[]) => [...new Set(xs)];

/**
 * Coerce visitor-entered website text into a valid URL. Most people type a bare
 * domain ("acme.com"), which would fail the DNA's `url()` validation and abort the
 * whole generation — so we prepend a protocol and, if it still can't parse, drop
 * it rather than let one soft field break an otherwise-good Business DNA.
 */
function normalizeWebsite(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return undefined;
  }
}

function buildEmployee(
  role: EmployeeRole,
  signals: BusinessSignals,
  ind: IndustryTemplate,
  brandTone: string[],
  brandFormality: number,
  hipaa: boolean,
) {
  const rt = roleTemplate(role);
  const greeting = `Thanks for calling ${signals.displayName}, this is ${rt.defaultName} — how can I help?`;

  const triggers = [...rt.escalation.triggers];
  if (hipaa && !triggers.some((t) => t.when === "compliance_sensitive")) {
    triggers.push({ when: "compliance_sensitive", action: "transfer_human" });
  }

  return {
    role,
    name: rt.defaultName,
    goal: rt.goal,
    personality: rt.personality,
    communication: {
      ...rt.communication,
      tone: unique([...brandTone, ...rt.communication.tone]),
      formality: (brandFormality + rt.communication.formality) / 2,
      greeting,
    },
    tools: rt.tools,
    escalation: { ...rt.escalation, triggers },
    customerExperience: rt.customerExperience,
    successMetrics: rt.successMetrics,
  };
}

export function resolveBusinessDNA(signals: BusinessSignals, opts: ResolveOptions): BusinessDNA {
  const industry = signals.industry;
  const ind = industryTemplate(industry);
  const roles = opts.roles?.length ? opts.roles : (["receptionist"] as EmployeeRole[]);
  const hipaa = ind.compliance.includes("HIPAA");

  const business = {
    identity: {
      displayName: signals.displayName,
      industry,
      tagline: signals.tagline,
      description: signals.description,
      valueProps: signals.valueProps,
      website: normalizeWebsite(signals.website),
      city: signals.city,
    },
    knowledge: {
      services: signals.services.map((s) => ({
        name: s.name,
        description: s.description,
        pricingModel: "quote" as const,
      })),
      faqs: signals.faqs,
      facts: signals.facts,
      coverage: signals.confidence,
    },
    policies: {
      prohibitedTopics: ind.prohibitedTopics,
      compliance: ind.compliance,
      disclaimers: industry === "legal" ? ["This is not legal advice."] : [],
      cannotPromise: ind.prohibitedTopics,
    },
    scheduling: {
      appointmentTypes: ind.defaultAppointmentTypes.map((a) => ({ ...a })),
      reminders: [{ channel: "sms" as const, offsetHours: 24 }],
    },
    integrations: [],
    industryBehavior: {
      template: industry,
      vocabulary: ind.vocabulary,
      commonIntents: ind.commonIntents,
      rules: ind.rules,
    },
    brandVoice: { tone: ind.brandTone, formality: ind.formality },
  };

  const employees = roles.map((role) =>
    buildEmployee(role, signals, ind, ind.brandTone, ind.formality, hipaa),
  );

  return BusinessDNASchema.parse({
    schemaVersion: "1.0",
    businessId: opts.businessId,
    meta: {
      generatedAt: new Date().toISOString(),
      source: opts.source ?? "hybrid",
      confidence: signals.confidence,
    },
    business,
    employees,
  });
}
