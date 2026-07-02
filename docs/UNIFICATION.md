# Unification Spec — Sovereign Dominion + Sovereign Dignity

**Status:** Draft (kernel side), domain corrected. The domain layer was originally
guessed at before the `Sovereign-Dignity` repository could be reviewed, and that guess
was wrong: an earlier draft of this document assumed a homeless-services HMIS domain
(coordinated entry, VAWA DV segregation, HUD LSA/APR/CAPER/PIT reporting). Having since
read `Sovereign-Dignity`'s `develop` branch — its frozen "canonical specification v1.0"
(README + three accepted ADRs) — the real domain is **HUD NSPIRE physical housing
inspection**: an offline-first inspector app producing cryptographically hashed and
chained evidence (SHA-256, Ed25519, Merkle) of dwelling-unit condition, verified by
backend ledger/verifier services. Everything below the "Kernel" line is authoritative;
everything in the "Domain" line is a contract the housing-inspection app must satisfy,
not a claim about what it currently does.

**Implementation note:** the first real, typed kernel code already landed as the
standalone `/kernel` package (`@sovereign/kernel`, PR #16) — a pure,
framework-neutral JS module (no DOM, no backend, no build step) implementing the
`Intent → Gate → Verify → Execute → Observe → Seal` loop, with a runnable
smoke test at `kernel/test/kernel.test.mjs`. It was written against the earlier,
incorrect homeless-services domain guess; this pass corrects its domain-flavored
comments, README, and test fixtures to the NSPIRE housing-inspection domain
below, without changing the mechanism (gate/verify/execute/observe/seal), which
was already domain-agnostic.

---

## 1. Thesis

Dominion and Dignity are **one kernel pointed at opposite ends of "what are we protecting."**

- **Dominion** proves *structures* are safe without trusting the inspector (a beam, IBC 1604).
- **Dignity** proves *dwellings* are safe and code-compliant without trusting a paper
  inspection report anyone could falsify (NSPIRE deficiencies, evidence chain of custody).

Same machinery — proof, audit, gate, self-heal, seal — different inspection object.

> Dominion is the compiler. Dignity is the type system. Together they are a **trust
> layer for the built environment.**

---

## 2. What "merge" means (and does not)

Merge the **kernel and the identity**. Keep the **domains clean**.

- **One kernel** — Intent envelope, invariant gate, ZK proof, immutable
  audit (Moloch MMR), self-healing invariants, Seal issuer. Domain-agnostic.
- **One identity** — the crest, the Seal, the auth/audit spine.
- **Housing inspection (Dignity) is the flagship domain.** Construction/IBC/SCUGS
  (Dominion) is a *separate, optional domain module* that shares the kernel.

**Non-goal:** a single UI that mixes dwelling-unit inspection with structural
inspection. A housing inspector working an NSPIRE unit inspection must never see a
beam-stress surface, and a structural inspector must never see NSPIRE deficiency
workflows — the taxonomies, credentials, and reporting obligations differ even though
both are "inspect an object, hash the evidence, seal a verified record." Shared kernel,
separate surfaces.

---

## 3. Layered architecture

```
┌───────────────────────────────────────────────────────────────┐
│ SURFACES        housing inspector app (holds evidence) ·       │
│                 owner/PHA attestation portal · HUD NSPIRE       │
│                 reporting · (separately) structural inspector  │
├───────────────────────────────────────────────────────────────┤
│ DOMAIN          Dignity/Housing — NSPIRE-conformant inspection  │
│                 model + evidence chain                          │
│                 Dominion/AEC  — IBC 1604 + SCUGS (separate app) │
├───────────────────────────────────────────────────────────────┤
│ KERNEL          Intent → Gate → Execute → Observe → Seal        │
│   proof (QSSM/ZK) · audit (Moloch MMR) · invariant gate ·       │
│   self-healing invariant runtime · capability registry · Seal   │
├───────────────────────────────────────────────────────────────┤
│ CONSTITUTION    machine-checkable invariants (the Dignity charter)│
│   evidence immutability · chain of custody · inspector           │
│   credentialing · dual attestation · retention                   │
└───────────────────────────────────────────────────────────────┘
```

The **Constitution** is what makes "Dignity" more than a name: the rights and red-lines
are code, checked by the kernel on every action, not policy prose in a binder.

---

## 4. The seam — the contract that makes it one platform

Both domains speak one contract to the kernel. This is the merge; a shared UI is not.

```ts
// Every domain action is an Intent.
interface Intent {
  id: string;
  actor: ActorRef;                 // who (role-scoped, e.g. credentialed inspector)
  subject: SubjectRef;              // whom/what it concerns (dwelling unit, beam, …)
  action: string;                  // "inspection.submit_evidence", "beam.assess", …
  domain: "housing" | "aec";
  payload: unknown;                // NSPIRE-conformant record for Housing
  requiredProofs: string[];        // e.g. ["evidence.hash_valid", "inspector.credential_valid"]
}

// The Constitution is a set of Invariants (see /constitution).
interface Invariant {
  id: string;                      // "evidence.chain_of_custody"
  appliesWhen: Predicate;          // when this rule is in force
  mustHold: Predicate;             // what must be true
  onViolation: "block" | "rollback";
  rationale: string;               // human-readable "why"
}

// Domains register their capabilities + invariants at boot.
interface CapabilityRegistration {
  domain: "housing" | "aec";
  actions: ActionSpec[];           // what this domain can ask the kernel to do
  invariants: Invariant[];         // domain-specific rules layered on the base charter
}
```

**Kernel loop** (implemented in `/kernel` — `@sovereign/kernel` — generalizing the
`demo/` prototypes' Intent → ExecutionGraph + self-healing runtime):

```
submitIntent(intent)
  → gate(intent, Constitution)      // all mustHold predicates pass, else block
  → verify(intent.requiredProofs)   // ZK / hash proofs check out
  → execute(intent)                 // domain handler runs
  → observe()                       // hash → append to Moloch MMR (tamper-evident)
  → seal(intent)                    // issue/refresh the evidence Seal
// self-healing: if a post-condition invariant drifts, roll back to last verified-safe state
```

---

## 5. Monorepo layout (target)

```
/kernel         @sovereign/kernel — qssm-rs, moloch-mmr, invariant runtime,
                intent/exec-graph, capability-registry, seal issuer  (publishable)
/constitution   invariant DSL + charter rulesets (this repo seeds it)
/domain-housing Sovereign-Dignity — HUD NSPIRE-conformant inspection model + evidence chain
/domain-aec     Dominion — IBC 1604 + SCUGS (the current demo, productized)
/surfaces       housing inspector · owner/PHA attestation · HUD reporting ·
                (separate) structural inspector
/reference      the beam demo, kept as a proof-of-kernel + marketing artifact
```

The current `demo/` remains `/reference` (proof that the kernel works end-to-end).
`/kernel` (`@sovereign/kernel`) already exists per this layout; `core/` (qssm-rs,
moloch-mmr) are the real-crypto swap points its `proof.js`/`audit.js` mocks point at.

---

## 6. NSPIRE conformance (the floor)

The kernel is **additive**; it never replaces the HUD-mandated inspection standard.

- **NSPIRE standards** — HUD's National Standards for the Physical Inspection of Real
  Estate (the unified successor to UPCS/HQS) define the inspectable areas (site,
  building exterior, building systems, unit, common areas) and a deficiency severity
  scale (life-threatening, severe, moderate/low). Kernel primitives attach *alongside*
  a conformant finding (a proof, an audit entry, a seal) — they do not rename or replace
  the standard's own taxonomy.
- **Interchange** — inspection results and deficiency records should round-trip with
  HUD's inspection systems (successor to REAC/PIC scoring), not depend on deep,
  proprietary plugins into closed vendor tools.
- **Inspector credentialing** — every `inspection.submit_evidence` Intent carries a
  `requiredProofs` entry that the acting inspector holds a valid HUD NSPIRE certification;
  this becomes a Constitution invariant (`inspector.credential_valid`), not a UI-only check.
- **Reporting** — deficiency and scoring reports generated from the canonical store; the
  MMR root can attest a report was produced from an unaltered evidence chain.

---

## 7. Non-negotiable design principles

1. **Humans attest; AI assists.** An AI classifier may flag a likely deficiency, pre-fill
   a severity level, or surface a data-quality warning — it never issues a Seal on its
   own. A credentialed human inspector of record must attest to every finding before the
   Seal is issued (`inspection.dual_attestation` — inspector + reviewer sign-off). No
   confidence score substitutes for that attestation.
2. **HUD standards are the floor.** Conform to the NSPIRE deficiency taxonomy and
   severity scale first; add cryptography underneath.
3. **Reduce friction or don't ship it.** If a feature slows down an on-site inspection,
   it fails the dignity test. One-tap evidence capture, pre-filled unit context,
   automated report assembly.
4. **Private tamper-evident audit — not a public blockchain.** Moloch MMR stays a private
   append-only log unless a specific cross-agency trust need justifies more.
5. **Crypto honesty.** Pick one lane and state it. QSSM's post-quantum lattice claim and
   a curve-based SNARK (e.g. Nova) are *different* trust models — a mobile PoC may choose
   Nova, but then it is not post-quantum. Don't claim both.

---

## 8. Phased plan (each step ships value alone)

1. **Extract the kernel** from `demo/` + `core/` into the standalone `@sovereign/kernel`
   package at `/kernel` — done (PR #16); this pass corrects its domain framing.
2. **Write the Constitution** for this domain — encode evidence immutability, chain of
   custody, inspector credentialing, dual attestation (seeded in `/constitution` — see
   `charter.housing-inspection.example.yaml`) — done. The charter is no longer just a
   design sketch: `kernel/src/charter-compiler.js` compiles its `appliesWhen`/`mustHold`
   strings into real, safe predicate functions (a hand-written parser + interpreter, no
   `eval`), proven against both charter files in `kernel/test/charter-compiler.test.mjs`.
3. **Wrap one Housing write path** (submit inspection evidence) as an Intent through the
   kernel — done as a reference integration: `kernel/test/housing-domain.integration.test.mjs`
   drives the real `createKernel()` pipeline, invariants loaded straight from
   `charter.housing-inspection.example.yaml`, against an in-memory evidence store —
   chained submissions seal, a tampered `previousHash` blocks, an expired inspector
   credential blocks, and a finalize that downgrades a life-threatening finding is caught
   even with valid dual attestation. Still owed: the real `services/ledger` (Rust, per
   `Sovereign-Dignity`'s ADR-001) replacing the in-memory store.
4. **Audit everything** — every evidence submission hashes into the MMR (the reference
   integration's `AuditLog` proves the shape; swapping in the real Moloch MMR is still
   owed, see §7 point 4 above).
5. **One ZK/hash predicate** — scope the first proof to a single, cleanly-provable claim,
   e.g. *"this evidence hash matches what the inspector captured on-device"* — not a
   vague "prove the unit passed."
6. **Issue the evidence Seal** for that one submission.
7. **Report attestation** — the deficiency/scoring report carries an MMR root proving
   integrity.

---

## 9. Open reconciliation points

Resolved this pass (from `Sovereign-Dignity`'s accepted ADRs):
- **Stack**: Rust backend services (api-gateway, ledger, verifier, report-generator),
  React Native mobile (Inspector Mobile), Supabase (Postgres + auth + storage),
  spec-first development (OpenAPI, JSON Schema, AsyncAPI, TLA+, Alloy).
- **Existing consent/ROI handling**: not applicable — no client PII/eligibility
  semantics in this domain; drop that reconciliation concern entirely.

Still open:
- **NSPIRE deficiency taxonomy mapping** — the exact field-level mapping from HUD's
  NSPIRE standard categories/severity levels into `packages/shared-types` needs a pass
  against the actual published standard, not just this spec's summary.
- **Auth & tenancy** (multi-PHA / property-owner scoping): the actor model the kernel
  gate keys off.
- **Dual-attestation workflow**: who the "reviewer" role is (peer inspector? supervisor?)
  and how that maps to `CapabilityRegistration.actions`.

---

## 10. Risks

- **Procurement/certification reality** — becoming a HUD-recognized inspection system
  is a certification + comparability process, not just a deploy.
- **Proving cost/latency** — batch, on-device where possible, cache; must not slow down
  an on-site inspection.
- **Governance of the Constitution** — HUD guidance + legal own the rules, not engineers
  alone.
- **Scope creep** — resist fusing the AEC and Housing surfaces; the kernel is the only
  thing they share.
