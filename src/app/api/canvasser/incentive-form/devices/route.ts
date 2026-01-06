import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sec/incentive-form/devices
 * Get all Samsung devices (SamsungSKU) for the incentive form dropdown
 */
export async function GET(req: NextRequest) {
  try {
    const devices = await prisma.samsungSKU.findMany({
      orderBy: [
        { Category: 'asc' },
        { ModelName: 'asc' },
      ],
      select: {
        id: true,
        Category: true,
        ModelName: true,
      },
    });

    return NextResponse.json({
      devices,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

