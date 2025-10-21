# Environment Variables Reference

This document describes all environment variables used in the Profit Share Calculator application.

## Backend Environment Variables

### Database Configuration

#### `DATABASE_URL`
- **Description**: SQLAlchemy database connection string
- **Required**: Yes
- **Default**: `sqlite:///./profit_share.db`
- **Example**: `sqlite:///./data/profit_share.db`
- **Production**: Consider PostgreSQL: `postgresql://user:password@host:port/database`

### API Configuration

#### `API_HOST`
- **Description**: Host address for the API server
- **Required**: No
- **Default**: `0.0.0.0`
- **Example**: `0.0.0.0` (all interfaces) or `127.0.0.1` (localhost only)

#### `API_PORT`
- **Description**: Port number for the API server
- **Required**: No
- **Default**: `8000`
- **Example**: `8000`

#### `API_RELOAD`
- **Description**: Enable auto-reload on code changes (development only)
- **Required**: No
- **Default**: `true`
- **Example**: `true` (development), `false` (production)
- **Production**: Set to `false`

### CORS Configuration

#### `CORS_ORIGINS`
- **Description**: Comma-separated list of allowed origins for CORS
- **Required**: Yes
- **Default**: `http://localhost:3000,http://127.0.0.1:3000`
- **Example**: `https://app.example.com,https://www.example.com`
- **Production**: Set to your production frontend URL(s) only
- **Security**: Never use `*` in production

### Authentication Configuration

#### `ADMIN_USERNAME`
- **Description**: Admin username for MVP authentication
- **Required**: Yes
- **Default**: `admin`
- **Example**: `admin`
- **Security**: Change from default in production

#### `ADMIN_PASSWORD`
- **Description**: Admin password for MVP authentication
- **Required**: Yes
- **Default**: `changeme`
- **Example**: Use a strong password (min 12 characters, mixed case, numbers, symbols)
- **Security**: **MUST** be changed in production
- **Note**: Password is hashed before storage

### JWT Configuration

#### `JWT_SECRET_KEY`
- **Description**: Secret key for signing JWT tokens
- **Required**: Yes
- **Default**: `your-secret-key-change-in-production`
- **Example**: Generate with: `openssl rand -hex 32`
- **Security**: **MUST** be changed in production
- **Note**: Use a cryptographically secure random string (min 32 characters)

#### `JWT_ALGORITHM`
- **Description**: Algorithm used for JWT signing
- **Required**: No
- **Default**: `HS256`
- **Example**: `HS256`
- **Note**: Do not change unless you know what you're doing

#### `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- **Description**: JWT token expiration time in minutes
- **Required**: No
- **Default**: `1440` (24 hours)
- **Example**: `1440` (24 hours), `60` (1 hour)
- **Security**: Shorter is more secure but less convenient

## Frontend Environment Variables

### API Configuration

#### `NEXT_PUBLIC_API_URL`
- **Description**: Backend API base URL
- **Required**: Yes
- **Default**: `http://localhost:8000`
- **Example**: 
  - Development: `http://localhost:8000`
  - Production: `https://api.example.com`
- **Note**: Must be prefixed with `NEXT_PUBLIC_` to be accessible in browser

## Docker Compose Environment Variables

When using Docker Compose, you can set these in a `.env` file in the project root:

```bash
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here

# JWT secret
JWT_SECRET_KEY=your-secret-key-here
```

These will be passed to the backend container automatically.

## Environment File Examples

### Backend `.env` (Development)

```bash
# Database
DATABASE_URL=sqlite:///./profit_share.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dev-password-123

# JWT
JWT_SECRET_KEY=dev-secret-key-not-for-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Backend `.env` (Production)

```bash
# Database
DATABASE_URL=sqlite:///./data/profit_share.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=false

# CORS
CORS_ORIGINS=https://profit-share.example.com

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Str0ng!P@ssw0rd#2024

# JWT
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### Frontend `.env.local` (Development)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Frontend `.env.local` (Production)

```bash
NEXT_PUBLIC_API_URL=https://api.profit-share.example.com
```

## Security Best Practices

1. **Never commit `.env` files to version control**
   - Use `.env.example` as a template
   - Add `.env` to `.gitignore`

2. **Use strong secrets in production**
   - Generate JWT secret: `openssl rand -hex 32`
   - Use password manager for admin password
   - Minimum 32 characters for secrets

3. **Restrict CORS origins**
   - Never use `*` in production
   - Only list your actual frontend domains
   - Include protocol (http/https)

4. **Rotate secrets regularly**
   - Change JWT secret periodically
   - Update admin password regularly
   - Keep backup of old secrets during rotation

5. **Use environment-specific values**
   - Different secrets for dev/staging/production
   - Enable debug features only in development
   - Use shorter token expiry in production

## Generating Secure Secrets

### JWT Secret Key

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Admin Password

Use a password manager or generate a strong password:

```bash
# Using OpenSSL (20 character password)
openssl rand -base64 20
```

## Troubleshooting

### "CORS error" in browser console
- Check `CORS_ORIGINS` includes your frontend URL
- Ensure no trailing slashes in URLs
- Verify protocol matches (http vs https)

### "Invalid credentials" on login
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set correctly
- Check for extra spaces or newlines in `.env` file
- Ensure backend has restarted after changing `.env`

### "Token expired" errors
- Check `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` setting
- Verify system clocks are synchronized
- Clear browser cookies and login again

### Database connection errors
- Verify `DATABASE_URL` path is correct
- Ensure database directory exists and is writable
- Check file permissions on database file

## Environment Variable Loading

### Backend (Python)
- Uses `python-dotenv` to load `.env` file
- Loaded in `app/main.py` and configuration modules
- Environment variables override `.env` file values

### Frontend (Next.js)
- Loads `.env.local` automatically
- Only `NEXT_PUBLIC_*` variables are exposed to browser
- Server-side code can access all environment variables

### Docker
- Docker Compose loads `.env` from project root
- Can override with `environment:` in `docker-compose.yml`
- Can pass via command line: `docker run -e VAR=value`
