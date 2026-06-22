// QSSM v1.1 Proof Generation — attempts WASM, falls back to mock
let qssmWasm = null;

async function loadQSSMWasm() {
  try {
    const module = await import('./pkg/qssm_rs.js');
    await module.default();
    qssmWasm = module;
    console.log('✅ QSSM WASM loaded');
    return true;
  } catch (e) {
    console.warn('⚠️ QSSM WASM not available, using mock:', e.message);
    return false;
  }
}

export async function runQSSMDemo() {
  const wasmLoaded = await loadQSSMWasm();

  if (wasmLoaded && qssmWasm?.wasm_generate_beam_proof && qssmWasm?.BeamMeasurement) {
    try {
      // Construct real wasm-bindgen class instances (constructors required)
      const measurement = new qssmWasm.BeamMeasurement(40000n, 30000000n, 1n, 2n);
      const requirements = new qssmWasm.BeamRequirements(36000n, 29000000n, 100n, 1n);
      const start = performance.now();
      const proofBytes = qssmWasm.wasm_generate_beam_proof(measurement, requirements);
      const duration = Number((performance.now() - start).toFixed(2));
      const valid = qssmWasm.wasm_verify_beam_proof(proofBytes, measurement, requirements);
      console.log(`[BENCHMARK] QSSM prove: ${duration}ms, verify: ${valid}`);
      return {
        proof: proofBytes,
        publicInputs: { beamId: 'B-001', domain: '#FF4500', compliance: valid ? 'PASS' : 'FAIL' },
        timestamp: Date.now(),
        benchmarkMs: duration,
        engine: 'wasm'
      };
    } catch (e) {
      console.warn('⚠️ QSSM WASM execution failed, using mock:', e.message);
    }
  }

  // Mock fallback
  const mockProof = new Uint8Array(32);
  try { crypto.getRandomValues(mockProof); } catch { mockProof.fill(0xAB); }
  await new Promise(r => setTimeout(r, 5));
  console.log('[BENCHMARK] QSSM mock prove: ~5ms');
  return {
    proof: mockProof,
    publicInputs: { beamId: 'B-001', domain: '#FF4500', compliance: 'PASS' },
    timestamp: Date.now(),
    benchmarkMs: 5,
    engine: 'mock'
  };
}
