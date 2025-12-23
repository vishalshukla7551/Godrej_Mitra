import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/test-submissions/statistics
 * Get aggregated statistics for all test submissions
 * Returns:
 *   - total submissions
 *   - average score
 *   - pass rate
 *   - average completion time
 */
export async function GET(request: NextRequest) {
    try {
        // Fetch all submissions
        const submissions = await prisma.testSubmission.findMany({
            select: {
                score: true,
                completionTime: true,
            },
        });

        if (submissions.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    totalSubmissions: 0,
                    averageScore: 0,
                    passRate: 0,
                    averageTime: 0,
                },
            });
        }

        // Calculate statistics
        const totalSubmissions = submissions.length;
        const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
        const averageScore = Math.round(totalScore / totalSubmissions);

        const passedCount = submissions.filter((sub) => sub.score >= 60).length;
        const passRate = Math.round((passedCount / totalSubmissions) * 100);

        const totalTime = submissions.reduce((sum, sub) => sum + sub.completionTime, 0);
        const averageTime = Math.round(totalTime / totalSubmissions);

        return NextResponse.json({
            success: true,
            data: {
                totalSubmissions,
                averageScore,
                passRate,
                averageTime,
            },
        });
    } catch (error) {
        console.error('Error fetching test statistics:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch test statistics',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
