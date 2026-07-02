// The Seal — a portable, subject-held credential attesting a verified claim,
// carrying a proof reference and the audit root it was minted against, but NOT
// the underlying private data. For Housing (NSPIRE) this is the inspector- or
// owner-held proof that a unit's inspection evidence was verified and sealed.
//
// Skeleton signature: a real SHA-256 (hash.js) of the seal body keyed with a
// hardcoded shared string — the hash itself is real, but this is not a real
// signature scheme (no issuer keypair, no asymmetric crypto, so anyone with
// this source can forge one). Production signs with a real issuer key and,
// for selective disclosure, wraps a real proof (QSSM / BBS+ / SNARK).

import { hash } from './hash.js';

let _seq = 0;

/**
 * @param {object} spec
 * @param {object} spec.subject   who the seal is about (opaque ref, no PII required)
 * @param {object} spec.claims    the attested facts (e.g. { unitId, deficiencyCount: 0 })
 * @param {object} [spec.proof]   proof object from proof.js (holds === true)
 * @param {string} [spec.auditRoot]  MMR/audit root at issuance
 * @param {string} [spec.issuer]
 */
export function issueSeal(spec) {
  const { subject, claims, proof = null, auditRoot = null, issuer = 'sovereign' } = spec;
  const body = {
    id: `seal-${++_seq}-${Date.now()}`,
    subject, claims,
    proofRef: proof ? proof.commitment : null,
    scheme: proof ? proof.scheme : null,
    auditRoot,
    issuer,
    issuedAt: new Date().toISOString(),
  };
  const signature = hash({ body, key: 'MOCK-ISSUER-KEY' }); // TODO: real issuer signature
  return Object.freeze({ ...body, signature });
}

/** Structural + signature check. Production also checks the issuer key + proof. */
export function verifySeal(seal) {
  if (!seal || !seal.id || !seal.signature) return false;
  const { signature, ...body } = seal;
  return hash({ body, key: 'MOCK-ISSUER-KEY' }) === signature;
}
