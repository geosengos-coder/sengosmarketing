import type { BusinessDNA, Escalation, MetricTarget, Policy, Scheduling, ToolKey } from "./schema";

/**
 * The runtime contract — exactly what the AI orchestrator needs to run an employee.
 * The system prompt is only ONE field here: the DNA also yields the tool allow-list,
 * policy guardrails, escalation config, and scheduling behavior as structured data.
 * That is the point of Business DNA: behavior is data, not a prompt.
 */
export interface RuntimeContract {
  role: string;
  name: string;
  systemPrompt: string;
  toolAllowlist: ToolKey[];
  toolConstraints: Partial<
    Record<ToolKey, { requiresConfirmation: boolean; constraints?: Record<string, unknown> }>
  >;
  policies: Policy;
  escalation: Escalation;
  scheduling: Scheduling;
  metrics: MetricTarget[];
}

export function toRuntime(dna: BusinessDNA, role: string): RuntimeContract {
  const emp = dna.employees.find((e) => e.role === role);
  if (!emp) throw new Error(`No employee blueprint for role "${role}"`);
  const b = dna.business;

  const allowed = emp.tools.filter((t) => t.allowed);
  const toolAllowlist = allowed.map((t) => t.key);
  const toolConstraints = Object.fromEntries(
    allowed.map((t) => [
      t.key,
      { requiresConfirmation: t.requiresConfirmation, constraints: t.constraints },
    ]),
  ) as RuntimeContract["toolConstraints"];

  return {
    role: emp.role,
    name: emp.name,
    systemPrompt: buildSystemPrompt(dna, emp),
    toolAllowlist,
    toolConstraints,
    policies: b.policies,
    escalation: emp.escalation,
    scheduling: b.scheduling,
    metrics: emp.successMetrics,
  };
}

function buildSystemPrompt(dna: BusinessDNA, emp: BusinessDNA["employees"][number]): string {
  const b = dna.business;
  const where = b.identity.city ? ` in ${b.identity.city}` : "";
  const sections = [
    `You are ${emp.name}, ${emp.personality.archetype}, working as the ${emp.role.replace("_", " ")} for ${b.identity.displayName}${where}.`,
    `Your goal: ${emp.goal}`,
    b.identity.description ? `About the business: ${b.identity.description}` : "",
    b.identity.valueProps.length
      ? `What sets them apart: ${b.identity.valueProps.join("; ")}.`
      : "",
    `Voice: ${emp.communication.tone.join(", ")}. ${emp.personality.descriptor ?? ""}`.trim(),
    b.knowledge.services.length
      ? `Services you can speak to: ${b.knowledge.services.map((s) => s.name).join(", ")}.`
      : "",
    b.industryBehavior.rules.length
      ? `Rules for ${b.industryBehavior.template.replace("_", " ")}:\n- ${b.industryBehavior.rules.join("\n- ")}`
      : "",
    b.policies.prohibitedTopics.length
      ? `Never discuss: ${b.policies.prohibitedTopics.join(", ")}.`
      : "",
    b.policies.disclaimers.length
      ? `Include when relevant: ${b.policies.disclaimers.join(" ")}`
      : "",
    `If you cannot help or an escalation trigger fires, ${emp.escalation.fallbackAction.replace("_", " ")}. Never invent prices, availability, or facts — confirm from business data or take a message.`,
    emp.communication.greeting ? `Open with: "${emp.communication.greeting}"` : "",
  ];
  return sections.filter(Boolean).join("\n\n");
}
