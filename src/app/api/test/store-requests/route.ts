import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/test/store-requests
// Test endpoint to check store change requests
export async function GET(req: NextRequest) {
  try {
    // Find all ASE users and their metadata
    const users = await (prisma as any).user.findMany({
      where: {
        role: 'ASE'
      },
      select: {
        id: true,
        username: true,
        metadata: true
      }
    });

    const usersWithRequests = users.filter((user: any) => {
      const metadata = user.metadata as any;
      return metadata?.storeChangeRequest;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalASEUsers: users.length,
        usersWithRequests: usersWithRequests.length,
        requests: usersWithRequests.map((user: any) => ({
          userId: user.id,
          username: user.username,
          request: user.metadata?.storeChangeRequest
        }))
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/test/store-requests
// Create a test store change request
export async function POST(req: NextRequest) {
  try {
    // Find the first ASE user
    const aseUser = await (prisma as any).user.findFirst({
      where: {
        role: 'ASE'
      },
      include: {
        aseProfile: true
      }
    });

    if (!aseUser) {
      return NextResponse.json({ error: 'No ASE user found' }, { status: 404 });
    }

    // Create a test store change request
    const testRequest = {
      id: `test_req_${Date.now()}`,
      requestedStoreIds: ['store1', 'store2'],
      currentStoreIds: aseUser.aseProfile?.storeIds || [],
      reason: 'Test store change request',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      aseId: aseUser.aseProfile?.id,
      aseName: aseUser.aseProfile?.fullName || 'Test User'
    };

    // Update user metadata
    const updatedMetadata = {
      ...(aseUser.metadata as any || {}),
      storeChangeRequest: testRequest
    };

    await prisma.user.update({
      where: { id: aseUser.id },
      data: {
        metadata: updatedMetadata
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test store change request created',
      data: {
        userId: aseUser.id,
        request: testRequest
      }
    });
  } catch (error) {
    console.error('Error creating test request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}