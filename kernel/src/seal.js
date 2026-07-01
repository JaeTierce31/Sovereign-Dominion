// The Seal — a portable, subject-held credential attesting a verified claim,
// carrying a proof reference and the audit root it was minted against, but NOT
// the underlying private data. For HMIS this is the client-held proof of status
// they carry between agencies and control.
//
// Skeleton signature is a mock hash. Production signs with the issuer key and,
// for selective disclosure, wraps a real proof (QSSM / BBS+ / SNARK).

import { hash } from './hash.js';

let _seq = 0;

/**
 * @param {object} spec
 * @param {object} spec.subject   who the seal is about (opaque ref, no PII required)
 * @param {object} spec.claims    the attested facts (e.g. { status: "chronic_homeless" })
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
