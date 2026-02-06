// Hooks barrel export
export { useAppConfig } from './useAppConfig';
export type { AppConfig } from './useAppConfig';

export { useBackendHealth } from './useBackendHealth';

export { useToast, toast } from './use-toast';

export { useTransactionFlow } from './useTransactionFlow';
export type {
  TransactionStatus,
  TransactionFlowState,
  UseTransactionFlowOptions,
  UseTransactionFlowReturn,
} from './useTransactionFlow';

export { useTokenBalance } from './useTokenBalance';
export type {
  UseTokenBalanceOptions,
  UseTokenBalanceReturn,
} from './useTokenBalance';

export { useTokenAllowance } from './useTokenAllowance';
export type {
  UseTokenAllowanceOptions,
  UseTokenAllowanceReturn,
} from './useTokenAllowance';

export { useDebounce, useDebouncedCallback } from './useDebounce';

export { useLocalStorage } from './useLocalStorage';

export { useMediaQuery, useBreakpoints, breakpoints } from './useMediaQuery';

// Backend Integration Hooks
export { useFeeQuote } from './useFeeQuote';
export type { FeeQuote } from './useFeeQuote';

export { useNonce } from './useNonce';

export { useRelayTransaction } from './useRelayTransaction';
export type {
  ExecuteData,
  RelayRequest,
  RelayResponse,
} from './useRelayTransaction';

export { useEIP712Sign, encodeSignature } from './useEIP712Sign';

// EIP-7702 Authorization Hook
export { useSignAuthorization } from './useSignAuthorization';
export type {
  SignedAuthorization,
  AuthorizationResult,
} from './useSignAuthorization';
