import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '200'); // Increased to accommodate all stores
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      };
    }

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

    // Fetch stores with pagination
    const [stores, totalCount] = await Promise.all([
      prisma.store.findMany({
        where,
        select: {
          id: true,
          name: true,
          city: true,
          numberOfCanvasser: true,
          createdAt: true
        },
        orderBy: [
          { city: 'asc' },
          { name: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.store.count({ where })
    ]);

    // Get unique cities for filter options
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
      success: true,
      data: {
        stores,
        totalCount,
        cities: uniqueCities,
        pagination: {
          limit,
          offset,
          hasMore: offset + stores.length < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stores'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, city, numberOfCanvasser } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Store name is required'
        },
        { status: 400 }
      );
    }

    // Generate unique store ID
    const storeId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const store = await prisma.store.create({
      data: {
        id: storeId,
        name: name.trim(),
        city: city?.trim() || null,
        numberOfCanvasser: numberOfCanvasser || 1,
        samsungIncentiveInfo: []
      }
    });

    return NextResponse.json({
      success: true,
      data: store
    });

  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create store'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}