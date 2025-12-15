import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, eventType, details } = body;

    const cookieStore = await cookies();
    const secId = cookieStore.get('secId')?.value || 'unknown';
    const phone = cookieStore.get('phone')?.value;

    await prisma.proctoringEvent.create({
      data: {
        secId,
        phone,
        sessionToken,
        eventType: eventType as any,
        details,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging proctoring event:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
