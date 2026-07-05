// @sovereign/kernel — the domain-agnostic verification kernel.
// Intent → Gate → Verify → Execute → Observe → Seal.
// Shared by Sovereign Dominion (AEC) and Sovereign Dignity (Housing / HUD NSPIRE).

export { createIntent } from './intent.js';
export { Constitution, defineInvariant } from './invariant.js';
export { CapabilityRegistry } from './capability-registry.js';
export { AuditLog } from './audit.js';
export { MerkleMountainRange, verifyMmrProof } from './mmr.js';
export { InMemoryLedger, nullLedger } from './ledger.js';
export { prove, verify } from './proof.js';
export { hashIntegrityResolver, composeResolvers } from './proof-resolvers.js';
export { createEd25519Signer, verifyEd25519 } from './ed25519.js';
export { issueSeal, verifySeal } from './seal.js';
export { SelfHealingEngine } from './self-healing.js';
export { createKernel } from './pipeline.js';
export { hash, stableStringify } from './hash.js';
export { compileCharter, compileInvariant, compilePredicate } from './charter-compiler.js';
