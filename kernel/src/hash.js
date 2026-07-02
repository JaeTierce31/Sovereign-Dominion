// Real SHA-256 (FIPS 180-4) — dependency-free, synchronous, portable (Node
// and the browser, no build step, no WebCrypto async API needed so every
// existing sync call site — audit.js's chain, charter-compiler.js's
// `sha256()` builtin, proof.js's commitment — keeps working unchanged).
//
// This used to be a placeholder (two FNV-1a passes, 16 hex chars). It's now
// a real, standard cryptographic hash, verified against NIST test vectors
// and fuzzed against Node's own `crypto.createHash('sha256')` across every
// padding-boundary length (see kernel/test/hash.test.mjs).
//
// What's still a swap point: this is the hash *primitive* — the audit
// chain's structure in audit.js is still a simple hash-chain, not the real
// Moloch Merkle Mountain Range (core/moloch-mmr, which has its own,
// separately mocked, non-SHA-256 hashing). Wiring audit.js to the real MMR
// (a Rust/WASM crate) is future work; this hash primitive can now feed it
// honestly.

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const H0 = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

function rotr(x, n) {
  return (x >>> n) | (x << (32 - n));
}

/** @param {Uint8Array} message @returns {string} 64-char hex SHA-256 digest */
export function sha256Bytes(message) {
  let paddedLen = message.length + 1;
  while (paddedLen % 64 !== 56) paddedLen++;
  paddedLen += 8;

  const padded = new Uint8Array(paddedLen);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLen = BigInt(message.length) * 8n;
  view.setUint32(paddedLen - 4, Number(bitLen & 0xffffffffn), false);
  view.setUint32(paddedLen - 8, Number((bitLen >> 32n) & 0xffffffffn), false);

  const H = H0.slice();
  const w = new Uint32Array(64);

  for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(chunkStart + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  let hex = '';
  for (let i = 0; i < 8; i++) hex += (H[i] >>> 0).toString(16).padStart(8, '0');
  return hex;
}

const textEncoder = new TextEncoder();

/** Deterministic JSON — keys sorted — so equal objects hash equally. */
export function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

/** Real SHA-256 of `input` (stringified deterministically first, if not already a string). */
export function hash(input) {
  const s = typeof input === 'string' ? input : stableStringify(input);
  return sha256Bytes(textEncoder.encode(s));
}
