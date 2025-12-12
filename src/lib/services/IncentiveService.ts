import { prisma } from '@/lib/prisma';

interface IncentiveCalculationResult {
  totalIncentive: number;
  breakdownByStore: Array<{
    storeId: string;
    storeName: string;
    totalIncentive: number;
    breakdownBySlab: Array<{
      slabId: string;
      minPrice: number | null;
      maxPrice: number | null;
      units: number;
      incentiveAmount: number;
      appliedRate: number; // 0, 1.0, or 1.2
      totalIncentive: number;
    }>;
  }>;
  unitsSummary: {
    totalUnits: number;
    unitsAboveGate: number;
    unitsAboveVolumeKicker: number;
  };
}

interface GroupedSales {
  storeId: string;
  storeName: string;
  numberOfSec: number;
  slabId: string;
  slab: {
    minPrice: number | null;
    maxPrice: number | null;
    incentiveAmount: number;
    gate: number;
    volumeKicker: number;
  };
  sales: Array<{
    id: string;
    modelPrice: number;
  }>;
}

export class IncentiveService {
  /**
   * Get the appropriate price incentive slab for a given price
   */
  static async getSlabForPrice(price: number) {
    const slab = await (prisma as any).priceIncentiveSlab.findFirst({
      where: {
        OR: [
          {
            AND: [
              { minPrice: { lte: price } },
              { maxPrice: { gte: price } }
            ]
          },
          {
            AND: [
              { minPrice: { lte: price } },
              { maxPrice: null }
            ]
          },
          {
            AND: [
              { minPrice: null },
              { maxPrice: { gte: price } }
            ]
          }
        ]
      },
      orderBy: [
        { minPrice: 'desc' }
      ]
    });

    return slab;
  }

  /**
   * Calculate incentive for a group of sales (same store + same slab)
   * NEW LOGIC: Apply incentive rate to ALL units, not just units above gate
   */
  static calculateGroupIncentive(
    units: number,
    incentiveAmount: number,
    finalGate: number,
    finalVolumeKicker: number
  ): { totalIncentive: number; appliedRate: number } {
    console.log(`\n[calculateGroupIncentive] ========== CALCULATION START ==========`);
    console.log(`[calculateGroupIncentive] Input Parameters:`);
    console.log(`  - Units sold: ${units}`);
    console.log(`  - Incentive per unit: ₹${incentiveAmount}`);
    console.log(`  - Final Gate (threshold): ${finalGate} units`);
    console.log(`  - Final Volume Kicker: ${finalVolumeKicker} units`);
    
    // Rule 1: Units < finalGate → 0 incentive
    if (units < finalGate) {
      console.log(`\n[calculateGroupIncentive] ✓ Rule 1 Applied: Units (${units}) < Final Gate (${finalGate})`);
      console.log(`[calculateGroupIncentive] Result: NO INCENTIVE (0% rate)`);
      console.log(`[calculateGroupIncentive] Calculation: ₹0`);
      console.log(`[calculateGroupIncentive] ========== CALCULATION END ==========\n`);
      return { totalIncentive: 0, appliedRate: 0 };
    }

    // Rule 2: Units >= finalGate and < finalVolumeKicker → 100% incentive on ALL units
    if (units < finalVolumeKicker) {
      const totalIncentive = units * incentiveAmount;
      
      console.log(`\n[calculateGroupIncentive] ✓ Rule 2 Applied: Units (${units}) >= Final Gate (${finalGate}) AND < Volume Kicker (${finalVolumeKicker})`);
      console.log(`[calculateGroupIncentive] Result: 100% INCENTIVE ON ALL UNITS`);
      console.log(`[calculateGroupIncentive] Calculation: ${units} units × ₹${incentiveAmount} × 100% = ₹${totalIncentive}`);
      console.log(`[calculateGroupIncentive] ========== CALCULATION END ==========\n`);
      
      return {
        totalIncentive,
        appliedRate: 1.0
      };
    }

    // Rule 3: Units >= finalVolumeKicker → 120% incentive on ALL units
    const totalIncentive = units * incentiveAmount * 1.2;
    
    console.log(`\n[calculateGroupIncentive] ✓ Rule 3 Applied: Units (${units}) >= Volume Kicker (${finalVolumeKicker})`);
    console.log(`[calculateGroupIncentive] Result: 120% INCENTIVE ON ALL UNITS (BONUS!)`);
    console.log(`[calculateGroupIncentive] Calculation: ${units} units × ₹${incentiveAmount} × 120% = ₹${totalIncentive}`);
    console.log(`[calculateGroupIncentive] ========== CALCULATION END ==========\n`);
    
    return {
      totalIncentive,
      appliedRate: 1.2
    };
  }

  /**
   * Calculate monthly incentive for a SEC user
   * NEW LOGIC: Calculate at store level (all SECs combined), then divide by numberOfSec
   */
  static async calculateMonthlyIncentive(
    secId: string,
    month: number,
    year: number
  ): Promise<IncentiveCalculationResult> {
    // Validate inputs
    if (!secId || month < 1 || month > 12 || year < 2000) {
      throw new Error('Invalid input parameters');
    }

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    console.log(`[IncentiveService] Date range for ${month}/${year}:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // First, get the SEC user to find their store
    const secUser = await (prisma as any).sEC.findUnique({
      where: { id: secId },
      include: { store: true }
    });

    if (!secUser || !secUser.storeId) {
      console.warn(`SEC ${secId} not found or not assigned to a store`);
      return {
        totalIncentive: 0,
        breakdownByStore: [],
        unitsSummary: {
          totalUnits: 0,
          unitsAboveGate: 0,
          unitsAboveVolumeKicker: 0
        }
      };
    }

    const storeId = secUser.storeId;
    const numberOfSec = secUser.store?.numberOfSec || 1;

    console.log(`\n========================================`);
    console.log(`🏪 STORE-LEVEL CALCULATION`);
    console.log(`   SEC ID: ${secId}`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Store Name: ${secUser.store?.name || 'Unknown'}`);
    console.log(`   Number of SECs: ${numberOfSec}`);
    console.log(`   Period: ${month}/${year}`);
    console.log(`========================================\n`);

    // Load ALL sales reports for the ENTIRE STORE in the specified month (all SECs combined)
    const salesReports = await (prisma as any).salesReport.findMany({
      where: {
        storeId: storeId,
        Date_of_sale: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        store: true,
        samsungSKU: true,
        secUser: true
      }
    });

    if (salesReports.length === 0) {
      return {
        totalIncentive: 0,
        breakdownByStore: [],
        unitsSummary: {
          totalUnits: 0,
          unitsAboveGate: 0,
          unitsAboveVolumeKicker: 0
        }
      };
    }

    // Group sales by store and slab
    const groupedSales = new Map<string, GroupedSales>();

    console.log(`\n========================================`);
    console.log(`📊 PROCESSING ${salesReports.length} STORE-LEVEL SALES REPORTS`);
    console.log(`   (All SECs at ${secUser.store?.name || storeId} combined)`);
    console.log(`========================================\n`);

    for (let i = 0; i < salesReports.length; i++) {
      const report = salesReports[i];
      const modelPrice = report.samsungSKU.ModelPrice || 0;
      
      console.log(`\n--- Report ${i + 1}/${salesReports.length} ---`);
      console.log(`  Report ID: ${report.id}`);
      console.log(`  SEC: ${report.secUser?.phone || report.secId}`);
      console.log(`  Store: ${report.store.name} (${report.storeId})`);
      console.log(`  Store numberOfSec: ${report.store.numberOfSec || 1}`);
      console.log(`  SKU: ${report.samsungSKU.ModelName}`);
      console.log(`  Model Price: ₹${modelPrice.toLocaleString()}`);
      console.log(`  Date of Sale: ${report.Date_of_sale}`);
      
      const slab = await this.getSlabForPrice(modelPrice);

      if (!slab) {
        console.warn(`  ❌ No slab found for price ₹${modelPrice}, skipping report ${report.id}`);
        continue;
      }

      console.log(`  ✓ Matched Slab:`);
      console.log(`    - Range: ₹${slab.minPrice?.toLocaleString() || 0} - ${slab.maxPrice ? '₹' + slab.maxPrice.toLocaleString() : 'No limit'}`);
      console.log(`    - Incentive per unit: ₹${slab.incentiveAmount}`);
      console.log(`    - Gate: ${slab.gate} units per SEC`);
      console.log(`    - Volume Kicker: ${slab.volumeKicker} units per SEC`);

      const groupKey = `${report.storeId}_${slab.id}`;

      if (!groupedSales.has(groupKey)) {
        groupedSales.set(groupKey, {
          storeId: report.store.id,
          storeName: report.store.name,
          numberOfSec: report.store.numberOfSec || 1,
          slabId: slab.id,
          slab: {
            minPrice: slab.minPrice,
            maxPrice: slab.maxPrice,
            incentiveAmount: slab.incentiveAmount,
            gate: slab.gate,
            volumeKicker: slab.volumeKicker
          },
          sales: []
        });
        console.log(`  📦 Created new group: ${groupKey}`);
      } else {
        console.log(`  📦 Added to existing group: ${groupKey}`);
      }

      groupedSales.get(groupKey)!.sales.push({
        id: report.id,
        modelPrice
      });
    }

    console.log(`\n========================================`);
    console.log(`📦 TOTAL GROUPS CREATED: ${groupedSales.size}`);
    console.log(`========================================\n`);

    // Calculate incentives for each group
    const breakdownByStore: IncentiveCalculationResult['breakdownByStore'] = [];
    let totalIncentive = 0;
    let totalUnits = 0;
    let unitsAboveGate = 0;
    let unitsAboveVolumeKicker = 0;

    // Group by store for the breakdown
    const storeGroups = new Map<string, typeof breakdownByStore[0]>();

    let groupIndex = 0;
    for (const [groupKey, group] of groupedSales.entries()) {
      groupIndex++;
      const units = group.sales.length;
      const finalGate = group.slab.gate * group.numberOfSec;
      const finalVolumeKicker = group.slab.volumeKicker * group.numberOfSec;

      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║  GROUP ${groupIndex}/${groupedSales.size}: ${groupKey.padEnd(48)} ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝`);
      console.log(`  Store: ${group.storeName} (${group.storeId})`);
      console.log(`  Number of SECs in store: ${group.numberOfSec}`);
      console.log(`  Price Slab: ₹${group.slab.minPrice?.toLocaleString() || 0} - ${group.slab.maxPrice ? '₹' + group.slab.maxPrice.toLocaleString() : 'No limit'}`);
      console.log(`  Base Incentive per unit: ₹${group.slab.incentiveAmount}`);
      console.log(`  Gate per SEC: ${group.slab.gate} units`);
      console.log(`  Volume Kicker per SEC: ${group.slab.volumeKicker} units`);
      console.log(`\n  📐 Calculated Thresholds:`);
      console.log(`    Final Gate = ${group.slab.gate} × ${group.numberOfSec} = ${finalGate} units`);
      console.log(`    Final Volume Kicker = ${group.slab.volumeKicker} × ${group.numberOfSec} = ${finalVolumeKicker} units`);
      console.log(`\n  � Salles in this group: ${units} units`);
      console.log(`    Sales IDs: ${group.sales.map((s: any) => s.id.substring(0, 8)).join(', ')}`);

      const { totalIncentive: groupIncentive, appliedRate } = this.calculateGroupIncentive(
        units,
        group.slab.incentiveAmount,
        finalGate,
        finalVolumeKicker
      );

      console.log(`  💰 Group Incentive: ₹${groupIncentive.toLocaleString()}`);
      console.log(`  📈 Applied Rate: ${appliedRate === 0 ? '0%' : appliedRate === 1.0 ? '100%' : '120%'}`);

      totalIncentive += groupIncentive;
      totalUnits += units;

      if (units > finalGate) {
        unitsAboveGate += (units - finalGate);
      }

      if (units > finalVolumeKicker) {
        unitsAboveVolumeKicker += (units - finalVolumeKicker);
      }

      // Add to store breakdown
      if (!storeGroups.has(group.storeId)) {
        storeGroups.set(group.storeId, {
          storeId: group.storeId,
          storeName: group.storeName,
          totalIncentive: 0,
          breakdownBySlab: []
        });
      }

      const storeBreakdown = storeGroups.get(group.storeId)!;
      storeBreakdown.totalIncentive += groupIncentive;
      storeBreakdown.breakdownBySlab.push({
        slabId: group.slabId,
        minPrice: group.slab.minPrice,
        maxPrice: group.slab.maxPrice,
        units,
        incentiveAmount: group.slab.incentiveAmount,
        appliedRate,
        totalIncentive: groupIncentive
      });
    }

    // Convert store groups to array
    for (const storeBreakdown of storeGroups.values()) {
      breakdownByStore.push(storeBreakdown);
    }

    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    FINAL SUMMARY                           ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
    console.log(`  📊 Total Units Sold: ${totalUnits}`);
    console.log(`  📈 Units Above Gate: ${unitsAboveGate}`);
    console.log(`  🚀 Units Above Volume Kicker: ${unitsAboveVolumeKicker}`);
    console.log(`  � TOTAL UINCENTIVE: ₹${Math.round(totalIncentive).toLocaleString()}`);
    console.log(`════════════════════════════════════════════════════════════\n`);

    // Calculate this SEC's share (total incentive divided by number of SECs)
    const secShare = Math.round(totalIncentive / numberOfSec);

    console.log(`\n  Number of SECs at store: ${numberOfSec}`);
    console.log(`  INCENTIVE PER SEC: Rs.${secShare.toLocaleString()}\n`);

    // Upsert into SalesSummary
    await (prisma as any).salesSummary.upsert({
      where: {
        secId_month_year: {
          secId,
          month,
          year
        }
      },
      update: {
        estimatedIncenetiveEarned: secShare,
        updatedAt: new Date()
      },
      create: {
        secId,
        month,
        year,
        totalSpotIncentiveEarned: 0,
        estimatedIncenetiveEarned: secShare
      }
    });

    console.log(`Saved to SalesSummary for SEC ${secId}: Rs.${secShare.toLocaleString()}\n`);

    return {
      totalIncentive: secShare, // Return the SEC's share, not the total store incentive
      breakdownByStore,
      unitsSummary: {
        totalUnits,
        unitsAboveGate,
        unitsAboveVolumeKicker
      }
    };
  }
}
