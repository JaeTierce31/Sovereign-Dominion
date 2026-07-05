# Roadmap & Completion Plan

**Sovereign Dominion & Dignity — unified kernel platform**

Strategic plan for furthering the platform toward its potential. Read alongside
[`UNIFICATION.md`](UNIFICATION.md) (the spec) and [`PLATFORM.md`](PLATFORM.md) (the
current status / real-vs-mock matrix). This document is the *sequenced plan* and the
*decision log* for what to build next and why.

---

## 0. The framing that governs everything

**This is a trust platform, and today the trust is mostly mocked.** Every headline
capability — ZK proof, Merkle audit, cryptographic seal — is currently a clearly-labeled
placeholder (see the honesty matrix in `PLATFORM.md`). "Completion" is therefore two
distinct journeys, and conflating them is the main risk:

- **Depth** — make the trust *real* (crypto + persistence). This is the actual value.
- **Breadth** — make it a *product* (services, mobile app, procurement).

**Guiding principle: go deep before broad.** One cryptographically honest end-to-end
path is worth more than more mock surface area. In a regulated domain, a demo that says
"sealed" but can't prove non-repudiation is a liability; a narrow path that genuinely can
is a moat.

### The decision that unblocks the roadmap: pick the trust model deliberately

Before writing more crypto, answer: **does the housing-inspection domain actually need
zero-knowledge?** The considered answer is **no** — and saying so is crypto-honesty
applied to strategy. NSPIRE evidence needs three properties:

1. **Integrity** — the evidence wasn't altered → a Merkle log + SHA-256 (the hash exists).
2. **Non-repudiation** — *this credentialed inspector* attested → **Ed25519 signatures**.
3. **Tamper-evidence** — the record can't be silently rewritten → a real MMR.

None require a SNARK. ZK buys *privacy* (proving a fact without revealing the data), which
matters when hiding client PII — but the Housing domain deliberately has **no client
PII**. So ZK is best kept as a **Dominion/AEC differentiator / marketing artifact**, and
the Housing domain ships on **signatures + Merkle**. Deciding this now avoids building a
SNARK that may never be needed. *(Record the final call as an ADR in Sovereign-Dignity.)*

---

## 1. Credentials, infrastructure & capabilities NOT available in-session

The distinction to internalize: items 1–4, 7, 9 are **technical unblocks** (fast). Items
5–6, 8, 10 are **organizational / legal / procurement** — long lead times, no code
substitutes for them, and in a regulated trust domain **#8 and #10 are the real critical
path.** Start those in parallel with the code, not after.

| # | Need | Unblocks | Owner |
|---|---|---|---|
| 1 | **GitHub Actions enabled** on both repos | The 48 kernel/shared-types checks actually gating merges (today only Cloudflare deploys report) | repo Settings → Actions |
| 2 | **npm token or GitHub Packages** | Publishing `@sovereign/kernel`, killing the hand-mirrored type duplication (ADR-004 risk) | you |
| 3 | **Supabase project + keys** | Any real persistence / the `ledger` service | you (URL, service + anon keys) |
| 4 | **Signing key + key management** | Real issuer signatures for the Seal (dev key now; **KMS/HSM in prod** + rotation policy) | you |
| 5 | **K8s cluster + Terraform backend + cloud creds** | Running the Rust services per Dignity's ADR stack | cloud account |
| 6 | **Apple Developer + Google Play accounts** | Device deployment + code-signing for the inspector app | you |
| 7 | **Published HUD NSPIRE Standards document** | Mapping the *real* deficiency taxonomy/severity (today an approximation) | public HUD source |
| 8 | **Legal counsel + a CoC/PHA design partner** | Charters are *not legally reviewed*; the domain model needs real-workflow validation. **True gate to being usable.** | organizational |
| 9 | **Live API keys** (Stripe, NVIDIA NIM) + **WASM toolchain** | Dominion demo live mode; real WASM builds (`cargo`/`rustc` present; verify `wasm-pack`/`wasm-bindgen`) | you / environment |
| 10 | **HUD comparability / certification path** | Becoming a HUD-recognized inspection system — a procurement *process*, not a deploy | organizational |

---

## 2. Sequenced plan (leverage-ordered)

### Tier 0 — this week, nearly free
- [ ] **Enable GitHub Actions** so tests gate merges (#1).
- [ ] **Make the trust-model decision** (§0) and write it as an ADR in Sovereign-Dignity.
  Cheapest, highest-leverage act on the list — prevents building the wrong crypto.

### Tier 1 — make the trust real *(mostly buildable in-session)* — **✅ landed**
- [x] **Real Ed25519 issuer signatures** replacing the keyed-hash "signature" in
  `kernel/src/seal.js` (`kernel/src/ed25519.js` is the KMS/HSM seam). Native, synchronous,
  non-repudiable; trust-anchorable via `trustedPublicKeys`. **Done** → `seal.js` 🟡→✅.
  *Remaining:* production key custody (KMS/HSM behind the signer seam) + rotation (§1 #4).
- [x] **Real Merkle Mountain Range** (`kernel/src/mmr.js`) replacing the hash-chain in
  `audit.js`, giving genuine O(log n) inclusion proofs on the SHA-256 already present.
  Domain-separated (leaf `0x00` / node `0x01`), exhaustively + fuzz-tested with adversarial
  forgery cases. **Done** → `audit.js` 🟡→✅. (Supersedes the mock `moloch-mmr` crate for
  the audit path.)
- [x] **Resolve the ZK claim** — scoped ZK **out of** the PII-free Housing domain (which
  needs integrity + non-repudiation + tamper-evidence, all now real), keeping ZK as a
  Dominion/AEC differentiator. Decision recorded in §0; ADR to land in Sovereign-Dignity.

### Tier 2 — make it persist *(needs your creds)*
- [ ] **Publish `@sovereign/kernel`** (#2) — one shared contract instead of a hand-mirror.
- [~] **One real vertical slice:** the persisted write path
  *submit → gate → sign → append to MMR → seal → store* is **wired in-kernel** now — the
  pipeline persists every sealed record through a `ledger` seam (`kernel/src/ledger.js`),
  proven end to end by the Visual domain slice (`visual-pipeline.integration.test.mjs`).
  The `InMemoryLedger` is real but in-process; **remaining:** swap it for a durable
  Supabase/Postgres-backed ledger (#3) — the interface is the seam, the backend needs creds.

### Tier 3 — make it usable *(needs dev accounts)*
- [ ] Thin React Native inspector flow: capture photo → hash on-device → submit Intent
  (proves the offline-first, bytes-stay-on-device model the VERIFY resolver already supports).
- [ ] **NSPIRE conformance pass** against the real published taxonomy (#7).

### Tier 4 — make it real-world *(organizational; longest lead — start now, finish last)*
- [ ] Constitution charter **legal review**; **CoC/PHA design partner**; **HUD
  comparability** process (#8, #10).

---

## 3. Recommended immediate next move

**Tier 1 is done** (Ed25519 seal signatures + real MMR audit — see the checked boxes
above; two of the three 🟡 honest-mocks are now ✅). The trust on the Housing path is now
genuinely real: integrity (SHA-256), tamper-evidence (MMR with inclusion proofs), and
non-repudiation (Ed25519). That was the "impressive prototype → the trust is actually real"
step, done with the same rigor as the rest (known-answer vectors + fuzz + adversarial tests).

The next highest-leverage moves, in order:
1. **Tier 0 free wins** — enable GitHub Actions (§2 Tier 0 #1) so the 62 checks gate merges,
   and land the trust-model ADR in Sovereign-Dignity (the §0 decision is made; record it).
2. **Production key custody** — put a KMS/HSM behind the `createEd25519Signer` seam with a
   rotation policy (§1 #4). The signature scheme is real; custody is the remaining gap.
3. **Tier 2 persistence** — publish `@sovereign/kernel` (kills the hand-mirror) and build the
   one real `ledger` vertical slice (needs Supabase creds, §1 #3).

---

*Keep this roadmap honest and current. Check items off as they land; when a decision is
made, link its ADR; when a 🟡 becomes ✅ in `PLATFORM.md`, note it here too.*
