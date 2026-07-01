// Generalized version of demo/self-healing.js's SelfHealingEngine.
//
// The demo version is hardcoded to one invariant (IBC 1604 minimum yield strength,
// a plain number comparison) and one state shape (a yield-strength float). This
// version is parameterized over an arbitrary state type and an arbitrary invariant
// predicate, so domain-housing can drive it with (for example) an evidence-chain
// integrity check instead of a beam's yield strength, while keeping the same
// checkpoint → verify → rollback → recover loop demo/self-healing.js proved out.

export type HealStatus = 'SAFE' | 'FAIL' | 'ROLLBACK' | 'HEALED';

export interface Checkpoint<TState> {
  tick: number;
  state: TState;
}

export interface TraceEntry {
  tick: number;
  kind: 'commit' | 'fault' | 'violation' | 'rollback' | 'healed';
  message: string;
}

export type InvariantCheck<TState> = (state: TState) => boolean;
export type SelfHealingListener<TState> = (engine: SelfHealingEngine<TState>) => void;

export class SelfHealingEngine<TState> {
  tick = 0;
  state: TState;
  status: HealStatus = 'SAFE';
  checkpoints: Checkpoint<TState>[];
  trace: TraceEntry[] = [];

  private readonly invariant: InvariantCheck<TState>;
  private listeners: SelfHealingListener<TState>[] = [];

  constructor(initialState: TState, invariant: InvariantCheck<TState>) {
    this.state = initialState;
    this.invariant = invariant;
    this.checkpoints = [{ tick: 0, state: initialState }];
    this.log('commit', 'checkpoint #0');
  }

  onChange(fn: SelfHealingListener<TState>): void {
    this.listeners.push(fn);
  }

  holds(): boolean {
    return this.invariant(this.state);
  }

  /** A safe execution step: advance to `nextState` and commit if the invariant holds. */
  commit(nextState: TState): void {
    this.tick++;
    this.state = nextState;
    this.status = this.invariant(nextState) ? 'SAFE' : 'FAIL';
    if (this.status === 'SAFE') {
      this.checkpoints.push({ tick: this.tick, state: nextState });
      this.log('commit', `checkpoint #${this.tick}`);
    } else {
      this.log('violation', `invariant violated at tick #${this.tick}`);
    }
    this.emit();
  }

  /** Force the state into an invariant-violating state (for fault-injection demos/tests). */
  injectFault(faultState: TState): void {
    this.tick++;
    this.state = faultState;
    this.status = 'FAIL';
    this.log('fault', `fault injected at tick #${this.tick}`);
    this.log('violation', `invariant violated at tick #${this.tick}`);
    this.emit();
  }

  /** Rewind to the most recent checkpoint whose state satisfies the invariant. */
  rollback(): void {
    const safe = [...this.checkpoints].reverse().find((c) => this.invariant(c.state));
    this.status = 'ROLLBACK';
    if (safe) {
      this.state = safe.state;
      this.log('rollback', `rolled back to checkpoint #${safe.tick}`);
    } else {
      this.log('rollback', 'no safe checkpoint found');
    }
    this.emit();
  }

  heal(): void {
    this.status = 'HEALED';
    this.log('healed', 'self-healed — last verified-safe state restored');
    this.emit();
  }

  private log(kind: TraceEntry['kind'], message: string): void {
    this.trace.push({ tick: this.tick, kind, message });
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this);
  }
}
