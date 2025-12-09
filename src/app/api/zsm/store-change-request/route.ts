import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);
    
    if (!authUser || authUser.role !== 'ZSM') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zsmProfile: true
      }
    });

    if (!user || !user.zsmProfile) {
      return NextResponse.json({ success: false, error: 'ZSM not found' }, { status: 404 });
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
    console.error('Error fetching store change request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);
    
    if (!authUser || authUser.role !== 'ZSM') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestedStoreIds, reason } = body;

    if (!requestedStoreIds || !Array.isArray(requestedStoreIds) || requestedStoreIds.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one store must be selected' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zsmProfile: true
      }
    });

    if (!user || !user.zsmProfile) {
      return NextResponse.json({ success: false, error: 'ZSM not found' }, { status: 404 });
    }

    // Check if there's already a pending request (only block if PENDING)
    const metadata = user.metadata as any;
    if (metadata?.storeChangeRequest?.status === 'PENDING') {
      return NextResponse.json(
        { error: 'You already have a pending store change request' },
        { status: 400 }
      );
    }

    const currentStoreIds = user.zsmProfile.storeIds || [];

    // Verify that all requested stores exist
    const requestedStores = await prisma.store.findMany({
      where: { id: { in: requestedStoreIds } },
      select: { id: true }
    });

    if (requestedStores.length !== requestedStoreIds.length) {
      return NextResponse.json({ success: false, error: 'Some requested stores do not exist' }, { status: 400 });
    }

    // Create the store change request
    const storeChangeRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      requestedStoreIds,
      currentStoreIds,
      reason: reason || null,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      reviewNotes: null
    };

    const updatedMetadata = {
      ...(metadata || {}),
      storeChangeRequest
    };

    await prisma.user.update({
      where: { id: authUser.id },
      data: { metadata: updatedMetadata }
    });

    return NextResponse.json({
      success: true,
      message: 'Store change request submitted successfully',
      data: {
        requestId: storeChangeRequest.id
      }
    });

  } catch (error) {
    console.error('Error creating store change request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}