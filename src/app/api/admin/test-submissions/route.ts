import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQuestionsForPhone } from '@/lib/testData';

/**
 * GET /api/admin/test-submissions
 * Fetch all test submissions with enriched question/answer data
 * Query params:
 *   - secId: Optional filter by SEC ID
 *   - status: Optional filter by pass/fail (pass|fail)
 *   - limit: Optional limit results (default: 100)
 *   - offset: Optional offset for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const secId = searchParams.get('secId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query filters
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (secId) {
            where.OR = [
                { secId: secId },
                { phone: secId }
            ];
        }

        if (status === 'pass') {
            where.score = { gte: 60 };
        } else if (status === 'fail') {
            where.score = { lt: 60 };
        }

        // Fetch submissions from database
        const submissions = await prisma.testSubmission.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        // Fetch store information for each submission
        const submissionsWithStoreInfo = await Promise.all(
            submissions.map(async (submission) => {
                let storeName = submission.storeName;
                let storeCity = '';

                // If storeId exists but storeName is missing, fetch it
                if (submission.storeId && !storeName) {
                    try {
                        const store = await prisma.store.findUnique({
                            where: { id: submission.storeId },
                            select: { name: true, city: true },
                        });
                        if (store) {
                            storeName = store.name;
                            storeCity = store.city || '';
                        }
                    } catch (error) {
                        console.error('Error fetching store:', error);
                    }
                }

                // Enrich responses with question data
                const phone = submission.phone || submission.secId || '';
                const questionsForPhone = phone ? getQuestionsForPhone(phone) : [];

                const enrichedResponses = Array.isArray(submission.responses)
                    ? (submission.responses as any[]).map((response: any) => {
                        const question = questionsForPhone.find(
                            (q) => q.id === response.questionId
                        );

                        return {
                            ...response,
                            questionText: question?.question || '',
                            options: question?.options || [],
                            correctAnswer: question?.correctAnswer || '',
                            isCorrect: question
                                ? response.selectedAnswer === question.correctAnswer
                                : false,
                        };
                    })
                    : [];

                return {
                    id: submission.id,
                    secId: submission.secId || '',
                    phone: submission.phone || submission.secId || '',
                    sessionToken: submission.sessionToken || '',
                    testName: submission.testName || 'Samsung Protect Max Certification',
                    responses: enrichedResponses,
                    score: submission.score,
                    totalQuestions: submission.totalQuestions,
                    completionTime: submission.completionTime,
                    submittedAt: submission.createdAt.toISOString(),
                    isProctoringFlagged: submission.isProctoringFlagged,
                    storeId: submission.storeId || '',
                    storeName: storeName || '',
                    storeCity: storeCity,
                    screenshotUrls: [], // Placeholder - implement screenshot storage separately
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: submissionsWithStoreInfo,
            meta: {
                total: submissionsWithStoreInfo.length,
                limit,
                offset,
            },
        });
    } catch (error) {
        console.error('Error fetching test submissions:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch test submissions',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
