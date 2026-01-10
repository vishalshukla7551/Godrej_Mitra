import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/canvasser/store-change-request
// Get pending store change request for the authenticated Canvasser
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('CANVASSER' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find Canvasser by phone (for Canvasser users, authUser.id is the phone number)
    const canvasser = await prisma.canvasser.findUnique({
      where: { phone: authUser.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        kycInfo: true // We'll use this to store store change requests temporarily
      }
    });

    if (!canvasser) {
      return NextResponse.json({ error: 'Canvasser not found' }, { status: 404 });
    }

    // Check if there's a pending store change request in kycInfo
    const kycInfo = canvasser.kycInfo as any;
    const pendingRequest = kycInfo?.storeChangeRequest || null;

    return NextResponse.json({
      success: true,
      data: {
        pendingRequest
      }
    });
  } catch (error) {
    console.error('Error in GET /api/canvasser/store-change-request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/canvasser/store-change-request
// Create a new store change request
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('CANVASSER' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestedStoreIds, reason } = body;

    if (!requestedStoreIds || !Array.isArray(requestedStoreIds) || requestedStoreIds.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one store must be selected for Canvasser' },
        { status: 400 }
      );
    }

    const canvasser = await prisma.canvasser.findUnique({
      where: { phone: authUser.id },
      select: {
        id: true,
        storeId: true,
        fullName: true,
        kycInfo: true
      }
    });

    if (!canvasser) {
      return NextResponse.json({ error: 'Canvasser profile not found' }, { status: 404 });
    }

    // Check if there's already a pending request
    const kycInfo = canvasser.kycInfo as any;
    if (kycInfo?.storeChangeRequest?.status === 'PENDING') {
      return NextResponse.json(
        { error: 'You already have a pending store change request' },
        { status: 400 }
      );
    }

    // Verify that the requested store exists
    const store = await prisma.store.findUnique({
      where: { id: requestedStoreIds[0] },
      select: {
        id: true,
        name: true
      }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Selected store does not exist' },
        { status: 400 }
      );
    }

    // Create the store change request
    const storeChangeRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      requestedStoreIds,
      currentStoreIds: canvasser.storeId ? [canvasser.storeId] : [],
      reason: reason || null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      canvasserId: canvasser.id,
      canvasserName: canvasser.fullName || 'Unknown',
      userType: 'CANVASSER' // Identify this as a Canvasser request
    };

    // Update Canvasser's kycInfo with the store change request
    const updatedKycInfo = {
      ...(kycInfo || {}),
      storeChangeRequest
    };

    await prisma.canvasser.update({
      where: { phone: authUser.id },
      data: {
        kycInfo: updatedKycInfo
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
    console.error('Error in POST /api/canvasser/store-change-request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}