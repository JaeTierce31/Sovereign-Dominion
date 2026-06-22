# Sovereign Dominion Hackathon Benchmarks

## Target Metrics
- QSSM proof generation: <10ms
- QSSM verification: <5ms
- MMR append: <5ms
- SCUGS render: <16ms (60fps)
- WASM cold start: <200ms
- Total demo flow: <5 seconds

## Actual Results (Desktop Chrome baseline)
- QSSM mock prove: ~5ms
- MMR mock append: ~3ms
- SCUGS canvas render: ~1ms (3 radial gradient splats)
- Stripe mock payment: ~15ms
- Total end-to-end (mock path): ~30ms

## WASM Build Status
- qssm_rs.wasm: ✅ Built (26.9 KB)
- moloch_mmr.wasm: ✅ Built (24.7 KB)
- Combined WASM cold start: ~50-80ms estimated

## Notes
- iPhone 15 Pro benchmarks require on-device testing
- Real QSSM ZK circuit timing will differ (100-500ms for actual lattice proofs)
- Network latency to Stripe API not measured in this environment
