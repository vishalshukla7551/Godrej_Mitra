import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/canvasser/support-query/[id]/reply
 * Add canvasser reply to a support query
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

    // Find SEC user by phone
    const secUser = await prisma.sEC.findUnique({
      where: { phone: authUser.profile.phone },
      select: { id: true, fullName: true, phone: true }
    });

    if (!secUser) {
      return NextResponse.json({ error: 'SEC user not found' }, { status: 404 });
    }

    const { id: queryId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Find the query and verify ownership
    const query = await prisma.supportQuery.findFirst({
      where: {
        id: queryId,
        secId: secUser.id
      }
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.status === 'RESOLVED') {
      return NextResponse.json({ error: 'Cannot reply to resolved query' }, { status: 400 });
    }

    if (query.status === 'PENDING') {
      return NextResponse.json({ error: 'Cannot reply until admin responds' }, { status: 400 });
    }

    // Create the reply message
    await prisma.supportQueryMessage.create({
      data: {
        queryId,
        message: message.trim(),
        isFromAdmin: false
      }
    });

    // Get updated query with all messages
    const updatedQuery = await prisma.supportQuery.findUnique({
      where: { id: queryId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' }
        },
        secUser: {
          select: { fullName: true, phone: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedQuery
    });
  } catch (error) {
    console.error('Error replying to support query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}