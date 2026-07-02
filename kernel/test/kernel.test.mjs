// Kernel smoke test — proves the loop end to end and shows how a domain plugs in.
// Run: node test/kernel.test.mjs   (or npm test)

import assert from 'node:assert/strict';
import {
  createIntent, Constitution, defineInvariant, CapabilityRegistry,
  AuditLog, createKernel, verifySeal, SelfHealingEngine,
} from '../src/index.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

// ── A tiny slice of the Constitution (compiled from /constitution) ──────────
// Housing (HUD NSPIRE) domain — see constitution/charter.housing-inspection.example.yaml.
const constitution = new Constitution([
  defineInvariant({
    id: 'inspector.credential_valid',
    rationale: 'Only a currently-active, HUD NSPIRE-certified inspector may submit evidence.',
    appliesWhen: ({ intent }) => intent.action === 'inspection.submit_evidence',
    mustHold: ({ intent, now }) =>
      intent.actor?.credential?.status === 'active' && now() < intent.actor.credential.expiresAt,
    onViolation: 'block',
  }),
  defineInvariant({
    id: 'inspection.dual_attestation',
    rationale: 'No Seal issues on one inspector\'s word alone — AI severity flags are advisory only.',
    appliesWhen: ({ intent }) => intent.action === 'inspection.finalize',
    mustHold: ({ intent }) =>
      Array.isArray(intent.payload?.attestations) &&
      intent.payload.attestations.length >= 2 &&
      intent.payload.attestations.every((a) => a.kind === 'human'),
    onViolation: 'block',
  }),
]);

// ── A domain plugs in by registering actions (+ its own invariants) ─────────
const registry = new CapabilityRegistry();
let submittedUnit = null;
registry.register({
  domain: 'housing',
  actions: [
    { name: 'inspection.submit_evidence', handler: (intent) => { submittedUnit = intent.subject.id; return { submitted: true }; } },
    { name: 'inspection.finalize', handler: () => ({ finalized: true }) },
  ],
});

const audit = new AuditLog();
const kernel = createKernel({ constitution, registry, audit });

// ── 1. Valid evidence submission → sealed ───────────────────────────────────
{
  const intent = createIntent({
    actor: { id: 'insp-1', role: 'inspector', credential: { status: 'active', expiresAt: Date.now() + 1e7 } },
    subject: { id: 'unit-abc' },
    action: 'inspection.submit_evidence', domain: 'housing', purpose: 'nspire_inspection',
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal), 'seal verifies');
  assert.equal(submittedUnit, 'unit-abc', 'domain handler ran');
  ok('valid inspection.submit_evidence is gated, executed, and sealed');
}

// ── 2. Expired inspector credential → blocked before it executes ────────────
{
  submittedUnit = null;
  const intent = createIntent({
    actor: { id: 'insp-1', role: 'inspector', credential: { status: 'active', expiresAt: Date.now() - 1 } },
    subject: { id: 'unit-xyz' },
    action: 'inspection.submit_evidence', domain: 'housing',
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations[0].id, 'inspector.credential_valid');
  assert.equal(submittedUnit, null, 'handler never ran');
  ok('expired-credential submission is blocked at the gate (handler never runs)');
}

// ── 3. Single-attestation finalize → blocked (dual attestation required) ────
{
  const intent = createIntent({
    actor: { id: 'insp-1', role: 'inspector' },
    subject: { id: 'unit-abc' },
    action: 'inspection.finalize', domain: 'housing',
    payload: { attestations: [{ actorId: 'insp-1', kind: 'human' }] },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations[0].id, 'inspection.dual_attestation');
  ok('single-attestation finalize is blocked (dual human attestation required)');
}

// ── 4. Audit is tamper-evident ──────────────────────────────────────────────
{
  assert.equal(audit.verify(), true, 'chain intact');
  assert.ok(audit.length() >= 3, 'every intent left a record');
  audit._entries[0].leaf = 'deadbeefdeadbeef';          // simulate a retro-edit
  assert.equal(audit.verify(), false, 'tamper detected');
  ok('audit log is append-only and tamper-evident');
}

// ── 5. Self-healing rewinds past a red-line ─────────────────────────────────
{
  const heal = new SelfHealingEngine((s) => s.yieldKsi >= 36, { yieldKsi: 38 });
  assert.equal(heal.status, 'SAFE');
  heal.commit({ yieldKsi: 37.5 });
  assert.equal(heal.status, 'SAFE');
  heal.fault({ yieldKsi: 24 });                          // drift below the invariant
  assert.equal(heal.status, 'FAIL');
  heal.rollback();
  assert.equal(heal.state.yieldKsi >= 36, true, 'rewound to a safe checkpoint');
  heal.heal();
  assert.equal(heal.status, 'HEALED');
  ok('self-healing detects a violation and rewinds to the last verified-safe state');
}

console.log(`\n${passed} checks passed.`);
