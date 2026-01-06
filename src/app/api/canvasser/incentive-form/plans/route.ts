import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sec/incentive-form/plans?deviceId=xxx
 * Get all plans for a specific device
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId parameter is required' },
        { status: 400 }
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

    // Get all plans for this device
    const plans = await prisma.plan.findMany({
      where: {
        samsungSKUId: deviceId,
      },
      orderBy: {
        price: 'asc',
      },
      select: {
        id: true,
        planType: true,
        price: true,
      },
    });

    // Format plan labels for display
    const formattedPlans = plans.map((plan) => {
      let label: string = plan.planType;
      // Format plan type for display
      if (label.includes('_')) {
        label = label.replace(/_/g, ' ');
      }
      // Capitalize first letter of each word
      label = label
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      return {
        id: plan.id,
        planType: plan.planType,
        price: plan.price,
        label,
      };
    });

    return NextResponse.json({
      plans: formattedPlans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

