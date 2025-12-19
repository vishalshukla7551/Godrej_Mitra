import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, testId, testName, answers, score, totalQuestions, passed, completionTime } = body;

    // Get authenticated SEC user
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('SEC' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find SEC details
    const sec = await prisma.sEC.findUnique({
      where: { phone: authUser.id },
      select: {
        id: true,
        phone: true,
        employeeId: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!sec) {
      return NextResponse.json({ error: 'SEC profile not found' }, { status: 404 });
    }

    // Create enhanced session token with test name for better identification
    const enhancedSessionToken = `${testName?.toLowerCase().replace(/\s+/g, '_') || 'test'}_${sessionToken || Date.now()}`;

    // Save test submission to database
    const testSubmission = await prisma.testSubmission.create({
      data: {
        secId: sec.employeeId || sec.id,
        phone: sec.phone,
        sessionToken: enhancedSessionToken,
        testName: testName || 'SEC Knowledge Assessment',
        responses: answers || {},
        score: score || 0,
        totalQuestions: totalQuestions || 0,
        completionTime: completionTime || 0,
        isProctoringFlagged: false,
        storeId: sec.storeId,
        storeName: sec.store?.name,
      },
    });

    console.log('Test submission saved:', {
      id: testSubmission.id,
      phone: sec.phone,
      score: score,
      testName: testName,
      passed: passed
    });

    return NextResponse.json({ 
      success: true, 
      passed,
      submissionId: testSubmission.id,
      certificateEligible: score >= 70 // Assuming 70% is passing
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit test' }, { status: 500 });
  }
}