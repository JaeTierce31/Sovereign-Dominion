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
| `proof-resolvers.js` | Ready-made resolvers for the VERIFY step. `hashIntegrityResolver` confirms an integrity claim (bytes hash to the committed hash) using real SHA-256, with the witness bytes kept OUT of the shared Intent (on-device); `composeResolvers` chains them. |
| `audit.js` | `AuditLog` — append-only, tamper-evident, backed by a real Merkle Mountain Range (`mmr.js`); gives O(log n) inclusion proofs (`proof`/`verifyInclusion`). |
| `mmr.js` | `MerkleMountainRange`/`verifyMmrProof` — real MMR accumulator over SHA-256, domain-separated (leaf `0x00` / node `0x01`); stateless inclusion verification. |
| `hash.js` | Real SHA-256 (FIPS 180-4), dependency-free and synchronous — the primitive `audit.js`/`mmr.js`, `seal.js`, and `charter-compiler.js`'s `sha256()` builtin all use. |
| `ed25519.js` | `createEd25519Signer`/`verifyEd25519` — real Ed25519 signatures (native, synchronous); the KMS/HSM seam for the Seal signer. |
| `seal.js` | `issueSeal`/`verifySeal` — the portable, subject-held credential, Ed25519-signed. |
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
npm test      # runs all 8 suites: hash, mmr, seal, kernel, charter-compiler(+security), verify-step, housing-integration
```

## Status & what binds next

The seam and orchestration are real, and Tier 1 of the roadmap made the trust real
too. One piece is still a mock, with a clear swap point:

1. **`proof.js`** → bind to QSSM (`core/qssm-rs`) or a chosen SNARK. Crypto honesty:
   post-quantum lattice and a curve-based SNARK are different trust models — pick one
   per deployment and record it (don't claim both). Deliberately scoped to Dominion/AEC
   — the PII-free Housing path doesn't need ZK (see `docs/ROADMAP.md` §0).

**`hash.js` is real SHA-256** (FIPS 180-4, dependency-free, verified against NIST
test vectors and fuzzed against `node:crypto` across every padding-boundary length
— see `test/hash.test.mjs`). The audit log is now backed by a **real Merkle Mountain
Range** (`mmr.js`) over that primitive — domain-separated, with O(log n) inclusion
proofs, exhaustively + fuzz-tested against adversarial forgery (`test/mmr.test.mjs`);
it supersedes the mock `core/moloch-mmr` crate for the audit path. The Seal is signed
with **real Ed25519** (`ed25519.js`) — genuine non-repudiation, no shared secret,
trust-anchorable via `trustedPublicKeys` (`test/seal.test.mjs`). The remaining crypto
gap is *key custody*: the signer generates an ephemeral dev key unless given a PEM —
production must put a KMS/HSM behind the `createEd25519Signer` seam.

The charter → predicate compiler (previously the "remaining seam") is done:
[`charter-compiler.js`](src/charter-compiler.js) turns
[`constitution/`](../constitution/)'s YAML into real invariants; see
`test/charter-compiler.test.mjs`.

The Housing domain (`/domain-housing`) is authored against the actual
`Sovereign-Dignity` repo; it registers NSPIRE-conformant actions + the full charter here.
