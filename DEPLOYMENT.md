# Deployment Guide

This guide covers deployment options for the Profit Share Calculator application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)

## Prerequisites

### For Local Development
- Python 3.11+
- Node.js 20+
- npm or yarn

### For Docker Deployment
- Docker 20.10+
- Docker Compose 2.0+

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=sqlite:///./profit_share.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true  # Set to false in production

# CORS - Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Authentication (MVP)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme  # CHANGE THIS IN PRODUCTION

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production  # CHANGE THIS IN PRODUCTION
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**Security Notes:**
- Always change `ADMIN_PASSWORD` and `JWT_SECRET_KEY` in production
- Use strong, randomly generated values for secrets
- Never commit `.env` files to version control

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# API URL - Update for production deployment
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Local Development

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize database:
```bash
chmod +x scripts/init_database.sh
./scripts/init_database.sh
```

6. Start the server:
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose (Recommended)

1. Create environment file in project root:
```bash
cp backend/.env.example .env
# Edit .env with your configuration
```

2. Build and start services:
```bash
docker-compose up -d
```

3. View logs:
```bash
docker-compose logs -f
```

4. Stop services:
```bash
docker-compose down
```

### Database Persistence

The SQLite database is stored in `backend/data/` directory, which is mounted as a volume in Docker. This ensures data persists across container restarts.

### Accessing Services

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

## Production Deployment

### Backend Deployment

#### Option 1: Docker Container

1. Build production image:
```bash
cd backend
docker build -t profit-share-backend:latest .
```

2. Run container:
```bash
docker run -d \
  --name profit-share-backend \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_URL=sqlite:///./data/profit_share.db \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your-secure-password \
  -e JWT_SECRET_KEY=your-secret-key \
  -e CORS_ORIGINS=https://your-frontend-domain.com \
  profit-share-backend:latest
```

#### Option 2: Traditional Server

1. Install dependencies on server
2. Configure systemd service or supervisor
3. Use nginx or similar as reverse proxy
4. Enable HTTPS with Let's Encrypt

Example systemd service (`/etc/systemd/system/profit-share.service`):

```ini
[Unit]
Description=Profit Share Calculator API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/profit-share/backend
Environment="PATH=/opt/profit-share/backend/venv/bin"
EnvironmentFile=/opt/profit-share/backend/.env
ExecStart=/opt/profit-share/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy from frontend directory:
```bash
cd frontend
vercel
```

3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

#### Option 2: Docker Container

1. Build production image:
```bash
cd frontend
docker build -t profit-share-frontend:latest .
```

2. Run container:
```bash
docker run -d \
  --name profit-share-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api-domain.com \
  profit-share-frontend:latest
```

#### Option 3: Static Export + CDN

1. Build static export:
```bash
cd frontend
npm run build
```

2. Deploy the `out/` directory to:
   - Netlify
   - AWS S3 + CloudFront
   - Cloudflare Pages
   - Any static hosting service

### Database Backup

For production, implement regular backups of the SQLite database:

```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/backups"
DB_PATH="/app/data/profit_share.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/profit_share_$TIMESTAMP.db'"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "profit_share_*.db" -mtime +30 -delete
```

Add to crontab for daily backups:
```bash
0 2 * * * /path/to/backup-db.sh
```

### Security Checklist

- [ ] Change default admin password
- [ ] Generate strong JWT secret key
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domains only
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Implement database backups
- [ ] Set up monitoring and logging
- [ ] Review and update dependencies regularly
- [ ] Disable debug mode (`API_RELOAD=false`)

### Monitoring

Consider implementing:
- Application monitoring (e.g., Sentry)
- Server monitoring (e.g., Prometheus + Grafana)
- Log aggregation (e.g., ELK stack)
- Uptime monitoring (e.g., UptimeRobot)

### Scaling Considerations

For future scaling needs:
- Migrate from SQLite to PostgreSQL
- Implement Redis for caching
- Use load balancer for multiple backend instances
- Implement CDN for frontend assets
- Consider serverless deployment options

## Troubleshooting

### Backend Issues

**Database locked error:**
- SQLite doesn't handle concurrent writes well
- Consider migrating to PostgreSQL for production

**CORS errors:**
- Verify `CORS_ORIGINS` includes your frontend URL
- Check for trailing slashes in URLs

**Authentication failures:**
- Verify JWT_SECRET_KEY is set correctly
- Check token expiration settings

### Frontend Issues

**API connection errors:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on backend
- Ensure backend is running and accessible

**Build errors:**
- Clear `.next` directory and rebuild
- Verify all dependencies are installed
- Check Node.js version compatibility

## Support

For issues or questions:
1. Check the logs: `docker-compose logs` or application logs
2. Review this documentation
3. Check the API documentation at `/docs` endpoint
4. Review the main README.md for project overview
