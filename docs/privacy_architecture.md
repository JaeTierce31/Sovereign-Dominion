# Privacy & Anti-Surveillance Architecture

## Core Principles

1. **On-device processing first** — All AI inference runs locally via ONNX Runtime
2. **Consumer-controlled twin** — Users own their digital twin and project data
3. **No surveillance** — No behavioral tracking without explicit consent
4. **Zero-knowledge proofs** — Verify claims without revealing underlying data
5. **Hardware attestation** — WebAuthn ensures device authenticity

## Data Residency

| Data Type | Storage | Encrypted |
|-----------|---------|-----------|
| Project designs | IndexedDB (local) | AES-256 |
| Voice commands | In-memory only | N/A |
| Camera frames | Never persisted | N/A |
| Material estimates | IndexedDB (local) | AES-256 |
| Blockchain records | Polygon (public) | Hashed |
| Supplier catalogs | IPFS + Cloudflare KV | N/A |

## What Is NOT Collected

- Raw camera/video footage
- Voice recordings
- Location history
- Behavioral analytics (without opt-in)
- Biometric data

## QSSM Zero-Knowledge Proofs

Material estimates and compliance status are verified with ZKP:
- Prove a wall is compliant WITHOUT revealing dimensions
- Prove pricing is fair WITHOUT revealing supplier margins
- Prove worker credentials WITHOUT revealing personal data

## Differential Privacy

Aggregate usage telemetry (feature adoption, error rates) uses ε-differential privacy with ε = 1.0.

## WebAuthn Integration

Hardware-backed attestation for:
- Contractor identity verification
- Proposal signing
- Change order authorization

## API Key Security

- All API keys stored in Cloudflare Worker secrets
- Never exposed to browser
- Rotated quarterly
- Rate-limited per origin
