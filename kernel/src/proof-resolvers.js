// Reusable proofResolver factories for the kernel's VERIFY step.
//
// The loop's VERIFY step (pipeline.js) asks a resolver for a proof object for
// each id in `intent.requiredProofs`, then checks it with `verify()`. This
// module supplies ready-made resolvers so a domain doesn't hand-roll that
// wiring, and gives the VERIFY stage its first real coverage.
//
// WHY THIS ISN'T REDUNDANT WITH THE GATE. The Constitution's
// `evidence.hash_immutability` invariant also checks
// `evidenceHash == sha256(evidenceBytes)` — but it can only do so when the raw
// `evidenceBytes` are present in the Intent payload, i.e. in the shared,
// audited envelope. The VERIFY step is where an integrity claim is checked
// WITHOUT the witness travelling in the Intent: the bytes stay on-device (the
// offline-first inspector model, ADR-003), and the resolver is handed them
// out-of-band (a device-local store on the context) to confirm the hash the
// Intent carries. So the same integrity property is enforced without raw
// evidence entering the shared record.
//
// CRYPTO HONESTY. `hashIntegrityResolver` uses real SHA-256 (hash.js), but the
// verifier here trusts the in-process prover's `holds` bit — this is an
// in-process integrity check, NOT a transferable / zero-knowledge proof a
// remote, untrusting verifier could rely on. `scheme` says so. Swapping in a
// real ZK scheme (QSSM lattice / a SNARK) is the upgrade proof.js documents;
// this resolver demonstrates the *shape* of that VERIFY seam honestly.

import { hash } from './hash.js';

/**
 * Build a resolver that proves a witness (bytes) hashes to a claimed hash.
 * @param {object} spec
 * @param {string} spec.predicateId          the requiredProofs id this handles (e.g. "evidence.hash_valid")
 * @param {(ctx:object)=>(string|undefined)} spec.getClaimedHash  reads the hash the Intent carries
 * @param {(ctx:object)=>*}                  spec.getWitnessBytes  reads the witness bytes (e.g. from a device-local store on ctx)
 * @returns {(pid:string, ctx:object)=>object|undefined}
 */
export function hashIntegrityResolver({ predicateId, getClaimedHash, getWitnessBytes }) {
  if (!predicateId || typeof getClaimedHash !== 'function' || typeof getWitnessBytes !== 'function') {
    throw new Error('hashIntegrityResolver requires { predicateId, getClaimedHash, getWitnessBytes }');
  }
  return function resolve(pid, ctx) {
    if (pid !== predicateId) return undefined; // not ours → let another resolver (or none) handle it
    const claimedHash = getClaimedHash(ctx);
    const bytes = getWitnessBytes(ctx);
    const holds = typeof claimedHash === 'string' && bytes != null && hash(bytes) === claimedHash;
    return Object.freeze({
      predicate: predicateId,
      holds,
      // Commits to the claimed hash + verdict; carries NO witness bytes.
      commitment: hash({ predicateId, claimedHash, holds }),
      scheme: 'sha256-integrity/in-process',
      mock: true, // real hash, but not a transferable/ZK proof — see file header
    });
  };
}

/**
 * Compose single-id resolvers into one. Returns the first defined proof; if no
 * resolver claims the id, returns undefined so the VERIFY step fails closed
 * (an unresolved required proof → `verify(undefined)` is false → proof_failed).
 * @param {...Function} resolvers
 */
export function composeResolvers(...resolvers) {
  return function resolve(pid, ctx) {
    for (const r of resolvers) {
      const proof = r(pid, ctx);
      if (proof !== undefined) return proof;
    }
    return undefined;
  };
}
