import { prisma } from '@/lib/prisma';

type DeviceType = 'FOLD' | 'S25' | 'OTHER';

interface IncentiveCalculationResult {
  totalIncentive: number;
  breakdownByStore: Array<{
    storeId: string;
    storeName: string;
    totalIncentive: number;
    attachPercentage: number | null;
    breakdownBySlab: Array<{
      slabId: string;
      minPrice: number | null;
      maxPrice: number | null;
      units: number;
      incentiveAmount: number;
      appliedRate: number; // 0, 1.0, or 1.2
      baseIncentive: number;
      deviceBonuses: {
        foldBonus: number;
        s25Bonus: number;
      };
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
  attachPercentage: number | null;
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
    deviceType: DeviceType;
    category: string;
    modelName: string;
  }>;
}

export class IncentiveService {
  /**
   * Get the attach rate for a store based on a specific date
   * When multiple periods contain the sale date, picks the smallest period (closest end date)
   * Example: If periods are Dec 1-5, Dec 1-10, Dec 1-15 and sale is Dec 7,
   * it will pick Dec 1-10 (smallest period containing Dec 7)
   */
  static async getAttachRateForStoreAndDate(
    storeId: string,
    dateOfSale: Date
  ): Promise<number | null> {
    // Find the attach rate where:
    // 1. storeId matches
    // 2. dateOfSale is between start and end (inclusive)
    // 3. If multiple match, get the one with the closest (smallest) end date
    const attachRate = await (prisma as any).periodicAttachRate.findFirst({
      where: {
        storeId: storeId,
        start: { lte: dateOfSale },  // start <= dateOfSale
        end: { gte: dateOfSale }     // end >= dateOfSale
      },
      orderBy: {
        end: 'asc'  // Get the period with the closest end date (smallest period)
      },
      select: {
        attachPercentage: true
      }
    });

    return attachRate?.attachPercentage ?? null;
  }

  /**
   * Identify device type based on Category and ModelName
   */
  static identifyDeviceType(category: string, modelName: string): DeviceType {
    const combinedString = `${category}${modelName}`.toUpperCase();
    
    if (combinedString.includes('FOLD')) {
      return 'FOLD';
    }
    if (combinedString.includes('S25')) {
      return 'S25';
    }
    return 'OTHER';
  }

  /**
   * Calculate device-specific bonus based on device type and store attach rate
   */
  static calculateDeviceBonus(
    deviceType: DeviceType,
    attachPercentage: number | null
  ): number {
    // Default to 0 if attachPercentage is null
    const attachRate = attachPercentage ?? 0;

    if (deviceType === 'FOLD') {
      // Fold devices: <25 → ₹400, >=25 → ₹600
      return attachRate < 25 ? 400 : 600;
    }

    if (deviceType === 'S25') {
      // S25 devices: <15 → ₹300, >=15 → ₹500
      return attachRate < 15 ? 300 : 500;
    }

    // Other devices get no bonus
    return 0;
  }

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
   * BONUS LOGIC: Add device-specific bonuses based on store attach rate
   */
  static calculateGroupIncentive(
    units: number,
    incentiveAmount: number,
    finalGate: number,
    finalVolumeKicker: number,
    sales: Array<{ deviceType: DeviceType; category: string; modelName: string }>,
    attachPercentage: number | null
  ): { 
    totalIncentive: number; 
    appliedRate: number;
    baseIncentive: number;
    deviceBonuses: { foldBonus: number; s25Bonus: number };
  } {
    console.log(`\n[calculateGroupIncentive] ========== CALCULATION START ==========`);
    console.log(`[calculateGroupIncentive] Input Parameters:`);
    console.log(`  - Units sold: ${units}`);
    console.log(`  - Incentive per unit: ₹${incentiveAmount}`);
    console.log(`  - Final Gate (threshold): ${finalGate} units`);
    console.log(`  - Final Volume Kicker: ${finalVolumeKicker} units`);
    console.log(`  - Store Attach Rate: ${attachPercentage ?? 'N/A'}%`);
    
    // Calculate base incentive first
    let baseIncentive = 0;
    let appliedRate = 0;

    // Rule 1: Units < finalGate → 0 incentive
    if (units < finalGate) {
      console.log(`\n[calculateGroupIncentive] ✓ Rule 1 Applied: Units (${units}) < Final Gate (${finalGate})`);
      console.log(`[calculateGroupIncentive] Result: NO BASE INCENTIVE (0% rate)`);
      baseIncentive = 0;
      appliedRate = 0;
    }
    // Rule 2: Units >= finalGate and < finalVolumeKicker → 100% incentive on ALL units
    else if (units < finalVolumeKicker) {
      baseIncentive = units * incentiveAmount;
      appliedRate = 1.0;
      
      console.log(`\n[calculateGroupIncentive] ✓ Rule 2 Applied: Units (${units}) >= Final Gate (${finalGate}) AND < Volume Kicker (${finalVolumeKicker})`);
      console.log(`[calculateGroupIncentive] Result: 100% INCENTIVE ON ALL UNITS`);
      console.log(`[calculateGroupIncentive] Base Calculation: ${units} units × ₹${incentiveAmount} × 100% = ₹${baseIncentive}`);
    }
    // Rule 3: Units >= finalVolumeKicker → 120% incentive on ALL units
    else {
      baseIncentive = units * incentiveAmount * 1.2;
      appliedRate = 1.2;
      
      console.log(`\n[calculateGroupIncentive] ✓ Rule 3 Applied: Units (${units}) >= Volume Kicker (${finalVolumeKicker})`);
      console.log(`[calculateGroupIncentive] Result: 120% INCENTIVE ON ALL UNITS (BONUS!)`);
      console.log(`[calculateGroupIncentive] Base Calculation: ${units} units × ₹${incentiveAmount} × 120% = ₹${baseIncentive}`);
    }

    // Calculate device-specific bonuses
    let foldBonus = 0;
    let s25Bonus = 0;
    let foldCount = 0;
    let s25Count = 0;

    console.log(`\n[calculateGroupIncentive] 📱 DEVICE-SPECIFIC BONUS CALCULATION:`);
    
    for (const sale of sales) {
      const bonus = this.calculateDeviceBonus(sale.deviceType, attachPercentage);
      
      if (sale.deviceType === 'FOLD') {
        foldBonus += bonus;
        foldCount++;
      } else if (sale.deviceType === 'S25') {
        s25Bonus += bonus;
        s25Count++;
      }
    }

    if (foldCount > 0) {
      const bonusPerUnit = this.calculateDeviceBonus('FOLD', attachPercentage);
      console.log(`  🔲 Fold Devices: ${foldCount} units × ₹${bonusPerUnit} = ₹${foldBonus}`);
      console.log(`     (Attach rate ${attachPercentage ?? 0}% ${(attachPercentage ?? 0) < 25 ? '<' : '>='} 25%)`);
    }
    
    if (s25Count > 0) {
      const bonusPerUnit = this.calculateDeviceBonus('S25', attachPercentage);
      console.log(`  📱 S25 Devices: ${s25Count} units × ₹${bonusPerUnit} = ₹${s25Bonus}`);
      console.log(`     (Attach rate ${attachPercentage ?? 0}% ${(attachPercentage ?? 0) < 15 ? '<' : '>='} 15%)`);
    }

    const totalDeviceBonus = foldBonus + s25Bonus;
    const totalIncentive = baseIncentive + totalDeviceBonus;

    console.log(`\n[calculateGroupIncentive] 💰 FINAL CALCULATION:`);
    console.log(`  - Base Incentive: ₹${baseIncentive.toLocaleString()}`);
    console.log(`  - Device Bonuses: ₹${totalDeviceBonus.toLocaleString()}`);
    console.log(`  - TOTAL INCENTIVE: ₹${totalIncentive.toLocaleString()}`);
    console.log(`[calculateGroupIncentive] ========== CALCULATION END ==========\n`);
    
    return {
      totalIncentive,
      appliedRate,
      baseIncentive,
      deviceBonuses: { foldBonus, s25Bonus }
    };
  }

  /**
   * Calculate monthly incentive for a SEC user
   * NEW LOGIC: Calculate at store level (all SECs combined), then divide by numberOfSec
   * @param numberOfSec - Number of SECs at the store (provided by frontend)
   */
  static async calculateMonthlyIncentive(
    secId: string,
    month: number,
    year: number,
    numberOfSec: number
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

    console.log(`\n========================================`);
    console.log(`🏪 STORE-LEVEL CALCULATION`);
    console.log(`   SEC ID: ${secId}`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Store Name: ${secUser.store?.name || 'Unknown'}`);
    console.log(`   Number of SECs: ${numberOfSec} (from frontend)`);
    console.log(`   Period: ${month}/${year}`);
    console.log(`   Attach Rate: Will be fetched per sale from periodicAttachRate`);
    console.log(`========================================\n`);

    // Load ALL sales reports for the ENTIRE STORE in the specified month (all SECs combined)
    const salesReports = await (prisma as any).dailyIncentiveReport.findMany({
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
      const category = report.samsungSKU.Category || '';
      const modelName = report.samsungSKU.ModelName || '';
      const deviceType = this.identifyDeviceType(category, modelName);
      
      const slab = await this.getSlabForPrice(modelPrice);

      if (!slab) {
        console.warn(`  ❌ No slab found for price ₹${modelPrice}, skipping report ${report.id}`);
        continue;
      }

      const groupKey = `${report.storeId}_${slab.id}`;

      if (!groupedSales.has(groupKey)) {
        // Fetch attach rate for this sale's date
        const attachPercentage = await this.getAttachRateForStoreAndDate(
          report.storeId,
          report.Date_of_sale
        );

        groupedSales.set(groupKey, {
          storeId: report.store.id,
          storeName: report.store.name,
          numberOfSec: numberOfSec,
          attachPercentage: attachPercentage,
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
      }

      groupedSales.get(groupKey)!.sales.push({
        id: report.id,
        modelPrice,
        deviceType,
        category,
        modelName
      });
    }

    console.log(`\n========================================`);
    console.log(`📦 TOTAL GROUPS CREATED: ${groupedSales.size}`);
    console.log(`========================================\n`);

    // NEW LOGIC: Calculate TOTAL units across ALL slabs first
    // Then determine the rate based on total units
    // Apply that rate to ALL slabs
    
    const breakdownByStore: IncentiveCalculationResult['breakdownByStore'] = [];
    let totalIncentive = 0;
    let totalUnits = 0;
    
    // Calculate total units across all groups
    for (const group of groupedSales.values()) {
      totalUnits += group.sales.length;
    }
    
    // Use the first group's gate/volumeKicker values (they should be the same for all groups in same store)
    const firstGroup = Array.from(groupedSales.values())[0];
    const finalGate = firstGroup.slab.gate * firstGroup.numberOfSec;
    const finalVolumeKicker = firstGroup.slab.volumeKicker * firstGroup.numberOfSec;
    
    // Log store-level information ONCE
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    STORE-LEVEL SUMMARY                     ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
    console.log(`  Store: ${firstGroup.storeName} (${firstGroup.storeId})`);
    console.log(`  Number of SECs: ${firstGroup.numberOfSec}`);
    console.log(`  Attach Rate: ${firstGroup.attachPercentage !== null ? firstGroup.attachPercentage + '%' : 'N/A'}`);
    console.log(`  Total Units (All Slabs): ${totalUnits}`);
    console.log(`  Final Gate: ${finalGate} units`);
    console.log(`  Final Volume Kicker: ${finalVolumeKicker} units`);
    
    // Determine the rate based on TOTAL units
    let globalAppliedRate = 0;
    if (totalUnits < finalGate) {
      globalAppliedRate = 0;
      console.log(`\n  🎯 RATE DECISION: ${totalUnits} < ${finalGate} → 0% (Below Gate)`);
    } else if (totalUnits < finalVolumeKicker) {
      globalAppliedRate = 1.0;
      console.log(`\n  🎯 RATE DECISION: ${totalUnits} >= ${finalGate} AND < ${finalVolumeKicker} → 100%`);
    } else {
      globalAppliedRate = 1.2;
      console.log(`\n  🎯 RATE DECISION: ${totalUnits} >= ${finalVolumeKicker} → 120% (Volume Kicker!)`);
    }
    
    console.log(`\n========================================`);
    console.log(`📊 CALCULATING INCENTIVES BY SLAB (${globalAppliedRate === 0 ? '0%' : globalAppliedRate === 1.0 ? '100%' : '120%'} rate)`);
    console.log(`========================================\n`);

    // Group by store for the breakdown
    const storeGroups = new Map<string, typeof breakdownByStore[0]>();
    let unitsAboveGate = 0;
    let unitsAboveVolumeKicker = 0;

    let groupIndex = 0;
    for (const [groupKey, group] of groupedSales.entries()) {
      groupIndex++;
      const units = group.sales.length;

      console.log(`\n[Slab ${groupIndex}/${groupedSales.size}] ₹${group.slab.minPrice?.toLocaleString() || 0} - ${group.slab.maxPrice ? '₹' + group.slab.maxPrice.toLocaleString() : 'No limit'}`);
      
      // Count device types
      const deviceCounts = group.sales.reduce((acc, sale) => {
        acc[sale.deviceType] = (acc[sale.deviceType] || 0) + 1;
        return acc;
      }, {} as Record<DeviceType, number>);
      
      if (Object.keys(deviceCounts).length > 0) {
        console.log(`  Devices: ${Object.entries(deviceCounts).map(([type, count]) => `${type}=${count}`).join(', ')}`);
      }

      // Calculate base incentive using global rate
      const baseIncentive = units * group.slab.incentiveAmount * globalAppliedRate;
      
      console.log(`\n  📊 Base Incentive Calculation:`);
      console.log(`     ${units} units × ₹${group.slab.incentiveAmount} × ${globalAppliedRate === 0 ? '0%' : globalAppliedRate === 1.0 ? '100%' : '120%'} = ₹${baseIncentive.toLocaleString()}`);
      
      // Calculate device-specific bonuses
      let foldBonus = 0;
      let s25Bonus = 0;
      let foldCount = 0;
      let s25Count = 0;
      
      for (const sale of group.sales) {
        const bonus = this.calculateDeviceBonus(sale.deviceType, group.attachPercentage);
        
        if (sale.deviceType === 'FOLD') {
          foldBonus += bonus;
          foldCount++;
        } else if (sale.deviceType === 'S25') {
          s25Bonus += bonus;
          s25Count++;
        }
      }

      const totalDeviceBonus = foldBonus + s25Bonus;
      
      // Log device bonuses with logic explanation
      if (foldCount > 0 || s25Count > 0) {
        console.log(`\n  🎁 Device-Specific Bonuses:`);
        const attachRate = group.attachPercentage ?? 0;
        
        if (foldCount > 0) {
          const bonusPerUnit = this.calculateDeviceBonus('FOLD', group.attachPercentage);
          const logic = attachRate < 25 ? `Attach ${attachRate}% < 25% → ₹400/unit` : `Attach ${attachRate}% ≥ 25% → ₹600/unit`;
          console.log(`     FOLD: ${foldCount} units × ₹${bonusPerUnit} = ₹${foldBonus.toLocaleString()} (${logic})`);
        }
        
        if (s25Count > 0) {
          const bonusPerUnit = this.calculateDeviceBonus('S25', group.attachPercentage);
          const logic = attachRate < 15 ? `Attach ${attachRate}% < 15% → ₹300/unit` : `Attach ${attachRate}% ≥ 15% → ₹500/unit`;
          console.log(`     S25: ${s25Count} units × ₹${bonusPerUnit} = ₹${s25Bonus.toLocaleString()} (${logic})`);
        }
      }

      const groupIncentive = baseIncentive + totalDeviceBonus;

      console.log(`\n  💰 Slab Total: ₹${baseIncentive.toLocaleString()} (base) + ₹${totalDeviceBonus.toLocaleString()} (bonuses) = ₹${groupIncentive.toLocaleString()}`);

      totalIncentive += groupIncentive;

      // Add to store breakdown
      if (!storeGroups.has(group.storeId)) {
        storeGroups.set(group.storeId, {
          storeId: group.storeId,
          storeName: group.storeName,
          totalIncentive: 0,
          attachPercentage: group.attachPercentage,
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
        appliedRate: globalAppliedRate,
        baseIncentive,
        deviceBonuses: { foldBonus, s25Bonus },
        totalIncentive: groupIncentive
      });
    }
    
    // Calculate units above gate/volumeKicker
    if (totalUnits > finalGate) {
      unitsAboveGate = totalUnits - finalGate;
    }
    if (totalUnits > finalVolumeKicker) {
      unitsAboveVolumeKicker = totalUnits - finalVolumeKicker;
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