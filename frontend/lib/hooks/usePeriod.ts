/**
 * Hook for fetching a single period with allocations
 */

import { useState, useEffect, useCallback } from 'react';
import { getPeriod } from '../api/periods';
import type { PeriodSummary } from '../types/period';
import { ApiError } from '../utils/api-client';

interface UsePeriodState {
  data: PeriodSummary | null;
  loading: boolean;
  error: string | null;
}

interface UsePeriodReturn extends UsePeriodState {
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching period data
 * @param year - The year of the period
 * @param month - The month of the period (1-12)
 * @returns Period data, loading state, error, and refetch function
 */
export function usePeriod(year: number, month: number): UsePeriodReturn {
  const [state, setState] = useState<UsePeriodState>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchPeriod = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await getPeriod(year, month);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to fetch period data';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [year, month]);

  useEffect(() => {
    fetchPeriod();
  }, [fetchPeriod]);

  return {
    ...state,
    refetch: fetchPeriod,
  };
}
