
type QboEnv = "sandbox" | "production";

export type QboConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  env: QboEnv;
  minorVersion?: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in?: number;
};

export function getQboConfig(): QboConfig {
  const {
    QBO_CLIENT_ID,
    QBO_CLIENT_SECRET,
    QBO_REDIRECT_URI,
    QBO_SCOPE = "com.intuit.quickbooks.accounting",
    QBO_ENV = "sandbox",
    QBO_MINOR_VERSION,
  } = process.env as NodeJS.ProcessEnv & Record<string, string | undefined>;

  if (!QBO_CLIENT_ID) throw new Error("QBO_CLIENT_ID is not set");
  if (!QBO_CLIENT_SECRET) throw new Error("QBO_CLIENT_SECRET is not set");
  if (!QBO_REDIRECT_URI) throw new Error("QBO_REDIRECT_URI is not set");
  if (QBO_ENV !== "sandbox" && QBO_ENV !== "production")
    throw new Error("QBO_ENV must be 'sandbox' or 'production'");

  return {
    clientId: QBO_CLIENT_ID,
    clientSecret: QBO_CLIENT_SECRET,
    redirectUri: QBO_REDIRECT_URI,
    scope: QBO_SCOPE,
    env: QBO_ENV,
    minorVersion: QBO_MINOR_VERSION,
  };
}

// OAuth endpoints are the same for Sandbox and Production
const AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function apiBaseForEnv(env: QboEnv): string {
  return env === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
}) {
  const u = new URL(AUTH_BASE);
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", params.scope);
  u.searchParams.set("state", params.state);
  return u.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    // Intuit requires TLS; Next.js fetch handles that in Node runtime
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Token exchange failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as TokenResponse;
  if (!json.access_token || !json.refresh_token) {
    throw new Error("Token exchange response missing tokens");
  }
  return json;
}

export async function runProfitAndLossReport(opts: {
  accessToken: string;
  realmId: string;
  year: number;
  env: QboEnv;
  minorVersion?: string;
}) {
  const { accessToken, realmId, year, env, minorVersion } = opts;
  const base = apiBaseForEnv(env);
  const url = new URL(`${base}/v3/company/${encodeURIComponent(realmId)}/reports/ProfitAndLoss`);
  url.searchParams.set("start_date", `${year}-01-01`);
  url.searchParams.set("end_date", `${year}-12-31`);
  url.searchParams.set("summarize_column_by", "Month");
  url.searchParams.set("accounting_method", "Accrual");
  if (minorVersion) url.searchParams.set("minorversion", minorVersion);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `P&L fetch failed ${res.status} ${res.statusText} for year ${year}: ${text}`,
    );
  }
  return res.json();
}

// --- Simple state helpers (CSRF + carry 'year') ---
export type OauthState = { nonce: string; year: number };

export function encodeState(state: OauthState): string {
  const json = JSON.stringify(state);
  const b64 = Buffer.from(json).toString("base64");
  // URL-safe
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeState(s: string): OauthState {
  // restore padding
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(s.length / 4) * 4,
    "=",
  );
  const json = Buffer.from(padded, "base64").toString("utf8");
  const obj = JSON.parse(json);
  if (!obj || typeof obj.nonce !== "string" || typeof obj.year !== "number") {
    throw new Error("Invalid OAuth state payload");
  }
  return obj as OauthState;
}

// Route handlers should set/read cookies on the Response/Request directly.
