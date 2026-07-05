// Visual domain — the full governed-generation vertical slice, honestly wired:
//
//   submit VGL blueprint → GATE (charter) → EXECUTE (Bria generator seam +
//   C2PA-style provenance manifest) → OBSERVE (MMR) → SEAL (Ed25519, binding the
//   generation result via resultRef) → PERSIST (InMemoryLedger, the Tier 2 seam).
//
// Proves the three seams added this round work end to end against the real kernel,
// with the honest boundaries intact: the generator runs OFFLINE (no Bria key, so no
// fabricated image), and the provenance manifest is C2PA-*shaped* (hashed + sealed,
// not cert-signed). Run: node test/visual-pipeline.integration.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import {
  createIntent, Constitution, CapabilityRegistry, AuditLog, createKernel,
  verifySeal, hash, InMemoryLedger,
} from '../src/index.js';
import { compileCharter } from '../src/charter-compiler.js';
import { createBriaGenerator } from '../../domain-visual/generator.js';
import { buildC2paManifest } from '../../domain-visual/provenance.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

const charterObj = load(
  readFileSync(new URL('../../constitution/charter.visual-generation.example.yaml', import.meta.url), 'utf8')
);
const { invariants } = compileCharter(charterObj);

const generator = createBriaGenerator(); // no apiKey → offline stub
const ledger = new InMemoryLedger();
const constitution = new Constitution(invariants);
const registry = new CapabilityRegistry();
registry.register({
  domain: 'visual',
  actions: [
    {
      name: 'visual.generate',
      handler: async (intent) => {
        const blueprint = intent.payload.blueprintBytes;
        const gen = await generator.generate(blueprint);
        const prov = buildC2paManifest({
          assetId: intent.subject.id,
          blueprintHash: intent.payload.blueprintHash,
          generatorModel: gen.model,
          rendered: gen.rendered,
        });
        return {
          assetId: intent.subject.id,
          rendered: gen.rendered,
          generatorMode: generator.mode,
          blueprintHash: intent.payload.blueprintHash,
          c2paManifestHash: prov.manifestHash,
        };
      },
    },
  ],
  invariants,
});
const audit = new AuditLog();
const kernel = createKernel({ constitution, registry, audit, ledger });

function blueprint() {
  return JSON.stringify({
    short_description: 'a hexagonal brand logo on white',
    objects: [{ description: 'hexagon', bounding_box: [0.3, 0.3, 0.4, 0.4] }],
    style_medium: 'vector art',
  });
}

function generateIntent() {
  const bytes = blueprint();
  return createIntent({
    actor: { id: 'designer-1', role: 'operator' },
    subject: { id: 'asset-pipeline-1' },
    action: 'visual.generate', domain: 'visual', purpose: 'brand_asset',
    payload: {
      blueprintBytes: bytes,
      blueprintHash: hash(bytes),
      sourceAssets: [{ id: 'stock-1', license: 'bria-licensed' }],
      moderation: { status: 'cleared' },
      epistemic: { confidence: 'high' },
      output: { syntheticMarked: true },
    },
  });
}

// ── 1. Governed generation runs through the full loop and is sealed ─────────
let sealedResult;
{
  const r = await kernel.submitIntent(generateIntent());
  assert.equal(r.status, 'sealed');
  assert.ok(verifySeal(r.seal), 'the sealed governed generation verifies (Ed25519)');
  sealedResult = r;
  ok('a governed VGL generation runs gate → generate → manifest → seal → persist');
}

// ── 2. The generator ran OFFLINE — no image fabricated (honest boundary) ────
{
  assert.equal(sealedResult.result.generatorMode, 'offline');
  assert.equal(sealedResult.result.rendered, false, 'no Bria key → no fabricated image');
  ok('the Bria generator seam ran offline and did not fabricate an image');
}

// ── 3. A C2PA-style provenance manifest was produced and hashed ─────────────
{
  assert.match(sealedResult.result.c2paManifestHash, /^[0-9a-f]{64}$/, 'manifest hash is real SHA-256');
  const prov = buildC2paManifest({ assetId: 'asset-pipeline-1', blueprintHash: sealedResult.result.blueprintHash, rendered: false });
  assert.equal(prov.manifest.signed, false, 'honest: the manifest is C2PA-shaped, not cert-signed');
  ok('a C2PA-style provenance manifest is built, hashed, and marked unsigned');
}

// ── 4. The Seal cryptographically binds the generation result (resultRef) ───
{
  assert.equal(sealedResult.seal.claims.resultRef, hash(sealedResult.result), 'seal commits to the exact result');
  // Tampering with the result would break the binding.
  assert.notEqual(sealedResult.seal.claims.resultRef, hash({ ...sealedResult.result, rendered: true }));
  ok('the Seal binds the generation result + manifest hash via resultRef');
}

// ── 5. The sealed record is persisted to the ledger (Tier 2 seam) ───────────
{
  assert.equal(ledger.size, 1, 'exactly one sealed record persisted');
  const stored = ledger.get(sealedResult.seal.id);
  assert.ok(stored, 'the sealed record is retrievable by seal id');
  assert.equal(stored.auditRoot, sealedResult.audit.root, 'the persisted audit root matches the seal');
  assert.equal(stored.action, 'visual.generate');
  ok('the sealed generation is durably persisted to the ledger (InMemoryLedger)');
}

// ── 6. The whole path is provably in the MMR audit ──────────────────────────
{
  assert.equal(audit.verify(), true);
  assert.equal(audit.verifyInclusion(0), true, 'the governed generation is provably in the MMR');
  ok('the governed generation is captured in a tamper-evident MMR audit log');
}

// ── 7. A blocked Intent is NOT persisted (only sealed outcomes reach the ledger)
{
  const bad = createIntent({
    actor: { id: 'designer-1', role: 'operator' },
    subject: { id: 'asset-bad' },
    action: 'visual.generate', domain: 'visual',
    payload: {
      blueprintBytes: blueprint(), blueprintHash: hash('mismatch'),
      sourceAssets: [{ id: 's', license: 'bria-licensed' }],
      moderation: { status: 'cleared' }, epistemic: { confidence: 'high' },
      output: { syntheticMarked: true },
    },
  });
  const r = await kernel.submitIntent(bad);
  assert.equal(r.status, 'blocked');
  assert.equal(ledger.size, 1, 'a blocked Intent must not be persisted');
  ok('a blocked Intent is never persisted to the ledger (only sealed outcomes are)');
}

console.log(`\n${passed} checks passed.`);
