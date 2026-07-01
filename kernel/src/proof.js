// Zero-knowledge proof interface — prove/verify a predicate over a private witness
// WITHOUT exposing the witness. Skeleton uses a deterministic mock; production
// binds to QSSM (core/qssm-rs) or a chosen SNARK. NOTE (crypto honesty): QSSM's
// post-quantum lattice claim and a curve-based SNARK are different trust models —
// pick one per deployment and record it here.

import { hash } from './hash.js';

/**
 * Produce a proof that `predicateId` holds for a private `witness`.
 * The returned object carries NO witness fields — only a commitment + verdict.
 * @param {string} predicateId  e.g. "eligibility.chronic_homeless_ge_12mo"
 * @param {(w:object)=>boolean} evaluate  the predicate, run privately here
 * @param {object} witness  private inputs — never leave this function in the clear
 */
export async function prove(predicateId, evaluate, witness) {
  const holds = !!evaluate(witness);
  return Object.freeze({
    predicate: predicateId,
    holds,
    commitment: hash({ predicateId, holds, salt: hash(witness) }),
    scheme: 'mock',   // TODO: 'qssm-lattice' | 'nova-snark' — and drop the other's claim
    mock: true,
  });
}

/** Verify a proof object. Skeleton checks structure + records the scheme. */
export async function verify(proof) {
  return !!proof && typeof proof.commitment === 'string' && proof.holds === true;
}
