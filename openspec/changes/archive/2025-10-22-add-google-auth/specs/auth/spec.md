## ADDED Requirements

### Requirement: Google OAuth Sign-In
The system SHALL provide Google OAuth sign-in for end users using company Google accounts.

#### Scenario: Start sign-in
- WHEN a user clicks "Continue with Google" on the sign-in page
- THEN the user is redirected to Google's OAuth consent flow with correct `client_id`, `redirect_uri`, and `state`/PKCE parameters

#### Scenario: Complete callback successfully
- WHEN Google redirects back with a valid authorization code
- THEN the system exchanges the code, validates the ID token, establishes a session, and redirects to the app home

#### Scenario: Sign-in cancelled or fails
- WHEN the user cancels consent or token exchange fails
- THEN the system displays a non-intrusive error and remains on the sign-in page; no session is created

### Requirement: Access Control Policy
The system MUST restrict access to authenticated users who meet the authorization policy.

#### Scenario: Allowed domain
- GIVEN `AUTH_ALLOWED_DOMAIN` is configured (e.g., `example.com`)
- WHEN the authenticated email ends with `@example.com`
- THEN access is allowed

#### Scenario: Allowed email list
- GIVEN `AUTH_ALLOWED_EMAILS` is configured as a comma-separated list of emails
- WHEN the authenticated email is included in the list
- THEN access is allowed

#### Scenario: Not authorized
- WHEN the authenticated email matches neither the allowed domain nor the allowed email list
- THEN access is denied with a clear message and an option to sign out/switch account

### Requirement: Shareholder Mapping by Email
The system SHOULD map the authenticated principal to a `Shareholder` by `email` when present. Being a Shareholder SHALL NOT be required for access; authorization is independent of Shareholder presence.

#### Scenario: Existing Shareholder
- GIVEN a `Shareholder` exists with `email` equal to the authenticated email
- THEN the session context includes a `shareholderId` for application logic

#### Scenario: No Shareholder found
- WHEN no `Shareholder` matches the authenticated email
- THEN the user remains authenticated and authorized (if policy satisfied) and application features that require a Shareholder record SHALL handle the null mapping gracefully (e.g., show a notice or limited access)

### Requirement: Protected Routes
All non-auth routes SHALL require an authenticated, authorized session.

#### Scenario: Unauthenticated user visiting app route
- WHEN an unauthenticated user navigates to an app route
- THEN the system redirects to the sign-in page

#### Scenario: API access without session
- WHEN a request is made to a protected API route without a valid session
- THEN the system returns 401 Unauthorized (or 302 to sign-in for browser requests) without leaking sensitive details

### Requirement: Session Management and Sign Out
The system SHALL maintain a session for authenticated users and support sign out.

#### Scenario: Session issued
- WHEN sign-in completes
- THEN a session JWT is issued with an appropriate expiration and minimal claims (email, name, optional `shareholderId`)

#### Scenario: Sign out
- WHEN a signed-in user requests sign out
- THEN the system clears the session and redirects to the sign-in page

### Requirement: Security and Token Validation
The system MUST validate tokens and protect the OAuth flow against common attacks.

#### Scenario: State/PKCE protection
- WHEN initiating OAuth
- THEN `state` (and PKCE where applicable) protects against CSRF and code injection

#### Scenario: ID token verification
- WHEN receiving tokens from Google
- THEN the system verifies the ID token signature, issuer, audience, expiry, and nonce before establishing a session

#### Scenario: Scope minimization
- WHEN requesting scopes from Google
- THEN the system requests only basic profile/email scopes required for authentication

### Requirement: Configuration and Fail-Safe Behavior
The system SHALL use environment variables for configuration and fail safe when misconfigured.

#### Scenario: Required environment variables
- GIVEN `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTH_SECRET` are required
- WHEN any are missing at runtime
- THEN the sign-in endpoint is disabled with a clear configuration error (and logs an actionable message)

#### Scenario: Optional policy configuration
- GIVEN `AUTH_ALLOWED_DOMAIN` and/or `AUTH_ALLOWED_EMAILS` are optional
- WHEN neither is set
- THEN default to deny-by-default for production and allow-all only in explicitly marked development mode
