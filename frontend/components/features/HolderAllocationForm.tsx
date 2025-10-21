'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HolderInput } from '@/lib/types/period';

const holderSchema = z.object({
  holder_name: z.string().min(1, 'Holder name is required'),
  shares: z.number().int().positive('Shares must be positive'),
  personal_charges: z.number().min(0, 'Personal charges must be non-negative'),
});

const holdersFormSchema = z.object({
  holders: z.array(holderSchema).min(1, 'At least one holder is required'),
});

type HoldersFormData = z.infer<typeof holdersFormSchema>;

interface HolderAllocationFormProps {
  initialData?: HolderInput[];
  onSubmit: (holders: HolderInput[]) => void;
  isSubmitting?: boolean;
  onBack?: () => void;
}

export function HolderAllocationForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  onBack,
}: HolderAllocationFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HoldersFormData>({
    resolver: zodResolver(holdersFormSchema),
    defaultValues: {
      holders:
        initialData && initialData.length > 0
          ? initialData
          : [{ holder_name: '', shares: 0, personal_charges: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'holders',
  });

  const handleFormSubmit = (data: HoldersFormData) => {
    onSubmit(data.holders);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Holder Allocations</h3>
          <button
            type="button"
            onClick={() => append({ holder_name: '', shares: 0, personal_charges: 0 })}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Add Holder
          </button>
        </div>

        {errors.holders?.root && (
          <p className="text-sm text-red-600">{errors.holders.root.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-gray-700">Holder {index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor={`holders.${index}.holder_name`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Holder Name
                  </label>
                  <input
                    id={`holders.${index}.holder_name`}
                    type="text"
                    {...register(`holders.${index}.holder_name`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.holders?.[index]?.holder_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.holders[index]?.holder_name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`holders.${index}.shares`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Shares
                  </label>
                  <input
                    id={`holders.${index}.shares`}
                    type="number"
                    {...register(`holders.${index}.shares`, { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.holders?.[index]?.shares && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.holders[index]?.shares?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`holders.${index}.personal_charges`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Personal Charges
                  </label>
                  <input
                    id={`holders.${index}.personal_charges`}
                    type="number"
                    step="0.01"
                    {...register(`holders.${index}.personal_charges`, { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.holders?.[index]?.personal_charges && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.holders[index]?.personal_charges?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isSubmitting ? 'Calculating...' : 'Calculate'}
        </button>
      </div>
    </form>
  );
}
