import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/canvasser/active-campaigns
 * Get active spot incentive campaigns for Canvasser user's store
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'CANVASSER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;
    if (!phone) {
      return NextResponse.json(
        { error: 'Missing Canvasser identifier' },
        { status: 400 }
      );
    }

    // Find Canvasser user
    const canvasserUser = await prisma.canvasser.findUnique({
      where: { phone },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    if (!canvasserUser || !canvasserUser.store) {
      return NextResponse.json(
        { error: 'Canvasser user or store not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get active campaigns for this store
    const activeCampaigns = await prisma.spotIncentiveCampaign.findMany({
      where: {
        storeId: canvasserUser.store.id,
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        store: {
          select: {
            name: true,
            city: true,
          },
        },
        godrejSKU: {
          select: {
            Category: true,
          },
        },
        plan: {
          select: {
            planType: true,
            PlanPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format campaigns for frontend
    const formattedCampaigns = activeCampaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name || 'Unnamed Campaign',
      description: campaign.description || '',
      deviceName: campaign.godrejSKU.Category,
      planType: campaign.plan.planType.replace(/_/g, ' '),
      planPrice: campaign.plan.PlanPrice,
      incentiveType: campaign.incentiveType,
      incentiveValue: campaign.incentiveValue,
      startDate: campaign.startDate ? campaign.startDate.toISOString().split('T')[0] : null,
      endDate: campaign.endDate ? campaign.endDate.toISOString().split('T')[0] : null,
      storeName: campaign.store.name,
      storeCity: campaign.store.city,
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaigns: formattedCampaigns,
        store: {
          id: canvasserUser.store.id,
          name: canvasserUser.store.name,
          city: canvasserUser.store.city,
        },
        totalActiveCampaigns: activeCampaigns.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/canvasser/active-campaigns', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}