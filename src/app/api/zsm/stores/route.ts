import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);
    
    if (!authUser || authUser.role !== 'ZSM') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const includeIds = searchParams.get('includeIds');
    
    // Build where clause for search
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Always include specific IDs if provided (for currently selected stores)
    if (includeIds) {
      const ids = includeIds.split(',').filter(Boolean);
      if (ids.length > 0) {
        if (whereClause.OR) {
          whereClause.OR.push({ id: { in: ids } });
        } else {
          whereClause.OR = [{ id: { in: ids } }];
        }
      }
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
      },
      orderBy: [
        { name: 'asc' }
      ],
      take: 100 // Limit results
    });

    return NextResponse.json({
      success: true,
      data: { stores }
    });

  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}