# Sovereign Validation Protocol — claims require evidence

**Normative for the Sovereign Ecosystem.** Companion to [`GOVERNANCE.md`](GOVERNANCE.md)
(boundaries), [`PILLARS.md`](PILLARS.md) (the capability register), [`CDP-SPEC.md`](CDP-SPEC.md)
(the domain contract), and [`PLATFORM.md`](PLATFORM.md) (the honesty matrix this protocol
generalizes).

The principle, applied to documentation the way the kernel applies it to Intents:
**never trust a document alone.** A claim is validated through the chain
`claim → artifact → implementation → test → evidence`. A claim without implementation
evidence is **DECLARED**, never *operational* — and marking a design decision "FIXED"
or "DONE" before code exists is an unlabeled mock in prose form.

---

## 1. The two honesty axes

The compact ⚪🟡✅ vocabulary (`PLATFORM.md`) expands into two finer scales when
precision matters:

**Component maturity ladder** — how built a component is:

| State | ⚪🟡✅ | Meaning |
|---|---|---|
| DECLARED | ⚪ | Named in a governing document only |
| DESIGNED | ⚪ | Specified (API/contract/schema exists), no code |
| SCAFFOLDED | 🟡 | Code skeleton exists, core behavior stubbed or mocked (labeled) |
| IMPLEMENTED | 🟡/✅ | Working code, exercised by tests |
| VERIFIED | ✅ | Working code + adversarial/known-answer tests + a consumer |

**Invariant enforcement levels (E0–E4)** — how strongly an invariant is enforced:

| Level | Meaning | Where the ecosystem stands |
|---|---|---|
| E0 | Aspirational — advisory only | — |
| E1 | Logged — violation recorded | — |
| E2 | Detectable — violation identified and reported | — |
| E3 | Preventable — violation blocked before execution | Kernel gate invariants: E3 **in-process** (compiled predicates, fail-closed; not yet a distributed/hardware boundary) |
| E4 | Formally verified — machine-checked proof under model assumptions | ⚪ nothing in the ecosystem; recorded as long-term direction only |

An honest status cites both axes where they differ: the charter compiler is VERIFIED
as a component, and the invariants it compiles enforce at in-process E3.

## 2. The five canonical ecosystem invariants

These are the properties the whole platform sells. Each row states where it is
enforced and how that enforcement is itself tested — a row with no test is DECLARED,
whatever the code looks like.

| Invariant | Statement | Enforced in | Evidenced by |
|---|---|---|---|
| **Trust before execution** | No handler runs before the gate passes; unknown actions refuse | `pipeline.js` (GATE precedes EXECUTE; `no_handler`/`blocked` terminal states) | `kernel.test.mjs`, both domain integration suites |
| **Authority preservation** | Dual *human* attestation before any Seal; AI output is advisory; no confidence score substitutes | Charter invariants (e.g. `inspection.dual_attestation`), `CDP-SPEC.md` §6 | housing + visual integration suites (AI-only attestation is blocked) |
| **Evidence continuity** | Every sealed action lands in the append-only, tamper-evident audit | `audit.js` + `mmr.js` (real MMR, inclusion proofs) | `mmr.test.mjs` incl. forgery cases; integration suites |
| **Permission non-escalation** | A capability not registered cannot be exercised; malformed input fails closed | `capability-registry.js`, charter compiler (restricted grammar, no `eval`) | `charter-compiler.security.test.mjs` |
| **Kernel independence** | The kernel imports no domain; no domain nouns in kernel code; zero runtime dependencies | `kernel/test/governance-boundaries.test.mjs` (**executable**, in the kernel suite) | that suite's 4 checks, including negative cases exercised at authoring time |

## 3. Validation domains → where each lives

| Domain | Question | Governing artifact | Automation status |
|---|---|---|---|
| Architecture integrity | Acyclic deps? Kernel independent? | `GOVERNANCE.md` §2 | ✅ `governance-boundaries.test.mjs` (kernel side); cross-repo lint ⚪ |
| Pillar alignment | Does every component map to pillar/purpose/status? | `PILLARS.md` §3 register + CDP manifests | Manual (register review) |
| Constitutional compliance | Humans attest? AI advisory? Fail closed? | `CDP-SPEC.md` §6; charter invariants | ✅ integration suites |
| Evidence | Do significant actions produce audit records? | `audit.js`/`mmr.js`; Seal `resultRef` | ✅ kernel suites |
| Documentation truthfulness | Does every claim carry status + evidence? | `PLATFORM.md` matrix; this file | Manual discipline; CI check ⚪ |

Claim format for any status assertion in ecosystem docs:
**claim / status (ladder or E-level) / evidence (file, test, or “none”) / verification (how a reader re-checks)**.

## 4. Falsifiable metrics only

Adopted from the v5.1-draft review (its strongest section). Success metrics must be
falsifiable and non-gameable:

- **Denial rate > 0** before any claim that a gate "works" — a gate that never blocks
  is indistinguishable from no gate. (The kernel's integration suites already assert
  blocked outcomes, not only sealed ones.)
- **Seeded-violation recall**, not "zero undetected violations" — the latter is
  unfalsifiable. Red-team by injecting known-bad inputs and measuring detection
  (the forgery cases in `mmr.test.mjs`/`seal.test.mjs` are the in-repo pattern).
- **No vanity counts.** Raw event totals and small-n satisfaction percentages
  (n < 30) prove nothing; prefer retention under constraint and
  decisions-changed-by-governance with post-hoc agreement.

## 5. Severity model

| Severity | Meaning | Action |
|---|---|---|
| CRITICAL | Constitutional violation (kernel dependency inversion, fail-open safety path, unlabeled mock presented as real) | Block merge/release |
| HIGH | Security boundary failure (eval in evaluator, secret in repo, PHI in logs) | Block until resolved |
| MEDIUM | Architecture drift (boundary blur, undocumented exception) | Review required |
| LOW | Documentation gap | Track |

## 6. Change control for governance specifications

**No new version of a governance specification may be authored until the previous
version's claims have been exercised by running code or tests.** (Adapted from the
v5.1-draft's kill criterion KC-5; the same self-application as `CDP-SPEC.md` §9's
freeze criteria.) A spec that iterates while implementation stands still is a review
loop with a fake action space — every iteration must move something on the
implementation axis or it does not merge.

## 7. Integration decisions (July 2026) — what was adopted and what was refused

Reviewed: the *Canvas Registry / Validation Protocol / MVP Scaffold / Kernel Service*
artifact set and the *Ecosystem Report v5.0 / v5.1-draft*. Decisions, recorded so they
are durable:

**Adopted** (into this file and its companions):
- The claim→evidence chain, DECLARED≠OPERATIONAL, severity model, and component
  metadata requirement (§1, §3, §5; metadata satisfied by the PILLARS register +
  CDP manifests — no new per-file format).
- E0–E4 enforcement levels (§1) unified with the existing ladder.
- Falsifiable-metrics discipline and KC-5 change control (§4, §6).
- **Exit & Fork** as a constitutional bound — see `PILLARS.md` §4.6; it maps onto
  real primitives (portable Ed25519 Seals + MMR inclusion proofs) rather than new
  infrastructure.
- Bounded-harm constraint and the clinical PHI rule — see `CDP-SPEC.md` §6.
- Executable boundary checks — `kernel/test/governance-boundaries.test.mjs`, now in
  the kernel suite.

**Refused**, with reasons:
- **`sovereign-mvp` repo + five Python/FastAPI services** — violates the PILLARS §1
  instantiation rule and re-implements the existing kernel in parallel, fracturing
  the trust core. The proposed "Sovereign Kernel Service" capabilities (identity
  gating, authorization, trust decisions, audit) exist as real code in
  `@sovereign/kernel`.
- **Separate SER / CCOS / FI-OS services** — SER's requirements are met by
  `audit.js`+`mmr.js` (✅) plus `ledger.js` persistence (🟡, Tier 2); "CCOS runtime"
  is the kernel loop itself; FI-OS maps to the Deliberation/Governance concepts
  (⚪, `PILLARS.md`).
- **Treating ÆSTRÆAN / FI-OS / CCOS as canonical artifacts** — no artifact exists
  (`PILLARS.md` naming note; `BRIA-VGL-SYNTHESIS.md` flags CCOS as not-real).
- **The v5.1-draft's "✅ FIXED / DONE / ADOPTED" status rows** — no
  `_validate_no_harm`, SD-009 implementation, or OSS-stack adoption exists in any
  ecosystem repository; per §1 those rows are DECLARED. (Its fail-open SD-001
  defect is also not reproducible here: the kernel fails closed by construction.)
- **Wholesale OPA/Cedar/Rekor/DID adoption** — the charter compiler is already a
  real, adversarially-tested predicate engine; replacing it buys an integration
  project, not a capability. Recorded as evaluation candidates. The one named
  future adoption: **anchoring MMR roots in an external transparency log**
  (Sigstore/Rekor pattern) once persistence (Tier 2) lands — with the standing
  rule that audit *content* never leaves private custody (hash-only, and salted
  commitments wherever the domain involves PHI).

## 8. Honest status of this protocol

| Capability | Status |
|---|---|
| Validation model + claim format | Defined (this document) |
| Kernel boundary checks | ✅ Executable, in `npm test` (`kernel/test/governance-boundaries.test.mjs`) |
| Constitutional/evidence checks | ✅ Executable via existing kernel suites |
| CI gating of any of the above | ⚪ **GitHub Actions still does not gate Dominion merges** (`ROADMAP.md` Tier 0 #1) |
| Cross-repo dependency lint, doc-claim checker | ⚪ Not built |

This file changes by PR with the same review bar as `GOVERNANCE.md` (§6 there), and
is itself subject to §6 above.
