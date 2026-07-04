// Merkle Mountain Range (MMR) — a real, append-only cryptographic accumulator.
//
// This replaces the audit log's simple hash-chain (and the placeholder
// `core/moloch-mmr` crate's XOR-fold hashing) with a genuine MMR over the real
// SHA-256 primitive in hash.js. It is tamper-evident like a hash-chain, but
// additionally gives O(log n) **inclusion proofs**: a third party holding only
// the root can be shown that a specific leaf is committed, without the whole log.
//
// Structure. An MMR of n leaves is a forest of perfect binary trees ("peaks")
// whose sizes are the set bits of n (n = 11 → peaks of 8, 2, 1). Appending a
// leaf may merge equal-height peaks, carry-style. The single root is obtained by
// "bagging the peaks": folding them right-to-left, each peak on the left of the
// running bag  —  root = H(p0 ‖ H(p1 ‖ … ‖ p_last)).
//
// Domain separation (RFC 6962 style) prevents second-preimage / peak-confusion
// attacks: a leaf is H(0x00 ‖ data), an internal node is H(0x01 ‖ left ‖ right),
// so a leaf preimage can never be reinterpreted as an internal node.
//
// Everything below is real SHA-256 (hash.js · sha256Bytes). `verifyMmrProof` is
// deliberately **stateless** — it takes only (leafData, proof, root), so it
// models exactly what a remote verifier can check.

import { sha256Bytes } from './hash.js';

const LEAF_PREFIX = 0x00;
const NODE_PREFIX = 0x01;

const _enc = new TextEncoder();
// Root of the empty MMR — a fixed domain constant, never a valid leaf/node hash.
const EMPTY_ROOT = sha256Bytes(_enc.encode('sovereign-mmr/v1/empty'));

function hexToBytes(hex) {
  const len = hex.length >> 1;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** H(0x00 ‖ data) — a leaf commitment. `dataHex` is a hex string (e.g. a record hash). */
function leafHash(dataHex) {
  const d = hexToBytes(dataHex);
  const buf = new Uint8Array(1 + d.length);
  buf[0] = LEAF_PREFIX;
  buf.set(d, 1);
  return sha256Bytes(buf);
}

/** H(0x01 ‖ left ‖ right) — an internal node. Both args are 64-char hex hashes. */
function nodeHash(leftHex, rightHex) {
  const l = hexToBytes(leftHex);
  const r = hexToBytes(rightHex);
  const buf = new Uint8Array(1 + l.length + r.length);
  buf[0] = NODE_PREFIX;
  buf.set(l, 1);
  buf.set(r, 1 + l.length);
  return sha256Bytes(buf);
}

/** Sizes of the perfect trees making up an n-leaf MMR — the set bits of n, descending. */
function peakSizes(n) {
  const sizes = [];
  let p = 1;
  while (p <= n) p <<= 1;
  p >>= 1;
  for (; p >= 1; p >>= 1) if (n & p) sizes.push(p);
  return sizes;
}

/** Root of a perfect binary tree over leafHashes[start, start+size) (size a power of two). */
function perfectRoot(leafHashes, start, size) {
  let layer = leafHashes.slice(start, start + size);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(nodeHash(layer[i], layer[i + 1]));
    layer = next;
  }
  return layer[0];
}

/** The peaks of the MMR: [{ hash, start, size }], left to right. */
function computePeaks(leafHashes) {
  const peaks = [];
  let start = 0;
  for (const size of peakSizes(leafHashes.length)) {
    peaks.push({ hash: perfectRoot(leafHashes, start, size), start, size });
    start += size;
  }
  return peaks;
}

/** Bag peaks right-to-left into the single MMR root. */
function bagPeaks(peaks) {
  if (peaks.length === 0) return EMPTY_ROOT;
  let bag = peaks[peaks.length - 1].hash;
  for (let i = peaks.length - 2; i >= 0; i--) bag = nodeHash(peaks[i].hash, bag);
  return bag;
}

/** Merkle path from global leaf `index` up to its peak, within that peak's perfect tree. */
function intraPeakPath(leafHashes, start, size, index) {
  const path = [];
  let layer = leafHashes.slice(start, start + size);
  let pos = index - start;
  while (layer.length > 1) {
    const isRight = pos & 1;
    const sibling = layer[isRight ? pos - 1 : pos + 1];
    path.push({ hash: sibling, side: isRight ? 'left' : 'right' });
    const next = [];
    for (let i = 0; i < layer.length; i += 2) next.push(nodeHash(layer[i], layer[i + 1]));
    layer = next;
    pos >>= 1;
  }
  return path;
}

/**
 * An append-only Merkle Mountain Range over hex leaf data.
 * Each appended `dataHex` (a hex string, e.g. a SHA-256 record commitment) becomes
 * a leaf H(0x00 ‖ data). Roots and proofs are computed over real SHA-256.
 */
export class MerkleMountainRange {
  constructor() {
    this._data = [];        // the raw hex leaf data, in append order
    this._leafHashes = [];  // H(0x00 ‖ data) for each
  }

  /** Append a leaf; returns { leafIndex, leafHash, root }. */
  append(dataHex) {
    if (typeof dataHex !== 'string' || !/^[0-9a-f]+$/i.test(dataHex) || dataHex.length % 2 !== 0) {
      throw new TypeError('MMR leaf data must be an even-length hex string');
    }
    const leafIndex = this._data.length;
    const lh = leafHash(dataHex);
    this._data.push(dataHex);
    this._leafHashes.push(lh);
    return { leafIndex, leafHash: lh, root: this.root() };
  }

  get size() { return this._data.length; }

  /** The current MMR root (a 64-char hex hash); EMPTY_ROOT when no leaves. */
  root() { return bagPeaks(computePeaks(this._leafHashes)); }

  /** The current peak hashes, left to right. */
  peaks() { return computePeaks(this._leafHashes).map((p) => p.hash); }

  /**
   * An inclusion proof for leaf `index`:
   *   { leafIndex, size, intra:[{hash,side}], leftPeaks:[hash…], rightBag: hash|null }
   * `intra` climbs to the containing peak; `leftPeaks` are the peaks to its left
   * (folded in reverse at verify time); `rightBag` is everything to its right,
   * pre-bagged. Verifiable statelessly against the root by `verifyMmrProof`.
   */
  proof(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this._data.length) {
      throw new RangeError(`leaf index ${index} out of range (size ${this._data.length})`);
    }
    const peaks = computePeaks(this._leafHashes);
    const t = peaks.findIndex((p) => index >= p.start && index < p.start + p.size);
    const peak = peaks[t];
    const intra = intraPeakPath(this._leafHashes, peak.start, peak.size, index);
    const leftPeaks = peaks.slice(0, t).map((p) => p.hash);
    const rightPeaks = peaks.slice(t + 1).map((p) => p.hash);
    let rightBag = null;
    if (rightPeaks.length) {
      rightBag = rightPeaks[rightPeaks.length - 1];
      for (let i = rightPeaks.length - 2; i >= 0; i--) rightBag = nodeHash(rightPeaks[i], rightBag);
    }
    return { leafIndex: index, size: this._data.length, intra, leftPeaks, rightBag };
  }

  /** Convenience: recompute + verify leaf `index`'s own inclusion against the live root. */
  verify(index) {
    return verifyMmrProof(this._data[index], this.proof(index), this.root());
  }
}

/**
 * Stateless inclusion check — everything a remote verifier holding only the root needs.
 * @param {string} dataHex   the claimed leaf data (hex)
 * @param {object} proof     as returned by MerkleMountainRange#proof
 * @param {string} root      the MMR root to check against
 * @returns {boolean}
 */
export function verifyMmrProof(dataHex, proof, root) {
  if (!proof || !Array.isArray(proof.intra) || !Array.isArray(proof.leftPeaks)) return false;
  let cur;
  try {
    cur = leafHash(dataHex);
  } catch {
    return false;
  }
  for (const step of proof.intra) {
    if (!step || (step.side !== 'left' && step.side !== 'right')) return false;
    cur = step.side === 'left' ? nodeHash(step.hash, cur) : nodeHash(cur, step.hash);
  }
  if (proof.rightBag) cur = nodeHash(cur, proof.rightBag);
  for (let i = proof.leftPeaks.length - 1; i >= 0; i--) cur = nodeHash(proof.leftPeaks[i], cur);
  return cur === root;
}
