import { ethers } from 'ethers';

const REGISTRY_ABI = [
  'function updateCatalog(bytes32 _cid) external',
  'event CatalogUpdated(address indexed supplier, bytes32 ipfsCID, uint256 timestamp)',
];

async function main() {
  const rpcUrl = process.env.POLYGON_RPC_URL ?? 'https://polygon-rpc.com';
  const privateKey = process.env.SUPPLIER_PRIVATE_KEY;
  const registryAddress = process.env.REGISTRY_CONTRACT;

  if (!privateKey || !registryAddress) {
    throw new Error('SUPPLIER_PRIVATE_KEY and REGISTRY_CONTRACT env vars required');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, signer);

  console.log('Supplier daemon started. Syncing catalog...');

  const catalogData = JSON.stringify({
    version: '1.0',
    updated: new Date().toISOString(),
    items: [],
  });

  const cid = ethers.keccak256(ethers.toUtf8Bytes(catalogData));
  const tx = await registry.updateCatalog(cid);
  await tx.wait();
  console.log(`Catalog updated on chain. CID: ${cid}, tx: ${tx.hash}`);
}

main().catch(console.error);
