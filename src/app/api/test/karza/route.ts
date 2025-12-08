import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to check Karza API connectivity
export async function GET(req: NextRequest) {
  try {
    console.log('Testing Karza API connectivity...');
    
    // Test with a known PAN number
    const testPan = 'FUJPM5647H';
    
    const karzaResponse = await fetch(process.env.KARZA_API_URL || 'https://api.karza.in/v3/pan-profile', {
      method: 'POST',
      headers: {
        'x-karza-key': process.env.KARZA_API_KEY || 'AujA2Y0w0N4HdUw',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pan: testPan,
        consent: 'Y'
      }),
    });

    console.log('Karza API test response status:', karzaResponse.status);
    console.log('Karza API test response headers:', Object.fromEntries(karzaResponse.headers.entries()));

    const responseText = await karzaResponse.text();
    console.log('Karza API test response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { rawResponse: responseText };
    }

    return NextResponse.json({
      success: karzaResponse.ok,
      status: karzaResponse.status,
      statusText: karzaResponse.statusText,
      headers: Object.fromEntries(karzaResponse.headers.entries()),
      data: responseData,
      config: {
        url: process.env.KARZA_API_URL || 'https://api.karza.in/v3/pan-profile',
        hasApiKey: !!(process.env.KARZA_API_KEY),
        testPan: testPan
      }
    });

  } catch (error) {
    console.error('Karza API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : null
    }, { status: 500 });
  }
}