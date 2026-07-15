/** The data model of the Business Brain — shared by every surface (see rendering-architecture doc). */

export type NodeFamily = "system" | "knowledge" | "activity" | "intelligence";

export type NodeState = "dormant" | "connecting" | "connected" | "active";

export interface BrainNode {
  id: string;
  label: string;
  family: NodeFamily;
  state: NodeState;
  /** World position [x, y, z]. */
  position: [number, number, number];
  /** Live "learning" micro-copy shown while the AI ingests this system. */
  learning?: string;
}

export interface BrainEdge {
  id: string;
  source: string;
  target: string;
}

export interface BrainConfig {
  nodes: BrainNode[];
  edges: BrainEdge[];
}

/** Events the headless store will accept (wired fully in the scroll-narrative section). */
export type BrainEvent =
  | { type: "connect"; nodeId: string }
  | { type: "activate"; nodeId: string }
  | { type: "pulse"; fromId: string }
  | { type: "addMemory"; node: BrainNode };
