# ASE Leaderboard API Documentation

## Overview
Leaderboard API for ASE users showing top stores, devices, and plans based on sales data from their assigned stores only.

## API Endpoint

### GET /api/ase/leaderboard

**Authentication:** Required (ASE role only)

**Query Parameters:**
- `period` (optional) - Time period for leaderboard
  - `week` - Last 7 days
  - `month` - Current month (default)
  - `all` - All time
- `limit` (optional) - Number of top items to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "rank": 1,
        "storeId": "store_001",
        "storeName": "Croma - Noida Mall",
        "city": "Noida",
        "state": "UP",
        "totalSales": 27,
        "totalIncentive": "₹8,500"
      }
    ],
    "devices": [
      {
        "rank": 1,
        "deviceId": "device_001",
        "deviceName": "Samsung Galaxy S24",
        "category": "Premium",
        "totalSales": 45,
        "totalIncentive": "₹12,000"
      }
    ],
    "plans": [
      {
        "rank": 1,
        "planId": "plan_001",
        "planType": "COMBO_2_YRS",
        "planPrice": "₹5,700",
        "totalSales": 30,
        "totalIncentive": "₹9,000"
      }
    ],
    "period": "month",
    "activeCampaignsCount": 5,
    "totalSalesReports": 150
  }
}
```

## Security
- Only authenticated ASE users can access
- ASE users only see leaderboard data from their assigned stores
- Filters by `storeIds` array from ASE profile
- Returns 401 if not authenticated or not ASE role

## Frontend Integration

The ASE leaderboard page (`/ASE/leaderboard`) features:
1. Period filter buttons (Week/Month/All Time)
2. Three separate leaderboard tables:
   - Top Stores (by total sales)
   - Top Devices (by total sales)
   - Top Plans (by total sales)
3. Real-time data updates when period changes
4. Loading and error states
5. Rank indicators with emojis for top 3

## Key Differences from Zopper Admin Leaderboard
- **Filtered by ASE stores:** Only shows data from stores assigned to the logged-in ASE
- **Same aggregation logic:** Uses identical calculation methods for consistency
- **Same response format:** Compatible with existing leaderboard UI patterns

## Example Usage

```bash
# Get current month leaderboard
curl -X GET "http://localhost:3000/api/ase/leaderboard?period=month&limit=10" \
  -H "Cookie: auth-token=..."

# Get weekly leaderboard
curl -X GET "http://localhost:3000/api/ase/leaderboard?period=week&limit=5" \
  -H "Cookie: auth-token=..."

# Get all-time leaderboard
curl -X GET "http://localhost:3000/api/ase/leaderboard?period=all&limit=20" \
  -H "Cookie: auth-token=..."
```

## Files
- **API Route:** `src/app/api/ase/leaderboard/route.ts`
- **Frontend Page:** `src/app/ASE/leaderboard/page.tsx`
- **Based on:** `src/app/api/zopper-administrator/leaderboard/route.ts`
