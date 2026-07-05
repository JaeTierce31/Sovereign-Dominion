// Integration proof for the Visual Generation domain — the honest core of the
// "Constitutional VGL" synthesis (docs/BRIA-VGL-SYNTHESIS.md).
//
// A Bria-style VGL blueprint (structured_prompt) is the *payload* of a real kernel
// Intent, and the actual createKernel() pipeline gates it against invariants compiled
// straight from constitution/charter.visual-generation.example.yaml — then seals with
// the real Ed25519 signer and records to the real MMR audit. This proves the synthesis
// end-to-end on the same kernel that serves AEC and Housing; it does NOT invoke Z3,
// OPA, TLA+, or any multi-agent council (none of which exist — see the doc).

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
  readFileSync(new URL('../../constitution/charter.visual-generation.example.yaml', import.meta.url), 'utf8')
);
const { invariants } = compileCharter(charterObj);

// A tiny stand-in for a governed asset store (the role a real ledger service would play).
const released = [];
const constitution = new Constitution(invariants);
const registry = new CapabilityRegistry();
registry.register({
  domain: 'visual',
  actions: [
    { name: 'visual.generate', handler: (intent) => ({ blueprintHash: intent.payload.blueprintHash, generated: true }) },
    { name: 'visual.release', handler: (intent) => { released.push(intent.subject.id); return { released: true, assetId: intent.subject.id }; } },
  ],
  invariants,
});
const audit = new AuditLog();
const kernel = createKernel({ constitution, registry, audit });

// A minimal, valid VGL blueprint (Bria's structured_prompt, trimmed to essentials).
function blueprint(overrides = {}) {
  return JSON.stringify({
    short_description: 'a hexagonal brand logo on white',
    objects: [{ description: 'hexagon', bounding_box: [0.3, 0.3, 0.4, 0.4] }],
    style_medium: 'vector art',
    ...overrides,
  });
}

// Build a governed generate Intent; overrides let each test bend one field.
function generateIntent(over = {}) {
  const bytes = over.blueprintBytes ?? blueprint();
  const p = {
    blueprintBytes: bytes,
    blueprintHash: over.blueprintHash ?? hash(bytes),
    sourceAssets: over.sourceAssets ?? [{ id: 'stock-1', license: 'bria-licensed' }],
    moderation: over.moderation ?? { status: 'cleared' },
    epistemic: over.epistemic ?? { confidence: 'high' },
    output: over.output ?? { syntheticMarked: true },
  };
  return createIntent({
    actor: { id: 'designer-1', role: 'operator' },
    subject: { id: over.assetId ?? 'asset-abc' },
    action: 'visual.generate', domain: 'visual', purpose: 'brand_asset',
    payload: p,
  });
}

// ── 1. A fully-governed generation → sealed (Ed25519) and audited (MMR) ─────
{
  const r = await kernel.submitIntent(generateIntent());
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal), 'the governed VGL seal verifies (real Ed25519)');
  assert.equal(r.seal.claims.domain, 'visual');
  ok('a fully-governed VGL blueprint is gated, executed, sealed, and audited');
}

// ── 2. A tampered blueprint (hash ≠ bytes) → blocked at the gate ────────────
{
  const r = await kernel.submitIntent(generateIntent({ blueprintHash: hash('a different blueprint') }));
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('provenance.blueprint_integrity'), true);
  ok('a blueprint whose declared hash does not match its bytes is blocked (content integrity)');
}

// ── 3. An unlicensed source asset → blocked (Bria licensed-data layer) ──────
{
  const r = await kernel.submitIntent(generateIntent({
    sourceAssets: [{ id: 'scraped-1', license: 'none' }],
  }));
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('provenance.licensed_inputs'), true);
  ok('a generation drawing on an unlicensed input is blocked (licensed-inputs invariant)');
}

// ── 4. Moderation not cleared → blocked (fails closed) ──────────────────────
{
  const r = await kernel.submitIntent(generateIntent({ moderation: { status: 'flagged' } }));
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('safety.moderation_cleared'), true);
  ok('a generation whose moderation is not cleared is blocked (safety fails closed)');
}

// ── 5. Missing/invalid confidence → blocked (uncertainty must be visible) ───
{
  const r = await kernel.submitIntent(generateIntent({ epistemic: { confidence: 'certain' } }));
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('epistemic.confidence_visible'), true);
  ok('a generation with an out-of-scale confidence is blocked (crypto honesty on output)');
}

// ── 6. An unmarked output → blocked (synthetic disclosure required) ─────────
{
  const r = await kernel.submitIntent(generateIntent({ output: { syntheticMarked: false } }));
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('disclosure.synthetic_marking'), true);
  ok('an output not marked synthetic is blocked (C2PA-style disclosure)');
}

// ── 7. Release without a human attestation → blocked (humans attest) ────────
{
  const intent = createIntent({
    actor: { id: 'designer-1', role: 'operator' },
    subject: { id: 'asset-abc' },
    action: 'visual.release', domain: 'visual',
    payload: { output: { syntheticMarked: true }, attestations: [{ actorId: 'model-x', kind: 'ai' }] },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'blocked');
  assert.equal(r.violations.map((v) => v.id).includes('governance.human_release_attestation'), true);
  assert.equal(released.includes('asset-abc'), false, 'nothing released on an AI-only attestation');
  ok('a release on an AI-only attestation is blocked (humans attest; AI assists)');
}

// ── 8. Release with a human attestation + synthetic mark → sealed ──────────
{
  const intent = createIntent({
    actor: { id: 'reviewer-1', role: 'reviewer' },
    subject: { id: 'asset-abc' },
    action: 'visual.release', domain: 'visual',
    payload: { output: { syntheticMarked: true }, attestations: [{ actorId: 'reviewer-1', kind: 'human' }] },
  });
  const r = await kernel.submitIntent(intent);
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal));
  assert.equal(released.includes('asset-abc'), true, 'the governed asset was released');
  ok('a release with a human attestation and synthetic mark is sealed');
}

// ── 9. The whole run left a tamper-evident MMR trail ───────────────────────
{
  assert.equal(audit.verify(), true);
  assert.equal(audit.verifyInclusion(0), true, 'the first governed generation is provably in the MMR');
  assert.ok(audit.length() >= 8, 'every submitIntent left a record, sealed or blocked');
  ok('the full visual-generation run is captured in a tamper-evident MMR audit log');
}

console.log(`\n${passed} checks passed.`);
