// The Constitution runtime — machine-checkable invariants (the Dignity charter).
// The kernel evaluates these inside the gate on every Intent.
//
// Invariants here are COMPILED predicate functions. The human-authored form is
// the declarative charter in /constitution (charter.example.yaml); a future
// charter→predicate compiler is the seam between them. Keeping the runtime on
// plain functions avoids shipping an expression evaluator in the skeleton.

/**
 * @param {object} spec
 * @param {string} spec.id
 * @param {(ctx:object)=>boolean} [spec.appliesWhen]  default: always
 * @param {(ctx:object)=>boolean} spec.mustHold
 * @param {"block"|"rollback"} [spec.onViolation]      default: "block"
 * @param {string} [spec.rationale]
 */
export function defineInvariant(spec) {
  if (!spec || typeof spec.id !== 'string' || typeof spec.mustHold !== 'function') {
    throw new Error('defineInvariant requires { id, mustHold }');
  }
  return Object.freeze({
    id: spec.id,
    appliesWhen: spec.appliesWhen || (() => true),
    mustHold: spec.mustHold,
    onViolation: spec.onViolation === 'rollback' ? 'rollback' : 'block',
    rationale: spec.rationale || '',
  });
}

export class Constitution {
  constructor(invariants = []) {
    this._invariants = [];
    invariants.forEach(i => this.add(i));
  }

  add(inv) {
    // Accept either a compiled invariant or a bare spec.
    this._invariants.push(inv.mustHold && inv.appliesWhen ? inv : defineInvariant(inv));
    return this;
  }

  list() { return [...this._invariants]; }

  /**
   * Evaluate every in-force invariant against a context.
   * @returns {{ ok:boolean, violations: Array<{id,onViolation,rationale}> }}
   */
  check(ctx) {
    const violations = [];
    for (const inv of this._invariants) {
      let applies = false;
      try { applies = !!inv.appliesWhen(ctx); } catch { applies = false; }
      if (!applies) continue;
      let holds = false;
      try { holds = !!inv.mustHold(ctx); }
      catch { holds = false; } // a predicate that throws is treated as a violation
      if (!holds) violations.push({ id: inv.id, onViolation: inv.onViolation, rationale: inv.rationale });
    }
    return { ok: violations.length === 0, violations };
  }
}
