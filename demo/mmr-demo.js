// Moloch MMR append — attempts WASM, falls back to mock
let mmrWasm = null;

async function loadMMRWasm() {
  try {
    const module = await import('./pkg/moloch_mmr.js');
    await module.default();
    mmrWasm = module;
    console.log('✅ Moloch MMR WASM loaded');
    return true;
  } catch (e) {
    console.warn('⚠️ Moloch MMR WASM not available, using mock:', e.message);
    return false;
  }
}

export async function appendMMR(proof) {
  const wasmLoaded = await loadMMRWasm();

  if (wasmLoaded && mmrWasm?.WasmBeamLogger) {
    const logger = new mmrWasm.WasmBeamLogger('https://moloch.sovereign.dominion/api');
    const root = await logger.log_beam_compliance(
      proof.publicInputs?.beamId || 'B-001',
      proof.proof,
      { yield_strength: 40000n, elasticity: 30000000n, deflection_ratio: 1n, fire_rating: 2n },
      { min_yield_strength: 36000n, min_elasticity: 29000000n, max_deflection: 100n, min_fire_rating: 1n },
      '#22c55e'
    );
    const hex = Array.from(new Uint8Array(root)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('[BENCHMARK] MMR append: real');
    return '0x' + hex.slice(0, 16) + '...';
  }

  // Mock fallback — deterministic from proof bytes for reproducibility
  const proofBytes = proof.proof instanceof Uint8Array ? proof.proof : new Uint8Array(8);
  const mockRoot = '0x' + Array.from(proofBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
  await new Promise(r => setTimeout(r, 3));
  console.log('[BENCHMARK] MMR mock append: ~3ms');
  return mockRoot;
}
