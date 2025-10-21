/**
 * Holder Management Page
 * 
 * This page provides a complete interface for managing holders in the profit share system.
 * 
 * Features:
 * - List all active holders in a table
 * - Create new holders with name and default shares
 * - Edit existing holder information
 * - Deactivate holders (soft delete with confirmation)
 * - Loading states and error handling
 * - Success/error toast notifications
 * 
 * Dependencies:
 * - HolderList component (task 10) ✓
 * - HolderForm component (task 9) ✓
 * - Holder types (task 8) - temporarily defined inline
 * - Holder API client (task 8) - temporarily implemented inline
 * - Holder API endpoints (task 7) - required for full functionality
 * 
 * Note: Temporary implementations will be replaced with proper imports once tasks 6-8 are complete.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { HolderList, HolderForm } from '@/components/features';
import { Button, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useToast } from '@/lib/contexts/ToastContext';

// Import types from lib (task 8 complete for types, API client still temporary)
import type { Holder, HolderFormData } from '@/lib/types/holder';

// Temporary API client functions (will be imported from lib/api/holders.ts once task 8 is complete)
const holdersApi = {
  async getHolders(activeOnly: boolean = true): Promise<Holder[]> {
    const params = new URLSearchParams();
    params.append('active_only', activeOnly.toString());
    
    const response = await fetch(`/api/holders?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch holders');
    }
    return response.json();
  },

  async createHolder(data: HolderFormData): Promise<Holder> {
    const response = await fetch('/api/holders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        default_shares: data.default_shares,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create holder');
    }
    return response.json();
  },

  async updateHolder(id: number, data: HolderFormData): Promise<Holder> {
    const response = await fetch(`/api/holders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        default_shares: data.default_shares,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update holder');
    }
    return response.json();
  },

  async deactivateHolder(id: number): Promise<void> {
    const response = await fetch(`/api/holders/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to deactivate holder');
    }
  },
};

// HolderForm component is now imported from components/features (task 9 complete)

export default function HoldersPage() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHolder, setEditingHolder] = useState<Holder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadHolders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await holdersApi.getHolders(true);
      setHolders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load holders';
      setError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadHolders();
  }, [loadHolders]);

  const handleNewHolder = () => {
    setEditingHolder(null);
    setShowModal(true);
  };

  const handleEdit = (holder: Holder) => {
    setEditingHolder(holder);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHolder(null);
  };

  const handleSubmit = async (data: HolderFormData) => {
    try {
      setIsSubmitting(true);
      if (editingHolder) {
        await holdersApi.updateHolder(editingHolder.id, data);
        showSuccess(`Holder "${data.name}" updated successfully`);
      } else {
        await holdersApi.createHolder(data);
        showSuccess(`Holder "${data.name}" created successfully`);
      }
      handleCloseModal();
      await loadHolders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      showError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (holderId: number) => {
    try {
      await holdersApi.deactivateHolder(holderId);
      const holder = holders.find((h) => h.id === holderId);
      showSuccess(`Holder "${holder?.name}" deactivated successfully`);
      await loadHolders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate holder';
      showError(message);
    }
  };

  const handleRetry = () => {
    loadHolders();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holders</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage the master list of holders for profit share calculations
          </p>
        </div>
        <Button onClick={handleNewHolder} disabled={isLoading}>
          + New Holder
        </Button>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="mb-6">
          <ErrorMessage message={error} />
          <div className="mt-4">
            <Button onClick={handleRetry} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Holder List */}
      {!isLoading && !error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <HolderList holders={holders} onEdit={handleEdit} onDeactivate={handleDeactivate} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {editingHolder ? 'Edit Holder' : 'New Holder'}
                </h3>
              </div>
              <HolderForm
                holder={editingHolder || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCloseModal}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
