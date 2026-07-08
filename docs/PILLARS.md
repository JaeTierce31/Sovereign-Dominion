# The Pillar Architecture — constitutional capabilities, not repositories

**Normative for the Sovereign Ecosystem.** Companion to [`ECOSYSTEM.md`](ECOSYSTEM.md)
(the repo map and review), [`GOVERNANCE.md`](GOVERNANCE.md) (boundaries + dependency
rules), and [`CDP-SPEC.md`](CDP-SPEC.md) (the domain contract).

The organizing shift this document records: the ecosystem's enduring units are
**constitutional pillars** — named capabilities with defined responsibilities — and
repositories are *implementation details* of pillars. Repos merge, split, and get
archived (the review retired three in one pass, `ECOSYSTEM.md` §5); pillars persist.
One pillar may span several repos; several pillars may share one repo; a ⚪ pillar
may be nothing but a section of this file. That is by design.

**Naming note.** *ÆSTRÆAN*, *FI-OS*, and *CCOS* are discussion-level names for the
constitutional apex with no artifact behind them —
[`BRIA-VGL-SYNTHESIS.md`](BRIA-VGL-SYNTHESIS.md) explicitly flags "11-layer CCOS" as
not-real. This document says **the Constitution** and means the machine-checkable
charters in [`constitution/`](../constitution) plus the governing docs. A grander name
may be adopted when there is a grander artifact.

---

## 1. The honesty rule for pillars

A pillar may be *named* long before it is *built*. The failure mode to prevent is the
one `PLATFORM.md` exists to prevent: an architecture diagram that reads as a claim.
So every pillar carries a status, maintained with the same discipline as the honesty
matrix:

| Status | Meaning | Criteria |
|---|---|---|
| ✅ **Instantiated** | Real code, real consumer | Working implementation, at least one other pillar or product consuming it, and honesty-matrix coverage |
| 🟡 **Emerging** | Real artifacts, incomplete | Specs/code exist and are used, but the pillar's core responsibility is not yet operational end-to-end |
| ⚪ **Declared** | Named capability only | Exists as sections of governing documents; no implementation |

The compact ⚪🟡✅ scale expands into two finer axes when precision matters — the
DECLARED→VERIFIED component ladder and the E0–E4 invariant-enforcement levels —
both defined in [`VALIDATION.md`](VALIDATION.md) §1.

**Instantiation rule.** A ⚪ pillar lives as prose in a governing document — never as a
fresh repo, service, or package. It graduates to 🟡/✅ only when it has (a) code that
needs a boundary and (b) a consumer that needs the contract. The review consolidated
six repos into three ongoing homes; the pillar model must not quietly reinflate that.
Fourteen pillars is a taxonomy, not a construction order.

---

## 2. The five layers

Pillars group into five layers. The dependency rule of `GOVERNANCE.md` §2 extends
upward: **every layer depends on Dominion; Dominion depends on nothing above the
foundation.** New domains are added by implementing `CDP-SPEC.md`, never by new
infrastructure — the constitutional execution model does not change per domain.

```
                       The Constitution
              (charters → compiled predicates + governing docs)
                              │
┌─────────────────────────────┴──────────────────────────────────┐
│ GOVERNANCE     Dominion ✅ · Defense ⚪ · Deliberation ⚪         │
│                verification, security, adjudication bounds      │
├──────────────────────────────────────────────────────────────────┤
│ INTELLIGENCE   Discovery ⚪ · Diagnosis ⚪ · Digital Twin ⚪       │
│                retrieval, advisory reasoning, simulation         │
├──────────────────────────────────────────────────────────────────┤
│ ENGINEERING    Development 🟡 · Design ⚪ · Deployment ⚪ ·        │
│                Documentation 🟡                                   │
│                how the ecosystem is built and promoted           │
├──────────────────────────────────────────────────────────────────┤
│ KNOWLEDGE      Domain 🟡 · Data ⚪ · Database ⚪                   │
│                CDPs, schema governance, persistence              │
├──────────────────────────────────────────────────────────────────┤
│ EXPERIENCE     Dignity 🟡                                         │
│                applications and human experience                 │
└──────────────────────────────────────────────────────────────────┘
```

The kernel path (`submitIntent → GATE → VERIFY → EXECUTE → OBSERVE → SEAL`) is the
spine every layer's actions pass through when they carry trust consequences.

---

## 3. Pillar register

| Pillar | Layer | Constitutional role | Status | Where it lives today |
|---|---|---|---|---|
| **Dominion** | Governance | Constitutional runtime: kernel pipeline, gate, proof seams, MMR audit, Ed25519 Seal, charter compiler | ✅ | Sovereign-Dominion `kernel/` + `constitution/` |
| **Development** | Engineering | Engineering platform: Peregrine IDE; (future) scaffolding, SDK generation, CI tooling | 🟡 | Peregrine.ai → Sovereign-Development (migration per `ECOSYSTEM.md` §5); kernel integration ⚪ |
| **Dignity** | Experience | Human-facing applications; regulated service domains' surfaces | 🟡 | Sovereign-Dignity (spec v1.0 + shared-types real; services/mobile ⚪) |
| **Domain** | Knowledge | Constitutional Domain Packages per `CDP-SPEC.md` (Housing, AEC, Visual; MESI proposed) | 🟡 | CDP registry, `CDP-SPEC.md` §5 |
| **Documentation** | Engineering | Specs, ADRs, standards, honesty matrices, governance records — as *practice*, §4.4 | 🟡 | `PLATFORM/ROADMAP/ECOSYSTEM/GOVERNANCE/CDP-SPEC` here; ADRs in Dignity |
| **Database** | Knowledge | Persistence: identity, event logs, evidence repositories, vector/graph/document stores | ⚪ | Kernel audit is in-memory (`ROADMAP.md` Tier 2 names persistence); Peregrine's app DB is product-local, not this pillar |
| **Discovery** | Intelligence | Knowledge graph, semantic indexing, retrieval, evidence acquisition | ⚪ | — |
| **Diagnosis** | Intelligence | Advisory AI analysis, risk assessment, decision support — bounded by `CDP-SPEC.md` §6 | ⚪ | — |
| **Digital Twin** | Intelligence | Simulation, forecasting, scenario/what-if analysis | ⚪ | — |
| **Data** | Knowledge | Schema, lineage, quality, interoperability governance — largely federated, §4.3 | ⚪ | Seeded by `CDP-SPEC.md` ontology + evidence-schema requirements |
| **Design** | Engineering | System architecture, UX, information/interaction design | ⚪ | Practiced inside products; no pillar-level artifact |
| **Deliberation** | Governance | Multi-agent advisory reasoning: councils, debate, consensus estimation — bounded, §4.1 | ⚪ | Folded under Diagnosis until a distinct mechanism exists |
| **Deployment** | Engineering | Promotion into trusted environments: releases, rollbacks, environments — first as a CDP, §4.5 | ⚪ | `cdp.development` design direction (`ECOSYSTEM.md` §3 honesty note) |
| **Defense** | Governance | *Operational* security: key custody operations, identity/authz at surfaces, monitoring, threat detection, incident response — scope bounded, §4.2 | ⚪ | KMS/HSM seam named on `ROADMAP.md` (custody is dev-grade today) |

**External-proposal mapping** (July 2026 review, decisions recorded in
[`VALIDATION.md`](VALIDATION.md) §7): *FI-OS* → the Deliberation/Governance concepts,
⚪; *"CCOS runtime"* → the existing kernel loop — no second runtime; *SER (Sovereign
Evidence Registry)* → `audit.js` + `mmr.js` (✅) plus `ledger.js` persistence (🟡);
*"Sovereign Kernel Service"* → `@sovereign/kernel` itself — no parallel
implementation; *Compliance Engine* → charter compiler + gate (✅) with CI gating ⚪.

---

## 4. Constitutional bounds on specific pillars

These bounds are part of the pillar definitions. A pillar implementation that violates
its bound is a constitutional violation, not a design choice.

### 4.1 Deliberation is bounded by "humans attest; AI assists"

AI councils, debate, consensus mechanisms, and confidence estimation produce
**advisory artifacts only**. They may enter VERIFY as evidence with full provenance
(engine, version, inputs-by-hash — `CDP-SPEC.md` §6.3), but no council output may
substitute for dual human attestation, adjudicate a Seal, or open a default-allow
path. "Adjudication" in this pillar means *ranking and recommending for human
decision*, never deciding. Until a mechanism exists that is distinct from single-model
advisory reasoning, Deliberation is a capability of Diagnosis, not infrastructure of
its own.

### 4.2 Defense does not own the verification cryptography

Ed25519 seals, the MMR, SHA-256, and the fail-closed gate are *constitutive of
Dominion* and stay there — a kernel → Defense dependency would break the acyclic rule
(`GOVERNANCE.md` §2), and splitting the trust core would fracture the property the
whole ecosystem sells. Defense owns what surrounds the core: the consumer side of the
`createEd25519Signer` KMS/HSM seam, identity and authorization at product surfaces,
monitoring, threat detection, incident response.

### 4.3 Data governance is mostly federated through CDP-SPEC

Every CDP already must declare its ontology and evidence schemas (`CDP-SPEC.md`); a
central schema authority would recreate the domain-logic-in-the-core failure mode.
The Data pillar owns only the cross-cutting standards — lineage conventions,
interoperability rules, metadata formats — that individual CDPs then satisfy.

### 4.4 Documentation is a practice, not a documentation repository

Docs live with the code they describe; a central docs repo divorced from code is how
drift *happens*, not how it is prevented. The pillar owns the cross-cutting
discipline: honesty matrices kept current, ADR format, spec versioning, and the
change control of `GOVERNANCE.md` §6. This is the one ⚪-adjacent pillar already
partially real — as practice.

### 4.5 Deployment is implemented as a CDP, not as new infrastructure

Deployment's constitutional content — a production deploy, a release publish, a
charter change merged — becomes Intents through the kernel, gated by the planned
`cdp.development` charter and sealed into the audit. That is the pillar's first
incarnation. Estate tooling (Kubernetes, Terraform, multi-environment orchestration)
stays ⚪ until a real deployment target needs it.

### 4.6 Exit & Fork — capture must be worthless, not merely costly

Adopted from the v5.1-draft governance review (its SD-009), the one external proposal
that strengthens the trust model without adding infrastructure. As a constitutional
bound on the whole ecosystem:

- **(a)** any participant may withdraw at any time with a signed, portable, complete
  export of their governance state and audit history;
- **(b)** any faction may fork the constitutional state and continue under an amended
  constitution, inheriting the hash-chained audit up to the fork point;
- **(c)** no authority may abridge (a) or (b).

Voice (challenge/dissent) and loyalty (incentives) alone cannot prevent capture; exit
makes capturing an authority position worthless. Status: ⚪ design — but with a named
path on primitives that are already real: a participant export is their **Ed25519
Seals plus MMR inclusion proofs** (both portable and independently verifiable today);
a fork is a new MMR seeded from a checkpointed root. No new service is required to
honor this bound — only export/fork capabilities on the existing kernel.

---

## 5. Domain onboarding — the MESI pattern

A new domain (`cdp.mesi`, education, justice, …) is added by **implementing
`CDP-SPEC.md`**, never by inventing infrastructure:

1. **Domain layer:** charter + ontology + evidence schemas + manifest — the CDP itself
   (this is the gate for entering the registry; MESI is ⚪ proposed until these exist
   somewhere reviewable, `CDP-SPEC.md` §5).
2. **Dominion:** verification, audit, sealing — consumed as-is, never reimplemented.
3. **Intelligence layer:** retrieval (Discovery), decision support (Diagnosis),
   simulation (Digital Twin) — consumed *when instantiated*; until then the domain
   ships without them, because the kernel path works alone.
4. **Database:** evidence and record persistence — same rule.
5. **Development:** scaffolding and tooling; **Dignity:** the human-facing
   applications (for MESI, the proposed MAT Companion surfaces).

The pattern is the point: the ecosystem grows by adding Knowledge-layer content and
Experience-layer surfaces around a stable constitutional core, not by changing the
execution model.

---

## 6. Change control

This file changes by PR to Sovereign-Dominion with the same review bar as
`GOVERNANCE.md` and `CDP-SPEC.md` (see `GOVERNANCE.md` §6). Status changes in the §3
register require the same evidence as honesty-matrix moves: point to the code and its
consumer, or the row stays where it is.
