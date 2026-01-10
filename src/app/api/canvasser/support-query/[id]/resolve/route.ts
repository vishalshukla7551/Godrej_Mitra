import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/canvasser/support-query/[id]/resolve
 * Mark a support query as resolved by the canvasser
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find Canvasser user by phone
    const canvasserUser = await prisma.canvasser.findUnique({
      where: { phone: authUser.profile.phone },
      select: { id: true }
    });

    if (!canvasserUser) {
      return NextResponse.json({ error: 'Canvasser user not found' }, { status: 404 });
    }

    const { id: queryId } = await params;

    // Find the query and verify ownership
    const query = await prisma.supportQuery.findFirst({
      where: {
        id: queryId,
        canvasserId: canvasserUser.id
      }
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.status === 'RESOLVED') {
      return NextResponse.json({ error: 'Query is already resolved' }, { status: 400 });
    }

    if (query.status === 'PENDING') {
      return NextResponse.json({ error: 'Query cannot be resolved until admin responds' }, { status: 400 });
    }

    // Update query status to resolved
    const updatedQuery = await prisma.supportQuery.update({
      where: { id: queryId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' }
        },
        canvasserUser: {
          select: { fullName: true, phone: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedQuery
    });
  } catch (error) {
    console.error('Error resolving support query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}