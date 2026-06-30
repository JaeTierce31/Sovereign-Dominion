// Moloch MMR append — attempts WASM, falls back to mock
let mmrWasm = null;
let mmrLoaded = false;

async function loadMMRWasm() {
  if (mmrLoaded) return mmrWasm !== null;
  mmrLoaded = true;
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
    try {
      const logger = new mmrWasm.WasmBeamLogger('http://localhost:3001');
      // Signature: log_beam_compliance(beam_id, proof, yield: u64, elasticity: u64, color_seal)
      const root = logger.log_beam_compliance(
        proof.publicInputs?.beamId || 'B-001',
        proof.proof,
        40000n,
        30000000n,
        '#22c55e'
      );
      const hex = Array.from(new Uint8Array(root)).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('[BENCHMARK] MMR append: real');
      return { root: '0x' + hex.slice(0, 16) + '...', engine: 'wasm' };
    } catch (e) {
      console.warn('⚠️ Moloch MMR WASM execution failed, using mock:', e.message);
    }
  }

  // Mock fallback — deterministic from proof bytes for reproducibility
  const proofBytes = proof.proof instanceof Uint8Array ? proof.proof : new Uint8Array(8);
  const mockRoot = '0x' + Array.from(proofBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
  await new Promise(r => setTimeout(r, 3));
  console.log('[BENCHMARK] MMR mock append: ~3ms');
  return { root: mockRoot, engine: 'mock' };
}
