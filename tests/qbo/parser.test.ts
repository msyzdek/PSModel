import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseMonthlyNetIncome } from "@/lib/qbo";

function loadFixture(name: string) {
  const p = path.join(__dirname, "fixtures", name);
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

describe("parseMonthlyNetIncome", () => {
  it("maps 12 months using header, skipping Account and Total", () => {
    const report = loadFixture("pl_monthly_header.json");
    const res = parseMonthlyNetIncome(report, 2025);
    expect(Object.keys(res).length).toBe(12);
    expect(res["2025-01"]).toBe("100");
    expect(res["2025-02"]).toBe("-50"); // parentheses → negative
    expect(res["2025-03"]).toBe("0"); // em dash → 0
    expect(res["2025-04"]).toBe("300.50");
    expect(res["2025-12"]).toBe("70");
  });

  it("falls back when header missing and takes first 12 numeric cells", () => {
    const report = loadFixture("pl_monthly_no_header.json");
    const res = parseMonthlyNetIncome(report, 2025);
    expect(res["2025-01"]).toBe("1");
    expect(res["2025-12"]).toBe("12");
  });
});

