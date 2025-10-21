/**
 * Format a number as currency with $ and commas
 * Handles negative values with proper display
 * Rounds to 2 decimal places for display
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  // Format with 2 decimal places and commas
  const formatted = absoluteValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Return with proper negative formatting
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Parse a currency string back to a number
 * Handles strings with $, commas, and negative signs
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;

  // Remove $, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as currency for input fields (no $ sign)
 * Useful for controlled input components
 */
export function formatCurrencyInput(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
