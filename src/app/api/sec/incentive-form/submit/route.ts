import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/sec/incentive-form/submit
 * Submit a spot incentive sales report
 * 
 * Body:
 * {
 *   secPhone: string,
 *   storeId: string,
 *   deviceId: string,
 *   planId: string,
 *   imei: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { secPhone, storeId, deviceId, planId, imei } = body;

    // Validate required fields
    if (!secPhone || !storeId || !deviceId || !planId || !imei) {
      return NextResponse.json(
        { error: 'All fields are required: secPhone, storeId, deviceId, planId, imei' },
        { status: 400 }
      );
    }

    // Validate IMEI format (15 digits)
    const imeiRegex = /^\d{15}$/;
    if (!imeiRegex.test(imei)) {
      return NextResponse.json(
        { error: 'IMEI must be exactly 15 digits' },
        { status: 400 }
      );
    }

    // Verify SEC phone matches authenticated user
    if (authUser.username !== secPhone) {
      return NextResponse.json(
        { error: 'SEC phone does not match authenticated user' },
        { status: 403 }
      );
    }

    // Find SEC user by phone
    const secUser = await prisma.sEC.findUnique({
      where: { phone: secPhone },
    });

    if (!secUser) {
      return NextResponse.json(
        { error: 'SEC user not found. Please login first.' },
        { status: 404 }
      );
    }

    // Check if IMEI already exists
    const existingReport = await prisma.salesReport.findUnique({
      where: { imei },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'This IMEI has already been submitted' },
        { status: 409 }
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Verify device exists
    const device = await prisma.samsungSKU.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Verify plan exists and get price
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Verify plan belongs to the selected device
    if (plan.samsungSKUId !== deviceId) {
      return NextResponse.json(
        { error: 'Selected plan does not belong to the selected device' },
        { status: 400 }
      );
    }

    // Check for active spot incentive campaign
    // Only give spot incentive if an active campaign exists
    const now = new Date();
    const activeCampaign = await prisma.spotIncentiveCampaign.findFirst({
      where: {
        storeId: store.id,
        samsungSKUId: device.id,
        planId: plan.id,
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Calculate spot incentive only if campaign exists
    let spotincentiveEarned = 0;
    const isCampaignActive = !!activeCampaign;

    if (activeCampaign) {
      if (activeCampaign.incentiveType === 'FIXED') {
        spotincentiveEarned = Math.round(activeCampaign.incentiveValue);
      } else if (activeCampaign.incentiveType === 'PERCENTAGE') {
        spotincentiveEarned = Math.round(plan.price * (activeCampaign.incentiveValue / 100));
      }
    }
    // If no campaign, spotincentiveEarned remains 0 and isCampaignActive is false

    // Get current month and year for SalesSummary
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // Find or create SalesSummary for this month/year
    let salesSummary = await prisma.salesSummary.findFirst({
      where: {
        secId: secUser.id,
        month,
        year,
      },
    });

    if (!salesSummary) {
      // Create new SalesSummary
      salesSummary = await prisma.salesSummary.create({
        data: {
          secId: secUser.id,
          month,
          year,
          totalSpotIncentiveEarned: 0,
        },
      });
    }

    // Create the sales report with isCampaignActive field
    const salesReport = await prisma.salesReport.create({
      data: {
        secId: secUser.id,
        storeId: store.id,
        samsungSKUId: device.id,
        planId: plan.id,
        imei,
        spotincentiveEarned,
        isCompaignActive: isCampaignActive,
        Date_of_sale: now,
        salesSummaryid: salesSummary.id,
      },
      include: {
        secUser: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        samsungSKU: {
          select: {
            id: true,
            Category: true,
            ModelName: true,
          },
        },
        plan: {
          select: {
            id: true,
            planType: true,
            price: true,
          },
        },
      },
    });

    // Update SalesSummary totals
    // Get all sales reports for this month/year to recalculate totals
    const monthReports = await prisma.salesReport.findMany({
      where: {
        salesSummaryid: salesSummary.id,
      },
    });

    // Calculate total spot incentive (from all reports in this month)
    const totalSpotIncentive = monthReports.reduce(
      (sum, report: any) => sum + (report.spotincentiveEarned || 0),
      0
    );

    // Update SalesSummary with new totals
    await prisma.salesSummary.update({
      where: { id: salesSummary.id },
      data: {
        totalSpotIncentiveEarned: totalSpotIncentive,
      },
    });

    return NextResponse.json(
      {
        success: true,
        salesReport: {
          id: salesReport.id,
          imei: salesReport.imei,
          incentiveEarned: salesReport.spotincentiveEarned,
          dateOfSale: salesReport.Date_of_sale,
          isCampaignActive: salesReport.isCompaignActive,
          store: salesReport.store,
          device: salesReport.samsungSKU,
          plan: salesReport.plan,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/sec/incentive-form/submit', error);
    
    // Handle Prisma unique constraint violation (duplicate IMEI)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'This IMEI has already been submitted' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

