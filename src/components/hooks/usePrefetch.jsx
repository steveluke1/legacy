
import { useEffect } from 'react';

/**
 * Prefetch hook - DISABLED to prevent console noise.
 * Prefetching is an optimization, not a requirement.
 * Data will be fetched on-demand via functions when needed.
 */
export function usePrefetchCommonPages() {
  useEffect(() => {
    // Prefetch disabled - all data fetched via backend functions on-demand
  }, []);
}
