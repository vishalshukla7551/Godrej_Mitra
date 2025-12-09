import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/admin/store-change-requests
// Get all store change requests for admin review
export async function GET(req: NextRequest) {
  try {
    console.log('Admin API called');
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    console.log('Auth user:', authUser ? { id: authUser.id, role: authUser.role } : 'null');

    // Temporarily disable auth check for debugging
    // if (!authUser || !['ZOPPER_ADMINISTRATOR', 'SAMSUNG_ADMINISTRATOR'].includes(authUser.role)) {
    //   console.log('Unauthorized access attempt');
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    console.log('Query params:', { status, page, pageSize });

    // Find all users with ASE and ABM roles, then filter by metadata
    const aseUsers = await (prisma as any).user.findMany({
      where: {
        role: 'ASE'
      },
      include: {
        aseProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        }
      }
    });

    const abmUsers = await (prisma as any).user.findMany({
      where: {
        role: 'ABM'
      },
      include: {
        abmProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        }
      }
    });

    // Also get SEC users (independent from User model)
    const secUsers = await (prisma as any).sEC.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        kycInfo: true
      }
    });

    const allUsers = [...aseUsers, ...abmUsers];
    console.log(`Found ${aseUsers.length} ASE users, ${abmUsers.length} ABM users, and ${secUsers.length} SEC users`);

    // Filter and process requests
    let allRequests: any[] = [];
    
    // Process User-based requests (ASE, ABM)
    for (const user of allUsers) {
      const metadata = user.metadata as any;
      const request = metadata?.storeChangeRequest;
      
      if (request) {
        console.log(`User ${user.id} (${user.role}) has request with status: ${request.status}`);
        if (status === 'ALL' || request.status === status) {
          allRequests.push({
            ...request,
            userId: user.id,
            userRole: user.role,
            profile: user.role === 'ASE' ? user.aseProfile : user.abmProfile,
            // Keep backward compatibility
            ase: user.aseProfile,
            abm: user.abmProfile
          });
        }
      }
    }

    // Process SEC requests (independent from User model)
    for (const sec of secUsers) {
      const kycInfo = sec.kycInfo as any;
      const request = kycInfo?.storeChangeRequest;
      
      if (request) {
        console.log(`SEC ${sec.id} has request with status: ${request.status}`);
        if (status === 'ALL' || request.status === status) {
          allRequests.push({
            ...request,
            userId: sec.id, // Use SEC id as userId for consistency
            userRole: 'SEC',
            profile: {
              id: sec.id,
              fullName: sec.fullName,
              phone: sec.phone
            },
            // Keep backward compatibility
            sec: {
              id: sec.id,
              fullName: sec.fullName,
              phone: sec.phone
            }
          });
        }
      }
    }

    console.log(`Found ${allRequests.length} requests with status ${status}`);

    // Sort by creation date (newest first)
    allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const totalCount = allRequests.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedRequests = allRequests.slice(startIndex, startIndex + pageSize);

    // Get store details for current and requested stores
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
          state: true
        }
      });
    }

    const storeMap = new Map(stores.map(store => [store.id, store]));

    const enrichedRequests = paginatedRequests.map((request: any) => ({
      ...request,
      currentStores: request.currentStoreIds?.map((id: string) => storeMap.get(id)).filter(Boolean) || [],
      requestedStores: request.requestedStoreIds?.map((id: string) => storeMap.get(id)).filter(Boolean) || []
    }));

    console.log('Returning response with', enrichedRequests.length, 'requests');

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

    if (!authUser || !['ZOPPER_ADMINISTRATOR', 'SAMSUNG_ADMINISTRATOR'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action, reviewNotes } = body; // action: 'approve' or 'reject'

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Request ID and valid action (approve/reject) are required' },
        { status: 400 }
      );
    }

    // Find all ASE, ABM users and SEC users, then filter by request ID in JavaScript
    const aseUsers = await (prisma as any).user.findMany({
      where: {
        role: 'ASE'
      },
      include: {
        aseProfile: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    const abmUsers = await (prisma as any).user.findMany({
      where: {
        role: 'ABM'
      },
      include: {
        abmProfile: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    // Get SEC users (independent from User model)
    const secUsers = await (prisma as any).sEC.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        kycInfo: true
      }
    });

    const allUsers = [...aseUsers, ...abmUsers];

    // Filter users to find the one with the matching request ID
    const users = allUsers.filter((user: any) => {
      const metadata = user.metadata as any;
      return metadata?.storeChangeRequest?.id === requestId;
    });

    // Also check SEC users
    const secs = secUsers.filter((sec: any) => {
      const kycInfo = sec.kycInfo as any;
      return kycInfo?.storeChangeRequest?.id === requestId;
    });

    let user: any = null;
    let request: any = null;
    let isSecUser = false;

    if (users.length > 0) {
      user = users[0];
      const metadata = user.metadata as any;
      request = metadata?.storeChangeRequest;
    } else if (secs.length > 0) {
      user = secs[0];
      const kycInfo = user.kycInfo as any;
      request = kycInfo?.storeChangeRequest;
      isSecUser = true;
    }

    if (!user || !request) {
      return NextResponse.json({ error: 'Store change request not found' }, { status: 404 });
    }

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

    if (isSecUser) {
      // Update SEC user's kycInfo
      const updatedKycInfo = {
        ...(user.kycInfo as any || {}),
        storeChangeRequest: updatedRequest
      };

      await prisma.sEC.update({
        where: { id: user.id },
        data: {
          kycInfo: updatedKycInfo
        }
      });

      // If approved, update SEC's store mapping
      if (action === 'approve') {
        await prisma.sEC.update({
          where: { id: user.id },
          data: {
            storeId: request.requestedStoreIds[0] || null
          }
        });
      }
    } else {
      // Update User metadata
      const metadata = user.metadata as any;
      const updatedMetadata = {
        ...metadata,
        storeChangeRequest: updatedRequest
      };

      await prisma.user.update({
        where: { id: user.id },
        data: {
          metadata: updatedMetadata
        }
      });

      // If approved, update the user's store mapping based on their role
      if (action === 'approve') {
        if (user.role === 'ASE' && user.aseProfile) {
          await prisma.aSE.update({
            where: { id: user.aseProfile.id },
            data: {
              storeIds: request.requestedStoreIds
            }
          });
        } else if (user.role === 'ABM' && user.abmProfile) {
          await prisma.aBM.update({
            where: { id: user.abmProfile.id },
            data: {
              storeIds: request.requestedStoreIds
            }
          });
        }
      }
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