## Context
Next.js 15 (App Router) PSC app with no existing user auth. We will add Google SSO using Auth.js (NextAuth) without a DB adapter initially, keeping sessions as JWT. Authorization is restricted by allowed domain and/or explicit allowlist of emails. Mapping to `Shareholder` uses the existing Prisma model via the email field but is not required for access.

## Goals / Non-Goals
- Goals: Secure Google sign-in; protect routes; minimal user/account persistence; domain/allowlist authorization; clear configuration.
- Non-Goals: Full RBAC; admin UI for users; group-based authorization; multi-IdP federation; storing Google access tokens; Prisma adapter and user tables (initially).

## Decisions
- Library: Auth.js (NextAuth) Google provider for robust, battle-tested OAuth and Next.js integration.
- Session: `strategy: 'jwt'` (stateless) to avoid DB migrations now; add Prisma adapter later if needed.
- Authorization: allow if email matches `AUTH_ALLOWED_DOMAIN` OR is present in `AUTH_ALLOWED_EMAILS`.
- Shareholder mapping: lookup by `Shareholder.email`; include `shareholderId` in session when found; not required for access.
- Route protection: `middleware.ts` guarding all app routes except auth endpoints and public assets.
- Environment: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `AUTH_ALLOWED_DOMAIN`, `AUTH_ALLOWED_EMAILS`.

## Alternatives Considered
- Custom OAuth implementation: higher security/maintenance burden; no benefit over Auth.js.
- Group-based authorization: viable via Directory API (service account with domain-wide delegation), but deferred to reduce setup complexity.
- Prisma adapter now: adds `User/Account/Session` models and migrations; not required for SSO-only and increases scope.

## Risks / Trade-offs
- JWT session invalidation: revocation is time-bound to expiry; acceptable for initial scope.
- Domain-only authorization: less granular than groups; mitigated by `AUTH_ALLOWED_EMAILS` and potential future enhancement to groups.
- Missing Shareholder mapping: authenticated users without Shareholder may need limited access UX.

## Migration Plan
1) Ship behind `AUTH_ENABLED` (optional) and verify in staging.
2) Configure domain/allowlist; test with pilot users.
3) Enable enforcement in production; monitor sign-in failures.
4) Consider adding Prisma adapter and RBAC in a future change.

## Open Questions
- Should we require both allowed domain AND explicit allowlist for production?
- Do we need roles (viewer/admin) now or later?
- Should unaffiliated authenticated users see a limited dashboard or a hard deny?
