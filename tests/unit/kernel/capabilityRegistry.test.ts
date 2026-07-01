import { describe, expect, it } from 'vitest';
import { CapabilityRegistry } from '../../../src/kernel/capabilityRegistry';
import type { CapabilityRegistration } from '../../../src/kernel/types';

const housingRegistration: CapabilityRegistration = {
  domain: 'housing',
  actions: [{ name: 'inspection.submit_evidence', domain: 'housing', requiredProofs: ['evidence.hash_valid'] }],
  invariants: [
    {
      id: 'inspector.credential_valid',
      appliesWhen: () => true,
      mustHold: () => true,
      onViolation: 'block',
      rationale: 'test',
    },
  ],
};

const aecRegistration: CapabilityRegistration = {
  domain: 'aec',
  actions: [{ name: 'beam.assess', domain: 'aec' }],
  invariants: [],
};

describe('CapabilityRegistry', () => {
  it('returns undefined for an unregistered domain', () => {
    const registry = new CapabilityRegistry();
    expect(registry.getDomain('housing')).toBeUndefined();
    expect(registry.invariantsFor('housing')).toEqual([]);
  });

  it('registers and retrieves a domain independently of others', () => {
    const registry = new CapabilityRegistry();
    registry.register(housingRegistration);
    registry.register(aecRegistration);

    expect(registry.getDomain('housing')).toBe(housingRegistration);
    expect(registry.findAction('housing', 'inspection.submit_evidence')).toEqual(housingRegistration.actions[0]);
    expect(registry.findAction('aec', 'inspection.submit_evidence')).toBeUndefined();
    expect(registry.invariantsFor('housing')).toHaveLength(1);
    expect(registry.getAllDomains()).toHaveLength(2);
  });

  it('unregisters a domain', () => {
    const registry = new CapabilityRegistry();
    registry.register(housingRegistration);
    registry.unregister('housing');
    expect(registry.getDomain('housing')).toBeUndefined();
  });
});
