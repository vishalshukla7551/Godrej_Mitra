import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// POST /api/sec/kyc/verify-pan
// Verifies PAN using Karza API and updates SEC user's name
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'CANVASSER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pan } = body;

    if (!pan || typeof pan !== 'string') {
      return NextResponse.json(
        { error: 'PAN number is required' },
        { status: 400 }
      );
    }

    // Validate PAN format (10 characters: 5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      return NextResponse.json(
        { error: 'Invalid PAN format' },
        { status: 400 }
      );
    }

    const phone = authUser.username;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 }
      );
    }

    // Check if PAN is already verified by another SEC user
    try {
      console.log(`Checking for duplicate PAN: ${pan}, Current phone: ${phone}`);
      
      // Find all Canvasser users with KYC info
      const allCanvassersWithKyc = await prisma.canvasser.findMany({
        where: {
          phone: {
            not: phone // Exclude current user
          },
          kycInfo: {
            not: null
          }
        },
        select: {
          phone: true,
          fullName: true,
          kycInfo: true
        }
      });

      // Check if any user has the same PAN in their kycInfo
      const duplicateUser = allSecsWithKyc.find((sec: any) => {
        if (sec.kycInfo && typeof sec.kycInfo === 'object') {
          const kycData = sec.kycInfo as any;
          return kycData.pan === pan;
        }
        return false;
      });

      if (duplicateUser) {
        console.log('Duplicate PAN found for user:', duplicateUser.phone);
        return NextResponse.json(
          { 
            success: false,
            error: 'This PAN is already verified and in use by another user. Please contact support if you believe this is an error.',
            code: 'DUPLICATE_PAN'
          },
          { status: 409 }
        );
      }
      
      console.log('No duplicate PAN found - proceeding with verification');
    } catch (checkError) {
      console.error('PAN duplicate check error:', checkError);
      // If the duplicate check fails, we should NOT continue - it's a critical security check
      return NextResponse.json(
        { 
          success: false,
          error: 'Unable to verify PAN uniqueness. Please try again later.',
          code: 'CHECK_FAILED'
        },
        { status: 500 }
      );
    }

    try {
      // Log the request details for debugging
      console.log('PAN verification request:', { pan, phone });

      // Call Karza API for PAN verification
      const karzaResponse = await fetch(process.env.KARZA_API_URL || 'https://api.karza.in/v3/pan-profile', {
        method: 'POST',
        headers: {
          'x-karza-key': process.env.KARZA_API_KEY || 'AujA2Y0w0N4HdUw',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pan: pan,
          consent: 'Y'
        }),
      });

      console.log('Karza API response status:', karzaResponse.status);

      if (!karzaResponse.ok) {
        const errorData = await karzaResponse.json().catch(() => null);
        console.error('Karza API error response:', errorData);
        return NextResponse.json(
          { 
            error: 'PAN verification failed', 
            details: errorData,
            status: karzaResponse.status,
            statusText: karzaResponse.statusText
          },
          { status: 400 }
        );
      }

      const panData = await karzaResponse.json();
      console.log('Karza API success response:', panData);

      if (!panData.result) {
        console.error('No result in Karza API response:', panData);
        return NextResponse.json(
          { error: 'Invalid PAN verification response', response: panData },
          { status: 400 }
        );
      }

      // Extract name from PAN API response
      const fullName = panData.result.name;

      if (!fullName) {
        return NextResponse.json(
          { error: 'Could not extract name from PAN verification' },
          { status: 400 }
        );
      }

      // Clean up the name (remove extra spaces, proper case)
      const cleanedFullName = fullName.trim().replace(/\s+/g, ' ');

      // Prepare KYC info to save (complete result object)
      const kycInfo = {
        ...panData.result,
        // store verifiedAt as a Date object so Mongo stores a BSON Date (Prisma expects DateTime)
        verifiedAt: new Date(),
        requestId: panData.requestId,
        statusCode: panData.statusCode,
        rawPanData: panData, // store full PAN JSON as well
      };

      // Update SEC user's name and KYC info in database
      // Use MongoDB's updateOne with upsert to safely update/create
      await (prisma as any).$runCommandRaw({
        update: "SEC",
        updates: [
          {
            q: { phone: phone },
            u: {
              $set: {
                fullName: cleanedFullName,
                kycInfo: kycInfo,
                updatedAt: new Date()
              },
              $setOnInsert: {
                phone: phone,
                lastLoginAt: new Date(),
                createdAt: new Date()
              }
            },
            upsert: true
          }
        ]
      });

      // Ensure Prisma-visible `updatedAt` is a BSON Date (some older records may have string values)
      try {
        await prisma.canvasser.update({ where: { phone }, data: { updatedAt: new Date() } });
      } catch (e) {
        // ignore - best effort
        console.warn('Failed to normalize updatedAt for SEC record', e);
      }

      // Get the updated record
      const updatedCanvasser = await prisma.canvasser.findUnique({
        where: { phone },
        select: {
          id: true,
          phone: true,
          fullName: true,
        }
      });

      if (!updatedSec) {
        throw new Error('Failed to create or update SEC record');
      }

      return NextResponse.json({
        success: true,
        message: 'PAN verified and KYC information saved successfully',
        panVerified: true,
        fullName: updatedCanvasser.fullName,
        kycInfo: kycInfo,
        canvasserUser: {
          id: updatedCanvasser.id,
          phone: updatedCanvasser.phone,
          fullName: updatedCanvasser.fullName,
        },
      });
    } catch (apiError) {
      console.error('Karza API Error:', apiError);
      
      // Provide more detailed error information
      let errorMessage = 'PAN verification service unavailable';
      let errorDetails = null;
      
      if (apiError instanceof Error) {
        errorMessage = `PAN verification service error: ${apiError.message}`;
        errorDetails = {
          name: apiError.name,
          message: apiError.message,
          stack: process.env.NODE_ENV === 'development' ? apiError.stack : undefined
        };
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/sec/kyc/verify-pan', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}