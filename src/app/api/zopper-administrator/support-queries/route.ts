import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zopper-administrator/support-queries
 * Get all support queries for admin dashboard with filters
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();
    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { queryNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get queries
    const queries = await prisma.supportQuery.findMany({
      where,
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
      },
      orderBy: [
        { submittedAt: 'desc' }
      ]
    });

    // Get status counts
    const allQueries = await prisma.supportQuery.findMany({
      select: { status: true }
    });

    const statusCounts = {
      ALL: allQueries.length,
      PENDING: allQueries.filter(q => q.status === 'PENDING').length,
      IN_PROGRESS: allQueries.filter(q => q.status === 'IN_PROGRESS').length,
      RESOLVED: allQueries.filter(q => q.status === 'RESOLVED').length
    };

    // Transform queries for backward compatibility (canvasserUser -> secUser)
    const transformedQueries = queries.map(query => ({
      ...query,
      secUser: query.canvasserUser ? {
        fullName: query.canvasserUser.fullName,
        phone: query.canvasserUser.phone,
        employeeId: query.canvasserUser.employeeId,
        store: query.canvasserUser.store
      } : null,
      canvasserUser: undefined // Remove the original field
    }));

    return NextResponse.json({
      success: true,
      data: {
        queries: transformedQueries,
        statusCounts
      }
    });
  } catch (error) {
    console.error('Error fetching support queries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}