## Why
PSC currently lacks user authentication. We need secure, convenient sign-in for internal users and to restrict access to authorized personnel only. Google SSO reduces credential friction, improves security, and aligns with existing company accounts.

## What Changes
- Add Google OAuth sign-in via Auth.js (NextAuth) Google provider.
- Gate app routes behind authentication; unauthenticated users are redirected to sign-in.
- Authorization policy: allow only company users via allowed domain and/or explicit allowlist of emails (no group checks initially).
- Session strategy: stateless JWT sessions (no DB) initially.
- Map authenticated principal to `Shareholder` by `email` for app-level permissions; being a Shareholder is NOT required to access the app.
- Add sign-in UI with “Continue with Google” and sign-out.
- Add route protection middleware and session helpers.
- Add environment variables and update `.env.example` documentation.
- Add tests for auth callbacks, protected routes, authorization policy (domain + allowlist), and error handling.

## Impact
- Affected specs: auth
- Affected code (indicative):
  - `src/app/api/auth/[...nextauth]/route.ts` (Auth.js route handler)
  - `src/middleware.ts` (route protection)
  - `src/app/(auth)/signin/page.tsx` (sign-in page)
  - `src/lib/auth.ts` (Auth.js config, session helpers)
  - `src/app/layout.tsx` or `src/components/Nav` (session-aware UI + sign out)
  - `.env.example` (GOOGLE_CLIENT_ID/SECRET, AUTH_SECRET, AUTH_ALLOWED_DOMAIN/EMAILS)

Note: This will place the app behind authentication. If needed, we can introduce a feature flag (e.g., `AUTH_ENABLED=true`) for gradual rollout.
