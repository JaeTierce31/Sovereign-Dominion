// Typed version of demo/capability-registry.js.
//
// The demo version is a hardcoded array of the 7 beam-demo subsystems (QSSM, MMR,
// SCUGS, Hermes, Council, Stripe, Esther) with no `invariants` field — it can't
// express a second domain registering itself. This version accepts runtime
// `CapabilityRegistration` objects (per UNIFICATION §4), one per domain, each
// carrying the actions it exposes and the invariants it layers over the base
// Constitution charter.

import type { ActionSpec, CapabilityRegistration, Domain, Invariant } from './types';

export class CapabilityRegistry {
  private registrations = new Map<Domain, CapabilityRegistration>();

  register(registration: CapabilityRegistration): void {
    this.registrations.set(registration.domain, registration);
  }

  unregister(domain: Domain): void {
    this.registrations.delete(domain);
  }

  getDomain(domain: Domain): CapabilityRegistration | undefined {
    return this.registrations.get(domain);
  }

  getAllDomains(): CapabilityRegistration[] {
    return Array.from(this.registrations.values());
  }

  findAction(domain: Domain, actionName: string): ActionSpec | undefined {
    return this.registrations.get(domain)?.actions.find((a) => a.name === actionName);
  }

  invariantsFor(domain: Domain): Invariant[] {
    return this.registrations.get(domain)?.invariants ?? [];
  }
}
