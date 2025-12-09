# ABM Report API Documentation

## Overview
Simple API endpoint for ABM (Area Business Manager) users to view sales reports from their assigned stores.

## API Endpoint

### GET /api/abm/report

**Authentication:** Required (ABM role only)

**Query Parameters:**
- `planFilter` (optional) - Filter by plan type (e.g., "ADLD_1_YR", "COMBO_2_YRS")
- `storeFilter` (optional) - Filter by store name (partial match)
- `deviceFilter` (optional) - Filter by device model name (partial match)

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report_id",
        "dateOfSale": "2024-12-09T10:30:00Z",
        "secId": "sec_id",
        "secName": "John Doe",
        "secPhone": "+1234567890",
        "storeName": "Croma - Noida Mall",
        "storeCity": "Noida",
        "deviceName": "Samsung Galaxy S24",
        "deviceCategory": "Premium",
        "planType": "ADLD_1_YR",
        "imei": "358240051111110",
        "incentive": 2500,
        "isPaid": false
      }
    ],
    "summary": {
      "activeStores": 5,
      "activeSECs": 25,
      "totalReports": 150,
      "paidCount": 100,
      "unpaidCount": 50
    }
  }
}
```

## Security
- Only authenticated ABM users can access this endpoint
- ABM users can only see reports from stores in their `storeIds` array
- Returns 401 Unauthorized if user is not authenticated or not ABM role

## Frontend Integration

The ABM report page (`/ABM/report`) automatically:
1. Fetches reports from `/api/abm/report` on page load
2. Applies filters when user types in filter inputs
3. Shows loading state while fetching
4. Displays error messages if fetch fails
5. Shows real-time summary metrics (stores, SECs, reports)
6. Displays payment status (Paid/Pending) for each report

## Features
- ✅ Real-time data from database
- ✅ Filter by plan type, store, and device
- ✅ Shows only assigned stores for the logged-in ABM
- ✅ Payment status tracking
- ✅ Summary metrics
- ✅ Responsive design
- ✅ Loading and error states

## Schema Reference

### ABM Model
```prisma
model ABM {
  id       String   @id @default(auto()) @map("_id") @db.ObjectId
  userId   String   @unique @db.ObjectId
  fullName String
  phone    String
  storeIds String[] // Array of store IDs this ABM can access
  zbmId    String   @db.ObjectId
  
  user User @relation("UserABM", fields: [userId], references: [id])
}
```

## Files
- **API Route:** `src/app/api/abm/report/route.ts`
- **Frontend Page:** `src/app/ABM/report/page.tsx`
- **Schema:** `prisma/schema.prisma` (ABM model with storeIds)

## Example Usage

```bash
# Get all reports for ABM's assigned stores
curl -X GET "http://localhost:3000/api/abm/report" \
  -H "Cookie: auth-token=..."

# Filter by plan type
curl -X GET "http://localhost:3000/api/abm/report?planFilter=COMBO_2_YRS" \
  -H "Cookie: auth-token=..."

# Filter by store name
curl -X GET "http://localhost:3000/api/abm/report?storeFilter=Croma" \
  -H "Cookie: auth-token=..."

# Filter by device
curl -X GET "http://localhost:3000/api/abm/report?deviceFilter=Galaxy" \
  -H "Cookie: auth-token=..."

# Multiple filters
curl -X GET "http://localhost:3000/api/abm/report?planFilter=ADLD&storeFilter=Noida" \
  -H "Cookie: auth-token=..."
```

## Comparison with ASE Report API

Both ABM and ASE report APIs share the same structure:
- Both use `storeIds` array from their respective profiles
- Same filtering capabilities
- Same response format
- Same security model

The only difference is the role check:
- ABM API checks for `role === 'ABM'`
- ASE API checks for `role === 'ASE'`
