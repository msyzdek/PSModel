/**
 * Format month/year for display
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1); // month is 1-indexed, Date expects 0-indexed
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Format month/year in short format (e.g., "Jan 2024")
 */
export function formatMonthYearShort(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

/**
 * Parse month/year from URL params
 * Returns null if invalid
 */
export function parseMonthYear(
  yearParam: string,
  monthParam: string
): { year: number; month: number } | null {
  const year = parseInt(yearParam, 10);
  const month = parseInt(monthParam, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return null;
  }

  return { year, month };
}

/**
 * Generate month/year options for selectors
 * Returns array of options going back from current date
 */
export interface MonthYearOption {
  value: string;
  label: string;
  year: number;
  month: number;
}

export function generateMonthYearOptions(count: number = 24): MonthYearOption[] {
  const options: MonthYearOption[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // Convert to 1-indexed

  for (let i = 0; i < count; i++) {
    options.push({
      value: `${year}-${month.toString().padStart(2, '0')}`,
      label: formatMonthYear(year, month),
      year,
      month,
    });

    // Move to previous month
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
  }

  return options;
}

/**
 * Get the previous month/year
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Get the next month/year
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Get month name from month number (1-12)
 */
export function getMonthName(month: number): string {
  const date = new Date(2000, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get short month name from month number (1-12)
 */
export function getMonthNameShort(month: number): string {
  const date = new Date(2000, month - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}
