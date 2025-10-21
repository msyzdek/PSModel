import { readFileSync } from 'fs';
import path from 'path';

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const SHAREHOLDERS_CSV = path.join(__dirname, 'data', 'shareholders.csv');
const NET_INCOME_CSV = path.join(__dirname, 'data', 'net_income_2025.csv');

type CsvRow = {
  name: string;
  email: string;
  shares: number;
  ownerSalary?: number;
};

function parseShareholdersCsv(): CsvRow[] {
  const raw = readFileSync(SHAREHOLDERS_CSV, 'utf-8');
  const [headerLine, ...rows] = raw.trim().split(/\r?\n/);

  const headers = headerLine.split(',').map((h) => h.trim());

  return rows
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = cells[index] ?? '';
      });
      return row;
    })
    .map((row) => ({
      name: row.name,
      email: row.email || '',
      shares: Number(row.shares ?? 0),
      ownerSalary: row.owner_salary ? Number(row.owner_salary) : undefined,
    }))
    .filter((row) => row.name && row.email && !Number.isNaN(row.shares));
}

type NetIncomeRow = {
  month: string;
  netIncome: number;
};

function parseNetIncomeCsv(): NetIncomeRow[] {
  const raw = readFileSync(NET_INCOME_CSV, 'utf-8');
  const [headerLine, ...rows] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim());
  return rows
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = cells[index] ?? '';
      });
      return row;
    })
    .map((row) => ({
      month: row.month,
      netIncome: Number(row.net_income ?? 0),
    }))
    .filter((row) => row.month && !Number.isNaN(row.netIncome));
}

async function main() {
  const shareholders = parseShareholdersCsv();
  if (shareholders.length === 0) {
    console.warn('shareholders.csv is empty; skipping seed.');
    return;
  }

  const netIncomeRows = parseNetIncomeCsv();
  if (netIncomeRows.length === 0) {
    console.warn('net_income_2025.csv is empty; skipping seed.');
    return;
  }

  const ownerSalaryEntry = shareholders.find((entry) => entry.ownerSalary && entry.ownerSalary > 0);
  const ownerSalary = ownerSalaryEntry?.ownerSalary ?? 0;

  const shareholderIdMap = new Map<string, string>();

  for (const entry of shareholders) {
    const record = await prisma.shareholder.upsert({
      where: { email: entry.email },
      update: {
        active: true,
        email: entry.email,
        name: entry.name,
      },
      create: {
        name: entry.name,
        email: entry.email,
        active: true,
      },
    });

    shareholderIdMap.set(entry.name, record.id);
  }

  for (const { month, netIncome } of netIncomeRows) {
    const period = await prisma.period.upsert({
      where: { month },
      update: {
        netIncomeQB: new Prisma.Decimal(netIncome),
        ownerSalary: new Prisma.Decimal(ownerSalary),
        psAddBack: new Prisma.Decimal(0),
      },
      create: {
        month,
        netIncomeQB: new Prisma.Decimal(netIncome),
        psAddBack: new Prisma.Decimal(0),
        ownerSalary: new Prisma.Decimal(ownerSalary),
      },
    });

    await prisma.shareAllocation.deleteMany({ where: { periodId: period.id } });

    const allocationData = shareholders
      .filter((entry) => entry.shares > 0)
      .map((entry) => ({
        periodId: period.id,
        shareholderId: shareholderIdMap.get(entry.name)!,
        shares: new Prisma.Decimal(entry.shares),
      }));

    if (allocationData.length > 0) {
      await prisma.shareAllocation.createMany({ data: allocationData });
    }
  }

  console.info(
    `Seeded ${shareholders.length} shareholders and ${netIncomeRows.length} periods.` +
      (ownerSalary ? ` Owner salary set to ${ownerSalary.toLocaleString()} USD per month.` : ''),
  );
}

main()
  .catch((error) => {
    console.error('Error seeding shareholders', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
