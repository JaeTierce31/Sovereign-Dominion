// Immutable audit — tamper-evident, append-only log.
// Skeleton stand-in for the Moloch MMR (core/moloch-mmr): a hash chain where
// each entry commits to the previous root, so any retro-edit changes the root.
// Same behaviour a real MMR gives; swap in the WASM MMR for production roots.

import { hash } from './hash.js';

export class AuditLog {
  constructor() {
    this._entries = [];
    this._root = hash('sovereign-genesis');
  }

  /** Append an entry; returns its commitment. Entries are never mutated. */
  append(entry) {
    const index = this._entries.length;
    const record = Object.freeze({ index, at: new Date().toISOString(), entry: freezeDeep(entry) });
    const leaf = hash({ prev: this._root, record });
    this._root = leaf;
    this._entries.push({ record, leaf });
    return { index, leaf, root: this._root };
  }

  root() { return this._root; }
  length() { return this._entries.length; }
  entries() { return this._entries.map(e => e.record); }

  /** Recompute the chain; true iff nothing has been tampered with. */
  verify() {
    let root = hash('sovereign-genesis');
    for (const { record, leaf } of this._entries) {
      const expect = hash({ prev: root, record });
      if (expect !== leaf) return false;
      root = leaf;
    }
    return root === this._root;
  }
}

function freezeDeep(v) {
  if (v && typeof v === 'object') {
    Object.values(v).forEach(freezeDeep);
    return Object.freeze(v);
  }
  return v;
}
