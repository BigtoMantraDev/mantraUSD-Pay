/**
 * Dev-only routes module.
 * These routes are conditionally imported only in development mode
 * and will be tree-shaken out of production builds.
 */
import type { AnyRoute } from '@tanstack/react-router';

import { devtoolsRoute } from './devtools';
import { kitchenSinkRoute } from './kitchen-sink';

export const devRoutes: AnyRoute[] = [devtoolsRoute, kitchenSinkRoute];
