import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useFeeQuote } from './useFeeQuote';
import * as useAppConfigModule from './useAppConfig';

// Mock useAppConfig
vi.mock('./useAppConfig');

const mockConfig = {
  chainId: 1337,
  backend: {
    url: 'http://localhost:3000/api',
  },
};

describe('useFeeQuote', () => {
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
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    // eslint-disable-next-line prettier/prettier
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch fee quote successfully', async () => {
    const mockQuote = {
      feeAmount: '1000000',
      feeToken: '0x1234567890123456789012345678901234567890',
      deadline: Math.floor(Date.now() / 1000) + 300,
      signature: '0xabcd',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuote,
    });

    const { result } = renderHook(
      () =>
        useFeeQuote(
          '0x1234567890123456789012345678901234567890',
          '1000000000000000000',
          '0xRecipient0000000000000000000000000000001',
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockQuote);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/fees/quote'),
    );
  });

  it('should handle error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Backend error' }),
    });

    const { result } = renderHook(
      () =>
        useFeeQuote(
          '0x1234567890123456789012345678901234567890',
          '1000000000000000000',
          '0xRecipient0000000000000000000000000000001',
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Backend error');
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(
      () =>
        useFeeQuote(
          '0x1234567890123456789012345678901234567890',
          '1000000000000000000',
          '0xRecipient0000000000000000000000000000001',
          undefined,
          false,
        ),
      { wrapper },
    );

    expect(result.current.isFetching).toBe(false);
  });

  it('should not fetch when tokenAddress is undefined', () => {
    const { result } = renderHook(
      () =>
        useFeeQuote(
          undefined,
          '1000000000000000000',
          '0xRecipient0000000000000000000000000000001',
        ),
      { wrapper },
    );

    expect(result.current.isFetching).toBe(false);
  });
});
