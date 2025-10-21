'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PeriodInput } from '@/lib/types/period';

const periodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  net_income_qb: z.number(),
  ps_addback: z.number(),
  owner_draws: z.number(),
  uncollectible: z.number(),
  bad_debt: z.number(),
  tax_optimization: z.number(),
});

type PeriodFormData = z.infer<typeof periodSchema>;

interface PeriodFormProps {
  initialData?: Partial<PeriodInput>;
  onSubmit: (data: PeriodInput) => void;
  isSubmitting?: boolean;
}

export function PeriodForm({ initialData, onSubmit, isSubmitting = false }: PeriodFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      year: initialData?.year ?? new Date().getFullYear(),
      month: initialData?.month ?? new Date().getMonth() + 1,
      net_income_qb: initialData?.net_income_qb ?? 0,
      ps_addback: initialData?.ps_addback ?? 0,
      owner_draws: initialData?.owner_draws ?? 0,
      uncollectible: initialData?.uncollectible ?? 0,
      bad_debt: initialData?.bad_debt ?? 0,
      tax_optimization: initialData?.tax_optimization ?? 0,
    },
  });

  const handleFormSubmit = (data: PeriodFormData) => {
    onSubmit(data as PeriodInput);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Year and Month */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            id="year"
            type="number"
            {...register('year', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.year && (
            <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700">
            Month
          </label>
          <select
            id="month"
            {...register('month', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          {errors.month && (
            <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>
          )}
        </div>

        {/* Net Income QB */}
        <div>
          <label htmlFor="net_income_qb" className="block text-sm font-medium text-gray-700">
            Net Income (QuickBooks)
          </label>
          <input
            id="net_income_qb"
            type="number"
            step="0.01"
            {...register('net_income_qb', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.net_income_qb && (
            <p className="mt-1 text-sm text-red-600">{errors.net_income_qb.message}</p>
          )}
        </div>

        {/* PS Addback */}
        <div>
          <label htmlFor="ps_addback" className="block text-sm font-medium text-gray-700">
            PS Payout Add-back
          </label>
          <input
            id="ps_addback"
            type="number"
            step="0.01"
            {...register('ps_addback', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.ps_addback && (
            <p className="mt-1 text-sm text-red-600">{errors.ps_addback.message}</p>
          )}
        </div>

        {/* Owner Draws */}
        <div>
          <label htmlFor="owner_draws" className="block text-sm font-medium text-gray-700">
            Owner Draws
          </label>
          <input
            id="owner_draws"
            type="number"
            step="0.01"
            {...register('owner_draws', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.owner_draws && (
            <p className="mt-1 text-sm text-red-600">{errors.owner_draws.message}</p>
          )}
        </div>

        {/* Uncollectible */}
        <div>
          <label htmlFor="uncollectible" className="block text-sm font-medium text-gray-700">
            Uncollectible Income
          </label>
          <input
            id="uncollectible"
            type="number"
            step="0.01"
            {...register('uncollectible', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.uncollectible && (
            <p className="mt-1 text-sm text-red-600">{errors.uncollectible.message}</p>
          )}
        </div>

        {/* Bad Debt */}
        <div>
          <label htmlFor="bad_debt" className="block text-sm font-medium text-gray-700">
            Bad Debt
          </label>
          <input
            id="bad_debt"
            type="number"
            step="0.01"
            {...register('bad_debt', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.bad_debt && (
            <p className="mt-1 text-sm text-red-600">{errors.bad_debt.message}</p>
          )}
        </div>

        {/* Tax Optimization */}
        <div>
          <label htmlFor="tax_optimization" className="block text-sm font-medium text-gray-700">
            Tax Optimization Return
          </label>
          <input
            id="tax_optimization"
            type="number"
            step="0.01"
            {...register('tax_optimization', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.tax_optimization && (
            <p className="mt-1 text-sm text-red-600">{errors.tax_optimization.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Continue to Holders'}
        </button>
      </div>
    </form>
  );
}
