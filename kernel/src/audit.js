// Immutable audit — tamper-evident, append-only log, backed by a real Merkle
// Mountain Range (mmr.js) over the real SHA-256 primitive (hash.js).
//
// Each appended entry is frozen into a positioned record; the record's SHA-256
// commitment becomes an MMR leaf. This keeps the previous behaviour (any
// retro-edit changes the root) AND adds what a hash-chain can't give: O(log n)
// **inclusion proofs** a third party can verify from the root alone (proof() /
// verifyInclusion()). This replaces both the old hash-chain here and the
// placeholder `core/moloch-mmr` crate's non-SHA-256 hashing.
//
// Public API is unchanged (append/root/length/entries/verify) so callers —
// pipeline.js's OBSERVE step, the integration tests — keep working; proof() and
// verifyInclusion() are additive.

import { hash } from './hash.js';
import { MerkleMountainRange, verifyMmrProof } from './mmr.js';

export class AuditLog {
  constructor() {
    this._records = [];   // [{ record, leafData }]
    this._mmr = new MerkleMountainRange();
    this._committedRoot = this._mmr.root();   // EMPTY_ROOT until the first append
  }

  /** Append an entry; returns { index, leaf, root }. Entries are never mutated. */
  append(entry) {
    const index = this._records.length;
    const record = Object.freeze({ index, at: new Date().toISOString(), entry: freezeDeep(entry) });
    const leafData = hash(record);                    // real SHA-256 commitment to the record
    const { leafHash, root } = this._mmr.append(leafData);
    this._records.push({ record, leafData });
    this._committedRoot = root;
    return { index, leaf: leafHash, root };
  }

  root() { return this._committedRoot; }
  length() { return this._records.length; }
  entries() { return this._records.map((r) => r.record); }

  /** An MMR inclusion proof for the record at `index`. */
  proof(index) {
    if (index < 0 || index >= this._records.length) {
      throw new RangeError(`audit index ${index} out of range (length ${this._records.length})`);
    }
    return this._mmr.proof(index);
  }

  /** Verify that record `index` is genuinely committed under the current root. */
  verifyInclusion(index) {
    if (index < 0 || index >= this._records.length) return false;
    const { record, leafData } = this._records[index];
    if (hash(record) !== leafData) return false;      // record was retro-edited
    return verifyMmrProof(leafData, this._mmr.proof(index), this._committedRoot);
  }

  /**
   * Full-log integrity check: every stored record still hashes to its committed
   * leaf, and rebuilding the MMR from those leaves reproduces the committed root.
   * True iff nothing has been tampered with.
   */
  verify() {
    const rebuilt = new MerkleMountainRange();
    for (const { record, leafData } of this._records) {
      if (hash(record) !== leafData) return false;    // a record was edited under its leaf
      rebuilt.append(leafData);
    }
    return rebuilt.root() === this._committedRoot;
  }
}

function freezeDeep(v) {
  if (v && typeof v === 'object') {
    Object.values(v).forEach(freezeDeep);
    return Object.freeze(v);
  }
  return v;
}
