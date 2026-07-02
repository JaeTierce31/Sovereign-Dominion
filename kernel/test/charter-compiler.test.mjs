// Charter compiler smoke test — proves constitution/*.yaml is genuinely
// machine-checkable, not just an illustrative sketch. Compiles both charter
// files in ../../constitution and evaluates the housing-inspection charter's
// invariants against constructed scenarios.
//
// Run: node test/charter-compiler.test.mjs   (or npm test, which runs this
// alongside kernel.test.mjs). Needs the js-yaml devDependency:
//   npm install --prefix kernel

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { compileCharter, compilePredicate } from '../src/charter-compiler.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

function loadCharter(relativePath) {
  return load(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

const housingCharter = loadCharter('../../constitution/charter.housing-inspection.example.yaml');
const legacyCharter = loadCharter('../../constitution/charter.example.yaml');

// ── 1. Both charters compile without throwing ──────────────────────────────
{
  const compiled = compileCharter(housingCharter);
  assert.equal(compiled.meta.domain, 'housing');
  assert.ok(compiled.invariants.length >= 7, 'housing charter has its full invariant set');
  ok(`housing-inspection charter compiles (${compiled.invariants.length} invariants)`);
}
{
  // The legacy (illustrative, superseded-domain) charter references a
  // custom `allowedPurposes` function — supply it so purpose_limitation
  // compiles too. This charter isn't wired into any live gate; the point is
  // proving the DSL itself is fully general, not specific to one domain.
  const compiled = compileCharter(legacyCharter, { functions: { allowedPurposes: () => [] } });
  assert.ok(compiled.invariants.length >= 8, 'legacy charter has its full invariant set');
  ok(`legacy (illustrative) HMIS charter also compiles (${compiled.invariants.length} invariants) — same DSL`);
}

const NSPIRE_ORDINALS = { low: 0, moderate: 1, severe: 2, life_threatening: 3 };
const compiled = compileCharter(housingCharter, { ordinals: NSPIRE_ORDINALS });
const byId = Object.fromEntries(compiled.invariants.map((i) => [i.id, i]));

// ── 2. inspector.credential_valid ───────────────────────────────────────────
{
  const activeCtx = {
    intent: {
      action: 'inspection.submit_evidence',
      actor: { credential: { kind: 'nspire_inspector', status: 'active', expiresAt: Date.now() + 1e7 } },
    },
    now: () => Date.now(),
  };
  const expiredCtx = {
    intent: {
      action: 'inspection.submit_evidence',
      actor: { credential: { kind: 'nspire_inspector', status: 'active', expiresAt: Date.now() - 1 } },
    },
    now: () => Date.now(),
  };
  const inv = byId['inspector.credential_valid'];
  assert.equal(inv.appliesWhen(activeCtx), true);
  assert.equal(inv.mustHold(activeCtx), true);
  assert.equal(inv.mustHold(expiredCtx), false);
  ok('inspector.credential_valid: active passes, expired fails');
}

// ── 3. evidence.chain_of_custody ────────────────────────────────────────────
// Note: this charter's inspection.submit_evidence invariants treat
// `intent.payload` as *being* the InspectionEvidence record directly (flat:
// payload.previousHash, payload.evidenceHash), not wrapped under `.evidence`.
{
  const okCtx = {
    intent: { action: 'inspection.submit_evidence', payload: { previousHash: 'abc123' } },
    subject: { evidenceChain: { lastHash: 'abc123' } },
  };
  const brokenCtx = {
    intent: { action: 'inspection.submit_evidence', payload: { previousHash: 'deadbeef' } },
    subject: { evidenceChain: { lastHash: 'abc123' } },
  };
  const inv = byId['evidence.chain_of_custody'];
  assert.equal(inv.mustHold(okCtx), true);
  assert.equal(inv.mustHold(brokenCtx), false);
  ok('evidence.chain_of_custody: matching hash passes, mismatch fails');
}

// ── 4. inspection.dual_attestation ──────────────────────────────────────────
{
  const twoHumans = {
    intent: {
      action: 'inspection.finalize',
      payload: { attestations: [{ actorId: 'insp-1', kind: 'human' }, { actorId: 'insp-2', kind: 'human' }] },
    },
  };
  const oneHuman = {
    intent: { action: 'inspection.finalize', payload: { attestations: [{ actorId: 'insp-1', kind: 'human' }] } },
  };
  const humanPlusAi = {
    intent: {
      action: 'inspection.finalize',
      payload: { attestations: [{ actorId: 'insp-1', kind: 'human' }, { actorId: 'ai-svc', kind: 'ai' }] },
    },
  };
  const inv = byId['inspection.dual_attestation'];
  assert.equal(inv.mustHold(twoHumans), true);
  assert.equal(inv.mustHold(oneHuman), false);
  assert.equal(inv.mustHold(humanPlusAi), false, 'AI attestation must not count toward dual human sign-off');
  ok('inspection.dual_attestation: 2 humans passes; 1 human or human+AI fails');
}

// ── 5. deficiency.severity_disclosure (ordinal comparison, not lexicographic) ─
{
  // Lexicographically 'low' > 'life_threatening' ('l''o' > 'l''i'), which
  // would be WRONG if the compiler fell back to plain string comparison.
  // The `ordinals` option must be what decides `>=` here.
  const honest = {
    intent: {
      action: 'inspection.finalize',
      payload: { deficiencies: [{ recordedSeverity: 'life_threatening', evidenceImpliedSeverity: 'life_threatening' }] },
    },
  };
  const downgraded = {
    intent: {
      action: 'inspection.finalize',
      payload: { deficiencies: [{ recordedSeverity: 'low', evidenceImpliedSeverity: 'life_threatening' }] },
    },
  };
  const inv = byId['deficiency.severity_disclosure'];
  assert.equal(inv.mustHold(honest), true);
  assert.equal(inv.mustHold(downgraded), false, 'downgrading life_threatening to low must be caught');
  ok('deficiency.severity_disclosure: ordinal rank enforced, not lexicographic string order');
}

// ── 6. audit.append_only ────────────────────────────────────────────────────
{
  const inv = byId['audit.append_only'];
  assert.equal(inv.appliesWhen({ intent: { action: 'audit.append' } }), true);
  assert.equal(inv.appliesWhen({ intent: { action: 'inspection.finalize' } }), false);
  assert.equal(inv.mustHold({ intent: { action: 'audit.append' } }), true);
  assert.equal(inv.mustHold({ intent: { action: 'audit.delete' } }), false);
  ok('audit.append_only: startsWith gating + equality both work');
}

// ── 7. legacy charter's `in` / `subsetOf` infix-word operators ──────────────
{
  const predIn = compilePredicate("intent.recipient in subject.consent.roi.agencies");
  assert.equal(predIn({ intent: { recipient: 'agency-a' }, subject: { consent: { roi: { agencies: ['agency-a', 'agency-b'] } } } }), true);
  assert.equal(predIn({ intent: { recipient: 'agency-z' }, subject: { consent: { roi: { agencies: ['agency-a'] } } } }), false);

  const predSubset = compilePredicate('intent.categories subsetOf subject.consent.roi.categories');
  assert.equal(predSubset({ intent: { categories: ['x'] }, subject: { consent: { roi: { categories: ['x', 'y'] } } } }), true);
  assert.equal(predSubset({ intent: { categories: ['x', 'z'] }, subject: { consent: { roi: { categories: ['x', 'y'] } } } }), false);
  ok("'in' and 'subsetOf' infix-word operators evaluate correctly");
}

console.log(`\n${passed} checks passed.`);
