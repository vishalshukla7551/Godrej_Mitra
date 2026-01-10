import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/zopper-admin/spot-incentive-report/[id]/discard
 * Discard (delete) a spot incentive report
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    // Normalize params: Next's context.params can be a Promise in some environments
    const params = await Promise.resolve(context.params);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;

    // Delete the report
    await prisma.spotIncentiveReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({
      success: true,
      message: 'Report discarded successfully',
    });

  } catch (error) {
    console.error('Error discarding report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}