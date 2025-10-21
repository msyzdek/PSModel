"use client";

import { Fragment, useCallback, useMemo } from "react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";

import type { MonthSummary, SimplifiedShareholder } from "./page";
import { formatYearMonth } from "@/lib/date";

type MonthField = {
  field: string;
  monthNumber: number;
  label: string;
};

type GridRow = Record<string, string | number | null> & {
  id: string;
  label: string;
  type: "meta" | "payout" | "total";
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sharesFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  return currency.format(value);
};

const formatShares = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  return sharesFormatter.format(value);
};

interface YearGridProps {
  year: number;
  shareholders: SimplifiedShareholder[];
  months: MonthSummary[];
  monthNames: string[];
}

const buildMonthFields = (months: MonthSummary[], monthNames: string[]): MonthField[] =>
  months.map((month) => ({
    field: `m${month.month.toString().padStart(2, "0")}`,
    monthNumber: month.month,
    label: monthNames[month.month - 1] ?? `Month ${month.month}`,
  }));

export default function YearGrid({
  year,
  shareholders,
  months,
  monthNames,
}: YearGridProps) {
  const router = useRouter();
  const monthFields = useMemo(() => buildMonthFields(months, monthNames), [months, monthNames]);
  const monthMap = useMemo(() => {
    const map = new Map<number, MonthSummary>();
    months.forEach((month) => map.set(month.month, month));
    return map;
  }, [months]);

  const aggregatedRows: GridRow[] = useMemo(() => {
    const buildRow = (
      id: string,
      label: string,
      selector: (month: MonthSummary) => number | null,
    ): GridRow => {
      const row: GridRow = { id, label, type: "meta" };
      let total = 0;
      let hasValue = false;
      monthFields.forEach(({ field, monthNumber }) => {
        const month = monthMap.get(monthNumber);
        const value = month ? selector(month) : null;
        row[field] = value;
        if (value !== null && value !== undefined) {
          total += value;
          hasValue = true;
        }
      });
      row.ytd = hasValue ? total : null;
      return row;
    };

    return [
      buildRow("netIncome", "Net income (QBO)", (month) => month.netIncomeQB),
      buildRow("taxOptimizationReturn", "Tax optimization return", (month) =>
        month.taxOptimizationReturn !== null ? -month.taxOptimizationReturn : null,
      ),
      buildRow("psAddBack", "PS add-back", (month) => month.psAddBack),
      buildRow("psPayoutAddBack", "PS payouts add-back", (month) => month.psPayoutAddBack),
      buildRow("ownerSalary", "Owner salary", (month) =>
        month.ownerSalary !== null ? -month.ownerSalary : null,
      ),
      buildRow("uncollectible", "Uncollectible", (month) =>
        month.uncollectible !== null ? -month.uncollectible : null,
      ),
      buildRow("personalAddBack", "Personal add-back", (month) => month.personalAddBackTotal),
      buildRow("adjustedPool", "Adjusted pool", (month) => month.adjustedPool),
    ];
  }, [monthFields, monthMap]);

  const shareholderRows: GridRow[] = useMemo(() => {
    return shareholders.map((holder) => {
      const row: GridRow = {
        id: holder.id,
        label: holder.name,
        type: "payout",
      };
      let total = 0;
      let hasValue = false;

      monthFields.forEach(({ field, monthNumber }) => {
        const month = monthMap.get(monthNumber);
        if (!month || !month.hasData) {
          row[`${field}_shares`] = null;
          row[`${field}_expenses`] = null;
          row[`${field}_payout`] = null;
          return;
        }

        const sharesValue = month.shares[holder.id] ?? 0;
        const personalValue = month.personalExpenses[holder.id] ?? 0;
        const payoutValue = month.payouts[holder.id] ?? 0;

        row[`${field}_shares`] = sharesValue;
        row[`${field}_expenses`] = personalValue;
        row[`${field}_payout`] = payoutValue;

        total += payoutValue;
        hasValue = true;
      });

      row.ytd = hasValue ? total : null;
      return row;
    });
  }, [shareholders, monthFields, monthMap]);

  const totalRow: GridRow = useMemo(() => {
    const row: GridRow = {
      id: "total",
      label: "Total paid",
      type: "total",
    };
    let ytd = 0;
    let hasValue = false;

    monthFields.forEach(({ field, monthNumber }) => {
      const month = monthMap.get(monthNumber);
      if (!month || !month.hasData) {
        row[`${field}_shares`] = null;
        row[`${field}_expenses`] = null;
        row[`${field}_payout`] = null;
        return;
      }

      const totalShares = Object.values(month.shares).reduce<number>(
        (acc, value) => acc + (value ?? 0),
        0,
      );
      const totalPersonal = Object.values(month.personalExpenses).reduce<number>(
        (acc, value) => acc + (value ?? 0),
        0,
      );
      const monthTotal = shareholders.reduce((acc, holder) => {
        const value = month.payouts[holder.id] ?? 0;
        return acc + value;
      }, 0);

      row[`${field}_shares`] = totalShares;
      row[`${field}_expenses`] = totalPersonal;
      row[`${field}_payout`] = monthTotal;
      ytd += monthTotal;
      hasValue = true;
    });

    row.ytd = hasValue ? ytd : null;
    return row;
  }, [monthFields, monthMap, shareholders]);

  const getRowClasses = (type: GridRow["type"]): string => {
    if (type === "meta") {
      return "bg-slate-50/70 font-medium";
    }
    if (type === "total") {
      return "bg-slate-100/80 font-semibold";
    }
    return "";
  };

  const handleNavigateToMonth = useCallback(
    (monthNumber: number) => {
      const target = formatYearMonth(year, monthNumber);
      router.push(`/month/${target}`);
    },
    [router, year],
  );

  const renderMonthHeaderContent = useCallback(
    (field: MonthField, alignment: "between" | "end" = "between"): JSX.Element => {
      const justification = alignment === "end" ? "justify-end" : "justify-between";
      const labelClass = alignment === "end" ? "text-right" : "";
      return (
        <div className={`flex items-center gap-2 ${justification}`}>
          <span className={labelClass}>{field.label}</span>
          <button
            type="button"
            className="rounded-full border border-[var(--brand-primary)] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
            onClick={() => handleNavigateToMonth(field.monthNumber)}
            aria-label={`Edit ${field.label} ${year}`}
          >
            Edit
          </button>
        </div>
      );
    },
    [handleNavigateToMonth, year],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/40 bg-white/95 p-3 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm text-[var(--brand-primary)]">
            <thead>
              <tr className="bg-slate-100/80 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand-primary)]">
                <th className="whitespace-nowrap px-4 py-3 text-left">Metric</th>
                {monthFields.map((field) => (
                  <th key={field.field} className="whitespace-nowrap px-4 py-3">
                    {renderMonthHeaderContent(field, "end")}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedRows.map((row) => (
                <tr key={row.id} className={getRowClasses(row.type)}>
                  <th scope="row" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left">
                    {row.label}
                  </th>
                  {monthFields.map((field) => {
                    const rawValue = row[field.field];
                    const value = typeof rawValue === "number" ? rawValue : null;
                    return (
                      <td key={field.field} className="border-b border-slate-200 px-4 py-3 text-right whitespace-nowrap">
                        {formatCurrency(value)}
                      </td>
                    );
                  })}
                  <td className="border-b border-slate-200 px-4 py-3 text-right font-semibold whitespace-nowrap">
                    {formatCurrency(typeof row.ytd === "number" ? row.ytd : null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-3xl border border-white/40 bg-white/95 p-3 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm text-[var(--brand-primary)]">
            <thead>
              <tr className="bg-slate-100/80 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand-primary)]">
                <th rowSpan={2} className="whitespace-nowrap px-4 py-3 text-left">
                  Shareholder
                </th>
                {monthFields.map((field) => (
                  <th key={field.field} colSpan={3} className="whitespace-nowrap px-4 py-3 text-center">
                    {field.label}
                  </th>
                ))}
                <th rowSpan={2} className="whitespace-nowrap px-4 py-3 text-right">
                  YTD
                </th>
              </tr>
              <tr className="bg-slate-50/80 text-[0.7rem] uppercase tracking-[0.3em] text-[var(--brand-primary)]">
                {monthFields.map((field) => (
                  <Fragment key={field.field}>
                    <th className="whitespace-nowrap px-4 py-2 text-right">Shares</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right">Personal</th>
                    <th className="whitespace-nowrap border-r border-slate-200 px-4 py-2 text-right">Payout</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {shareholderRows.map((row) => (
                <tr key={row.id} className={getRowClasses(row.type)}>
                  <th scope="row" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left">
                    {row.label}
                  </th>
                  {monthFields.map((field) => {
                    const shares = row[`${field.field}_shares`];
                    const personal = row[`${field.field}_expenses`];
                    const payout = row[`${field.field}_payout`];
                    return (
                      <Fragment key={field.field}>
                        <td className="border-b border-slate-200 px-4 py-3 text-right whitespace-nowrap">
                          {formatShares(typeof shares === "number" ? shares : null)}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-right whitespace-nowrap">
                          {formatCurrency(typeof personal === "number" ? personal : null)}
                        </td>
                        <td className="border-b border-r border-slate-200 px-4 py-3 text-right font-medium whitespace-nowrap">
                          {formatCurrency(typeof payout === "number" ? payout : null)}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="border-b border-slate-200 px-4 py-3 text-right font-semibold whitespace-nowrap">
                    {formatCurrency(typeof row.ytd === "number" ? row.ytd : null)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={getRowClasses(totalRow.type)}>
                <th scope="row" className="whitespace-nowrap border-t border-slate-200 px-4 py-3 text-left">
                  {totalRow.label}
                </th>
                {monthFields.map((field) => {
                  const shares = totalRow[`${field.field}_shares`];
                  const personal = totalRow[`${field.field}_expenses`];
                  const payout = totalRow[`${field.field}_payout`];
                  return (
                    <Fragment key={field.field}>
                      <td className="border-t border-slate-200 px-4 py-3 text-right whitespace-nowrap">
                        {formatShares(typeof shares === "number" ? shares : null)}
                      </td>
                      <td className="border-t border-slate-200 px-4 py-3 text-right whitespace-nowrap">
                        {formatCurrency(typeof personal === "number" ? personal : null)}
                      </td>
                      <td className="border-t border-r border-slate-200 px-4 py-3 text-right font-semibold whitespace-nowrap">
                        {formatCurrency(typeof payout === "number" ? payout : null)}
                      </td>
                    </Fragment>
                  );
                })}
                <td className="border-t border-slate-200 px-4 py-3 text-right font-semibold whitespace-nowrap">
                  {formatCurrency(typeof totalRow.ytd === "number" ? totalRow.ytd : null)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
