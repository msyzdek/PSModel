# Type Definitions

This directory contains TypeScript type definitions for the application.

## Files

### holder.ts
Type definitions for holder management:
- `Holder`: Main holder entity from the backend
- `HolderFormData`: Form data for creating/updating holders
- `HolderWithStats`: Holder with participation statistics
- `CreateHolderRequest`: Request body for creating a holder
- `UpdateHolderRequest`: Request body for updating a holder

### period.ts
Type definitions for period and calculation data (existing).

## Usage

```typescript
import type { Holder, HolderFormData } from '@/lib/types/holder';
import { createHolder, getHolders } from '@/lib/api/holders';

// Create a holder
const formData: HolderFormData = {
  name: 'John Doe',
  default_shares: 100,
};

const holder: Holder = await createHolder(formData);

// List holders
const holders: Holder[] = await getHolders(true); // active only
```

## Notes

- All types use snake_case to match the backend API responses
- Dates are represented as ISO 8601 strings
- Nullable fields use `| null` instead of `| undefined`
