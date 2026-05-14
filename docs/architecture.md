# Sovereign Dominion — Architecture Overview

## System Overview

Sovereign Dominion is a mobile-first PWA with native iOS/Android shells that delivers real-time 5D AR design, voice interaction, compliance checking, and supply chain integration.

## Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser / Native App                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  React UI    │  │  Voice Agent │  │  AR Renderer  │  │
│  │  (Tailwind)  │  │  (Esther)    │  │  (WebGPU/GL2) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│  ┌──────▼─────────────────▼──────────────────▼───────┐  │
│  │              Unified Scene Graph                   │  │
│  │         (Three.js + Automerge CRDT)                │  │
│  └──────┬──────────────────────────────┬─────────────┘  │
│         │                              │                 │
│  ┌──────▼──────┐              ┌────────▼──────────────┐ │
│  │  Compliance │              │  Supplier Aggregator  │ │
│  │  Engine     │              │  (Fuzzy + Blockchain)  │ │
│  └──────┬──────┘              └────────┬──────────────┘ │
└─────────┼───────────────────────────────┼───────────────┘
          │                               │
┌─────────▼──────┐              ┌─────────▼──────────────┐
│ Cloudflare     │              │ Polygon Smart Contracts │
│ Workers        │              │ (SupplierRegistry,      │
│ (API proxies)  │              │  ChangeOrderLog)        │
└────────────────┘              └────────────────────────┘
```

## Key Components

### 5D Gaussian Splatting Engine
- WebGPU-accelerated rendering at 90-120 fps
- Radix sort for back-to-front ordering
- LiDAR depth occlusion via ARKit/ARCore
- Violation mask overlay (red glow for code failures)

### Voice Agent (Esther)
- Whisper ASR for speech recognition
- Chatterbox TTS with neural ODE prosody
- Wav2Vec2 emotion detection
- 10-language support via i18next

### Compliance Engine
- Rule packs: IRC, IBC, OSHA 1926, NEC
- Jurisdiction harmonizer for local amendments
- Real-time AR violation highlighting
- Inspector walkthrough mode

### Supplier Aggregation
- 1build API via Cloudflare Worker proxy
- Fuse.js fuzzy search with WASM acceleration
- Blockchain supplier registry (Polygon)
- IPFS catalog distribution

### Trust & Cryptography
- QSSM lattice-based ZKP (WASM, ~10ms/proof)
- WebAuthn hardware attestation
- Ethereum-compatible signatures via ethers.js
- Nova recursion for proof aggregation

## Data Flow

1. Camera → MediaStream → Three.js VideoTexture
2. Voice → Whisper ASR → Esther intent parser
3. Intent → Scene Graph mutation → AR update
4. Scene Graph → Compliance Checker → Violation mask
5. Materials → Supplier Aggregator → SupplierPanel
6. Export → IFC/DXF/PDF → QSSM proof → Download

## Offline Capability

All core features work offline:
- Scene graph and rule packs in IndexedDB
- ONNX models cached by Service Worker
- SQLite via sql.js for project storage
- Sync on reconnect via Automerge CRDT
