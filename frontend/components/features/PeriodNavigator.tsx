'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getMonthName, getPreviousMonth, getNextMonth } from '@/lib/utils';

interface PeriodNavigatorProps {
  currentYear?: number;
  currentMonth?: number;
  onNavigate?: (year: number, month: number) => void;
  onCreateNew?: () => void;
}

export function PeriodNavigator({
  currentYear,
  currentMonth,
  onNavigate,
  onCreateNew,
}: PeriodNavigatorProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(currentYear ?? new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth ?? new Date().getMonth() + 1);

  const handlePrevious = () => {
    const prev = getPreviousMonth(
      currentYear ?? selectedYear,
      currentMonth ?? selectedMonth
    );
    if (onNavigate) {
      onNavigate(prev.year, prev.month);
    } else {
      router.push(`/period/${prev.year}/${prev.month}`);
    }
  };

  const handleNext = () => {
    const next = getNextMonth(
      currentYear ?? selectedYear,
      currentMonth ?? selectedMonth
    );
    if (onNavigate) {
      onNavigate(next.year, next.month);
    } else {
      router.push(`/period/${next.year}/${next.month}`);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value, 10);
    setSelectedMonth(month);
    if (onNavigate) {
      onNavigate(selectedYear, month);
    } else {
      router.push(`/period/${selectedYear}/${month}`);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value, 10);
    setSelectedYear(year);
    if (onNavigate) {
      onNavigate(year, selectedMonth);
    } else {
      router.push(`/period/${year}/${selectedMonth}`);
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      router.push('/period/new');
    }
  };

  const displayYear = currentYear ?? selectedYear;
  const displayMonth = currentMonth ?? selectedMonth;

  // Generate year options (current year ± 5 years)
  const currentYearValue = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYearValue - 5 + i);

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Previous month"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <select
            value={displayMonth}
            onChange={handleMonthChange}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>

          <select
            value={displayYear}
            onChange={handleYearChange}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNext}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Next month"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-gray-900">
          {getMonthName(displayMonth)} {displayYear}
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Period
        </button>
      </div>
    </div>
  );
}
