/**
 * Hook for fetching list of periods
 */

import { useState, useEffect, useCallback } from 'react';
import { listPeriods } from '../api/periods';
import type { Period } from '../types/period';
import { ApiError } from '../utils/api-client';

interface UsePeriodsState {
  data: Period[];
  loading: boolean;
  error: string | null;
}

interface UsePeriodsReturn extends UsePeriodsState {
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching list of periods
 * @param limit - Optional limit on number of periods to fetch
 * @returns List of periods, loading state, error, and refetch function
 */
export function usePeriods(limit?: number): UsePeriodsReturn {
  const [state, setState] = useState<UsePeriodsState>({
    data: [],
    loading: true,
    error: null,
  });

  const fetchPeriods = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await listPeriods(limit);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to fetch periods';
      setState({ data: [], loading: false, error: errorMessage });
    }
  }, [limit]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  return {
    ...state,
    refetch: fetchPeriods,
  };
}
