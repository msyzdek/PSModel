# Database Setup Guide

## Overview

The Profit Share Calculator uses SQLAlchemy ORM with SQLite (MVP) for data persistence. The database schema includes two main tables:

- `monthly_periods`: Stores monthly profit share calculation periods
- `holder_allocations`: Stores individual holder allocations for each period

## Database Configuration

Database connection is configured via environment variable:

```bash
DATABASE_URL=sqlite:///./profit_share.db
```

For PostgreSQL (future):
```bash
DATABASE_URL=postgresql://user:password@localhost/profit_share
```

## Initialization

### Option 1: Using the initialization script

```bash
cd backend
python scripts/init_db.py
```

This creates all tables directly using SQLAlchemy.

### Option 2: Using Alembic migrations (recommended for production)

```bash
cd backend
alembic upgrade head
```

This applies all migrations in order.

## Migrations

### Creating a new migration

After modifying models, generate a new migration:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

### Applying migrations

```bash
cd backend
alembic upgrade head
```

### Rolling back migrations

```bash
cd backend
alembic downgrade -1  # Roll back one migration
alembic downgrade base  # Roll back all migrations
```

## Schema

### monthly_periods

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| year | INTEGER | Year of the period |
| month | INTEGER | Month (1-12) |
| net_income_qb | DECIMAL(12,2) | QuickBooks Net Income |
| ps_addback | DECIMAL(12,2) | PS payout add-back |
| owner_draws | DECIMAL(12,2) | Total owner draws |
| uncollectible | DECIMAL(12,2) | Uncollectible income |
| bad_debt | DECIMAL(12,2) | Bad debt amount |
| tax_optimization | DECIMAL(12,2) | Tax optimization return |
| adjusted_pool | DECIMAL(12,2) | Calculated adjusted pool |
| total_shares | INTEGER | Total shares across holders |
| rounding_delta | DECIMAL(12,2) | Rounding adjustment |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Constraints:**
- Unique constraint on (year, month)

### holder_allocations

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| period_id | INTEGER | Foreign key to monthly_periods |
| holder_name | VARCHAR(255) | Name of the holder |
| shares | INTEGER | Number of shares |
| personal_charges | DECIMAL(12,2) | Personal charges |
| carry_forward_in | DECIMAL(12,2) | Carry-forward from prior period |
| gross_allocation | DECIMAL(12,2) | Gross allocation before charges |
| net_payout | DECIMAL(12,2) | Final net payout |
| carry_forward_out | DECIMAL(12,2) | Carry-forward to next period |
| received_rounding_adjustment | BOOLEAN | Received rounding adjustment flag |

**Constraints:**
- Foreign key to monthly_periods with CASCADE delete

## Session Management

The application uses dependency injection for database sessions:

```python
from app.database import get_db

@app.get("/api/periods")
def list_periods(db: Session = Depends(get_db)):
    # Use db session here
    pass
```

Sessions are automatically closed after each request.
