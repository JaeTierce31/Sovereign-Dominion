import { ethers } from 'ethers';

const ESCROW_ABI = [
  'function deposit(bytes32 projectId) external payable',
  'function release(bytes32 projectId) external',
  'function refund(bytes32 projectId) external',
  'function getBalance(bytes32 projectId) external view returns (uint256)',
  'event Deposited(bytes32 indexed projectId, address contractor, uint256 amount)',
  'event Released(bytes32 indexed projectId, uint256 amount)',
];

export class EscrowService {
  private contract: ethers.Contract;

  constructor(address: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(address, ESCROW_ABI, signer);
  }

  async deposit(projectId: string, amountEth: string): Promise<string> {
    const id = ethers.id(projectId);
    const tx = await this.contract.deposit(id, { value: ethers.parseEther(amountEth) });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async release(projectId: string): Promise<string> {
    const id = ethers.id(projectId);
    const tx = await this.contract.release(id);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getBalance(projectId: string): Promise<string> {
    const id = ethers.id(projectId);
    const balance = await this.contract.getBalance(id);
    return ethers.formatEther(balance);
  }
}
