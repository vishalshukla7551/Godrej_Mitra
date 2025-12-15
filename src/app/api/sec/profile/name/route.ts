import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// POST /api/sec/profile/name
// Body: { firstName: string; lastName?: string; storeId?: string }
// Stores the SEC's full name and storeId in the SEC collection, keyed by phone (secId).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const firstName: string | undefined = body?.firstName;
    const lastName: string | undefined = body?.lastName;
    const storeId: string | undefined = body?.storeId;

    if (!firstName || typeof firstName !== 'string') {
      return NextResponse.json(
        { error: 'firstName is required' },
        { status: 400 },
      );
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = (lastName || '').trim();

    if (!trimmedFirst) {
      return NextResponse.json(
        { error: 'firstName must not be empty' },
        { status: 400 },
      );
    }

    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 },
      );
    }

    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    // Prepare update data
    const updateData: any = {
      fullName,
      updatedAt: new Date(),
    };

    // Only update store connection if storeId is provided
    if (storeId) {
      updateData.store = {
        connect: { id: storeId },
      };
    }

    const createData: any = {
      phone,
      fullName,
      lastLoginAt: new Date(),
    };

    // Connect store on create if provided
    if (storeId) {
      createData.store = {
        connect: { id: storeId },
      };
    }

    const secRecord = await prisma.sEC.upsert({
      where: { phone },
      update: updateData,
      create: createData,
      select: {
        id: true,
        phone: true,
        fullName: true,
        storeId: true,
        store: {
          select: {
                id: true,
                name: true,
                city: true,
              },
        },
      },
    });

    return NextResponse.json({
      success: true,
      id: secRecord.id,
      phone: secRecord.phone,
      fullName: secRecord.fullName,
      storeId: secRecord.storeId,
      store: secRecord.store,
    });
  } catch (error) {
    console.error('Error in POST /api/sec/profile/name', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
