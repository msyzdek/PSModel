# API Endpoints Documentation

This document describes all the API endpoints implemented for the Profit Share Calculator.

## Base URL

Development: `http://localhost:8000`

## Endpoints

### Health & Status

#### GET `/`
Root endpoint returning API information.

**Response:**
```json
{
  "message": "Profit Share Calculator API",
  "version": "0.1.0"
}
```

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

---

### Period Management

#### POST `/api/periods`
Create a new period with calculations.

**Request Body:**
```json
{
  "period_data": {
    "year": 2024,
    "month": 1,
    "net_income_qb": 100000.00,
    "ps_addback": 5000.00,
    "owner_draws": 10000.00,
    "uncollectible": 0.00,
    "bad_debt": 0.00,
    "tax_optimization": 0.00
  },
  "holders": [
    {
      "holder_name": "John Doe",
      "shares": 100,
      "personal_charges": 500.00
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "period": {
    "year": 2024,
    "month": 1,
    "adjusted_pool": 95000.00,
    "total_shares": 100,
    "rounding_delta": 0.00
  },
  "allocations": [
    {
      "holder_name": "John Doe",
      "shares": 100,
      "gross_allocation": 95000.00,
      "personal_charges": 500.00,
      "carry_forward_in": 0.00,
      "net_payout": 94500.00,
      "carry_forward_out": 0.00,
      "received_rounding_adjustment": false
    }
  ]
}
```

**Errors:**
- `400 Bad Request` - Period already exists or validation failed
- `422 Unprocessable Entity` - Calculation failed

---

#### GET `/api/periods`
List all periods ordered by most recent first.

**Query Parameters:**
- `limit` (optional, default: 12) - Maximum number of periods to return

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "year": 2024,
    "month": 1,
    "net_income_qb": 100000.00,
    "ps_addback": 5000.00,
    "owner_draws": 10000.00,
    "uncollectible": 0.00,
    "bad_debt": 0.00,
    "tax_optimization": 0.00,
    "adjusted_pool": 95000.00,
    "total_shares": 100,
    "rounding_delta": 0.00,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
]
```

---

#### GET `/api/periods/{year}/{month}`
Get a specific period by year and month.

**Path Parameters:**
- `year` - Year of the period
- `month` - Month of the period (1-12)

**Response:** `200 OK`
```json
{
  "period": {
    "year": 2024,
    "month": 1,
    "adjusted_pool": 95000.00,
    "total_shares": 100,
    "rounding_delta": 0.00
  },
  "allocations": [...]
}
```

**Errors:**
- `404 Not Found` - Period not found

---

#### PUT `/api/periods/{year}/{month}`
Update an existing period and recalculate.

**Path Parameters:**
- `year` - Year of the period to update
- `month` - Month of the period to update

**Request Body:** Same as POST `/api/periods`

**Response:** `200 OK` - Same structure as POST response

**Errors:**
- `404 Not Found` - Period not found
- `400 Bad Request` - Validation failed

---

#### DELETE `/api/periods/{year}/{month}`
Delete a period.

**Path Parameters:**
- `year` - Year of the period to delete
- `month` - Month of the period to delete

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Period not found

---

### Calculations

#### POST `/api/calculate/preview`
Preview calculation without saving to database.

**Request Body:** Same as POST `/api/periods`

**Response:** `200 OK` - Same structure as POST `/api/periods` response

**Errors:**
- `400 Bad Request` - Validation failed
- `422 Unprocessable Entity` - Calculation failed

---

#### GET `/api/periods/{year}/{month}/summary`
Get comprehensive period summary report.

**Path Parameters:**
- `year` - Year of the period
- `month` - Month of the period (1-12)

**Response:** `200 OK`
```json
{
  "period": {
    "year": 2024,
    "month": 1,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  },
  "pool_breakdown": {
    "net_income_qb": 100000.00,
    "ps_addback": 5000.00,
    "personal_addback_total": 500.00,
    "owner_draws": 10000.00,
    "uncollectible": 0.00,
    "bad_debt": 0.00,
    "tax_optimization": 0.00,
    "adjusted_pool": 95000.00
  },
  "allocations": [
    {
      "holder_name": "John Doe",
      "shares": 100,
      "gross_allocation": 95000.00,
      "personal_charges": 500.00,
      "carry_forward_in": 0.00,
      "net_payout": 94500.00,
      "carry_forward_out": 0.00,
      "received_rounding_adjustment": false
    }
  ],
  "totals": {
    "total_shares": 100,
    "total_gross_allocation": 95000.00,
    "total_personal_charges": 500.00,
    "total_carry_forward_in": 0.00,
    "total_net_payout": 94500.00,
    "total_carry_forward_out": 0.00
  },
  "rounding_details": {
    "rounding_delta": 0.00,
    "holder_with_adjustment": null
  }
}
```

**Errors:**
- `404 Not Found` - Period not found

---

## Error Handling

All endpoints follow consistent error response format:

### Validation Error (400)
```json
{
  "detail": "Validation error",
  "type": "validation_error",
  "errors": [
    {
      "loc": ["body", "period_data", "month"],
      "msg": "ensure this value is less than or equal to 12",
      "type": "value_error.number.not_le"
    }
  ]
}
```

### Not Found (404)
```json
{
  "detail": "Period for 2024-01 not found"
}
```

### Calculation Error (422)
```json
{
  "detail": "Calculation failed: Total shares must be greater than 0"
}
```

### Database Error (500)
```json
{
  "detail": "Database error occurred",
  "type": "database_error"
}
```

### Internal Server Error (500)
```json
{
  "detail": "Internal server error occurred",
  "type": "internal_error"
}
```

---

## CORS Configuration

CORS is configured to allow requests from the frontend application.

**Environment Variable:**
- `CORS_ORIGINS` - Comma-separated list of allowed origins (default: `http://localhost:3000,http://127.0.0.1:3000`)

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, Accept

---

## Request Logging

All requests are logged with the following information:
- HTTP method
- Request path
- Query parameters

Errors are logged with full stack traces for debugging.
