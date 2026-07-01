// Seal issuance — new in this pass. demo/seal-ring.js is a pure SVG animation of a
// seal "closing"; nothing before this actually issued a client-held credential
// object. This is the minimal real version: an immutable record of whether an
// Intent's subject was sealed (compliant) or withheld (non-compliant), carrying
// whatever evidence the domain's execute()/observe() steps produced.

import type { Intent, Seal } from './types';

let sealSequence = 0;

export interface SealInput {
  intent: Intent;
  passed: boolean;
  evidence: Record<string, unknown>;
}

export function issueSeal(input: SealInput): Seal {
  sealSequence += 1;
  return Object.freeze({
    id: `seal-${sealSequence}-${Date.now()}`,
    intentId: input.intent.id,
    subjectId: input.intent.subject.id,
    domain: input.intent.domain,
    issuedAt: new Date().toISOString(),
    status: input.passed ? 'sealed' : 'withheld',
    evidence: input.evidence,
  });
}

export interface SealExpectation {
  intentId?: string;
  subjectId?: string;
}

export function verifySeal(seal: Seal, expected: SealExpectation = {}): boolean {
  if (seal.status !== 'sealed') return false;
  if (expected.intentId && seal.intentId !== expected.intentId) return false;
  if (expected.subjectId && seal.subjectId !== expected.subjectId) return false;
  return true;
}
