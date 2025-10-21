-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Period" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "netIncomeQB" DECIMAL NOT NULL,
    "psAddBack" DECIMAL NOT NULL,
    "ownerSalary" DECIMAL NOT NULL,
    "taxOptimizationReturn" DECIMAL NOT NULL DEFAULT 0,
    "uncollectible" DECIMAL NOT NULL DEFAULT 0,
    "psPayoutAddBack" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Period" ("createdAt", "id", "month", "netIncomeQB", "ownerSalary", "psAddBack", "updatedAt") SELECT "createdAt", "id", "month", "netIncomeQB", "ownerSalary", "psAddBack", "updatedAt" FROM "Period";
DROP TABLE "Period";
ALTER TABLE "new_Period" RENAME TO "Period";
CREATE UNIQUE INDEX "Period_month_key" ON "Period"("month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
