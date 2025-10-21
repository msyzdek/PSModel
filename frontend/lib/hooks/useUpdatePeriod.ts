/**
 * Hook for updating an existing period
 */

import { useState, useCallback } from 'react';
import { updatePeriod } from '../api/periods';
import type { UpdatePeriodRequest, PeriodSummary } from '../types/period';
import { ApiError } from '../utils/api-client';

interface UseUpdatePeriodState {
  data: PeriodSummary | null;
  loading: boolean;
  error: string | null;
}

interface UseUpdatePeriodReturn extends UseUpdatePeriodState {
  mutate: (
    year: number,
    month: number,
    request: UpdatePeriodRequest,
  ) => Promise<PeriodSummary | null>;
  reset: () => void;
}

/**
 * Custom hook for updating an existing period
 * @returns Mutation function, data, loading state, error, and reset function
 */
export function useUpdatePeriod(): UseUpdatePeriodReturn {
  const [state, setState] = useState<UseUpdatePeriodState>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (
      year: number,
      month: number,
      request: UpdatePeriodRequest,
    ): Promise<PeriodSummary | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const data = await updatePeriod(year, month, request);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : 'Failed to update period';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
