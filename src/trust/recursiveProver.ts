export interface RecursiveProof {
  depth: number;
  root: Uint8Array<ArrayBuffer>;
  proof: Uint8Array<ArrayBuffer>;
}

export async function buildRecursiveProof(
  proofs: Uint8Array[]
): Promise<RecursiveProof> {
  if (proofs.length === 0) throw new Error('No proofs to aggregate');

  const combined = new Uint8Array(proofs.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const p of proofs) {
    combined.set(p, offset);
    offset += p.length;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const root = new Uint8Array(hashBuffer);

  return { depth: proofs.length, root, proof: combined };
}

export async function verifyRecursive(proof: RecursiveProof): Promise<boolean> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', proof.proof);
  const computed = new Uint8Array(hashBuffer);
  return computed.every((v, i) => v === proof.root[i]);
}
