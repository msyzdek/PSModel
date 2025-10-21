'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { Holder } from '@/lib/types/holder';

interface HolderListProps {
  holders: Holder[];
  onEdit: (holder: Holder) => void;
  onDeactivate: (holderId: number) => void;
  isLoading?: boolean;
}

export function HolderList({
  holders,
  onEdit,
  onDeactivate,
  isLoading = false,
}: HolderListProps) {
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [holderToDeactivate, setHolderToDeactivate] = useState<Holder | null>(null);

  const handleDeactivateClick = (holder: Holder) => {
    setHolderToDeactivate(holder);
    setShowConfirmDialog(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!holderToDeactivate) return;

    setDeactivatingId(holderToDeactivate.id);
    try {
      await onDeactivate(holderToDeactivate.id);
      setShowConfirmDialog(false);
      setHolderToDeactivate(null);
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleCancelDeactivate = () => {
    setShowConfirmDialog(false);
    setHolderToDeactivate(null);
  };

  // Empty state
  if (!isLoading && holders.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No holders</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new holder.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Default Shares
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading holders...
                </td>
              </tr>
            ) : (
              holders.map((holder) => (
                <tr key={holder.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {holder.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {holder.default_shares ?? '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        holder.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {holder.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(holder)}
                        disabled={deactivatingId === holder.id}
                      >
                        Edit
                      </Button>
                      {holder.is_active && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeactivateClick(holder)}
                          isLoading={deactivatingId === holder.id}
                          disabled={deactivatingId === holder.id}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && holderToDeactivate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCancelDeactivate}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Deactivate Holder
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to deactivate{' '}
                      <span className="font-semibold">{holderToDeactivate.name}</span>?
                      This holder will no longer appear in new period creation, but
                      historical data will be preserved.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                <Button
                  variant="danger"
                  onClick={handleConfirmDeactivate}
                  isLoading={deactivatingId === holderToDeactivate.id}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelDeactivate}
                  disabled={deactivatingId === holderToDeactivate.id}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
