'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import FestiveHeader from '@/components/FestiveHeader';
import FestiveFooter from '@/components/FestiveFooter';

/**
 * SEC Answer Review Page
 * Displays the detailed results of a past test for the SEC representative.
 * Uses the same enriched data API as the Admin view for consistency.
 */
function ReviewContent() {
  const router = useRouter();
  const params = useParams();
  const historyId = params?.historyId as string;

  const [submission, setSubmission] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!historyId) return;
      setLoading(true);
      setError(null);

      try {
        // Fetch using the enriched detail API
        const response = await fetch(`/api/admin/test-submissions/${historyId}`);
        const result = await response.json();

        if (result.success && result.data) {
          setSubmission(result.data);
        } else {
          setError('Unable to load test details.');
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Failed to fetch review data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [historyId]);

  if (loading) return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 font-medium">Loading your results...</p>
    </div>
  );

  if (error || !submission) return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Review Unavailable</h2>
        <p className="text-gray-500 mb-8">{error || 'Could not find the requested test history.'}</p>
        <button
          onClick={() => router.push('/SEC/training/history')}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 uppercase tracking-widest text-xs hover:bg-blue-700 transition-all"
        >
          Back to History
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans mb-32">
      <FestiveHeader hideGreeting />

      <main className="flex-1 pb-24">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/SEC/training/history')}
            className="flex items-center gap-2 text-blue-600 mb-8 font-black text-sm hover:gap-3 transition-all uppercase tracking-widest"
          >
            <ArrowLeft className="w-5 h-5" /> Back to History
          </button>

          {/* Summary Header Section */}
          <div className="bg-white rounded-[2rem] shadow-sm p-8 sm:p-10 mb-8 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <CheckCircle size={200} />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📝</span>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Answer Review</h1>
              </div>
              <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">
                {submission.testName}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                  Submitted on: {new Date(submission.submittedAt).toLocaleDateString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex gap-6 items-center w-full sm:w-auto pt-6 sm:pt-0 border-t sm:border-t-0 border-gray-50">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Score</span>
                <span className={`text-6xl font-black tracking-tighter ${submission.score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                  {submission.score}%
                </span>
                <span className={`text-[10px] font-black uppercase mt-1 ${submission.score >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                  {submission.score >= 60 ? 'Passed ✅' : 'Failed ❌'}
                </span>
              </div>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-8">
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
                          {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
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
                          const optLetter = typeof opt === 'string' ? opt.charAt(0) : opt.option;
                          const optText = typeof opt === 'string'
                            ? (opt.includes(') ') ? opt.split(') ')[1] : opt.slice(opt.indexOf(')') + 1).trim())
                            : opt.text;

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
                                Your Choice
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
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No details available.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/SEC/training')}
            className="w-full mt-12 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest text-xs"
          >
            Return to Training
          </button>
        </div>
      </main>
      <FestiveFooter />
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
      <ReviewContent />
    </Suspense>
  );
}
