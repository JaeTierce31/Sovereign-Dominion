# The Sovereign Ecosystem — six-repo review & synthesis

**Status: adopted structure (this document is the map). Held to the platform's first
principle — crypto honesty — throughout: what is built is stated as built, what is
planned is stated as planned, and nothing in between.**

This document does three things:

1. **Evaluates** all six repositories in the `JaeTierce31` Sovereign portfolio as they
   stand today.
2. **Reviews** each one against the ecosystem's own standards (the honesty matrix
   discipline of [`PLATFORM.md`](PLATFORM.md)).
3. **Synthesizes** them into one coherent structure — the **Sovereign Ecosystem** —
   with the consolidation decisions that get from six repos to four ongoing homes.

Read alongside [`UNIFICATION.md`](UNIFICATION.md) (the Dominion↔Dignity merge spec),
[`PLATFORM.md`](PLATFORM.md) (the real/honest-mock/planned matrix), and
[`ROADMAP.md`](ROADMAP.md) (the sequenced completion plan). Those three govern the
*platform*; this document governs the *portfolio*.

---

## 1. Thesis — what the ecosystem is

The Sovereign Ecosystem is a **trust platform** organized around one piece of
infrastructure: **`@sovereign/kernel`** (this repo, [`kernel/`](../kernel)) — the
domain-agnostic verification loop

```
submitIntent → GATE → VERIFY → EXECUTE → OBSERVE → SEAL
```

Every product in the ecosystem is a *domain* or a *surface* on that kernel. Domains
differ only in the handlers and invariants they register; the engine — Constitution
gate, proof verification, tamper-evident MMR audit, Ed25519 Seal — is identical.

Three kinds of member:

| Layer | Members | What it contributes |
|---|---|---|
| **Kernel + Constitution** | Sovereign-Dominion (`kernel/`, `constitution/`) | The shared verification substrate. The only thing every member depends on. |
| **Verification domains** | Sovereign-Dominion (AEC, Visual) · Sovereign-Dignity (Housing/NSPIRE) | Products that submit Intents: inspect an object, hash the evidence, gate it against invariants, seal a verified record. |
| **Developer platform** | Sovereign-Development (the **Peregrine** IDE, consolidating Peregrine.ai + Peregrine.dev) | The tooling the ecosystem is built *with*: a mobile-first, edge-native collaborative cloud IDE, serving as the developer platform for Sovereign Dominion and the wider ecosystem. |

---

## 2. Repository map — six repos, four ongoing homes

| Repository | Role in the ecosystem | State today (verified in-session) | Disposition |
|---|---|---|---|
| **Sovereign-Dominion** | Kernel home · AEC (IBC 1604 structural) + Visual (governed VGL) domains · reference beam demo | **Substantial.** `@sovereign/kernel` live with real SHA-256, MMR, Ed25519; 71 automated checks; charters compiled to real predicates; Vite/React app + demo. | **Keep — the anchor repo.** Kernel stays here until published as a package (`ROADMAP.md` Tier 2). |
| **Sovereign-Dignity** | Housing / HUD NSPIRE inspection domain | **Substantial on `develop`** (`main` is a stub): frozen canonical spec v1.0, four accepted ADRs, `packages/shared-types` with a ported TypeScript charter compiler + adversarial security suite, JSON Schemas + OpenAPI specs, housing charter. | **Keep — the flagship domain.** Promote `develop`'s content to the default branch. |
| **hmis-platform** | Predecessor of Sovereign-Dignity | **Superseded scaffold.** Its init content (README, CODEOWNERS, CONTRIBUTING, editorconfig) was re-committed verbatim as Sovereign-Dignity's first real commit (`feat(repo): initialize HMIS platform monorepo`); everything since has landed in Dignity. Only a root `package.json` was added here afterward. | **Retire → Sovereign-Dignity.** Add a superseded notice, then archive on GitHub. |
| **Sovereign-Development** | Home of **Peregrine**, the ecosystem's developer platform / IDE | **Empty scaffold** (README stub, single commit). | **Keep — the consolidation target** for Peregrine.ai + Peregrine.dev. |
| **Peregrine.ai** | The Peregrine IDE implementation | **Substantial.** Working Next.js 14 App Router PWA: Monaco + xterm.js, yjs CRDT collab via Cloudflare Worker, Clerk v7 auth, Drizzle ORM, Stripe billing; deployed on Vercel; ~50 commits on the mainline. | **Migrate → Sovereign-Development** (history-preserving; see §5, D2), then archive. |
| **Peregrine.dev** | Name-reservation repo for the `peregrine.dev` domain | **Empty** (README stub, single commit). No code to migrate. | **Fold → Sovereign-Development.** Notice + archive; the domain itself already points at the Peregrine deployment per Peregrine.ai's setup docs. |

**Identity note:** *Peregrine* is the product name; *Sovereign-Development* is its
repository and its position in the ecosystem — the developer platform for Sovereign
Dominion. *Sovereign-Dignity* is likewise the repo/platform name; *HMIS Platform* was
its working title and survives only in historical commit messages and the hmis-platform
predecessor repo.

---

## 3. Layered ecosystem architecture

The [`UNIFICATION.md`](UNIFICATION.md) §3 stack, widened to the whole portfolio:

```
┌────────────────────────────────────────────────────────────────────┐
│ SURFACES     housing inspector app · owner/PHA attestation ·        │
│              HUD NSPIRE reporting · structural inspector / AR demo ·│
│              Peregrine IDE (web + PWA)                              │
├────────────────────────────────────────────────────────────────────┤
│ DOMAINS      Dignity/Housing (NSPIRE evidence chain)                │
│              Dominion/AEC (IBC 1604 + SCUGS)                        │
│              Dominion/Visual (governed Bria-style VGL)              │
│              Development (planned; see honesty note below)          │
├────────────────────────────────────────────────────────────────────┤
│ KERNEL       @sovereign/kernel — Intent → Gate → Verify →           │
│              Execute → Observe → Seal · proof · MMR audit ·         │
│              self-healing · capability registry · Ed25519 Seal      │
├────────────────────────────────────────────────────────────────────┤
│ CONSTITUTION machine-checkable charters (YAML → compiled predicates)│
└────────────────────────────────────────────────────────────────────┘
```

**Honesty note — Peregrine's kernel integration is *planned*, not built.** Today
Peregrine.ai has **no** dependency on `@sovereign/kernel`; it is a standalone IDE.
"Each built upon the Sovereign Kernel infrastructure" is the *target* state. The
natural integration — stated here as design direction only — is a **Development
domain**: developer-platform actions with trust consequences (a production deploy, a
release publish, a charter change merged) become Intents through the kernel, gated by
a development charter (e.g. `deploy.requires_green_ci`, `release.dual_attestation`),
audited into the MMR, and sealed. That would make Peregrine the first surface where
the ecosystem *builds itself under its own constitution*. Until an Intent flows, the
Development domain row stays ⚪ planned — no overclaiming.

---

## 4. Per-repo evaluation (the review)

### 4.1 Sovereign-Dominion — ✅ the anchor, with two hygiene findings

**What is real** (per [`PLATFORM.md`](PLATFORM.md), verified by its test suites):
real SHA-256, real Merkle Mountain Range with O(log n) inclusion proofs, real Ed25519
seal signatures, the charter compiler (no `eval`, fails closed, sandbox-proven), the
self-healing runtime, and the full Intent pipeline. Honest mocks: the ZK proof seam
(`scheme: 'mock'`), the `qssm-rs`/`moloch-mmr` crates. Planned: Rust services, mobile
app, published kernel package, production key custody.

**Findings:**
1. **Root `README.md` overclaims relative to `PLATFORM.md`.** Phrases like
   "mathematically unforgeable" ZK proof and "auditable on-chain" describe the
   hackathon demo's framing, not the current honesty matrix (the ZK scheme is a
   labeled mock; the audit is deliberately a *private* MMR, not a chain). The README
   should be brought under the same crypto-honesty discipline as the docs. *(Not
   changed in this pass — flagged for a dedicated pass so the marketing surface is
   rewritten deliberately, not mechanically.)*
2. **GitHub Actions still ungated** — `ROADMAP.md` Tier 0 #1 remains the cheapest
   outstanding win; the 71 checks should gate merges across the ecosystem.

### 4.2 Sovereign-Dignity — ✅ the flagship domain; branch topology needs one fix

**What is real:** the frozen canonical specification v1.0 (README + ADRs 001–004),
the kernel contract adopted by accepted ADR-004, `packages/shared-types` with the
TypeScript port of the charter compiler (including the ordinal fail-open fix and an
adversarial security suite), real SHA-256, JSON Schemas (`inspection-evidence`,
`deficiency`), the ledger OpenAPI spec, and the housing charter. Planned: the four
Rust services, the React Native inspector app.

**Findings:**
1. **`main` is a one-line stub while all content lives on `develop`.** PR #1 merged
   to `develop`, not `main`. Either make `develop` the default branch or fast-forward
   `main`. Until then, anyone landing on the repo sees an empty project — the opposite
   of the spec-first discipline the repo actually has.
2. **The hand-mirrored kernel contract (ADR-004) is the ecosystem's standing risk.**
   The mirror discipline (change the shape in Dominion ⇒ change it here) now extends
   ecosystem-wide; publishing `@sovereign/kernel` (Tier 2) retires it.

### 4.3 hmis-platform — superseded, cleanly

Its initial commit content is byte-for-byte the same scaffold that became
Sovereign-Dignity's first real commit; the git histories are separate (re-committed,
not shared), so the continuation must be stated in the README rather than claimed
via ancestry. Nothing here is newer than Dignity except a root `package.json`
(npm workspaces + eslint/prettier), which Dignity can adopt when its monorepo grows
actual workspaces. **No unique value remains; archive after the notice lands.**

### 4.4 Peregrine.ai — ✅ a real product; three findings before migration

**What is real:** a working mobile-first cloud IDE — Next.js 14 App Router PWA,
Monaco editor + xterm.js terminal, yjs CRDT collaboration through a Cloudflare
Worker relay, Clerk v7 auth, Drizzle ORM persistence, Stripe billing, Vercel
deployment, plus a run of recent utility panels (JSON tools, regex tester, hash
generator, etc.) shipped as keyboard-driven IDE panels.

**Findings:**
1. **Committed credential.** `CLAUDE.md` embeds a live Supabase anon key and project
   URL. Anon keys are publishable-tier by design, but a git repo is the wrong custody
   for any key, and the ecosystem's own standard (ROADMAP §1 #4: key custody) applies.
   Rotate it and move it to environment configuration during the migration — do not
   copy it into Sovereign-Development.
2. **README ↔ CLAUDE.md drift.** The README describes Turso/libSQL, Codeium, ONNX,
   Fly.io Firecracker; CLAUDE.md (more recent) describes Supabase Postgres via
   Drizzle, Clerk v7, and lists Turso as superseded for the DB. The migration should
   land one truthful stack description — the honesty-matrix habit applies to product
   docs too.
3. **Branch sprawl:** several hundred remote heads. Migrate `main` (plus any branch
   with unmerged work worth keeping) and leave the sprawl behind; that is one of the
   benefits of a fresh home.

### 4.5 Peregrine.dev — empty; fold in

A README stub on a single commit. Its only asset is the name matching the
`peregrine.dev` domain, which Peregrine.ai's deployment docs already target (DNS →
Vercel + collab worker CNAME). Nothing to migrate; notice + archive.

### 4.6 Sovereign-Development — empty; becomes the third pillar

A README stub on a single commit. This pass gives it its charter (README + migration
plan in the repo itself) so the consolidation has a documented landing zone before any
code moves.

---

## 5. Consolidation decisions (normative)

**D1 — hmis-platform → Sovereign-Dignity.** Already true in substance; make it
official. hmis-platform gets a superseded notice pointing at Sovereign-Dignity, then
is archived on GitHub. Sovereign-Dignity's README records the lineage.

**D2 — Peregrine.ai + Peregrine.dev → Sovereign-Development.** Sovereign-Development
becomes the single home of the Peregrine IDE. The migration is **history-preserving**:
import Peregrine.ai's `main` with `git fetch <peregrine.ai> main` +
`git merge --allow-unrelated-histories` (or `git filter-repo` if path rewriting is
wanted), so blame and the ~50-commit product history survive. Peregrine.dev
contributes nothing but its notice. Both source repos are archived once the import
merges and the Vercel project is repointed. The full runbook lives in
`Sovereign-Development/docs/MIGRATION.md`. **Deliberately not executed in this pass:**
moving a deployed product's repo also moves its Vercel/Clerk/Stripe/Cloudflare wiring;
that cutover should be its own reviewed change, not a side effect of a review PR.

**D3 — the kernel stays in Sovereign-Dominion until published.** No copying
`kernel/` into other repos. Sovereign-Dignity keeps its hand-mirror (ADR-004) and
Sovereign-Development integrates only *after* `@sovereign/kernel` is a published
package (`ROADMAP.md` Tier 2 #2) — one more consumer of a hand-mirror would double
the drift risk the ADR already flags.

**D4 — Peregrine is the ecosystem's developer platform.** Its role is stated
everywhere as: *the IDE developer platform for Sovereign Dominion and the Sovereign
Ecosystem.* Its kernel integration ships as a Development domain per §3's honesty
note — planned until an Intent actually flows.

**D5 — every repo carries the ecosystem map.** Each ongoing repo links to this
document; each retired repo's final README says where it went. No repo in the
portfolio should be explicable only from outside itself.

---

## 6. Cross-repo governance

- **One contract.** The `Intent` / `Invariant` / `CapabilityRegistration` / `Seal`
  shapes are owned by `kernel/` here. Any change requires updating Sovereign-Dignity's
  mirror in the same working session (existing CLAUDE.md rule), and — once the
  Development domain exists — Sovereign-Development's consumer too.
- **One discipline.** The crypto-honesty rule (real / honest-mock / planned, never
  overclaim) applies to *every* repo's README and docs, not just the kernel's. §4's
  findings 4.1-1 and 4.4-2 are both violations of it in product-facing prose.
- **One review gate.** Enable GitHub Actions in all ongoing repos; Dominion's kernel
  suite, Dignity's shared-types suite, and Peregrine's `tsc --noEmit` + lint all exist
  today and should gate merges.

## 7. Ecosystem honesty matrix

| Claim | Status | What is actually true |
|---|---|---|
| One shared verification kernel | ✅ real (2 repos) | Dominion hosts it; Dignity adopted the contract by accepted ADR and ports/tests it. |
| Housing domain on the kernel | ✅ real (reference) | Integration test drives the real pipeline from the housing charter; persistence still in-memory. |
| hmis-platform continued as Sovereign-Dignity | ✅ real | Same scaffold content re-initialized; all subsequent work in Dignity. Separate git ancestry — stated, not implied. |
| Peregrine = ecosystem developer platform | ✅ role · ⚪ integration | The IDE is real and deployed; its kernel (Development domain) integration is planned only. |
| Peregrine.ai + Peregrine.dev consolidated into Sovereign-Development | ⚪ planned | Charter + migration runbook land in this pass; the code move is a follow-up cutover (D2). |
| "All repos built upon the Sovereign Kernel" | 🟡 partially | True for Dominion + Dignity today; target-state for Sovereign-Development. |

## 8. Sequenced next steps

1. **Merge the six review PRs** this pass opens (one per repo, all draft).
2. **Fix Dignity's default branch** (§4.2-1) — content visible from the front door.
3. **Rotate the committed Supabase key** in Peregrine.ai (§4.4-1) before migration.
4. **Execute D2** per `Sovereign-Development/docs/MIGRATION.md` as its own change;
   archive Peregrine.ai, Peregrine.dev, and hmis-platform after cutover.
5. **Resume `ROADMAP.md`** where it points: enable Actions, land the trust-model ADR
   in Dignity, production key custody, then Tier 2 (publish the kernel — which also
   unblocks D3/D4's Development-domain integration).

---

*Keep this map honest the same way `PLATFORM.md` is kept honest: when a repo is
archived, when the migration executes, when the first Development-domain Intent seals —
move the row and say what changed.*
