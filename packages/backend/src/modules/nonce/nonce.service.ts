import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from '../blockchain/blockchain.service';
import { isAddress, getAddress } from 'viem';

@Injectable()
export class NonceService {
  private readonly logger = new Logger(NonceService.name);
  private readonly delegatedAccountAbi = [
    {
      inputs: [{ name: 'account', type: 'address' }],
      name: 'getNonce',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Get the nonce for an account in the EIP-7702 context.
   *
   * With EIP-7702, the nonce is stored in the user's EOA storage, not the
   * implementation contract's storage. We need to query the user's address
   * directly (if it has code) or return 0 for first-time users.
   */
  async getNonce(address: string, chainId?: number): Promise<string> {
    if (!isAddress(address)) {
      throw new BadRequestException('Invalid address format');
    }

    const requestedChainId = chainId || this.blockchainService.getChainId();
    const actualChainId = this.blockchainService.getChainId();

    if (requestedChainId !== actualChainId) {
      throw new BadRequestException(
        `Chain ID mismatch. Backend supports chain ${actualChainId}, requested ${requestedChainId}`,
      );
    }

    const publicClient = this.blockchainService.getPublicClient();
    const userAddress = getAddress(address);

    // With EIP-7702, nonces are stored in the user's EOA storage.
    // First, check if the user's EOA has code (from a previous EIP-7702 delegation).
    const code = await publicClient.getCode({ address: userAddress });

    if (!code || code === '0x') {
      // User has no code - this is a first-time user, nonce is 0
      this.logger.debug(
        `No code at ${userAddress}, first-time user, nonce is 0`,
      );
      return '0';
    }

    // User has code - query the nonce from the user's address storage
    try {
      const nonce = await publicClient.readContract({
        address: userAddress, // Query the user's EOA, not the implementation contract
        abi: this.delegatedAccountAbi,
        functionName: 'getNonce',
        args: [userAddress], // The nonce is stored at _nonces[address(this)]
      });

      this.logger.debug(`Nonce for ${userAddress}: ${nonce.toString()}`);
      return nonce.toString();
    } catch (error) {
      // If the call fails for any reason, assume nonce is 0
      this.logger.warn(
        `Failed to read nonce from ${userAddress}, defaulting to 0: ${error.message}`,
      );
      return '0';
    }
  }
}
