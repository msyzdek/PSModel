# QuickBooks Online (QBO) – Local Setup

This app can authenticate with QuickBooks Online and run a Profit & Loss report for a given calendar year (accrual basis), returning the raw JSON. This guide walks you through setting it up locally in sandbox.

## Prerequisites

- Intuit Developer account (free): developer.intuit.com
- Company Admin access in the QBO sandbox you will connect
- Node.js 18.18+ and npm 10+

## 1) Create an app in Intuit Developer (Development keys)

1. Sign in at developer.intuit.com.
2. From the dashboard, create a new app for QuickBooks Online.
3. In the app settings, add a redirect URI exactly matching your local callback:
   - `http://localhost:3000/api/qbo/callback`
4. Select the scope `com.intuit.quickbooks.accounting`.
5. Copy your Development `Client ID` and `Client Secret`.

You don’t need Production keys until you connect to your live QBO company.

## 2) Create a US Sandbox company (one‑time)

1. In the Developer portal, open “Sandbox”.
2. Click “Add a company”.
3. Choose Region: United States; Product: QuickBooks Online.
4. Prefer “Create with sample data” so the P&L report has values.
5. Once created, you can open the sandbox and verify access.

## 3) Configure local environment

Create a `.env` file in the repo root (do not commit secrets). Use `.env.example` as a template and set the following values:

```
QBO_CLIENT_ID=your_dev_client_id
QBO_CLIENT_SECRET=your_dev_client_secret
QBO_REDIRECT_URI=http://localhost:3000/api/qbo/callback
QBO_ENV=sandbox
# QBO_MINOR_VERSION=75   # optional; omit to use default
QBO_ALLOWED_REALMID=your_company_realm_id
```

Also ensure your database URL is set (example for SQLite):

```
DATABASE_URL="file:./prisma/dev.db"
```

Notes
- Redirect URI must match Intuit app settings exactly (scheme/host/path).
- Use Development keys with the sandbox company. Production keys work only with a production QBO company.
- The app refuses to import unless `QBO_ALLOWED_REALMID` matches the realmId returned by Intuit. Set it once to lock the integration to your company. You can find the realmId in the callback URL the first time you connect or in QBO under Company ID.

## 4) Start the app

```
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## 5) Trigger the OAuth flow and run a report

Open this URL in your browser, replacing the year as needed:

```
http://localhost:3000/api/qbo/connect?year=2025
```

Approve the QuickBooks authorization for your sandbox company. You will be redirected back to the callback and receive a JSON response containing the raw Profit & Loss report for the given year, summarized by month on an accrual basis.

## Troubleshooting

- Invalid state/nonce: restart the flow from `/api/qbo/connect?year=YYYY` (nonce cookie is short‑lived).
- Token exchange 401: verify `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, and exact `QBO_REDIRECT_URI`.
- Report 401/403: ensure you authorized the sandbox company using Development keys.
- Empty P&L data: create the sandbox with sample data or add transactions.

## Production later (optional)

- Add your production redirect URI(s) to the app’s Production settings.
- Generate Production keys and set `QBO_ENV=production`.
- Re‑connect and authorize against your live QBO company.

## Current limitations in this scaffold

- Tokens are not persisted; we exchange and immediately call the report once.
- No background refresh or retry/backoff yet.

If you need multi‑company or multi‑ledger support in the future, we can discuss token storage, refresh flows, and parsing into your Prisma models.
