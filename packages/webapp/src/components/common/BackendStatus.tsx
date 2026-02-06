import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBackendHealth } from '@/hooks';

/**
 * Displays the backend relayer connection status
 * Shows a status indicator for whether the backend is reachable
 */
export function BackendStatus() {
  const { data, isLoading, isError } = useBackendHealth();

  if (isLoading) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="ml-2 text-sm text-blue-800">
          Connecting to backend relayer...
        </AlertDescription>
      </Alert>
    );
  }

  if (isError || !data || data.status !== 'ok') {
    return (
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="ml-2 text-sm">
          Backend relayer is offline. Transfers are temporarily unavailable.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="ml-2 text-sm text-green-800">
        Backend relayer connected
      </AlertDescription>
    </Alert>
  );
}
