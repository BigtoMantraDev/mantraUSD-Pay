import { useState, useEffect } from 'react';

/**
 * Hook that tracks a CSS media query match state.
 * Useful for responsive behavior in React components.
 *
 * @param query - CSS media query string
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Update state when match changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Preset breakpoints matching Tailwind CSS defaults.
 * Use these for consistent responsive behavior.
 */
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

/**
 * Hook that returns responsive breakpoint states.
 * Matches Tailwind CSS breakpoints.
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useBreakpoints();
 *
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * ```
 */
export function useBreakpoints() {
  const sm = useMediaQuery(breakpoints.sm);
  const md = useMediaQuery(breakpoints.md);
  const lg = useMediaQuery(breakpoints.lg);
  const xl = useMediaQuery(breakpoints.xl);
  const xxl = useMediaQuery(breakpoints['2xl']);

  return {
    /** Below 640px */
    isMobile: !sm,
    /** 640px - 767px */
    isSmall: sm && !md,
    /** 768px - 1023px */
    isTablet: md && !lg,
    /** 1024px+ */
    isDesktop: lg,
    /** 1280px+ */
    isLarge: xl,
    /** 1536px+ */
    isExtraLarge: xxl,
    /** Raw breakpoint values */
    sm,
    md,
    lg,
    xl,
    '2xl': xxl,
  };
}
