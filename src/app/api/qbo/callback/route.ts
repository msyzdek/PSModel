import { NextRequest, NextResponse } from "next/server";
import {
  decodeState,
  exchangeCodeForTokens,
  getQboConfig,
  runProfitAndLossReport,
} from "@/lib/qbo";

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

    return NextResponse.json({
      ok: true,
      realmId,
      year: state.year,
      report, // raw JSON; no parsing yet
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
