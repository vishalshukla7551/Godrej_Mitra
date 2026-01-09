# MR Incentive Integration - Implementation Guide

## ✅ Completed Tasks

### 1. Database Schema Update
- **Added new model**: `MRIncentive` to store category-based incentive data
- **Fields**:
  - `category`: Appliance category (Refrigerator, Washing Machine, etc.)
  - `priceRange`: Price range string (e.g., "5000-15000")
  - `minPrice` & `maxPrice`: For efficient querying
  - `incentive1Year`, `incentive2Year`, `incentive3Year`, `incentive4Year`: Incentive amounts for each tenure
- **Indexed**: category, minPrice, maxPrice for fast lookups

### 2. Data Seeding
- **Created script**: `scripts/seed-mr-incentives.js`
- **Reads**: MR Price List.xlsx from project root
- **Extracts**: Yellow header (newer) incentive plan data
- **Populates**: 26 incentive records across 8 categories
- **Categories covered**:
  - Refrigerator (8 price slabs)
  - Washing Machine (5 price slabs)
  - AC (3 price slabs)
  - Air Cooler (2 price slabs)
  - Dishwasher (2 price slabs)
  - Chest Freezer (2 price slabs)
  - Microwave Oven (2 price slabs)
  - Qube (2 price slabs)

### 3. API Implementation

#### A. Spot Incentive Calculation API
- **Endpoint**: `POST /api/canvasser/incentive/calculate-spot`
- **Purpose**: Calculate incentive for any category, price, and tenure
- **Request Body**:
  ```json
  {
    "category": "Refrigerator",
    "invoicePrice": 35000,
    "tenure": 3
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "incentive": 250,
    "details": {
      "category": "Refrigerator",
      "priceRange": "30001-40000",
      "tenure": "3 Years",
      "invoicePrice": 35000
    }
  }
  ```

#### B. Updated Form Submit API
- **Endpoint**: `POST /api/canvasser/incentive-form/submit`
- **Updated logic**:
  1. Extracts tenure from plan type (EXTENDED_WARRANTY_3_YR → 3)
  2. Parses invoice price from request body
  3. Queries MRIncentive table for matching category + price range
  4. Retrieves incentive amount based on tenure
  5. Also checks for active campaigns (legacy support)
  6. Uses the higher of MR incentive or campaign incentive
  7. Stores calculated incentive in SpotIncentiveReport

### 4. Example Use Case (As Per Requirements)

**User Input**:
- ✔ Appliance: Refrigerator
- ✔ Invoice Price: ₹35,000
- ✔ Plan: 3 Years Extended Warranty

**System Processing**:
1. Category: "Refrigerator"
2. Price ₹35,000 falls in range "30001-40000"
3. Tenure: 3 years
4. Database query finds matching record

**Result**:
- **Incentive**: ₹250 (from yellow plan, 3-year column)

## 🎯 Key Implementation Details

### Price Range Matching Logic
```typescript
const incentiveRecord = await prisma.mRIncentive.findFirst({
  where: {
    category: device.Category,
    minPrice: { lte: invoicePrice },
    OR: [
      { maxPrice: { gte: invoicePrice } },
      { maxPrice: null } // For "70000+" ranges
    ]
  }
});
```

### Tenure Extraction
```typescript
const planTypeStr = plan.planType.toString();
let tenure = 1;
if (planTypeStr.includes('1_YR')) tenure = 1;
else if (planTypeStr.includes('2_YR')) tenure = 2;
else if (planTypeStr.includes('3_YR')) tenure = 3;
else if (planTypeStr.includes('4_YR')) tenure = 4;
```

### Incentive Assignment
```typescript
switch (tenure) {
  case 1: spotincentiveEarned = incentiveRecord.incentive1Year; break;
  case 2: spotincentiveEarned = incentiveRecord.incentive2Year; break;
  case 3: spotincentiveEarned = incentiveRecord.incentive3Year; break;
  case 4: spotincentiveEarned = incentiveRecord.incentive4Year; break;
}
```

## ⚠️ Important Notes

1. **Only Yellow Plan Used**: The seed script extracts incentive values from columns 4, 7, 10, and 13 (the second incentive column for each tenure), which correspond to the newer/yellow incentive plan.

2. **Old Plan Ignored**: Columns 3, 6, 9, and 12 (old incentive values) are completely ignored.

3. **Campaign Compatibility**: The system still checks for active SpotIncentiveCampaign records and uses the higher of the two incentives (MR incentive vs campaign incentive). This provides backward compatibility.

4. **Data Already in DB**: All 26 incentive records are already populated in the database after running the seed script.

5. **Non-Hardcoded**: Incentive values come from the database, not hardcoded in the application.

## 📝 Files Modified/Created

### Created:
1. `scripts/seed-mr-incentives.js` - Data seeding script
2. `scripts/read-mr-incentive-data.js` - Excel reading utility
3. `src/app/api/canvasser/incentive/calculate-spot/route.ts` - Calculation API

### Modified:
1. `prisma/schema.prisma` - Added MRIncentive model
2. `src/app/api/canvasser/incentive-form/submit/route.ts` - Updated incentive calculation logic

## 🚀 Deployment Steps

1. ✅ Schema updated and pushed to database
2. ✅ Prisma Client regenerated
3. ✅ MR Incentive data seeded (26 records)
4. ❌ **TODO**: Frontend updates (if needed to display incentive preview)
5. ❌ **TODO**: Test the complete flow with real data

## 🔄 Testing the Implementation

### To reseed incentives (if needed):
```bash
node scripts/seed-mr-incentives.js
```

### To test incentive calculation:
```bash
curl -X POST http://localhost:3000/api/canvasser/incentive/calculate-spot \
  -H "Content-Type: application/json" \
  -d '{"category":"Refrigerator","invoicePrice":35000,"tenure":3}'
```

### Expected Response:
```json
{
  "success": true,
  "incentive": 250,
  "details": {
    "category": "Refrigerator",
    "priceRange": "30001-40000",
    "tenure": "3 Years",
    "invoicePrice": 35000
  }
}
```

## 📊 Incentive Data Summary

| Category | Price Slabs | Tenure Options |
|----------|-------------|----------------|
| Refrigerator | 8 | 1Y, 2Y, 3Y, 4Y |
| Washing Machine | 5 | 1Y, 2Y, 3Y, 4Y |
| AC | 3 | 1Y, 2Y, 3Y, 4Y |
| Air Cooler | 2 | 1Y, 2Y, 3Y, 4Y |
| Dishwasher | 2 | 1Y, 2Y, 3Y, 4Y |
| Chest Freezer | 2 | 1Y, 2Y, 3Y, 4Y |
| Microwave Oven | 2 | 1Y, 2Y, 3Y, 4Y |
| Qube | 2 | 1Y, 2Y, 3Y, 4Y |

**Total**: 26 unique category-price-tenure combinations

---

✅ **Implementation Complete**
❗ **Ready for Testing**
