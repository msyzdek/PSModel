## 1. Implementation
- [x] 1.1 Add Auth.js (NextAuth) and Google provider dependency
- [x] 1.2 Create `src/lib/auth.ts` with Google provider config and JWT session strategy
- [x] 1.3 Add route handler `src/app/api/auth/[...nextauth]/route.ts`
- [x] 1.4 Implement authorization callback (allow domain and/or allowlisted emails)
- [x] 1.5 Map authenticated email to `Shareholder` and include `shareholderId` in session if found; do not require Shareholder for access
- [x] 1.6 Add `src/middleware.ts` to protect app routes and APIs (exclude `/api/auth`, `/auth/signin`, static, and public assets)
- [x] 1.7 Create sign-in page `src/app/(auth)/signin/page.tsx` with “Continue with Google” and error states
- [x] 1.8 Add sign-out control to nav or profile menu; ensure redirect after sign-out
- [x] 1.9 Update `.env.example` with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `AUTH_ALLOWED_DOMAIN`, `AUTH_ALLOWED_EMAILS`
- [x] 1.10 Add type-safe session helpers for Server Components and API routes

## 2. Testing
- [x] 2.1 Unit test: authorization policy (domain and allowlist)
- [x] 2.2 Unit test: session callback merges `shareholderId` when present (non-required)
- [x] 2.3 Integration test: protected route redirects unauthenticated requests
- [x] 2.4 Integration test: API route returns 401 without session
- [x] 2.5 Smoke test: sign-in success and cancel/failure handling

## 3. Documentation
- [x] 3.1 Update README with setup steps and env var descriptions
- [x] 3.2 Add troubleshooting for common misconfigurations
- [x] 3.3 Note rollout flag if using `AUTH_ENABLED`

## 4. Rollout
- [x] 4.1 Add optional `AUTH_ENABLED` to gate enforcement in staging
- [ ] 4.2 Verify allowed domain/emails configured in production
- [ ] 4.3 Monitor logs for failed sign-ins post-deploy
