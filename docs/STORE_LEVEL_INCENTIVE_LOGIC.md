# Store-Level Incentive Calculation Logic

## Overview
The incentive calculation system has been updated to calculate incentives at the **store level** rather than individual SEC level. This ensures fair distribution of incentives among all SECs working at the same store.

Additionally, **device-specific bonuses** have been added based on the store's attach rate for premium devices (Fold and S25 series).

## Key Changes

### Old Logic (Individual SEC Calculation)
1. Fetch sales reports for a specific SEC
2. Calculate incentive based on that SEC's sales only
3. Each SEC gets incentive based on their individual performance

**Problem**: SECs at the same store could have vastly different incentives based on individual sales, even though they work as a team.

### New Logic (Store-Level Calculation)
1. Fetch **ALL sales reports** for the entire store (all SECs combined)
2. Calculate total incentive based on **store-level sales**
3. **Divide the total incentive equally** among all SECs at that store
4. Each SEC receives an equal share regardless of individual performance

**Benefit**: Promotes teamwork and ensures fair distribution among all SECs at a store.

## Example Calculation

### Scenario
- **Store**: Store001
- **Number of SECs**: 2 (SEC-A and SEC-B)
- **Price Slab**: 30k-40k (₹250 per unit, gate=3, volumeKicker=8)
- **Sales**: SEC-A sold 3 units, SEC-B sold 5 units
- **Total Store Sales**: 8 units

### Calculation Steps

1. **Calculate Thresholds**:
   - finalGate = 3 × 2 = 6 units
   - finalVolumeKicker = 8 × 2 = 16 units

2. **Apply Incentive Rules**:
   - Total units (8) >= finalGate (6) AND < finalVolumeKicker (16)
   - Apply 100% incentive on ALL 8 units
   - **Total Store Incentive** = 8 × ₹250 = ₹2,000

3. **Divide Among SECs**:
   - **SEC-A's Share** = ₹2,000 ÷ 2 = ₹1,000
   - **SEC-B's Share** = ₹2,000 ÷ 2 = ₹1,000

**Note**: Gate and Volume Kicker thresholds are now **inclusive** (>= comparison), meaning incentives apply when units reach exactly the threshold value.

### Comparison

| Metric | Old Logic (Individual) | New Logic (Store-Level) |
|--------|----------------------|------------------------|
| SEC-A Sales | 3 units | 3 units |
| SEC-B Sales | 5 units | 5 units |
| SEC-A Incentive | ₹0 (3 ≤ 6) | ₹1,000 |
| SEC-B Incentive | ₹0 (5 ≤ 6) | ₹1,000 |
| **Total Paid** | **₹0** | **₹2,000** |

## Implementation Details

### Code Changes
- **File**: `src/lib/services/IncentiveService.ts`
- **Method**: `calculateMonthlyIncentive()`

### Key Updates
1. First, fetch the SEC's store information
2. Query ALL sales reports for that store (not just the SEC's sales)
3. Calculate total store incentive using existing logic
4. Divide by `numberOfSec` to get each SEC's share
5. Save the SEC's share to `SalesSummary.estimatedIncenetiveEarned`

### Database Impact
- No schema changes required
- Each SEC still has their own `SalesSummary` record
- The `estimatedIncenetiveEarned` field now stores the SEC's equal share of the store's total incentive

## Benefits

1. **Fair Distribution**: All SECs at a store receive equal incentives
2. **Team Collaboration**: Encourages SECs to work together rather than compete
3. **Simplified Management**: Store managers don't need to track individual performance
4. **Consistent Earnings**: SECs have more predictable income based on store performance

## API Behavior

The API endpoint remains the same:
```
GET /api/sec/incentive/calculate?secId=<secId>&month=<month>&year=<year>
```

However, the calculation now:
1. Uses the SEC's store to fetch all store sales
2. Calculates at store level
3. Returns the SEC's equal share

## Frontend Display

The passbook will show:
- Each SEC's equal share of the store incentive
- All SECs at the same store will see the same incentive amount for a given month
- The calculation is transparent and fair

## Testing

To test the new logic:
1. Create multiple SECs at the same store
2. Add sales reports for different SECs
3. Calculate incentive for any SEC
4. Verify all SECs at that store receive equal shares

## Device-Specific Bonus Incentives

### Overview
In addition to the base incentive calculation, premium devices (Fold and S25 series) receive additional bonuses based on the store's attach rate.

### Device Type Identification
Devices are identified by concatenating `Category + ModelName` from the `SamsungSKU` model:
- **Fold Devices**: String contains "Fold" (case-insensitive)
- **S25 Devices**: String contains "S25" (case-insensitive)
- **Other Devices**: No bonus applied

### Bonus Structure

#### Fold Devices
- **Attach Rate < 25%**: ₹400 bonus per unit
- **Attach Rate ≥ 25%**: ₹600 bonus per unit

#### S25 Devices
- **Attach Rate < 15%**: ₹300 bonus per unit
- **Attach Rate ≥ 15%**: ₹500 bonus per unit

### Calculation Flow
1. Calculate base incentive (0%, 100%, or 120% based on gate/volume kicker)
2. For each sale, identify device type
3. Apply device-specific bonus based on store's attach rate
4. Sum: Total Incentive = Base Incentive + Device Bonuses
5. Divide equally among all SECs at the store

### Example with Device Bonuses

**Scenario:**
- **Store**: Store001
- **Number of SECs**: 2
- **Attach Rate**: 20%
- **Price Slab**: 30k-40k (₹250 per unit, gate=3, volumeKicker=8)
- **Sales**: 
  - 2 Fold devices (Galaxy Z Fold6)
  - 3 S25 devices (Galaxy S25 Ultra)
  - 3 Other devices
- **Total Store Sales**: 8 units

**Calculation:**
1. **Base Incentive**:
   - finalGate = 3 × 2 = 6 units
   - finalVolumeKicker = 8 × 2 = 16 units
   - 8 units >= 6 (gate) AND < 16 (volume kicker)
   - Base = 8 × ₹250 × 100% = ₹2,000

2. **Device Bonuses**:
   - Fold: 2 units × ₹400 (attach 20% < 25%) = ₹800
   - S25: 3 units × ₹500 (attach 20% ≥ 15%) = ₹1,500
   - Other: 3 units × ₹0 = ₹0
   - Total Bonuses = ₹2,300

3. **Total Store Incentive**: ₹2,000 + ₹2,300 = ₹4,300

4. **Per SEC**: ₹4,300 ÷ 2 = ₹2,150

### Store Attach Rate
The attach rate is stored in the `Store` model as `attachPercentage` (Float field). This represents the percentage of sales that include extended warranty or protection plans.

## Migration Notes

- Existing `SalesSummary` records will be recalculated on next passbook view
- No data migration required
- The system automatically uses the new logic for all calculations
- Stores without an `attachPercentage` value will default to 0% for bonus calculations
