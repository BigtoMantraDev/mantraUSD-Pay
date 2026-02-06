import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Initialize AppKit (side effect import - must be first)
import '@/config/wagmi';

import './index.css';
import { routeTree } from './routeTree.gen';

// Create router - TanStack Router plugin handles all file-based routes
async function createAppRouter() {
  // Dev routes (_dev/*) are excluded from auto-generation via routeFileIgnorePattern
  // and manually registered below when in development mode
  if (import.meta.env.DEV) {
    const { devRoutes } = await import('./routes/_dev');
    const router = createRouter({ routeTree });
    // Register dev routes as additional children
    devRoutes.forEach((route) => {
      router.routeTree.addChildren([route]);
    });
    return router;
  }
  return createRouter({ routeTree });
}

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter<typeof routeTree>>;
  }
}

// Render the app
createAppRouter().then((router) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
