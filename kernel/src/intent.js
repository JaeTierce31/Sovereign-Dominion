// Intent — the one envelope every domain action flows through.
// Generalized from Sovereign Dominion's demo/intent.js: no longer beam-specific,
// so both the AEC and Housing (NSPIRE) domains speak the same contract to the kernel.

let _seq = 0;

/**
 * @param {object} spec
 * @param {object} spec.actor         who is acting (role-scoped ref)
 * @param {object} spec.subject       whom/what it concerns (client, beam, record…)
 * @param {string} spec.action        e.g. "inspection.submit_evidence", "inspection.finalize"
 * @param {string} spec.domain        "housing" | "aec" | …
 * @param {*}      [spec.payload]      domain data (NSPIRE-conformant record for Housing)
 * @param {string[]} [spec.requiredProofs]  proof predicate ids the gate must verify
 * @param {string} [spec.purpose]     declared, logged purpose of the action
 */
export function createIntent(spec = {}) {
  const {
    actor = null, subject = null, action = 'unknown',
    domain = 'unknown', payload = null, requiredProofs = [], purpose = null,
  } = spec;

  return Object.freeze({
    id: `intent-${++_seq}-${Date.now()}`,
    actor, subject, action, domain,
    payload,
    requiredProofs: Object.freeze([...requiredProofs]),
    purpose,
    provenance: Object.freeze({ source: 'kernel', timestamp: new Date().toISOString() }),
    status: 'created',
  });
}
