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
    result.rows.forEach((row) => {
      payouts[row.shareholderId] = row.payoutRounded;
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
    };
  });

  return {
    shareholders: shareholders.map((holder) => ({ id: holder.id, name: holder.name })),
    months,
  };
}

interface YearPageProps {
  params: { year: string };
  searchParams?: { saved?: string };
}

export default async function YearPage({ params, searchParams }: YearPageProps) {
  const parsedYear = Number(params.year);
  if (Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    notFound();
  }

  const overview = await getYearOverview(parsedYear);
  const savedMonth = searchParams?.saved ?? null;

  return (
    <div className="space-y-6">
      {savedMonth && (
        <div
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Saved changes for {savedMonth}.
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{parsedYear} Profit Share</h1>
        <p className="text-sm text-slate-600">
          Monthly payouts shown in USD. Click a month to drill into the detailed editor.
        </p>
      </div>
      <YearGrid
        year={parsedYear}
        shareholders={overview.shareholders}
        months={overview.months}
        monthNames={MONTH_NAMES}
        highlightMonth={savedMonth ?? undefined}
      />
    </div>
  );
}
