# Implementation Plan: Holder Management System

## Completed Setup Tasks

- [x] 1. Create Holder database model and migration
  - Create `backend/app/models/holder.py` with Holder SQLAlchemy model including id, name, default_shares, is_active, timestamps
  - Create Alembic migration to add `holders` table with unique constraint on name and indexes
  - Add Holder to `backend/app/models/__init__.py` exports
  - _Requirements: 1.1, 1.2, 4.1, 5.1_

- [x] 2. Add holder_id foreign key to HolderAllocation
  - Create Alembic migration to add `holder_id` column to `holder_allocations` table (nullable initially)
  - Add foreign key constraint from `holder_allocations.holder_id` to `holders.id` with RESTRICT on delete
  - Create index on `holder_allocations.holder_id`
  - Update `backend/app/models/holder_allocation.py` to add holder_id field and holder relationship
  - _Requirements: 2.1, 4.2_

- [x] 3. Create data migration to populate holders from existing allocations
  - Create Alembic migration to extract unique holder names from `holder_allocations`
  - Insert holder records for each unique name with is_active=True
  - Update `holder_allocations.holder_id` by matching holder_name to holders.name
  - Calculate and set default_shares for each holder based on most common share count
  - Make `holder_allocations.holder_id` NOT NULL after population
  - _Requirements: 2.4, 5.2_

- [x] 4. Implement HolderRepository
  - Create `backend/app/repositories/holder_repository.py` with HolderRepository class
  - Implement save, find_by_id, find_by_name, find_all methods
  - Implement update and delete methods
  - Implement count_allocations method to check if holder has period data
  - Add query filtering for active_only parameter
  - _Requirements: 1.3, 4.1, 4.3, 4.4_

## Feature 1: Basic Holder CRUD (Backend + Frontend)

- [x] 5. Implement HolderService
  - Create `backend/app/services/holder_service.py` with HolderService class
  - Implement create_holder with name uniqueness validation
  - Implement get_holder, get_holder_by_name, list_holders methods
  - Implement update_holder with cascade name updates to allocations
  - Implement deactivate_holder (soft delete) with allocation count check
  - Implement get_or_create_holder for seamless holder creation
  - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Create Holder Pydantic schemas
  - Create `backend/app/schemas/holder.py` with HolderCreate, HolderUpdate, HolderResponse schemas
  - Add validation for name (non-empty, max 255 chars) and default_shares (positive integer)
  - Create HolderWithStats schema for holder details with participation info
  - _Requirements: 1.2, 4.1, 5.1_

- [x] 7. Implement Holder API endpoints
  - Create `backend/app/api/holders.py` with holder router
  - Implement POST /api/holders to create holder
  - Implement GET /api/holders to list holders with active_only filter
  - Implement GET /api/holders/{id} to get holder details
  - Implement PUT /api/holders/{id} to update holder
  - Implement DELETE /api/holders/{id} to deactivate holder (prevent if has allocations)
  - Add proper error handling (400 for validation, 404 for not found, 409 for conflicts)
  - Register router in main application
  - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 8. Create frontend Holder type definitions and API client
  - Create `frontend/lib/types/holder.ts` with Holder, HolderFormData, HolderWithStats interfaces
  - Create `frontend/lib/api/holders.ts` with API client functions (createHolder, getHolders, getHolder, updateHolder, deactivateHolder)
  - Add error handling and type safety to API calls
  - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 9. Create HolderForm component
  - Create `frontend/components/features/HolderForm.tsx` for creating/editing holders
  - Add form fields for name and default_shares
  - Implement form validation (required name, positive default_shares)
  - Add submit and cancel handlers
  - Show loading and error states
  - _Requirements: 1.2, 4.1, 4.2, 5.1_

- [x] 10. Create HolderList component
  - Create `frontend/components/features/HolderList.tsx` to display holder table
  - Show columns for name, default_shares, and actions (edit, deactivate)
  - Implement edit action to open HolderForm in modal
  - Implement deactivate action with confirmation dialog
  - Show empty state when no holders exist
  - _Requirements: 1.3, 4.3, 4.4_

- [x] 11. Create Holder management page
  - Create `frontend/app/holders/page.tsx` as main holder management interface
  - Display HolderList component
  - Add "New Holder" button to open HolderForm modal
  - Implement holder creation, update, and deactivation flows
  - Add loading states and error handling
  - Show success/error toasts for operations
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 12. Add navigation link to holder management
  - Update main navigation in `frontend/app/layout.tsx` or navigation component
  - Add "Holders" link to /holders page
  - Update home page to include link to holder management
  - _Requirements: 1.1_

## Feature 2: Period Creation with Holder Selection

- [ ] 13. Enhance PeriodService to work with holder entities
  - Update `backend/app/services/period_service.py` to accept holder_ids in addition to holder names
  - Modify create_period to use get_or_create_holder for each holder input
  - Modify update_period to handle holder_id relationships
  - Update allocation creation to set holder_id from holder entity
  - Ensure backward compatibility with holder_name-only requests
  - _Requirements: 1.4, 2.2, 3.1, 3.5_

- [ ] 14. Update Period schemas to support holder selection
  - Update `backend/app/schemas/period.py` HolderInput to include optional holder_id field
  - Add validation to accept either holder_id or holder_name
  - Update PeriodCreateRequest validation to work with holder entities
  - _Requirements: 1.4, 2.2_

- [ ] 15. Create HolderSelector component
  - Create `frontend/components/features/HolderSelector.tsx` for selecting holders in period form
  - Display multi-select dropdown with holder names
  - Filter to show only active holders
  - Add "Create New Holder" option that opens inline form
  - Pre-populate shares input with holder's default_shares
  - _Requirements: 1.4, 3.4, 5.2_

- [ ] 16. Enhance PeriodForm to use HolderSelector
  - Update `frontend/components/features/PeriodForm.tsx` to use HolderSelector component
  - Replace manual holder name input with holder selection
  - Pre-populate shares from holder defaults when holder is selected
  - Allow overriding default shares per period
  - Maintain support for adding personal charges per holder
  - _Requirements: 1.4, 2.2, 2.3, 5.2_

- [ ] 17. Update period detail page to show holder information
  - Update `frontend/app/period/[year]/[month]/page.tsx` to display holder names as links
  - Add holder ID to allocation display
  - Link holder names to holder detail view (if implemented)
  - Show holder's default shares in allocation display
  - _Requirements: 2.4, 4.5_

## Feature 3: Copy from Previous Period

- [ ] 18. Implement "Copy from Previous Period" functionality
  - Add "Copy from Previous" button to period creation page
  - Create API endpoint GET /api/periods/previous/{year}/{month} to get prior period data
  - Fetch previous period's holders, shares, and personal charges
  - Pre-populate PeriodForm with previous period data
  - Allow user to modify any values before saving
  - Handle case when no previous period exists
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Feature 4: Multi-Period Grid View

- [ ] 19. Create multi-period grid data API endpoint
  - Add GET /api/periods/grid endpoint to `backend/app/api/periods.py`
  - Accept query parameters: holder_ids (optional), start_year, start_month, num_months (default 12)
  - Implement optimized query with JOINs to fetch holders, periods, and allocations
  - Return structured data with holders array, months array, and cells map
  - Include calculated fields (net_payout) in cell data
  - _Requirements: 6.1, 6.2, 7.1, 7.2_

- [ ] 20. Create grid cell update API endpoint
  - Add PUT /api/periods/grid/cell endpoint to `backend/app/api/periods.py`
  - Accept holder_id, year, month, shares, personal_charges in request body
  - Create period if it doesn't exist (with default values for period-level fields)
  - Update or create holder allocation for the cell
  - Recalculate period totals and allocations
  - Return updated cell data with calculated payout
  - _Requirements: 6.3, 6.4, 7.3, 7.4, 7.5_

- [ ] 21. Create MultiPeriodGrid types and utilities
  - Create `frontend/lib/types/grid.ts` with GridCell, MultiPeriodGridData interfaces
  - Create utility functions to transform API response to grid structure
  - Create helper to generate cell key (holderId-year-month)
  - Create utility to format cell display values
  - _Requirements: 6.1, 7.1_

- [ ] 22. Create GridCell component
  - Create `frontend/components/features/GridCell.tsx` for individual grid cells
  - Display three lines: shares, personal charges, net payout
  - Implement inline editing mode on click
  - Show input fields for shares and personal charges when editing
  - Display net payout as read-only calculated value
  - Add tooltip on hover showing calculation breakdown
  - Handle empty cells (no data for that period)
  - _Requirements: 6.3, 6.4, 6.9, 7.3, 7.4, 7.8, 7.9_

- [ ] 23. Create MultiPeriodGrid component
  - Create `frontend/components/features/MultiPeriodGrid.tsx` as main grid component
  - Render table with holders as rows and months as columns
  - Use GridCell component for each cell
  - Implement frozen first column (holder names) for horizontal scrolling
  - Add month headers with click handler to edit period-level data
  - Show loading state while fetching data
  - Implement auto-save on cell blur with debouncing (500ms)
  - Show saving indicator for cells being updated
  - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7, 6.10, 7.1, 7.2, 7.6, 7.7, 7.10_

- [ ] 24. Create multi-period grid page
  - Create `frontend/app/periods/grid/page.tsx` as grid view route
  - Fetch grid data on mount (default to last 12 months)
  - Display MultiPeriodGrid component
  - Add controls to change date range (month navigation)
  - Add "Add Holder" button to add new row
  - Implement error handling and retry logic
  - Show success/error toasts for save operations
  - _Requirements: 6.1, 6.2, 6.6, 7.1, 7.2_

- [ ] 25. Add navigation link to grid view
  - Update main navigation in `frontend/app/layout.tsx` or navigation component
  - Add "Period Grid" link to /periods/grid page
  - Update home page to include link to grid view
  - _Requirements: 6.1_

## Optional Testing Tasks

- [ ]* 26. Write backend integration tests
  - Create `backend/tests/test_holder_integration.py` for holder CRUD operations
  - Test holder creation, retrieval, update, and deactivation via API
  - Test holder validation errors (duplicate name, empty name)
  - Test deactivation prevention when holder has allocations
  - Create `backend/tests/test_period_with_holders.py` for period operations with holders
  - Test period creation with holder_ids
  - Test period creation with new holders (get_or_create)
  - Test grid endpoint returns correct structure
  - Test cell update endpoint creates/updates allocations
  - _Requirements: 1.1, 1.2, 1.4, 2.2, 4.1, 4.3, 4.4, 6.3, 7.3_

- [ ]* 27. Write frontend component tests
  - Create tests for HolderForm component (validation, submission)
  - Create tests for HolderList component (display, actions)
  - Create tests for HolderSelector component (selection, creation)
  - Create tests for GridCell component (display, editing, tooltip)
  - Create tests for MultiPeriodGrid component (rendering, scrolling, editing)
  - _Requirements: 1.2, 1.3, 1.4, 6.3, 6.9, 7.3_

- [ ]* 28. Write end-to-end tests
  - Create `backend/tests/test_holder_management_e2e.py` for complete workflows
  - Test complete holder lifecycle (create, use in period, update, deactivate)
  - Test multi-period data entry workflow via grid
  - Test copy from previous period workflow
  - Test holder name update cascades to all periods
  - _Requirements: 1.1, 2.2, 3.1, 4.2, 6.1_
