import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/ase/stores
// Get all available stores for ASE to select from
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const includeIds = searchParams.get('includeIds'); // Comma-separated store IDs to always include

    // Build where clause for search
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

    let stores = await prisma.store.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: [
        { name: 'asc' },
        { city: 'asc' }
      ],
      take: search ? 100 : 500 // Higher limit when no search, lower when searching
    });

    // If we have specific IDs to include, fetch them separately and merge
    if (includeIds) {
      const idsToInclude = includeIds.split(',').filter(Boolean);
      if (idsToInclude.length > 0) {
        const existingIds = new Set(stores.map(s => s.id));
        const missingIds = idsToInclude.filter(id => !existingIds.has(id));
        
        if (missingIds.length > 0) {
          const additionalStores = await prisma.store.findMany({
            where: {
              id: {
                in: missingIds
              }
            },
            select: {
              id: true,
              name: true,
              city: true,
            }
          });
          
          // Add the additional stores at the beginning
          stores = [...additionalStores, ...stores];
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        stores
      }
    });
  } catch (error) {
    console.error('Error in GET /api/ase/stores', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}