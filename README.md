## Development Setup

### Requirements

- Node.js 18.18 or newer
- npm 10 (bundled with current Node LTS)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` in the project root and add the SQLite connection string:

```bash
DATABASE_URL="file:./prisma/dev.db"
```

> Prefer an absolute path if you run commands outside the repo root, e.g. `file:/Users/you/Projects/ps_calculator/prisma/dev.db`.

### 3. Create and migrate the database

```bash
npx prisma migrate dev --name init
# or, if you only need the schema without migration history:
npx prisma db push
```

Both commands will create the `prisma/dev.db` file if it does not exist.

### 4. Seed development data (optional)

```bash
npm run db:seed
```

The seed script reads CSV fixtures from `prisma/data/`:

- `shareholders.csv`
- `net_income_2025.csv`
- `personal_expenses_2025.csv`

Update the CSVs before running the seed if you need custom data.

### 5. Start the app

```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Authentication (Google SSO)

This app uses Auth.js (NextAuth) with Google OAuth.

### Environment variables

Add these to your `.env` (do not commit real values):

```
# Required
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET= # generate with: openssl rand -base64 32

# Optional (recommended in dev)
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Optional policy
AUTH_ALLOWED_DOMAIN=yourcompany.com
AUTH_ALLOWED_EMAILS=alice@yourcompany.com,bob@yourcompany.com
```

### Google Cloud setup

1) Open Google Cloud Console → APIs & Services → OAuth consent screen.
   - User Type: Internal (project must be under your Workspace organization).
   - Scopes: keep defaults (openid, email, profile).
2) Credentials → Create credentials → OAuth client ID → Web application.
   - Authorized redirect URIs:
     - Dev: `http://localhost:3000/api/auth/callback/google`
     - Prod: `https://YOUR_DOMAIN/api/auth/callback/google`
   - Copy the Client ID and Client Secret into `.env`.

### Test locally

```
npm run dev
```

- Open `/signin` and click “Continue with Google”.
- If not signed in, any protected route (e.g., `/year/2025`) redirects to `/signin`.

### Authorization policy

- Allowed if the email ends with `@AUTH_ALLOWED_DOMAIN`, OR is listed in `AUTH_ALLOWED_EMAILS`.
- Shareholder records are not required for access. If present, the user session includes `shareholderId`.

### Troubleshooting

- redirect_uri_mismatch: Update the OAuth client’s “Authorized redirect URIs” to match your environment.
- [next-auth][error][CLIENT_FETCH_ERROR] Failed to fetch /api/auth/providers:
  - Ensure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` are set.
  - In dev, set `NEXTAUTH_URL` or `AUTH_TRUST_HOST=true` and restart.
  - Check `/api/auth/providers` and `/api/auth/session` in the browser; they should return JSON.
- AccessDenied after sign-in: The account doesn’t match your domain/allowlist.
- 404 at /auth/signin: The sign-in route is `/signin`.
- API calls return 401: Middleware fails closed for unauthenticated API requests by design.

### Rollout note

If you want a gradual rollout, you can introduce a feature flag like `AUTH_ENABLED`, and conditionally enforce in `src/middleware.ts`. Currently, enforcement is unconditional once env is set up.

## Useful scripts

- `npm run lint` – ESLint
- `npm run typecheck` – TypeScript `--noEmit`
- `npm run test` – Vitest unit tests
- `npm run build` – Next.js production build

## QBO Integration (Local)

- See `docs/qbo-local-setup.md` for step‑by‑step instructions to:
  - create a QBO Developer app and US sandbox,
  - set required env vars (`QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REDIRECT_URI`, `QBO_ENV`), and
  - run the OAuth flow at `/api/qbo/connect?year=YYYY` to fetch a Profit & Loss report (monthly, accrual) as raw JSON.
