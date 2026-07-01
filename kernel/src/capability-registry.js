// Capability registry — domains register the actions they can ask the kernel to
// perform, plus the invariants they add to the Constitution. Generalized from
// Sovereign Dominion's demo/capability-registry.js (which was a static catalog);
// here it also carries executable handlers so the kernel can dispatch by action.

export class CapabilityRegistry {
  constructor() {
    this._actions = new Map();   // action name -> { domain, handler, meta }
    this._domains = new Map();   // domain -> registration
  }

  /**
   * @param {object} reg
   * @param {string} reg.domain
   * @param {Array<{name:string, handler:(intent)=>any, meta?:object}>} reg.actions
   * @param {Array} [reg.invariants]  compiled invariants (added to the Constitution by the caller)
   */
  register(reg) {
    if (!reg || !reg.domain || !Array.isArray(reg.actions)) {
      throw new Error('register requires { domain, actions[] }');
    }
    for (const a of reg.actions) {
      if (this._actions.has(a.name)) throw new Error(`duplicate action: ${a.name}`);
      this._actions.set(a.name, { domain: reg.domain, handler: a.handler, meta: a.meta || {} });
    }
    this._domains.set(reg.domain, reg);
    return this;
  }

  getHandler(action) { return this._actions.get(action)?.handler || null; }
  actionsFor(domain) { return [...this._actions].filter(([, v]) => v.domain === domain).map(([k]) => k); }
  domains() { return [...this._domains.keys()]; }
  invariants() { return [...this._domains.values()].flatMap(d => d.invariants || []); }
}
