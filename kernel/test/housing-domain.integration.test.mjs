// Integration proof for UNIFICATION.md §8 step 3: "Wrap one Housing write
// path (submit inspection evidence) as an Intent through the kernel."
//
// Unlike test/charter-compiler.test.mjs (which calls compiled invariants
// directly) or test/kernel.test.mjs (which hand-writes invariants), this
// test drives the *actual* createKernel() pipeline with invariants compiled
// straight from constitution/charter.housing-inspection.example.yaml,
// against a small in-memory evidence store standing in for the real
// `services/ledger` Rust service (Sovereign-Dignity's ADR-001 stack) — the
// same role demo/'s mock backends play for Dominion's own pipeline.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import {
  createIntent, Constitution, CapabilityRegistry, AuditLog, createKernel, verifySeal, hash,
} from '../src/index.js';
import { compileCharter } from '../src/charter-compiler.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

const charterObj = load(
  readFileSync(new URL('../../constitution/charter.housing-inspection.example.yaml', import.meta.url), 'utf8')
);
const NSPIRE_ORDINALS = { low: 0, moderate: 1, severe: 2, life_threatening: 3 };
const { invariants } = compileCharter(charterObj, { ordinals: NSPIRE_ORDINALS });

// ── A minimal stand-in for the real ledger's evidence store ────────────────
class EvidenceStore {
  constructor() { this.units = new Map(); }
  chainFor(unitId) {
    if (!this.units.has(unitId)) this.units.set(unitId, { lastHash: null, length: 0 });
    return this.units.get(unitId);
  }
  append(unitId, evidenceHash) {
    const chain = this.chainFor(unitId);
    chain.lastHash = evidenceHash;
    chain.length += 1;
  }
}

const store = new EvidenceStore();
const constitution = new Constitution(invariants);
const registry = new CapabilityRegistry();
registry.register({
  domain: 'housing',
  actions: [
    {
      name: 'inspection.submit_evidence',
      handler: (intent) => {
        store.append(intent.subject.id, intent.payload.evidenceHash);
        return { unitId: intent.subject.id, evidenceHash: intent.payload.evidenceHash };
      },
    },
    { name: 'inspection.finalize', handler: (intent) => ({ finalized: true, unitId: intent.subject.id }) },
  ],
  invariants,
});
const audit = new AuditLog();
const kernel = createKernel({ constitution, registry, audit });

function inspector(status = 'active', expiresAt = Date.now() + 1e7) {
  return { id: 'insp-1', role: 'inspector', credential: { kind: 'nspire_inspector', status, expiresAt } };
}

function evidenceIntent(unitId, evidenceBytes) {
  const chain = store.chainFor(unitId);
  const evidenceHash = hash(evidenceBytes);
  return createIntent({
    actor: inspector(),
    subject: { id: unitId, evidenceChain: { lastHash: chain.lastHash, length: chain.length } },
    action: 'inspection.submit_evidence',
    domain: 'housing',
    payload: { evidenceHash, evidenceBytes, previousHash: chain.lastHash },
  });
}

// ── 1. First evidence item for a fresh unit → sealed, chain now length 1 ────
{
  const intent = evidenceIntent('unit-abc', 'front-door-photo-1');
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal));
  assert.equal(store.chainFor('unit-abc').length, 1);
  ok('first evidence item for a unit is gated, executed, and sealed');
}

// ── 2. Second, correctly-chained evidence item → sealed, chain length 2 ────
{
  const intent = evidenceIntent('unit-abc', 'front-door-photo-2');
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'sealed');
  assert.equal(store.chainFor('unit-abc').length, 2);
  ok('correctly-chained second evidence item is sealed; chain grows to 2');
}

// ── 3. Evidence submitted with a stale previousHash → blocked, chain unchanged
// The service is responsible for attaching the *real*, freshly-fetched
// evidenceChain to `intent.subject` (as `evidenceIntent()` correctly does
// above) — the gate only checks that the submitted payload's `previousHash`
// agrees with whatever subject snapshot it was given. So the realistic tamper
// case is: correct, live subject, but a payload that lies about what it's
// chaining from (e.g. evidence captured against a stale on-device cache).
{
  const chain = store.chainFor('unit-abc'); // the real, current tip (length 2)
  const staleIntent = createIntent({
    actor: inspector(),
    subject: { id: 'unit-abc', evidenceChain: chain },
    action: 'inspection.submit_evidence',
    domain: 'housing',
    payload: { evidenceHash: hash('forged-photo'), evidenceBytes: 'forged-photo', previousHash: 'stale-hash-from-before' },
  });
  const r = await kernel.submitIntent(staleIntent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('evidence.chain_of_custody'), true);
  assert.equal(store.chainFor('unit-abc').length, 2, 'the forged submission must not have advanced the chain');
  ok('evidence whose previousHash disagrees with the real chain tip is blocked before the handler runs');
}

// ── 4. Expired inspector credential → blocked regardless of chain validity ──
{
  const chain = store.chainFor('unit-abc');
  const intent = createIntent({
    actor: inspector('active', Date.now() - 1), // expired
    subject: { id: 'unit-abc', evidenceChain: chain },
    action: 'inspection.submit_evidence',
    domain: 'housing',
    payload: { evidenceHash: hash('photo-3'), evidenceBytes: 'photo-3', previousHash: chain.lastHash },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations[0].id, 'inspector.credential_valid');
  assert.equal(store.chainFor('unit-abc').length, 2, 'chain must not advance on a blocked Intent');
  ok('expired inspector credential blocks even a correctly-chained submission');
}

// ── 5. Finalize with dual human attestation and honest severity → sealed ───
{
  const intent = createIntent({
    actor: inspector(),
    subject: { id: 'unit-abc' },
    action: 'inspection.finalize',
    domain: 'housing',
    payload: {
      deficiencies: [{ recordedSeverity: 'severe', evidenceImpliedSeverity: 'severe' }],
      attestations: [{ actorId: 'insp-1', kind: 'human' }, { actorId: 'insp-2', kind: 'human' }],
    },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'sealed');
  ok('finalize with dual human attestation and honest severity is sealed');
}

// ── 6. Finalize that downgrades a life-threatening finding → blocked ───────
{
  const intent = createIntent({
    actor: inspector(),
    subject: { id: 'unit-abc' },
    action: 'inspection.finalize',
    domain: 'housing',
    payload: {
      deficiencies: [{ recordedSeverity: 'low', evidenceImpliedSeverity: 'life_threatening' }],
      attestations: [{ actorId: 'insp-1', kind: 'human' }, { actorId: 'insp-2', kind: 'human' }],
    },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('deficiency.severity_disclosure'), true);
  ok('finalize that downgrades a life-threatening finding is blocked, dual attestation notwithstanding');
}

// ── 7. The whole run left a tamper-evident trail ────────────────────────────
{
  assert.equal(audit.verify(), true);
  assert.ok(audit.length() >= 6, 'every submitIntent call left an audit record, sealed or blocked');
  ok('the full run is captured in a tamper-evident audit log');
}

console.log(`\n${passed} checks passed.`);
