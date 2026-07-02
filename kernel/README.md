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
| `hash.js` | Real SHA-256 (FIPS 180-4), dependency-free and synchronous — the primitive `audit.js`, `seal.js`, and `charter-compiler.js`'s `sha256()` builtin all use. |
| `seal.js` | `issueSeal`/`verifySeal` — the portable, subject-held credential. |
| `self-healing.js` | Rewinds to the last verified-safe state (enforces `onViolation: "rollback"`). |
| `pipeline.js` | `createKernel` — wires the loop together. |
| `charter-compiler.js` | Compiles a charter YAML's `appliesWhen`/`mustHold` strings (see [`constitution/`](../constitution/)) into real, safe predicate functions — no `eval`/`new Function`, a hand-written parser + tree-walking interpreter over a restricted expression grammar. |

## How a domain plugs in

The charter is authored once, in YAML, and compiled straight into invariants —
you don't hand-write `defineInvariant` calls for each rule:

```js
import { load } from 'js-yaml'; // or any YAML parser — compileCharter takes the parsed object
import { readFileSync } from 'node:fs';
import { Constitution, CapabilityRegistry, AuditLog, createKernel, createIntent, compileCharter } from '@sovereign/kernel';

const charterObj = load(readFileSync('constitution/charter.housing-inspection.example.yaml', 'utf8'));
const NSPIRE_ORDINALS = { low: 0, moderate: 1, severe: 2, life_threatening: 3 };
const { invariants } = compileCharter(charterObj, { ordinals: NSPIRE_ORDINALS });

const constitution = new Constitution(invariants);

const registry = new CapabilityRegistry().register({
  domain: 'housing',
  actions: [{ name: 'inspection.submit_evidence', handler: (intent) => submitEvidence(intent) }],
  invariants, // recorded on the registry for introspection; the gate itself checks `constitution` above
});

const kernel = createKernel({ constitution, registry, audit: new AuditLog() });
const result = await kernel.submitIntent(createIntent({ /* actor, subject, action, … */ }));
// → { status: 'sealed' | 'blocked' | 'proof_failed' | 'no_handler' | 'error', … }
```

See `test/kernel.test.mjs` for the hand-written-invariant version of this
end-to-end example (valid evidence submission sealed, expired-credential
submission blocked, single-attestation finalize blocked, audit tamper
detected, self-healing rewind), and `test/charter-compiler.test.mjs` for the
charter-compiled version — same scenarios, invariants loaded straight from
the YAML instead of hand-written, including a check that severity comparisons
use NSPIRE's ordinal rank rather than lexicographic string order.

```bash
npm install   # pulls in the js-yaml devDependency the charter-compiler test uses
npm test      # runs both test/kernel.test.mjs and test/charter-compiler.test.mjs
```

## Status & what binds next

This is the **skeleton** — the seam and orchestration are real; one piece is
still a mock with a clear swap point:

1. **`proof.js`** → bind to QSSM (`core/qssm-rs`) or a chosen SNARK. Crypto honesty:
   post-quantum lattice and a curve-based SNARK are different trust models — pick one
   per deployment and record it (don't claim both).

**`hash.js` is real SHA-256** (FIPS 180-4, dependency-free, verified against NIST
test vectors and fuzzed against `node:crypto` across every padding-boundary length
— see `test/hash.test.mjs`), not a placeholder anymore. `charter-compiler.js`'s
`sha256(x)` predicate builtin and `seal.js`'s signature both use it. What's left on
the audit side: `audit.js`'s chain structure is still a simple hash-chain, not the
real Moloch Merkle Mountain Range (`core/moloch-mmr`, a separate Rust/WASM crate
with its own, still-mocked, non-SHA-256 internal hashing) — the *primitive* is now
real, the *structure* swap is future work.

The charter → predicate compiler (previously the "remaining seam") is done:
[`charter-compiler.js`](src/charter-compiler.js) turns
[`constitution/`](../constitution/)'s YAML into real invariants; see
`test/charter-compiler.test.mjs`.

The Housing domain (`/domain-housing`) is authored against the actual
`Sovereign-Dignity` repo; it registers NSPIRE-conformant actions + the full charter here.
