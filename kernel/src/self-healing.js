// Self-healing runtime — generalized from Sovereign Dominion's demo/self-healing.js.
// No longer beam-specific: it checkpoints an arbitrary state object and rewinds to
// the last state that satisfied a supplied invariant. This is how `onViolation:
// "rollback"` invariants are enforced — the system cannot silently drift past a
// red-line; it rewinds to the last verified-safe state.

export class SelfHealingEngine {
  /**
   * @param {(state:object)=>boolean} invariant  must hold for a state to be "safe"
   * @param {object} initial  the initial (safe) state
   */
  constructor(invariant, initial = {}) {
    if (typeof invariant !== 'function') throw new Error('SelfHealingEngine needs an invariant fn');
    this._invariant = invariant;
    this._listeners = [];
    this.reset(initial);
  }

  reset(initial = {}) {
    this.tick = 0;
    this.state = clone(initial);
    this.status = this._invariant(this.state) ? 'SAFE' : 'FAIL';
    this.checkpoints = this.status === 'SAFE' ? [{ tick: 0, state: clone(initial) }] : [];
    this.trace = [{ t: 0, kind: 'init', ok: this.status === 'SAFE' }];
    this._emit();
  }

  onChange(fn) { this._listeners.push(fn); return this; }
  _emit() { this._listeners.forEach(f => f(this)); }
  _log(kind, extra = {}) { this.trace.push({ t: this.tick, kind, ...extra }); }

  invariantHolds() { return !!this._invariant(this.state); }

  /** Advance to `next` state; commit only if the invariant still holds. */
  commit(next) {
    this.tick++;
    this.state = clone(next);
    if (this.invariantHolds()) {
      this.status = 'SAFE';
      this.checkpoints.push({ tick: this.tick, state: clone(this.state) });
      this._log('commit', { ok: true });
    } else {
      this.status = 'FAIL';
      this._log('violation', { ok: false });
    }
    this._emit();
    return this.status === 'SAFE';
  }

  /** Force a bad state (fault injection / detected drift). */
  fault(badState) {
    this.tick++;
    this.state = clone(badState);
    this.status = 'FAIL';
    this._log('fault', { ok: false });
    this._emit();
  }

  /** Rewind to the most recent checkpoint that satisfied the invariant. */
  rollback() {
    const safe = [...this.checkpoints].reverse().find(c => this._invariant(c.state));
    this.status = 'ROLLBACK';
    if (safe) this.state = clone(safe.state);
    this._log('rollback', { to: safe ? safe.tick : null });
    this._emit();
    return !!safe;
  }

  heal() {
    this.status = this.invariantHolds() ? 'HEALED' : 'FAIL';
    this._log('healed', { ok: this.status === 'HEALED' });
    this._emit();
    return this.status === 'HEALED';
  }
}

function clone(o) { return o && typeof o === 'object' ? JSON.parse(JSON.stringify(o)) : o; }
