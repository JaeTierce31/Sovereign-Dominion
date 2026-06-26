// Canonical Intent Model
// Every execution request in Sovereign Dominion originates as an Intent.
// Subsystems receive the same semantic envelope rather than bespoke arguments.

let _seq = 0;

export function createIntent({ scenario, beamId, domain, forceFailure, label, query }) {
  return Object.freeze({
    id: `intent-${++_seq}-${Date.now()}`,
    kind: 'ui',
    objective: query || `Assess beam ${beamId} for ${label}`,
    context: { scenario, beamId, domain, label },
    constraints: ['IBC 1604', 'AISC 360'],
    compliance: forceFailure ? 'FAIL' : null, // null = unknown until QSSM runs
    requestedOutputs: ['zk-proof', 'mmr-root', 'council-verdict', 'payment', 'certificate'],
    provenance: { source: 'ui', timestamp: new Date().toISOString() },
    status: 'created',
  });
}
