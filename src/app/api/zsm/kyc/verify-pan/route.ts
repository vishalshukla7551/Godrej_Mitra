import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// POST /api/zsm/kyc/verify-pan
// Verifies PAN using Karza API and updates ZSM user's name
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('ZSM' as Role)) {
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

    // Find the ZSM user
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zsmProfile: true
      }
    });

    if (!user || !user.zsmProfile) {
      return NextResponse.json(
        { error: 'ZSM profile not found' },
        { status: 404 }
      );
    }

    try {
      // Log the request details for debugging
      console.log('Making Karza API request for ZSM:', {
        url: process.env.KARZA_API_URL || 'https://api.karza.in/v3/pan-profile',
        pan: pan,
        hasApiKey: !!(process.env.KARZA_API_KEY || 'AujA2Y0w0N4HdUw'),
        mockMode: process.env.KARZA_MOCK_MODE === 'true'
      });

      // Check if we're in mock mode for development/testing
      if (process.env.KARZA_MOCK_MODE === 'true') {
        console.log('Using mock Karza API response for ZSM development');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful response
        const mockResponse = {
          requestId: "mock-request-id-" + Date.now(),
          result: {
            pan: pan,
            name: "MOCK ZSM USER NAME",
            firstName: "MOCK",
            middleName: "ZSM",
            lastName: "USER",
            gender: "male",
            dob: "1990-01-01",
            address: {
              buildingName: "",
              locality: "",
              streetName: "",
              pinCode: "",
              city: "",
              state: "",
              country: ""
            },
            aadhaarLinked: true,
            profileMatch: [],
            aadhaarMatch: null
          },
          statusCode: 101
        };
        
        const panData = mockResponse;
        console.log('Mock Karza API response for ZSM:', panData);
        
        // Continue with the rest of the logic using mock data
        const fullName = panData.result.name;
        const cleanedFullName = fullName.trim().replace(/\s+/g, ' ');
        const kycInfo = {
          ...panData.result,
          verifiedAt: new Date().toISOString(),
          requestId: panData.requestId,
          statusCode: panData.statusCode,
          rawPanData: panData, // store full mock PAN JSON as well
        };

        // Update ZSM user's name and store KYC info in User metadata
        const updatedMetadata = {
          ...(user.metadata as any || {}),
          kycInfo: kycInfo,
          panVerified: true,
          panVerifiedAt: new Date().toISOString()
        };

        // Update ZSM profile name and User metadata
        await prisma.zSM.update({
          where: { id: user.zsmProfile.id },
          data: {
            fullName: cleanedFullName
          }
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            metadata: updatedMetadata
          }
        });

        return NextResponse.json({
          success: true,
          message: 'PAN verified and KYC information saved successfully (MOCK MODE)',
          panVerified: true,
          fullName: cleanedFullName,
          kycInfo: kycInfo,
          zsmUser: {
            id: user.zsmProfile.id,
            phone: user.zsmProfile.phone,
            fullName: cleanedFullName,
          },
          mockMode: true
        });
      }

      // Call Karza PAN API
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

      console.log('Karza API response status for ZSM:', karzaResponse.status);

      if (!karzaResponse.ok) {
        const errorData = await karzaResponse.json().catch(() => null);
        console.error('Karza API error response for ZSM:', errorData);
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
      console.log('Karza API success response for ZSM:', panData);

      // Check if the API response is successful
      if (!panData.result) {
        console.error('No result in Karza API response for ZSM:', panData);
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
        verifiedAt: new Date().toISOString(),
        requestId: panData.requestId,
        statusCode: panData.statusCode,
        rawPanData: panData, // store full PAN JSON as well
      };

      // Update ZSM user's name and store KYC info in User metadata
      const updatedMetadata = {
        ...(user.metadata as any || {}),
        kycInfo: kycInfo,
        panVerified: true,
        panVerifiedAt: new Date().toISOString()
      };

      // Update ZSM profile name and User metadata
      await prisma.zSM.update({
        where: { id: user.zsmProfile.id },
        data: {
          fullName: cleanedFullName
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          metadata: updatedMetadata
        }
      });

      return NextResponse.json({
        success: true,
        message: 'PAN verified and KYC information saved successfully',
        panVerified: true,
        fullName: cleanedFullName,
        kycInfo: kycInfo,
        zsmUser: {
          id: user.zsmProfile.id,
          phone: user.zsmProfile.phone,
          fullName: cleanedFullName,
        },
      });
    } catch (apiError) {
      console.error('Karza API Error for ZSM:', apiError);
      
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
    console.error('Error in POST /api/zsm/kyc/verify-pan', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}