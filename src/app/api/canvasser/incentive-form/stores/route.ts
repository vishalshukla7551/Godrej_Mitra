import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sec/incentive-form/stores
 * Get all stores for the incentive form dropdown
 */
export async function GET(req: NextRequest) {
  try {
    const stores = await prisma.store.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
    });

    return NextResponse.json({
      stores,
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

