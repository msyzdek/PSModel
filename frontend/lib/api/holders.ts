/**
 * API client functions for holder endpoints
 */

import { get, post, put, del } from '../utils/api-client';
import type {
  Holder,
  HolderWithStats,
  CreateHolderRequest,
  UpdateHolderRequest,
} from '../types/holder';

/**
 * Create a new holder
 */
export async function createHolder(
  request: CreateHolderRequest,
): Promise<Holder> {
  return post<Holder>('/api/holders', request);
}

/**
 * List all holders
 * @param activeOnly - If true, only return active holders (default: true)
 */
export async function getHolders(activeOnly: boolean = true): Promise<Holder[]> {
  return get<Holder[]>('/api/holders', {
    params: { active_only: activeOnly },
  });
}

/**
 * Get a specific holder by ID
 */
export async function getHolder(id: number): Promise<Holder> {
  return get<Holder>(`/api/holders/${id}`);
}

/**
 * Get a specific holder with participation statistics
 */
export async function getHolderWithStats(id: number): Promise<HolderWithStats> {
  return get<HolderWithStats>(`/api/holders/${id}/stats`);
}

/**
 * Update a holder
 */
export async function updateHolder(
  id: number,
  request: UpdateHolderRequest,
): Promise<Holder> {
  return put<Holder>(`/api/holders/${id}`, request);
}

/**
 * Deactivate a holder (soft delete)
 * This will fail if the holder has existing allocations
 */
export async function deactivateHolder(id: number): Promise<void> {
  return del<void>(`/api/holders/${id}`);
}
