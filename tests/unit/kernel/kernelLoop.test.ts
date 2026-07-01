import { describe, expect, it, vi } from 'vitest';
import { CapabilityRegistry } from '../../../src/kernel/capabilityRegistry';
import { submitIntent } from '../../../src/kernel/kernelLoop';
import type { GateContext, Intent, Invariant } from '../../../src/kernel/types';

function makeIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    id: 'intent-1',
    actor: { id: 'actor-1', role: 'inspector', credential: { kind: 'nspire_inspector', status: 'active' } },
    subject: { id: 'unit-1', kind: 'dwelling_unit', domain: 'housing' },
    action: 'inspection.submit_evidence',
    domain: 'housing',
    payload: {},
    requiredProofs: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const credentialInvariant: Invariant = {
  id: 'inspector.credential_valid',
  appliesWhen: () => true,
  mustHold: (ctx: GateContext) => ctx.intent.actor.credential?.status === 'active',
  onViolation: 'block',
  rationale: 'Only a currently-active credentialed inspector may submit evidence.',
};

const chainOfCustodyInvariant: Invariant = {
  id: 'evidence.chain_of_custody',
  appliesWhen: () => true,
  mustHold: (ctx: GateContext) => ctx.evidence === undefined || ctx.evidence.chainIntact !== false,
  onViolation: 'rollback',
  rationale: 'Evidence chain must remain intact after execution.',
};

function registryWith(invariants: Invariant[]): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  registry.register({ domain: 'housing', actions: [], invariants });
  return registry;
}

describe('submitIntent', () => {
  it('executes, observes, and issues a sealed Seal on the happy path', async () => {
    const registry = registryWith([credentialInvariant, chainOfCustodyInvariant]);
    const execute = vi.fn().mockResolvedValue({ chainIntact: true, hash: 'abc' });
    const observe = vi.fn();

    const result = await submitIntent(makeIntent(), { registry, execute, observe });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith(expect.objectContaining({ id: 'intent-1' }), { chainIntact: true, hash: 'abc' });
    expect(result.blocked).toBe(false);
    expect(result.rolledBack).toBe(false);
    expect(result.seal.status).toBe('sealed');
  });

  it('blocks before executing when a pre-condition invariant fails', async () => {
    const registry = registryWith([credentialInvariant]);
    const execute = vi.fn();
    const intent = makeIntent({ actor: { id: 'actor-1', role: 'inspector', credential: { kind: 'nspire_inspector', status: 'expired' } } });

    const result = await submitIntent(intent, { registry, execute });

    expect(execute).not.toHaveBeenCalled();
    expect(result.blocked).toBe(true);
    expect(result.seal.status).toBe('withheld');
    expect(result.preGate.violations[0].invariantId).toBe('inspector.credential_valid');
  });

  it('rolls back when execution evidence violates a post-condition invariant', async () => {
    const registry = registryWith([chainOfCustodyInvariant]);
    const execute = vi.fn().mockResolvedValue({ chainIntact: false });
    const rollback = vi.fn();

    const result = await submitIntent(makeIntent(), { registry, execute, rollback });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(rollback).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'intent-1' }),
      expect.arrayContaining([expect.objectContaining({ invariantId: 'evidence.chain_of_custody' })])
    );
    expect(result.blocked).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.seal.status).toBe('withheld');
  });
});
