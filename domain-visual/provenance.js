// Visual domain — C2PA-style provenance manifest.
//
// C2PA (Coalition for Content Provenance and Authenticity) is the standard for
// content-authenticity metadata. A real C2PA manifest is cryptographically
// SIGNED with an X.509 certificate chain from a recognized authority. This
// module builds the *structured assertion* a manifest carries — author, the
// software agent, the digital-source type, the governing seal reference — and
// hashes it (real SHA-256) so it can be committed into the Sovereign Seal.
//
// Honesty: this is a C2PA-*shaped* assertion, NOT a signed C2PA manifest. The
// signature the seal already carries is a real Ed25519 issuer signature (that
// part is genuine non-repudiation), but emitting an interoperable, C2PA-signed
// `.c2pa` manifest embedded in the image needs a signing certificate + the
// c2pa toolchain — the credentialed step. The hash + structured claim are real;
// the C2PA cert-signed manifest is the seam.

import { hash } from '../kernel/src/index.js';

/**
 * Build a C2PA-style provenance assertion for a generated artifact.
 * @param {object} spec
 * @param {string} spec.assetId
 * @param {string} spec.blueprintHash          content hash of the VGL blueprint
 * @param {string} [spec.generatorModel]        e.g. 'fibo'
 * @param {string} [spec.author]
 * @param {boolean} [spec.rendered]             whether an actual image was produced
 * @returns {{ manifest: object, manifestHash: string, syntheticMarked: true }}
 */
export function buildC2paManifest(spec) {
  const {
    assetId, blueprintHash, generatorModel = 'fibo', author = 'sovereign-visual', rendered = false,
  } = spec;

  const manifest = {
    // Mirrors the shape of a C2PA manifest's core assertions.
    claim_generator: 'sovereign-dominion/visual',
    format: 'application/vnd.sovereign.vgl+json',
    instance_id: `xmp:iid:${assetId}`,
    assertions: [
      // c2pa.actions — how the asset came to be.
      { label: 'c2pa.actions', data: { actions: [{ action: rendered ? 'c2pa.created' : 'c2pa.drafted', softwareAgent: `bria:${generatorModel}` }] } },
      // Declares AI-generated origin (this is the honest "synthetic" marking).
      { label: 'c2pa.training-mining', data: { digitalSourceType: 'trainedAlgorithmicMedia' } },
      // Binds the governing VGL blueprint by content hash.
      { label: 'sovereign.blueprint', data: { blueprintHash, alg: 'sha256' } },
    ],
    author: [{ '@type': 'Organization', name: author }],
    createdAt: new Date().toISOString(),
    signed: false, // NOT a cert-signed C2PA manifest — see module header.
  };

  return {
    manifest,
    manifestHash: hash(manifest),
    syntheticMarked: true, // satisfies the charter's disclosure.synthetic_marking invariant
  };
}
