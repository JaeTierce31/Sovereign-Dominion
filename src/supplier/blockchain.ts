import { ethers } from 'ethers';

const REGISTRY_ABI = [
  'function getLatestCID(address supplier) external view returns (bytes32)',
  'function updateCatalog(bytes32 _cid) external',
  'event CatalogUpdated(address indexed supplier, bytes32 ipfsCID, uint256 timestamp)',
];

const registryAddress = import.meta.env.VITE_REGISTRY_CONTRACT;

export async function getSupplierCID(supplierAddr: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_POLYGON_RPC_URL);
  const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);
  const cid = await contract.getLatestCID(supplierAddr);
  return cid;
}
