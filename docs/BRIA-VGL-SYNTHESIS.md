# Bria VGL × Sovereign Kernel — Constitutional Visual Generation (honest synthesis)

**Status:** grounded core implemented (charter + kernel integration test); Bria API not
wired. Held to the platform's first principle — **crypto honesty, no overclaiming** (see
[`PLATFORM.md`](PLATFORM.md), [`../CLAUDE.md`](../CLAUDE.md)).

This document is the corrected, buildable version of an earlier "Constitutional VGL"
synthesis draft. The *good idea* in that draft is real and worth building: **a Bria-style
Visual Generation Language blueprint becomes the governed payload of a Sovereign kernel
Intent.** Much of the draft's supporting architecture, however, described components that
do not exist in this repository. Per crypto-honesty, this file states plainly what is real,
what is planned, and what was overclaimed — and ships only the real part.

---

## 1. The synthesis, honestly stated

Bria's VGL is a **structured JSON blueprint** (`structured_prompt`) — an explicit,
disentangled, physically-grounded description of an image. The Sovereign kernel is a
governance loop: `Intent → Gate → Verify → Execute → Observe → Seal`. The synthesis is a
**one-liner**, and it is already how the platform's other domains work:

> A VGL blueprint is the **payload of an Intent**. The kernel gate enforces a
> visual-generation **charter** over it; a governed blueprint is **sealed** (real Ed25519)
> against a tamper-evident **MMR** audit root. Visual joins AEC and Housing as a third
> sibling domain — same kernel, different handlers + invariants.

That is implemented and tested here — 9 checks in
[`kernel/test/visual-generation.integration.test.mjs`](../kernel/test/visual-generation.integration.test.mjs),
driving the real `createKernel()` against
[`constitution/charter.visual-generation.example.yaml`](../constitution/charter.visual-generation.example.yaml).

---

## 2. Bria's real safety layers → real kernel checks

Bria's published safety model is a **3-layer** architecture (pre-training / in-generation /
post-generation). Each layer maps onto a concrete, enforced invariant in the charter:

| Bria layer | Real Bria mechanism | Charter invariant (enforced in the gate) |
|---|---|---|
| Pre-training | 100% licensed data | `provenance.licensed_inputs` — every source asset must declare a non-`none` license |
| In-generation | Prompt + visual moderation | `safety.moderation_cleared` — moderation must report `cleared` (fails closed otherwise) |
| Post-generation | C2PA content marking | `disclosure.synthetic_marking` — output must be marked synthetic |
| — (Sovereign) | crypto honesty | `epistemic.confidence_visible` — an explicit confidence level must be present |
| — (Sovereign) | humans attest, AI assists | `governance.human_release_attestation` — a human must attest before release |
| — (Sovereign) | real SHA-256 (`hash.js`) | `provenance.blueprint_integrity` — `blueprintHash == sha256(blueprintBytes)` |
| — (Sovereign) | real MMR (`mmr.js`) | `audit.append_only` — the audit log is append-only |

A violation of any of these **blocks** the Intent before execution. Nothing is sealed on an
unchecked pass.

---

## 3. Corrections to the source draft (crypto honesty)

The earlier draft asserted capabilities this codebase does not have. Correcting the record
is itself the platform's first principle applied to strategy:

| Draft claim | Reality in this repo | Honest status |
|---|---|---|
| "11-layer CCOS (Constitutional Cognitive Operating System)" | No CCOS exists. The kernel is one loop: `Intent → Gate → Verify → Execute → Observe → Seal`. | **Not real** — the loop is real; the 11-layer OS is not. |
| "14 layers of protection (Bria's 3 + Sovereign's 11)" | Bria has 3 real layers; the Sovereign side is the kernel gate + charter, not 11 layers. | **Overclaim** — count is marketing. |
| Z3, OPA, TLA+, Neo4j, Kafka, Cosmos SDK, AutoGen | None present. The gate is a hand-written charter interpreter (no `eval`); there is no SMT solver, policy engine, or message bus. | **Planned/aspirational** — real libraries, not integrated. |
| "Formally verified / mathematically proven correctness" | The charter compiler and crypto are tested (known-answer + fuzz + adversarial); that is strong testing, **not** formal proof. | **Overclaim** — "tested," not "proven." |
| "Multi-agent consensus (Chromatic Council; Ember/Umber/Amber)" | These exist only in `demo/` as a hackathon/marketing artifact, not as a governing kernel component. | **Demo-only** — replaced here by a real human attestation invariant. |
| "CEK / CRS / CKS / φ-Harmony" | φ-Harmony and CRS appear only in `demo/`; CEK/CKS do not exist. | **Demo-only / not real.** |
| "INV-001…INV-008" constitutional invariants | The real invariants are the charter IDs (`provenance.*`, `safety.*`, …), not an INV-numbered set. | **Renamed to what's real.** |
| "Guaranteed / provably correct outputs" | The gate guarantees a governed *process* (blueprint integrity, licensing, disclosure, human sign-off), not correctness of the pixels. | **Scope corrected.** |
| MMR audit trail | **Now real** — `mmr.js` (Tier 1), domain-separated SHA-256, inclusion proofs. | ✅ **Real.** |
| Ed25519-signed seal | **Now real** — `ed25519.js` (Tier 1). | ✅ **Real.** |

Note the two rows that are genuinely ✅: the audit MMR and the seal signature became real in
Tier 1 (see `ROADMAP.md`), so the draft's "immutable audit trail" and "cryptographic seal"
claims are — as of now — honest for this domain too.

---

## 4. What it would take to go further (honestly labeled)

The implemented slice governs the **blueprint and its release**. It does **not** call an
image model. Extending toward the draft's fuller vision requires real, external pieces —
each a genuine dependency, not a line of code here:

- **A Bria enterprise API key** to actually generate from a `structured_prompt` (Fibo
  models). Today the handler validates and seals a blueprint; it does not render an image.
- **A C2PA signing library** to emit real content-authenticity metadata. Today
  `syntheticMarked` is a declared boolean the gate enforces, not a signed C2PA manifest.
- **A persistence layer** (the ROADMAP's Tier 2 `ledger`) to store sealed blueprints and
  their audit roots durably. Today the MMR is in-process.
- **Real ZK** *only if* selective disclosure of a blueprint is ever needed — deliberately
  out of scope, consistent with `ROADMAP.md` §0 (ZK stays a Dominion/AEC differentiator).

If ZK/OPA/TLA+/a real agent council are wanted, they are legitimate future work — but they
must be built and labeled honestly (🟡→✅ in `PLATFORM.md`), never asserted before they exist.

---

## 5. Where this lives

- Charter: [`constitution/charter.visual-generation.example.yaml`](../constitution/charter.visual-generation.example.yaml)
- Integration test (9 checks): [`kernel/test/visual-generation.integration.test.mjs`](../kernel/test/visual-generation.integration.test.mjs)
- Kernel it plugs into: [`kernel/`](../kernel/) — the same `@sovereign/kernel` serving AEC and Housing.

*Keep this document honest. When the Bria API is wired or a real C2PA manifest is emitted,
move the corresponding row to ✅ and say what changed.*
