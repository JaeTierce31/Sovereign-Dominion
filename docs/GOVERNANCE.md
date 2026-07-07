# Ecosystem Governance — repository boundaries, dependency rules, versioning

**Normative for all Sovereign Ecosystem repositories.** Companion to
[`ECOSYSTEM.md`](ECOSYSTEM.md) (the map), [`CDP-SPEC.md`](CDP-SPEC.md) (the domain
contract), and [`PILLARS.md`](PILLARS.md) (the pillar architecture — capabilities as
the enduring units, repos as implementation details). The failure mode this document exists to prevent: *governance logic
embedded in apps instead of enforced by the kernel* — once domain rules leak into
application code or kernel code grows domain nouns, auditability and the
constitutional guarantee are gone.

---

## 1. Repository roles and boundaries

### Sovereign-Dominion — constitutional runtime

**Mission:** the verification kernel and its Constitution.

| Allowed | Forbidden |
|---|---|
| `@sovereign/kernel` (pipeline, gate, proof seams, MMR audit, Ed25519 seal, self-healing) | Domain business logic in `kernel/src/` — no `patient`, `inspection`, `dwelling`, `deploy` |
| Charter compiler + base charters (`constitution/`) | Application state or UI inside the kernel package |
| The AEC + Visual **reference domains** and demo (until factored out per CDP-SPEC §5) | New domains landing here by default — new CDPs get their own home |
| Ecosystem-level docs (this file, ECOSYSTEM, CDP-SPEC, PLATFORM, ROADMAP) | |

### Sovereign-Development — engineering platform

**Mission:** how the ecosystem is built — Peregrine IDE, and (future) scaffolding,
SDK generation, CI tooling, deployment orchestration.

| Allowed | Forbidden |
|---|---|
| Peregrine IDE (app code lives here as the platform's own product) | Kernel or crypto implementation |
| Generators, templates, CLI, CI/CD tooling | Verification-domain logic (housing, AEC, clinical rules) |
| The **planned** `cdp.development` charter (deploys/releases as Intents) — after the kernel publishes | Hand-mirroring the kernel contract (D3: consume the published package only) |

### Sovereign-Dignity — human-facing domain(s)

**Mission:** regulated, human-facing service domains; Housing/NSPIRE is the
flagship.

| Allowed | Forbidden |
|---|---|
| CDP content: charter, ontology/shared-types, evidence schemas, specs, ADRs | Kernel implementation (its `shared-types` mirror is a *temporary, ADR-004-documented* exception, retired when the kernel publishes) |
| Domain services (ledger, verifier, …) and apps (inspector mobile, portals) | Cryptographic primitives beyond consuming the kernel's |
| | Other domains' logic (no clinical code in housing, etc.) |

### Retired repos

`hmis-platform`, `Peregrine.ai`, `Peregrine.dev` — superseded notices only; archive
per `ECOSYSTEM.md` §5. No new work lands in them.

## 2. Dependency direction (acyclic, always)

```
Applications  (thin consumers)
     ↓
CDPs          (charter + ontology + capabilities)
     ↓
@sovereign/kernel
     ↓
Foundation    (hash/curve primitives, std lib)
```

Never, in any repo:

- kernel → CDP or application (the kernel imports no domain)
- CDP → CDP (shared concepts move down or stay deliberately duplicated)
- application → application
- foundation → kernel

Cross-domain communication happens through kernel contracts (Intents, Seals, audit
proofs) — a housing app verifies an AEC Seal via `verifySeal`, never by importing
AEC code.

**Current sanctioned violation:** Sovereign-Dignity hand-mirrors the kernel contract
(ADR-004) because no package registry is in use yet. This is debt with a named
retirement (kernel publication, `ROADMAP.md` Tier 2), not a precedent — no second
mirror may be created.

## 3. Versioning policy

Defined in [`CDP-SPEC.md`](CDP-SPEC.md) §10: semver everywhere; kernel major =
ABI break; CDPs version independently and declare compatible kernel/spec ranges.
Until the kernel publishes, contract changes follow the same-session mirror rule.

## 4. Governance CI (target; honest status)

Target state — every PR in every ecosystem repo is gated on:

1. the repo's own suites (Dominion kernel: 71 checks; Dignity shared-types;
   Development `tsc --noEmit` + lint),
2. the CDP conformance checklist (`CDP-SPEC.md` §8) once automated,
3. boundary checks (§1 forbidden lists; kernel domain-noun grep; dependency-direction
   lint).

**Status today:** the test suites exist and run; **GitHub Actions does not yet gate
merges in Dominion** (`ROADMAP.md` Tier 0 #1 — still the cheapest outstanding win);
the conformance + boundary automation is ⚪ not built. Saying "merges are
constitutionally gated" before that lands would be an unlabeled mock — this section
states the target, not an achievement.

## 5. The compiler direction (explicitly long-term)

The charter compiler (YAML → predicates, no `eval`) is the seed of a larger
**Constitution Compiler**: declarative CDP artifacts (charter, ontology, evidence
rules) compiled into SDKs, schemas, validators, compliance tests, and kernel
registration manifests. Today only the charter→predicate stage exists (✅ real,
both repos). Everything else in that vision is ⚪ design direction — it belongs in
Sovereign-Development when work starts, and claims about it stay out of product
prose until then.

## 6. Change control for this document

This file and `CDP-SPEC.md` change by PR to Sovereign-Dominion with the same review
bar as kernel contract changes. A boundary exception must be written down here (as
ADR-004 is) with an owner and a sunset condition — undocumented exceptions are
violations.
