import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/admin/store-change-requests
// Get all store change requests for admin review
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get Canvasser users store change requests
    const canvasserUsers = await prisma.canvasser.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        kycInfo: true
      }
    });

    let allRequests: any[] = [];
    
    // Process Canvasser requests
    for (const canvasser of canvasserUsers) {
      const kycInfo = canvasser.kycInfo as any;
      const request = kycInfo?.storeChangeRequest;
      
      if (request) {
        if (status === 'ALL' || request.status === status) {
          allRequests.push({
            ...request,
            userId: canvasser.id,
            userRole: 'CANVASSER',
            profile: {
              id: canvasser.id,
              fullName: canvasser.fullName,
              phone: canvasser.phone
            }
          });
        }
      }
    }

    // Sort by creation date (newest first)
    allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const totalCount = allRequests.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedRequests = allRequests.slice(startIndex, startIndex + pageSize);

    // Get store details
    const allStoreIds = new Set<string>();
    paginatedRequests.forEach((request: any) => {
      request.currentStoreIds?.forEach((id: string) => allStoreIds.add(id));
      request.requestedStoreIds?.forEach((id: string) => allStoreIds.add(id));
    });

    let stores: any[] = [];
    if (allStoreIds.size > 0) {
      stores = await prisma.store.findMany({
        where: {
          id: {
            in: Array.from(allStoreIds)
          }
        },
        select: {
          id: true,
          name: true,
          city: true,
        }
      });
    }

    const storeMap = new Map(stores.map(store => [store.id, store]));

    const enrichedRequests = paginatedRequests.map((request: any) => ({
      ...request,
      currentStores: request.currentStoreIds?.map((id: string) => storeMap.get(id)).filter(Boolean) || [],
      requestedStores: request.requestedStoreIds?.map((id: string) => storeMap.get(id)).filter(Boolean) || []
    }));

    return NextResponse.json({
      success: true,
      data: {
        requests: enrichedRequests,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/store-change-requests', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST /api/admin/store-change-requests
// Approve or reject a store change request
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action, reviewNotes } = body;

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Request ID and valid action (approve/reject) are required' },
        { status: 400 }
      );
    }

    // Get Canvasser users
    const canvasserUsers = await prisma.canvasser.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        kycInfo: true
      }
    });

    // Find the canvasser with matching request ID
    const canvassers = canvasserUsers.filter((canvasser: any) => {
      const kycInfo = canvasser.kycInfo as any;
      return kycInfo?.storeChangeRequest?.id === requestId;
    });

    if (canvassers.length === 0) {
      return NextResponse.json({ error: 'Store change request not found' }, { status: 404 });
    }

    const user = canvassers[0];
    const kycInfo = user.kycInfo as any;
    const request = kycInfo?.storeChangeRequest;

    if (!request || request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been reviewed or does not exist' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update the request status
    const updatedRequest = {
      ...request,
      status: newStatus,
      reviewedBy: authUser.username,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || null
    };

    // Update Canvasser user's kycInfo
    const updatedKycInfo = {
      ...(user.kycInfo as any || {}),
      storeChangeRequest: updatedRequest
    };

    await prisma.canvasser.update({
      where: { id: user.id },
      data: {
        kycInfo: updatedKycInfo
      }
    });

    // If approved, update Canvasser's store mapping
    if (action === 'approve') {
      await prisma.canvasser.update({
        where: { id: user.id },
        data: {
          storeId: request.requestedStoreIds[0] || null
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Store change request ${action}d successfully`,
      data: {
        requestId,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/store-change-requests', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
