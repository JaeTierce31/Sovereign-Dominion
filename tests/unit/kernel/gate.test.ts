import { describe, expect, it } from 'vitest';
import { blockingViolations, gate, rollbackViolations } from '../../../src/kernel/gate';
import type { GateContext, Invariant } from '../../../src/kernel/types';

const intent = {
  id: 'intent-1',
  actor: { id: 'actor-1', role: 'inspector' },
  subject: { id: 'unit-1', kind: 'dwelling_unit', domain: 'housing' },
  action: 'inspection.submit_evidence',
  domain: 'housing',
  payload: {},
  requiredProofs: [],
  createdAt: new Date().toISOString(),
};

const credentialInvariant: Invariant = {
  id: 'inspector.credential_valid',
  appliesWhen: (ctx: GateContext) => ctx.intent.action === 'inspection.submit_evidence',
  mustHold: (ctx: GateContext) => ctx.intent.actor.credential?.status === 'active',
  onViolation: 'block',
  rationale: 'Only a currently-active credentialed inspector may submit evidence.',
};

const driftInvariant: Invariant = {
  id: 'evidence.chain_of_custody',
  appliesWhen: () => true,
  mustHold: (ctx: GateContext) => ctx.evidence?.chainIntact !== false,
  onViolation: 'rollback',
  rationale: 'Evidence chain must remain intact after execution.',
};

describe('gate', () => {
  it('passes when every applicable invariant holds', () => {
    const result = gate(
      { intent: { ...intent, actor: { ...intent.actor, credential: { kind: 'nspire_inspector', status: 'active' } } } },
      [credentialInvariant]
    );
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('records a violation when an applicable invariant fails', () => {
    const result = gate({ intent }, [credentialInvariant]);
    expect(result.passed).toBe(false);
    expect(result.violations).toEqual([
      {
        invariantId: 'inspector.credential_valid',
        onViolation: 'block',
        rationale: credentialInvariant.rationale,
      },
    ]);
  });

  it('skips an invariant whose appliesWhen predicate does not match', () => {
    const otherIntent = { ...intent, action: 'record.read' };
    const result = gate({ intent: otherIntent }, [credentialInvariant]);
    expect(result.passed).toBe(true);
  });

  it('separates block violations from rollback violations', () => {
    const result = gate({ intent, evidence: { chainIntact: false } }, [credentialInvariant, driftInvariant]);
    expect(blockingViolations(result).map((v) => v.invariantId)).toEqual(['inspector.credential_valid']);
    expect(rollbackViolations(result).map((v) => v.invariantId)).toEqual(['evidence.chain_of_custody']);
  });
});
