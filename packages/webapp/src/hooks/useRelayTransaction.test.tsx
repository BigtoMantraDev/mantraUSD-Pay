import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as useAppConfigModule from './useAppConfig';
import { useRelayTransaction, type RelayRequest } from './useRelayTransaction';

// Mock useAppConfig
vi.mock('./useAppConfig');

const mockConfig = {
  chainId: 5887,
  backend: {
    url: 'http://localhost:3000/api',
  },
};

describe('useRelayTransaction', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.spyOn(useAppConfigModule, 'useAppConfig').mockReturnValue(
      mockConfig as ReturnType<typeof useAppConfigModule.useAppConfig>,
    );
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockRequest: RelayRequest = {
    executeData: {
      owner: '0x1234567890123456789012345678901234567890',
      token: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      amount: BigInt('1000000000000000000'),
      to: '0x9999999999999999999999999999999999999999',
      feeAmount: BigInt('1000000'),
      feeToken: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      deadline: BigInt(Math.floor(Date.now() / 1000) + 300),
      nonce: BigInt(0),
    },
    ownerSignature: '0xownerabcd',
    feeSignature: '0xfeeabcd',
  };

  it('should relay transaction successfully', async () => {
    const mockResponse = {
      txHash: '0xtxhash123',
      status: 'pending' as const,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useRelayTransaction(), { wrapper });

    result.current.mutate(mockRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/relay',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('should handle error response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid signature' }),
    });

    const { result } = renderHook(() => useRelayTransaction(), { wrapper });

    result.current.mutate(mockRequest);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Invalid signature');
  });

  it('should not retry on failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Error' }),
    });

    const { result } = renderHook(() => useRelayTransaction(), { wrapper });

    result.current.mutate(mockRequest);

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should only be called once (no retries)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
