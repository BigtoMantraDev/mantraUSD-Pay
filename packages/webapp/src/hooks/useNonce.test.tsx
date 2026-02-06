import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useNonce } from './useNonce';
import * as useAppConfigModule from './useAppConfig';

// Mock useAppConfig
vi.mock('./useAppConfig');

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockConfig = {
  chainId: 5887,
  contracts: {
    delegatedAccount: '0x4e7F587DbDb8424e20E9F7F84d3173fA32F22B4F',
  },
  backend: {
    url: 'http://localhost:3000/api',
  },
};

describe('useNonce', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.spyOn(useAppConfigModule, 'useAppConfig').mockReturnValue(
      mockConfig as ReturnType<typeof useAppConfigModule.useAppConfig>,
    );
    mockFetch.mockReset();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch nonce from backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nonce: '5' }),
    });

    const { result } = renderHook(
      () => useNonce('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(5n);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/nonce/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'),
    );
  });

  it('should not fetch when owner is undefined', () => {
    const { result } = renderHook(() => useNonce(undefined), { wrapper });

    // Query should be disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle backend errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid address' }),
    });

    const { result } = renderHook(
      () => useNonce('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain('Invalid address');
  });
});
