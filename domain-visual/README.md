# domain-visual — governed Bria-style visual generation

The Visual domain: a Bria-style **VGL blueprint** (`structured_prompt`) is the payload of a
Sovereign kernel Intent, gated by [`constitution/charter.visual-generation.example.yaml`](../constitution/charter.visual-generation.example.yaml),
sealed with real Ed25519, audited in the real MMR, and persisted through the ledger seam.
It is the third sibling of the AEC and Housing domains — same kernel loop, different
handlers + invariants. Background and the honesty correction table:
[`docs/BRIA-VGL-SYNTHESIS.md`](../docs/BRIA-VGL-SYNTHESIS.md).

## The three seams (real interface, credentialed backend)

Each of these follows the same pattern the kernel already uses for its Ed25519 signer:
the **interface is real and tested**; the external/credentialed backend is a documented
swap point, not a fake.

| Module | Seam | Real today | The credentialed step |
|---|---|---|---|
| [`generator.js`](generator.js) | Image generation | `createBriaGenerator()` interface + offline stub (governs + seals the blueprint, **does not fabricate an image**) | A Bria enterprise API key → the wired live `fetch` path renders the `structured_prompt`. |
| [`provenance.js`](provenance.js) | Content authenticity | `buildC2paManifest()` — a C2PA-*shaped* assertion, real SHA-256 hash, sealed into the credential | A signing certificate + the c2pa toolchain → an interoperable, cert-signed `.c2pa` manifest. |
| `@sovereign/kernel` `InMemoryLedger` | Persistence (Tier 2) | Real in-process store of sealed records | A Supabase project + service key → a durable Postgres-backed ledger. |

## The governed path

```
submit VGL blueprint
  → GATE      charter invariants (licensed inputs, moderation cleared, blueprint
              integrity, visible confidence, synthetic marking) must hold
  → EXECUTE   generator.generate(blueprint)  (offline stub without a key)
              + buildC2paManifest(...)        (hashed provenance)
  → OBSERVE   append to the MMR audit
  → SEAL      Ed25519, with resultRef binding the generation result + manifest hash
  → PERSIST   store the sealed record in the ledger
```

Proven end to end in [`kernel/test/visual-pipeline.integration.test.mjs`](../kernel/test/visual-pipeline.integration.test.mjs)
(7 checks) and, for the gate invariants alone, [`kernel/test/visual-generation.integration.test.mjs`](../kernel/test/visual-generation.integration.test.mjs)
(9 checks).

## Honesty boundaries (do not overclaim)

- The offline generator **does not produce an image** — it governs and seals the blueprint's
  provenance. `rendered: false` says so.
- The provenance manifest is **not a cert-signed C2PA manifest** (`signed: false`). The
  Ed25519 seal around it *is* a real signature; the interoperable C2PA signing is the seam.
- The `InMemoryLedger` is **not durable across restarts**. Durability is the Supabase seam.
