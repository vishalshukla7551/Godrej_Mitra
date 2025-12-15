import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei');

    if (!imei) {
      return NextResponse.json(
        { error: 'IMEI parameter is required' },
        { status: 400 }
      );
    }

    // Check if IMEI exists in SpotIncentiveReport ONLY
    const existingSpotReport = await prisma.spotIncentiveReport.findUnique({
      where: {
        imei: imei,
      },
    });

    const exists = !!existingSpotReport;

    return NextResponse.json({
      exists,
      foundIn: existingSpotReport ? 'SpotIncentiveReport' : null,
    });
  } catch (error) {
    console.error('Error checking IMEI:', error);
    return NextResponse.json(
      { error: 'Failed to check IMEI', exists: false },
      { status: 500 }
    );
  }
}
