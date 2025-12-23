import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQuestionsForPhone, SEC_CERT_QUESTIONS } from '@/lib/testData';

/**
 * GET /api/admin/test-submissions/[id]
 * Fetch a specific test submission with full answer details
 * Shows which questions were answered correctly/incorrectly
 */
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        // Fetch submission from database
        const submission = await prisma.testSubmission.findUnique({
            where: { id },
        });

        if (!submission) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test submission not found',
                },
                { status: 404 }
            );
        }

        // Fetch store information if available
        let storeName = submission.storeName;
        let storeCity = '';

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

        // Get available questions from all sources
        const phone = submission.phone || submission.secId || '';
        const standardQuestions = phone ? getQuestionsForPhone(phone) : [];
        const allPossibleQuestions = [...standardQuestions, ...SEC_CERT_QUESTIONS];

        // Enrich responses with question details
        const rawResponses = submission.responses as any;
        let enrichedResponses: any[] = [];

        if (Array.isArray(rawResponses)) {
            enrichedResponses = rawResponses.map((response: any, index: number) => {
                const question = allPossibleQuestions.find(
                    (q) => String(q.id) === String(response.questionId)
                );

                const selectedAnswer = response.selectedAnswer || '';

                return {
                    questionNumber: index + 1,
                    questionId: response.questionId,
                    questionText: question?.question || 'Question not found',
                    options: question?.options || [],
                    selectedAnswer: selectedAnswer,
                    correctAnswer: question?.correctAnswer || '',
                    isCorrect: question ? selectedAnswer === question.correctAnswer : false,
                    category: question?.category || 'Unknown',
                };
            });
        }

        // Calculate correct and wrong counts
        const correctCount = enrichedResponses.filter((r) => r.isCorrect).length;
        const wrongCount = enrichedResponses.filter((r) => !r.isCorrect).length;

        const result = {
            id: submission.id,
            secId: submission.secId || '',
            phone: submission.phone || submission.secId || '',
            sessionToken: submission.sessionToken || '',
            testName: submission.testName || 'Samsung Protect Max Certification',
            score: submission.score,
            totalQuestions: submission.totalQuestions,
            completionTime: submission.completionTime,
            submittedAt: submission.createdAt.toISOString(),
            isProctoringFlagged: submission.isProctoringFlagged,
            storeId: submission.storeId || '',
            storeName: storeName || 'Unknown Store',
            storeCity: storeCity,
            status: submission.score >= 60 ? 'PASS' : 'FAIL',
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            responses: enrichedResponses,
        };

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching test submission:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch test submission',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
