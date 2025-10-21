'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PeriodForm } from '@/components/features/PeriodForm';
import { HolderAllocationForm } from '@/components/features/HolderAllocationForm';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useCreatePeriod } from '@/lib/hooks/useCreatePeriod';
import type { PeriodInput, HolderInput } from '@/lib/types/period';

type Step = 'period' | 'holders';

export default function NewPeriodPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('period');
  const [periodData, setPeriodData] = useState<PeriodInput | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutate: createPeriod, loading: creating, error: createError } = useCreatePeriod();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePeriodSubmit = (data: PeriodInput) => {
    setPeriodData(data);
    setStep('holders');
  };

  const handleHoldersSubmit = async (holders: HolderInput[]) => {
    if (!periodData) return;

    try {
      const result = await createPeriod({
        period: periodData,
        holders,
      });
      if (result) {
        setSuccessMessage('Period created successfully!');
        setTimeout(() => {
          router.push(`/period/${result.period.year}/${result.period.month}/summary`);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to create period:', err);
    }
  };

  const handleBack = () => {
    setStep('period');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Period</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter period data and holder allocations to calculate profit share
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {createError && (
        <div className="mb-6">
          <ErrorMessage message={createError} />
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            <li className="relative pr-8 sm:pr-20">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div
                  className={`h-0.5 w-full ${
                    step === 'holders' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              </div>
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  step === 'period' || step === 'holders'
                    ? 'bg-blue-600'
                    : 'bg-white border-2 border-gray-300'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    step === 'period' || step === 'holders' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  1
                </span>
              </div>
              <span className="absolute top-10 left-0 text-xs font-medium text-gray-500">
                Period Data
              </span>
            </li>
            <li className="relative">
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  step === 'holders' ? 'bg-blue-600' : 'bg-white border-2 border-gray-300'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    step === 'holders' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  2
                </span>
              </div>
              <span className="absolute top-10 left-0 text-xs font-medium text-gray-500">
                Holders
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {step === 'period' && (
          <PeriodForm initialData={periodData ?? undefined} onSubmit={handlePeriodSubmit} />
        )}

        {step === 'holders' && periodData && (
          <HolderAllocationForm
            onSubmit={handleHoldersSubmit}
            isSubmitting={creating}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
