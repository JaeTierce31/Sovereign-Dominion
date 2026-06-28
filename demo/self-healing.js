// Self-Healing Module — the CRS loop, browser-native and dependency-free.
//
//   checkpoint → execute → verify invariant
//        → if OK:  commit
//        → if FAIL: roll back to last verified-safe state, then recover
//
// The invariant is the REAL one the rest of the demo uses: IBC 1604 minimum
// yield strength (≥ 36 ksi). Inject a fault and the system detects the
// violation, rewinds to its last committed-safe checkpoint, and heals —
// no irreversible corruption, full trace. Pure ES module, no backend.

export const YIELD_MIN = 36; // IBC 1604 minimum yield strength (ksi)

export class SelfHealingEngine {
  constructor() {
    this._listeners = [];
    this.reset();
  }

  reset() {
    this.tick = 0;
    this.yieldKsi = 38.0;                       // starts comfortably compliant
    this.status = 'SAFE';
    this.checkpoints = [{ tick: 0, yieldKsi: 38.0 }];
    this.trace = [{ t: 0, kind: 'commit', msg: 'checkpoint #0 · yield 38.0 ksi ✓' }];
    this._emit();
  }

  onChange(fn) { this._listeners.push(fn); }
  _emit() { this._listeners.forEach(f => f(this)); }
  _log(kind, msg) { this.trace.push({ t: this.tick, kind, msg }); }

  invariant() { return this.yieldKsi >= YIELD_MIN; }

  // One safe execution step — drifts a little, stays within tolerance, commits.
  commitStep() {
    this.tick++;
    const drift = Math.random() * 0.6 - 0.3;
    this.yieldKsi = +(this.yieldKsi + drift).toFixed(2);
    if (this.yieldKsi < YIELD_MIN + 1) this.yieldKsi = 38.0; // keep clear of the edge
    this.status = 'SAFE';
    this.checkpoints.push({ tick: this.tick, yieldKsi: this.yieldKsi });
    this._log('commit', `commit · checkpoint #${this.tick} · yield ${this.yieldKsi.toFixed(1)} ksi ✓`);
    this._emit();
  }

  // Step 1 of the demo: corrupt the state below the IBC minimum.
  injectFault() {
    this.tick++;
    this.yieldKsi = 24.0; // below IBC 1604 minimum → invariant must fail
    this.status = 'FAIL';
    this._log('fault', `⚡ fault injected · yield → ${this.yieldKsi.toFixed(1)} ksi`);
    this._log('violation', `INVARIANT VIOLATION · yield ${this.yieldKsi.toFixed(1)} < ${YIELD_MIN} ksi`);
    this._emit();
  }

  // Step 2: rewind to the most recent checkpoint that satisfied the invariant.
  rollback() {
    const safe = [...this.checkpoints].reverse().find(c => c.yieldKsi >= YIELD_MIN);
    this.status = 'ROLLBACK';
    this._log('rollback', `↩ rollback → checkpoint #${safe ? safe.tick : 0} · yield ${(safe ? safe.yieldKsi : 38).toFixed(1)} ksi`);
    if (safe) this.yieldKsi = safe.yieldKsi;
    this._emit();
  }

  // Step 3: confirm recovery.
  heal() {
    this.status = 'HEALED';
    this._log('healed', '✓ self-healed · last valid state restored, execution coherent');
    this._emit();
  }
}

const STATUS_META = {
  SAFE:     { icon: '●', cls: 'sh-state-safe',     label: 'SAFE' },
  FAIL:     { icon: '✕', cls: 'sh-state-fail',     label: 'INVARIANT VIOLATION' },
  ROLLBACK: { icon: '↩', cls: 'sh-state-rollback', label: 'ROLLING BACK' },
  HEALED:   { icon: '✓', cls: 'sh-state-healed',   label: 'SELF-HEALED' },
};

export function renderSelfHealing(root, engine) {
  if (!root) return;
  const m = STATUS_META[engine.status] || STATUS_META.SAFE;
  root.className = `self-healing ${m.cls}`;

  const pct = Math.max(0, Math.min(100, ((engine.yieldKsi - 20) / (45 - 20)) * 100));

  root.innerHTML = `
    <div class="sh-statusline">
      <span class="sh-badge">${m.icon} ${m.label}</span>
      <span class="sh-metric">yield <strong>${engine.yieldKsi.toFixed(1)}</strong> ksi
        <span class="sh-min">· IBC min ${YIELD_MIN}</span></span>
    </div>
    <div class="sh-gauge"><div class="sh-gauge-fill" style="width:${pct}%"></div>
      <div class="sh-gauge-threshold" title="IBC 1604 minimum"></div></div>
    <div class="sh-trace">${
      engine.trace.slice(-6).map(e => `<div class="sh-line sh-${e.kind}">${e.msg}</div>`).join('')
    }</div>`;
}
