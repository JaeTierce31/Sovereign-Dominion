# Sovereign Dominion ↔ Peregrine — Integration Assessment

**Status:** Honest, code-grounded assessment. Supersedes the "Ω++ Data Canvas"
that claimed *100% / PRECISE ALIGNMENT*.
**Date:** 2026-06-23
**Method:** Read the actual source of both repos as they exist on `main` /
`claude/sovereign-dominion-peregrine-0i7u13`. No claims below are asserted
without a corresponding file in the tree.

---

## TL;DR

The two projects are **different kinds of software**, and the previously
circulated "Data Canvas" does **not** describe either repository as it actually
exists. A real integration is possible and useful, but it is **not** the
"8 modules → 8 plugins, 100% compatible" story.

- **Peregrine** is a cloud IDE — a *place to write, run, and deploy web apps*.
- **Sovereign Dominion** is *one such web app* (a Vite/React AEC/construction
  platform).

The realistic, valuable integration is therefore **"Peregrine hosts Sovereign
Dominion as a first-class project"**, not "Sovereign Dominion modules become
Peregrine plugins." There is no plugin host in Peregrine to receive plugins.

---

## What each project actually is

### Peregrine (`Peregrine.ai`)

Next.js 14 (App Router) mobile-first collaborative cloud IDE.

| Capability | Where it lives |
|---|---|
| Code editor (Monaco) | `components/shared/Editor.tsx` |
| In-browser execution | `lib/webcontainer.ts` (`@webcontainer/api`), `app/api/execute/route.ts` |
| Real-time collaboration | `lib/collab.ts`, `components/collaboration/*`, `workers/collab-worker/` (yjs over a CF Worker) |
| AI assist | `lib/ai.ts`, `app/api/ai/{assist,inline}/route.ts` (on-device ONNX/WebGPU + cloud via `@ai-sdk/anthropic`, `@ai-sdk/groq`) |
| Projects / files | `app/api/projects/**`, Drizzle + Postgres (`lib/db.ts`) |
| Billing | `lib/stripe.ts`, `app/api/stripe/[...all]`, `app/api/billing/**` |
| Deploy | `lib/deploy.ts`, `app/api/deploy/route.ts` (Cloudflare Pages) |
| Dev-tool "panels" | `components/desktop/*` (JSON tools, regex tester, UUID gen, etc.) |

There is **no** plugin registry, micro-kernel, `StageResult`, `PluginStatus`,
`ComplianceReport`, or `HarmonyMetric` type anywhere in the codebase. The
"panels" are built-in React components, not a third-party plugin API.

### Sovereign Dominion (`Sovereign-Dominion`)

Vite + React 18 + Three.js single-page app: **"Voice-First 5D Augmented
Intelligence Platform"** for the AEC / construction domain.

| Real subsystem | Where it lives | Notes |
|---|---|---|
| Voice agent ("Esther") | `src/voice/estherAgent.ts`, `voiceController.ts` | Parses *construction* intents, e.g. `build_retaining_wall` from "10 feet long, 8 feet high" |
| 3D / gaussian splats | `src/renderer/`, `src/splats/`, `shaders/`, `three` | |
| Geospatial | `src/geo/` (`maplibre-gl`, `geotiff`, `proj4`) | |
| Building models | `web-ifc` dependency, `src/blueprints/` | IFC/BIM |
| Compliance / code checks | `src/compliance/complianceChecker.ts`, `src/regulatory/` | Domain rules (retaining walls, setbacks, stamps) |
| ZK proofs ("QSSM") | `src/trust/qssm.ts` + `wasm/qssm_rs.generated.js` (Rust via `wasm-pack`) | Proves **material lists**; has a mock fallback when WASM is absent |
| Finance / escrow | `src/finance/escrowService.ts` | |
| On-chain | `contracts/*.sol`, `ethers`, hardhat → Polygon | `SupplierRegistry`, `ChangeOrderLog` |
| Edge proxies | `worker/{supplier,weather,solar}Proxy.js` | Cloudflare Workers |
| Mobile shell | `@capacitor/*` (iOS/Android) | |

The canvas's "Council", "Hermes", "MMR", "SCUGS", "Nemotron-4-340B",
"StripeHandler", and the `sd-core/demo/*.js` filesystem **do not exist** in this
repo. `QSSM` and `Esther` are the only canvas names that map to real code, and
both are narrower/more domain-specific than the canvas describes.

---

## Where the "Data Canvas" diverges from reality

| Canvas claim | Reality |
|---|---|
| `sd-core/demo/{app,council,hermes,qssm,mmr,...}.js` | No such directory; real code is a Vite `src/` tree |
| 8 modules (Council, Hermes, QSSM, MMR, SCUGS, Esther, StripeHandler, Metrics) | Only QSSM + Esther exist; the rest are not in the source |
| "Quantum-Secure Multi-Agent System / Nemotron-4-340B" | No LLM agents; SD is an AEC frontend. QSSM proves construction material lists |
| Peregrine = "Micro-Kernel + Plugin Architecture" with `Plugin Interface v1.0` | Peregrine is a Next.js IDE; no plugin host or interface exists |
| Data-model mappings (`PluginResult ↔ StageResult`, etc.) | Peregrine has none of these types |
| "100% compatibility" on every axis | Not measurable against components that don't exist; not a real assessment |

Treat the canvas as an **aspirational vision doc**, not an integration plan.

---

## What integration could realistically mean

### Option A — Peregrine hosts Sovereign Dominion as a project *(recommended)*

This is what Peregrine is *for*. SD is a Vite app; Peregrine boots arbitrary
web projects in WebContainers (`lib/webcontainer.ts` → `bootProject`,
`npm install`, spawn dev server). So the honest, low-friction integration is:

1. Add SD as a **project template / example** Peregrine users can open
   (`lib/templates.ts` / `lib/fileTemplates.ts`).
2. Open → edit → run the **Vite frontend** in-browser; deploy via the existing
   Cloudflare Pages path.

**Effort:** Low–moderate. **Risk:** the parts of SD that *cannot* run in a
WebContainer must be documented as out-of-band:
- `build:wasm` (`wasm-pack`, Rust toolchain) — ship **pre-built** `wasm/*.js`.
- `deploy:contracts` (hardhat → Polygon) — runs outside the IDE.
- `@capacitor/*` native iOS/Android builds — outside the IDE.
- WebGPU/ONNX features degrade gracefully where WebGPU is unavailable (SD
  already has mock fallbacks, e.g. QSSM).

### Option B — Lift specific SD libraries into Peregrine

Only a few SD modules are generic enough to reuse, and even those carry domain
assumptions:
- `complianceChecker.ts` — clean rule-evaluation shape, but predicates are
  construction-specific (`retaining_wall`, `setback_ft`).
- `qssm.ts` — interesting ZK concept, but coupled to material lists + needs the
  Rust/WASM artifact.
Most other modules (voice intents, IFC, splats, escrow, contracts) are
AEC-specific and would not drop cleanly into a code editor.
**Verdict:** narrow value; do case-by-case, not wholesale.

### Option C — Shared tooling alignment

Both repos already share infra-level tech (React 18, `onnxruntime-web`,
Cloudflare Workers + `wrangler`, PWA/workbox, Stripe, PostHog). This is shared
*plumbing*, not shared *domain code* — useful for consistency, not a product
integration.

---

## Recommendation

1. Drop the "100% aligned 8-plugin" framing. It will mislead anyone who tries
   to execute it (step 2 — `cp .../sd-core/demo/*.js` — fails immediately).
2. Pursue **Option A**: make Sovereign Dominion a first-class Peregrine project
   template, with a documented list of out-of-band build steps (WASM, hardhat,
   Capacitor).
3. Revisit **Option B** only for a concrete, demonstrated reuse need.

---

*This document was produced by reading the repositories directly. If a claim
here is wrong, it can be checked against the cited file path.*
