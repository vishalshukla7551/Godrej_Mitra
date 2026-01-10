import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/zopper-admin/spot-incentive-report/[id]/mark-paid
 * Mark a spot incentive report as paid
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    // Normalize params (some Next versions provide params as a Promise)
    const params = await Promise.resolve(context.params);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;

    // Update the report to mark as paid
    const updatedReport = await prisma.spotIncentiveReport.update({
      where: { id: reportId },
      data: {
        spotincentivepaidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report marked as paid successfully',
      data: updatedReport,
    });

  } catch (error) {
    console.error('Error marking report as paid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}