# Monthly Report Frontend Integration

## Overview

The monthly report functionality has been successfully integrated into the frontend for all role-based report pages. The integration allows users to switch between "Monthly Report" and "Spot Report" tabs, with each tab fetching data from different API endpoints and data sources.

## Updated Pages

### 1. ABM Report Page (`/ABM/report`)
- **File**: `src/app/ABM/report/page.tsx`
- **Monthly API**: `/api/abm/monthly-report`
- **Spot API**: `/api/abm/report` (existing)
- **Data Source**: Monthly tab uses `DailyIncentiveReport`, Spot tab uses `SpotIncentiveReport`

### 2. ASE Report Page (`/ASE/report`)
- **File**: `src/app/ASE/report/page.tsx`
- **Monthly API**: `/api/ase/monthly-report`
- **Spot API**: `/api/ase/report` (existing)
- **Data Source**: Monthly tab uses `DailyIncentiveReport`, Spot tab uses `SpotIncentiveReport`

### 3. ZSM Report Page (`/ZSM/report`)
- **File**: `src/app/ZSM/report/page.tsx`
- **Monthly API**: `/api/zsm/monthly-report`
- **Spot API**: `/api/zsm/report` (existing)
- **Data Source**: Monthly tab uses `DailyIncentiveReport`, Spot tab uses `SpotIncentiveReport`

### 4. ZBM Report Page (`/ZBM/report`)
- **File**: `src/app/ZBM/report/page.tsx`
- **Monthly API**: `/api/zbm/monthly-report`
- **Spot API**: `/api/zbm/report` (existing)
- **Data Source**: Monthly tab uses `DailyIncentiveReport`, Spot tab uses `SpotIncentiveReport`

### 5. SEC Passbook Page (`/SEC/passbook`)
- **File**: `src/app/SEC/passbook/page.tsx`
- **API**: `/api/sec/passbook` (existing - already uses `DailyIncentiveReport`)
- **Note**: SEC users don't have a separate report page; they use the passbook which already shows both monthly and spot data correctly

## Key Features Implemented

### 1. **Tab-Based Navigation**
- Users can switch between "Monthly Report" and "Spot Report" tabs
- Each tab fetches data from different APIs
- Tab state is maintained during filtering operations

### 2. **Dynamic API Switching**
```typescript
// Example from ABM report page
const endpoint = activeTab === 'monthly' ? '/api/abm/monthly-report' : '/api/abm/report';
const response = await fetch(`${endpoint}?${params.toString()}`);
```

### 3. **Parameter Mapping**
Different APIs use different parameter names:

**Monthly Report API Parameters:**
- `planType` - Plan type filter (e.g., "ADLD_1_YR")
- `store` - Store filter
- `device` - Device filter
- `startDate` - Start date filter
- `endDate` - End date filter

**Spot Report API Parameters:**
- `planFilter` - Plan filter
- `storeFilter` - Store filter  
- `deviceFilter` - Device filter

### 4. **Data Structure Mapping**
The frontend maps different API response structures to a common interface:

```typescript
// Monthly Report Response Mapping
const monthlyReports = result.data.reports.map((r: any) => ({
  id: r.id,
  dateOfSale: r.dateOfSale,
  secId: r.secId || 'N/A',
  secName: r.secName,
  secPhone: r.secPhone,
  storeName: r.storeName,
  storeCity: r.storeCity,
  deviceName: r.deviceName,
  deviceCategory: r.deviceCategory,
  planType: r.planType,
  imei: r.imei,
  incentive: 0, // Monthly reports don't have incentive amounts
  isPaid: false
}));
```

### 5. **Filter Options**
- Monthly API provides filter options via `result.data.filters`
- Spot API derives filter options from the returned data
- Dropdown options are populated dynamically based on available data

### 6. **Summary Statistics**
Different summary statistics are shown based on the active tab:

**Monthly Tab:**
- Active Stores (from `uniqueStores`)
- Total Reports (from `totalReports`)
- SECs Active (set to 0 as monthly API doesn't track this)

**Spot Tab:**
- Active Stores
- SECs Active  
- Total Reports
- Paid/Unpaid counts

## Technical Implementation Details

### 1. **useEffect Dependencies**
```typescript
useEffect(() => {
  fetchReports();
}, [activeTab, planSearch, storeSearch, deviceSearch]);
```
Added `activeTab` to dependencies to refetch data when switching tabs.

### 2. **Conditional Parameter Building**
```typescript
if (activeTab === 'monthly') {
  if (planSearch && planTypes.includes(planSearch)) {
    params.append('planType', planSearch + '_1_YR');
  }
  // ... other monthly parameters
} else {
  if (planSearch && planTypes.includes(planSearch)) {
    params.append('planFilter', planSearch);
  }
  // ... other spot parameters
}
```

### 3. **Error Handling**
- Maintains existing error handling for both APIs
- Shows appropriate loading states
- Graceful fallbacks for missing data

### 4. **TypeScript Safety**
- Proper type casting for filter arrays
- Interface mapping for different API responses
- Type-safe parameter handling

## User Experience

### 1. **Seamless Tab Switching**
- Instant switching between Monthly and Spot reports
- Filters are maintained when switching tabs
- Loading states during data fetching

### 2. **Consistent UI**
- Same table structure for both tabs
- Consistent filtering interface
- Same styling and layout

### 3. **Data Clarity**
- Monthly reports show data from `DailyIncentiveReport` (all daily sales)
- Spot reports show data from `SpotIncentiveReport` (only sales with active campaigns)
- Clear distinction between the two data sources

## Testing

### 1. **Manual Testing Steps**
1. Navigate to any role's report page (ABM/ASE/ZSM/ZBM)
2. Verify "Monthly Report" tab loads data from monthly API
3. Switch to "Spot Report" tab and verify it loads spot data
4. Test filtering on both tabs
5. Verify data structure and display

### 2. **API Testing**
Use the provided test script:
```bash
npx ts-node scripts/test-monthly-report-api.ts
```

### 3. **Browser Testing**
- Test in different browsers
- Verify responsive design
- Check console for any errors

## Future Enhancements

### 1. **Date Range Filtering**
- Add date picker components
- Implement date range filtering for monthly reports
- Show date range in UI

### 2. **Export Functionality**
- Add CSV/Excel export for monthly reports
- Include summary statistics in exports
- Batch export options

### 3. **Real-time Updates**
- WebSocket integration for live data updates
- Auto-refresh functionality
- Push notifications for new data

### 4. **Advanced Analytics**
- Charts and graphs for monthly trends
- Comparison views between months
- Performance metrics and KPIs

## Troubleshooting

### 1. **Common Issues**
- **Empty data**: Check if `DailyIncentiveReport` has data for the user's stores
- **Filter not working**: Verify parameter mapping between frontend and API
- **TypeScript errors**: Ensure proper type casting for API responses

### 2. **Debug Steps**
1. Check browser console for API errors
2. Verify API endpoints are accessible
3. Check user authentication and permissions
4. Validate data exists in database

### 3. **API Response Validation**
```javascript
// Check API response structure
console.log('Monthly API Response:', result.data);
console.log('Available filters:', result.data.filters);
console.log('Reports count:', result.data.reports.length);
```

## Conclusion

The monthly report frontend integration is now complete and provides users with access to both monthly (daily incentive) and spot incentive data through a unified interface. The implementation maintains backward compatibility with existing spot report functionality while adding the new monthly report capabilities.

All role-based pages (ABM, ASE, ZSM, ZBM) now have access to monthly reports from the `DailyIncentiveReport` schema, while SEC users continue to use their existing passbook which already provides the correct data from both sources.