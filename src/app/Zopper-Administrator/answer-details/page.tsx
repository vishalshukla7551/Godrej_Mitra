'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

/**
 * Admin Answer Review Page
 * Displays the detailed results of a specific Canvasser test submission.
 */
function AnswerReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // We prefer fetching by the unique database ID if available
    const submissionId = searchParams?.get('id');
    // Fallbacks for older links
    const secId = searchParams?.get('secId');
    const submittedAt = searchParams?.get('submittedAt');

    const [submission, setSubmission] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                let data = null;

                // 1. Try fetching by ID (most reliable)
                if (submissionId) {
                    const response = await fetch(`/api/admin/test-submissions/${submissionId}`);
                    const result = await response.json();
                    if (result.success) {
                        data = result.data;
                    }
                }
                // 2. Fallback to lookup by Canvasser ID and timestamp if no DB ID is provided
                else if (secId) {
                    const response = await fetch(`/api/admin/test-submissions?canvasserId=${encodeURIComponent(secId)}`);
                    const result = await response.json();
                    if (result.success && Array.isArray(result.data)) {
                        // Find the specific submission by time if provided, else get the latest
                        data = submittedAt
                            ? result.data.find((s: any) => s.submittedAt === submittedAt)
                            : result.data[0];
                    }
                }

                if (data) {
                    setSubmission(data);
                } else {
                    setError('Submission not found. Please try again from the Results list.');
                }
            } catch (err) {
                console.error('Error fetching submission:', err);
                setError('Failed to load review data.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [submissionId, secId, submittedAt]);

    if (loading) return (
        <div className="h-screen bg-gray-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Fetching secure results...</p>
        </div>
    );

    if (error || !submission) return (
        <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Review Unavailable</h2>
                <p className="text-gray-500 mb-8">{error || 'The requested test result could not be found.'}</p>
                <button
                    onClick={() => router.push('/Zopper-Administrator/test-results')}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 uppercase tracking-widest text-xs hover:bg-blue-700 transition-all"
                >
                    Back to All Results
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <main className="flex-1 pb-24">
                <div className="max-w-3xl mx-auto px-4 py-10">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-blue-600 mb-8 font-black text-sm hover:gap-3 transition-all uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to List
                    </button>

                    {/* Summary Header Section */}
                    <div className="bg-white rounded-[2rem] shadow-sm p-8 sm:p-10 mb-10 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <CheckCircle size={200} />
                        </div>

                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📊</span>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Answer Review</h1>
                            </div>
                            <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">
                                {submission.testName || 'Canvasser Certification Assessment'}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    ID: {submission.secId || submission.phone}
                                </span>
                                <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                                    {new Date(submission.submittedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-6 items-center w-full sm:w-auto pt-6 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Score</span>
                                <span className={`text-6xl font-black tracking-tighter ${submission.score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                                    {submission.score}%
                                </span>
                                <span className={`text-[10px] font-black uppercase mt-1 ${submission.score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                                    {submission.score >= 60 ? 'Passed ✅' : 'Failed ❌'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-2 mb-8">
                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Detailed Analysis</span>
                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                    </div>

                    {/* Question Breakdown List */}
                    <div className="space-y-10">
                        {submission.responses && submission.responses.length > 0 ? (
                            submission.responses.map((resp: any, idx: number) => {
                                const isCorrect = resp.isCorrect;
                                const userAnswer = resp.selectedAnswer;
                                const correctAnswer = resp.correctAnswer;

                                return (
                                    <div key={idx} className={`bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md ${isCorrect ? 'ring-1 ring-green-100' : 'ring-1 ring-red-100'}`}>
                                        {/* Result Banner */}
                                        <div className={`px-6 py-3 flex justify-between items-center ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-black text-[10px] uppercase tracking-widest">
                                                    {isCorrect ? 'Question Result: Correct' : 'Question Result: Incorrect'}
                                                </span>
                                            </div>
                                            <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                {isCorrect ? '✓ Match' : '✗ Mismatch'}
                                            </div>
                                        </div>

                                        <div className="p-8 sm:p-10">
                                            <h3 className="font-bold text-gray-900 text-xl mb-8 leading-snug">
                                                {resp.questionText || `Question ${resp.questionId}`}
                                            </h3>

                                            <div className="grid gap-4">
                                                {resp.options && resp.options.map((opt: any, optIdx: number) => {
                                                    // Options can be strings or objects {option: 'A', text: '...'}
                                                    const optLetter = typeof opt === 'string' ? opt.charAt(0) : (opt.option || '');
                                                    const optText = typeof opt === 'string'
                                                        ? (opt.includes(') ') ? opt.split(') ')[1] : opt.slice(opt.indexOf(')') + 1).trim())
                                                        : (opt.text || '');

                                                    const isCorrectOption = optLetter === correctAnswer;
                                                    const isUserChoice = optLetter === userAnswer;

                                                    let borderStyle = "border-gray-100 bg-gray-50/30 text-gray-500 opacity-60";
                                                    let circleStyle = "bg-gray-100 text-gray-400 border-gray-200";
                                                    let badge = null;

                                                    if (isCorrectOption) {
                                                        borderStyle = "border-green-500 bg-green-50 text-green-900 shadow-sm opacity-100";
                                                        circleStyle = "bg-green-500 text-white border-green-500";
                                                        badge = (
                                                            <span className="bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ml-auto">
                                                                Correct Answer
                                                            </span>
                                                        );
                                                    } else if (isUserChoice && !isCorrect) {
                                                        borderStyle = "border-red-500 bg-red-50 text-red-900 shadow-sm opacity-100";
                                                        circleStyle = "bg-red-500 text-white border-red-500";
                                                        badge = (
                                                            <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ml-auto">
                                                                User Choice
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-5 rounded-2xl border-2 flex items-center gap-5 transition-all ${borderStyle}`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2 ${circleStyle}`}>
                                                                {optLetter}
                                                            </div>
                                                            <span className="text-sm font-bold leading-tight">
                                                                {optText}
                                                            </span>
                                                            {badge}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No Response Data available for this submission.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-16 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => router.push('/Zopper-Administrator/test-results')}
                            className="flex-1 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-black shadow-xl transition-all uppercase tracking-widest text-xs"
                        >
                            Return to Results
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 py-5 bg-white border-2 border-gray-200 text-gray-900 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                        >
                            Print Report
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AnswerReviewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        }>
            <AnswerReviewContent />
        </Suspense>
    );
}
