// Ledger — the persistence seam for sealed records (ROADMAP Tier 2).
//
// The kernel's audit MMR lives in memory; a Ledger is where a sealed outcome is
// durably stored so it survives the process. This module ships a real, working
// InMemoryLedger (used in tests and dev) and defines the interface a
// Supabase/Postgres-backed ledger must implement — that interface is the seam:
// swap the implementation, nothing else in the kernel changes.
//
// A LedgerStore implements:
//   store(entry) -> entry.id      // entry: { id, seal, auditRoot, intentId, at }
//   get(id)      -> entry | null
//   all()        -> entry[]       // insertion order
//   get size     -> number
//
// Honesty note: InMemoryLedger is real persistence *within the process* only —
// it is not durable across restarts. Durable persistence needs a real backend
// (Supabase project + service key, ROADMAP §1 #3); that adapter is not wired
// here because it needs credentials this session does not have. The seam is
// real; the durable backend is the credentialed step.

export class InMemoryLedger {
  constructor() {
    this._byId = new Map();
    this._order = [];
  }

  /** Persist a sealed record. Idempotent on id (re-store overwrites). Returns the id. */
  store(entry) {
    if (!entry || !entry.id) throw new Error('ledger.store requires an entry with an id');
    const frozen = Object.freeze({ at: new Date().toISOString(), ...entry });
    if (!this._byId.has(entry.id)) this._order.push(entry.id);
    this._byId.set(entry.id, frozen);
    return entry.id;
  }

  get(id) { return this._byId.get(id) || null; }
  all() { return this._order.map((id) => this._byId.get(id)); }
  get size() { return this._byId.size; }
}

/**
 * A no-op ledger — the default when a kernel is created without one, so the
 * pipeline's persistence call is always safe to make. Stores nothing.
 */
export const nullLedger = Object.freeze({
  store: (entry) => (entry && entry.id) || null,
  get: () => null,
  all: () => [],
  size: 0,
});
