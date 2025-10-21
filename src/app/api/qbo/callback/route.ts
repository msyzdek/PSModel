import { NextRequest, NextResponse } from "next/server";
import {
  decodeState,
  exchangeCodeForTokens,
  getQboConfig,
  runProfitAndLossReport,
  parseMonthlyNetIncome,
} from "@/lib/qbo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const err = searchParams.get("error");
    if (err) {
      const desc = searchParams.get("error_description") ?? "";
      return NextResponse.json(
        { error: `OAuth error: ${err} ${desc}`.trim() },
        { status: 400 },
      );
    }

    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const realmId = searchParams.get("realmId");
    if (!code || !stateParam || !realmId) {
      return NextResponse.json(
        { error: "Missing required callback parameters" },
        { status: 400 },
      );
    }

    const state = decodeState(stateParam);
    const nonceCookie = req.cookies.get("qbo_oauth_nonce")?.value;
    if (!nonceCookie || nonceCookie !== state.nonce) {
      return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
    }

    const cfg = getQboConfig();
    const token = await exchangeCodeForTokens(
      code,
      cfg.redirectUri,
      cfg.clientId,
      cfg.clientSecret,
    );

    // Avoid logging full tokens
    console.log(
      `QBO auth OK for realm ${realmId}, access ****${token.access_token.slice(-6)}`,
    );

    const report = await runProfitAndLossReport({
      accessToken: token.access_token,
      realmId,
      year: state.year,
      env: cfg.env,
      minorVersion: cfg.minorVersion,
    });
    
    // Parse Net Income by month and upsert into Period
    const monthly = parseMonthlyNetIncome(report, state.year);

    // Determine if this is the first import for the target year
    const yearPrefix = `${state.year}-`;
    const existingCountForYear = await prisma.period.count({
      where: { month: { startsWith: yearPrefix } },
    });
    const isFirstYearImport = existingCountForYear === 0;

    // Base owner salary: December of previous year, else default 30000 (per month)
    const prevDecMonth = `${state.year - 1}-12`;
    const prevDec = await prisma.period.findUnique({
      where: { month: prevDecMonth },
      select: { ownerSalary: true },
    });
    const baseOwnerSalary = prevDec?.ownerSalary
      ? prevDec.ownerSalary.toString()
      : "30000";

    const results: { month: string; netIncomeQB: string; created: boolean }[] = [];
    for (const [month, amount] of Object.entries(monthly)) {
      const existing = await prisma.period.findUnique({ where: { month }, select: { id: true } });
      await prisma.period.upsert({
        where: { month },
        update: { netIncomeQB: amount },
        create: {
          month,
          netIncomeQB: amount,
          psAddBack: "0",
          ownerSalary: baseOwnerSalary,
        },
      });
      results.push({ month, netIncomeQB: amount, created: !existing });
    }

    // Redirect back to the year page with a success indicator for a banner
    const redirectTo = new URL(`${req.nextUrl.origin}/year/${state.year}`);
    redirectTo.searchParams.set("importedYear", String(state.year));
    return NextResponse.redirect(redirectTo);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
