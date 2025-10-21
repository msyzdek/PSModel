/**
 * Hook for creating a new period
 */

import { useState, useCallback } from 'react';
import { createPeriod } from '../api/periods';
import type { CreatePeriodRequest, PeriodSummary } from '../types/period';
import { ApiError } from '../utils/api-client';

interface UseCreatePeriodState {
  data: PeriodSummary | null;
  loading: boolean;
  error: string | null;
}

interface UseCreatePeriodReturn extends UseCreatePeriodState {
  mutate: (request: CreatePeriodRequest) => Promise<PeriodSummary | null>;
  reset: () => void;
}

/**
 * Custom hook for creating a new period
 * @returns Mutation function, data, loading state, error, and reset function
 */
export function useCreatePeriod(): UseCreatePeriodReturn {
  const [state, setState] = useState<UseCreatePeriodState>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (request: CreatePeriodRequest): Promise<PeriodSummary | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const data = await createPeriod(request);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : 'Failed to create period';
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
