"use client";

import { useCallback, useMemo } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
  type ColDef,
  type ValueFormatterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useRouter } from "next/navigation";

import type { MonthSummary, SimplifiedShareholder } from "./page";
import { formatYearMonth } from "@/lib/date";

import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

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

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  return currency.format(value);
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

  const pinnedTopRowData: GridRow[] = useMemo(() => {
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
      buildRow(
        "taxOptimizationReturn",
        "Tax optimization return",
        (month) => month.taxOptimizationReturn,
      ),
      buildRow("psAddBack", "PS add-back", (month) => month.psAddBack),
      buildRow(
        "psPayoutAddBack",
        "PS payouts add-back",
        (month) => month.psPayoutAddBack,
      ),
      buildRow("ownerSalary", "Owner salary", (month) =>
        month.ownerSalary !== null ? -month.ownerSalary : null,
      ),
      buildRow("uncollectible", "Uncollectible", (month) =>
        month.uncollectible !== null ? -month.uncollectible : null,
      ),
      buildRow(
        "personalAddBack",
        "Personal add-back",
        (month) => month.personalAddBackTotal,
      ),
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
          row[field] = null;
          return;
        }

        const value = month.payouts[holder.id] ?? 0;
        row[field] = value;
        total += value;
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
        row[field] = null;
        return;
      }

      const monthTotal = shareholders.reduce((acc, holder) => {
        const value = month.payouts[holder.id] ?? 0;
        return acc + value;
      }, 0);

      row[field] = monthTotal;
      ytd += monthTotal;
      hasValue = true;
    });

    row.ytd = hasValue ? ytd : null;
    return row;
  }, [monthFields, monthMap, shareholders]);

  const rowData = shareholderRows;

  const columnDefs = useMemo<ColDef[]>(() => {
    const baseCols: ColDef[] = [
      {
        headerName: "Shareholder",
        field: "label",
        pinned: "left",
        lockPinned: true,
        cellClass: "font-medium text-slate-700",
        width: 200,
      },
    ];

    const monthCols = monthFields.map<ColDef>(({ field, label, monthNumber }) => ({
      headerName: label,
      field,
      type: "numericColumn",
      valueFormatter: (params: ValueFormatterParams) =>
        formatCurrency(params.value as number | null | undefined),
      cellClass: "text-right cursor-pointer",
      width: 120,
      colId: `month-${monthNumber}`,
    }));

    const totalCol: ColDef = {
      headerName: "YTD",
      field: "ytd",
      type: "numericColumn",
      valueFormatter: (params: ValueFormatterParams) =>
        formatCurrency(params.value as number | null | undefined),
      cellClass: "text-right font-semibold",
      width: 130,
    };

    return [...baseCols, ...monthCols, totalCol];
  }, [monthFields]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: false,
      filter: false,
      resizable: true,
      suppressMenu: true,
    }),
    [],
  );

  const getRowClass = (params: { data?: GridRow }): string => {
    if (!params.data) return "";
    if (params.data.type === "meta") {
      return "bg-slate-50 font-medium";
    }
    if (params.data.type === "total") {
      return "bg-slate-100 font-semibold";
    }
    return "";
  };

  const handleCellClicked = useCallback(
    (event: CellClickedEvent) => {
      if (!event.colDef.field) return;
      const monthField = monthFields.find((field) => field.field === event.colDef.field);
      if (!monthField) {
        return;
      }

      const target = formatYearMonth(year, monthField.monthNumber);
      router.push(`/month/${target}`);
    },
    [monthFields, router, year],
  );

  return (
    <div className="ag-theme-quartz rounded-lg border border-slate-200 bg-white shadow-sm">
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pinnedTopRowData={pinnedTopRowData}
        pinnedBottomRowData={[totalRow]}
        suppressMovableColumns
        getRowClass={getRowClass}
        domLayout="autoHeight"
        onCellClicked={handleCellClicked}
      />
    </div>
  );
}
