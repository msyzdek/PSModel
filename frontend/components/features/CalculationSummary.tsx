'use client';

import { PeriodSummary } from '@/lib/types/period';
import { formatCurrency, getMonthName } from '@/lib/utils';

interface CalculationSummaryProps {
  summary: PeriodSummary;
}

export function CalculationSummary({ summary }: CalculationSummaryProps) {
  const { period, allocations } = summary;

  const personalAddbackTotal = allocations.reduce(
    (sum, holder) => sum + holder.personal_charges,
    0
  );

  const totalGrossAllocation = allocations.reduce(
    (sum, holder) => sum + holder.gross_allocation,
    0
  );

  const totalPersonalCharges = allocations.reduce(
    (sum, holder) => sum + holder.personal_charges,
    0
  );

  const totalCarryForwardIn = allocations.reduce(
    (sum, holder) => sum + holder.carry_forward_in,
    0
  );

  const totalNetPayout = allocations.reduce((sum, holder) => sum + holder.net_payout, 0);

  const totalCarryForwardOut = allocations.reduce(
    (sum, holder) => sum + holder.carry_forward_out,
    0
  );

  return (
    <div className="space-y-8">
      {/* Period Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {getMonthName(period.month)} {period.year} - Profit Share Summary
        </h2>
      </div>

      {/* Pool Build-up */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Build-up</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Net Income (QuickBooks)</span>
            <span className="font-medium">{formatCurrency(period.net_income_qb)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">PS Payout Add-back</span>
            <span className="font-medium">{formatCurrency(period.ps_addback)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Personal Add-back Total</span>
            <span className="font-medium">{formatCurrency(personalAddbackTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Owner Draws</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(period.owner_draws)}
            </span>
          </div>
          {period.uncollectible > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uncollectible Income</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(period.uncollectible)}
              </span>
            </div>
          )}
          {period.bad_debt > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bad Debt</span>
              <span className="font-medium">{formatCurrency(period.bad_debt)}</span>
            </div>
          )}
          {period.tax_optimization > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Optimization Return</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(period.tax_optimization)}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900">Adjusted Pool</span>
              <span className="text-blue-600">{formatCurrency(period.adjusted_pool)}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Shares</span>
            <span className="font-medium">{period.total_shares}</span>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Holder Allocations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holder
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Allocation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal Charges
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carry Forward In
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Payout
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carry Forward Out
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocations.map((holder, index) => (
                <tr key={index} className={holder.received_rounding_adjustment ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {holder.holder_name}
                    {holder.received_rounding_adjustment && (
                      <span className="ml-2 text-xs text-yellow-600">*</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {holder.shares}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(holder.gross_allocation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {holder.personal_charges > 0 ? formatCurrency(holder.personal_charges) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {holder.carry_forward_in > 0 ? formatCurrency(holder.carry_forward_in) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                    {formatCurrency(holder.net_payout)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                    {holder.carry_forward_out > 0 ? formatCurrency(holder.carry_forward_out) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {period.total_shares}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalGrossAllocation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalPersonalCharges)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalCarryForwardIn)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalNetPayout)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalCarryForwardOut)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Rounding Details */}
      {period.rounding_delta !== 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">Rounding Adjustment</h4>
          <p className="text-sm text-yellow-800">
            A rounding delta of {formatCurrency(Math.abs(period.rounding_delta))} was{' '}
            {period.rounding_delta > 0 ? 'added to' : 'subtracted from'} the holder with the
            largest positive payout (marked with *) to ensure the total matches the adjusted pool
            exactly.
          </p>
        </div>
      )}
    </div>
  );
}
