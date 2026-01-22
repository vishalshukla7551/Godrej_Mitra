import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zopper-administrator/support-queries/[id]
 * Get a specific support query with full details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();
    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: queryId } = await params;

    const query = await prisma.supportQuery.findUnique({
      where: { id: queryId },
      include: {
        canvasserUser: {
          select: { 
            fullName: true, 
            phone: true, 
            employeeId: true,
            store: {
              select: { name: true, city: true }
            }
          }
        },
        messages: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Return query with canvasserUser field (no backward compatibility needed)
    return NextResponse.json({
      success: true,
      data: query
    });
  } catch (error) {
    console.error('Error fetching support query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}