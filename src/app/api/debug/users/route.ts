import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get count of users by role
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    // Get ASE users specifically
    const aseUsers = await (prisma as any).user.findMany({
      where: {
        role: 'ASE'
      },
      select: {
        id: true,
        username: true,
        metadata: true
      },
      take: 5 // Just first 5 for debugging
    });

    return NextResponse.json({
      success: true,
      data: {
        userCounts,
        aseUsers,
        aseUsersWithRequests: aseUsers.filter((user: any) => user.metadata?.storeChangeRequest)
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}