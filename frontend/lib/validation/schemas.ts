import { z } from 'zod';

/**
 * Validation schema for period input data.
 * Matches backend validation rules.
 */
export const periodSchema = z.object({
  year: z
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier'),
  month: z
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  net_income_qb: z.number().finite('Net Income must be a valid number'),
  ps_addback: z.number().finite('PS Payout Add-back must be a valid number').default(0),
  owner_draws: z.number().finite('Owner Draws must be a valid number').default(0),
  uncollectible: z.number().finite('Uncollectible Income must be a valid number').default(0),
  bad_debt: z.number().finite('Bad Debt must be a valid number').default(0),
  tax_optimization: z
    .number()
    .finite('Tax Optimization must be a valid number')
    .default(0),
});

/**
 * Validation schema for holder allocation input data.
 * Matches backend validation rules.
 */
export const holderSchema = z.object({
  holder_name: z
    .string()
    .min(1, 'Holder name is required')
    .max(255, 'Holder name must be 255 characters or less')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Holder name cannot be empty',
    }),
  shares: z.number().int('Shares must be an integer').positive('Shares must be a positive integer'),
  personal_charges: z
    .number()
    .finite('Personal charges must be a valid number')
    .min(0, 'Personal charges must be non-negative')
    .default(0),
});

/**
 * Validation schema for the complete period creation request.
 * Includes cross-field validation.
 */
export const periodCreateSchema = z
  .object({
    period: periodSchema,
    holders: z
      .array(holderSchema)
      .min(1, 'At least one holder is required')
      .refine(
        (holders) => {
          const names = holders.map((h) => h.holder_name.toLowerCase());
          return names.length === new Set(names).size;
        },
        {
          message: 'Holder names must be unique',
        }
      ),
  })
  .refine(
    (data) => {
      // Calculate adjusted pool
      const personalAddbackTotal = data.holders.reduce(
        (sum, h) => sum + h.personal_charges,
        0
      );
      const adjustedPool =
        data.period.net_income_qb +
        data.period.ps_addback +
        personalAddbackTotal -
        data.period.owner_draws -
        data.period.uncollectible -
        data.period.tax_optimization +
        data.period.bad_debt;

      // Validate total_shares > 0 when adjusted_pool > 0
      const totalShares = data.holders.reduce((sum, h) => sum + h.shares, 0);
      if (adjustedPool > 0 && totalShares === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Total shares must be greater than 0 when adjusted pool is positive',
      path: ['holders'],
    }
  );

export type PeriodFormData = z.infer<typeof periodSchema>;
export type HolderFormData = z.infer<typeof holderSchema>;
export type PeriodCreateData = z.infer<typeof periodCreateSchema>;
