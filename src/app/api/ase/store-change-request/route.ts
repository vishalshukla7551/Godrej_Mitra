import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/ase/store-change-request
// Get pending store change request for the authenticated ASE
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        metadata: true,
        aseProfile: {
          select: {
            fullName: true,
            phone: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there's a pending store change request in metadata
    const metadata = user.metadata as any;
    const pendingRequest = metadata?.storeChangeRequest || null;

    return NextResponse.json({
      success: true,
      data: {
        pendingRequest
      }
    });
  } catch (error) {
    console.error('Error in GET /api/ase/store-change-request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ase/store-change-request
// Create a new store change request
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestedStoreIds, reason } = body;

    if (!requestedStoreIds || !Array.isArray(requestedStoreIds) || requestedStoreIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one store must be selected' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        aseProfile: {
          select: {
            id: true,
            storeIds: true
          }
        }
      }
    });

    if (!user || !user.aseProfile) {
      return NextResponse.json({ error: 'ASE profile not found' }, { status: 404 });
    }

    // Check if there's already a pending request (only block if PENDING)
    const metadata = user.metadata as any;
    if (metadata?.storeChangeRequest?.status === 'PENDING') {
      return NextResponse.json(
        { error: 'You already have a pending store change request' },
        { status: 400 }
      );
    }

    // Verify that all requested stores exist
    const stores = await prisma.store.findMany({
      where: {
        id: {
          in: requestedStoreIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (stores.length !== requestedStoreIds.length) {
      return NextResponse.json(
        { error: 'One or more selected stores do not exist' },
        { status: 400 }
      );
    }

    // Create the store change request in user metadata
    const storeChangeRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestedStoreIds,
      currentStoreIds: user.aseProfile.storeIds || [],
      reason: reason || null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      aseId: user.aseProfile.id,
      aseName: (user.aseProfile as any)?.fullName || 'Unknown'
    };

    // Update user metadata with the new store change request
    // This will replace any existing request (approved/rejected)
    const updatedMetadata = {
      ...(metadata || {}),
      storeChangeRequest
    };

    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        metadata: updatedMetadata
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Store change request submitted successfully',
      data: {
        requestId: storeChangeRequest.id
      }
    });
  } catch (error) {
    console.error('Error in POST /api/ase/store-change-request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}