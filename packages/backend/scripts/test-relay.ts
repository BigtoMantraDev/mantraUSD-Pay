/**
 * EIP-7702 Relay Test Script
 *
 * Tests the mantraUSD-Pay relay backend by:
 * 1. Signing an EIP-7702 authorization to delegate EOA to DelegatedAccount
 * 2. Signing an EIP-712 intent for a mantraUSD transfer
 * 3. Submitting the relay request to the backend
 *
 * Usage:
 *   npx ts-node scripts/test-relay.ts
 *
 * Environment variables (from .env):
 *   - EOA_PK: Private key of the test account
 *   - DELEGATED_ACCOUNT_ADDRESS: Contract address
 *   - TOKEN_ADDRESS: mantraUSD token address
 *   - RPC_URL: MANTRA Dukong RPC
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  encodeFunctionData,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  formatEther,
  parseUnits,
  toBytes,
  concat,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Load .env from backend directory
config({ path: resolve(__dirname, '../.env') });

// ============ Configuration ============

const CHAIN_ID = parseInt(process.env.CHAIN_ID || '5887', 10);
const RPC_URL = process.env.RPC_URL || 'https://evm.dukong.mantrachain.io';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_BASE = `${BACKEND_URL}/api`;

const DELEGATED_ACCOUNT_ADDRESS = process.env
  .DELEGATED_ACCOUNT_ADDRESS as Address;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS as Address;
const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || '6', 10);
const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || 'mantraUSD';

const EOA_PK = process.env.EOA_PK as Hex;

// ============ Chain Definition ============

const dukongTestnet = defineChain({
  id: CHAIN_ID,
  name: 'MANTRA Dukong Testnet',
  nativeCurrency: { name: 'OM', symbol: 'OM', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: 'MANTRA Explorer',
      url: 'https://explorer.dukong.mantrachain.io',
    },
  },
});

// ============ ABIs ============

const erc20Abi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const delegatedAccountAbi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getNonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ============ EIP-712 Types ============

// Use toBytes for proper UTF-8 encoding (matches Solidity's keccak256("string"))
const EIP712_DOMAIN_TYPEHASH = keccak256(
  toBytes(
    'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
  ),
);

const INTENT_TYPEHASH = keccak256(
  toBytes(
    'Intent(address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)',
  ),
);

// Pre-computed constants from the contract for verification
const CONTRACT_DOMAIN_TYPEHASH =
  '0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f';
const CONTRACT_NAME_HASH =
  '0x8fb3717175124fe77482abbbf65ce134bcb0a3c323ed0623cb87540ae3d69ffa';
const CONTRACT_VERSION_HASH =
  '0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6';

// ============ Helpers ============

function computeDigest(
  intent: {
    destination: Address;
    value: bigint;
    data: Hex;
    nonce: bigint;
    deadline: bigint;
  },
  chainId: number,
  verifyingContract: Address,
  debug = false,
): Hex {
  // Compute component hashes using toBytes for proper UTF-8 encoding
  const nameHash = keccak256(toBytes('DelegatedAccount'));
  const versionHash = keccak256(toBytes('1'));

  if (debug) {
    console.log('\\n=== EIP-712 Hash Verification ===');
    console.log('Domain TypeHash:');
    console.log('  Computed:', EIP712_DOMAIN_TYPEHASH);
    console.log('  Contract:', CONTRACT_DOMAIN_TYPEHASH);
    console.log('  Match:', EIP712_DOMAIN_TYPEHASH === CONTRACT_DOMAIN_TYPEHASH);
    console.log('Name Hash:');
    console.log('  Computed:', nameHash);
    console.log('  Contract:', CONTRACT_NAME_HASH);
    console.log('  Match:', nameHash === CONTRACT_NAME_HASH);
    console.log('Version Hash:');
    console.log('  Computed:', versionHash);
    console.log('  Contract:', CONTRACT_VERSION_HASH);
    console.log('  Match:', versionHash === CONTRACT_VERSION_HASH);
  }

  // Compute domain separator
  const domainSeparator = keccak256(
    encodeAbiParameters(
      parseAbiParameters('bytes32, bytes32, bytes32, uint256, address'),
      [
        EIP712_DOMAIN_TYPEHASH,
        nameHash,
        versionHash,
        BigInt(chainId),
        verifyingContract,
      ],
    ),
  );

  if (debug) {
    console.log('Domain Separator:', domainSeparator);
    console.log('Chain ID:', chainId);
    console.log('Verifying Contract:', verifyingContract);
  }

  // Compute intent hash
  const intentHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        'bytes32, address, uint256, bytes32, uint256, uint256',
      ),
      [
        INTENT_TYPEHASH,
        intent.destination,
        intent.value,
        keccak256(intent.data),
        intent.nonce,
        intent.deadline,
      ],
    ),
  );

  // Compute final EIP-712 digest using raw concatenation (NOT ABI encoding!)
  // The format is: keccak256("\x19\x01" || domainSeparator || structHash)
  const digest = keccak256(
    concat(['0x1901', domainSeparator, intentHash]),
  );

  return digest;
}

// ============ Main ============

async function main() {
  console.log('=== EIP-7702 Relay Test Script ===\n');

  // Validate env
  if (!EOA_PK) {
    console.error('ERROR: EOA_PK not set in .env');
    process.exit(1);
  }
  if (!DELEGATED_ACCOUNT_ADDRESS) {
    console.error('ERROR: DELEGATED_ACCOUNT_ADDRESS not set in .env');
    process.exit(1);
  }
  if (!TOKEN_ADDRESS) {
    console.error('ERROR: TOKEN_ADDRESS not set in .env');
    process.exit(1);
  }

  // Create account from private key
  const pk = EOA_PK.startsWith('0x') ? EOA_PK : (`0x${EOA_PK}` as Hex);
  const account = privateKeyToAccount(pk);
  console.log(`Test Account: ${account.address}`);
  console.log(`Chain ID: ${CHAIN_ID}`);
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`DelegatedAccount: ${DELEGATED_ACCOUNT_ADDRESS}`);
  console.log(`Token: ${TOKEN_ADDRESS}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('');

  // Create clients
  const publicClient = createPublicClient({
    chain: dukongTestnet,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: dukongTestnet,
    transport: http(RPC_URL),
  });

  // Check balances
  console.log('--- Checking Balances ---');

  const nativeBalance = await publicClient.getBalance({
    address: account.address,
  });
  console.log(`Native (OM) Balance: ${formatEther(nativeBalance)} OM`);

  const tokenBalance = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });
  const formattedTokenBalance =
    Number(tokenBalance) / Math.pow(10, TOKEN_DECIMALS);
  console.log(
    `${TOKEN_SYMBOL} Balance: ${formattedTokenBalance} ${TOKEN_SYMBOL}`,
  );

  if (tokenBalance === 0n) {
    console.error(
      `\nERROR: Account has no ${TOKEN_SYMBOL} tokens. Please fund the account first.`,
    );
    process.exit(1);
  }

  // Check backend status
  console.log('\n--- Checking Backend Status ---');
  try {
    const statusRes = await fetch(`${API_BASE}/relay/status`);
    if (!statusRes.ok) {
      throw new Error(`HTTP ${statusRes.status}: ${await statusRes.text()}`);
    }
    const status = await statusRes.json();
    console.log('Backend Status:', JSON.stringify(status, null, 2));
    if (!status.healthy) {
      console.warn('WARNING: Backend reports unhealthy status');
    }
  } catch (error) {
    console.error('ERROR: Could not connect to backend:', error);
    console.log(
      '\nMake sure the backend is running: yarn workspace backend start:dev',
    );
    process.exit(1);
  }

  // Get nonce from backend
  console.log('\n--- Getting Nonce ---');
  let nonce: bigint;
  try {
    const nonceRes = await fetch(
      `${API_BASE}/nonce/${account.address}?chainId=${CHAIN_ID}`,
    );
    if (!nonceRes.ok) {
      throw new Error(`HTTP ${nonceRes.status}: ${await nonceRes.text()}`);
    }
    const nonceData = await nonceRes.json();
    nonce = BigInt(nonceData.nonce);
    console.log(`Current nonce: ${nonce}`);
  } catch (error) {
    console.error('ERROR: Could not fetch nonce:', error);
    process.exit(1);
  }

  // Prepare transfer
  const TRANSFER_AMOUNT = parseUnits('0.01', TOKEN_DECIMALS); // 0.01 mantraUSD
  const RECIPIENT = account.address; // Self-transfer for testing

  console.log('\n--- Preparing Transfer ---');
  console.log(
    `Transfer: ${Number(TRANSFER_AMOUNT) / Math.pow(10, TOKEN_DECIMALS)} ${TOKEN_SYMBOL} to ${RECIPIENT}`,
  );

  // Encode ERC20 transfer call
  const transferData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [RECIPIENT, TRANSFER_AMOUNT],
  });
  console.log(`Encoded transfer data: ${transferData.slice(0, 20)}...`);

  // Create intent
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 minutes from now
  const intent = {
    destination: TOKEN_ADDRESS,
    value: 0n,
    data: transferData,
    nonce,
    deadline,
  };

  console.log('\n--- Signing EIP-712 Intent ---');

  // Compute digest and sign (with debug=true to verify hash computation)
  const digest = computeDigest(
    intent,
    CHAIN_ID,
    DELEGATED_ACCOUNT_ADDRESS,
    true,
  );
  console.log(`Digest: ${digest.slice(0, 20)}...`);

  // Use raw ECDSA signature (no Ethereum message prefix) for EIP-712
  const signature = await account.sign({
    hash: digest,
  });
  console.log(`Signature: ${signature.slice(0, 20)}...`);

  // Sign EIP-7702 authorization
  console.log('\n--- Signing EIP-7702 Authorization ---');

  // Get authorization nonce (transaction nonce of EOA, not the DelegatedAccount nonce)
  const authNonce = await publicClient.getTransactionCount({
    address: account.address,
  });
  console.log(`Authorization nonce (tx count): ${authNonce}`);

  // Sign authorization - delegates the EOA to the DelegatedAccount contract
  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress: DELEGATED_ACCOUNT_ADDRESS,
  });

  console.log('Authorization signed:', {
    chainId: authorization.chainId,
    address: authorization.address,
    nonce: authorization.nonce,
    yParity: authorization.yParity,
    r: authorization.r?.slice(0, 20) + '...',
    s: authorization.s?.slice(0, 20) + '...',
  });

  // Prepare relay request
  const relayRequest = {
    userAddress: account.address,
    signature,
    authorization: {
      chainId: authorization.chainId,
      contractAddress: authorization.address,
      nonce: authorization.nonce.toString(),
      r: authorization.r,
      s: authorization.s,
      yParity: authorization.yParity,
    },
    intent: {
      destination: intent.destination,
      value: `0x${intent.value.toString(16)}`,
      data: intent.data,
      nonce: intent.nonce.toString(),
      deadline: intent.deadline.toString(),
    },
    chainId: CHAIN_ID,
  };

  console.log('\n--- Submitting Relay Request ---');
  console.log('Request payload:');
  console.log(
    JSON.stringify(
      {
        ...relayRequest,
        signature: relayRequest.signature.slice(0, 20) + '...',
        authorization: {
          ...relayRequest.authorization,
          r: relayRequest.authorization.r?.slice(0, 20) + '...',
          s: relayRequest.authorization.s?.slice(0, 20) + '...',
        },
      },
      null,
      2,
    ),
  );

  try {
    const relayRes = await fetch(`${API_BASE}/relay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(relayRequest),
    });

    const responseText = await relayRes.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!relayRes.ok) {
      console.error(`\nERROR: Relay request failed (HTTP ${relayRes.status})`);
      console.error('Response:', JSON.stringify(responseData, null, 2));
      process.exit(1);
    }

    console.log('\n=== SUCCESS ===');
    console.log('Response:', JSON.stringify(responseData, null, 2));

    if (responseData.txHash) {
      console.log(
        `\nExplorer: https://explorer.dukong.mantrachain.io/tx/${responseData.txHash}`,
      );
    }
  } catch (error) {
    console.error('\nERROR: Request failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
