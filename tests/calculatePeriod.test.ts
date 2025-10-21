import { describe, expect, it } from "vitest";

import fixture from "./fixtures/period-2025-01.json";
import { calculatePeriod } from "@/lib/calculation";

describe("calculatePeriod", () => {
  it("matches expected payouts for January 2025", () => {
    const { input, expected } = fixture;

    const result = calculatePeriod(input);

    expect(result.adjustedPool).toBeCloseTo(expected.adjustedPool, 2);
    expect(result.personalAddBackTotal).toBeCloseTo(expected.personalAddBackTotal, 2);
    expect(result.totalShares).toBe(expected.totalShares);
    expect(result.actualRoundedTotal).toBeCloseTo(expected.actualRoundedTotal, 2);
    expect(result.roundingDelta).toBeCloseTo(expected.roundingDelta, 2);

    const payoutsByHolder = result.rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.shareholderId] = row.payoutRounded;
      return acc;
    }, {});

    for (const [shareholderId, amount] of Object.entries(expected.payouts)) {
      expect(payoutsByHolder[shareholderId]).toBeDefined();
      expect(payoutsByHolder[shareholderId]).toBeCloseTo(amount as number, 2);
    }
  });
});
