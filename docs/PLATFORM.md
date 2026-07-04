# Platform Capability Overview

**Sovereign Dominion & Dignity — unified kernel platform · v0.1 (development)**

This is the *status* companion to [`UNIFICATION.md`](UNIFICATION.md) (the *spec*).
It documents what is actually built and tested right now, what is a deliberate
placeholder, and what is not yet built — held to the platform's own first principle:
**crypto honesty**, no overclaiming.

Spans two repositories:

- **[Sovereign-Dominion](https://github.com/JaeTierce31/Sovereign-Dominion)** — the
  `@sovereign/kernel` package + the AEC (structural / IBC 1604) domain + the working
  reference demo.
- **[Sovereign-Dignity](https://github.com/JaeTierce31/Sovereign-Dignity)** — the
  Housing / HUD NSPIRE domain (spec-first contract layer today).

---

## 1. The kernel loop

Every domain action is an **Intent** that takes exactly one path
(`kernel/src/pipeline.js · createKernel`):

```
submitIntent
  → GATE      every in-force Constitution invariant must hold, else blocked
  → VERIFY    required proofs check out (incl. integrity proofs whose witness never travels)
  → EXECUTE   the domain handler runs, dispatched by action name
  → OBSERVE   the outcome is appended to a tamper-evident audit log
  → SEAL      a portable credential is issued against the fresh audit root
```

Every submission resolves to exactly one status:
`sealed` · `blocked` · `proof_failed` · `no_handler` · `error`.

Nothing bypasses the gate. AEC and Housing differ only in the handlers and invariants
they register — the engine is identical. **That is the merge.**

---

## 2. Layered architecture

| Tier | What lives here | State |
|---|---|---|
| **Surfaces** | Inspector apps, owner/PHA attestation, funder reporting | per-domain, **planned** |
| **Domain** | Dignity/Housing (NSPIRE inspection + evidence chain) · Dominion/AEC (IBC 1604 + demo) | Housing = spec layer · AEC = reference demo |
| **Kernel** | `@sovereign/kernel` — Intent · gate · proof/resolvers · self-healing · registry · audit · Seal | **live** |
| **Constitution** | Machine-checkable invariants (evidence integrity, custody, credentialing, dual attestation, retention) | **live** |

Non-goal: a single UI that fuses the two domains. A housing inspector never sees a
beam-stress surface; a structural inspector never sees dwelling-unit workflows.

---

## 3. Kernel modules (`kernel/src`)

| Module | Role |
|---|---|
| `intent.js` | The `Intent` envelope every action flows through. |
| `invariant.js` | `Constitution` — invariants checked in the gate. |
| `capability-registry.js` | Domains register actions (handlers) + invariants at boot. |
| `charter-compiler.js` | Compiles charter YAML predicates into real functions — **no `eval`/`new Function`**. |
| `proof.js` | ZK `prove`/`verify` over a private witness (mock scheme). |
| `proof-resolvers.js` | `hashIntegrityResolver` / `composeResolvers` for the VERIFY step. |
| `audit.js` | `AuditLog` — append-only, tamper-evident hash chain. |
| `hash.js` | Real SHA-256 (FIPS 180-4), dependency-free and synchronous. |
| `seal.js` | `issueSeal` / `verifySeal` — the portable credential. |
| `self-healing.js` | Rewind to the last verified-safe state (enforces `rollback`). |
| `pipeline.js` | `createKernel` — wires the loop. |

---

## 4. The Constitution — housing charter

Seven enforced invariants (`constitution/charter.housing-inspection.example.yaml`).
A throwing predicate is treated as a violation — the gate **fails closed**.

| Invariant | Rule | On violation |
|---|---|---|
| `evidence.hash_immutability` | A captured evidence hash may never be recomputed or overwritten. | block |
| `evidence.chain_of_custody` | Each item links to the prior entry; nothing inserted/reordered/removed silently. | block |
| `inspector.credential_valid` | Only a currently-active, NSPIRE-certified inspector may submit or attest. | block |
| `inspection.dual_attestation` | Two independent human sign-offs before a Seal; AI is advisory only. | block |
| `deficiency.severity_disclosure` | Severity may not be downgraded below what the evidence supports (ordinal, not lexicographic). | block |
| `retention.record_integrity` | Records retained for the mandated window; early deletion refused. | block |
| `audit.append_only` | The audit log is append-only and tamper-evident. | block |

---

## 5. Real / honest-mock / planned matrix

The platform's first principle is not overclaiming. Every component states exactly what
it is: a hash is real; a "signature" that is really a keyed hash says so; a mock proving
system is labeled as one.

| Component | Status | What is actually true |
|---|---|---|
| `hash.js` (SHA-256) | ✅ **live** | Real FIPS 180-4, NIST-verified and fuzzed against `node:crypto`. |
| `charter-compiler` | ✅ **live** | Real parser + interpreter, no `eval`. Sandbox-proven (no RCE), fails closed. |
| gate / `invariant` | ✅ **live** | Compiled predicates enforced on every Intent. |
| `self-healing` | ✅ **live** | Checkpoint / verify / rollback over any invariant + state. |
| `audit.js` | 🟡 **honest mock** | Real SHA-256 hash chain, genuinely tamper-evident — but not yet the Moloch MMR. |
| `seal.js` | 🟡 **honest mock** | Real hash over the body, but keyed with a shared secret — not a real issuer-key signature. |
| `proof-resolvers` | 🟡 **honest mock** | `hashIntegrityResolver`: real SHA-256, witness off-chain — but in-process, not a transferable/ZK proof. |
| `proof.js` | 🟡 **honest mock** | Deterministic mock prover (`scheme: 'mock'`); the seam is real, the ZK scheme is not. |
| `core/qssm-rs`, `core/moloch-mmr` | 🟡 **honest mock** | Compile and run, but placeholder (XOR-fold) hashing — stated in their own code. |
| `services/*` (Rust) | ⚪ **planned** | ledger · verifier · api-gateway · report-generator — specified, not implemented. |
| `inspector-mobile` (React Native) | ⚪ **planned** | Offline-first on-device capture & hashing (ADR-003). |
| published `@sovereign/kernel` | ⚪ **planned** | Contract is hand-mirrored across repos today; publishing removes the duplication. |

---

## 6. Security posture

- **No `eval` / `new Function`.** The charter interpreter only calls whitelisted
  functions; constructor/`Function`-reflection escapes are all refused (verified — no RCE).
- **Fail closed.** A throwing invariant, an unresolved required proof, or an unknown
  action all refuse the Intent. A prior fail-open (a malformed severity string bypassing
  the disclosure gate via lexicographic order) was found and fixed.
- **Resource bounds.** Predicate length cap + non-string rejection — pathological input
  fails with a clear error, not a stack overflow.
- **Non-negotiables.** Humans attest (dual human sign-off before any Seal; no confidence
  score substitutes); private, tamper-evident audit (not a public blockchain); crypto
  honesty (one lane per deployment, stated).
- Dedicated adversarial security regression suites in both repos.

---

## 7. Verification

**48 automated checks, green from fresh clones.** CI runs the kernel suite in Dominion
and the shared-types typecheck + tests in Dignity on every push.

| Suite | Repo(s) | Checks |
|---|---|---|
| `hash` (SHA-256 vectors + fuzz) | Dominion · Dignity | 3 + 3 |
| `kernel` (gate / seal / self-heal) | Dominion | 5 |
| `charter-compiler` | Dominion · Dignity | 8 + 7 |
| `charter-compiler.security` | Dominion · Dignity | 5 + 5 |
| `verify-step` | Dominion | 4 |
| `housing-domain.integration` | Dominion | 8 |

Run locally: `npm test` in `kernel/` (Dominion) and in `packages/shared-types/` (Dignity).

---

## 8. Roadmap — what honesty says is still owed

**Cryptography**
- Real zero-knowledge proofs — QSSM post-quantum lattice **or** a curve-based SNARK
  (pick one per deployment, state it).
- The real Moloch Merkle Mountain Range behind the audit chain.
- A real issuer-key signature scheme for the Seal.

**Product surfaces**
- Dignity's Rust services: ledger, verifier, api-gateway, report-generator.
- The offline-first React Native inspector app.
- Publish `@sovereign/kernel` so the contract is shared, not mirrored.

---

*Keep this document honest. When a mock becomes real, move its row from 🟡 to ✅ and
say what changed. When a surface ships, move it from ⚪. The value of this file is that
it never overstates the platform.*
