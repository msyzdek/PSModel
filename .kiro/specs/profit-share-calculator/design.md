# Design Document

## Overview

The Profit Share Calculator is a full-stack web application built with Next.js (frontend) and Python FastAPI (backend). The system follows a clean architecture pattern with clear separation between presentation, business logic, and data layers. The MVP focuses on manual data entry with server-side calculations and persistent storage using SQLite.

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- React for UI components
- Tailwind CSS for styling
- React Hook Form for form management
- Zod for validation

**Backend:**
- Python 3.11+
- FastAPI for REST API
- SQLAlchemy for ORM
- SQLite for database (MVP)
- Pydantic for data validation
- Alembic for migrations

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages/     │  │  Components  │  │   Hooks      │      │
│  │   Routes     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   API Client   │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼──────────────────────────────────┐
│                      Backend (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   API        │  │   Services   │  │  Models      │       │
│  │   Routes     │──│   (Business  │──│  (Domain)    │       │
│  │              │  │    Logic)    │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │  Repositories  │                         │
│                    └───────┬────────┘                         │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │   SQLAlchemy   │                         │
│                    └───────┬────────┘                         │
└────────────────────────────┼───────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  SQLite Database│
                    └─────────────────┘
```

### Component Responsibilities

**Frontend:**
- User interface rendering
- Form validation and submission
- Data display and formatting
- Client-side navigation
- API communication

**Backend:**
- Business logic execution
- Calculation engine
- Data validation
- Persistence management
- API endpoint exposure

## Components and Interfaces

### Backend Components

#### 1. Data Models (Domain Layer)

**MonthlyPeriod**
```python
class MonthlyPeriod:
    id: int
    year: int
    month: int  # 1-12
    net_income_qb: Decimal
    ps_addback: Decimal
    owner_draws: Decimal
    uncollectible: Decimal
    bad_debt: Decimal
    tax_optimization: Decimal
    adjusted_pool: Decimal  # Calculated
    total_shares: int  # Calculated
    rounding_delta: Decimal  # Calculated
    created_at: datetime
    updated_at: datetime
```

**HolderAllocation**
```python
class HolderAllocation:
    id: int
    period_id: int  # FK to MonthlyPeriod
    holder_name: str
    shares: int
    personal_charges: Decimal
    carry_forward_in: Decimal
    gross_allocation: Decimal  # Calculated
    net_payout: Decimal  # Calculated
    carry_forward_out: Decimal  # Calculated
    received_rounding_adjustment: bool
```

#### 2. Services (Business Logic Layer)

**ProfitShareCalculationService**

Responsibilities:
- Execute profit share calculation algorithm
- Apply carry-forward logic
- Perform rounding and reconciliation
- Validate calculation inputs

Key Methods:
```python
def calculate_period(
    period_data: PeriodInput,
    holders: List[HolderInput],
    prior_period_id: Optional[int]
) -> CalculationResult:
    """
    Calculate profit share for a period.
    
    Steps:
    1. Load carry-forwards from prior period
    2. Calculate personal_addback_total
    3. Calculate adjusted_pool
    4. Calculate per-holder gross allocations
    5. Apply personal charges and carry-forwards
    6. Apply zero floor and generate new carry-forwards
    7. Round payouts and reconcile
    8. Return complete calculation result
    """
    pass

def apply_carry_forwards(
    holders: List[HolderInput],
    prior_period_id: int
) -> Dict[str, Decimal]:
    """Load carry-forward amounts from prior period."""
    pass

def calculate_adjusted_pool(
    net_income_qb: Decimal,
    ps_addback: Decimal,
    personal_addback_total: Decimal,
    owner_draws: Decimal,
    uncollectible: Decimal,
    bad_debt: Decimal,
    tax_optimization: Decimal
) -> Decimal:
    """Calculate adjusted pool: NI + ps_addback + personal_total - draws - uncollectible - tax_opt + bad_debt."""
    pass

def round_and_reconcile(
    allocations: List[HolderAllocation]
) -> Tuple[List[HolderAllocation], Decimal]:
    """
    Round all payouts to cents and reconcile delta.
    Returns updated allocations and rounding delta.
    """
    pass
```

**PeriodService**

Responsibilities:
- CRUD operations for monthly periods
- Period navigation logic
- Data validation

Key Methods:
```python
def create_period(period_data: PeriodInput, holders: List[HolderInput]) -> MonthlyPeriod
def get_period(year: int, month: int) -> Optional[MonthlyPeriod]
def update_period(period_id: int, period_data: PeriodInput, holders: List[HolderInput]) -> MonthlyPeriod
def list_periods(limit: int = 12) -> List[MonthlyPeriod]
def get_prior_period(year: int, month: int) -> Optional[MonthlyPeriod]
```

#### 3. Repositories (Data Access Layer)

**PeriodRepository**
```python
def save(period: MonthlyPeriod) -> MonthlyPeriod
def find_by_id(period_id: int) -> Optional[MonthlyPeriod]
def find_by_year_month(year: int, month: int) -> Optional[MonthlyPeriod]
def find_all(limit: int) -> List[MonthlyPeriod]
def delete(period_id: int) -> None
```

**HolderAllocationRepository**
```python
def save_all(allocations: List[HolderAllocation]) -> List[HolderAllocation]
def find_by_period(period_id: int) -> List[HolderAllocation]
def find_carry_forwards(period_id: int) -> Dict[str, Decimal]
def delete_by_period(period_id: int) -> None
```

#### 4. API Routes

**Period Endpoints**
```
POST   /api/periods                    # Create new period with calculations
GET    /api/periods                    # List all periods
GET    /api/periods/{year}/{month}     # Get specific period with allocations
PUT    /api/periods/{year}/{month}     # Update period and recalculate
DELETE /api/periods/{year}/{month}     # Delete period
```

**Calculation Endpoints**
```
POST   /api/calculate/preview          # Preview calculation without saving
GET    /api/periods/{year}/{month}/summary  # Get period summary report
```

### Frontend Components

#### 1. Pages/Routes

**Dashboard (`/`)**
- Display list of recent periods
- Navigation to create new period
- Quick stats overview

**Period Entry (`/period/[year]/[month]`)**
- Form for entering period data
- Form for entering holder allocations
- Real-time validation
- Submit to create/update period

**Period Summary (`/period/[year]/[month]/summary`)**
- Display complete calculation breakdown
- Pool build-up components
- Per-holder allocations table
- Carry-forward movements
- Rounding reconciliation details

#### 2. UI Components

**PeriodForm**
- Input fields for period-level data
- Validation and error display
- Submit handler

**HolderAllocationForm**
- Dynamic list of holder inputs
- Add/remove holder rows
- Per-holder validation

**CalculationSummary**
- Pool build-up display
- Allocations table
- Carry-forward visualization
- Rounding details

**PeriodNavigator**
- Month/year selector
- Previous/next navigation
- Create new period button

## Data Models

### Database Schema

**monthly_periods**
```sql
CREATE TABLE monthly_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    net_income_qb DECIMAL(12, 2) NOT NULL,
    ps_addback DECIMAL(12, 2) NOT NULL DEFAULT 0,
    owner_draws DECIMAL(12, 2) NOT NULL DEFAULT 0,
    uncollectible DECIMAL(12, 2) NOT NULL DEFAULT 0,
    bad_debt DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_optimization DECIMAL(12, 2) NOT NULL DEFAULT 0,
    adjusted_pool DECIMAL(12, 2) NOT NULL,
    total_shares INTEGER NOT NULL,
    rounding_delta DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);
```

**holder_allocations**
```sql
CREATE TABLE holder_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    shares INTEGER NOT NULL,
    personal_charges DECIMAL(12, 2) NOT NULL DEFAULT 0,
    carry_forward_in DECIMAL(12, 2) NOT NULL DEFAULT 0,
    gross_allocation DECIMAL(12, 2) NOT NULL,
    net_payout DECIMAL(12, 2) NOT NULL,
    carry_forward_out DECIMAL(12, 2) NOT NULL DEFAULT 0,
    received_rounding_adjustment BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (period_id) REFERENCES monthly_periods(id) ON DELETE CASCADE
);
```

### API Request/Response Models

**PeriodInput**
```typescript
interface PeriodInput {
  year: number;
  month: number;
  net_income_qb: number;
  ps_addback: number;
  owner_draws: number;
  uncollectible?: number;
  bad_debt?: number;
  tax_optimization?: number;
}
```

**HolderInput**
```typescript
interface HolderInput {
  holder_name: string;
  shares: number;
  personal_charges: number;
}
```

**CalculationResult**
```typescript
interface CalculationResult {
  period: {
    year: number;
    month: number;
    adjusted_pool: number;
    total_shares: number;
    rounding_delta: number;
  };
  allocations: Array<{
    holder_name: string;
    shares: number;
    gross_allocation: number;
    personal_charges: number;
    carry_forward_in: number;
    net_payout: number;
    carry_forward_out: number;
    received_rounding_adjustment: boolean;
  }>;
}
```

## Error Handling

### Backend Error Handling

**Validation Errors**
- Return 400 Bad Request with detailed error messages
- Use Pydantic validation for request bodies
- Validate business rules (e.g., total_shares > 0)

**Not Found Errors**
- Return 404 Not Found when period doesn't exist
- Include helpful error message

**Calculation Errors**
- Return 422 Unprocessable Entity for calculation failures
- Log detailed error information
- Return user-friendly error message

**Database Errors**
- Catch SQLAlchemy exceptions
- Return 500 Internal Server Error
- Log full stack trace
- Return generic error message to client

### Frontend Error Handling

**Form Validation**
- Client-side validation using Zod schemas
- Display field-level errors inline
- Prevent submission of invalid data

**API Errors**
- Display error messages from API responses
- Show toast notifications for errors
- Provide retry mechanisms

**Network Errors**
- Handle connection failures gracefully
- Show appropriate error messages
- Implement retry logic

## Testing Strategy

### Backend Testing

**Unit Tests**
- Test calculation service logic in isolation
- Test rounding and reconciliation algorithm
- Test carry-forward logic
- Mock repository dependencies
- Target: >80% coverage on business logic

**Integration Tests**
- Test API endpoints end-to-end
- Test database operations
- Test complete calculation flow
- Use test database

**Test Data**
- Create fixtures based on Excel model examples
- Test edge cases (negative pools, zero shares, etc.)
- Test rounding edge cases

### Frontend Testing

**Component Tests**
- Test form validation
- Test user interactions
- Test data display
- Mock API calls

**Integration Tests**
- Test complete user flows
- Test navigation
- Test form submission and result display

## Security Considerations

### MVP Security

**Authentication**
- Simple admin user with environment-configured credentials
- Session-based authentication
- Secure password storage (hashed)

**API Security**
- CORS configuration for frontend domain
- Request validation on all endpoints
- SQL injection prevention via ORM

**Data Security**
- Input sanitization
- Output encoding
- Secure database file permissions

### Future Enhancements (Post-MVP)

- Google SSO integration
- Google Groups-based authorization
- Role-based access control (admin vs. shareholder)
- Audit logging

## Performance Considerations

### Backend Performance

**Database**
- Index on (year, month) for fast lookups
- Index on period_id for holder allocations
- Use connection pooling

**Calculations**
- Calculations are O(n) where n = number of holders
- Expected to be fast for typical use (< 20 holders)

### Frontend Performance

**Optimization**
- Server-side rendering for initial page load
- Client-side navigation for subsequent pages
- Lazy loading for large data sets
- Debounce form inputs

## Deployment Architecture

### MVP Deployment

**Backend**
- Deploy as Docker container
- Environment variables for configuration
- SQLite database file on persistent volume

**Frontend**
- Deploy to Vercel or similar platform
- Environment variable for API URL
- Static asset optimization

**Database**
- SQLite file on persistent storage
- Regular backups to cloud storage

### Future Considerations

- Migrate to PostgreSQL for production
- Implement database replication
- Add caching layer (Redis)
- Horizontal scaling for API
