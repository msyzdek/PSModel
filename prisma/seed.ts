import { readFileSync } from 'fs';
import path from 'path';

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const SHAREHOLDERS_CSV = path.join(__dirname, 'data', 'shareholders.csv');

type CsvRow = {
  name: string;
  email: string;
  shares: number;
  ownerSalary?: number;
};

function parseCsv(): CsvRow[] {
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

function currentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function main() {
  const data = parseCsv();
  if (data.length === 0) {
    console.warn('shareholders.csv is empty; skipping seed.');
    return;
  }

  const monthKey = currentYearMonth();
  let ownerSalary = 0;

  const shareholderIdMap = new Map<string, string>();

  for (const entry of data) {
    if (entry.ownerSalary) {
      ownerSalary = entry.ownerSalary;
    }

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

  const period = await prisma.period.upsert({
    where: { month: monthKey },
    update: {
      ownerSalary: new Prisma.Decimal(ownerSalary),
    },
    create: {
      month: monthKey,
      netIncomeQB: new Prisma.Decimal(0),
      psAddBack: new Prisma.Decimal(0),
      ownerSalary: new Prisma.Decimal(ownerSalary),
    },
  });

  await prisma.shareAllocation.deleteMany({ where: { periodId: period.id } });

  const allocationData = data
    .filter((entry) => entry.shares > 0)
    .map((entry) => ({
      periodId: period.id,
      shareholderId: shareholderIdMap.get(entry.name)!,
      shares: new Prisma.Decimal(entry.shares),
    }));

  if (allocationData.length > 0) {
    await prisma.shareAllocation.createMany({ data: allocationData });
  }

  console.info(
    `Seeded ${data.length} shareholders with allocations for ${monthKey}.` +
      (ownerSalary ? ` Owner salary set to ${ownerSalary.toLocaleString()} USD.` : ''),
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
