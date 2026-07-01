// The kernel loop: submitIntent() → gate → verify (via execute's evidence) →
// execute → observe → seal.
//
// UNIFICATION.md described this loop as "already implemented in Dominion as Intent →
// ExecutionGraph + self-healing runtime" — it wasn't; those pieces existed but were
// never wired into one orchestrator. This is that orchestrator, built on top of
// gate.ts and seal.ts. It runs the gate twice: once pre-execution (to catch `block`
// violations before anything runs) and once post-execution with the produced
// evidence merged into context (to catch `rollback`-class post-condition drift,
// e.g. an invariant that can only be checked once the domain handler has produced
// its evidence).

import type { GateContext, GateResult, Intent, Invariant, Seal } from './types';
import { blockingViolations, gate, rollbackViolations } from './gate';
import { issueSeal } from './seal';

export type Executor = (intent: Intent) => Record<string, unknown> | Promise<Record<string, unknown>>;
export type Observer = (intent: Intent, evidence: Record<string, unknown>) => void | Promise<void>;
export type Rollback = (intent: Intent, violations: GateResult['violations']) => void | Promise<void>;
export type ContextBuilder = (intent: Intent) => GateContext;

/** The one method the kernel loop needs from a CapabilityRegistry. */
export interface InvariantSource {
  invariantsFor(domain: string): Invariant[];
}

export interface KernelLoopDeps {
  registry: InvariantSource;
  execute: Executor;
  observe?: Observer;
  rollback?: Rollback;
  buildContext?: ContextBuilder;
}

export interface KernelLoopResult {
  intent: Intent;
  preGate: GateResult;
  postGate: GateResult;
  blocked: boolean;
  rolledBack: boolean;
  seal: Seal;
}

export async function submitIntent(intent: Intent, deps: KernelLoopDeps): Promise<KernelLoopResult> {
  const invariants = deps.registry.invariantsFor(intent.domain);
  const buildContext = deps.buildContext ?? ((i: Intent): GateContext => ({ intent: i }));

  const preGate = gate(buildContext(intent), invariants);

  if (blockingViolations(preGate).length > 0) {
    const seal = issueSeal({
      intent,
      passed: false,
      evidence: { reason: 'gate.blocked', violations: preGate.violations },
    });
    return { intent, preGate, postGate: preGate, blocked: true, rolledBack: false, seal };
  }

  const evidence = await deps.execute(intent);
  if (deps.observe) await deps.observe(intent, evidence);

  const postCtx = { ...buildContext(intent), evidence };
  const postGate = gate(postCtx, invariants);
  const rolledBack = rollbackViolations(postGate).length > 0;

  if (rolledBack && deps.rollback) {
    await deps.rollback(intent, postGate.violations);
  }

  const passed = !rolledBack && blockingViolations(postGate).length === 0;
  const seal = issueSeal({ intent, passed, evidence });

  return { intent, preGate, postGate, blocked: false, rolledBack, seal };
}
