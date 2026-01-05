import { NextRequest, NextResponse } from 'next/server';
import { BenepikClient } from '@/lib/benepik/client';
import { RewardPayload } from '@/lib/benepik/types';
// import { getAuthenticatedUserFromCookies } from '@/lib/auth'; // Temporarily disabled for testing

/**
 * POST /api/rewards/send
 * Send rewards via Benepik API
 * 
 * Body can be either:
 * 1. Full RewardPayload object
 * 2. Simple format: { userName, mobileNumber, rewardAmount, options? }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication (TEMPORARILY DISABLED FOR TESTING)
    // const user = await getAuthenticatedUserFromCookies();
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Only allow admin roles to send rewards (TEMPORARILY DISABLED FOR TESTING)
    // if (!['ADMIN', 'ABM', 'ZSM'].includes(user.role)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    const body = await req.json();

    const client = new BenepikClient();
    let rewardPayload: RewardPayload;

    // Check if it's a simple format or full payload
    if (body.data && Array.isArray(body.data)) {
      // Full RewardPayload format
      rewardPayload = body as RewardPayload;
    } else if (body.userName && body.mobileNumber && body.rewardAmount) {
      // Simple format - convert to full payload
      rewardPayload = client.createSingleRewardPayload(
        body.userName,
        body.mobileNumber,
        body.rewardAmount,
        body.options
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format. Provide either full RewardPayload or { userName, mobileNumber, rewardAmount }'
        },
        { status: 400 }
      );
    }

    // Send reward
    const result = await client.sendReward(rewardPayload);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Reward sent successfully',
        data: result.data
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in POST /api/rewards/send:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
