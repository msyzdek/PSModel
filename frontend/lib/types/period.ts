/**
 * Type definitions for period and calculation data
 */

/**
 * Input data for creating or updating a period
 */
export interface PeriodInput {
  year: number;
  month: number;
  net_income_qb: number;
  ps_addback: number;
  owner_draws: number;
  uncollectible?: number;
  bad_debt?: number;
  tax_optimization?: number;
}

/**
 * Input data for a holder allocation
 */
export interface HolderInput {
  holder_name: string;
  shares: number;
  personal_charges: number;
}

/**
 * Holder allocation result from calculation
 */
export interface HolderAllocation {
  holder_name: string;
  shares: number;
  gross_allocation: number;
  personal_charges: number;
  carry_forward_in: number;
  net_payout: number;
  carry_forward_out: number;
  received_rounding_adjustment: boolean;
}

/**
 * Period data with calculated results
 */
export interface Period {
  id: number;
  year: number;
  month: number;
  net_income_qb: number;
  ps_addback: number;
  owner_draws: number;
  uncollectible: number;
  bad_debt: number;
  tax_optimization: number;
  adjusted_pool: number;
  total_shares: number;
  rounding_delta: number;
  created_at: string;
  updated_at: string;
}

/**
 * Complete calculation result including period and allocations
 */
export interface CalculationResult {
  period: {
    year: number;
    month: number;
    adjusted_pool: number;
    total_shares: number;
    rounding_delta: number;
  };
  allocations: HolderAllocation[];
}

/**
 * Period summary with full details
 */
export interface PeriodSummary {
  period: Period;
  allocations: HolderAllocation[];
}

/**
 * Request body for creating a period
 */
export interface CreatePeriodRequest {
  period: PeriodInput;
  holders: HolderInput[];
}

/**
 * Request body for updating a period
 */
export interface UpdatePeriodRequest {
  period: PeriodInput;
  holders: HolderInput[];
}

/**
 * Request body for preview calculation
 */
export interface PreviewCalculationRequest {
  period: PeriodInput;
  holders: HolderInput[];
}
