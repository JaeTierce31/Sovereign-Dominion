# `src/kernel` — the Sovereign kernel

This is the first real, typed implementation of the contract `docs/UNIFICATION.md` §4
describes: `Intent` → `Gate` → `Verify` → `Execute` → `Observe` → `Seal`. Before this
pass, that loop existed only as prose in the spec, a YAML sketch in `/constitution`,
and hardcoded single-purpose prototypes in `demo/` (`intent.js`, `exec-graph.js`,
`capability-registry.js`, `self-healing.js`, `seal-ring.js`) built for one beam demo.

## What's here

| File | Generalizes | What changed |
|---|---|---|
| `types.ts` | UNIFICATION §4 prose | Real `Intent`/`Invariant`/`CapabilityRegistration`/`Seal` interfaces |
| `gate.ts` | the invariant *shape* in `constitution/*.yaml` | A typed predicate evaluator — no expression-language parsing of the YAML at runtime (see below) |
| `executionGraph.ts` | `demo/exec-graph.js` | Same node lifecycle, DOM rendering stripped out (that's a per-surface concern) |
| `capabilityRegistry.ts` | `demo/capability-registry.js` | Runtime `register()` of any domain's `CapabilityRegistration`, not a hardcoded array |
| `selfHealing.ts` | `demo/self-healing.js` | Parameterized over any state type + invariant predicate, not hardcoded to beam yield strength |
| `seal.ts` | `demo/seal-ring.js` | Actually issues/verifies a `Seal` record; the demo file remains a pure animation of one |
| `kernelLoop.ts` | — (new) | The orchestrator wiring the pieces above into `submitIntent()` |

## Why the Constitution YAML isn't parsed here

`constitution/charter.example.yaml` and `constitution/charter.housing-inspection.example.yaml`
write `appliesWhen` / `mustHold` as strings (e.g. `"action == 'enrollment.share'"`) for
human readability. `gate.ts` deliberately does **not** evaluate those strings at
runtime — doing so would mean `eval`/`new Function` over config text, which is an
unnecessary injection surface. Instead, a domain compiles its charter into real
`Invariant` objects with TypeScript predicate functions and registers them via
`CapabilityRegistry.register()`. The YAML stays what `constitution/README.md` already
called it: a design artifact for human/legal review, not an executable one.

## Why `src/kernel/`, not the top-level `/kernel` UNIFICATION.md describes

`docs/UNIFICATION.md` §5 targets a standalone, publishable `@sovereign/kernel` package.
This pass stages the same code at `src/kernel/` instead, so it's covered by the
existing `tsconfig.json` (`include: ["src"]`), `vitest.config.ts`
(`tests/unit/**/*.test.ts`), and `eslint.config.js` (`src/**/*.{ts,tsx}`) without any
build-config changes. Promoting it to a standalone package with its own
`package.json` is future work, once it's ready to be consumed by more than this repo
(e.g. by `Sovereign-Dignity`, which today mirrors these types locally under
`packages/shared-types` — see that repo's `docs/adr/004-kernel-integration.md`).

## What's deliberately not done in this pass

- `demo/*.js` is **not** rewired to import from `src/kernel/` — it's a working,
  independently-shipped hackathon artifact; rewiring it is a separate, riskier change.
- `core/qssm-rs` / `core/moloch-mmr` are untouched. Both admit in their own code
  comments that they use placeholder hashing, not real ZK/SHA-256 — replacing that is
  a cryptography task, not a kernel-shape task.
