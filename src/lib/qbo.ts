
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

// --- Report parsing helpers ---
type ColData = { value?: string | null };
type ReportRow = {
  type?: string;
  Header?: { ColData?: ColData[] };
  Rows?: { Row?: ReportRow[] };
  ColData?: ColData[];
  Summary?: { ColData?: ColData[] };
};

export function parseMonthlyNetIncome(report: any, year: number): Record<string, string> {
  const rows: ReportRow[] = report?.Rows?.Row ?? [];

  function collectAllRows(r: ReportRow[]): ReportRow[] {
    const out: ReportRow[] = [];
    for (const row of r ?? []) {
      out.push(row);
      if (row.Rows?.Row?.length) out.push(...collectAllRows(row.Rows.Row));
    }
    return out;
  }

  const flat = collectAllRows(rows);

  const isNetIncomeText = (s: string | undefined) =>
    typeof s === "string" && /\bnet\s+income\b/i.test(s);

  function rowTextCandidates(row: ReportRow): string[] {
    const texts: string[] = [];
    const add = (arr?: ColData[]) => {
      for (const c of arr ?? []) if (c?.value) texts.push(String(c.value));
    };
    add(row.Header?.ColData);
    add(row.ColData);
    add(row.Summary?.ColData);
    return texts;
  }

  const netIncomeRow = flat.find((row) => rowTextCandidates(row).some(isNetIncomeText));

  const targetRow = netIncomeRow ?? flat.filter((r) => r.Summary?.ColData?.length).slice(-1)[0];
  if (!targetRow) throw new Error("Could not locate Net Income row in report");

  const cells: ColData[] = targetRow.Summary?.ColData ?? targetRow.ColData ?? [];
  if (!cells.length) throw new Error("Net Income row has no data cells");

  const numeric = cells
    .map((c) => (c?.value ?? "").trim())
    .map((v) => ({ raw: v, num: moneyStringToNumberOrNull(v) }))
    .filter((x) => x.num !== null) as { raw: string; num: number }[];

  // We expect 12 monthly numbers; there may also be a Total. Take the last 12 numbers.
  const lastTwelve = numeric.slice(-12);
  if (lastTwelve.length !== 12) {
    throw new Error(`Expected 12 monthly values, found ${lastTwelve.length}`);
  }

  const result: Record<string, string> = {};
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, "0")}`;
    const v = lastTwelve[m - 1];
    result[ym] = normalizeMoneyString(v.raw);
  }
  return result;
}

function moneyStringToNumberOrNull(v: string): number | null {
  if (!v) return null;
  const trimmed = v.trim();
  if (trimmed === "—" || trimmed === "–" || trimmed === "-") return 0;
  // Handle (123.45) format
  const neg = /^\(.*\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[(),]/g, "");
  const num = Number(cleaned);
  if (Number.isFinite(num)) return neg ? -Math.abs(num) : num;
  return null;
}

function normalizeMoneyString(v: string): string {
  if (!v) return "0";
  const trimmed = v.trim();
  if (trimmed === "—" || trimmed === "–" || trimmed === "-") return "0";
  const neg = /^\(.*\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[(),]/g, "");
  return neg ? `-${cleaned}` : cleaned;
}
