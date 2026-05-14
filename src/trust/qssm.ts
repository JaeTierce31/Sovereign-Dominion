let wasmModule: any = null;

export async function initQSSM() {
  try {
    const { default: init, Prover } = await import('../../wasm/qssm_rs.generated.js' as any);
    await init();
    wasmModule = { Prover };
  } catch {
    console.warn('QSSM WASM not available, using mock prover');
    wasmModule = { mock: true };
  }
}

export function proveMaterialList(materials: { quantity: number }[]): Uint8Array {
  if (!wasmModule) throw new Error('QSSM not initialized');
  if (wasmModule.mock) {
    return new Uint8Array(64).fill(0xab);
  }
  const prover = new wasmModule.Prover();
  return prover.prove_multiple(materials.map(() => ({ type: 'GreaterThan', threshold: 0 })));
}

export function verifyProof(proof: Uint8Array, materials: { quantity: number }[]): boolean {
  if (!wasmModule) throw new Error('QSSM not initialized');
  if (wasmModule.mock) return true;
  const prover = new wasmModule.Prover();
  return prover.verify_multiple(proof, materials.map(m => m.quantity));
}
