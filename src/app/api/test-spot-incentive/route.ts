import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/test-spot-incentive
 * Test endpoint to verify spot incentive data flow
 */
export async function GET(req: NextRequest) {
  try {
    // Get a sample of spot incentive reports
    const spotReports = await prisma.spotIncentiveReport.findMany({
      take: 5,
      include: {
        secUser: {
          select: {
            phone: true,
            fullName: true,
          },
        },
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

    // Get active campaigns
    const activeCampaigns = await prisma.spotIncentiveCampaign.findMany({
      where: {
        active: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        store: {
          select: {
            name: true,
          },
        },
        samsungSKU: {
          select: {
            ModelName: true,
          },
        },
        plan: {
          select: {
            planType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        spotReports: spotReports.map(report => ({
          id: report.id,
          secPhone: report.secUser?.phone,
          storeName: report.store.name,
          deviceName: report.samsungSKU.ModelName,
          planType: report.plan.planType,
          incentiveEarned: report.spotincentiveEarned,
          isCampaignActive: report.isCompaignActive,
          dateOfSale: report.Date_of_sale,
          imei: report.imei,
        })),
        activeCampaigns: activeCampaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          storeName: campaign.store.name,
          deviceName: campaign.samsungSKU.ModelName,
          planType: campaign.plan.planType,
          incentiveType: campaign.incentiveType,
          incentiveValue: campaign.incentiveValue,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        })),
        summary: {
          totalReports: spotReports.length,
          activeCampaigns: activeCampaigns.length,
        },
      },
    });
  } catch (error) {
    console.error('Error in test spot incentive:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}