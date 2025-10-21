export function formatYearMonth(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}`;
}

export function parseYearMonth(value: string): { year: number; month: number } {
  // Validate input format: 'YYYY-MM'
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid year-month format: "${value}". Expected "YYYY-MM".`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  return { year, month };
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
