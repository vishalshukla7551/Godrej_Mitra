# Leaderboard API - Implementation Guide

## Overview

The leaderboard APIs aggregate sales data and display rankings for both **stores** and **canvassers** based on total incentive earned. The data is calculated from the `SpotIncentiveReport` table which contains incentive amounts from:
- **MR Price List** (newer/yellow incentive plan)
- **Active campaign bonuses** (if applicable)

## API Endpoints

### 1. Canvasser Leaderboard API
**Endpoint**: `GET /api/canvasser/leaderboard`

**Query Parameters**:
- `period`: `'week'` | `'month'` | `'all'` (default: `'month'`)
- `limit`: number (default: 10)

**Example Request**:
```bash
GET /api/canvasser/leaderboard?period=month&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "rank": 1,
        "storeId": "1107",
        "storeName": "ADAYAR - (1107) - ADAYAR",
        "city": "Chennai",
        "totalSales": 15,
        "totalIncentive": "₹3,750",
        "ew1": 5,
        "ew2": 3,
        "ew3": 4,
        "ew4": 3
      }
    ],
    "canvassers": [
      {
        "rank": 1,
        "secId": "abc123",
        "canvasserName": "John Doe",
        "identifier": "EMP001",
        "totalSales": 12,
        "totalIncentive": "₹2,500",
        "ew1": 4,
        "ew2": 3,
        "ew3": 3,
        "ew4": 2
      }
    ],
    "devices": [...],
    "plans": [...],
    "period": "month",
    "activeCampaignsCount": 5,
    "totalSalesReports": 150
  }
}
```

### 2. Zopper Administrator Leaderboard API
**Endpoint**: `GET /api/zopper-administrator/leaderboard`

**Query Parameters**:
- `month`: number (1-12, optional - defaults to current month)
- `year`: number (optional - defaults to current year)
- `limit`: number (default: 10)

**Example Request**:
```bash
GET /api/zopper-administrator/leaderboard?month=1&year=2026&limit=20
```

**Response**: Same structure as canvasser API

## Data Schema

### SpotIncentiveReport Model
The leaderboard aggregates data from the `SpotIncentiveReport` table:

```prisma
model SpotIncentiveReport {
  id                      String    @id @default(auto()) @map("_id") @db.ObjectId
  secId                   String    @db.ObjectId
  secUser                 SEC       @relation(fields: [secId], references: [id])
  storeId                 String
  store                   Store     @relation(fields: [storeId], references: [id])
  godrejSKUId             String    @db.ObjectId
  godrejSKU               GodrejSKU @relation(fields: [godrejSKUId], references: [id])
  planId                  String    @db.ObjectId
  plan                    Plan      @relation(fields: [planId], references: [id])
  imei                    String
  isCompaignActive        Boolean   @default(false)
  spotincentiveEarned     Int       @default(0) // ← Contains MR incentive + campaign bonus
  Date_of_sale            DateTime
  createdAt               DateTime  @default(now())
  
  @@unique([imei])
  @@index([secId])
  @@index([storeId])
  @@index([Date_of_sale])
}
```

### MRIncentive Model (Reference)
Incentive values are calculated from this table and stored in `spotincentiveEarned`:

```prisma
model MRIncentive {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  category        String   // e.g., "Refrigerator", "Washing Machine"
  priceRange      String   // e.g., "30001-40000"
  minPrice        Int      // 30001
  maxPrice        Int?     // 40000 (null for ranges like "70000+")
  incentive1Year  Int      // Incentive for 1-year warranty
  incentive2Year  Int      // Incentive for 2-year warranty
  incentive3Year  Int      // Incentive for 3-year warranty
  incentive4Year  Int      // Incentive for 4-year warranty
  
  @@index([category, minPrice, maxPrice])
  @@map("MRIncentive")
}
```

## How It Works

### 1. Data Collection
- Fetches ALL `SpotIncentiveReport` records within the specified date range
- No filtering by `isCompaignActive` - includes both MR incentives and campaign sales
- Each report contains `spotincentiveEarned` which is the calculated incentive amount

### 2. Aggregation Logic

#### Store Aggregation
```typescript
{
  storeId: string,
  storeName: string,
  city: string | null,
  totalSales: number,       // Count of sales
  totalIncentive: number,   // Sum of spotincentiveEarned
  ew1: number,             // Count of 1-year warranty sales
  ew2: number,             // Count of 2-year warranty sales
  ew3: number,             // Count of 3-year warranty sales
  ew4: number              // Count of 4-year warranty sales
}
```

#### Canvasser Aggregation
```typescript
{
  secId: string,
  canvasserName: string,
  identifier: string,       // employeeId or phone
  totalSales: number,
  totalIncentive: number,
  ew1: number,
  ew2: number,
  ew3: number,
  ew4: number
}
```

### 3. Ranking
- **Primary sort**: By `totalIncentive` (descending)
- **Rank assignment**: Sequential numbers (1, 2, 3, ...)
- **Limit**: Configurable via query parameter

### 4. EW (Extended Warranty) Categorization
Plans are categorized by tenure:

| Plan Type | EW Category |
|-----------|-------------|
| EXTENDED_WARRANTY_1_YR | ew1 |
| EXTENDED_WARRANTY_2_YR | ew2 |
| EXTENDED_WARRANTY_3_YR | ew3 |
| EXTENDED_WARRANTY_4_YR | ew4 |

## Implementation Details

### Date Range Calculation

**Canvasser API** (period-based):
```typescript
switch (period) {
  case 'week':
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    break;
  case 'month':
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    break;
  case 'all':
    startDate = new Date(0); // Beginning of time
    break;
}
```

**Admin API** (month/year-based):
```typescript
const month = monthParam ? parseInt(monthParam) - 1 : now.getMonth();
const year = yearParam ? parseInt(yearParam) : now.getFullYear();
const startDate = new Date(year, month, 1);
const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
```

### Currency Formatting
All incentive amounts are formatted with Indian locale:
```typescript
store.totalIncentive > 0 
  ? `₹${store.totalIncentive.toLocaleString('en-IN')}` 
  : '-'
```

## Frontend Integration

### Toggle Between Store/Canvasser View
The frontend (`/app/canvasser/leaderboard/page.tsx`) has a toggle:

```tsx
const [leaderboardType, setLeaderboardType] = useState<'store' | 'canvasser'>('store');

// Toggle buttons
<button onClick={() => setLeaderboardType('store')}>Store Wise</button>
<button onClick={() => setLeaderboardType('canvasser')}>Canvasser Wise</button>

// Display logic
const tableData = leaderboardType === 'store' 
  ? leaderboardData.stores 
  : leaderboardData.canvassers;
```

### Podium Display (Top 3)
```tsx
const podiumData = leaderboardType === 'store'
  ? leaderboardData.stores.slice(0, 3)
  : leaderboardData.canvassers.slice(0, 3);

// Reorder to show 2nd, 1st, 3rd
const reorderedPodium = [podiumData[1], podiumData[0], podiumData[2]];
```

## Testing

### Test Canvasser Leaderboard
```bash
# Current month, top 10
curl "http://localhost:3000/api/canvasser/leaderboard?period=month&limit=10"

# All time, top 20
curl "http://localhost:3000/api/canvasser/leaderboard?period=all&limit=20"

# Current week
curl "http://localhost:3000/api/canvasser/leaderboard?period=week&limit=5"
```

### Test Admin Leaderboard
```bash
# Current month
curl "http://localhost:3000/api/zopper-administrator/leaderboard?limit=10"

# January 2026
curl "http://localhost:3000/api/zopper-administrator/leaderboard?month=1&year=2026&limit=20"

# December 2025
curl "http://localhost:3000/api/zopper-administrator/leaderboard?month=12&year=2025&limit=10"
```

## Key Differences from Old Implementation

### ✅ **BEFORE** (Campaign-only)
- Only showed sales with `isCompaignActive: true`
- Missing most sales with MR incentives
- Incomplete leaderboard data

### ✅ **AFTER** (All Sales)
- Shows ALL sales from `SpotIncentiveReport`
- Includes both MR incentive sales AND campaign sales
- Complete and accurate leaderboard rankings

## Performance Considerations

### Indexes Used
- `@@index([secId])` - Fast canvasser aggregation
- `@@index([storeId])` - Fast store aggregation
- `@@index([Date_of_sale])` - Efficient date range filtering

### Optimization Tips
1. **Date Range**: Narrow date ranges perform better
2. **Limit**: Use reasonable limits (10-20 for UI display)
3. **Caching**: Consider caching results for frequently accessed periods

## Common Use Cases

### 1. Monthly Performance Review
```typescript
// Admin reviews January 2026 performance
GET /api/zopper-administrator/leaderboard?month=1&year=2026&limit=50
```

### 2. Real-time Rankings
```typescript
// Canvasser checks current month rankings
GET /api/canvasser/leaderboard?period=month&limit=10
```

### 3. Weekly Contests
```typescript
// Display weekly top performers
GET /api/canvasser/leaderboard?period=week&limit=5
```

### 4. All-time Champions
```typescript
// Show all-time top performers
GET /api/canvasser/leaderboard?period=all&limit=100
```

---

**✅ Implementation Complete**  
**✅ Both APIs Updated**  
**✅ Ready for Production**
