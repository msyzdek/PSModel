# Profit Share Calculator

A web application for calculating and tracking monthly profit share distributions to company shareholders based on QuickBooks Net Income data.

## Project Structure

```
.
├── backend/          # FastAPI backend
├── frontend/         # Next.js frontend
└── docs/            # Documentation and specifications
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Copy environment file
cp backend/.env.example .env

# Edit .env with your configuration
# At minimum, change ADMIN_PASSWORD and JWT_SECRET_KEY

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
./scripts/init_database.sh
./scripts/start.sh
```

Backend will run on http://localhost:8000

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

Frontend will run on http://localhost:3000

### Default Credentials

- Username: `admin`
- Password: `changeme` (change this in production!)

**Important:** Update `ADMIN_PASSWORD` and `JWT_SECRET_KEY` in your `.env` file before deploying to production.

## Features

- Monthly profit share calculation with complex adjustments
- Deficit carry-forward tracking
- Rounding reconciliation
- Multi-holder support
- Period navigation and management
- Persistent data storage

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment guide
- [SETUP.md](./SETUP.md) - Detailed setup instructions
- `.kiro/specs/profit-share-calculator/` - Requirements, design, and implementation tasks
- `backend/README.md` - Backend-specific documentation
- `frontend/README.md` - Frontend-specific documentation

## Technology Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy
- SQLite (MVP)

**Frontend:**
- Next.js 14+
- TypeScript
- React
- Tailwind CSS
- React Hook Form + Zod

## Development

Both backend and frontend have their own README files with detailed development instructions.
