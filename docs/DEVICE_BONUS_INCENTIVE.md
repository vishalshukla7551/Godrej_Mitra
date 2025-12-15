# Device-Specific Bonus Incentive System

## Overview

The incentive calculation system now includes **device-specific bonuses** for premium Samsung devices (Fold and S25 series) based on the store's attach rate.

## How It Works

### 1. Device Type Identification

Devices are automatically identified by concatenating the `Category` and `ModelName` fields from the `SamsungSKU` model:

```typescript
const deviceIdentifier = `${Category}${ModelName}`.toUpperCase();
```

**Device Types:**
- **FOLD**: Contains "FOLD" in the identifier (e.g., "Galaxy Z Fold6", "Foldable Fold5")
- **S25**: Contains "S25" in the identifier (e.g., "Galaxy S25 Ultra", "S25 Plus")
- **OTHER**: All other devices (no bonus)

### 2. Bonus Structure

#### Fold Devices
| Store Attach Rate | Bonus per Unit |
|-------------------|----------------|
| < 25%             | ₹400           |
| ≥ 25%             | ₹600           |

#### S25 Devices
| Store Attach Rate | Bonus per Unit |
|-------------------|----------------|
| < 15%             | ₹300           |
| ≥ 15%             | ₹500           |

### 3. Store Attach Rate

The attach rate is stored in the `Store` model as `attachPercentage` (Float field). This represents the percentage of sales that include extended warranty or protection plans.

**Default Behavior:**
- If `attachPercentage` is `null`, it defaults to `0%` for bonus calculations
- Fold devices with 0% attach rate get ₹400 bonus
- S25 devices with 0% attach rate get ₹300 bonus

## Calculation Flow

```
1. Calculate Base Incentive
   ├─ Units < finalGate → 0% incentive
   ├─ Units ≥ finalGate AND < finalVolumeKicker → 100% incentive
   └─ Units ≥ finalVolumeKicker → 120% incentive

2. Calculate Device Bonuses
   ├─ For each Fold device → Add ₹400 or ₹600 based on attach rate
   ├─ For each S25 device → Add ₹300 or ₹500 based on attach rate
   └─ For other devices → No bonus

3. Total Store Incentive = Base Incentive + Device Bonuses

4. Per SEC Share = Total Store Incentive ÷ numberOfSec
```

## Example Calculation

### Scenario
- **Store**: Premium Electronics
- **Number of SECs**: 2
- **Attach Rate**: 28%
- **Price Slab**: 30k-40k (₹250 per unit, gate=3, volumeKicker=8)
- **Sales**:
  - 2 × Galaxy Z Fold6 (Fold devices)
  - 3 × Galaxy S25 Ultra (S25 devices)
  - 6 × Galaxy A54 (Other devices)
- **Total**: 11 units

### Step-by-Step Calculation

**1. Base Incentive:**
```
finalGate = 3 × 2 = 6 units
finalVolumeKicker = 8 × 2 = 16 units

11 units ≥ 6 (gate) AND < 16 (volume kicker)
→ Apply 100% incentive on ALL 11 units

Base Incentive = 11 × ₹250 × 100% = ₹2,750
```

**2. Device Bonuses:**
```
Fold Devices:
  - 2 units × ₹600 (attach 28% ≥ 25%) = ₹1,200

S25 Devices:
  - 3 units × ₹500 (attach 28% ≥ 15%) = ₹1,500

Other Devices:
  - 6 units × ₹0 = ₹0

Total Device Bonuses = ₹2,700
```

**3. Total Store Incentive:**
```
Total = ₹2,750 (base) + ₹2,700 (bonuses) = ₹5,450
```

**4. Per SEC Share:**
```
Each SEC = ₹5,450 ÷ 2 = ₹2,725
```

## Setting Up Attach Rates

### Check Current Attach Rates
```bash
npm run check-attach-rates
```

This will show:
- All stores and their current attach rates
- Which stores have attach rates set
- Which stores need attach rates configured

### Set Attach Rates
```bash
npm run set-attach-rates
```

This script will:
- Set a default attach rate (20%) for all stores without one
- Allow you to configure specific stores with custom rates

### Manual Update via Prisma
```typescript
await prisma.store.update({
  where: { id: 'STORE_ID' },
  data: { attachPercentage: 25.5 }
});
```

## Testing

### Test Device Type Identification
```bash
npm run test-device-bonus
```

This will verify:
- Device type identification logic
- Bonus calculation for different attach rates
- Edge cases (null attach rates, boundary conditions)

### Test Full Calculation
Use the existing incentive calculation API:
```
GET /api/sec/incentive/calculate?secId=<secId>&month=<month>&year=<year>
```

The response will include:
- Base incentive breakdown
- Device-specific bonuses (Fold and S25)
- Total incentive per SEC

## API Response Structure

```typescript
{
  totalIncentive: 2725,  // SEC's share
  breakdownByStore: [
    {
      storeId: "STORE_ID",
      storeName: "Premium Electronics",
      attachPercentage: 28,
      totalIncentive: 5450,  // Total store incentive
      breakdownBySlab: [
        {
          slabId: "SLAB_ID",
          minPrice: 30000,
          maxPrice: 40000,
          units: 11,
          incentiveAmount: 250,
          appliedRate: 1.0,  // 100%
          baseIncentive: 2750,
          deviceBonuses: {
            foldBonus: 1200,
            s25Bonus: 1500
          },
          totalIncentive: 5450
        }
      ]
    }
  ],
  unitsSummary: {
    totalUnits: 11,
    unitsAboveGate: 5,
    unitsAboveVolumeKicker: 0
  }
}
```

## Console Logging

The calculation includes detailed console logs:

```
[calculateGroupIncentive] ========== CALCULATION START ==========
[calculateGroupIncentive] Input Parameters:
  - Units sold: 11
  - Incentive per unit: ₹250
  - Final Gate (threshold): 6 units
  - Final Volume Kicker: 16 units
  - Store Attach Rate: 28%

[calculateGroupIncentive] ✓ Rule 2 Applied: Units (11) >= Final Gate (6) AND < Volume Kicker (16)
[calculateGroupIncentive] Result: 100% INCENTIVE ON ALL UNITS
[calculateGroupIncentive] Base Calculation: 11 units × ₹250 × 100% = ₹2,750

[calculateGroupIncentive] 📱 DEVICE-SPECIFIC BONUS CALCULATION:
  🔲 Fold Devices: 2 units × ₹600 = ₹1,200
     (Attach rate 28% >= 25%)
  📱 S25 Devices: 3 units × ₹500 = ₹1,500
     (Attach rate 28% >= 15%)

[calculateGroupIncentive] 💰 FINAL CALCULATION:
  - Base Incentive: ₹2,750
  - Device Bonuses: ₹2,700
  - TOTAL INCENTIVE: ₹5,450
[calculateGroupIncentive] ========== CALCULATION END ==========
```

## Migration & Rollout

### Phase 1: Set Default Attach Rates
1. Run `npm run check-attach-rates` to see current state
2. Run `npm run set-attach-rates` to set defaults (20%)
3. Verify all stores have attach rates configured

### Phase 2: Configure Actual Attach Rates
1. Gather actual attach rate data from each store
2. Update stores with accurate percentages
3. Monitor incentive calculations

### Phase 3: Monitor & Adjust
1. Review incentive payouts
2. Adjust attach rate thresholds if needed
3. Update bonus amounts based on business goals

## Business Rules

1. **Attach Rate Thresholds**:
   - Fold: 25% threshold encourages high attach rates
   - S25: 15% threshold is more achievable for flagship devices

2. **Bonus Amounts**:
   - Higher bonuses for Fold devices (₹400/₹600) due to premium positioning
   - Moderate bonuses for S25 devices (₹300/₹500) to drive volume

3. **Fair Distribution**:
   - All bonuses are calculated at store level
   - Divided equally among all SECs
   - Promotes teamwork and collaboration

## Troubleshooting

### Issue: Attach Rate Shows "N/A%"
**Cause**: Store's `attachPercentage` is `null`
**Solution**: Run `npm run set-attach-rates` to set default values

### Issue: No Device Bonuses Applied
**Cause**: Device type not recognized
**Solution**: 
- Check `Category` and `ModelName` in `SamsungSKU`
- Ensure they contain "Fold" or "S25" (case-insensitive)
- Run `npm run test-device-bonus` to verify

### Issue: Wrong Bonus Amount
**Cause**: Attach rate threshold confusion
**Solution**: 
- Fold: < 25% → ₹400, ≥ 25% → ₹600
- S25: < 15% → ₹300, ≥ 15% → ₹500
- Check store's actual `attachPercentage` value

## Future Enhancements

Potential improvements:
1. Dynamic bonus amounts configurable per device type
2. Time-based bonus campaigns (seasonal promotions)
3. Tiered attach rate bonuses (multiple thresholds)
4. Device-specific attach rate tracking
5. Historical bonus analytics and reporting
