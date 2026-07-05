// Visual domain — the image-generation seam (Bria / Fibo).
//
// This is where a real Bria API call WOULD live. Isolating it here keeps the
// domain-agnostic kernel free of any Bria dependency and makes this the swap
// point: `createBriaGenerator({ apiKey, fetchImpl })` returns a generator whose
// `generate(blueprint)` renders a VGL structured_prompt into an asset.
//
// Honesty: without an enterprise API key (which this session does not have),
// there is nothing to call, so the default is an **offline stub** that does NOT
// fabricate an image. It returns a clearly-labeled, deterministic descriptor
// (`rendered: false`, reason stated) so the governed pipeline can still run,
// seal, and persist the *blueprint's* provenance end-to-end without pretending
// pixels were produced. When a key is supplied, the real path is a single fetch
// to Bria's generate endpoint — wired but never exercised without the key.

import { hash } from '../kernel/src/index.js';

/**
 * @param {object} [opts]
 * @param {string} [opts.apiKey]     Bria enterprise API key; absent → offline stub.
 * @param {string} [opts.model]      e.g. 'fibo' (Bria's structured-generation model).
 * @param {Function} [opts.fetchImpl] injectable fetch (for the real path / testing).
 * @returns {{ mode:'live'|'offline', generate:(blueprint:object)=>Promise<object> }}
 */
export function createBriaGenerator(opts = {}) {
  const { apiKey, model = 'fibo', fetchImpl } = opts;

  if (!apiKey) {
    // Offline stub — real interface, no fabricated image.
    return Object.freeze({
      mode: 'offline',
      async generate(blueprint) {
        const blueprintHash = hash(typeof blueprint === 'string' ? blueprint : JSON.stringify(blueprint));
        return {
          rendered: false,
          reason: 'no-bria-credentials',
          model,
          blueprintHash,
          note: 'Offline stub: blueprint governed + sealed, but no image was generated (needs a Bria API key).',
        };
      },
    });
  }

  const doFetch = fetchImpl || globalThis.fetch;
  return Object.freeze({
    mode: 'live',
    async generate(blueprint) {
      const body = typeof blueprint === 'string' ? blueprint : JSON.stringify(blueprint);
      const blueprintHash = hash(body);
      // Real Bria generate call — shape per Bria's API; exercised only with a key.
      const res = await doFetch('https://engine.prod.bria-api.com/v1/text-to-image/base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', api_token: apiKey },
        body: JSON.stringify({ model, structured_prompt: JSON.parse(body) }),
      });
      if (!res.ok) throw new Error(`Bria generate failed: ${res.status}`);
      const data = await res.json();
      return { rendered: true, model, blueprintHash, result: data };
    },
  });
}
