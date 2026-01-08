import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/canvasser/incentive-form/stores
 * Get all stores for the incentive form dropdown with search and filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          city: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      };
    }

    const stores = await prisma.store.findMany({
      where,
      orderBy: [
        { city: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        city: true,
        numberOfSec: true,
      },
      take: limit,
    });

    // Get unique cities for filter dropdown
    const cities = await prisma.store.findMany({
      select: {
        city: true
      },
      distinct: ['city'],
      where: {
        city: {
          not: null
        }
      },
      orderBy: {
        city: 'asc'
      }
    });

    const uniqueCities = cities
      .map(store => store.city)
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      stores,
      cities: uniqueCities,
      total: stores.length
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

