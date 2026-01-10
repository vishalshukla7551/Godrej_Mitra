import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/zopper-administrator/support-queries/[id]/respond
 * Add admin response to a support query
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();
    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: queryId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Find the query
    const query = await prisma.supportQuery.findUnique({
      where: { id: queryId },
      include: { messages: true }
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.status === 'RESOLVED') {
      return NextResponse.json({ error: 'Cannot respond to resolved query' }, { status: 400 });
    }

    // Get admin name from auth result
    const adminName = authUser.profile?.fullName || 'Admin';

    // Create the message
    await prisma.supportQueryMessage.create({
      data: {
        queryId,
        message: message.trim(),
        isFromAdmin: true,
        adminName
      }
    });

    // Update query status to IN_PROGRESS if it was PENDING
    const updateData: any = {};
    if (query.status === 'PENDING') {
      updateData.status = 'IN_PROGRESS';
    }

    const updatedQuery = await prisma.supportQuery.update({
      where: { id: queryId },
      data: updateData,
      include: {
        canvasserUser: {
          select: { 
            fullName: true, 
            phone: true, 
            employeeId: true,
            store: {
              select: {
                name: true,
                city: true
              }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });

    // Transform query for backward compatibility (canvasserUser -> secUser)
    const transformedQuery = {
      ...updatedQuery,
      secUser: updatedQuery.canvasserUser ? {
        fullName: updatedQuery.canvasserUser.fullName,
        phone: updatedQuery.canvasserUser.phone,
        employeeId: updatedQuery.canvasserUser.employeeId,
        store: updatedQuery.canvasserUser.store
      } : null,
      canvasserUser: undefined // Remove the original field
    };

    return NextResponse.json({
      success: true,
      data: transformedQuery
    });
  } catch (error) {
    console.error('Error responding to support query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}