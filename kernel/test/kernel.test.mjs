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
const constitution = new Constitution([
  defineInvariant({
    id: 'consent.expiry',
    rationale: 'A share is invalid once the ROI has expired or been revoked.',
    appliesWhen: ({ intent }) => intent.action === 'enrollment.share',
    mustHold: ({ intent, now }) =>
      intent.subject?.consent?.status === 'active' && now() < intent.subject.consent.expiresAt,
    onViolation: 'block',
  }),
  defineInvariant({
    id: 'hitl.eligibility_determination',
    rationale: 'A human determines eligibility; AI is advisory only.',
    appliesWhen: ({ intent }) => intent.action === 'eligibility.determine',
    mustHold: ({ intent }) => intent.payload?.determinedBy === 'human',
    onViolation: 'block',
  }),
]);

// ── A domain plugs in by registering actions (+ its own invariants) ─────────
const registry = new CapabilityRegistry();
let shared = null;
registry.register({
  domain: 'hmis',
  actions: [
    { name: 'enrollment.share', handler: (intent) => { shared = intent.subject.id; return { shared: true }; } },
    { name: 'eligibility.determine', handler: () => ({ determined: true }) },
  ],
});

const audit = new AuditLog();
const kernel = createKernel({ constitution, registry, audit });

// ── 1. Valid share → sealed ─────────────────────────────────────────────────
{
  const intent = createIntent({
    actor: { id: 'cw-1', role: 'caseworker' },
    subject: { id: 'client-abc', consent: { status: 'active', expiresAt: Date.now() + 1e7 } },
    action: 'enrollment.share', domain: 'hmis', purpose: 'coordinated_entry',
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal), 'seal verifies');
  assert.equal(shared, 'client-abc', 'domain handler ran');
  ok('valid enrollment.share is gated, executed, and sealed');
}

// ── 2. Expired consent → blocked before it executes ─────────────────────────
{
  shared = null;
  const intent = createIntent({
    actor: { id: 'cw-1', role: 'caseworker' },
    subject: { id: 'client-xyz', consent: { status: 'active', expiresAt: Date.now() - 1 } },
    action: 'enrollment.share', domain: 'hmis',
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations[0].id, 'consent.expiry');
  assert.equal(shared, null, 'handler never ran');
  ok('expired-consent share is blocked at the gate (handler never runs)');
}

// ── 3. AI-only eligibility determination → blocked (human-in-the-loop) ───────
{
  const intent = createIntent({
    actor: { id: 'svc', role: 'system' },
    subject: { id: 'client-abc' },
    action: 'eligibility.determine', domain: 'hmis',
    payload: { determinedBy: 'ai' },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations[0].id, 'hitl.eligibility_determination');
  ok('AI-only eligibility determination is blocked (humans decide)');
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
