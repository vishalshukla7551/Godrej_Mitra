# ASE Report API Documentation

## Overview
Simple API endpoint for ASE (Area Sales Executive) users to view sales reports from their assigned stores.

## API Endpoint

### GET /api/ase/report

**Authentication:** Required (ASE role only)

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
- Only authenticated ASE users can access this endpoint
- ASE users can only see reports from stores in their `storeIds` array
- Returns 401 Unauthorized if user is not authenticated or not ASE role

## Frontend Integration

The ASE report page (`/ASE/report`) automatically:
1. Fetches reports from `/api/ase/report` on page load
2. Applies filters when user types in filter inputs
3. Shows loading state while fetching
4. Displays error messages if fetch fails
5. Shows real-time summary metrics (stores, SECs, reports)
6. Displays payment status (Paid/Pending) for each report

## Features
- ✅ Real-time data from database
- ✅ Filter by plan type, store, and device
- ✅ Shows only assigned stores for the logged-in ASE
- ✅ Payment status tracking
- ✅ Summary metrics
- ✅ Responsive design
- ✅ Loading and error states

## Files
- **API Route:** `src/app/api/ase/report/route.ts`
- **Frontend Page:** `src/app/ASE/report/page.tsx`
- **Schema:** `prisma/schema.prisma` (ASE model with storeIds)
