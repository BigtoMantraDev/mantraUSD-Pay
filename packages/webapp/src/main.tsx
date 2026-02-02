import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Initialize AppKit (side effect import - must be first)
import '@/config/wagmi';

import './index.css';
import { routeTree } from './routeTree.gen';

// Conditionally import dev routes - tree-shaken in production
async function createAppRouter() {
  if (import.meta.env.DEV) {
    // Dynamic import ensures tree-shaking in production
    const { devRoutes } = await import('./routes/_dev');
    // Add dev routes as children of the root route
    const routeTreeWithDevRoutes = routeTree.addChildren(devRoutes);
    return createRouter({ routeTree: routeTreeWithDevRoutes });
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
