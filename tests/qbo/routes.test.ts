import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeState } from "@/lib/qbo";

// Route handlers
import * as ConnectRoute from "@/app/api/qbo/connect/route";
import * as CallbackRoute from "@/app/api/qbo/callback/route";

// Utility to extract URL from a redirect Response
function redirectedTo(res: Response): string | null {
  const loc = res.headers.get("location");
  return loc;
}

beforeEach(async () => {
  await prisma.shareAllocation.deleteMany();
  await prisma.personalCharge.deleteMany();
  await prisma.period.deleteMany();
  await prisma.shareholder.deleteMany();
});

describe("/api/qbo/connect", () => {
  it("redirects to Intuit with state that encodes the year", async () => {
    const req = new NextRequest("http://localhost:3000/api/qbo/connect?year=2025");
    const res = await ConnectRoute.GET(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = redirectedTo(res);
    expect(loc).toBeTruthy();
    expect(loc).toMatch(/appcenter\.intuit\.com/);
    const url = new URL(loc!);
    const state = url.searchParams.get("state");
    expect(state).toBeTruthy();
    // decode with our own util to ensure the year is passed through
    const decoded = JSON.parse(Buffer.from(state!.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(state!.length / 4) * 4, "="), "base64").toString("utf8"));
    expect(decoded.year).toBe(2025);
  });

  it("returns 400 for missing year", async () => {
    const req = new NextRequest("http://localhost:3000/api/qbo/connect");
    const res = await ConnectRoute.GET(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/qbo/callback", () => {
  // Partial mock QBO lib to avoid network
  vi.mock("@/lib/qbo", async () => {
    const actual = await vi.importActual<typeof import("@/lib/qbo")>("@/lib/qbo");
    return {
      ...actual,
      exchangeCodeForTokens: vi.fn().mockResolvedValue({
        access_token: "at",
        refresh_token: "rt",
        token_type: "bearer",
        expires_in: 3600,
      }),
      runProfitAndLossReport: vi.fn().mockResolvedValue({}),
      parseMonthlyNetIncome: vi.fn().mockReturnValue(
        Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [
            `2025-${String(i + 1).padStart(2, "0")}`,
            String((i + 1) * 10),
          ]),
        ),
      ),
    };
  });

  it("rejects when nonce cookie missing or mismatched", async () => {
    const state = encodeState({ nonce: "nonce-1", year: 2025 });
    const url = `http://localhost:3000/api/qbo/callback?code=abc&realmId=${process.env.QBO_ALLOWED_REALMID}&state=${state}`;
    const req = new NextRequest(url); // no cookie
    const res = await CallbackRoute.GET(req);
    expect(res.status).toBe(400);
  });

  it("aborts with 403 if realm lock is not set", async () => {
    const saved = process.env.QBO_ALLOWED_REALMID;
    delete process.env.QBO_ALLOWED_REALMID;
    const state = encodeState({ nonce: "nonce-2", year: 2025 });
    const url = `http://localhost:3000/api/qbo/callback?code=abc&realmId=123&state=${state}`;
    const baseReq = new Request(url, { headers: new Headers({ cookie: "qbo_oauth_nonce=nonce-2" }) });
    const req = new NextRequest(baseReq);
    const res = await CallbackRoute.GET(req);
    expect(res.status).toBe(403);
    process.env.QBO_ALLOWED_REALMID = saved;
  });

  it("imports 12 months on first run and redirects with counts", async () => {
    const state = encodeState({ nonce: "nonce-3", year: 2025 });
    const url = `http://localhost:3000/api/qbo/callback?code=abc&realmId=${process.env.QBO_ALLOWED_REALMID}&state=${state}`;
    const baseReq = new Request(url, { headers: new Headers({ cookie: "qbo_oauth_nonce=nonce-3" }) });
    const req = new NextRequest(baseReq);
    const res = await CallbackRoute.GET(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    const locHeader = res.headers.get("location");
    expect(locHeader).toBeTruthy();
    const loc = new URL(locHeader!);
    expect(loc.pathname).toBe("/year/2025");
    expect(loc.searchParams.get("created")).toBe("12");
    expect(loc.searchParams.get("updated")).toBe("0");
    const rows = await prisma.period.findMany({ where: { month: { startsWith: "2025-" } } });
    expect(rows).toHaveLength(12);
  });

  it("uses previous December ownerSalary when present; else defaults to 30000", async () => {
    // Seed Dec 2024
    await prisma.period.create({
      data: {
        month: "2024-12",
        netIncomeQB: "0",
        psAddBack: "0",
        ownerSalary: "8500",
      },
    });
    const state = encodeState({ nonce: "nonce-4", year: 2025 });
    const url = `http://localhost:3000/api/qbo/callback?code=abc&realmId=${process.env.QBO_ALLOWED_REALMID}&state=${state}`;
    const baseReq = new Request(url, { headers: new Headers({ cookie: "qbo_oauth_nonce=nonce-4" }) });
    const req = new NextRequest(baseReq);
    const res = await CallbackRoute.GET(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    const jan = await prisma.period.findUnique({ where: { month: "2025-01" } });
    expect(jan?.ownerSalary.toString()).toBe("8500");

    // Cleanup and test defaulting
    await prisma.period.deleteMany({ where: { month: { startsWith: "2025-" } } });
    await prisma.period.delete({ where: { month: "2024-12" } });

    const state2 = encodeState({ nonce: "nonce-5", year: 2025 });
    const url2 = `http://localhost:3000/api/qbo/callback?code=abc&realmId=${process.env.QBO_ALLOWED_REALMID}&state=${state2}`;
    const req2 = new NextRequest(new Request(url2, { headers: new Headers({ cookie: "qbo_oauth_nonce=nonce-5" }) }));
    const res2 = await CallbackRoute.GET(req2);
    expect(res2.status).toBeGreaterThanOrEqual(300);
    const jan2 = await prisma.period.findUnique({ where: { month: "2025-01" } });
    expect(jan2?.ownerSalary.toString()).toBe("30000");
  });

  it("on re-import, updates existing months and applies base ownerSalary to gaps", async () => {
    // Seed one existing month with custom ownerSalary
    await prisma.period.create({
      data: {
        month: "2025-01",
        netIncomeQB: "0",
        psAddBack: "0",
        ownerSalary: "1234",
      },
    });
    // Seed previous December to define base
    await prisma.period.create({
      data: {
        month: "2024-12",
        netIncomeQB: "0",
        psAddBack: "0",
        ownerSalary: "7777",
      },
    });
    const state = encodeState({ nonce: "nonce-6", year: 2025 });
    const url = `http://localhost:3000/api/qbo/callback?code=abc&realmId=${process.env.QBO_ALLOWED_REALMID}&state=${state}`;
    const req = new NextRequest(new Request(url, { headers: new Headers({ cookie: "qbo_oauth_nonce=nonce-6" }) }));
    const res = await CallbackRoute.GET(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    const all = await prisma.period.findMany({ where: { month: { startsWith: "2025-" } }, orderBy: { month: "asc" } });
    expect(all).toHaveLength(12);
    const jan = all.find((p) => p.month === "2025-01")!;
    const feb = all.find((p) => p.month === "2025-02")!;
    expect(jan.ownerSalary.toString()).toBe("1234"); // unchanged
    expect(feb.ownerSalary.toString()).toBe("7777"); // base applied to gap
  });

  it("re-import preserves other Period fields and does not touch allocations/charges", async () => {
    // Seed one shareholder
    const holder = await prisma.shareholder.create({
      data: { name: "Alice", email: "alice@example.com" },
    });
    // Seed existing period with non-netIncome fields set
    const period = await prisma.period.create({
      data: {
        month: "2025-01",
        netIncomeQB: "0",
        psAddBack: "11",
        ownerSalary: "1234",
        taxOptimizationReturn: "22",
        uncollectible: "33",
        psPayoutAddBack: "44",
      },
    });
    // Related data
    await prisma.shareAllocation.create({
      data: { periodId: period.id, shareholderId: holder.id, shares: "100" },
    });
    await prisma.personalCharge.create({
      data: { periodId: period.id, shareholderId: holder.id, amount: "50", memo: "Test" },
    });

    // Re-import year; mocked parser returns Jan=10
    const state = encodeState({ nonce: "nonce-7", year: 2025 });
    const url = `http://localhost:3000/api/qbo/callback?code=abc&realmId=${process.env.QBO_ALLOWED_REALMID}&state=${state}`;
    const req = new NextRequest(new Request(url, { headers: new Headers({ cookie: "qbo_oauth_nonce=nonce-7" }) }));
    const res = await CallbackRoute.GET(req);
    expect(res.status).toBeGreaterThanOrEqual(300);

    const after = await prisma.period.findUnique({ where: { month: "2025-01" } });
    expect(after).toBeTruthy();
    expect(after!.netIncomeQB.toString()).toBe("10"); // updated from parser
    // These fields should remain unchanged
    expect(after!.psAddBack.toString()).toBe("11");
    expect(after!.ownerSalary.toString()).toBe("1234");
    expect(after!.taxOptimizationReturn.toString()).toBe("22");
    expect(after!.uncollectible.toString()).toBe("33");
    expect(after!.psPayoutAddBack.toString()).toBe("44");

    // Related rows unchanged
    const allocs = await prisma.shareAllocation.findMany({ where: { periodId: period.id } });
    const charges = await prisma.personalCharge.findMany({ where: { periodId: period.id } });
    expect(allocs).toHaveLength(1);
    expect(allocs[0].shares.toString()).toBe("100");
    expect(charges).toHaveLength(1);
    expect(charges[0].amount.toString()).toBe("50");
  });
});
