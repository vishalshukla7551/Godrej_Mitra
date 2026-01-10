# Monthly Incentive Calculation API

## Overview
This API calculates the monthly incentive for a SEC (Samsung Experience Consultant) based on their sales reports and the price incentive slab rules.

## Endpoint
```
GET /api/sec/incentive/calculate?month=<month>&year=<year>
GET /api/sec/incentive/calculate?secId=<secId>&month=<month>&year=<year> (Admin only)
```

## Query Parameters
- `month` (required): Month number (1-12)
- `year` (required): Year (e.g., 2025)
- `secId` (optional): The SEC user ID - **only required for Admin users**

## Authentication
- Requires valid authentication cookie
- **SEC users**: Automatically uses their own ID from authentication (no secId parameter needed)
- **Admin users**: Must provide secId parameter to view any SEC's incentives

## Incentive Calculation Rules

### Store-Level Calculation
**IMPORTANT**: Incentives ar`e calculated at the **store level** (all SECs combined), then divided equally among all SECs at that store.

### Price Incentive Slabs
Each device sale is mapped to a price slab based on the `SamsungSKU.ModelPrice`:
- `minPrice` to `maxPrice` range determines which slab applies
- Each slab has:
  - `incentiveAmount`: Base incentive per unit
  - `gate`: Threshold units per SEC before incentives apply
  - `volumeKicker`: Units per SEC after which 120% incentive applies

### Gate Expansion
Thresholds are multiplied by the number of ASA Canvassers at the store:
- `finalGate = gate * store.numberOfAsaCanvasser`
- `finalVolumeKicker = volumeKicker * store.numberOfAsaCanvasser`

### Incentive Tiers
For the entire store (all SECs' sales combined):

1. **Units < finalGate** → 0% incentive
   - No incentive earned

2. **Units >= finalGate AND < finalVolumeKicker** → 100% incentive on ALL units
   - Store Incentive = units × incentiveAmount × 100%
   - Applies when units reach exactly the gate threshold

3. **Units >= finalVolumeKicker** → 120% incentive on ALL units
   - Store Incentive = units × incentiveAmount × 120%
   - Applies when units reach exactly the volume kicker threshold

### Equal Distribution
After calculating the total store incentive:
- **Each ASA Canvasser's Share = Total Store Incentive ÷ numberOfAsaCanvasser**
- All ASA Canvassers at the same store receive equal shares regardless of individual performance

## Response Format

```json
{
  "success": true,
  "data": {
    "secId": "507f1f77bcf86cd799439011",
    "month": 12,
    "year": 2025,
    "totalIncentive": 15000,
    "breakdownByStore": [
      {
        "storeId": "store_00001",
        "storeName": "Croma - Mumbai Oberoi Mall",
        "totalIncentive": 15000,
        "breakdownBySlab": [
          {
            "slabId": "507f1f77bcf86cd799439012",
            "minPrice": 10000,
            "maxPrice": 20000,
            "units": 25,
            "incentiveAmount": 500,
            "appliedRate": 1.2,
            "totalIncentive": 15000
          }
        ]
      }
    ],
    "unitsSummary": {
      "totalUnits": 25,
      "unitsAboveGate": 20,
      "unitsAboveVolumeKicker": 10
    }
  }
}
```

## Data Persistence
The calculated incentive is automatically saved to the `SalesSummary` table:
- Creates a new record if none exists for that SEC/month/year
- Updates existing record if one already exists
- Stores in `totalSpotIncentiveEarned` field

## Example Usage

### Calculate December 2025 incentive (SEC user)
```bash
curl -X GET "http://localhost:3000/api/sec/incentive/calculate?month=12&year=2025" \
  -H "Cookie: auth-token=your-sec-token-here"
```

### Calculate December 2025 incentive for a specific SEC (Admin user)
```bash
curl -X GET "http://localhost:3000/api/sec/incentive/calculate?secId=507f1f77bcf86cd799439011&month=12&year=2025" \
  -H "Cookie: auth-token=your-admin-token-here"
```

### Response
```json
{
  "success": true,
  "data": {
    "secId": "507f1f77bcf86cd799439011",
    "month": 12,
    "year": 2025,
    "totalIncentive": 15000,
    "breakdownByStore": [...],
    "unitsSummary": {...}
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid month. Must be between 1 and 12"
}
```

```json
{
  "error": "secId is required for admin users"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "SEC user not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to calculate incentive",
  "details": "Error message here"
}
```

## Implementation Details

### Service Layer
`IncentiveService` (`src/lib/services/IncentiveService.ts`):
- `getSlabForPrice(price)`: Finds the appropriate slab for a device price
- `calculateGroupIncentive(units, incentiveAmount, finalGate, finalVolumeKicker)`: Applies incentive rules
- `calculateMonthlyIncentive(secId, month, year)`: Main calculation logic

### Controller
`/api/sec/incentive/calculate/route.ts`:
- Handles authentication and authorization
- Validates query parameters
- Calls IncentiveService
- Returns formatted response

## Database Schema Requirements

### Required Models
- `SalesReport`: Sales data with Date_of_sale, asaCanvasserId, storeId, samsungSKUId
- `SamsungSKU`: Device info with ModelPrice
- `Store`: Store info with numberOfAsaCanvasser
- `PriceIncentiveSlab`: Incentive rules with minPrice, maxPrice, incentiveAmount, gate, volumeKicker
- `SalesSummary`: Summary storage with unique constraint on (asaCanvasserId, month, year)

### Unique Constraint
```prisma
model SalesSummary {
  // ... fields ...
  @@unique([secId, month, year], name: "secId_month_year")
}
```
