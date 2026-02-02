/**
 * Enhanced error handling utilities for better user experience
 */

export interface EnhancedError {
  title: string;
  message: string;
  suggestion?: string;
  isRetryable: boolean;
}

/**
 * Parse error and provide user-friendly messages with suggestions
 */
export const parseTransferError = (error: unknown): EnhancedError => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network connection errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the blockchain network.',
      suggestion: 'Please check your internet connection and try again.',
      isRetryable: true,
    };
  }

  // Insufficient funds
  if (
    lowerMessage.includes('insufficient') ||
    lowerMessage.includes('not enough')
  ) {
    return {
      title: 'Insufficient Balance',
      message: "You don't have enough OM to complete this transfer.",
      suggestion: 'Please reduce the amount or add more OM to your wallet.',
      isRetryable: false,
    };
  }

  // Wallet connection issues
  if (
    lowerMessage.includes('wallet') ||
    lowerMessage.includes('not connected')
  ) {
    return {
      title: 'Wallet Connection Issue',
      message: 'Your wallet connection was lost or is unavailable.',
      suggestion: 'Please reconnect your wallet and try again.',
      isRetryable: true,
    };
  }

  // Address conversion errors
  if (lowerMessage.includes('address') || lowerMessage.includes('bech32')) {
    return {
      title: 'Address Conversion Error',
      message: 'Unable to convert your EVM address to the required format.',
      suggestion: 'Please disconnect and reconnect your EVM wallet.',
      isRetryable: true,
    };
  }

  // Transaction rejected/cancelled
  if (lowerMessage.includes('rejected') || lowerMessage.includes('cancelled')) {
    return {
      title: 'Transaction Cancelled',
      message: 'The transaction was cancelled in your wallet.',
      suggestion: 'Please try again and approve the transaction.',
      isRetryable: true,
    };
  }

  // Gas/fee related errors
  if (lowerMessage.includes('gas') || lowerMessage.includes('fee')) {
    return {
      title: 'Transaction Fee Error',
      message: 'Unable to estimate or pay transaction fees.',
      suggestion: 'Please ensure you have enough OM for transaction fees.',
      isRetryable: true,
    };
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      title: 'Transaction Timeout',
      message: 'The transaction took too long to process.',
      suggestion: 'The network may be congested. Please try again later.',
      isRetryable: true,
    };
  }

  // Generic blockchain/RPC errors
  if (lowerMessage.includes('rpc') || lowerMessage.includes('node')) {
    return {
      title: 'Blockchain Node Error',
      message: 'Unable to communicate with the blockchain.',
      suggestion:
        'The network may be temporarily unavailable. Please try again.',
      isRetryable: true,
    };
  }

  // Default fallback
  return {
    title: 'Transfer Failed',
    message:
      errorMessage || 'An unexpected error occurred during the transfer.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    isRetryable: true,
  };
};

const removeNoiseFromMessage = (message: string) => {
  if (!message) return '';

  const firstLine = message.split('\n')[0] ?? message;

  return firstLine
    .replace(/^error:\s*/i, '')
    .replace(/execution reverted(?: with reason)?:\s*/i, '')
    .replace(/\(error=.*?\)/i, '')
    .replace(/\(version.*?\)/i, '')
    .trim();
};

const toErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const withShortMessage = error as Error & { shortMessage?: string };

    if (typeof withShortMessage.shortMessage === 'string') {
      return withShortMessage.shortMessage;
    }

    if (error.message) {
      return error.message;
    }

    if ('cause' in error) {
      return toErrorMessage((error as { cause?: unknown }).cause);
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'reason' in error &&
    typeof (error as { reason?: unknown }).reason === 'string'
  ) {
    return (error as { reason: string }).reason;
  }

  return undefined;
};

export const extractContractErrorMessage = (
  error: unknown,
  fallback = 'Transaction failed.',
) => {
  const message = toErrorMessage(error);
  const cleaned = removeNoiseFromMessage(message ?? '') || fallback;

  return cleaned;
};

/**
 * Parse wallet connection errors
 */
export const parseWalletError = (error: unknown): EnhancedError => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('rejected') || lowerMessage.includes('denied')) {
    return {
      title: 'Connection Rejected',
      message: 'Wallet connection was rejected.',
      suggestion: 'Please try connecting again and approve the request.',
      isRetryable: true,
    };
  }

  if (
    lowerMessage.includes('not installed') ||
    lowerMessage.includes('not found')
  ) {
    return {
      title: 'Wallet Not Found',
      message: 'The requested wallet is not installed.',
      suggestion:
        'Please install the wallet extension or try a different wallet.',
      isRetryable: false,
    };
  }

  if (lowerMessage.includes('locked')) {
    return {
      title: 'Wallet Locked',
      message: 'Your wallet is locked.',
      suggestion: 'Please unlock your wallet and try again.',
      isRetryable: true,
    };
  }

  return {
    title: 'Wallet Connection Failed',
    message: errorMessage || 'Unable to connect to your wallet.',
    suggestion: 'Please ensure your wallet is available and try again.',
    isRetryable: true,
  };
};
