# API Client Functions

This directory contains API client functions for making requests to the backend.

## Files

### holders.ts
API client for holder management endpoints:
- `createHolder(request)`: Create a new holder
- `getHolders(activeOnly)`: List all holders (with optional active filter)
- `getHolder(id)`: Get a specific holder by ID
- `getHolderWithStats(id)`: Get holder with participation statistics
- `updateHolder(id, request)`: Update a holder
- `deactivateHolder(id)`: Deactivate a holder (soft delete)

### periods.ts
API client for period management endpoints (existing).

## Usage

```typescript
import { createHolder, getHolders, updateHolder } from '@/lib/api/holders';

// Create a holder
const holder = await createHolder({
  name: 'John Doe',
  default_shares: 100,
});

// List active holders
const activeHolders = await getHolders(true);

// List all holders (including inactive)
const allHolders = await getHolders(false);

// Update a holder
const updated = await updateHolder(holder.id, {
  name: 'Jane Doe',
  default_shares: 150,
});

// Deactivate a holder
await deactivateHolder(holder.id);
```

## Error Handling

All API functions use the base `api-client` utilities which provide:
- Automatic error handling with `ApiError` class
- HTTP status code extraction
- FastAPI error detail parsing
- Network error handling

```typescript
import { ApiError } from '@/lib/utils/api-client';

try {
  await createHolder({ name: 'Test', default_shares: 100 });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error (${error.status}): ${error.message}`);
  }
}
```

## Notes

- All functions return Promises
- Authentication is handled automatically via cookies
- Request/response bodies use snake_case to match backend
- The base URL is configured via `NEXT_PUBLIC_API_URL` environment variable
