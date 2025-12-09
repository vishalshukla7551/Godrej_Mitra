import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/sec/profile
// Get SEC profile and associated store
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('SEC' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find SEC by ID (for SEC users, authUser.id is the SEC ObjectId)
    const sec = await prisma.sEC.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      }
    });

    if (!sec) {
      return NextResponse.json({ error: 'SEC profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        sec: {
          id: sec.id,
          fullName: sec.fullName,
          phone: sec.phone
        },
        store: sec.store
      }
    });
  } catch (error) {
    console.error('Error in GET /api/sec/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}