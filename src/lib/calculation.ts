export interface ShareInput {
  shareholderId: string;
  shares: number; // >= 0
}

export interface PersonalChargeInput {
  shareholderId: string;
  amount: number; // >= 0
}

export interface CarryForwardMap {
  [shareholderId: string]: number; // positive number representing deficit carried into this period
}

export interface PeriodCalculationInput {
  netIncomeQB: number;
  psAddBack: number;
  ownerSalary: number;
  taxOptimizationReturn: number;
  uncollectible: number;
  psPayoutAddBack: number;
  shares: ShareInput[];
  personalCharges: PersonalChargeInput[];
  carryForwardIn: CarryForwardMap;
}

export interface HolderCalculation {
  shareholderId: string;
  shares: number;
  shareRatio: number;
  preShare: number;
  personalCharge: number;
  carryForwardIn: number;
  payoutRaw: number;
  payoutUnrounded: number;
  payoutRounded: number;
  carryForwardOut: number;
}

export interface PeriodCalculationResult {
  adjustedPool: number;
  personalAddBackTotal: number;
  totalShares: number;
  expectedRoundedTotal: number;
  actualRoundedTotal: number;
  roundingDelta: number;
  rows: HolderCalculation[];
}

const roundToCents = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const findLargestPositivePayoutIndex = (rows: HolderCalculation[]): number | null => {
  let max = 0;
  let idx: number | null = null;
  rows.forEach((row, index) => {
    if (row.payoutRounded > 0 && row.payoutRounded >= max) {
      max = row.payoutRounded;
      idx = index;
    }
  });
  return idx;
};

const normalizeCarryForwardIn = (carryForwardIn: CarryForwardMap): CarryForwardMap => {
  const normalized: CarryForwardMap = {};
  Object.entries(carryForwardIn).forEach(([key, value]) => {
    normalized[key] = Math.max(0, value || 0);
  });
  return normalized;
};

export function calculatePeriod(
  input: PeriodCalculationInput,
): PeriodCalculationResult {
  const personalTotals = new Map<string, number>();
  input.personalCharges.forEach((charge) => {
    personalTotals.set(charge.shareholderId, (personalTotals.get(charge.shareholderId) ?? 0) + charge.amount);
  });

  const normalizedCarryIn = normalizeCarryForwardIn(input.carryForwardIn ?? {});

  const shareMap = new Map<string, number>();
  input.shares.forEach((share) => {
    shareMap.set(share.shareholderId, (shareMap.get(share.shareholderId) ?? 0) + share.shares);
  });

  const shareholderIds = new Set<string>();
  input.shares.forEach((share) => shareholderIds.add(share.shareholderId));
  input.personalCharges.forEach((charge) => shareholderIds.add(charge.shareholderId));
  Object.keys(normalizedCarryIn).forEach((id) => shareholderIds.add(id));

  const totalShares = Array.from(shareMap.values()).reduce((acc, curr) => acc + curr, 0);
  const personalAddBackTotal = Array.from(personalTotals.values()).reduce(
    (acc, value) => acc + value,
    0,
  );
  const adjustedPool =
    input.netIncomeQB +
    input.psAddBack +
    personalAddBackTotal +
    input.taxOptimizationReturn +
    input.psPayoutAddBack -
    input.ownerSalary -
    input.uncollectible;

  const rows: HolderCalculation[] = Array.from(shareholderIds).map((shareholderId) => {
    const shares = shareMap.get(shareholderId) ?? 0;
    const shareRatio = totalShares > 0 ? shares / totalShares : 0;
    const preShare = adjustedPool * shareRatio;
    const personalCharge = personalTotals.get(shareholderId) ?? 0;
    const carryForwardIn = normalizedCarryIn[shareholderId] ?? 0;
    const payoutRaw = preShare - personalCharge - carryForwardIn;
    const payout = payoutRaw >= 0 ? payoutRaw : 0;
    const carryForwardOut = payoutRaw < 0 ? -payoutRaw : 0;
    return {
      shareholderId,
      shares,
      shareRatio,
      preShare,
      personalCharge,
      carryForwardIn,
      payoutRaw,
      payoutUnrounded: payout,
      payoutRounded: payout,
      carryForwardOut,
    };
  });

  const unroundedTotal = rows.reduce((acc, row) => acc + row.payoutUnrounded, 0);

  rows.forEach((row) => {
    row.payoutRounded = roundToCents(row.payoutUnrounded);
  });

  const roundedTotal = rows.reduce((acc, row) => acc + row.payoutRounded, 0);
  const expectedRoundedTotal = roundToCents(unroundedTotal);
  const roundingDelta = roundToCents(expectedRoundedTotal - roundedTotal);

  if (roundingDelta !== 0) {
    const indexToAdjust = findLargestPositivePayoutIndex(rows);
    if (indexToAdjust !== null) {
      rows[indexToAdjust].payoutRounded = roundToCents(
        rows[indexToAdjust].payoutRounded + roundingDelta,
      );
    } else if (rows.length > 0) {
      rows[0].payoutRounded = roundToCents(rows[0].payoutRounded + roundingDelta);
    }
  }

  const finalTotal = rows.reduce((acc, row) => acc + row.payoutRounded, 0);

  return {
    adjustedPool,
    personalAddBackTotal,
    totalShares,
    expectedRoundedTotal,
    actualRoundedTotal: finalTotal,
    roundingDelta,
    rows,
  };
}
