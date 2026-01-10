# Monthly Incentive Calculation - Integration Complete ✅

## What Was Built

### 1. Backend API Endpoint
**File:** `src/app/api/sec/incentive/calculate/route.ts`
- Route: `GET /api/sec/incentive/calculate?secId=<id>&month=<1-12>&year=<2025>`
- Calculates monthly incentive based on price slabs and gate rules
- Returns detailed breakdown by store and price slab
- Saves result to `SalesSummary.estimatedIncenetiveEarned`

### 2. Service Layer
**File:** `src/lib/services/IncentiveService.ts`
- `getSlabForPrice()` - Finds appropriate price slab for device price
- `calculateGroupIncentive()` - Applies 0%, 100%, or 120% incentive rules
- `calculateMonthlyIncentive()` - Main calculation logic with grouping by store + slab

### 3. Price Incentive Slabs
**File:** `scripts/seed-price-incentive-slabs.ts`
- Updated with correct values from official image:
  - Below 10k: ₹63
  - 10k-20k: ₹125
  - 20k-30k: ₹150
  - 30k-40k: ₹250
  - 40k-70k: ₹375
  - 70k-1 Lac: ₹438
  - Above 1 Lac: ₹500

### 4. Automatic Calculation Integration
**File:** `src/app/api/sec/passbook/route.ts`
- When SEC users view their passbook, the API automatically:
  - Checks which months don't have calculated incentives
  - Triggers incentive calculation for those months
  - Updates `estimatedIncenetiveEarned` in database
  - Displays calculated values in the passbook

### 5. Schema Updates
**File:** `prisma/schema.prisma`
- Added unique constraint: `@@unique([secId, month, year], name: "secId_month_year")`
- Enables upsert operations for SalesSummary

## How It Works

### Incentive Calculation Rules

1. **Price Slab Matching**
   - Each sale is matched to a price slab based on `SamsungSKU.ModelPrice`
   - Different price ranges have different incentive amounts

2. **Gate Expansion**
   - `finalGate = gate × store.numberOfAsaCanvasser`
   - `finalVolumeKicker = volumeKicker × store.numberOfAsaCanvasser`
   - Example: Store with 2 ASA Canvassers → finalGate = 3 × 2 = 6 units

3. **Incentive Tiers** (per store + slab group)
   - **Units ≤ finalGate**: 0% incentive
   - **Units > finalGate AND ≤ finalVolumeKicker**: 100% incentive
   - **Units > finalVolumeKicker**: 120% incentive

4. **Grouping**
   - Sales are grouped by (storeId + slabId)
   - Each group's incentive is calculated separately
   - All groups are summed for total monthly incentive

### User Flow

1. SEC user logs in and navigates to Passbook
2. Passbook API fetches sales summaries
3. For any month without `estimatedIncenetiveEarned`:
   - API triggers `IncentiveService.calculateMonthlyIncentive()`
   - Calculation runs asynchronously
   - Result is saved to database
4. Passbook displays:
   - `totalSamsungIncentiveEarned` (if paid by Samsung)
   - OR `estimatedIncenetiveEarned` (calculated estimate)
   - OR "Not calculated" (if calculation pending)

## API Response Example

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
        "storeName": "Croma - Mumbai",
        "totalIncentive": 15000,
        "breakdownBySlab": [
          {
            "slabId": "...",
            "minPrice": 10000,
            "maxPrice": 20000,
            "units": 25,
            "incentiveAmount": 125,
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

## Files Modified

1. ✅ `src/lib/services/IncentiveService.ts` - Created
2. ✅ `src/app/api/sec/incentive/calculate/route.ts` - Created
3. ✅ `src/app/api/sec/passbook/route.ts` - Updated (added auto-calculation)
4. ✅ `scripts/seed-price-incentive-slabs.ts` - Updated (correct values)
5. ✅ `prisma/schema.prisma` - Updated (unique constraint)
6. ✅ `docs/INCENTIVE_CALCULATION_API.md` - Created (documentation)

## Testing

### Run Price Slab Seed
```bash
npx tsx scripts/seed-price-incentive-slabs.ts
```

### Test API Directly
```bash
curl "http://localhost:3000/api/sec/incentive/calculate?secId=<SEC_ID>&month=12&year=2025" \
  -H "Cookie: auth-token=<TOKEN>"
```

### Test via Passbook
1. Login as SEC user
2. Navigate to Passbook page
3. View "Monthly Incentive" tab
4. Check "Previous Transactions" section
5. Incentives should show calculated values

## Next Steps (Optional)

1. **Add Manual Recalculation Button**
   - Allow admins to trigger recalculation for specific months
   
2. **Add Calculation History**
   - Track when incentives were calculated and by whom
   
3. **Add Breakdown View**
   - Show detailed breakdown by store and slab in the UI
   
4. **Add Notifications**
   - Notify SECs when their monthly incentive is calculated

## Notes

- Calculation runs asynchronously to avoid blocking the passbook API
- Failed calculations are logged but don't break the passbook display
- Once `totalSamsungIncentiveEarned` is set (paid), it takes precedence over estimates
- The typo `estimatedIncenetiveEarned` exists in the schema (should be `estimatedIncentiveEarned`)

---

**Status:** ✅ Complete and Integrated
**Date:** December 2025
