# Project Context

## Purpose
Profit Share Calculator (PSC) is an internal web app to import monthly Net Income from QuickBooks Online (QBO), apply company‑specific adjustments, and compute monthly profit‑share payouts per shareholder. It provides:
- A Year overview grid with month‑by‑month totals, shares, personal charges, and payouts.
- A Month detail editor to enter adjustments and per‑holder inputs, with live calculation and carry‑forward of deficits.
- A QBO OAuth flow to import an annual Profit & Loss report (accrual, monthly) and seed/update Periods.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript 5
- Node.js 18.18+ runtime
- Prisma ORM with SQLite for local dev/tests (`prisma/schema.prisma`)
- Tailwind CSS v4 via PostCSS plugin; Next Font for typography
- Vitest 3 for unit/integration tests
- ESLint 9 (flat config) + Prettier 3 (+ Tailwind plugin)
- Zod for runtime typing (available), date‑fns (available)

## Project Conventions

### Code Style
- TypeScript strict mode (`tsconfig.json: strict: true`, `noEmit: true`). Path alias `@/*` to `src/*`.
- ESLint extends Next core‑web‑vitals + TypeScript + Prettier (`eslint.config.mjs`).
- Prettier 3 with `prettier-plugin-tailwindcss`; run `npm run format` / `format:check`.
- Naming and keys:
  - Months use the canonical `YYYY-MM` format; helpers in `src/lib/date.ts`.
  - Monetary values are numbers in code, formatted with `Intl.NumberFormat('en-US', { currency: 'USD' })` at the edge/UI.
  - Database numeric fields use Prisma `Decimal` mapped to strings in upserts where appropriate.

### Architecture Patterns
- App Router with mostly Server Components; Client Components only for interactive UI pieces (e.g., banners, grid actions).
- Route Handlers under `src/app/api/*` for QBO OAuth connect/callback.
- Domain logic lives in `src/lib/`:
  - `calculation.ts` — pure, deterministic monthly payout engine with rounding and carry‑forward rules.
  - `qbo.ts` — OAuth URL builder, token exchange, P&L report fetch, and robust Net Income parser.
  - `date.ts` — `YYYY-MM` helpers and month names.
  - `prisma.ts` — singleton Prisma client pattern for Next.
- Persistence modeled in Prisma (`prisma/schema.prisma`): `Shareholder`, `Period`, `ShareAllocation`, `PersonalCharge`.
  - Carry‑forward is derived at runtime from prior months and not stored.
  - Re‑imports only update `Period.netIncomeQB`; other fields remain as entered.

### Testing Strategy
- Vitest with a dedicated SQLite test DB (`tests/setup/globalSetup.ts` sets `DATABASE_URL=file:./prisma/test.db` and runs `prisma db push`).
- Unit tests for core logic:
  - `tests/calculatePeriod.test.ts` validates the calculation engine with fixtures.
  - `tests/qbo/parser.test.ts` validates P&L Net Income parsing against header/no‑header fixtures.
- Integration‑level tests for route handlers with mocks: `tests/qbo/routes.test.ts`.
- Useful scripts: `npm run test`, `test:watch`, `test:coverage`.

### Git Workflow
- Keep commits atomic and scoped to the files you touched; use the `committer` helper when committing.
- Avoid destructive git commands; follow `AGENTS.md` Git Safety Rules.
- Prefer short‑lived feature branches and PRs; rebase or squash on merge per repository norms.

## Domain Context
- Core definitions per docs/mvp1.md:
  - Adjusted pool per month = `net_income_qb + ps_addback + personal_addback_total + ps_payout_addback - owner_salary - uncollectible - tax_optimization_return`.
  - Each holder’s `pre_share = adjusted_pool * (holder_shares / total_shares)`.
  - Payout has a zero floor; deficits become `carry_forward_out` into the next month.
  - Rounding is half‑up to cents; any rounding delta is reconciled to the largest positive payout.
- Shares are monthly values; defaults seed from the previous month when creating a new month.
- Owner salary default: previous December’s value if available; otherwise `30000` per month (see callback route logic).
- Import flow: `/api/qbo/connect?year=YYYY` → Intuit OAuth → `/api/qbo/callback` → fetch accrual P&L summarized by Month → parse Net Income → upsert 12 Period rows.

## Important Constraints
- Environment and secrets:
  - Do not commit or edit `.env` in automation; users own configuration. Use `.env.example` as a template.
  - QBO integration is locked to a single `QBO_ALLOWED_REALMID`; callback refuses imports unless it matches.
- Supported time window: Years 2000–2100 are accepted by routes.
- Tokens are not persisted; report fetch happens immediately after token exchange (scaffold). No refresh/rotation yet.
- Currency is USD; all amounts rounded to cents for display and totals.
- SQLite is used locally; Prisma `Decimal` fields model currency in the DB.

## External Dependencies
- QuickBooks Online (Intuit) APIs:
  - OAuth2: `https://appcenter.intuit.com/connect/oauth2` and token URL `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`.
  - Reports: `GET /v3/company/{realmId}/reports/ProfitAndLoss` with `start_date`, `end_date`, `summarize_column_by=Month`, `accounting_method=Accrual`, optional `minorversion`.
- Prisma Client for data access; SQLite for development/testing.
- Next.js runtime (Edge/Node as configured by route) and Fetch API.
