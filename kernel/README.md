# @sovereign/kernel

The domain-agnostic verification kernel shared by **Sovereign Dominion** (AEC /
structural compliance) and **Sovereign Dignity** (Housing / HUD NSPIRE physical
inspection). This is the "one shared kernel" from
[`docs/UNIFICATION.md`](../docs/UNIFICATION.md) — extracted, pure, and
framework-neutral (no DOM, no backend, runs in Node and the browser).

> An earlier draft of `docs/UNIFICATION.md` (and, briefly, this package)
> assumed `Sovereign-Dignity` was a homeless-services HMIS. That guess was made
> before the repo could be reviewed and turned out to be wrong — it's a HUD
> NSPIRE housing-inspection platform instead. The mechanism below (the loop,
> the gate, the seal) didn't need to change; only the domain-flavored examples
> did.

## The loop

Every domain action is an **Intent** that takes exactly one path:

```
submitIntent → GATE (Constitution) → VERIFY (proofs) → EXECUTE (domain handler)
             → OBSERVE (append to audit) → SEAL
```

Nothing bypasses the gate. AEC and Housing differ only in the *handlers* and
*invariants* they register — the engine is identical. That is the merge.

## Modules

| Module | Role |
|---|---|
| `intent.js` | The `Intent` envelope every action flows through. |
| `invariant.js` | `Constitution` — machine-checkable invariants (the Dignity charter), checked in the gate. |
| `capability-registry.js` | Domains register their actions (handlers) + invariants. |
| `proof.js` | ZK `prove`/`verify` a predicate over a private witness — no witness leaves. |
| `audit.js` | `AuditLog` — append-only, tamper-evident (skeleton MMR; binds to `core/moloch-mmr`). |
| `seal.js` | `issueSeal`/`verifySeal` — the portable, subject-held credential. |
| `self-healing.js` | Rewinds to the last verified-safe state (enforces `onViolation: "rollback"`). |
| `pipeline.js` | `createKernel` — wires the loop together. |

## How a domain plugs in

```js
import { Constitution, defineInvariant, CapabilityRegistry, AuditLog, createKernel, createIntent } from '@sovereign/kernel';

const constitution = new Constitution([
  defineInvariant({
    id: 'inspector.credential_valid',
    appliesWhen: ({ intent }) => intent.action === 'inspection.submit_evidence',
    mustHold:   ({ intent, now }) => intent.actor.credential.status === 'active' && now() < intent.actor.credential.expiresAt,
    onViolation: 'block',
  }),
]);

const registry = new CapabilityRegistry().register({
  domain: 'housing',
  actions: [{ name: 'inspection.submit_evidence', handler: (intent) => submitEvidence(intent) }],
});

const kernel = createKernel({ constitution, registry, audit: new AuditLog() });
const result = await kernel.submitIntent(createIntent({ /* actor, subject, action, … */ }));
// → { status: 'sealed' | 'blocked' | 'proof_failed' | 'no_handler' | 'error', … }
```

See `test/kernel.test.mjs` for a runnable end-to-end example (valid evidence
submission sealed, expired-credential submission blocked, single-attestation
finalize blocked, audit tamper detected, self-healing rewind).

```bash
npm test   # or: node test/kernel.test.mjs
```

## Status & what binds next

This is the **skeleton** — the seam and orchestration are real; three pieces are
mocks with clear swap points:

1. **`proof.js`** → bind to QSSM (`core/qssm-rs`) or a chosen SNARK. Crypto honesty:
   post-quantum lattice and a curve-based SNARK are different trust models — pick one
   per deployment and record it (don't claim both).
2. **`audit.js` / `hash.js`** → bind to the real Moloch MMR (`core/moloch-mmr`) for
   production roots.
3. **`invariant.js`** → invariants are compiled predicate functions today; the
   human-authored charter lives in [`constitution/`](../constitution/) —
   currently `charter.housing-inspection.example.yaml`. A charter → predicate
   compiler is the remaining seam.

The Housing domain (`/domain-housing`) is authored against the actual
`Sovereign-Dignity` repo; it registers NSPIRE-conformant actions + the full charter here.
