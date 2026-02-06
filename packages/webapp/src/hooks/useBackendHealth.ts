import { useQuery } from '@tanstack/react-query';

import { useAppConfig } from './useAppConfig';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp?: number;
  version?: string;
}

/**
 * Hook to check backend relayer health status
 * Polls the /api/health endpoint to verify backend connectivity
 */
export function useBackendHealth() {
  const config = useAppConfig();
  const backendUrl = config.backend.url;

  return useQuery<HealthResponse>({
    queryKey: ['backend-health', backendUrl],
    queryFn: async () => {
      const response = await fetch(`${backendUrl}/health`);
      if (!response.ok) {
        throw new Error('Backend health check failed');
      }
      return response.json();
    },
    // Poll every 30 seconds to keep status updated
    refetchInterval: 30_000,
    // Retry failed checks quickly
    retry: 1,
    retryDelay: 2_000,
    // Consider stale after 15 seconds
    staleTime: 15_000,
  });
}
