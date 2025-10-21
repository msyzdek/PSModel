# Implementation Plan

- [ ] 1. Set up project structure and dependencies
  - Create backend directory with FastAPI project structure (app/, tests/, requirements.txt)
  - Create frontend directory with Next.js project using create-next-app with TypeScript and Tailwind
  - Configure pyproject.toml with Black, Ruff, mypy settings
  - Configure ESLint and Prettier for frontend
  - Set up .env.example files for both backend and frontend
  - _Requirements: 8.4_

- [ ] 2. Implement backend data models and database schema
  - [ ] 2.1 Create SQLAlchemy models for MonthlyPeriod and HolderAllocation
    - Define MonthlyPeriod model with all fields (year, month, net_income_qb, ps_addback, owner_draws, etc.)
    - Define HolderAllocation model with all fields (holder_name, shares, personal_charges, etc.)
    - Add relationships between models
    - Add unique constraint on (year, month) for MonthlyPeriod
    - _Requirements: 7.1, 7.2_

  - [ ] 2.2 Create Pydantic schemas for API validation
    - Create PeriodInput schema with validation rules
    - Create HolderInput schema with validation rules
    - Create CalculationResult response schema
    - Create PeriodSummary response schema
    - _Requirements: 2.6, 2.7_

  - [ ] 2.3 Set up database connection and migrations
    - Configure SQLAlchemy engine and session management
    - Create Alembic migration for initial schema
    - Add database initialization script
    - _Requirements: 7.1_

- [ ] 3. Implement calculation service core logic
  - [ ] 3.1 Create ProfitShareCalculationService class
    - Implement calculate_adjusted_pool method
    - Implement calculate_personal_addback_total method
    - Implement calculate_gross_allocations method
    - Implement apply_personal_charges method
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.2 Implement carry-forward logic
    - Create method to load carry-forwards from prior period
    - Implement logic to apply carry-forward_in to current calculations
    - Implement zero floor logic that generates carry-forward_out
    - _Requirements: 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.3 Implement rounding and reconciliation
    - Create round-half-up rounding function
    - Implement logic to find holder with largest positive payout
    - Calculate rounding delta and apply adjustment
    - Validate that rounded total equals rounded pool
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 3.4 Implement special adjustments handling
    - Add uncollectible income to adjusted pool calculation
    - Add bad debt to adjusted pool calculation
    - Add tax optimization to adjusted pool calculation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 4. Implement repository layer
  - [ ] 4.1 Create PeriodRepository
    - Implement save method
    - Implement find_by_id method
    - Implement find_by_year_month method
    - Implement find_all method with ordering
    - Implement delete method
    - _Requirements: 7.3, 7.4_

  - [ ] 4.2 Create HolderAllocationRepository
    - Implement save_all method for batch insert
    - Implement find_by_period method
    - Implement find_carry_forwards method
    - Implement delete_by_period method
    - _Requirements: 7.3, 7.4_

- [ ] 5. Implement service layer
  - [ ] 5.1 Create PeriodService
    - Implement create_period method that orchestrates calculation and persistence
    - Implement get_period method with allocations
    - Implement update_period method that recalculates
    - Implement list_periods method
    - Implement get_prior_period method for carry-forward lookup
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 5.2 Integrate calculation service with period service
    - Call calculation service from create_period
    - Call calculation service from update_period
    - Handle carry-forward loading from prior period
    - Validate calculation results before saving
    - _Requirements: 1.6, 3.4, 7.2_

- [ ] 6. Implement FastAPI endpoints
  - [ ] 6.1 Create period CRUD endpoints
    - POST /api/periods - create new period with calculations
    - GET /api/periods - list all periods
    - GET /api/periods/{year}/{month} - get specific period
    - PUT /api/periods/{year}/{month} - update period
    - DELETE /api/periods/{year}/{month} - delete period
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.3, 10.2_

  - [ ] 6.2 Create calculation endpoints
    - POST /api/calculate/preview - preview calculation without saving
    - GET /api/periods/{year}/{month}/summary - get period summary report
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 6.3 Add error handling middleware
    - Handle validation errors (400)
    - Handle not found errors (404)
    - Handle calculation errors (422)
    - Handle database errors (500)
    - Add request logging
    - _Requirements: 2.6, 2.7_

  - [ ] 6.4 Configure CORS for frontend
    - Set allowed origins from environment variable
    - Configure allowed methods and headers
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7. Implement frontend data layer
  - [ ] 7.1 Create API client utilities
    - Create base fetch wrapper with error handling
    - Create typed API client functions for all endpoints
    - Add request/response interceptors
    - _Requirements: 7.3_

  - [ ] 7.2 Create TypeScript types
    - Define PeriodInput interface
    - Define HolderInput interface
    - Define CalculationResult interface
    - Define PeriodSummary interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 7.3 Create custom hooks
    - Create usePeriod hook for fetching period data
    - Create usePeriods hook for listing periods
    - Create useCreatePeriod mutation hook
    - Create useUpdatePeriod mutation hook
    - _Requirements: 7.3, 10.2_

- [ ] 8. Implement frontend UI components
  - [ ] 8.1 Create PeriodForm component
    - Build form with React Hook Form
    - Add Zod validation schema
    - Create input fields for all period-level data
    - Add error display for validation failures
    - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3_

  - [ ] 8.2 Create HolderAllocationForm component
    - Build dynamic form for multiple holders
    - Add/remove holder row functionality
    - Input fields for holder_name, shares, personal_charges
    - Per-holder validation
    - _Requirements: 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 8.3 Create CalculationSummary component
    - Display pool build-up breakdown
    - Display adjusted pool and total shares
    - Create allocations table with all holder details
    - Display carry-forward movements
    - Display rounding delta and adjustment details
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 8.4 Create PeriodNavigator component
    - Month/year selector dropdown
    - Previous/next month navigation buttons
    - Create new period button
    - Display current period clearly
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 8.5 Create shared UI components
    - Create CurrencyInput component with formatting
    - Create NumberInput component with validation
    - Create Button component with loading states
    - Create ErrorMessage component
    - Create LoadingSpinner component
    - _Requirements: 2.6, 2.7_

- [ ] 9. Implement frontend pages
  - [ ] 9.1 Create dashboard page (/)
    - Display list of recent periods in table
    - Show quick stats (total periods, latest period)
    - Add navigation to create new period
    - Add navigation to view existing periods
    - _Requirements: 10.1, 10.2_

  - [ ] 9.2 Create period entry page (/period/[year]/[month])
    - Integrate PeriodForm component
    - Integrate HolderAllocationForm component
    - Handle form submission to API
    - Show success/error messages
    - Redirect to summary on success
    - Load existing data for edit mode
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 10.2_

  - [ ] 9.3 Create period summary page (/period/[year]/[month]/summary)
    - Integrate CalculationSummary component
    - Fetch period data from API
    - Add edit button to return to entry page
    - Add navigation to other periods
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2_

  - [ ] 9.4 Create layout and navigation
    - Create root layout with header
    - Add navigation menu
    - Add PeriodNavigator to header
    - Style with Tailwind CSS
    - _Requirements: 10.1, 10.4_

- [ ] 10. Implement authentication (MVP)
  - [ ] 10.1 Create simple admin authentication
    - Add admin credentials to environment variables
    - Create login endpoint in backend
    - Implement session-based auth with JWT
    - Add auth middleware to protect endpoints
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 10.2 Create login page
    - Build login form with username/password
    - Handle authentication errors
    - Redirect to dashboard on success
    - Store auth token in httpOnly cookie
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 10.3 Add auth protection to frontend
    - Create auth context/provider
    - Protect routes with auth check
    - Redirect to login if not authenticated
    - Add logout functionality
    - _Requirements: 8.2, 8.3_

- [ ] 11. Add data validation and error handling
  - [ ] 11.1 Add backend validation
    - Validate total_shares > 0 when adjusted_pool > 0
    - Validate all required fields present
    - Validate numeric fields are valid numbers
    - Validate shares are positive integers
    - Validate personal_charges are non-negative
    - _Requirements: 1.6, 2.6, 2.7_

  - [ ] 11.2 Add frontend validation
    - Implement Zod schemas matching backend validation
    - Add field-level validation feedback
    - Prevent submission of invalid data
    - Display API error messages
    - _Requirements: 2.6, 2.7_

  - [ ] 11.3 Add error boundaries and fallbacks
    - Create error boundary component
    - Add fallback UI for errors
    - Implement retry mechanisms
    - Add toast notifications for errors
    - _Requirements: 2.6, 2.7_

- [ ] 12. Add formatting and display utilities
  - [ ] 12.1 Create currency formatting utilities
    - Format numbers as currency with $ and commas
    - Handle negative values with proper display
    - Round to 2 decimal places for display
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 12.2 Create date formatting utilities
    - Format month/year for display
    - Parse month/year from URL params
    - Generate month/year options for selectors
    - _Requirements: 10.1, 10.2, 10.4_

- [ ] 13. Set up development and deployment configuration
  - [ ] 13.1 Create Docker configuration
    - Create Dockerfile for backend
    - Create docker-compose.yml for local development
    - Configure volume for SQLite database
    - Add environment variable configuration
    - _Requirements: 7.1, 7.5_

  - [ ] 13.2 Create deployment scripts
    - Add backend startup script
    - Add database initialization script
    - Create README with setup instructions
    - Document environment variables
    - _Requirements: 7.5_

  - [ ] 13.3 Configure frontend build
    - Set up environment variables for API URL
    - Configure build optimization
    - Add deployment configuration for Vercel
    - _Requirements: 7.5_

- [ ] 14. Integration and end-to-end testing
  - [ ] 14.1 Create test data fixtures
    - Create sample period data based on Excel model
    - Create test cases for edge cases (negative pool, zero shares)
    - Create test cases for carry-forward scenarios
    - Create test cases for rounding edge cases
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 14.2 Test complete user flows
    - Test creating first period (no carry-forward)
    - Test creating second period (with carry-forward)
    - Test updating existing period
    - Test navigation between periods
    - Test error scenarios
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 14.3 Verify calculation accuracy
    - Compare calculation results with Excel model
    - Verify rounding reconciliation
    - Verify carry-forward propagation
    - Verify all adjustment components
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 9.4, 9.5, 9.6_
