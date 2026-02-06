import { useCallback, useState } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import type { Address } from 'viem';

import { useAppConfig } from './useAppConfig';
import { useLocalStorage } from './useLocalStorage';

/**
 * EIP-7702 Authorization structure
 * This is signed by the user to delegate their EOA to the DelegatedAccount contract
 */
export interface SignedAuthorization {
  /** Chain ID for the authorization */
  chainId: number;
  /** Contract address to delegate to */
  contractAddress: Address;
  /** Authorization nonce (different from intent nonce) */
  nonce: string;
  /** Signature r component */
  r: `0x${string}`;
  /** Signature s component */
  s: `0x${string}`;
  /** Signature yParity (0 or 1) */
  yParity: number;
}

/**
 * Result of attempting to get authorization
 * Authorization may be null if wallet doesn't support EIP-7702
 */
export interface AuthorizationResult {
  /** The signed authorization, or null if not supported/available */
  authorization: SignedAuthorization | null;
  /** Whether the wallet supports EIP-7702 authorization signing */
  supported: boolean;
  /** Error message if signing failed for a reason other than unsupported */
  error?: string;
}

/**
 * Stored authorization with metadata
 */
interface StoredAuthorization {
  authorization: SignedAuthorization;
  /** Timestamp when stored */
  timestamp: number;
  /** Address that signed */
  signer: Address;
}

/**
 * Stored info about wallet support
 */
interface WalletSupportInfo {
  /** Whether EIP-7702 signing is supported */
  supported: boolean;
  /** Timestamp when checked */
  timestamp: number;
  /** Wallet/connector identifier */
  connectorId?: string;
}

const AUTHORIZATION_STORAGE_KEY = 'eip7702-authorization';
const WALLET_SUPPORT_KEY = 'eip7702-wallet-support';
const AUTHORIZATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours session
const SUPPORT_CHECK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // Cache support check for 7 days

/**
 * Check if an error indicates the wallet doesn't support EIP-7702
 */
function isUnsupportedWalletError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('json-rpc') ||
    message.includes('not supported') ||
    message.includes('account type') ||
    message.includes('unsupported') ||
    message.includes('signauthorization')
  );
}

/**
 * Hook to sign EIP-7702 authorization for delegating EOA to DelegatedAccount
 *
 * Per-session authorization: Signs once and caches for the session.
 * The authorization allows the user's EOA to temporarily behave as the
 * DelegatedAccount contract when included in a Type 4 transaction.
 *
 * NOTE: Most browser wallets (MetaMask, WalletConnect) don't yet support
 * EIP-7702 authorization signing. This hook handles unsupported wallets
 * gracefully by returning { authorization: null, supported: false }.
 *
 * @example
 * const { getOrSignAuthorization, isSupported, isLoading } = useSignAuthorization();
 *
 * // Get cached authorization or sign a new one
 * const result = await getOrSignAuthorization();
 * if (!result.supported) {
 *   // Wallet doesn't support EIP-7702, proceed without authorization
 * }
 */
export function useSignAuthorization() {
  const { address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const config = useAppConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Per-session storage for authorization
  const [storedAuth, setStoredAuth] = useLocalStorage<StoredAuthorization | null>(
    AUTHORIZATION_STORAGE_KEY,
    null,
  );

  // Cache whether wallet supports EIP-7702
  const [walletSupport, setWalletSupport] = useLocalStorage<WalletSupportInfo | null>(
    WALLET_SUPPORT_KEY,
    null,
  );

  /**
   * Check if current wallet is known to support EIP-7702
   * Returns: true = supported, false = not supported, undefined = unknown
   */
  const getKnownSupport = useCallback((): boolean | undefined => {
    if (!walletSupport || !connector) return undefined;

    // Check if this is for the same connector
    if (walletSupport.connectorId !== connector.id) return undefined;

    // Check TTL
    const now = Date.now();
    if (now - walletSupport.timestamp > SUPPORT_CHECK_TTL_MS) return undefined;

    return walletSupport.supported;
  }, [walletSupport, connector]);

  /**
   * Check if we have a valid cached authorization for the current user
   */
  const getCachedAuthorization = useCallback((): SignedAuthorization | null => {
    if (!storedAuth || !address) return null;

    // Validate signer matches current user
    if (storedAuth.signer.toLowerCase() !== address.toLowerCase()) {
      return null;
    }

    // Validate chain ID matches
    if (storedAuth.authorization.chainId !== config.chainId) {
      return null;
    }

    // Validate TTL
    const now = Date.now();
    if (now - storedAuth.timestamp > AUTHORIZATION_TTL_MS) {
      return null;
    }

    return storedAuth.authorization;
  }, [storedAuth, address, config.chainId]);

  /**
   * Try to sign a new EIP-7702 authorization
   * Returns null if wallet doesn't support it
   */
  const trySignAuthorization = useCallback(async (): Promise<AuthorizationResult> => {
    if (!walletClient) {
      return { authorization: null, supported: false, error: 'Wallet not connected' };
    }

    if (!address) {
      return { authorization: null, supported: false, error: 'No account connected' };
    }

    // Check if we already know this wallet doesn't support EIP-7702
    const knownSupport = getKnownSupport();
    if (knownSupport === false) {
      return { authorization: null, supported: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sign authorization using viem's EIP-7702 method
      // This signs: keccak256(0x05 || rlp([chain_id, address, nonce]))
      const signedAuth = await walletClient.signAuthorization({
        contractAddress: config.contracts.delegatedAccount,
      });

      // Mark this wallet as supporting EIP-7702
      setWalletSupport({
        supported: true,
        timestamp: Date.now(),
        connectorId: connector?.id,
      });

      // Convert to our format - viem returns 'address' but we use 'contractAddress'
      // Handle both yParity and v (viem may return either depending on version)
      const yParity =
        signedAuth.yParity !== undefined
          ? signedAuth.yParity
          : signedAuth.v !== undefined
            ? Number(signedAuth.v) % 2
            : 0;

      const authorization: SignedAuthorization = {
        chainId: signedAuth.chainId,
        contractAddress:
          signedAuth.address ?? (signedAuth as unknown as { contractAddress: Address }).contractAddress,
        nonce: signedAuth.nonce.toString(),
        r: signedAuth.r,
        s: signedAuth.s,
        yParity,
      };

      // Cache for session
      setStoredAuth({
        authorization,
        timestamp: Date.now(),
        signer: address,
      });

      return { authorization, supported: true };
    } catch (err) {
      // Check if this is an "unsupported wallet" error
      if (isUnsupportedWalletError(err)) {
        console.warn(
          '[EIP-7702] Wallet does not support signAuthorization. ' +
            'Proceeding without authorization - backend will handle delegation.',
        );

        // Cache that this wallet doesn't support EIP-7702
        setWalletSupport({
          supported: false,
          timestamp: Date.now(),
          connectorId: connector?.id,
        });

        return { authorization: null, supported: false };
      }

      // Other error - user rejected, network issue, etc.
      const error = err instanceof Error ? err : new Error('Failed to sign authorization');
      setError(error);
      return { authorization: null, supported: true, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, config.contracts.delegatedAccount, setStoredAuth, setWalletSupport, connector, getKnownSupport]);

  /**
   * Get authorization - returns cached if available, otherwise tries to sign
   * Handles unsupported wallets gracefully
   */
  const getOrSignAuthorization = useCallback(async (): Promise<AuthorizationResult> => {
    // Check cache first
    const cached = getCachedAuthorization();
    if (cached) {
      return { authorization: cached, supported: true };
    }

    // Check if we know this wallet doesn't support EIP-7702
    const knownSupport = getKnownSupport();
    if (knownSupport === false) {
      return { authorization: null, supported: false };
    }

    // Try to sign a new authorization
    return trySignAuthorization();
  }, [getCachedAuthorization, getKnownSupport, trySignAuthorization]);

  /**
   * Clear cached authorization (e.g., on disconnect or error)
   */
  const clearAuthorization = useCallback(() => {
    setStoredAuth(null);
  }, [setStoredAuth]);

  /**
   * Clear support cache (e.g., to retry with a different wallet)
   */
  const clearSupportCache = useCallback(() => {
    setWalletSupport(null);
  }, [setWalletSupport]);

  /**
   * Whether we know this wallet supports EIP-7702
   * undefined = unknown (not tested yet)
   */
  const isSupported = getKnownSupport();

  /**
   * Check if authorization is needed (no valid cache and wallet might support it)
   */
  const needsAuthorization = getCachedAuthorization() === null && isSupported !== false;

  return {
    /** Try to sign or get cached authorization - handles unsupported wallets */
    getOrSignAuthorization,
    /** Get cached authorization without triggering a sign */
    getCachedAuthorization,
    /** Clear cached authorization */
    clearAuthorization,
    /** Clear wallet support cache (to retry) */
    clearSupportCache,
    /** Whether authorization is needed */
    needsAuthorization,
    /** Whether wallet is known to support EIP-7702 (undefined = unknown) */
    isSupported,
    /** Loading state */
    isLoading,
    /** Last error */
    error,
  };
}
