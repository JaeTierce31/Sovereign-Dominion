// Tiny dependency-free, synchronous, portable hash for the audit chain.
// PLACEHOLDER — the production kernel binds this to the Rust/WASM Moloch MMR
// (core/moloch-mmr) and QSSM. Good enough to make the tamper-evident chain
// demonstrable in Node and the browser without a build step.

export function hash(input) {
  const s = typeof input === 'string' ? input : stableStringify(input);
  // Two independent FNV-1a passes → 16 hex chars, order-sensitive.
  let h1 = 0x811c9dc5, h2 = 0xc59d1c81;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193);
    h2 ^= c; h2 = Math.imul(h2 ^ (c << 5), 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

// Deterministic JSON — keys sorted — so equal objects hash equally.
export function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}
