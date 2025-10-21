/**
 * Type definitions for holder management
 */

/**
 * Holder entity from the backend
 */
export interface Holder {
  id: number;
  name: string;
  default_shares: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Form data for creating or updating a holder
 */
export interface HolderFormData {
  name: string;
  default_shares: number | null;
}

/**
 * Holder with participation statistics
 */
export interface HolderWithStats extends Holder {
  total_periods: number;
  first_period: string | null;
  last_period: string | null;
  total_payout: number;
}

/**
 * Request body for creating a holder
 */
export interface CreateHolderRequest {
  name: string;
  default_shares?: number | null;
}

/**
 * Request body for updating a holder
 */
export interface UpdateHolderRequest {
  name?: string;
  default_shares?: number | null;
}
