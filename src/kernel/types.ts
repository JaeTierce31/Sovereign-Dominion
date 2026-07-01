// Kernel contract types (docs/UNIFICATION.md §4).
//
// This is the first real, typed version of the Intent / Invariant /
// CapabilityRegistration contract the unification spec describes. Previously it only
// existed as prose in UNIFICATION.md, a YAML sketch in /constitution, and hardcoded
// single-purpose JS prototypes in demo/ (intent.js, capability-registry.js). Domains
// (domain-aec today, domain-housing in Sovereign-Dignity) register against this
// contract rather than each inventing their own envelope.

export type Domain = string;

export interface ActorRef {
  id: string;
  role: string;
  domain?: Domain;
  /** Optional credential info a gate invariant may check (e.g. inspector.credential_valid). */
  credential?: {
    kind: string;
    status: 'active' | 'expired' | 'revoked';
    expiresAt?: string;
  };
}

export interface SubjectRef {
  id: string;
  /** What kind of thing this Intent concerns, e.g. 'beam', 'dwelling_unit'. */
  kind: string;
  domain: Domain;
}

export interface Intent<TPayload = unknown> {
  id: string;
  actor: ActorRef;
  subject: SubjectRef;
  action: string;
  domain: Domain;
  payload: TPayload;
  requiredProofs: string[];
  createdAt: string;
}

export type ViolationAction = 'block' | 'rollback';

/**
 * The context an invariant's predicates are evaluated against. Built fresh before the
 * gate runs (pre-execution) and again after execute() (post-execution, with `evidence`
 * populated) so `rollback`-class invariants can catch post-condition drift.
 */
export interface GateContext {
  intent: Intent;
  evidence?: Record<string, unknown>;
  [key: string]: unknown;
}

export type Predicate = (ctx: GateContext) => boolean;

export interface Invariant {
  id: string;
  appliesWhen: Predicate;
  mustHold: Predicate;
  onViolation: ViolationAction;
  rationale: string;
}

export interface GateViolation {
  invariantId: string;
  onViolation: ViolationAction;
  rationale: string;
}

export interface GateResult {
  passed: boolean;
  violations: GateViolation[];
}

export interface ActionSpec {
  name: string;
  domain: Domain;
  requiredProofs?: string[];
}

export interface CapabilityRegistration {
  domain: Domain;
  actions: ActionSpec[];
  invariants: Invariant[];
}

export interface Seal {
  id: string;
  intentId: string;
  subjectId: string;
  domain: Domain;
  issuedAt: string;
  status: 'sealed' | 'withheld';
  evidence: Record<string, unknown>;
}
