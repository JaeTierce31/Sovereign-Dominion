// The Seal — a portable, subject-held credential attesting a verified claim,
// carrying a proof reference and the audit root it was minted against, but NOT
// the underlying private data. For Housing (NSPIRE) this is the inspector- or
// owner-held proof that a unit's inspection evidence was verified and sealed.
//
// Signature: a **real Ed25519 issuer signature** (ed25519.js) over the
// deterministically-serialized seal body. This is genuine asymmetric
// non-repudiation — the exact property NSPIRE evidence needs (see ROADMAP §0):
// only the holder of the issuer private key can mint a seal, and any third
// party can verify it from the embedded public key. The signature scheme is
// real; key *custody* is dev-grade until a KMS/HSM backs the signer (the
// createEd25519Signer seam). No shared secret, no keyed hash — a seal can no
// longer be forged from this source alone.

import { stableStringify } from './hash.js';
import { verifyEd25519 } from './ed25519.js';

let _seq = 0;

/**
 * @param {object} spec
 * @param {object} spec.subject   who the seal is about (opaque ref, no PII required)
 * @param {object} spec.claims    the attested facts (e.g. { unitId, deficiencyCount: 0 })
 * @param {object} [spec.proof]   proof object from proof.js (holds === true)
 * @param {string} [spec.auditRoot]  MMR/audit root at issuance
 * @param {string} [spec.issuer]
 * @param {object} signer  an Ed25519 signer ({ alg, keyId, publicKey, sign }) — required.
 */
export function issueSeal(spec, signer) {
  if (!signer || typeof signer.sign !== 'function' || !signer.publicKey) {
    throw new Error('issueSeal requires a signer, e.g. createEd25519Signer()');
  }
  const { subject, claims, proof = null, auditRoot = null, issuer = 'sovereign' } = spec;
  const body = {
    id: `seal-${++_seq}-${Date.now()}`,
    subject, claims,
    proofRef: proof ? proof.commitment : null,
    scheme: proof ? proof.scheme : null,
    auditRoot,
    issuer,
    issuedAt: new Date().toISOString(),
    alg: signer.alg,
    keyId: signer.keyId,
    publicKey: signer.publicKey,
  };
  const signature = signer.sign(stableStringify(body));
  return Object.freeze({ ...body, signature });
}

/**
 * Verify a seal's issuer signature.
 * @param {object} seal
 * @param {object} [opts]
 * @param {string[]} [opts.trustedPublicKeys]  if given, the seal's public key must be one of these
 *   (raw-signature validity alone does not establish *which* issuer to trust).
 * @returns {boolean}
 */
export function verifySeal(seal, opts = {}) {
  if (!seal || !seal.id || !seal.signature || !seal.publicKey || seal.alg !== 'ed25519') return false;
  const { signature, ...body } = seal;
  if (!verifyEd25519(seal.publicKey, stableStringify(body), signature)) return false;
  if (opts.trustedPublicKeys && !opts.trustedPublicKeys.includes(seal.publicKey)) return false;
  return true;
}
