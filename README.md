# Sovereign Dominion

**The first AI-governed structural compliance system secured by zero-knowledge proofs.**

[![CI](https://github.com/jaetierce31/sovereign-dominion/actions/workflows/ci.yml/badge.svg)](https://github.com/jaetierce31/sovereign-dominion/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Proprietary%2FMIT-blue)](LICENSE)

> Construction compliance fraud costs **$15B annually** in the United States. A single falsified structural certification can collapse a building. Sovereign Dominion replaces paper stamps with mathematical proof — governed by AI, auditable on-chain, sealed by Stripe.

**Four guarantees no paper stamp can make:**
1. **Cryptographic truth** — Rust/WASM ZK proof of material compliance, mathematically unforgeable in <10ms
2. **AI deliberation** — Two independent NVIDIA NIM agents (Ember + Umber) debate structural risk via live SSE streaming
3. **Immutable audit trail** — Moloch MMR commits every proof to a Merkle log; root hash on the certificate
4. **Programmatic payment gate** — Stripe PaymentIntent automatically blocked on FAIL, confirmed on PASS

```bash
# 30-second demo — no build, no API keys, no install
open demo/index.html   # press 1/2/3 to pick scenario · Enter to run · C to compare all · K for kiosk
```

| Step | Engine | Latency |
|------|--------|---------|
| ZK compliance proof | QSSM (Rust/WASM) | <10ms |
| Immutable Merkle log | Moloch MMR (WASM) | <5ms |
| I-beam stress heatmap | SCUGS Canvas 2D | <50ms |
| Multi-agent routing | Hermes · Nous-3-405B via NIM | ~1s |
| Council deliberation (SSE) | Ember+Umber · Nemotron-4-340B | ~3–8s |
| Payment gate | Stripe PaymentIntents | ~1s |
| Certificate PNG download | Canvas 2D, 2× retina | instant |

---

## 🏆 Nous Research × NVIDIA × Stripe Hackathon Demo

Open `demo/index.html` in any modern browser to experience the full multi-agent pipeline — no build step required.

### What it demonstrates

```
Voice Input → Hermes (Nous Hermes-3-405B via NVIDIA NIM) orchestrates:
  ├─ QSSM: Rust/WASM zero-knowledge compliance proof (<10ms)
  ├─ Moloch MMR: Merkle Mountain Range immutability log
  ├─ SCUGS: Real-time I-beam stress heatmap (IBC 1604 visualization)
  ├─ Chromatic Council: Ember + Umber deliberation via Nemotron-4-340B (SSE streaming)
  └─ Stripe PaymentIntent: AI-controlled payment gate (blocked on FAIL, confirmed on PASS)
```

### Sponsor technology integration

| Sponsor | Integration | Where |
|---------|-------------|-------|
| **NVIDIA NIM** | `nemotron-4-340b-instruct` for Ember+Umber Council; SSE streaming | `demo/server/index.js` `/council-stream` |
| **Nous Research** | `hermes-3-llama-3.1-405b` for multi-agent orchestration routing | `demo/server/index.js` `/hermes` |
| **Stripe** | PaymentIntents API, test mode auto-confirm `pm_card_visa` | `demo/server/index.js` `/payment-intent` |

### Quick demo setup (2 minutes)

```bash
# 1. Backend (optional — demo works fully in mock mode without API keys)
cd demo/server
npm install
cp .env.example .env        # add NVIDIA_API_KEY and STRIPE_SECRET_KEY
npm start                   # runs on :3001

# 2. Frontend — no build needed, open directly
open demo/index.html
# or serve statically:
npx serve demo
```

### Demo scenarios

| Scenario | Key | Result |
|----------|-----|--------|
| Chicago Tower (95-story) | `1` | ✅ PASS — 40 ksi yield, IBC compliant, payment succeeds |
| SF Bay Retrofit (seismic zone 4) | `2` | ✅ PASS — 50 ksi yield, AISC 360 compliant, payment succeeds |
| Non-compliant beam | `3` | ❌ FAIL — 28 ksi yield (22% below IBC minimum), payment blocked |

**Keyboard shortcuts:** `1/2/3` select scenario · `Enter` runs demo · `C` compares all · `K` toggles kiosk auto-run · `?` shows all shortcuts

**Kiosk / live demo mode:** append `?kiosk=1` to URL for fully automatic cycling through all 3 scenarios

### Why it matters

Construction compliance fraud costs $15B annually in the United States. A single falsified structural certification can lead to catastrophic building failures. Sovereign Dominion replaces paper stamps with:

1. **Cryptographic proof** — QSSM generates an unforgeable ZK proof of material compliance
2. **AI deliberation** — Independent Ember and Umber agents debate structural risk before any seal can be issued
3. **Immutable audit trail** — Moloch MMR commits every proof to a Merkle log
4. **Payment gate** — Stripe PaymentIntent is programmatically blocked by the AI council when non-compliant

---

## Overview

Sovereign Dominion is a browser-native AR construction platform that combines:

- **5D Gaussian Splatting** — WebGPU-accelerated photorealistic scene reconstruction at 90–120 fps
- **Esther Voice Agent** — Neural ODE Kuramoto prosody, Chatterbox TTS, Whisper ASR, 10-language support
- **QSSM Zero-Knowledge Proofs** — Post-quantum lattice-based material verification via WASM
- **Compliance Engine** — IRC, IBC, OSHA 1926, NEC rule packs with real-time violation highlighting
- **Blockchain Trust Layer** — Polygon smart contracts for supplier registry and change-order immutability
- **Automerge CRDT** — Real-time multi-user collaboration without conflict

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your API keys

# Start development server
npm run dev

# Run tests
npm test

# Type check
npm run typecheck
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / PWA                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Camera  │  │  Esther  │  │   5DGS Renderer       │  │
│  │  Stream  │  │  Voice   │  │   (WebGPU / WGSL)     │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │             │                    │               │
│  ┌────▼─────────────▼────────────────────▼───────────┐  │
│  │              Core Engine                           │  │
│  │  Compliance │ Material Calc │ Supplier │ QSSM ZKP  │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │           Offline-First Storage (IndexedDB)        │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  Cloudflare      Polygon Chain    Supabase
  Workers         Smart Contracts  (Optional)
  (API Proxies)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| 3D / AR | Three.js, WebGPU, WGSL Shaders |
| AI / ML | ONNX Runtime Web, SegFormer, MobileNetV2 |
| Voice | Web Speech API, Chatterbox TTS, Whisper ASR |
| Crypto | QSSM WASM, Ethers.js v6, WebAuthn |
| Geo | MapLibre GL, GeoTIFF, OpenTopography API |
| Collab | Automerge CRDT |
| Search | Fuse.js fuzzy search |
| BIM | web-ifc (IFC 4.3), jsPDF |
| Mobile | Capacitor (iOS / Android) |
| Backend | Cloudflare Workers, KV Cache |
| Blockchain | Polygon, Hardhat, Solidity |
| CI/CD | GitHub Actions, Cloudflare Pages |

---

## Environment Variables

See [`.env.example`](.env.example) for all required configuration. Key variables:

```
VITE_SUPPLIER_WORKER_URL=    # Cloudflare Worker for 1build API
VITE_WEATHER_WORKER_URL=     # Cloudflare Worker for Visual Crossing
VITE_SOLAR_WORKER_URL=       # Cloudflare Worker for Google Solar
VITE_POLYGON_RPC_URL=        # Polygon network RPC
VITE_SUPPLIER_REGISTRY_ADDR= # SupplierRegistry contract address
VITE_CHANGE_ORDER_ADDR=      # ChangeOrderLog contract address
VITE_OPENTOPO_API_KEY=       # OpenTopography elevation data
```

---

## Mathematical Foundations

Full derivations in [`docs/math_spec.md`](docs/math_spec.md):

- **5DGS Schur complement marginalization** — marginalizes camera poses from the information matrix to isolate splat parameters
- **Kuramoto oscillator prosody** — coupled neural ODE for natural speech rhythm
- **QSSM ring commitment** — post-quantum lattice commitment scheme for ZK proofs
- **Monte Carlo block estimation** — 1,000-sample waste factor simulation (σ = 0.03)
- **Shoelace polygon area** — exact computation for mulch volume from arbitrary polygons
- **Haversine distance** — GPS distance calculation using Earth radius R = 6,371,000 m

---

## Compliance Rule Packs

| Pack | Rules | Covered |
|------|-------|---------|
| IRC Retaining Walls | R404-1, R404-2 | Height limits, setbacks, engineer stamps |
| IRC Decks | R507-1, R507-2 | Guardrails, ledger fasteners |
| OSHA 1926 | Fall protection, excavation | Worker safety thresholds |
| NEC | GFCI, underground wiring, service entrance | Electrical code |

---

## Deployment

```bash
# Build for production
npm run build

# Deploy workers
cd worker && wrangler deploy supplierProxy.js
cd worker && wrangler deploy weatherProxy.js
cd worker && wrangler deploy solarProxy.js

# Deploy smart contracts
npx hardhat run scripts/deploy.ts --network polygon

# Deploy frontend (auto via CI on push to main)
```

---

## Security

- All API keys stored in Cloudflare Worker secrets (never in client bundle)
- QSSM proofs generated on-device; no biometric data leaves the device
- WebAuthn credential signing for contractor identity
- Differential privacy (ε = 1.0) applied to aggregate analytics
- Report vulnerabilities to: security@sovereigndominion.dev

---

## License

Core platform: Proprietary — all rights reserved.

The following components are MIT licensed:
- `shaders/` — WGSL GPU shaders
- `src/trust/qssm.ts` — WASM ZKP search bindings
- `src/voice/voiceController.ts` — Voice engine
- `src/mobile/lidarSession.ts` — LiDAR plugin
- `src/utils/materialCalculator.ts` — Material calculator

See [LICENSE](LICENSE) for full terms.

---

*Sovereign Dominion — Build with the sovereignty of your own word.*
