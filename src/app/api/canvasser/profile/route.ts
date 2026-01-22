import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/canvasser/profile
// Get ASA Canvasser profile and associated store
// ✅ NEW: Returns user data for frontend auth verification
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
        employeeId: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          }
        }
      }
    });

    if (!canvasser) {
      return NextResponse.json({ error: 'Canvasser profile not found' }, { status: 404 });
    }

    // ✅ NEW: Return user data in format expected by frontend auth
    // Note: id not included - not needed in localStorage
    const userData = {
      role: 'CANVASSER',
      phone: canvasser.phone,
      fullName: canvasser.fullName,
      employeeId: canvasser.employeeId,
      storeId: canvasser.storeId,
      store: canvasser.store,
      AgencyName: canvasser.AgencyName,
      AgentCode: canvasser.AgentCode,
    };

    return NextResponse.json({
      success: true,
      user: userData,
      // Keep old format for backward compatibility
      data: {
        canvasser: {
          id: canvasser.id,
          fullName: canvasser.fullName,
          phone: canvasser.phone,
          canvasserId: canvasser.employeeId
        },
        store: canvasser.store
      }
    });
  } catch (error) {
    console.error('Error in GET /api/canvasser/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}