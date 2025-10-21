# Frontend Components

This directory contains all React components for the Profit Share Calculator application.

## Features Components

Located in `features/` directory:

### PeriodForm
Form component for entering monthly period data including:
- Year and month selection
- Net Income (QuickBooks)
- PS Payout Add-back
- Owner Draws
- Special adjustments (Uncollectible, Bad Debt, Tax Optimization)

**Features:**
- React Hook Form integration
- Zod validation schema
- Error display for validation failures
- Responsive grid layout

### HolderAllocationForm
Dynamic form for managing multiple holder allocations:
- Add/remove holder rows
- Input fields for holder name, shares, and personal charges
- Per-holder validation

**Features:**
- Dynamic field array management
- Individual holder validation
- Responsive layout
- Back/Submit navigation

### CalculationSummary
Comprehensive display of calculation results:
- Pool build-up breakdown
- Adjusted pool and total shares
- Allocations table with all holder details
- Carry-forward movements
- Rounding delta and adjustment details

**Features:**
- Currency formatting
- Color-coded values (positive/negative)
- Rounding adjustment highlighting
- Responsive table layout

### PeriodNavigator
Navigation component for browsing periods:
- Month/year selector dropdowns
- Previous/next month navigation buttons
- Create new period button
- Current period display

**Features:**
- Client-side routing integration
- Keyboard-friendly navigation
- Responsive layout

## UI Components

Located in `ui/` directory - reusable UI primitives:

### CurrencyInput
Specialized input for currency values with $ prefix and proper formatting.

### NumberInput
Number input with optional integer-only mode and validation.

### Button
Reusable button component with:
- Multiple variants (primary, secondary, danger)
- Loading states with spinner
- Disabled state handling

### ErrorMessage
Consistent error display component with icon and styling.

### LoadingSpinner
Loading indicator with:
- Multiple sizes (sm, md, lg)
- Optional message display

## Usage

Import components from their respective index files:

```typescript
// Feature components
import { PeriodForm, HolderAllocationForm, CalculationSummary, PeriodNavigator } from '@/components/features';

// UI components
import { Button, CurrencyInput, NumberInput, ErrorMessage, LoadingSpinner } from '@/components/ui';
```

## Styling

All components use Tailwind CSS for styling with:
- Consistent color scheme (blue primary, red errors, green success)
- Responsive design patterns
- Accessible focus states
- Proper spacing and typography
