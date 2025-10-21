#!/usr/bin/env ts-node

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import type {
  PeriodCalculationInput,
  PeriodCalculationResult,
} from "../src/lib/calculation";


type ShareholderCsvRow = {
  name: string;
  email: string;
  shares: number;
  ownerSalary?: number;
};

type NetIncomeCsvRow = {
  month: string;
  netIncome: number;
};

type PersonalExpenseCsvRow = {
  month: string;
  shareholderEmail: string;
  amount: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../prisma/data");

function parseCsv(filePath: string): string[][] {
  const raw = readFileSync(filePath, "utf-8");
  return raw
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function loadShareholders(): ShareholderCsvRow[] {
  const rows = parseCsv(path.join(DATA_DIR, "shareholders.csv"));
  const [header, ...data] = rows;
  const indices = Object.fromEntries(header.map((key, idx) => [key, idx]));

  return data.map((cells) => ({
    name: cells[indices["name"]] ?? "",
    email: cells[indices["email"]] ?? "",
    shares: Number(cells[indices["shares"]] ?? 0),
    ownerSalary: cells[indices["owner_salary"]]
      ? Number(cells[indices["owner_salary"]])
      : undefined,
  }));
}

function loadNetIncome(): NetIncomeCsvRow[] {
  const rows = parseCsv(path.join(DATA_DIR, "net_income_2025.csv"));
  const [header, ...data] = rows;
  const indices = Object.fromEntries(header.map((key, idx) => [key, idx]));

  return data.map((cells) => ({
    month: cells[indices["month"]] ?? "",
    netIncome: Number(cells[indices["net_income"]] ?? 0),
  }));
}

function loadPersonalExpenses(): PersonalExpenseCsvRow[] {
  const rows = parseCsv(path.join(DATA_DIR, "personal_expenses_2025.csv"));
  const [header, ...data] = rows;
  const indices = Object.fromEntries(header.map((key, idx) => [key, idx]));

  return data.map((cells) => ({
    month: cells[indices["month"]] ?? "",
    shareholderEmail: cells[indices["shareholder_email"]] ?? "",
    amount: Number(cells[indices["amount"]] ?? 0),
  }));
}

async function main() {
  const month = process.argv[2] ?? "2025-01";
  const outputPath = process.argv[3];

  const shareholders = loadShareholders();
  const netIncomeRows = loadNetIncome();
  const personalExpenseRows = loadPersonalExpenses();

  const monthNetIncome = netIncomeRows.find((row) => row.month === month)?.netIncome ?? 0;
  const ownerSalary = shareholders.find((row) => (row.ownerSalary ?? 0) > 0)?.ownerSalary ?? 0;

  const shareInputs = shareholders
    .filter((row) => row.shares > 0 && row.email)
    .map((row) => ({ shareholderId: row.email, shares: row.shares }));

  const personalChargesInputs = personalExpenseRows
    .filter((row) => row.month === month && row.amount > 0)
    .map((row) => ({ shareholderId: row.shareholderEmail, amount: row.amount }));

  const input: PeriodCalculationInput = {
    netIncomeQB: monthNetIncome,
    psAddBack: 0,
    ownerSalary,
    taxOptimizationReturn: 0,
    uncollectible: 0,
    psPayoutAddBack: 0,
    shares: shareInputs,
    personalCharges: personalChargesInputs,
    carryForwardIn: {} as Record<string, number>,
  };

  const moduleUrl = pathToFileURL(path.join(__dirname, "../src/lib/calculation.ts"));
  const { calculatePeriod } = await import(moduleUrl.href);
  const expected = calculatePeriod(input) as PeriodCalculationResult;

  const fixture = {
    metadata: {
      month,
      generatedAt: new Date().toISOString(),
    },
    input,
    expected: {
      adjustedPool: expected.adjustedPool,
      personalAddBackTotal: expected.personalAddBackTotal,
      totalShares: expected.totalShares,
      actualRoundedTotal: expected.actualRoundedTotal,
      roundingDelta: expected.roundingDelta,
      payouts: expected.rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.shareholderId] = row.payoutRounded;
        return acc;
      }, {}),
    },
  };

  const content = `${JSON.stringify(fixture, null, 2)}\n`;

  if (outputPath) {
    writeFileSync(outputPath, content, "utf-8");
  } else {
    process.stdout.write(content);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
