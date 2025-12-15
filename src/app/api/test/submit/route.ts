import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, testId, testName, answers, score, totalQuestions, passed } = body;

    const cookieStore = await cookies();
    const secId = cookieStore.get('secId')?.value || 'unknown';
    const phone = cookieStore.get('phone')?.value;
    const storeId = cookieStore.get('storeId')?.value;
    const storeName = cookieStore.get('storeName')?.value;

    // Test submission model not present in Prisma schema — log submission to server console
    console.log('Test submission:', { secId, phone, sessionToken, testId, testName, answers, score, totalQuestions, passed, storeId, storeName });

    return NextResponse.json({ success: true, passed });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit test' }, { status: 500 });
  }
}
