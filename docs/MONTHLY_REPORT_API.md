# Monthly Report API Documentation

## Overview

The Monthly Report APIs provide access to data from the `DailyIncentiveReport` schema, separate from the existing spot incentive reports. These APIs are designed to fetch monthly incentive data for different user roles.

## Available Endpoints

### 1. SEC Monthly Report
- **Endpoint**: `GET /api/sec/monthly-report`
- **Access**: SEC users only
- **Data Scope**: Reports from SEC's assigned store

### 2. ABM Monthly Report  
- **Endpoint**: `GET /api/abm/monthly-report`
- **Access**: ABM users only
- **Data Scope**: Reports from all stores under ABM

### 3. ASE Monthly Report
- **Endpoint**: `GET /api/ase/monthly-report`
- **Access**: ASE users only  
- **Data Scope**: Reports from all stores under ASE

### 4. ZSM Monthly Report
- **Endpoint**: `GET /api/zsm/monthly-report`
- **Access**: ZSM users only
- **Data Scope**: All reports (region-based filtering can be added)

### 5. ZBM Monthly Report
- **Endpoint**: `GET /api/zbm/monthly-report`
- **Access**: ZBM users only
- **Data Scope**: All reports (region-based filtering can be added)

## Query Parameters

All endpoints support the following optional query parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `planType` | string | Filter by plan type | `ADLD_1_YR`, `COMBO_2_YRS` |
| `store` | string | Filter by specific store ID | `store123` |
| `device` | string | Filter by device name (partial match) | `Galaxy` |
| `startDate` | string | Start date filter (ISO format) | `2024-01-01` |
| `endDate` | string | End date filter (ISO format) | `2024-12-31` |

## Response Structure

```json
{
  "success": true,
  "data": {
    "sec/abm/ase/zsm/zbm": {
      "id": "user_id",
      "fullName": "User Name",
      "phone": "1234567890"
    },
    "store": {
      "id": "store_id",
      "name": "Store Name", 
      "city": "City Name"
    },
    "reports": [
      {
        "id": "report_id",
        "dateOfSale": "16/12/2024",
        "secName": "SEC Name",
        "secPhone": "SEC Phone",
        "secId": "SEC ID",
        "storeName": "Store Name",
        "storeCity": "City",
        "deviceName": "Samsung Galaxy S24",
        "deviceCategory": "Smartphone",
        "devicePrice": 75000,
        "planType": "ADLD_1_YR",
        "planPrice": 2999,
        "imei": "123456789012345",
        "status": "Submitted",
        "metadata": {},
        "createdAt": "16/12/2024"
      }
    ],
    "summary": {
      "totalReports": 150,
      "uniqueStores": 5,
      "uniqueDevices": 12,
      "uniquePlans": 3,
      "totalPlanValue": 449850,
      "averagePlanValue": 2999
    },
    "breakdowns": {
      "byStore": {
        "Store A": {
          "count": 50,
          "totalValue": 149950,
          "city": "Mumbai"
        }
      },
      "byPlan": {
        "ADLD_1_YR": 100,
        "COMBO_2_YRS": 50
      },
      "byDevice": {
        "Galaxy S24": 75,
        "Galaxy A54": 75
      },
      "byMonth": [
        {
          "month": "2024-12",
          "count": 25,
          "totalValue": 74975,
          "stores": {
            "Store A": 15,
            "Store B": 10
          }
        }
      ]
    },
    "filters": {
      "availablePlans": ["ADLD_1_YR", "COMBO_2_YRS"],
      "availableDevices": ["Galaxy S24", "Galaxy A54"],
      "availableStores": ["Store A", "Store B"]
    },
    "appliedFilters": {
      "planType": "all",
      "store": "all", 
      "device": "all",
      "startDate": null,
      "endDate": null
    }
  }
}
```

## Key Features

### 1. **Separate from Spot Reports**
- Uses `DailyIncentiveReport` schema exclusively
- Does not interfere with existing spot incentive functionality
- Provides monthly/daily incentive data view

### 2. **Role-Based Access Control**
- Each endpoint validates user role and permissions
- Data filtering based on user's assigned stores/region
- Secure authentication required

### 3. **Comprehensive Filtering**
- Filter by plan type, store, device, date range
- Dynamic filter options based on available data
- Maintains filter state for frontend

### 4. **Rich Analytics**
- Summary statistics (totals, averages, counts)
- Breakdowns by store, plan, device, month
- Monthly aggregation with store-level details

### 5. **Consistent Data Format**
- Standardized date formatting (DD/MM/YYYY)
- Consistent field naming across all endpoints
- Structured response format for easy frontend integration

## Usage Examples

### Basic Request
```bash
GET /api/sec/monthly-report
```

### Filtered Request
```bash
GET /api/abm/monthly-report?planType=ADLD_1_YR&startDate=2024-01-01&endDate=2024-03-31
```

### Store-Specific Request
```bash
GET /api/ase/monthly-report?store=store123&device=Galaxy
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "User profile not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Integration Notes

1. **Frontend Integration**: Use the `filters.available*` arrays to populate dropdown options
2. **Pagination**: Consider adding pagination for large datasets
3. **Caching**: Implement caching for frequently accessed data
4. **Real-time Updates**: Consider WebSocket integration for live updates
5. **Export Features**: Add CSV/Excel export functionality using the structured data

## Testing

Use the provided test script to verify API functionality:

```bash
npx ts-node scripts/test-monthly-report-api.ts
```

This will test all endpoints and verify the response structure.