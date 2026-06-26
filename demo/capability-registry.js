// Capability Registry
// Describes every subsystem the runtime can invoke. Health is populated
// lazily from /health; falls back to 'unknown' if backend is unreachable.

const CAPABILITIES = [
  {
    name: 'QSSM',
    purpose: 'Zero-knowledge structural compliance proof',
    provider: 'wasm',
    inputs: ['beamId', 'domain', 'forceFailure'],
    outputs: ['proof', 'compliance', 'benchmarkMs'],
    health: 'unknown',
    latencyMs: null,
    version: '1.1',
  },
  {
    name: 'MMR',
    purpose: 'Merkle Mountain Range immutable audit log',
    provider: 'wasm',
    inputs: ['proof'],
    outputs: ['root', 'engine'],
    health: 'unknown',
    latencyMs: null,
    version: '1.0',
  },
  {
    name: 'SCUGS',
    purpose: 'I-beam cross-section stress heatmap visualization',
    provider: 'local',
    inputs: ['compliant', 'beamId', 'domain', 'yieldKsi', 'requiredKsi'],
    outputs: ['canvas-render'],
    health: 'ready',
    latencyMs: null,
    version: '1.0',
  },
  {
    name: 'Hermes',
    purpose: 'Multi-agent orchestration routing via NousResearch Hermes-3',
    provider: 'api',
    inputs: ['query', 'compliance', 'domain', 'beamId'],
    outputs: ['orchestration', 'agents', 'confidence'],
    health: 'unknown',
    latencyMs: null,
    version: '3.0',
  },
  {
    name: 'Council',
    purpose: 'Chromatic Council Ember+Umber deliberation via NVIDIA Nemotron',
    provider: 'api',
    inputs: ['beamId', 'domain', 'compliance'],
    outputs: ['verdict', 'harmony', 'color', 'rounds'],
    health: 'unknown',
    latencyMs: null,
    version: '1.0',
  },
  {
    name: 'Stripe',
    purpose: 'Compliance-gated PaymentIntents',
    provider: 'api',
    inputs: ['amount', 'beamId'],
    outputs: ['status', 'id'],
    health: 'unknown',
    latencyMs: null,
    version: '14.0',
  },
  {
    name: 'Esther',
    purpose: 'Voice synthesis — compliance verdict announcement',
    provider: 'local',
    inputs: ['text'],
    outputs: ['speech'],
    health: 'ready',
    latencyMs: null,
    version: '1.0',
  },
];

// Internal map for O(1) lookups
const _registry = new Map(CAPABILITIES.map(c => [c.name, { ...c }]));

export function getCapability(name) {
  return _registry.get(name) || null;
}

export function getAllCapabilities() {
  return Array.from(_registry.values());
}

// Populate health from the /health endpoint (fire-and-forget, best effort)
export async function refreshHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('http://localhost:3001/health', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return;
    const data = await res.json();

    _registry.forEach((cap) => {
      if (cap.provider === 'wasm' || cap.provider === 'local') {
        cap.health = 'ready';
      } else if (cap.name === 'Council' || cap.name === 'Hermes') {
        cap.health = data.nvidia === true ? 'ready' : 'mock';
      } else if (cap.name === 'Stripe') {
        cap.health = data.stripe === true ? 'ready' : 'mock';
      }
    });
  } catch {
    // backend unavailable — capabilities stay 'unknown', demo still runs
  }
}
