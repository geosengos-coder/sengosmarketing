import { z } from "zod";

/**
 * Business DNA — the structured specification that defines how an AI Employee
 * behaves (ADR-0015). Not a prompt: a validated, versioned, layered document that
 * drives identity, knowledge, voice, personality, policies, scheduling, tool
 * permissions, escalation, industry behavior, integrations, CX, and metrics.
 *
 * Two layers: a shared BUSINESS layer + one or more EMPLOYEE blueprints, so one
 * business powers many AI Employees.
 */

export const SCHEMA_VERSION = "1.0" as const;

// ---------------------------------------------------------------- vocab

export const IndustrySchema = z.enum([
  "dental",
  "medical",
  "legal",
  "home_services",
  "hvac",
  "beauty",
  "med_spa",
  "restaurant",
  "real_estate",
  "fitness",
  "golf_course",
  "automotive",
  "professional_services",
  "general",
]);
export type Industry = z.infer<typeof IndustrySchema>;

export const EmployeeRoleSchema = z.enum([
  "receptionist",
  "scheduler",
  "sales_agent",
  "lead_qualifier",
  "support_agent",
  "website_experience",
]);
export type EmployeeRole = z.infer<typeof EmployeeRoleSchema>;

export const ChannelSchema = z.enum(["voice", "sms", "chat", "email"]);
export const ComplianceSchema = z.enum(["HIPAA", "PCI", "GDPR", "TCPA"]);
export type Compliance = z.infer<typeof ComplianceSchema>;

/** The platform tools an employee can be granted. Mirrors the Tool Registry. */
export const ToolKeySchema = z.enum([
  "check_availability",
  "book_appointment",
  "reschedule_appointment",
  "cancel_appointment",
  "lookup_contact",
  "create_contact",
  "create_task",
  "send_sms",
  "send_email",
  "take_message",
  "transfer_to_human",
  "quote_price",
  "take_payment",
  "qualify_lead",
]);
export type ToolKey = z.infer<typeof ToolKeySchema>;

export const MetricSchema = z.enum([
  "containment_rate",
  "booking_conversion",
  "csat",
  "response_time_sec",
  "lead_qualification_rate",
  "after_hours_capture",
  "first_call_resolution",
]);

// ---------------------------------------------------------------- shared building blocks

const HoursSchema = z.record(
  z.string(), // weekday
  z.object({ open: z.string(), close: z.string() }).nullable(), // null = closed
);

const ServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  pricingModel: z.enum(["fixed", "starting_at", "hourly", "quote", "free"]).default("quote"),
  price: z.number().optional(),
  durationMinutes: z.number().optional(),
});

const AppointmentTypeSchema = z.object({
  name: z.string(),
  durationMinutes: z.number().default(30),
  bufferMinutes: z.number().default(0),
  price: z.number().optional(),
  requiresDeposit: z.boolean().default(false),
});

// ---------------------------------------------------------------- BUSINESS layer (shared)

export const IdentitySchema = z.object({
  displayName: z.string(),
  legalName: z.string().optional(),
  industry: IndustrySchema,
  subIndustry: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  valueProps: z.array(z.string()).default([]),
  website: z.string().url().optional(),
  serviceArea: z.string().optional(),
  city: z.string().optional(),
  hours: HoursSchema.optional(),
  languages: z.array(z.string()).default(["en"]),
  timezone: z.string().default("America/New_York"),
});

export const KnowledgeModelSchema = z.object({
  services: z.array(ServiceSchema).default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  facts: z.array(z.string()).default([]),
  /** References to KnowledgeSource ids for retrieval-grounded answers. */
  sources: z.array(z.object({ type: z.string(), ref: z.string() })).default([]),
  /** 0–1 estimate of how completely the business is understood. */
  coverage: z.number().min(0).max(1).default(0),
});

export const PolicySchema = z.object({
  cancellation: z.string().optional(),
  refund: z.string().optional(),
  deposit: z.string().optional(),
  guarantees: z.array(z.string()).default([]),
  prohibitedTopics: z.array(z.string()).default([]),
  compliance: z.array(ComplianceSchema).default([]),
  disclaimers: z.array(z.string()).default([]),
  canPromise: z.array(z.string()).default([]),
  cannotPromise: z.array(z.string()).default([]),
});

export const SchedulingSchema = z.object({
  enabled: z.boolean().default(true),
  appointmentTypes: z.array(AppointmentTypeSchema).default([]),
  confirmation: z.enum(["immediate", "pending_review"]).default("immediate"),
  reminders: z
    .array(z.object({ channel: z.enum(["sms", "email"]), offsetHours: z.number() }))
    .default([]),
  minNoticeHours: z.number().default(2),
  reschedulePolicy: z.string().optional(),
});

export const IntegrationBindingSchema = z.object({
  provider: z.string(), // e.g. "google_calendar", "stripe", "crm"
  purpose: z.string(),
  capabilities: z.array(z.string()).default([]),
});

export const IndustryBehaviorSchema = z.object({
  template: IndustrySchema,
  vocabulary: z.array(z.string()).default([]),
  commonIntents: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
});

export const BrandVoiceSchema = z.object({
  tone: z.array(z.string()).default([]),
  formality: z.number().min(0).max(1).default(0.5),
  doPhrases: z.array(z.string()).default([]),
  dontPhrases: z.array(z.string()).default([]),
});

export const BusinessLayerSchema = z.object({
  identity: IdentitySchema,
  knowledge: KnowledgeModelSchema,
  policies: PolicySchema,
  scheduling: SchedulingSchema,
  integrations: z.array(IntegrationBindingSchema).default([]),
  industryBehavior: IndustryBehaviorSchema,
  brandVoice: BrandVoiceSchema,
});

// ---------------------------------------------------------------- EMPLOYEE layer (per role)

export const PersonalitySchema = z.object({
  archetype: z.string(),
  warmth: z.number().min(0).max(1).default(0.7),
  assertiveness: z.number().min(0).max(1).default(0.5),
  humor: z.number().min(0).max(1).default(0.2),
  empathy: z.number().min(0).max(1).default(0.7),
  descriptor: z.string().optional(),
});

export const CommunicationSchema = z.object({
  tone: z.array(z.string()).default([]),
  formality: z.number().min(0).max(1).default(0.5),
  verbosity: z.enum(["concise", "balanced", "detailed"]).default("concise"),
  greeting: z.string().optional(),
  signOff: z.string().optional(),
  channels: z.array(ChannelSchema).default(["voice"]),
});

export const ToolGrantSchema = z.object({
  key: ToolKeySchema,
  allowed: z.boolean().default(true),
  requiresConfirmation: z.boolean().default(false),
  constraints: z.record(z.string(), z.unknown()).optional(),
});

export const EscalationTriggerSchema = z.object({
  when: z.enum([
    "angry_customer",
    "out_of_scope",
    "high_value",
    "explicit_request",
    "low_confidence",
    "payment_dispute",
    "compliance_sensitive",
  ]),
  action: z.enum(["transfer_human", "take_message", "notify", "offer_callback"]),
});

export const EscalationSchema = z.object({
  triggers: z.array(EscalationTriggerSchema).default([]),
  fallbackAction: z
    .enum(["take_message", "transfer_human", "offer_callback"])
    .default("take_message"),
  handoffTo: z.string().optional(),
});

export const CustomerExperienceSchema = z.object({
  objectives: z.array(z.string()).default([]),
  upsell: z.enum(["never", "soft", "active"]).default("soft"),
  followUp: z.array(z.string()).default([]),
  satisfactionTarget: z.number().min(0).max(1).optional(),
});

export const MetricTargetSchema = z.object({
  metric: MetricSchema,
  target: z.number(),
  unit: z.string(),
});

export const EmployeeBlueprintSchema = z.object({
  role: EmployeeRoleSchema,
  name: z.string(),
  goal: z.string(),
  personality: PersonalitySchema,
  communication: CommunicationSchema,
  tools: z.array(ToolGrantSchema).default([]),
  escalation: EscalationSchema,
  customerExperience: CustomerExperienceSchema,
  successMetrics: z.array(MetricTargetSchema).default([]),
});
export type EmployeeBlueprint = z.infer<typeof EmployeeBlueprintSchema>;

// ---------------------------------------------------------------- the whole DNA

export const BusinessDNASchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  businessId: z.string(),
  meta: z.object({
    generatedAt: z.string(),
    source: z.enum(["analyzed", "manual", "template", "hybrid"]),
    confidence: z.number().min(0).max(1).optional(),
  }),
  business: BusinessLayerSchema,
  employees: z.array(EmployeeBlueprintSchema).min(1),
});
export type BusinessDNA = z.infer<typeof BusinessDNASchema>;

// ---------------------------------------------------------------- inferred types

export type Identity = z.infer<typeof IdentitySchema>;
export type KnowledgeModel = z.infer<typeof KnowledgeModelSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type Scheduling = z.infer<typeof SchedulingSchema>;
export type BusinessLayer = z.infer<typeof BusinessLayerSchema>;
export type Personality = z.infer<typeof PersonalitySchema>;
export type Communication = z.infer<typeof CommunicationSchema>;
export type ToolGrant = z.infer<typeof ToolGrantSchema>;
export type Escalation = z.infer<typeof EscalationSchema>;
export type CustomerExperience = z.infer<typeof CustomerExperienceSchema>;
export type MetricTarget = z.infer<typeof MetricTargetSchema>;
