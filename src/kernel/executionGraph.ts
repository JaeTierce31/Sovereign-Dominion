// Typed, domain-agnostic version of demo/exec-graph.js's ExecutionGraph.
//
// The demo version is hardcoded to the browser (uses `performance.now()`, ships a
// DOM renderer alongside the state machine). This is the state machine only — no
// DOM, no `performance` global — so it can run in domain-housing's Rust/React Native
// stack's TS layer, tests, or any future surface. Rendering stays a per-surface
// concern; demo/exec-graph.js remains the reference UI implementation.

export type NodeStatus = 'pending' | 'running' | 'success' | 'failed';

export interface ExecNode {
  id: string;
  label: string;
  capability: string;
  status: NodeStatus;
  startedAt: number | null;
  endedAt: number | null;
  inputs: unknown[];
  outputs: unknown[];
  durationMs: number | null;
}

export type ExecutionGraphListener = (nodes: ExecNode[]) => void;

export class ExecutionGraph {
  readonly intentId: string;
  readonly nodes: ExecNode[] = [];
  private listeners: ExecutionGraphListener[] = [];

  constructor(intentId: string) {
    this.intentId = intentId;
  }

  addNode(id: string, label: string, capability: string): ExecNode {
    const node: ExecNode = {
      id,
      label,
      capability,
      status: 'pending',
      startedAt: null,
      endedAt: null,
      inputs: [],
      outputs: [],
      durationMs: null,
    };
    this.nodes.push(node);
    this.emit();
    return node;
  }

  start(id: string): void {
    const node = this.find(id);
    if (!node) return;
    node.status = 'running';
    node.startedAt = Date.now();
    this.emit();
  }

  complete(id: string, outputs: unknown[] = []): void {
    const node = this.find(id);
    if (!node) return;
    node.status = 'success';
    node.endedAt = Date.now();
    node.durationMs = node.startedAt != null ? node.endedAt - node.startedAt : null;
    node.outputs = outputs;
    this.emit();
  }

  fail(id: string, reason?: string): void {
    const node = this.find(id);
    if (!node) return;
    node.status = 'failed';
    node.endedAt = Date.now();
    node.durationMs = node.startedAt != null ? node.endedAt - node.startedAt : null;
    node.outputs = [reason ?? 'error'];
    this.emit();
  }

  onChange(fn: ExecutionGraphListener): void {
    this.listeners.push(fn);
  }

  private find(id: string): ExecNode | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.nodes);
  }
}
