# Authentication Implementation

## Overview

This document describes the authentication system implemented for the Profit Share Calculator MVP.

## Backend Implementation

### Dependencies Added
- `python-jose[cryptography]` - JWT token generation and validation
- `passlib[bcrypt]` - Password hashing

### Components

#### 1. Authentication Service (`app/services/auth_service.py`)
- Password hashing and verification using bcrypt
- JWT token creation and validation
- Simple admin user authentication against environment variables

#### 2. Authentication Schemas (`app/schemas/auth.py`)
- `LoginRequest` - Login credentials
- `TokenResponse` - JWT token response
- `TokenData` - JWT payload data

#### 3. Authentication Middleware (`app/middleware/auth.py`)
- `get_current_user` - Dependency to extract and validate JWT from cookie
- `CurrentUser` - Type alias for dependency injection

#### 4. Authentication API (`app/api/auth.py`)
- `POST /api/auth/login` - Login endpoint that sets httpOnly cookie
- `POST /api/auth/logout` - Logout endpoint that clears cookie
- `GET /api/auth/me` - Get current user info (protected)

### Protected Endpoints

All existing API endpoints now require authentication:
- All `/api/periods/*` endpoints
- All `/api/calculate/*` endpoints

### Environment Variables

Add these to your `.env` file:

```bash
# Authentication (MVP)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# JWT Secret
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Important:** Change `JWT_SECRET_KEY` and `ADMIN_PASSWORD` in production!

## Frontend Implementation

### Components

#### 1. Auth Context (`lib/contexts/AuthContext.tsx`)
- Manages authentication state globally
- Provides `isAuthenticated`, `isLoading`, `username`, `logout`, and `checkAuth`
- Automatically redirects to login if not authenticated

#### 2. Protected Route (`components/auth/ProtectedRoute.tsx`)
- Wrapper component for protected pages
- Shows loading spinner while checking auth
- Prevents rendering until authenticated

#### 3. App Header (`components/layout/AppHeader.tsx`)
- Displays navigation and user info
- Includes logout button
- Hidden on login page

#### 4. Login Page (`app/login/page.tsx`)
- Username/password form
- Handles authentication errors
- Redirects to dashboard on success

### Usage

The root layout wraps the entire app with `AuthProvider`, and individual pages use `ProtectedRoute`:

```tsx
export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Your page content */}
    </ProtectedRoute>
  );
}
```

### API Client

The API client (`lib/utils/api-client.ts`) now includes `credentials: 'include'` to send cookies with all requests.

## Security Features

1. **httpOnly Cookies** - JWT stored in httpOnly cookie to prevent XSS attacks
2. **Password Hashing** - Admin password hashed with bcrypt (for future database storage)
3. **Token Expiration** - JWT tokens expire after 24 hours (configurable)
4. **CORS Configuration** - Credentials allowed only from configured origins
5. **Protected Endpoints** - All data endpoints require valid JWT

## Testing

### Backend

Test the authentication endpoints:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' \
  -c cookies.txt

# Get current user (with cookie)
curl http://localhost:8000/api/auth/me -b cookies.txt

# Access protected endpoint
curl http://localhost:8000/api/periods -b cookies.txt

# Logout
curl -X POST http://localhost:8000/api/auth/logout -b cookies.txt
```

### Frontend

1. Navigate to `http://localhost:3000`
2. You should be redirected to `/login`
3. Enter credentials (default: admin/changeme)
4. You should be redirected to the dashboard
5. Click logout to test logout functionality

## Future Enhancements

- Google SSO integration
- Role-based access control
- Multi-user support with database
- Password reset functionality
- Session management and refresh tokens
- Audit logging
