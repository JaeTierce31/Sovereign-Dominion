# Sovereign Dominion

**Voice-First 5D Augmented Intelligence Platform** — *Your word, built.*

[![CI](https://github.com/jaetierce31/sovereign-dominion/actions/workflows/ci.yml/badge.svg)](https://github.com/jaetierce31/sovereign-dominion/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Proprietary%2FMIT-blue)](LICENSE)

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
