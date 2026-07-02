// Coverage for the kernel loop's VERIFY step (pipeline.js) via a real
// hash-integrity resolver — the step previously had a no-op stub resolver and
// zero tests.
//
// The scenario is the one the VERIFY step exists for and the gate can't do:
// the raw evidence bytes stay ON-DEVICE (offline-first inspector model,
// ADR-003) and never enter the shared Intent/audit record. The Intent carries
// only the evidenceHash; the resolver is handed the bytes out-of-band (a
// device-local store on the context) to confirm that hash. A submission whose
// claimed hash doesn't match the on-device bytes is rejected at VERIFY, before
// the domain handler ever runs — and the raw bytes are never audited.

import assert from 'node:assert/strict';
import {
  createIntent, Constitution, CapabilityRegistry, AuditLog, createKernel, verifySeal,
  hash, hashIntegrityResolver, composeResolvers,
} from '../src/index.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

// Device-local evidence store: bytes live here, NOT in the Intent.
const deviceStore = new Map(); // evidenceId -> raw bytes
deviceStore.set('ev-1', 'front-door-photo-bytes');

// Resolver for the `evidence.hash_valid` required proof: the claimed hash comes
// from the Intent; the witness bytes come from the device store via the context.
const resolver = composeResolvers(
  hashIntegrityResolver({
    predicateId: 'evidence.hash_valid',
    getClaimedHash: (ctx) => ctx.intent.payload.evidenceHash,
    getWitnessBytes: (ctx) => ctx.deviceStore.get(ctx.intent.payload.evidenceId),
  })
);

// No gate invariants needed for this test — we're exercising VERIFY, not the gate.
const constitution = new Constitution([]);
const registry = new CapabilityRegistry();
let handledEvidenceId = null;
registry.register({
  domain: 'housing',
  actions: [
    { name: 'inspection.submit_evidence', handler: (intent) => { handledEvidenceId = intent.payload.evidenceId; return { stored: true }; } },
  ],
});
const audit = new AuditLog();
const kernel = createKernel({ constitution, registry, audit, proofResolver: resolver });

function submitEvidenceIntent(evidenceId, claimedHash) {
  return createIntent({
    actor: { id: 'insp-1', role: 'inspector' },
    subject: { id: 'unit-abc' },
    action: 'inspection.submit_evidence',
    domain: 'housing',
    // Note: NO evidenceBytes in the payload — only the hash + a reference.
    payload: { evidenceId, evidenceHash: claimedHash },
    requiredProofs: ['evidence.hash_valid'],
  });
}

// ── 1. Claimed hash matches the on-device bytes → proof holds → sealed ──────
{
  handledEvidenceId = null;
  const intent = submitEvidenceIntent('ev-1', hash('front-door-photo-bytes'));
  const r = await kernel.submitIntent(intent, { deviceStore });
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal));
  assert.equal(handledEvidenceId, 'ev-1', 'handler ran only after the proof verified');
  ok('evidence whose claimed hash matches the on-device bytes passes VERIFY and is sealed');
}

// ── 2. Claimed hash does NOT match the on-device bytes → proof_failed ───────
//        (the handler must NOT run; the raw bytes never entered the Intent).
{
  handledEvidenceId = null;
  const intent = submitEvidenceIntent('ev-1', hash('a-different-forged-photo'));
  const r = await kernel.submitIntent(intent, { deviceStore });
  assert.equal(r.status, 'proof_failed');
  assert.equal(r.predicate, 'evidence.hash_valid');
  assert.equal(handledEvidenceId, null, 'handler must never run when the integrity proof fails');
  ok('evidence whose claimed hash does not match the on-device bytes is rejected at VERIFY');
}

// ── 3. An unresolved required proof also fails closed ───────────────────────
{
  handledEvidenceId = null;
  const intent = createIntent({
    actor: { id: 'insp-1', role: 'inspector' },
    subject: { id: 'unit-abc' },
    action: 'inspection.submit_evidence',
    domain: 'housing',
    payload: { evidenceId: 'ev-1', evidenceHash: hash('front-door-photo-bytes') },
    requiredProofs: ['some.unregistered.proof'],
  });
  const r = await kernel.submitIntent(intent, { deviceStore });
  assert.equal(r.status, 'proof_failed');
  assert.equal(r.predicate, 'some.unregistered.proof');
  assert.equal(handledEvidenceId, null);
  ok('a required proof with no resolver fails closed (proof_failed), never reaching the handler');
}

// ── 4. The audit trail records the outcomes but never the raw bytes ─────────
{
  assert.equal(audit.verify(), true, 'audit chain intact');
  const serialized = JSON.stringify(audit.entries());
  assert.equal(serialized.includes('front-door-photo-bytes'), false, 'raw evidence bytes must never appear in the shared audit record');
  ok('the shared audit trail records the proof outcomes but never the raw on-device bytes');
}

console.log(`\n${passed} checks passed.`);
