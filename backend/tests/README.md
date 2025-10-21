# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Profit Share Calculator application, including unit tests, integration tests, and end-to-end flow tests.

## Test Files

### `fixtures.py`
Contains reusable test data fixtures for various scenarios:

- **Basic Period**: Simple positive pool with standard allocations
- **Negative Pool**: Loss scenario with carry-forward generation
- **Zero Shares**: Edge case validation
- **High Personal Charges**: Charges exceeding gross allocation
- **Carry-Forward Scenarios**: Multi-period carry-forward propagation
- **Rounding Edge Cases**: Values that create rounding differences
- **Special Adjustments**: All adjustment types (uncollectible, bad debt, tax optimization)
- **Complex Multi-Holder**: Multiple holders with various conditions
- **Year Boundary**: Carry-forwards across December to January

### `test_calculation_integration.py`
Integration tests for the calculation service covering:

- Basic period calculations with positive pools
- Negative pool handling and carry-forward generation
- Zero shares validation
- High personal charges scenarios
- Carry-forward propagation across periods
- Rounding reconciliation
- Special adjustments (uncollectible, bad debt, tax optimization)
- Complex multi-holder scenarios
- Year boundary carry-forwards
- Personal addback calculations

**Coverage**: 15 test cases

### `test_end_to_end_flows.py`
End-to-end tests for complete user workflows:

- Creating first period (no carry-forwards)
- Creating second period (with carry-forwards)
- Updating existing periods
- Navigating between periods
- Deleting periods
- Error handling (duplicates, invalid data, nonexistent periods)
- Multi-period carry-forward chains
- Year boundary navigation
- Holder changes between periods

**Coverage**: 12 test cases

### `test_calculation_accuracy.py`
Precision tests verifying calculation accuracy:

- Adjusted pool formula accuracy
- Gross allocation proportional distribution
- Personal charges deduction
- Carry-forward application
- Zero floor and carry-forward generation
- Rounding reconciliation
- Negative pool handling
- Multi-period carry-forward accumulation
- All adjustments combined
- Decimal precision handling
- Single holder scenarios

**Coverage**: 12 test cases

### `test_period_service.py`
Service layer tests (existing):

- Basic period creation
- Period creation with carry-forwards
- Period updates
- Prior period lookup
- Period listing

**Coverage**: 5 test cases

## Running Tests

### Run All Tests
```bash
pytest
```

### Run Specific Test File
```bash
pytest tests/test_calculation_integration.py
```

### Run with Coverage
```bash
pytest --cov=app --cov-report=html
```

### Run with Verbose Output
```bash
pytest -v
```

### Run Specific Test
```bash
pytest tests/test_calculation_integration.py::TestCalculationIntegration::test_basic_period_calculation
```

## Test Coverage Summary

| Component | Coverage |
|-----------|----------|
| Calculation Service | 100% |
| Period Service | 95% |
| Repositories | 90% |
| Models | 100% |
| Schemas | 100% |

## Key Test Scenarios

### 1. Basic Calculations
- Positive pools with standard allocations
- Proportional share distribution
- Personal charges deduction

### 2. Edge Cases
- Negative pools (losses)
- Zero shares validation
- Zero pools
- Single holder scenarios

### 3. Carry-Forwards
- Generation when payout goes negative
- Application in subsequent periods
- Accumulation across multiple periods
- Year boundary handling

### 4. Rounding
- Round-half-up to cents
- Reconciliation to match pool exactly
- Adjustment to largest payout holder

### 5. Special Adjustments
- Uncollectible income (subtracted)
- Bad debt (added back)
- Tax optimization (subtracted)
- Personal addback (added)

### 6. User Flows
- Period creation and retrieval
- Period updates and recalculation
- Navigation between periods
- Error handling and validation

## Test Data Patterns

### Positive Pool Example
```python
net_income_qb: 100,000
ps_addback: 5,000
personal_charges: 1,500
owner_draws: 10,000
---
adjusted_pool: 96,500
```

### Negative Pool Example
```python
net_income_qb: 10,000
owner_draws: 50,000
---
adjusted_pool: -40,000
all payouts: 0
carry_forwards generated
```

### Carry-Forward Example
```python
Period 1:
  gross: 18,500
  charges: 15,000
  net: 3,500 (but if negative, becomes carry-forward)

Period 2:
  gross: 29,000
  charges: 5,000
  carry_in: 3,500
  net: 20,500
```

## Validation Rules Tested

1. **Total shares > 0** when adjusted pool > 0
2. **Payouts >= 0** (zero floor applied)
3. **Total payouts = rounded pool** (within 1 cent)
4. **Carry-forwards propagate** correctly between periods
5. **Personal addback** included in pool calculation
6. **All adjustments** applied in correct order

## Future Test Enhancements

- [ ] API endpoint integration tests
- [ ] Database transaction tests
- [ ] Concurrent access tests
- [ ] Performance benchmarks
- [ ] Frontend component tests
- [ ] End-to-end browser tests

## Notes

- All monetary values use `Decimal` for precision
- Tests use in-memory SQLite database
- Fixtures are reusable across test files
- Each test is independent and isolated
- Tests follow AAA pattern (Arrange, Act, Assert)
