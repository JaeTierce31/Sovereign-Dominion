# Constitutional Domain Package Specification (CDP-SPEC)

**Version: 1.0.0-rc.1 — release candidate, not yet frozen.** See §9 for the freeze
criteria. Held to the platform's first principle — **crypto honesty** — throughout:
every requirement states whether the kernel *enforces it today*, *supports it with a
seam*, or *does not implement it yet*. A specification that claims more than the
runtime delivers would violate the constitution it describes.

Read alongside [`ECOSYSTEM.md`](ECOSYSTEM.md) (the portfolio map),
[`GOVERNANCE.md`](GOVERNANCE.md) (repository boundaries + dependency rules),
[`UNIFICATION.md`](UNIFICATION.md) (the original two-domain merge spec this
generalizes), and [`PLATFORM.md`](PLATFORM.md) (the real/honest-mock/planned matrix).

---

## 1. Purpose

A **Constitutional Domain Package (CDP)** is the smallest independently governable
unit in the Sovereign Ecosystem: everything a domain must supply to run on
`@sovereign/kernel`, and nothing the kernel supplies itself.

The division of labor is absolute:

- **The domain supplies:** identity, charter, ontology (payload types), evidence
  rules, capability registrations (actions + handlers), proof requirements, and its
  evolution ledger.
- **The kernel supplies:** the execution pipeline, the invariant gate, proof
  verification, the tamper-evident audit MMR, the Ed25519 Seal, and self-healing.
- **The kernel never contains domain concepts.** No `patient`, no `inspection`, no
  `beam`, no `deploy` inside `kernel/src/` — a grep for domain nouns in the kernel is
  a conformance check (§8).

This generalizes what already exists: the AEC and Housing domains differ *only* in
the handlers and invariants they register (`UNIFICATION.md` §4). A CDP is that
pattern, named and made a contract.

## 2. The Constitutional ABI

Every CDP executes through exactly one pipeline — the kernel loop implemented in
`kernel/src/pipeline.js` (`createKernel`), **real today**:

```
submitIntent → GATE → VERIFY → EXECUTE → OBSERVE → SEAL
```

with exactly one terminal status per submission:
`sealed` · `blocked` · `proof_failed` · `no_handler` · `error`.

Nothing bypasses the gate. **Fail closed** is normative: a throwing invariant, an
unresolved required proof, or an unknown action refuses the Intent.

The stages decompose as follows (this is the mapping from the extended
Authenticate → Authorize → Policy → Evidence → Reason → Verify → Execute → Observe →
Audit → Seal formulation onto the ABI as built):

| Extended stage | ABI v1 home | Status |
|---|---|---|
| Authenticate / Authorize | GATE — actor-scoped invariants (e.g. `inspector.credential_valid`) + `requiredProofs` | ✅ enforced via charter predicates |
| Policy | GATE — compiled charter invariants (`charter-compiler`) | ✅ real |
| Evidence | VERIFY — proof resolvers over off-Intent witnesses | 🟡 real SHA-256, in-process (not transferable/ZK) |
| Reason | **Pre-Intent, advisory only.** AI/rules/simulation may propose an Intent or annotate it; no reasoning output substitutes for human attestation (constitutional: *humans attest, AI assists*) | ⚪ interface direction; not a kernel stage |
| Verify | VERIFY | ✅ seam real, schemes per §6 |
| Execute | EXECUTE — the registered domain handler | ✅ real |
| Observe | OBSERVE — append to the audit MMR | ✅ real |
| Audit | the MMR itself + inclusion proofs | ✅ real |
| Seal | SEAL — Ed25519-signed portable credential | ✅ real (custody dev-grade) |

**ABI stability rule:** the five-stage loop, the five terminal statuses, and the
`Intent` / `Invariant` / `CapabilityRegistration` / `Seal` shapes are the frozen
surface. Adding stages (e.g. promoting Reason into the pipeline) is a **major**
version change (§10).

## 3. Required CDP components

A conforming CDP supplies all of the following. "Reference" points at the existing
implementation that proves the layer is realizable.

### 3.1 Identity (manifest)

A `cdp.yaml` (or equivalent front-matter in the charter) declaring:

```yaml
cdp:
  id: cdp.housing            # reverse-dot, stable forever
  name: Housing / HUD NSPIRE inspection
  version: 0.1.0             # semver, independent per CDP
  kernel: ">=1.0 <2"         # required kernel ABI range
  cdp_spec: "1.0"            # spec version implemented
  owner: <accountable human/org>
  maturity: spec | reference | production
```

*Status: convention, new in this spec — no CDP ships a manifest yet.*

### 3.2 Charter (the constitutional heart)

Machine-checkable invariants in charter YAML, compiled to real predicates by the
charter compiler — **never** `eval`/`new Function`, always fail-closed.

Reference: `constitution/charter.housing-inspection.example.yaml` (7 enforced
invariants) compiled by `kernel/src/charter-compiler.js`; TypeScript port in
Sovereign-Dignity `packages/shared-types`. *Status: ✅ real.*

Every charter MUST cover, at minimum: evidence integrity, actor
credentialing/authorization, dual **human** attestation before any Seal, disclosure
non-downgrade where a severity/risk scale exists, retention, and audit
append-onlyness. A charter is not legal review — legal validation is tracked in the
evolution ledger (§3.7), not claimed.

### 3.3 Ontology (typed payloads)

The domain's typed vocabulary — the payload types Intents carry (`DwellingUnit`,
`InspectionEvidence`, `Deficiency`; `Beam`, `Material`; …) plus JSON Schemas for
interchange.

Reference: Sovereign-Dignity `packages/shared-types/src/domain.ts` +
`specifications/*.schema.json`. *Status: ✅ as types/schemas; a queryable typed
graph is ⚪ not built and not claimed.*

### 3.4 Evidence rules

Nothing enters VERIFY without provenance: source, capture context, hash, effective
date. Raw witness bytes stay off the Intent (on-device / out of the shared
envelope); only hashes travel — the kernel's `verify-step` tests assert bytes never
reach the audit record.

Reference: `kernel/src/proof-resolvers.js` (`hashIntegrityResolver`,
`scheme: 'sha256-integrity/in-process'`) + Dignity's evidence schema.
*Status: 🟡 integrity real; provenance schema exists in Housing; transferable
proofs are the §6 upgrade path.*

### 3.5 Capabilities (Intent model + handlers)

A `CapabilityRegistration`: the action names the domain answers for
(`inspection.submit_evidence`, `beam.assess`, `visual.generate`, planned
`deploy.promote`), their handlers, and the domain-specific invariants layered on the
base charter. Unknown actions terminate as `no_handler` — never default-allow.

Reference: `kernel/src/capability-registry.js` + the AEC/Housing/Visual
registrations in `kernel/test/`. *Status: ✅ real.*

### 3.6 Verification scheme declaration

Each required proof names its scheme **honestly**:

| Scheme label | Meaning | Status |
|---|---|---|
| `sha256-integrity/in-process` | Real SHA-256 integrity check, verifier in-process | ✅ |
| `ed25519` | Real issuer signature (non-repudiation) | ✅ (custody dev-grade) |
| `mmr-inclusion` | Real Merkle Mountain Range inclusion proof | ✅ |
| `mock` | Deterministic placeholder prover | 🟡 labeled mock |
| `zk-*` | Transferable zero-knowledge proof | ⚪ planned, Dominion/AEC differentiator only — deliberately **out of scope** for the PII-free Housing path (`ROADMAP.md` §0) |

A CDP that needs a scheme not on this list proposes it here first.

### 3.7 Evolution ledger

A `GOVERNANCE-DEBT.md` (or ADR series) in the CDP recording: unvalidated
assumptions (e.g. "charter not legally reviewed"), spec debt, evidence debt, each
with owner + sunset condition. This is the honesty matrix discipline applied to the
domain. *Status: convention — Dignity's ADRs are the closest existing practice.*

## 4. What a CDP MUST NOT contain

- Kernel or crypto **implementation** (it consumes `@sovereign/kernel`; it does not
  fork it).
- Another CDP as a dependency — shared concepts move down into the kernel/foundation
  or stay duplicated deliberately. (Housing never imports AEC.)
- Application UI. Apps are thin consumers of a CDP, one layer up (`GOVERNANCE.md`).
- Un-labeled trust claims. Every cryptographic property carries its scheme label.

## 5. CDP registry

The ecosystem's domains, honestly staged:

| CDP | Domain | Repo | Status |
|---|---|---|---|
| `cdp.aec` | Structural / IBC 1604 compliance | Sovereign-Dominion (`src/`, `demo/`, kernel tests) | **Reference** — the original working domain; not yet factored into CDP layout |
| `cdp.housing` | HUD NSPIRE inspection | Sovereign-Dignity | **Spec + shared-types** — charter enforced, services/mobile ⚪ |
| `cdp.visual` | Governed visual generation (VGL) | Sovereign-Dominion (`BRIA-VGL-SYNTHESIS.md` + integration tests) | **Reference integration** |
| `cdp.development` | Governed software delivery (deploys/releases as Intents) | Sovereign-Development | ⚪ **Planned** — gated on kernel publication (D3) |
| `cdp.mesi` | Healthcare / medication-assisted treatment | **No repository presence today.** MESI exists as an architectural proposal in ecosystem discussion, not as code, spec files, or a charter in any of the six repos | ⚪ **Proposed** — enters the registry when its charter + ontology + manifest exist somewhere reviewable |

Future domains (justice, education, environment, …) enter the same way: manifest +
charter + ontology first, applications last.

## 6. Reasoning layer (normative constraint)

Reasoning engines (deterministic rules, Bayesian/PK models, LLMs, simulation) are
**pluggable and advisory**. The constitutional constraints, already enforced in the
Housing charter and non-negotiable for every CDP:

1. No reasoning output issues or substitutes for a Seal.
2. Dual *human* attestation precedes any Seal; no confidence score substitutes.
3. Reasoning provenance (engine, version, inputs-by-hash) belongs in the audit
   record when reasoning influenced an Intent.
4. **Safety invariants are bounded and enumerable.** A CDP charters specific,
   checkable rules (the Housing charter's enumerable NSPIRE rules with ordinal
   severity are the precedent) — "universal harm detection" is not a chartable
   claim. An unevaluated safety invariant **fails closed**: the kernel already
   refuses on a throwing invariant, an unresolved required proof, or an unknown
   action, and no CDP may weaken that to default-allow.
5. **Clinical domains never place PHI in audit content.** For any CDP handling
   protected health information (`cdp.mesi` when it materializes): audit leaves
   carry hashes and **salted commitments** only — `H(salt ‖ event)` with the salt
   held by the covered entity — so audit trees stay tamper-evident without a
   reportable disclosure. HIPAA / 42 CFR Part 2 applicability is a design
   constraint recorded now, binding on the domain's evidence rules from its first
   artifact.

A CDP that wants machine reasoning declares it in the manifest and routes it
pre-Intent. Anything stronger requires amending this spec (major version).

## 7. Lifecycle

```
DISCOVER → SPECIFY → CHARTER → IMPLEMENT → VERIFY → DEPLOY → OBSERVE → EVOLVE
```

with the ecosystem's standing rule from `ROADMAP.md` §0: **go deep before broad** —
one cryptographically honest end-to-end path per CDP before more surface area.
Housing is the worked example: spec frozen → charter enforced → reference
integration green → (next) one persisted vertical slice.

## 8. Conformance checks

To be automated as the constitutional compliance suite (CI, per `GOVERNANCE.md`);
until then this is the manual review checklist:

- [ ] Manifest present; kernel + spec version ranges declared
- [ ] Charter compiles under the charter compiler; adversarial suite passes
      (fail-closed proven, no `eval` escape)
- [ ] Every action registered; unknown action ⇒ `no_handler` test exists
- [ ] Every required proof names a scheme from §3.6, truthfully
- [ ] Dual-human-attestation invariant present and tested
- [ ] Audit append-only + inclusion-proof tests pass
- [ ] Kernel grep clean: no domain nouns in `kernel/src/`
- [ ] No CDP→CDP imports; no app logic in the CDP
- [ ] Evolution ledger exists and names its debts

## 9. Freeze criteria for v1.0.0

This spec freezes (rc → final) when — and only when — all three hold:

1. `@sovereign/kernel` is published as a versioned package (`ROADMAP.md` Tier 2 #2),
   so "consumes the kernel" is a dependency, not a hand-mirror.
2. **Two** CDPs conform end-to-end against the §8 checklist: `cdp.housing` and
   `cdp.aec` (the two that exist in code). A contract validated by zero
   implementations is a guess; by one, a coincidence; by two, an interface.
3. The compliance checklist runs in CI in every ecosystem repo.

Freezing before that would be the documentation equivalent of an unlabeled mock.

## 10. Versioning

- **Kernel (`@sovereign/kernel`)** — semver. Major: ABI change (pipeline stages,
  terminal statuses, contract shapes). Minor: additive. Patch: fixes.
- **CDP-SPEC** — semver. Major: new required component or ABI mapping change.
  Minor: optional capabilities. Patch: clarifications.
- **Each CDP** — independent semver; declares compatible kernel + spec ranges in its
  manifest.
- Until the kernel publishes, the ADR-004 hand-mirror discipline **is** the
  compatibility mechanism: contract changes in `kernel/` and Dignity's
  `shared-types` land in the same working session, always.

---

*Change discipline: as with `PLATFORM.md`, when a 🟡/⚪ in this spec becomes real,
move it and say what changed. When the §9 criteria are met, remove `-rc.1` in a
dedicated, reviewed freeze commit.*
