import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Get a canvasser user for testing
    let canvasser = await prisma.canvasser.findFirst();

    if (!canvasser) {
      // Create a test canvasser if none exists
      canvasser = await prisma.canvasser.create({
        data: {
          phone: '9999999999',
          fullName: 'Test Canvasser',
          employeeId: 'TEST001'
        }
      });
    }

    // Get some stores for the test request
    const stores = await prisma.store.findMany({
      take: 2
    });

    if (stores.length === 0) {
      return NextResponse.json({ error: 'No stores available for test' }, { status: 400 });
    }

    // Create a test store change request
    const testRequest = {
      id: `test_req_${Date.now()}`,
      requestedStoreIds: stores.map(s => s.id),
      currentStoreIds: canvasser.storeId ? [canvasser.storeId] : [],
      reason: 'Test store change request for debugging',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      canvasserId: canvasser.id,
      canvasserName: canvasser.fullName || 'Test User'
    };

    // Update canvasser's kycInfo with the test request
    const updatedKycInfo = {
      ...(canvasser.kycInfo as any || {}),
      storeChangeRequest: testRequest
    };

    await prisma.canvasser.update({
      where: { id: canvasser.id },
      data: {
        kycInfo: updatedKycInfo
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test store change request created',
      data: testRequest
    });
  } catch (error) {
    console.error('Error in POST /api/test/create-request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
