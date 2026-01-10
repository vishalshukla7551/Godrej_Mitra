import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// POST /api/canvasser/onboarding
// Body: { firstName: string; lastName?: string; storeId?: string; employeeId?: string }
// Stores the ASA Canvasser's full name, employeeId, and storeId in the ASA Canvasser collection, keyed by phone.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const firstName: string | undefined = body?.firstName;
    const lastName: string | undefined = body?.lastName;
    const storeId: string | undefined = body?.storeId;
    const employeeId: string | undefined = body?.employeeId;

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

    // Retrieve authenticated user (we need phone to validate uniqueness)
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'CANVASSER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing ASA Canvasser identifier' },
        { status: 400 },
      );
    }

    // Validate employeeId if provided
    if (employeeId && typeof employeeId === 'string') {
      const trimmedEmployId = employeeId.trim();
      if (trimmedEmployId) {
        // Check if employeeId already exists for a different user
        const existingCanvasser = await prisma.canvasser.findFirst({
          where: { employeeId: trimmedEmployId },
          select: { phone: true },
        });

        if (existingCanvasser && existingCanvasser.phone !== phone) {
          return NextResponse.json(
            { error: 'Canvasser ID already in use' },
            { status: 400 },
          );
        }
      }
    }

    
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    // Prepare update data
    const updateData: any = {
      fullName,
      updatedAt: new Date(),
    };

    if (employeeId && typeof employeeId === 'string') {
      updateData.employeeId = employeeId.trim();
    }

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

    if (employeeId && typeof employeeId === 'string') {
      createData.employeeId = employeeId.trim();
    }

    // Connect store on create if provided
    if (storeId) {
      createData.store = {
        connect: { id: storeId },
      };
    }

    const canvasserRecord = await prisma.canvasser.upsert({
      where: { phone },
      update: updateData,
      create: createData,
      select: {
        id: true,
        phone: true,
        fullName: true,
        employeeId: true,
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
      employeeId: secRecord.employeeId,
      storeId: secRecord.storeId,
      store: secRecord.store,
    });
  } catch (error) {
    console.error('Error in POST /api/canvasser/onboarding', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
