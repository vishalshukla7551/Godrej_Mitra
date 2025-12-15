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
    const { secPhone, storeId, deviceId, planId, imei, dateOfSale } = body;

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

    // Check if IMEI already exists in SpotIncentiveReport
    const existingReport = await prisma.spotIncentiveReport.findUnique({
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

    // Calculate spot incentive based on plan type
    // ADLD_1_YR = ₹200, COMBO_2_YRS = ₹300
    let spotincentiveEarned = 0;
    const isCampaignActive = true; // Set campaigns as active for now as requested

    if (plan.planType === 'ADLD_1_YR') {
      spotincentiveEarned = 200;
    } else if (plan.planType === 'COMBO_2_YRS') {
      spotincentiveEarned = 300;
    }
    // Other plan types get 0 incentive

    // Use provided dateOfSale or default to now
    const saleDate = dateOfSale ? new Date(dateOfSale) : now;

    // Create the spot incentive report
    const salesReport = await prisma.spotIncentiveReport.create({
      data: {
        secId: secUser.id,
        storeId: store.id,
        samsungSKUId: device.id,
        planId: plan.id,
        imei,
        spotincentiveEarned,
        isCompaignActive: isCampaignActive,
        Date_of_sale: saleDate,
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

    // No need to update SalesSummary for spot incentives
    // Spot incentives are tracked separately in SpotIncentiveReport

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

