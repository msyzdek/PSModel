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

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend will run on http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend will run on http://localhost:3000

## Features

- Monthly profit share calculation with complex adjustments
- Deficit carry-forward tracking
- Rounding reconciliation
- Multi-holder support
- Period navigation and management
- Persistent data storage

## Documentation

See the `.kiro/specs/profit-share-calculator/` directory for:
- Requirements document
- Design document
- Implementation tasks

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
