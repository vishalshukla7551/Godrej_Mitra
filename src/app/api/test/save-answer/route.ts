import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, testId, questionId, selectedAnswer } = body;

    const cookieStore = await cookies();
    const canvasserId = cookieStore.get('canvasserId')?.value || 'unknown';

    // In production, save to TestAnswer model
    // For now, just log and return success
    console.log('Answer saved:', { canvasserId, sessionToken, testId, questionId, selectedAnswer });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
