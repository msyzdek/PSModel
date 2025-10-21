import Link from "next/link";
import { notFound } from "next/navigation";
import { Shareholder } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculatePeriod } from "@/lib/calculation";
import { formatYearMonth, MONTH_NAMES, parseYearMonth } from "@/lib/date";
import YearGrid from "./year-grid";

export type SimplifiedShareholder = Pick<Shareholder, "id" | "name">;

export type MonthSummary = {
  month: number;
  hasData: boolean;
  netIncomeQB: number | null;
  psAddBack: number | null;
  ownerSalary: number | null;
  taxOptimizationReturn: number | null;
  uncollectible: number | null;
  psPayoutAddBack: number | null;
  personalAddBackTotal: number | null;
  adjustedPool: number | null;
  payouts: Record<string, number | null>;
  shares: Record<string, number | null>;
  personalExpenses: Record<string, number | null>;
};

interface YearOverviewData {
  shareholders: SimplifiedShareholder[];
  months: MonthSummary[];
}

async function getYearOverview(year: number): Promise<YearOverviewData> {
  const shareholders = await prisma.shareholder.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const periods = await prisma.period.findMany({
    orderBy: { month: "asc" },
    include: {
      shareAllocations: true,
      personalCharges: true,
    },
  });

  const carryForwardState: Record<string, number> = {};
  const monthData = new Map<string, MonthSummary>();

  periods.forEach((period) => {
    const { year: periodYear, month } = parseYearMonth(period.month);
    const carryInForMonth = { ...carryForwardState };

    const result = calculatePeriod({
      netIncomeQB: Number(period.netIncomeQB),
      psAddBack: Number(period.psAddBack),
      ownerSalary: Number(period.ownerSalary),
      taxOptimizationReturn: Number(period.taxOptimizationReturn),
      uncollectible: Number(period.uncollectible),
      psPayoutAddBack: Number(period.psPayoutAddBack),
      shares: period.shareAllocations.map((allocation) => ({
        shareholderId: allocation.shareholderId,
        shares: Number(allocation.shares),
      })),
      personalCharges: period.personalCharges.map((charge) => ({
        shareholderId: charge.shareholderId,
        amount: Number(charge.amount),
      })),
      carryForwardIn: carryInForMonth,
    });

    const payouts: Record<string, number> = {};
    const sharesMap: Record<string, number> = {};
    const personalExpensesMap: Record<string, number> = {};

    result.rows.forEach((row) => {
      payouts[row.shareholderId] = row.payoutRounded;
    });
    period.shareAllocations.forEach((allocation) => {
      sharesMap[allocation.shareholderId] = Number(allocation.shares);
    });
    period.personalCharges.forEach((charge) => {
      personalExpensesMap[charge.shareholderId] = Number(charge.amount);
    });

    if (periodYear === year) {
      monthData.set(period.month, {
        month,
        hasData: true,
        netIncomeQB: Number(period.netIncomeQB),
        psAddBack: Number(period.psAddBack),
        ownerSalary: Number(period.ownerSalary),
        taxOptimizationReturn: Number(period.taxOptimizationReturn),
        uncollectible: Number(period.uncollectible),
        psPayoutAddBack: Number(period.psPayoutAddBack),
        personalAddBackTotal: result.personalAddBackTotal,
        adjustedPool: result.adjustedPool,
        payouts,
        shares: sharesMap,
        personalExpenses: personalExpensesMap,
      });
    }

    const nextCarry: Record<string, number> = {};
    result.rows.forEach((row) => {
      if (row.carryForwardOut > 0) {
        nextCarry[row.shareholderId] = row.carryForwardOut;
      }
    });

    Object.keys(carryForwardState).forEach((key) => {
      delete carryForwardState[key];
    });
    Object.entries(nextCarry).forEach(([key, value]) => {
      carryForwardState[key] = value;
    });
  });

  const months: MonthSummary[] = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const key = formatYearMonth(year, monthNumber);
    const existing = monthData.get(key);
    if (existing) {
      return existing;
    }
    return {
      month: monthNumber,
      hasData: false,
      netIncomeQB: null,
      psAddBack: null,
      ownerSalary: null,
      taxOptimizationReturn: null,
      uncollectible: null,
      psPayoutAddBack: null,
      personalAddBackTotal: null,
      adjustedPool: null,
      payouts: {},
      shares: {},
      personalExpenses: {},
    };
  });

  return {
    shareholders: shareholders.map((holder) => ({ id: holder.id, name: holder.name })),
    months,
  };
}

interface YearPageProps {
  params: Promise<{ year: string }>;
  searchParams?: Promise<{ saved?: string }>;
}

export default async function YearPage({ params, searchParams }: YearPageProps) {
  const { year } = await params;
  const parsedYear = Number(year);
  if (Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    notFound();
  }

  const overview = await getYearOverview(parsedYear);
  const resolvedSearch = searchParams ? await searchParams : undefined;

  let highlightMonth: string | undefined;
  let savedMonthLabel: string | null = null;
  if (resolvedSearch?.saved) {
    try {
      const { year: savedYear, month: savedMonthNumber } = parseYearMonth(resolvedSearch.saved);
      if (savedYear === parsedYear) {
        highlightMonth = resolvedSearch.saved;
        savedMonthLabel = `${MONTH_NAMES[savedMonthNumber - 1] ?? ""} ${savedYear}`;
      }
    } catch {
      highlightMonth = undefined;
      savedMonthLabel = null;
    }
  }

  return (
    <div className="space-y-8">
      {savedMonthLabel && (
        <div
          className="rounded-md border border-[var(--brand-primary)]/20 bg-white px-4 py-3 text-sm text-[var(--brand-primary)] shadow-sm"
          role="status"
        >
          Saved changes for {savedMonthLabel}.
        </div>
      )}
      <section className="rounded-3xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-light)] px-8 py-10 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80">Profit Share Overview</p>
            <h1 className="text-4xl font-semibold md:text-5xl">{parsedYear} Distribution Summary</h1>
            <p className="max-w-2xl text-base text-white/80">
              Track monthly operating profit, adjustments, and shareholder payouts in one place. Select a month
              below to review or update detailed allocations.
            </p>
          </div>
          <Link
            href={`/month/${formatYearMonth(parsedYear, Math.min(new Date().getMonth() + 1, 12))}`}
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            Jump to Current Month
          </Link>
        </div>
      </section>
      <YearGrid
        year={parsedYear}
        shareholders={overview.shareholders}
        months={overview.months}
        monthNames={MONTH_NAMES}
        highlightMonth={highlightMonth}
      />
    </div>
  );
}
