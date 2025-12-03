import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// POST /api/sec/profile/name
// Body: { firstName: string; lastName?: string }
// Stores the SEC's full name in the SEC collection, keyed by phone (secId).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const firstName: string | undefined = body?.firstName;
    const lastName: string | undefined = body?.lastName;

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

    const secRecord = await prisma.sEC.upsert({
      where: { phone },
      update: {
        fullName,
        updatedAt: new Date(),
      },
      create: {
        phone,
        fullName,
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: secRecord.id,
        phone: secRecord.phone,
        fullName: secRecord.fullName,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/sec/profile/name', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
