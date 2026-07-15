import { toRuntime, type BusinessDNA, type EmployeeRole } from "@operatoros/dna";
import { buildToolDefinitions, type ToolDefinition } from "./tools";

/**
 * The DNA-to-agent mapping — provider-agnostic. This is the enforcement point for
 * "no manually written prompts per business": the ENTIRE prompt and tool set are
 * derived from `toRuntime()`, which is itself derived from the generated Business
 * DNA. Nothing business-specific is authored here or in any adapter.
 */
export interface AgentBlueprint {
  agentName: string;
  systemPrompt: string;
  greeting?: string;
  tools: ToolDefinition[];
  voiceHint: { formality: number; warmth: number };
  maxCallDurationMs: number;
}

const MAX_CALL_DURATION_MS = 5 * 60 * 1000; // 5 minutes — a demo call, not a support queue.

export function buildAgentBlueprint(dna: BusinessDNA, role: EmployeeRole): AgentBlueprint {
  const runtime = toRuntime(dna, role);
  const employee = dna.employees.find((e) => e.role === role);
  const tools = buildToolDefinitions(runtime.toolAllowlist, dna.business.scheduling.appointmentTypes.map((a) => a.name));

  return {
    agentName: employee?.name ?? "Ava",
    systemPrompt: runtime.systemPrompt,
    greeting: employee?.communication.greeting,
    tools,
    voiceHint: {
      formality: employee?.communication.formality ?? 0.5,
      warmth: employee?.personality.warmth ?? 0.7,
    },
    maxCallDurationMs: MAX_CALL_DURATION_MS,
  };
}
