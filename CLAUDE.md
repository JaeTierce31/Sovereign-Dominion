# CLAUDE.md — guidance for Claude Code in this repository

Repo: **Sovereign-Dominion**. Two things live here: the Vite/React **construction-AR app**
(the original product + the reference beam demo) and, more importantly for ongoing work,
**`@sovereign/kernel`** — the domain-agnostic verification kernel shared with the sibling
repo **Sovereign-Dignity** (the HUD NSPIRE housing-inspection domain).

**Read these first, in order:**
1. [`docs/UNIFICATION.md`](docs/UNIFICATION.md) — the merge spec (intended design).
2. [`docs/PLATFORM.md`](docs/PLATFORM.md) — current status + the real/honest-mock/planned matrix.
3. [`docs/ROADMAP.md`](docs/ROADMAP.md) — the sequenced completion plan + the trust-model decision.

---

## The one principle that governs everything: crypto honesty

This is a **trust platform**, and much of the trust is still mocked. **Never overclaim.**
A hash is real; a "signature" that is really a keyed hash must say so; a mock proving
system must be labeled `mock`. Every component states exactly what it is (see the
`scheme` fields and the `PLATFORM.md` matrix). When you make a mock real, move its row
🟡→✅ in `PLATFORM.md` and note it in `ROADMAP.md`. If you cannot verify a claim, do not
make it.

Corollary non-negotiables (enforced in code, keep them enforced):
- **Humans attest; AI assists.** Dual *human* attestation before any Seal; no confidence
  score substitutes. AI output is advisory only.
- **Fail closed.** A throwing invariant, an unresolved required proof, or an unknown
  action must all *refuse* the Intent — never default-allow.
- **No `eval` / `new Function`** in the charter evaluator. It is a hand-written
  parser + tree-walking interpreter over a restricted grammar; keep it that way.
- **Private, tamper-evident audit** — not a public blockchain.

---

## The kernel (`kernel/` — the main work surface)

`@sovereign/kernel` is pure, framework-neutral JS (no DOM, no backend, no build step;
runs in Node and the browser). Every action is an **Intent** that takes one path:

```
submitIntent → GATE → VERIFY → EXECUTE → OBSERVE → SEAL
```

Outcomes: `sealed` · `blocked` · `proof_failed` · `no_handler` · `error`. Nothing
bypasses the gate. AEC and Housing differ only in the handlers + invariants they register.

Key modules in `kernel/src/`: `pipeline.js` (`createKernel`), `intent.js`, `invariant.js`
(`Constitution`), `capability-registry.js`, `charter-compiler.js` (YAML → predicates),
`proof.js` + `proof-resolvers.js` (VERIFY step), `audit.js` + `mmr.js` (**real MMR** audit
with inclusion proofs), `hash.js` (**real SHA-256**), `seal.js` + `ed25519.js` (**real
Ed25519** signatures; the KMS/HSM seam), `self-healing.js`.

The Constitution lives in [`constitution/`](constitution/) as YAML charters, compiled to
real predicates by `charter-compiler.js`. `charter.housing-inspection.example.yaml` is the
active one; `charter.example.yaml` is a kept illustrative (superseded-domain) sketch.

---

## Development & testing

**Kernel** (the code most work touches) — no dependencies to build, one dev dep for tests:

```bash
cd kernel && npm install && npm test   # runs all 8 suites; keep them green
```

Add new kernel tests as `kernel/test/*.test.mjs` and wire them into the `test` script in
`kernel/package.json` (plain `node --test`-style asserts; no framework). Any change to
crypto or the interpreter must ship with **known-answer vectors + adversarial cases**
(`hash.test.mjs` and `charter-compiler.security.test.mjs` are the templates).

**Vite app** (the AEC/demo side):

```bash
npm install
npm run dev          # vite --host
npm test             # vitest run --coverage  (tests/unit, tests/security)
npm run lint         # eslint src/
npx tsc --noEmit     # typecheck
```

Note: root `npm test` only covers the Vite app — the kernel has its **own** package and
test command, and CI runs it as a separate `kernel` job. Don't assume root `npm test`
exercised the kernel.

---

## Working conventions

- **Verify before claiming done.** Run the tests; report failures with output. Do not say
  "green" without having run it, ideally from a fresh clone.
- **Branch / PR flow.** Develop on the designated feature branch; open PRs as **draft**.
  If a PR for the branch already merged, treat follow-ups as fresh: reset the branch from
  latest `main` (a force-with-lease is fine when it holds only already-merged history).
- **Match the surrounding code.** Comment density, naming, and idiom vary between the
  kernel (terse, dependency-free ES modules) and the app (React/TS) — follow local style.
- **Cross-repo contract.** `Sovereign-Dignity` hand-mirrors the kernel contract types
  (no shared package yet — see ADR-004 there). If you change the `Intent` / `Invariant` /
  `CapabilityRegistration` / `Seal` shape here, the mirror there must change too.

---

## What's real vs. mock right now (summary — `PLATFORM.md` is authoritative)

- ✅ **Real:** SHA-256 (`hash.js`), the charter compiler + gate, self-healing runtime,
  the Intent/registry/loop, the audit **Merkle Mountain Range** (`mmr.js` + `audit.js`,
  with O(log n) inclusion proofs), and **Ed25519** seal signatures (`ed25519.js` + `seal.js`).
- 🟡 **Honest mock:** `proof.js` + `proof-resolvers.js` (in-process, not transferable/ZK),
  the `core/qssm-rs` + `core/moloch-mmr` Rust crates (placeholder hashing — the audit MMR
  is now the real `mmr.js`, so the crate is superseded for that path).
- ⚪ **Planned:** the Rust services + React Native app (Dignity), a published
  `@sovereign/kernel`, real ZK (Dominion/AEC only), production **key custody** (a KMS/HSM
  behind the `createEd25519Signer` seam — the scheme is real, custody is dev-grade).

**Tier 1 of `ROADMAP.md` is done** (real Ed25519 signatures + real MMR — two 🟡→✅). Next:
enable GitHub Actions so the 62 checks gate merges, record the trust-model ADR in
Sovereign-Dignity, then production key custody and Tier 2 persistence.
