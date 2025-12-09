import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Find or create an ASE user
    let aseUser = await (prisma as any).user.findFirst({
      where: {
        role: 'ASE'
      },
      include: {
        aseProfile: true
      }
    });

    if (!aseUser) {
      // Create a test ASE user if none exists
      const testUser = await prisma.user.create({
        data: {
          username: 'test_ase_user',
          password: 'test123',
          role: 'ASE',
          validation: 'APPROVED'
        }
      });

      const testASEProfile = await prisma.aSE.create({
        data: {
          userId: testUser.id,
          fullName: 'Test ASE User',
          phone: '1234567890',
          storeIds: [],
          zsmId: '507f1f77bcf86cd799439011' // dummy ObjectId
        }
      });

      aseUser = await (prisma as any).user.findUnique({
        where: { id: testUser.id },
        include: {
          aseProfile: true
        }
      });
    }

    if (!aseUser || !aseUser.aseProfile) {
      return NextResponse.json({ error: 'Could not create or find ASE user' }, { status: 500 });
    }

    // Get some stores for the test request
    const stores = await prisma.store.findMany({
      take: 2,
      select: {
        id: true,
        name: true
      }
    });

    if (stores.length === 0) {
      return NextResponse.json({ error: 'No stores found in database' }, { status: 500 });
    }

    // Create a test store change request
    const testRequest = {
      id: `test_req_${Date.now()}`,
      requestedStoreIds: stores.map(s => s.id),
      currentStoreIds: aseUser.aseProfile.storeIds || [],
      reason: 'Test store change request for debugging',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      aseId: aseUser.aseProfile.id,
      aseName: aseUser.aseProfile.fullName || 'Test User'
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
      message: 'Test store change request created successfully',
      data: {
        userId: aseUser.id,
        username: aseUser.username,
        request: testRequest,
        availableStores: stores
      }
    });
  } catch (error) {
    console.error('Error creating test request:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}