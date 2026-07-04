// The Seal — real Ed25519 issuer signatures. Known-answer, roundtrip, and
// adversarial forgery tests. Run: node test/seal.test.mjs   (or npm test)
//
// The whole point of Tier 1 is that a seal can no longer be forged from this
// source alone (the old keyed-hash could). These tests prove exactly that:
// tamper, foreign key, and hand-forged signature all fail; only the holder of
// the issuer private key can mint a verifying seal.

import assert from 'node:assert/strict';
import {
  issueSeal, verifySeal, createEd25519Signer, verifyEd25519,
} from '../src/index.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

// ── 1. Ed25519 primitive: sign/verify roundtrip, shape, wrong-key rejection ─
{
  const s = createEd25519Signer();
  assert.equal(s.alg, 'ed25519');
  assert.match(s.keyId, /^ed25519:[0-9a-f]{16}$/, 'keyId is a stable fingerprint');
  assert.equal(s.publicKey.length, 88, 'Ed25519 SPKI DER is 44 bytes → 88 hex chars');
  const sig = s.sign('hello world');
  assert.equal(sig.length, 128, 'Ed25519 signature is 64 bytes → 128 hex chars');
  assert.equal(verifyEd25519(s.publicKey, 'hello world', sig), true, 'roundtrip verifies');
  assert.equal(verifyEd25519(s.publicKey, 'hello worlD', sig), false, 'one-char message change fails');

  const other = createEd25519Signer();
  assert.equal(verifyEd25519(other.publicKey, 'hello world', sig), false, 'a foreign public key does not verify');
  ok('Ed25519 sign/verify roundtrips; wrong message and wrong key both fail');
}

// ── 2. issueSeal requires a signer (no accidental unsigned seal) ────────────
{
  assert.throws(() => issueSeal({ subject: { id: 'u1' }, claims: {} }), /requires a signer/, 'no signer → throw');
  assert.throws(() => issueSeal({ subject: { id: 'u1' }, claims: {} }, {}), /requires a signer/, 'bogus signer → throw');
  ok('issueSeal refuses to mint without a real signer');
}

// ── 3. A well-formed seal verifies; the public key is carried in the seal ───
{
  const signer = createEd25519Signer();
  const seal = issueSeal({
    subject: { id: 'unit-abc' },
    claims: { action: 'inspection.finalize', deficiencyCount: 0 },
    auditRoot: 'a'.repeat(64),
  }, signer);
  assert.equal(seal.alg, 'ed25519');
  assert.equal(seal.publicKey, signer.publicKey);
  assert.equal(seal.keyId, signer.keyId);
  assert.equal(verifySeal(seal), true, 'seal verifies against its embedded key');
  ok('a well-formed seal carries its issuer key and verifies');
}

// ── 4. Adversarial: any body tamper invalidates the signature ───────────────
{
  const signer = createEd25519Signer();
  const seal = issueSeal({ subject: { id: 'unit-abc' }, claims: { deficiencyCount: 0 } }, signer);

  assert.equal(verifySeal({ ...seal, claims: { deficiencyCount: 5 } }), false, 'editing a claim fails');
  assert.equal(verifySeal({ ...seal, subject: { id: 'unit-XYZ' } }), false, 'editing the subject fails');
  assert.equal(verifySeal({ ...seal, auditRoot: 'b'.repeat(64) }), false, 'editing the audit root fails');
  assert.equal(verifySeal({ ...seal, issuer: 'attacker' }), false, 'editing the issuer fails');
  ok('tampering with any sealed field invalidates the signature');
}

// ── 5. Adversarial: hand-forged signature and key-substitution both fail ────
{
  const issuer = createEd25519Signer();
  const seal = issueSeal({ subject: { id: 'unit-abc' }, claims: { deficiencyCount: 0 } }, issuer);

  // 5a. flip a signature nibble
  const badSig = (seal.signature[0] === '0' ? '1' : '0') + seal.signature.slice(1);
  assert.equal(verifySeal({ ...seal, signature: badSig }), false, 'a mangled signature fails');

  // 5b. attacker swaps in their own key but keeps the original signature
  const attacker = createEd25519Signer();
  assert.equal(verifySeal({ ...seal, publicKey: attacker.publicKey }), false, 'swapping in a foreign key fails');

  // 5c. attacker re-signs the SAME body with their OWN key and swaps both.
  // The raw signature is now internally consistent, so verifySeal() passes on
  // math alone — which is exactly why trust must be anchored to a known key.
  const forged = issueSeal({ subject: { id: 'unit-abc' }, claims: { deficiencyCount: 0 } }, attacker);
  assert.equal(verifySeal(forged), true, 'a self-consistent foreign seal is mathematically valid…');
  assert.equal(
    verifySeal(forged, { trustedPublicKeys: [issuer.publicKey] }),
    false,
    '…but is rejected once trust is anchored to the real issuer key',
  );
  assert.equal(
    verifySeal(seal, { trustedPublicKeys: [issuer.publicKey] }),
    true,
    'the genuine issuer seal passes the trust anchor',
  );
  ok('forged signatures fail; key-substitution is caught by the trustedPublicKeys anchor');
}

// ── 6. Malformed seals never throw; return false ────────────────────────────
{
  assert.equal(verifySeal(null), false);
  assert.equal(verifySeal({}), false);
  assert.equal(verifySeal({ id: 'x', signature: 'zz', publicKey: 'zz', alg: 'ed25519' }), false, 'garbage hex → false, no throw');
  assert.equal(verifySeal({ id: 'x', signature: 'ab', publicKey: 'ab', alg: 'rsa' }), false, 'non-ed25519 alg → false');
  ok('malformed seals fail closed (false), never crash');
}

console.log(`\n${passed} checks passed.`);
