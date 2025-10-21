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
