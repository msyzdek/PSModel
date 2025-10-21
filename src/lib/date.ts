export function formatYearMonth(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}`;
}

export function parseYearMonth(value: string): { year: number; month: number } {
  const [yearStr, monthStr] = value.split("-");
  return {
    year: Number(yearStr),
    month: Number(monthStr),
  };
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
