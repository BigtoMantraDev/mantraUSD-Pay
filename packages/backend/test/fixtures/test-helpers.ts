import { privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts';
import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  Hex,
} from 'viem';

/**
 * Test wallet fixtures for integration tests
 */
export class TestWallets {
  static readonly USER_1 = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  );

  static readonly USER_2 = privateKeyToAccount(
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  );

  static readonly USER_3 = privateKeyToAccount(
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  );

  static getAllWallets(): PrivateKeyAccount[] {
    return [this.USER_1, this.USER_2, this.USER_3];
  }
}

/**
 * Test intent builder for creating valid relay requests
 */
export class IntentBuilder {
  private chainId: number = 5887;
  private destination: Hex = '0x0000000000000000000000000000000000000000';
  private value: string = '0';
  private data: Hex = '0x';
  private nonce: string = '0';
  private deadline: string = String(Math.floor(Date.now() / 1000) + 3600); // 1 hour

  setChainId(chainId: number): this {
    this.chainId = chainId;
    return this;
  }

  setDestination(destination: Hex): this {
    this.destination = destination;
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    return this;
  }

  setData(data: Hex): this {
    this.data = data;
    return this;
  }

  setNonce(nonce: string): this {
    this.nonce = nonce;
    return this;
  }

  setDeadline(deadline: string): this {
    this.deadline = deadline;
    return this;
  }

  setExpiredDeadline(): this {
    this.deadline = String(Math.floor(Date.now() / 1000) - 3600);
    return this;
  }

  setFutureDeadline(secondsFromNow: number): this {
    this.deadline = String(Math.floor(Date.now() / 1000) + secondsFromNow);
    return this;
  }

  build() {
    return {
      destination: this.destination,
      value: this.value,
      data: this.data,
      nonce: this.nonce,
      deadline: this.deadline,
    };
  }

  /**
   * Build and sign an intent for a relay request
   */
  async buildSignedRequest(
    userAccount: PrivateKeyAccount,
    delegatedAccountAddress: Hex,
  ) {
    const intent = this.build();

    // Compute EIP-712 domain separator
    const DOMAIN_TYPEHASH = keccak256(
      Buffer.from(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
      ),
    );

    const domainSeparator = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
        [
          DOMAIN_TYPEHASH,
          keccak256(Buffer.from('DelegatedAccount')),
          keccak256(Buffer.from('1')),
          BigInt(this.chainId),
          delegatedAccountAddress,
        ],
      ),
    );

    // Compute intent hash
    const INTENT_TYPEHASH = keccak256(
      Buffer.from(
        'Intent(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)',
      ),
    );

    const intentHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters(
          'bytes32, address, uint256, bytes32, uint256, uint256',
        ),
        [
          INTENT_TYPEHASH,
          intent.destination,
          BigInt(intent.value),
          keccak256(intent.data),
          BigInt(intent.nonce),
          BigInt(intent.deadline),
        ],
      ),
    );

    // Compute digest
    const digest = keccak256(
      encodeAbiParameters(
        parseAbiParameters('bytes1, bytes1, bytes32, bytes32'),
        ['0x19', '0x01', domainSeparator, intentHash],
      ),
    );

    // Sign the digest
    const signature = await userAccount.signMessage({
      message: { raw: digest },
    });

    return {
      userAddress: userAccount.address,
      signature,
      chainId: this.chainId,
      intent,
    };
  }
}

/**
 * Mock contract addresses for testing
 */
export const TestContracts = {
  DELEGATED_ACCOUNT: '0x1234567890123456789012345678901234567890' as Hex,
  TOKEN: '0xd2b95283011E47257917770D28Bb3EE44c849f6F' as Hex,
  MOCK_TARGET: '0x9999999999999999999999999999999999999999' as Hex,
};

/**
 * Helper to create mock ERC20 transfer data
 */
export function createTransferData(to: Hex, amount: bigint): Hex {
  const transferSelector = '0xa9059cbb'; // transfer(address,uint256)
  const params = encodeAbiParameters(
    parseAbiParameters('address, uint256'),
    [to, amount],
  );
  return (transferSelector + params.slice(2)) as Hex;
}

/**
 * Helper to wait for a specific time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to create multiple concurrent requests
 */
export function createConcurrentRequests<T>(
  count: number,
  requestFn: () => Promise<T>,
): Promise<T[]> {
  return Promise.all(Array(count).fill(null).map(() => requestFn()));
}
