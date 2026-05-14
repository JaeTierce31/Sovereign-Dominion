import { ethers } from 'ethers';

export interface TrustProof {
  projectId: string;
  contentHash: string;
  timestamp: number;
  signature: string;
}

export async function signProposal(
  projectId: string,
  content: string,
  signer: ethers.Signer
): Promise<TrustProof> {
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));
  const timestamp = Date.now();
  const message = `${projectId}:${contentHash}:${timestamp}`;
  const signature = await signer.signMessage(message);

  return { projectId, contentHash, timestamp, signature };
}

export function verifySignature(proof: TrustProof, expectedAddress: string): boolean {
  const message = `${proof.projectId}:${proof.contentHash}:${proof.timestamp}`;
  const recovered = ethers.verifyMessage(message, proof.signature);
  return recovered.toLowerCase() === expectedAddress.toLowerCase();
}
