import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl, encodeState, getQboConfig } from "@/lib/qbo";

export const dynamic = "force-dynamic"; // API route

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get("year");
    if (!yearStr) {
      return NextResponse.json({ error: "Missing 'year' query param" }, { status: 400 });
    }
    const year = Number(yearStr);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const cfg = getQboConfig();

    const nonce = crypto.randomUUID();
    const state = encodeState({ nonce, year });
    const authUrl = buildAuthUrl({
      clientId: cfg.clientId,
      redirectUri: cfg.redirectUri,
      scope: cfg.scope,
      state,
    });

    const res = NextResponse.redirect(authUrl);
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("qbo_oauth_nonce", nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 10 * 60,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
