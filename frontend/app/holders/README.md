# Holder Management Page

## Overview

The holder management page (`/holders`) provides a complete interface for managing the master list of holders in the profit share system.

## Features Implemented

### ✅ Complete Features
- **Holder List Display**: Shows all active holders in a table with name, default shares, and status
- **Create New Holder**: Modal form to add new holders with validation
- **Edit Holder**: Modal form to update holder name and default shares
- **Deactivate Holder**: Soft delete with confirmation dialog
- **Loading States**: Spinner during data fetching
- **Error Handling**: Error messages with retry functionality
- **Toast Notifications**: Success/error messages for all operations
- **Empty State**: Helpful message when no holders exist

### 🔄 Temporary Implementations

The following are implemented inline and will be replaced once their respective tasks are complete:

1. **Holder Types** (Task 8)
   - Currently defined inline in the page
   - Will be imported from `frontend/lib/types/holder.ts`

2. **Holder API Client** (Task 8)
   - Currently implemented inline with fetch calls
   - Will be imported from `frontend/lib/api/holders.ts`

3. **HolderForm Component** (Task 9)
   - Currently implemented inline in the page
   - Will be imported from `frontend/components/features/HolderForm.tsx`

### ⏳ Required Dependencies

For full functionality, the following tasks must be completed:

1. **Task 6**: Create Holder Pydantic schemas
   - Backend validation schemas for holder data

2. **Task 7**: Implement Holder API endpoints
   - `POST /api/holders` - Create holder
   - `GET /api/holders` - List holders
   - `GET /api/holders/{id}` - Get holder details
   - `PUT /api/holders/{id}` - Update holder
   - `DELETE /api/holders/{id}` - Deactivate holder

## Usage

### Accessing the Page

Navigate to `/holders` in the application.

### Creating a Holder

1. Click the "+ New Holder" button
2. Enter holder name (required)
3. Optionally enter default shares
4. Click "Create Holder"

### Editing a Holder

1. Click "Edit" button next to a holder
2. Modify name or default shares
3. Click "Update Holder"

### Deactivating a Holder

1. Click "Deactivate" button next to a holder
2. Confirm the action in the dialog
3. Holder will be marked inactive (preserves historical data)

## API Integration

The page expects the following API endpoints:

```typescript
GET /api/holders?active_only=true
Response: Holder[]

POST /api/holders
Body: { name: string, default_shares: number | null }
Response: Holder

PUT /api/holders/{id}
Body: { name: string, default_shares: number | null }
Response: Holder

DELETE /api/holders/{id}
Response: void (204 No Content)
```

## Error Handling

The page handles the following error scenarios:

- **Network errors**: Shows error message with retry button
- **Validation errors**: Displays field-level error messages
- **API errors**: Shows toast notification with error details
- **Deactivation conflicts**: Shows error if holder has existing allocations

## State Management

The page manages the following state:

- `holders`: Array of holder objects
- `isLoading`: Loading state for initial data fetch
- `error`: Error message for display
- `showModal`: Controls modal visibility
- `editingHolder`: Currently editing holder (null for new)
- `isSubmitting`: Loading state for form submission

## Styling

The page uses Tailwind CSS classes consistent with the rest of the application:

- Responsive layout with max-width container
- Card-based design for the holder list
- Modal overlay for forms
- Consistent button styles and colors
- Accessible form inputs with proper labels

## Future Enhancements

Once tasks 6-9 are complete:

1. Replace inline type definitions with imports
2. Replace inline API client with proper module
3. Replace inline HolderForm with component import
4. Add holder statistics (total periods, participation history)
5. Add search and filter functionality
6. Add pagination for large holder lists
