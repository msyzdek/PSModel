# Design Document: Holder Management System

## Overview

This design introduces a persistent holder management system that separates holder identity from period-specific data. The system enables efficient multi-period data entry through a spreadsheet-style interface while maintaining backward compatibility with the existing profit share calculator.

### Key Design Principles

1. **Separation of Concerns**: Holder identity (name) is separate from period-specific data (shares, charges)
2. **Data Reusability**: Holders are defined once and reused across periods
3. **Efficient Data Entry**: Spreadsheet-style interface for viewing/editing multiple periods
4. **Backward Compatibility**: Works seamlessly with existing period data
5. **Incremental Adoption**: Can be implemented without disrupting current functionality

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Holder Management UI  │  Multi-Period Grid  │  Period Form  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  /api/holders/*       │  /api/periods/*  (enhanced)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  HolderService        │  PeriodService (enhanced)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
├─────────────────────────────────────────────────────────────┤
│  HolderRepository     │  HolderAllocationRepository          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  holders              │  holder_allocations (enhanced)       │
│  monthly_periods      │                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Creating a Period with Holders
```
User Input → Frontend Validation → API Request → Service Layer
    → Holder Lookup/Creation → Period Creation → Allocation Creation
    → Calculation → Response
```

#### Multi-Period Grid View
```
User Request → API (fetch holders + periods) → Service Layer
    → Repository (join holders with allocations) → Aggregate Data
    → Response (grid structure) → Frontend Rendering
```

## Components and Interfaces

### Backend Components

#### 1. Holder Model (`backend/app/models/holder.py`)

```python
class Holder(Base):
    """Master holder entity."""
    __tablename__ = "holders"
    
    id: int (PK)
    name: str (unique, indexed)
    default_shares: Optional[int]
    is_active: bool (default=True)
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    allocations: List[HolderAllocation]
```

**Design Rationale**: 
- Separate table for holder identity enables reuse across periods
- `default_shares` provides convenience without enforcing rigidity
- `is_active` allows soft deletion to preserve historical data
- Unique constraint on name prevents duplicates

#### 2. Enhanced HolderAllocation Model

```python
class HolderAllocation(Base):
    """Period-specific holder data."""
    __tablename__ = "holder_allocations"
    
    id: int (PK)
    period_id: int (FK → monthly_periods)
    holder_id: int (FK → holders)  # NEW
    holder_name: str  # DEPRECATED but kept for backward compatibility
    shares: int
    personal_charges: Decimal
    carry_forward_in: Decimal
    gross_allocation: Decimal
    net_payout: Decimal
    carry_forward_out: Decimal
    received_rounding_adjustment: bool
    
    # Relationships
    period: MonthlyPeriod
    holder: Holder  # NEW
```

**Design Rationale**:
- Add `holder_id` FK to link to master holder
- Keep `holder_name` for backward compatibility with existing data
- Migration will populate `holder_id` from `holder_name`

#### 3. HolderService (`backend/app/services/holder_service.py`)

```python
class HolderService:
    """Service for holder CRUD operations."""
    
    def create_holder(name: str, default_shares: Optional[int]) -> Holder
    def get_holder(holder_id: int) -> Optional[Holder]
    def get_holder_by_name(name: str) -> Optional[Holder]
    def list_holders(active_only: bool = True) -> List[Holder]
    def update_holder(holder_id: int, name: str, default_shares: Optional[int]) -> Holder
    def deactivate_holder(holder_id: int) -> Holder
    def get_or_create_holder(name: str, default_shares: Optional[int]) -> Holder
```

**Design Rationale**:
- `get_or_create_holder` enables seamless transition from name-only to holder entities
- Deactivation instead of deletion preserves referential integrity
- Service layer handles business logic and validation

#### 4. HolderRepository (`backend/app/repositories/holder_repository.py`)

```python
class HolderRepository:
    """Repository for holder data access."""
    
    def save(holder: Holder) -> Holder
    def find_by_id(holder_id: int) -> Optional[Holder]
    def find_by_name(name: str) -> Optional[Holder]
    def find_all(active_only: bool = True) -> List[Holder]
    def update(holder: Holder) -> Holder
    def delete(holder_id: int) -> None
    def count_allocations(holder_id: int) -> int
```

#### 5. Enhanced PeriodService

```python
class PeriodService:
    """Enhanced to work with holder entities."""
    
    # Existing methods remain unchanged
    
    # New methods
    def get_multi_period_grid(
        holder_ids: Optional[List[int]] = None,
        start_year: int,
        start_month: int,
        num_months: int = 12
    ) -> MultiPeriodGridData
    
    def update_cell(
        holder_id: int,
        year: int,
        month: int,
        shares: int,
        personal_charges: Decimal
    ) -> HolderAllocation
```

**Design Rationale**:
- `get_multi_period_grid` provides optimized data for spreadsheet view
- `update_cell` enables efficient single-cell updates
- Existing methods work with holder names for backward compatibility

### API Endpoints

#### Holder Management Endpoints

```
POST   /api/holders                    # Create holder
GET    /api/holders                    # List all holders
GET    /api/holders/{id}               # Get holder details
PUT    /api/holders/{id}               # Update holder
DELETE /api/holders/{id}               # Deactivate holder
GET    /api/holders/{id}/periods       # Get holder's participation history
```

#### Enhanced Period Endpoints

```
# Existing endpoints remain unchanged
POST   /api/periods
GET    /api/periods
GET    /api/periods/{year}/{month}
PUT    /api/periods/{year}/{month}
DELETE /api/periods/{year}/{month}

# New endpoints
GET    /api/periods/grid               # Get multi-period grid data
PUT    /api/periods/grid/cell          # Update single cell
POST   /api/periods/copy-previous      # Copy from previous period
```

### Frontend Components

#### 1. Holder Management Page (`frontend/app/holders/page.tsx`)

```typescript
// Route: /holders
// Features:
// - List all active holders
// - Create new holder
// - Edit holder name and default shares
// - Deactivate holder
// - View holder participation history
```

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Holders                                  [+ New]    │
├─────────────────────────────────────────────────────┤
│  Name              Default Shares    Actions        │
│  ─────────────────────────────────────────────────  │
│  John Doe          100              [Edit] [View]   │
│  Jane Smith        150              [Edit] [View]   │
│  Bob Johnson       75               [Edit] [View]   │
└─────────────────────────────────────────────────────┘
```

#### 2. Multi-Period Grid (`frontend/app/periods/grid/page.tsx`)

```typescript
// Route: /periods/grid
// Features:
// - Spreadsheet-style table
// - Holders as rows, months as columns
// - Inline editing of shares and personal charges
// - Auto-save on blur or explicit save
// - Frozen holder column
// - Horizontal scrolling for months
// - Tooltip with calculation details
// - Click month header to edit period-level data
```

**UI Layout**:
```
┌──────────────┬────────┬────────┬────────┬────────┬─────►
│ Holder       │ Jan 24 │ Feb 24 │ Mar 24 │ Apr 24 │ ...
├──────────────┼────────┼────────┼────────┼────────┼─────►
│ John Doe     │ 100    │ 100    │ 100    │ 100    │
│              │ $500   │ $500   │ $500   │ $500   │
│              │ $4,500 │ $4,500 │ $4,500 │ $4,500 │
├──────────────┼────────┼────────┼────────┼────────┼─────►
│ Jane Smith   │ 150    │ 150    │ 150    │ 150    │
│              │ $0     │ $0     │ $0     │ $0     │
│              │ $6,750 │ $6,750 │ $6,750 │ $6,750 │
└──────────────┴────────┴────────┴────────┴────────┴─────►

Cell format:
  Line 1: Shares
  Line 2: Personal Charges
  Line 3: Net Payout (read-only, calculated)
```

#### 3. Enhanced Period Form

```typescript
// Route: /period/new (enhanced)
// Features:
// - Select holders from dropdown (master list)
// - Pre-populate shares from holder defaults
// - Option to "Copy from Previous Period"
// - Add new holder inline (creates in master list)
```

#### 4. React Components

```typescript
// HolderSelector.tsx
interface HolderSelectorProps {
  selectedHolders: number[];
  onChange: (holderIds: number[]) => void;
  allowCreate: boolean;
}

// MultiPeriodGrid.tsx
interface MultiPeriodGridProps {
  holders: Holder[];
  periods: Period[];
  allocations: Map<string, HolderAllocation>; // key: "holderId-year-month"
  onCellUpdate: (holderId: number, year: number, month: number, data: CellData) => void;
}

// HolderForm.tsx
interface HolderFormProps {
  holder?: Holder;
  onSubmit: (data: HolderFormData) => void;
  onCancel: () => void;
}
```

## Data Models

### Database Schema

#### holders Table (NEW)

```sql
CREATE TABLE holders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    default_shares INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_default_shares_positive CHECK (default_shares IS NULL OR default_shares > 0)
);

CREATE INDEX idx_holders_name ON holders(name);
CREATE INDEX idx_holders_active ON holders(is_active);
```

#### holder_allocations Table (MODIFIED)

```sql
ALTER TABLE holder_allocations 
ADD COLUMN holder_id INTEGER REFERENCES holders(id) ON DELETE RESTRICT;

CREATE INDEX idx_holder_allocations_holder_id ON holder_allocations(holder_id);

-- Note: holder_name column remains for backward compatibility
-- Migration will populate holder_id from holder_name
```

### TypeScript Interfaces

```typescript
// frontend/lib/types/holder.ts

interface Holder {
  id: number;
  name: string;
  defaultShares: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HolderFormData {
  name: string;
  defaultShares: number | null;
}

interface HolderWithStats extends Holder {
  totalPeriods: number;
  firstPeriod: string;
  lastPeriod: string;
  totalPayout: number;
}

// frontend/lib/types/grid.ts

interface GridCell {
  holderId: number;
  holderName: string;
  year: number;
  month: number;
  shares: number | null;
  personalCharges: number | null;
  netPayout: number | null;
  hasData: boolean;
}

interface MultiPeriodGridData {
  holders: Holder[];
  months: { year: number; month: number }[];
  cells: Map<string, GridCell>; // key: "holderId-year-month"
}
```

### Pydantic Schemas

```python
# backend/app/schemas/holder.py

class HolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    default_shares: Optional[int] = Field(None, gt=0)

class HolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    default_shares: Optional[int] = Field(None, gt=0)

class HolderResponse(BaseModel):
    id: int
    name: str
    default_shares: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class HolderWithStats(HolderResponse):
    total_periods: int
    first_period: Optional[str]
    last_period: Optional[str]
    total_payout: Decimal
```

## Data Migration Strategy

### Phase 1: Add Holder Table and Foreign Key

```python
# Migration: add_holders_table.py

def upgrade():
    # Create holders table
    op.create_table(
        'holders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('default_shares', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    
    # Add holder_id to holder_allocations
    op.add_column('holder_allocations', 
        sa.Column('holder_id', sa.Integer(), nullable=True)
    )
    
    # Add foreign key (nullable for now)
    op.create_foreign_key(
        'fk_holder_allocations_holder_id',
        'holder_allocations', 'holders',
        ['holder_id'], ['id'],
        ondelete='RESTRICT'
    )
```

### Phase 2: Migrate Existing Data

```python
# Migration: migrate_holder_data.py

def upgrade():
    # Get all unique holder names from allocations
    conn = op.get_bind()
    result = conn.execute(
        "SELECT DISTINCT holder_name FROM holder_allocations ORDER BY holder_name"
    )
    
    # Create holder records
    for row in result:
        holder_name = row[0]
        conn.execute(
            "INSERT INTO holders (name, is_active, created_at, updated_at) "
            "VALUES (%s, TRUE, NOW(), NOW())",
            (holder_name,)
        )
    
    # Update holder_allocations with holder_id
    conn.execute("""
        UPDATE holder_allocations ha
        SET holder_id = h.id
        FROM holders h
        WHERE ha.holder_name = h.name
    """)
    
    # Make holder_id NOT NULL
    op.alter_column('holder_allocations', 'holder_id', nullable=False)
```

### Phase 3: Calculate Default Shares

```python
# Migration: calculate_default_shares.py

def upgrade():
    # For each holder, find their most common share count
    conn = op.get_bind()
    conn.execute("""
        UPDATE holders h
        SET default_shares = (
            SELECT shares
            FROM holder_allocations ha
            WHERE ha.holder_id = h.id
            GROUP BY shares
            ORDER BY COUNT(*) DESC, shares DESC
            LIMIT 1
        )
    """)
```

## Error Handling

### Validation Errors

```python
# Holder name validation
- Empty name → 400 "Holder name cannot be empty"
- Duplicate name → 400 "Holder with name '{name}' already exists"
- Name too long → 400 "Holder name must be 255 characters or less"

# Default shares validation
- Negative shares → 400 "Default shares must be positive"
- Zero shares → 400 "Default shares must be greater than zero"

# Holder deletion
- Has allocations → 400 "Cannot delete holder with existing period data. Deactivate instead."
```

### Business Logic Errors

```python
# Period creation with holders
- No holders selected → 400 "At least one holder must be selected"
- Inactive holder selected → 400 "Cannot use inactive holder '{name}'"
- Holder not found → 404 "Holder with id {id} not found"

# Grid cell update
- Period doesn't exist → Creates period automatically
- Invalid shares → 400 "Shares must be a positive integer"
- Invalid charges → 400 "Personal charges must be non-negative"
```

### Concurrent Update Handling

```python
# Optimistic locking for grid updates
- Use updated_at timestamp
- Return 409 Conflict if data changed since last read
- Client refetches and retries
```

## Testing Strategy

### Unit Tests

```python
# test_holder_service.py
- test_create_holder_success()
- test_create_holder_duplicate_name()
- test_get_or_create_holder_existing()
- test_get_or_create_holder_new()
- test_deactivate_holder()
- test_update_holder_name_cascades()

# test_holder_repository.py
- test_save_holder()
- test_find_by_name()
- test_find_all_active_only()
- test_count_allocations()

# test_period_service_with_holders.py
- test_create_period_with_holder_ids()
- test_create_period_creates_holders()
- test_get_multi_period_grid()
- test_update_cell()
```

### Integration Tests

```python
# test_holder_api.py
- test_create_holder_endpoint()
- test_list_holders_endpoint()
- test_update_holder_endpoint()
- test_deactivate_holder_with_allocations()

# test_period_api_with_holders.py
- test_create_period_with_new_holders()
- test_create_period_with_existing_holders()
- test_grid_endpoint_returns_correct_structure()
- test_update_cell_endpoint()
```

### Frontend Tests

```typescript
// HolderSelector.test.tsx
- renders holder list
- allows holder selection
- creates new holder inline
- filters inactive holders

// MultiPeriodGrid.test.tsx
- renders grid with correct structure
- allows cell editing
- saves changes on blur
- shows calculation tooltip
- freezes holder column
```

### End-to-End Tests

```python
# test_holder_management_e2e.py
- test_complete_holder_lifecycle()
- test_multi_period_data_entry()
- test_copy_from_previous_period()
- test_holder_deactivation_workflow()
```

## Performance Considerations

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_holders_name ON holders(name);
CREATE INDEX idx_holders_active ON holders(is_active);
CREATE INDEX idx_holder_allocations_holder_id ON holder_allocations(holder_id);
CREATE INDEX idx_holder_allocations_period_holder ON holder_allocations(period_id, holder_id);

-- Composite index for grid queries
CREATE INDEX idx_periods_year_month ON monthly_periods(year DESC, month DESC);
```

### API Optimization

```python
# Multi-period grid query optimization
- Single query with JOINs instead of N+1 queries
- Eager load relationships
- Return only necessary fields
- Implement pagination for large datasets

# Example optimized query
SELECT 
    h.id, h.name, h.default_shares,
    p.year, p.month,
    ha.shares, ha.personal_charges, ha.net_payout
FROM holders h
CROSS JOIN monthly_periods p
LEFT JOIN holder_allocations ha ON ha.holder_id = h.id AND ha.period_id = p.id
WHERE h.is_active = TRUE
  AND p.year * 12 + p.month BETWEEN :start_period AND :end_period
ORDER BY h.name, p.year DESC, p.month DESC
```

### Frontend Optimization

```typescript
// Virtual scrolling for large grids
- Render only visible cells
- Use react-window or similar library

// Debounced auto-save
- Debounce cell updates (500ms)
- Batch multiple changes
- Show saving indicator

// Optimistic updates
- Update UI immediately
- Rollback on error
- Show conflict resolution UI
```

## Security Considerations

### Authorization

```python
# All holder and period endpoints require authentication
- Use existing JWT authentication
- Validate user has access to organization's data
- Future: Add role-based access (admin, editor, viewer)
```

### Input Validation

```python
# Sanitize all user inputs
- Trim whitespace from holder names
- Validate numeric ranges
- Prevent SQL injection (use parameterized queries)
- Prevent XSS (escape output)
```

### Data Integrity

```python
# Prevent orphaned data
- Use foreign key constraints with RESTRICT
- Soft delete (deactivate) instead of hard delete
- Validate referential integrity in service layer
```

## Implementation Phases

### Phase 1: Backend Foundation (Requirements 1, 2, 4)
- Create Holder model and migration
- Implement HolderRepository
- Implement HolderService
- Create holder API endpoints
- Add holder_id to HolderAllocation
- Migrate existing data
- Write unit tests

### Phase 2: Frontend Holder Management (Requirements 1, 4)
- Create Holder management page
- Implement HolderForm component
- Implement HolderList component
- Add holder API client functions
- Write component tests

### Phase 3: Enhanced Period Creation (Requirements 2, 3, 5)
- Update PeriodForm to use holder selector
- Implement "Copy from Previous" functionality
- Pre-populate shares from defaults
- Update period creation API to accept holder IDs
- Write integration tests

### Phase 4: Multi-Period Grid (Requirements 6, 7)
- Implement grid data API endpoint
- Create MultiPeriodGrid component
- Implement inline editing
- Add auto-save functionality
- Implement frozen columns
- Add calculation tooltips
- Write E2E tests

## Future Enhancements

These features are documented in `.kiro/specs/holder-enhancements/requirements.md`:

1. **Quick Period Creation**: Batch create multiple periods
2. **Holder Search and Filter**: Search and filter large holder lists
3. **Holder Validation**: Enhanced validation rules
4. **Holder Analytics**: Participation history and statistics
5. **Import/Export**: CSV import/export for bulk operations
6. **Audit Trail**: Track changes to holder and period data
