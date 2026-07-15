import type { BrainConfig, BrainNode, NodeFamily } from "../store/types";

/**
 * The homepage constellation — the AI Operating System at the center, surrounded by
 * the REAL business systems that feed it. Every node is a named system with a
 * "learning" line, so the animation reads as storytelling, not decoration.
 */
interface SystemDef {
  id: string;
  label: string;
  family: NodeFamily;
  learning: string;
}

const SYSTEMS: SystemDef[] = [
  { id: "website", label: "Website", family: "system", learning: "Reading services & pricing…" },
  { id: "crm", label: "CRM", family: "activity", learning: "Reading contacts…" },
  { id: "phone", label: "Phone", family: "system", learning: "Training voice…" },
  { id: "email", label: "Email", family: "system", learning: "Learning tone…" },
  { id: "calendar", label: "Calendar", family: "activity", learning: "Understanding availability…" },
  { id: "quickbooks", label: "QuickBooks", family: "knowledge", learning: "Syncing invoices…" },
  { id: "stripe", label: "Stripe", family: "activity", learning: "Connecting payments…" },
  { id: "reviews", label: "Google Reviews", family: "knowledge", learning: "Learning reputation…" },
  { id: "inventory", label: "Inventory", family: "knowledge", learning: "Counting stock…" },
  { id: "knowledge", label: "Knowledge Base", family: "knowledge", learning: "Building knowledge…" },
  { id: "employees", label: "Employees", family: "activity", learning: "Mapping the team…" },
  { id: "sms", label: "SMS", family: "system", learning: "Enabling texts…" },
];

const TAU = Math.PI * 2;

const satellites: BrainNode[] = SYSTEMS.map((s, i) => {
  const a = (i / SYSTEMS.length) * TAU;
  const r = 3.0 + (i % 3) * 0.24;
  return {
    id: s.id,
    label: s.label,
    family: s.family,
    learning: s.learning,
    state: "connected",
    position: [Math.cos(a) * r, Math.sin(a) * r * 0.64, Math.cos(a * 1.6) * 1.2 - 0.2],
  };
});

export const heroScene: BrainConfig = {
  nodes: [
    { id: "core", label: "AI Operating System", family: "intelligence", state: "active", position: [0, 0, 0] },
    ...satellites,
  ],
  edges: satellites.map((s) => ({ id: `e-${s.id}`, source: s.id, target: "core" })),
};
