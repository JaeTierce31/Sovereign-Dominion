import { ethers } from 'ethers';
import * as fs from 'fs';

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/SupplierRegistry.sol/SupplierRegistry.json', 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  console.log('Deploying SupplierRegistry...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`SupplierRegistry deployed to: ${address}`);
  console.log(`Add to .env: VITE_REGISTRY_CONTRACT=${address}`);
}

main().catch(console.error);
