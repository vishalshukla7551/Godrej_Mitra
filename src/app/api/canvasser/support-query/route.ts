import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/canvasser/support-query
 * Get all support queries for the authenticated canvasser
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
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

    // Get all queries for this SEC user
    const queries = await prisma.supportQuery.findMany({
      where: { secId: secUser.id },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' }
        },
        secUser: {
          select: { fullName: true, phone: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        queries,
        canCreateNew: !queries.some((q: any) => q.status === 'PENDING' || q.status === 'IN_PROGRESS')
      }
    });
  } catch (error) {
    console.error('Error fetching support queries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/canvasser/support-query
 * Create a new support query
 */
export async function POST(req: NextRequest) {
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

    // Check if user has any pending or in-progress queries
    const existingQuery = await prisma.supportQuery.findFirst({
      where: {
        secId: secUser.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (existingQuery) {
      return NextResponse.json({
        error: 'You already have a pending or in-progress query. Please wait for it to be resolved before submitting a new one.',
        existingQueryNumber: existingQuery.queryNumber
      }, { status: 400 });
    }

    const body = await req.json();
    const { category, description } = body;

    // Validate input
    if (!category || !description) {
      return NextResponse.json({ error: 'Category and description are required' }, { status: 400 });
    }

    if (description.length > 2500) { // Roughly 500 words
      return NextResponse.json({ error: 'Description must be 500 words or less' }, { status: 400 });
    }

    // Generate next query number
    const lastQuery = await prisma.supportQuery.findFirst({
      orderBy: { queryNumber: 'desc' },
      select: { queryNumber: true }
    });

    let nextNumber = 1;
    if (lastQuery?.queryNumber) {
      const currentNumber = parseInt(lastQuery.queryNumber.replace('Q', ''));
      nextNumber = currentNumber + 1;
    }

    const queryNumber = `Q${nextNumber.toString().padStart(4, '0')}`;

    // Create the query
    const newQuery = await prisma.supportQuery.create({
      data: {
        queryNumber,
        secId: secUser.id,
        category,
        description,
        status: 'PENDING'
      },
      include: {
        messages: true,
        secUser: {
          select: { fullName: true, phone: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: newQuery
    });
  } catch (error) {
    console.error('Error creating support query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}