-- CreateTable
CREATE TABLE "Shareholder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "netIncomeQB" DECIMAL NOT NULL,
    "psAddBack" DECIMAL NOT NULL,
    "ownerSalary" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShareAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "shareholderId" TEXT NOT NULL,
    "shares" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShareAllocation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShareAllocation_shareholderId_fkey" FOREIGN KEY ("shareholderId") REFERENCES "Shareholder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "shareholderId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalCharge_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PersonalCharge_shareholderId_fkey" FOREIGN KEY ("shareholderId") REFERENCES "Shareholder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shareholder_email_key" ON "Shareholder"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Period_month_key" ON "Period"("month");

-- CreateIndex
CREATE UNIQUE INDEX "ShareAllocation_periodId_shareholderId_key" ON "ShareAllocation"("periodId", "shareholderId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalCharge_periodId_shareholderId_key" ON "PersonalCharge"("periodId", "shareholderId");
