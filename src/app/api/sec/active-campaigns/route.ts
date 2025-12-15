import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/sec/active-campaigns
 * Get active spot incentive campaigns for SEC user's store
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;
    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 }
      );
    }

    // Find SEC user
    const secUser = await prisma.sEC.findUnique({
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

    if (!secUser || !secUser.store) {
      return NextResponse.json(
        { error: 'SEC user or store not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get active campaigns for this store
    const activeCampaigns = await prisma.spotIncentiveCampaign.findMany({
      where: {
        storeId: secUser.store.id,
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
        samsungSKU: {
          select: {
            ModelName: true,
            Category: true,
          },
        },
        plan: {
          select: {
            planType: true,
            price: true,
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
      deviceName: campaign.samsungSKU.ModelName || campaign.samsungSKU.Category,
      planType: campaign.plan.planType.replace(/_/g, ' '),
      planPrice: campaign.plan.price,
      incentiveType: campaign.incentiveType,
      incentiveValue: campaign.incentiveValue,
      startDate: campaign.startDate.toISOString().split('T')[0],
      endDate: campaign.endDate.toISOString().split('T')[0],
      storeName: campaign.store.name,
      storeCity: campaign.store.city,
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaigns: formattedCampaigns,
        store: {
          id: secUser.store.id,
          name: secUser.store.name,
          city: secUser.store.city,
        },
        totalActiveCampaigns: activeCampaigns.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sec/active-campaigns', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}