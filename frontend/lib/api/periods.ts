/**
 * API client functions for period endpoints
 */

import { get, post, put, del } from '../utils/api-client';
import type {
  Period,
  PeriodSummary,
  CreatePeriodRequest,
  UpdatePeriodRequest,
  PreviewCalculationRequest,
  CalculationResult,
} from '../types/period';

/**
 * Create a new period with calculations
 */
export async function createPeriod(
  request: CreatePeriodRequest,
): Promise<PeriodSummary> {
  return post<PeriodSummary>('/api/periods', request);
}

/**
 * List all periods
 */
export async function listPeriods(limit?: number): Promise<Period[]> {
  return get<Period[]>('/api/periods', {
    params: limit ? { limit } : undefined,
  });
}

/**
 * Get a specific period with allocations
 */
export async function getPeriod(
  year: number,
  month: number,
): Promise<PeriodSummary> {
  return get<PeriodSummary>(`/api/periods/${year}/${month}`);
}

/**
 * Update a period and recalculate
 */
export async function updatePeriod(
  year: number,
  month: number,
  request: UpdatePeriodRequest,
): Promise<PeriodSummary> {
  return put<PeriodSummary>(`/api/periods/${year}/${month}`, request);
}

/**
 * Delete a period
 */
export async function deletePeriod(
  year: number,
  month: number,
): Promise<void> {
  return del<void>(`/api/periods/${year}/${month}`);
}

/**
 * Preview calculation without saving
 */
export async function previewCalculation(
  request: PreviewCalculationRequest,
): Promise<CalculationResult> {
  return post<CalculationResult>('/api/calculate/preview', request);
}

/**
 * Get period summary report
 */
export async function getPeriodSummary(
  year: number,
  month: number,
): Promise<PeriodSummary> {
  return get<PeriodSummary>(`/api/periods/${year}/${month}/summary`);
}
