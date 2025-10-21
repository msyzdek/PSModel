import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { calculatePeriod } from "@/lib/calculation";
import { MONTH_NAMES, formatYearMonth, parseYearMonth } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

type MonthContext = {
  year: number;
  month: number;
  monthLabel: string;
  periodId: string | null;
  periodValues: {
    netIncomeQB: number;
    psAddBack: number;
    ownerSalary: number;
    taxOptimizationReturn: number;
    uncollectible: number;
    psPayoutAddBack: number;
  };
  shareholders: {
    id: string;
    name: string;
  }[];
  shareInputs: { shareholderId: string; shares: number }[];
  personalChargeInputs: { shareholderId: string; amount: number }[];
  carryForwardIn: Record<string, number>;
  calculation: ReturnType<typeof calculatePeriod>;
};

async function getMonthContext(yearMonthParam: string): Promise<MonthContext> {
  const { year, month } = parseYearMonth(yearMonthParam);
  const monthLabel = `${MONTH_NAMES[month - 1] ?? "Month"} ${year}`;

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
  let carryForwardInForTarget: Record<string, number> | null = null;
  let periodForTarget: (typeof periods)[number] | null = null;
  let previousShareDefaults = new Map<string, number>();

  for (const period of periods) {
    const carryIn = { ...carryForwardState };

    if (period.month === yearMonthParam) {
      carryForwardInForTarget = carryIn;
    }

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
      carryForwardIn: carryIn,
    });

    if (period.month === yearMonthParam) {
      periodForTarget = period;
    }

    if (period.month < yearMonthParam) {
      previousShareDefaults = new Map(
        period.shareAllocations.map((allocation) => [
          allocation.shareholderId,
          Number(allocation.shares),
        ]),
      );
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
  }

  if (!carryForwardInForTarget) {
    carryForwardInForTarget = { ...carryForwardState };
  }

  const periodValues = periodForTarget
    ? {
        netIncomeQB: Number(periodForTarget.netIncomeQB),
        psAddBack: Number(periodForTarget.psAddBack),
        ownerSalary: Number(periodForTarget.ownerSalary),
        taxOptimizationReturn: Number(periodForTarget.taxOptimizationReturn),
        uncollectible: Number(periodForTarget.uncollectible),
        psPayoutAddBack: Number(periodForTarget.psPayoutAddBack),
      }
    : {
        netIncomeQB: 0,
        psAddBack: 0,
        ownerSalary: 0,
        taxOptimizationReturn: 0,
        uncollectible: 0,
        psPayoutAddBack: 0,
      };

  const shareDefaults = periodForTarget
    ? new Map(
        periodForTarget.shareAllocations.map((allocation) => [
          allocation.shareholderId,
          Number(allocation.shares),
        ]),
      )
    : previousShareDefaults;

  const personalDefaults = periodForTarget
    ? new Map(
        periodForTarget.personalCharges.map((charge) => [
          charge.shareholderId,
          Number(charge.amount),
        ]),
      )
    : new Map<string, number>();

  const shareInputs = shareholders.map((holder) => ({
    shareholderId: holder.id,
    shares: shareDefaults.get(holder.id) ?? 0,
  }));

  const personalChargeInputs = shareholders.map((holder) => ({
    shareholderId: holder.id,
    amount: personalDefaults.get(holder.id) ?? 0,
  }));

  const calculation = calculatePeriod({
    netIncomeQB: periodValues.netIncomeQB,
    psAddBack: periodValues.psAddBack,
    ownerSalary: periodValues.ownerSalary,
    taxOptimizationReturn: periodValues.taxOptimizationReturn,
    uncollectible: periodValues.uncollectible,
    psPayoutAddBack: periodValues.psPayoutAddBack,
    shares: shareInputs,
    personalCharges: personalChargeInputs,
    carryForwardIn: carryForwardInForTarget,
  });

  return {
    year,
    month,
    monthLabel,
    periodId: periodForTarget?.id ?? null,
    periodValues,
    shareholders: shareholders.map((holder) => ({ id: holder.id, name: holder.name })),
    shareInputs,
    personalChargeInputs,
    carryForwardIn: carryForwardInForTarget,
    calculation,
  };
}

async function ensurePeriod(monthKey: string) {
  let period = await prisma.period.findUnique({ where: { month: monthKey } });
  if (!period) {
    period = await prisma.period.create({
      data: {
        month: monthKey,
        netIncomeQB: new Prisma.Decimal(0),
        psAddBack: new Prisma.Decimal(0),
        ownerSalary: new Prisma.Decimal(0),
        taxOptimizationReturn: new Prisma.Decimal(0),
        uncollectible: new Prisma.Decimal(0),
        psPayoutAddBack: new Prisma.Decimal(0),
      },
    });
  }
  return period;
}

async function upsertShareAllocations(
  monthKey: string,
  entries: { shareholderId: string; shares: number }[],
) {
  const period = await ensurePeriod(monthKey);

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.shareAllocation.upsert({
        where: {
          periodId_shareholderId: {
            periodId: period.id,
            shareholderId: entry.shareholderId,
          },
        },
        update: {
          shares: new Prisma.Decimal(entry.shares),
        },
        create: {
          periodId: period.id,
          shareholderId: entry.shareholderId,
          shares: new Prisma.Decimal(entry.shares),
        },
      }),
    ),
  );
}

async function upsertPersonalCharges(
  monthKey: string,
  entries: { shareholderId: string; amount: number }[],
) {
  const period = await ensurePeriod(monthKey);

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.personalCharge.upsert({
        where: {
          periodId_shareholderId: {
            periodId: period.id,
            shareholderId: entry.shareholderId,
          },
        },
        update: {
          amount: new Prisma.Decimal(entry.amount),
        },
        create: {
          periodId: period.id,
          shareholderId: entry.shareholderId,
          amount: new Prisma.Decimal(entry.amount),
        },
      }),
    ),
  );
}

async function updatePeriodValues(monthKey: string, values: {
  netIncomeQB: number;
  psAddBack: number;
  ownerSalary: number;
  taxOptimizationReturn: number;
  uncollectible: number;
  psPayoutAddBack: number;
}) {
  await prisma.period.upsert({
    where: { month: monthKey },
    update: {
      netIncomeQB: new Prisma.Decimal(values.netIncomeQB),
      psAddBack: new Prisma.Decimal(values.psAddBack),
      ownerSalary: new Prisma.Decimal(values.ownerSalary),
      taxOptimizationReturn: new Prisma.Decimal(values.taxOptimizationReturn),
      uncollectible: new Prisma.Decimal(values.uncollectible),
      psPayoutAddBack: new Prisma.Decimal(values.psPayoutAddBack),
    },
    create: {
      month: monthKey,
      netIncomeQB: new Prisma.Decimal(values.netIncomeQB),
      psAddBack: new Prisma.Decimal(values.psAddBack),
      ownerSalary: new Prisma.Decimal(values.ownerSalary),
      taxOptimizationReturn: new Prisma.Decimal(values.taxOptimizationReturn),
      uncollectible: new Prisma.Decimal(values.uncollectible),
      psPayoutAddBack: new Prisma.Decimal(values.psPayoutAddBack),
    },
  });
}

function parseNumberField(value: FormDataEntryValue | null, options?: { allowNegative?: boolean }) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  if (!options?.allowNegative && parsed < 0) {
    return 0;
  }
  return parsed;
}

async function revalidateForMonth(monthKey: string) {
  try {
    const { year } = parseYearMonth(monthKey);
    revalidatePath(`/month/${monthKey}`);
    revalidatePath(`/year/${year}`);
  } catch {
    revalidatePath(`/month/${monthKey}`);
  }
}

async function handleSaveAll(formData: FormData) {
  "use server";

  const month = (formData.get("month") as string) ?? "";
  if (!month) {
    redirect("/");
  }

  const parsedMonth = (() => {
    try {
      return parseYearMonth(month);
    } catch {
      redirect(`/year/${new Date().getFullYear()}`);
    }
  })();

  const netIncomeQB = parseNumberField(formData.get("net_income_qb"), { allowNegative: true });
  const psAddBack = parseNumberField(formData.get("ps_addback"), { allowNegative: true });
  const taxOptimizationReturn = parseNumberField(formData.get("tax_optimization_return"), {
    allowNegative: true,
  });
  const psPayoutAddBack = parseNumberField(formData.get("ps_payout_addback"), {
    allowNegative: true,
  });
  const ownerSalary = parseNumberField(formData.get("owner_salary"), { allowNegative: true });
  const uncollectible = parseNumberField(formData.get("uncollectible"), { allowNegative: true });

  const shareEntries: { shareholderId: string; shares: number }[] = [];
  const personalChargeEntries: { shareholderId: string; amount: number }[] = [];

  formData.forEach((value, key) => {
    if (key.startsWith("share_")) {
      const shareholderId = key.replace("share_", "");
      const shares = parseNumberField(value, { allowNegative: false });
      shareEntries.push({ shareholderId, shares });
    }
    if (key.startsWith("charge_")) {
      const shareholderId = key.replace("charge_", "");
      const amount = parseNumberField(value, { allowNegative: false });
      personalChargeEntries.push({ shareholderId, amount });
    }
  });

  await updatePeriodValues(month, {
    netIncomeQB,
    psAddBack,
    ownerSalary,
    taxOptimizationReturn,
    uncollectible,
    psPayoutAddBack,
  });
  await upsertShareAllocations(month, shareEntries);
  await upsertPersonalCharges(month, personalChargeEntries);
  await revalidateForMonth(month);
  redirect(`/year/${parsedMonth.year}?savedMonth=${month}`);
}

interface MonthPageProps {
  params: Promise<{ month: string }>;
}

export default async function MonthPage({ params }: MonthPageProps) {
  const { month: monthParam } = await params;
  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    notFound();
  }
  let parsed;
  try {
    parsed = parseYearMonth(monthParam);
  } catch {
    notFound();
  }
  if (
    Number.isNaN(parsed.year) ||
    Number.isNaN(parsed.month) ||
    parsed.month < 1 ||
    parsed.month > 12
  ) {
    notFound();
  }

  const context = await getMonthContext(monthParam);

  const { year, month } = context;
  const prevMonthKey = formatYearMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);
  const nextMonthKey = formatYearMonth(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-light)] px-8 py-10 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80">Monthly Detail</p>
            <h1 className="text-4xl font-semibold md:text-5xl">{context.monthLabel}</h1>
            <p className="max-w-2xl text-base text-white/80">
              Update period adjustments, shareholder shares, and personal expenses. All changes save together to keep
              payouts in sync.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/month/${prevMonthKey}`}
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white transition hover:border-white"
            >
              ← {prevMonthKey}
            </a>
            <a
              href={`/month/${nextMonthKey}`}
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white transition hover:border-white"
            >
              {nextMonthKey} →
            </a>
          </div>
        </div>
      </section>

      <form action={handleSaveAll} className="space-y-8">
        <input type="hidden" name="month" value={monthParam} />

        <section className="rounded-3xl bg-[var(--card-bg)] p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--brand-primary)]">Period inputs</h2>
            <p className="text-sm text-[var(--brand-primary)]/70">
              QuickBooks net income plus adjustments. Positive PS values add back to the pool; owner salary,
              uncollectible, and tax optimization reduce it.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Net income (QBO)</span>
              <input
                type="text"
                inputMode="decimal"
                name="net_income_qb"
                defaultValue={context.periodValues.netIncomeQB}
                className="rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">PS add-back</span>
              <input
                type="text"
                inputMode="decimal"
                name="ps_addback"
                defaultValue={context.periodValues.psAddBack}
                className="rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Tax optimization return</span>
              <input
                type="text"
                inputMode="decimal"
                name="tax_optimization_return"
                defaultValue={context.periodValues.taxOptimizationReturn}
                className="rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">PS payouts add-back</span>
              <input
                type="text"
                inputMode="decimal"
                name="ps_payout_addback"
                defaultValue={context.periodValues.psPayoutAddBack}
                className="rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Owner salary</span>
              <input
                type="text"
                inputMode="decimal"
                name="owner_salary"
                defaultValue={context.periodValues.ownerSalary}
                className="rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Uncollectible</span>
              <input
                type="text"
                inputMode="decimal"
                name="uncollectible"
                defaultValue={context.periodValues.uncollectible}
                className="rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl bg-[var(--card-bg)] p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--brand-primary)]">Shareholders</h2>
            <p className="text-sm text-[var(--brand-primary)]/70">
              Review monthly shares and personal expenses for each shareholder.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white shadow-inner">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[var(--brand-primary)] text-left text-white">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">Shareholder</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">Shares</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">Personal expenses</th>
                </tr>
              </thead>
              <tbody>
                {context.shareholders.map((holder) => {
                  const shareValue = context.shareInputs.find((s) => s.shareholderId === holder.id)?.shares ?? 0;
                  const personalValue = context.personalChargeInputs.find(
                    (p) => p.shareholderId === holder.id,
                  )?.amount ?? 0;

                  return (
                    <tr key={holder.id} className="border-b border-[var(--brand-muted)]/60 odd:bg-slate-50/40">
                      <td className="px-4 py-3 font-medium text-[var(--brand-primary)]">{holder.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          name={`share_${holder.id}`}
                          defaultValue={shareValue}
                          className="w-full rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          name={`charge_${holder.id}`}
                          defaultValue={personalValue}
                          className="w-full rounded-xl border border-[var(--brand-muted)] bg-white px-4 py-3 text-[var(--brand-primary)] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[var(--brand-primary)]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-[var(--card-bg)] p-6 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--brand-primary)]">Calculated payouts</h2>
              <p className="text-sm text-[var(--brand-primary)]/70">
                Based on the inputs above with zero floor and carry-forward of deficits.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white shadow-inner">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[var(--brand-primary)] text-left text-white">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]">Shareholder</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Shares
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Share %
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Pre-share
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Personal
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Carry-in
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Payout
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-right">
                    Carry-out
                  </th>
                </tr>
              </thead>
              <tbody>
                {context.calculation.rows.map((row) => {
                  const holder = context.shareholders.find((h) => h.id === row.shareholderId);
                  return (
                    <tr key={row.shareholderId} className="border-b border-[var(--brand-muted)]/60 odd:bg-slate-50/40">
                      <td className="px-4 py-3 font-medium text-[var(--brand-primary)]">
                        {holder?.name ?? row.shareholderId}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--brand-primary)]">
                        {numberFormatter.format(row.shares)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--brand-primary)]">
                        {(row.shareRatio * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--brand-primary)]">
                        {currencyFormatter.format(row.preShare)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--brand-primary)]">
                        {currencyFormatter.format(row.personalCharge)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--brand-primary)]">
                        {currencyFormatter.format(row.carryForwardIn)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--brand-primary)]">
                        {currencyFormatter.format(row.payoutRounded)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--brand-primary)]">
                        {currencyFormatter.format(row.carryForwardOut)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--brand-muted)] bg-slate-50/80 text-[var(--brand-primary)]">
                  <td className="px-4 py-3 text-left font-semibold">Totals</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {numberFormatter.format(context.calculation.totalShares)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {context.calculation.totalShares > 0 ? "100%" : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {currencyFormatter.format(context.calculation.adjustedPool)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {currencyFormatter.format(context.calculation.personalAddBackTotal)}
                  </td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {currencyFormatter.format(context.calculation.actualRoundedTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {currencyFormatter.format(
                      context.calculation.rows.reduce((acc, row) => acc + row.carryForwardOut, 0),
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-[var(--brand-primary)]/60" colSpan={8}>
                    Rounding delta applied: {currencyFormatter.format(context.calculation.roundingDelta)}.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-accent)] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
