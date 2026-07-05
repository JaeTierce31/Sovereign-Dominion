// The kernel loop — the single path every Intent takes:
//
//   submitIntent → GATE (Constitution) → VERIFY (proofs) → EXECUTE (domain handler)
//                → OBSERVE (append to audit) → SEAL
//
// This is the merge point: AEC and HMIS both submit Intents here; only the
// registered handlers and invariants differ. Nothing bypasses the gate.

import { verify as verifyProof } from './proof.js';
import { issueSeal } from './seal.js';
import { createEd25519Signer } from './ed25519.js';
import { nullLedger } from './ledger.js';
import { hash } from './hash.js';

/**
 * @param {object} deps
 * @param {import('./invariant.js').Constitution} deps.constitution
 * @param {import('./capability-registry.js').CapabilityRegistry} deps.registry
 * @param {import('./audit.js').AuditLog} deps.audit
 * @param {(id:string)=>object|undefined} [deps.proofResolver]  supplies a proof for a required id
 * @param {object} [deps.signer]  Ed25519 signer for the Seal; defaults to an ephemeral
 *   per-kernel key (the KMS/HSM seam — inject a KMS-backed signer in production).
 * @param {object} [deps.ledger]  durable store for sealed records; defaults to a no-op.
 *   Inject an InMemoryLedger (dev) or a Supabase-backed ledger (prod) — the Tier 2 seam.
 */
export function createKernel({ constitution, registry, audit, proofResolver = () => undefined, signer, ledger = nullLedger }) {
  const sealSigner = signer || createEd25519Signer();
  async function submitIntent(intent, context = {}) {
    const ctx = { intent, subject: intent.subject, now: () => Date.now(), ...context };

    // 1. GATE — every in-force invariant must hold.
    const gate = constitution.check(ctx);
    if (!gate.ok) {
      const rec = audit.append({ type: 'intent.blocked', intent: intent.id, action: intent.action, violations: gate.violations });
      return { status: 'blocked', violations: gate.violations, audit: rec };
    }

    // 2. VERIFY — required proofs check out (proofs carry no witness).
    const proofs = [];
    for (const pid of intent.requiredProofs) {
      const proof = proofResolver(pid, ctx);
      const ok = await verifyProof(proof);
      if (!ok) {
        const rec = audit.append({ type: 'intent.proof_failed', intent: intent.id, predicate: pid });
        return { status: 'proof_failed', predicate: pid, audit: rec };
      }
      proofs.push(proof);
    }

    // 3. EXECUTE — dispatch to the domain handler.
    const handler = registry.getHandler(intent.action);
    if (!handler) {
      const rec = audit.append({ type: 'intent.no_handler', intent: intent.id, action: intent.action });
      return { status: 'no_handler', action: intent.action, audit: rec };
    }
    let result;
    try {
      result = await handler(intent, ctx);
    } catch (e) {
      const rec = audit.append({ type: 'intent.error', intent: intent.id, action: intent.action, error: String(e && e.message || e) });
      return { status: 'error', error: String(e && e.message || e), audit: rec };
    }

    // 4. OBSERVE — commit an immutable record of what happened.
    const rec = audit.append({ type: 'intent.executed', intent: intent.id, action: intent.action, domain: intent.domain });

    // 5. SEAL — mint the portable credential against the fresh audit root.
    // The seal commits to *what* the handler produced (resultRef), not just the
    // action name — so the credential binds the actual outcome (e.g. a Visual
    // domain's generation result + its C2PA-style provenance manifest hash).
    const seal = issueSeal({
      subject: intent.subject,
      claims: {
        action: intent.action,
        domain: intent.domain,
        resultRef: result === undefined ? null : hash(result),
      },
      proof: proofs[0] || null,
      auditRoot: rec.root,
    }, sealSigner);

    // 6. PERSIST — durably store the sealed record (no-op unless a ledger is injected).
    ledger.store({ id: seal.id, seal, auditRoot: rec.root, intentId: intent.id, action: intent.action });

    return { status: 'sealed', result, audit: rec, seal };
  }

  return { submitIntent, signer: sealSigner, ledger };
}
