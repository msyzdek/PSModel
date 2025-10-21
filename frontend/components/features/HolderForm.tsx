'use client';

import { useState, FormEvent } from 'react';
import { Button, ErrorMessage } from '@/components/ui';
import type { Holder, HolderFormData } from '@/lib/types/holder';

interface HolderFormProps {
  holder?: Holder;
  onSubmit: (data: HolderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HolderForm({
  holder,
  onSubmit,
  onCancel,
  isLoading = false,
}: HolderFormProps) {
  const [name, setName] = useState(holder?.name ?? '');
  const [defaultShares, setDefaultShares] = useState<string>(
    holder?.default_shares?.toString() ?? '',
  );
  const [errors, setErrors] = useState<{
    name?: string;
    defaultShares?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Holder name is required';
    } else if (trimmedName.length > 255) {
      newErrors.name = 'Holder name must be 255 characters or less';
    }

    // Validate default_shares
    if (defaultShares.trim()) {
      const sharesNum = parseInt(defaultShares, 10);
      if (isNaN(sharesNum)) {
        newErrors.defaultShares = 'Default shares must be a valid number';
      } else if (sharesNum <= 0) {
        newErrors.defaultShares = 'Default shares must be a positive number';
      } else if (!Number.isInteger(sharesNum)) {
        newErrors.defaultShares = 'Default shares must be a whole number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData: HolderFormData = {
        name: name.trim(),
        default_shares: defaultShares.trim()
          ? parseInt(defaultShares, 10)
          : null,
      };

      await onSubmit(formData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save holder';
      setErrors({ form: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDefaultSharesChange = (value: string) => {
    // Allow empty string or valid integers
    if (value === '' || /^\d+$/.test(value)) {
      setDefaultShares(value);
      // Clear error when user starts typing
      if (errors.defaultShares) {
        setErrors({ ...errors, defaultShares: undefined });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && <ErrorMessage message={errors.form} />}

      {/* Name Field */}
      <div>
        <label
          htmlFor="holder-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="holder-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            // Clear error when user starts typing
            if (errors.name) {
              setErrors({ ...errors, name: undefined });
            }
          }}
          disabled={isLoading || isSubmitting}
          className={`block w-full rounded-md shadow-sm sm:text-sm ${
            errors.name
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="Enter holder name"
          maxLength={255}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Default Shares Field */}
      <div>
        <label
          htmlFor="default-shares"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Default Shares
        </label>
        <input
          id="default-shares"
          type="text"
          inputMode="numeric"
          value={defaultShares}
          onChange={(e) => handleDefaultSharesChange(e.target.value)}
          disabled={isLoading || isSubmitting}
          className={`block w-full rounded-md shadow-sm sm:text-sm ${
            errors.defaultShares
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="Optional"
        />
        {errors.defaultShares && (
          <p className="mt-1 text-sm text-red-600">{errors.defaultShares}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Pre-populate this value when creating new periods
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isLoading || isSubmitting}
        >
          {holder ? 'Update Holder' : 'Create Holder'}
        </Button>
      </div>
    </form>
  );
}
