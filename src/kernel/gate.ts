// The gate: evaluates a set of Invariants against a GateContext.
//
// The Constitution YAML files under /constitution are human-authored *design*
// artifacts (see constitution/README.md) — they are not parsed at runtime here.
// Domains compile their charter into real `Invariant` predicate functions (the
// `appliesWhen` / `mustHold` fields become TypeScript predicates) and register them
// via CapabilityRegistry. This keeps the gate free of any expression-language
// evaluator (no eval/new Function over config strings) while preserving the same
// id / appliesWhen / mustHold / onViolation / rationale shape as the YAML sketch.

import type { GateContext, GateResult, GateViolation, Invariant } from './types';

export function gate(ctx: GateContext, invariants: Invariant[]): GateResult {
  const violations: GateViolation[] = [];

  for (const invariant of invariants) {
    if (!invariant.appliesWhen(ctx)) continue;
    if (invariant.mustHold(ctx)) continue;

    violations.push({
      invariantId: invariant.id,
      onViolation: invariant.onViolation,
      rationale: invariant.rationale,
    });
  }

  return { passed: violations.length === 0, violations };
}

export function blockingViolations(result: GateResult): GateViolation[] {
  return result.violations.filter((v) => v.onViolation === 'block');
}

export function rollbackViolations(result: GateResult): GateViolation[] {
  return result.violations.filter((v) => v.onViolation === 'rollback');
}
