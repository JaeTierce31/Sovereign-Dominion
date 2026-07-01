# Unification Spec — Sovereign Dominion + Sovereign Dignity

**Status:** Draft (kernel side). The domain layer is pending reconciliation against
the `Sovereign-Dignity` repository (formerly `hmis-platform`), whose stack and data
model are not yet reviewed. Everything below the "Kernel" line is authoritative;
everything in the "Domain" line is a contract the HMIS app must satisfy, not a claim
about what it currently does.

---

## 1. Thesis

Dominion and Dignity are **one kernel pointed at opposite ends of "what are we protecting."**

- **Dominion** proves *structures* are safe without trusting the inspector (a beam, IBC 1604).
- **Dignity** proves *people* are served without exposing the person (eligibility, consent, HMIS).

Same machinery — proof, audit, gate, self-heal, seal — different domain payloads.

> Dominion is the compiler. Dignity is the type system. Together they are a **trust
> layer for human services.**

---

## 2. What "merge" means (and does not)

Merge the **kernel and the identity**. Keep the **domains clean**.

- **One kernel** — Intent envelope, consent/eligibility gate, ZK proof, immutable
  audit (Moloch MMR), self-healing invariants, Seal issuer. Domain-agnostic.
- **One identity** — the crest, the Seal, the auth/audit spine.
- **HMIS (Dignity) is the flagship domain.** Construction/IBC/SCUGS (Dominion) is a
  *separate, optional domain module* that shares the kernel.

**Non-goal:** a single UI that mixes human-services intake with structural inspection.
A caseworker running coordinated entry must never see a mold-inspection surface, and a
building inspector must never see client PII. Shared kernel, separate surfaces.

---

## 3. Layered architecture

```
┌───────────────────────────────────────────────────────────────┐
│ SURFACES        caseworker app · client portal (holds Seal) ·  │
│                 funder/HUD attestation · (separately) inspector │
├───────────────────────────────────────────────────────────────┤
│ DOMAIN          Dignity/HMIS  — HUD-conformant model + workflows│
│                 Dominion/AEC  — IBC 1604 + SCUGS (separate app) │
├───────────────────────────────────────────────────────────────┤
│ KERNEL          Intent → Gate → Execute → Observe → Seal        │
│   proof (QSSM/ZK) · audit (Moloch MMR) · consent gate ·         │
│   self-healing invariant runtime · capability registry · Seal   │
├───────────────────────────────────────────────────────────────┤
│ CONSTITUTION    machine-checkable invariants (the Dignity charter)│
│   consent scope · ROI expiry · DV segregation · human-in-loop ·  │
│   retention · purpose limitation                                 │
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
  actor: ActorRef;                 // who (role-scoped)
  subject: SubjectRef;             // whom/what it concerns (client, beam, …)
  action: string;                  // "enrollment.share", "eligibility.attest", …
  domain: "hmis" | "aec";
  payload: unknown;                // HUD-conformant record for HMIS
  requiredProofs: string[];        // e.g. ["consent.roi.valid", "eligibility.hud_vash"]
}

// The Constitution is a set of Invariants (see /constitution).
interface Invariant {
  id: string;                      // "consent.roi_scope"
  appliesWhen: Predicate;          // when this rule is in force
  mustHold: Predicate;             // what must be true
  onViolation: "block" | "rollback";
  rationale: string;               // human-readable "why"
}

// Domains register their capabilities + invariants at boot.
interface CapabilityRegistration {
  domain: "hmis" | "aec";
  actions: ActionSpec[];           // what this domain can ask the kernel to do
  invariants: Invariant[];         // domain-specific rules layered on the base charter
}
```

**Kernel loop** (already implemented in Dominion as Intent → ExecutionGraph +
self-healing runtime):

```
submitIntent(intent)
  → gate(intent, Constitution)      // all mustHold predicates pass, else block
  → verify(intent.requiredProofs)   // ZK proofs check out
  → execute(intent)                 // domain handler runs
  → observe()                       // hash → append to Moloch MMR (tamper-evident)
  → seal(intent)                    // issue/refresh client-held credential
// self-healing: if a post-condition invariant drifts, roll back to last verified-safe state
```

---

## 5. Monorepo layout (target)

```
/kernel         @sovereign/kernel — qssm-rs, moloch-mmr, invariant runtime,
                intent/exec-graph, capability-registry, seal issuer  (publishable)
/constitution   invariant DSL + charter rulesets (this repo seeds it)
/domain-hmis    Sovereign-Dignity — HUD-conformant model + workflows
/domain-aec     Dominion — IBC 1604 + SCUGS (the current demo, productized)
/surfaces       caseworker · client-Seal · funder · (separate) inspector
/reference      the beam demo, kept as a proof-of-kernel + marketing artifact
```

The current `demo/` becomes `/reference` (proof that the kernel works end-to-end);
`core/` (qssm-rs, moloch-mmr) is the seed of `/kernel`.

---

## 6. HMIS conformance (the floor)

The kernel is **additive**; it never replaces the HUD-mandated data layer.

- **HMIS Data Standards** — Universal Data Elements (UDE) and Project Descriptor Data
  Elements (PDDE) are the canonical schema. Kernel primitives attach *alongside* a
  conformant record (a proof, an audit entry, a seal) — they do not rename or replace it.
- **Interchange** — HUD **HMIS CSV / XML** import-export is the integration path with
  other systems, not deep plugins into closed vendor products (WellSky/ServicePoint,
  Bitfocus/Clarity).
- **Reporting** — LSA, APR/CAPER, PIT/HIC generated from the canonical store; the MMR
  root can attest a report was produced from an unaltered dataset.
- **Regulatory** — 42 CFR Part 2 (substance-use records), FERPA where applicable, and
  state rules constrain sharing. These become Constitution invariants.

---

## 7. Non-negotiable design principles

1. **Humans decide; AI advises.** The Council may surface an *explainable, overrideable*
   recommendation or a data-quality flag — it never gates a person's access to housing or
   benefits. "A human made this determination" is itself an invariant. No confidence
   threshold (φ or otherwise) may substitute for a human eligibility determination.
2. **DV data is segregated, not just masked.** Under VAWA, victim-service-provider client
   data does **not** enter the shared HMIS at all — a separate comparable database holds
   it and shares only de-identified/aggregate data. The invariant is *segregation*, not
   *geofence the location*.
3. **HUD standards are the floor.** Conform first; add cryptography underneath.
4. **Reduce friction or don't ship it.** If a feature slows an intake, it fails the
   dignity test. One-click attestations, pre-filled consent, automated reporting.
5. **Private tamper-evident audit — not a public blockchain.** Moloch MMR stays a private
   append-only log unless a specific cross-agency trust need justifies more.
6. **Crypto honesty.** Pick one lane and state it. QSSM's post-quantum lattice claim and a
   curve-based SNARK (e.g. Nova) are *different* trust models — a mobile PoC may choose
   Nova, but then it is not post-quantum. Don't claim both.

---

## 8. Phased plan (each step ships value alone)

1. **Extract the kernel** from `demo/` + `core/` into `@sovereign/kernel`.
2. **Write the Constitution** — encode consent scope + ROI expiry + DV segregation +
   human-in-the-loop (seeded in `/constitution` — see `charter.example.yaml`).
3. **Wrap one HMIS write path** (enrollment) as an Intent through the kernel.
4. **Audit everything** — every record mutation hashes into the MMR.
5. **One ZK predicate** — scope the first proof to a single, cleanly-provable claim, e.g.
   *"chronically homeless ≥ 12 months"* attestation — not a vague "prove eligibility."
6. **Issue the client Seal** for that one credential.
7. **Report attestation** — APR/LSA carries an MMR root proving integrity.

---

## 9. Open reconciliation points (need the `Sovereign-Dignity` repo)

- Its **stack** (Node/Rails/Django/…): decides how `/domain-hmis` plugs into the kernel.
- Whether its **data model already conforms to HUD standards**: decides adapt-vs-wrap.
- Existing **consent / ROI handling**: maps to Constitution invariants or replaces them.
- **Auth & tenancy** (multi-agency / CoC): the actor model the kernel gate keys off.

---

## 10. Risks

- **Procurement/certification reality** — becoming a CoC's system of record is a
  selection + HUD-comparability process, not just a deploy.
- **ZK proving cost/latency** — batch, server-side, cache; must not slow intake.
- **Governance of the Constitution** — CoC + legal own the rules, not engineers alone.
- **Scope creep** — resist fusing the AEC and HMIS surfaces; the kernel is the only thing
  they share.
