'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import FestiveHeader from '@/components/FestiveHeader';
import FestiveFooter from '@/components/FestiveFooter';

interface ReviewQuestion {
  id: string;
  questionText: string;
  options: { option: string; text: string }[];
  correctAnswer: string;
  selectedAnswer: string | null;
}

interface ReviewData {
  testName: string;
  score: number;
  submittedAt: string;
  questions: ReviewQuestion[];
}

const MOCK_REVIEW: ReviewData = {
  testName: 'Samsung Protect Max Certification',
  score: 80,
  submittedAt: '2024-12-15T10:30:00',
  questions: [
    { id: '1', questionText: 'What is the coverage period for Samsung Protect Max ADLD plan?', options: [{ option: 'A', text: '1 Year' }, { option: 'B', text: '2 Years' }, { option: 'C', text: '6 Months' }, { option: 'D', text: '3 Years' }], correctAnswer: 'A', selectedAnswer: 'A' },
    { id: '2', questionText: 'Which of the following is NOT covered under Samsung Protect Max?', options: [{ option: 'A', text: 'Accidental Damage' }, { option: 'B', text: 'Liquid Damage' }, { option: 'C', text: 'Theft' }, { option: 'D', text: 'Screen Crack' }], correctAnswer: 'C', selectedAnswer: 'C' },
    { id: '3', questionText: 'What is the maximum claim limit for Samsung Protect Max?', options: [{ option: 'A', text: '₹50,000' }, { option: 'B', text: 'Device Invoice Value' }, { option: 'C', text: '₹1,00,000' }, { option: 'D', text: 'No Limit' }], correctAnswer: 'B', selectedAnswer: 'A' },
    { id: '4', questionText: 'How many claims can be made under Samsung Protect Max ADLD?', options: [{ option: 'A', text: '1 Claim' }, { option: 'B', text: '2 Claims' }, { option: 'C', text: 'Unlimited' }, { option: 'D', text: '3 Claims' }], correctAnswer: 'A', selectedAnswer: 'A' },
    { id: '5', questionText: 'What is the waiting period after purchasing Samsung Protect Max?', options: [{ option: 'A', text: 'No waiting period' }, { option: 'B', text: '7 Days' }, { option: 'C', text: '15 Days' }, { option: 'D', text: '30 Days' }], correctAnswer: 'A', selectedAnswer: 'B' },
  ],
};

export default function AnswerReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => { setReviewData(MOCK_REVIEW); setLoading(false); }, 500); }, [params?.historyId]);

  if (loading) return <div className="h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  if (!reviewData) return <div className="h-screen bg-gray-100 flex items-center justify-center"><div className="text-center"><p className="text-gray-600 mb-4">Review not found</p><button onClick={() => router.push('/SEC/training/history')} className="px-6 py-3 bg-blue-600 text-white rounded-xl">Back to History</button></div></div>;

  const correctCount = reviewData.questions.filter(q => q.selectedAnswer === q.correctAnswer).length;

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <FestiveHeader hideGreeting />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={() => router.push('/SEC/training/history')} className="flex items-center gap-2 text-blue-600 mb-4">
            <ArrowLeft className="w-5 h-5" /> Back to History
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">📝 Answer Review</h1>
            <p className="text-gray-600 mb-4">{reviewData.testName}</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-bold text-green-600">{correctCount} Correct</span></div>
              <div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /><span className="font-bold text-red-600">{reviewData.questions.length - correctCount} Wrong</span></div>
              <div className="ml-auto"><span className={`text-xl font-bold ${reviewData.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>{reviewData.score}%</span></div>
            </div>
          </div>

          <div className="space-y-4">
            {reviewData.questions.map((q, idx) => {
              const isCorrect = q.selectedAnswer === q.correctAnswer;
              return (
                <div key={q.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                    <span className="text-gray-500 text-sm">Question {idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-4">{q.questionText}</h3>
                  <div className="space-y-2">
                    {q.options.map(opt => (
                      <div key={opt.option} className={`p-3 rounded-lg border-2 ${opt.option === q.correctAnswer ? 'border-green-500 bg-green-50' : opt.option === q.selectedAnswer && !isCorrect ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${opt.option === q.correctAnswer ? 'bg-green-500 text-white' : opt.option === q.selectedAnswer && !isCorrect ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{opt.option}</span>
                          <span className="text-gray-900 flex-1">{opt.text}</span>
                          {opt.option === q.correctAnswer && <span className="text-green-600 text-xs font-medium">✓ Correct Answer</span>}
                          {opt.option === q.selectedAnswer && opt.option !== q.correctAnswer && <span className="text-yellow-600 text-xs font-medium">🟡 Your Answer</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => router.push('/SEC/training')} className="w-full mt-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Back to Training</button>
        </div>
      </main>
      <FestiveFooter />
    </div>
  );
}
