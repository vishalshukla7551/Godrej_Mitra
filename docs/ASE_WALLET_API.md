# ASE Wallet API Documentation

## Overview
This document describes the APIs created for the ASE Wallet page to replace sample data with real-time calculations from the database.

## APIs Created

### 1. GET /api/ase/passbook
Returns historical incentive transaction data for an ASE user.

**Authentication:** Required (ASE role)

**Query Parameters:**
- `limit` (optional): Number of months to return (default: 12)

**Response:**
```json
{
  "success": true,
  "data": {
    "ase": {
      "id": "string",
      "name": "string",
      "phone": "string",
      "storeCount": number
    },
    "transactions": [
      {
        "month": "Dec 24",
        "monthNum": 12,
        "year": 2024,
        "totalUnits": 45,
        "incentive": 1293.75,
        "qualified": true,
        "incentiveRate": 28.75
      }
    ]
  }
}
```

**Logic:**
- Fetches sales data from `DailyIncentiveReport` for all stores assigned to the ASE
- **Only returns months that have sales data** (skips months with 0 units)
- Calculates incentives for each month using ASE incentive logic:
  - Qualification Gate: 35 units minimum
  - If units < 35: No incentive (₹0)
  - If units >= 35 and <= 100: All units × ₹18.75
  - If units > 100: All units × ₹28.75

### 2. GET /api/ase/wallet/balance
Returns the total available balance for an ASE user.

**Authentication:** Required (ASE role)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 12450.75,
    "accumulatedMonths": 1,
    "lastPaymentDate": "15-11-2024",
    "lastPaymentAmount": 5200.00
  }
}
```

**Logic:**
- Calculates current month's accumulated incentive (not yet paid)
- Calculates last month's payment for display purposes
- Returns total balance (current month's accumulated amount)

## Frontend Integration

### ASE Wallet Page Updates
The ASE wallet page (`/ASE/wallet/page.tsx`) has been updated to:

1. **Fetch Balance on Load:**
   - Calls `/api/ase/wallet/balance` to get total available balance
   - Displays loading state while fetching
   - Shows real balance in the balance card

2. **Fetch Transactions on Load:**
   - Calls `/api/ase/passbook?limit=12` to get transactions with sales data
   - Displays loading state while fetching
   - Shows real transaction history in a 2-column table (Month | Incentive)
   - **Only shows months that have sales reports** (no empty months)

3. **Fetch Current Month Stats:**
   - Calls `/api/ase/incentive/calculate` for current month
   - Displays real units sold, qualification status, and incentive rate
   - Shows loading state while fetching

4. **View Calculation Modal:**
   - When user clicks "View Your Calculation" button
   - Fetches detailed breakdown from `/api/ase/incentive/calculate` for selected month
   - Shows date-wise and store-wise breakdown
   - Displays qualification status and incentive details
   - **Removed payment status and payment date** (not tracked in schema)

## Data Flow

```
ASE Wallet Page Load
├── Fetch Balance (/api/ase/wallet/balance)
│   └── Display total balance
├── Fetch Transactions (/api/ase/passbook)
│   └── Display transaction history table
└── Fetch Current Month Stats (/api/ase/incentive/calculate)
    └── Display quick stats cards

User Clicks "View Your Calculation"
└── Fetch Month Details (/api/ase/incentive/calculate?month=X&year=Y)
    └── Display detailed breakdown modal
```

## Database Tables Used

- `ASE`: ASE profile information (name, phone, storeIds)
- `DailyIncentiveReport`: Sales data for incentive calculations
- `Store`: Store information (name, city)

## Notes

- All incentive calculations are done on-the-fly from `DailyIncentiveReport` data
- No separate passbook or transaction table exists
- **Only months with actual sales data are returned** (months with 0 units are skipped)
- Payment status and payment dates are not tracked in the database schema
- The table shows a simplified view with just Month and Incentive columns
