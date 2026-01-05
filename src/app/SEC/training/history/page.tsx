'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, ArrowLeft, Eye, Award } from 'lucide-react';
import SECHeader from '@/app/SEC/SECHeader';
import SECFooter from '@/app/SEC/SECFooter';

interface TestHistory {
  id: string;
  testId: string;
  testName: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  submittedAt: string;
  hasCertificate: boolean;
}

const MOCK_HISTORY: TestHistory[] = [
  { id: '1', testId: '1', testName: 'Samsung Protect Max Certification', score: 80, totalQuestions: 10, passed: true, submittedAt: '2024-12-15T10:30:00', hasCertificate: true },
  { id: '2', testId: '2', testName: 'Coverage & Benefits Quiz', score: 50, totalQuestions: 10, passed: false, submittedAt: '2024-12-14T14:20:00', hasCertificate: false },
  { id: '3', testId: '1', testName: 'Samsung Protect Max Certification', score: 40, totalQuestions: 10, passed: false, submittedAt: '2024-12-13T09:15:00', hasCertificate: false },
];

export default function TestHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const authUser = localStorage.getItem('authUser');
        if (!authUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(authUser);
        const secId = userData.phone || userData.id;

        if (!secId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/admin/test-submissions?secId=${encodeURIComponent(secId)}`);
        const result = await response.json();

        if (result.success && result.data) {
          const formattedHistory = result.data.map((item: any) => ({
            id: item.id,
            testId: item.testId || '1',
            testName: item.testName || 'SEC Certification',
            score: item.score,
            totalQuestions: item.totalQuestions,
            passed: item.score >= 60,
            submittedAt: item.submittedAt,
            hasCertificate: item.score >= 60
          }));
          setHistory(formattedHistory);
        }
      } catch (error) {
        console.error('Error fetching test history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <SECHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={() => router.push('/SEC/training')} className="flex items-center gap-2 text-blue-600 mb-4">
            <ArrowLeft className="w-5 h-5" /> Back to Training
          </button>
          <div className="flex items-center gap-3 mb-6">
            <History className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Test History</h2>
              <p className="text-gray-600 mb-4">Take tests to see your history here</p>
              <button onClick={() => router.push('/SEC/training')} className="px-6 py-3 bg-blue-600 text-white rounded-xl">Go to Training</button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${item.passed ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.testName}</h3>
                      <p className="text-sm text-gray-500">{new Date(item.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${item.passed ? 'text-green-600' : 'text-red-600'}`}>{item.score}%</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.passed ? 'Passed' : 'Failed'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/SEC/training/history/${item.id}/review`)} className="flex-1 py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
                      <Eye className="w-4 h-4" /> View Answers
                    </button>
                    {item.hasCertificate && (
                      <button onClick={() => router.push('/SEC/training/certificates')} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
                        <Award className="w-4 h-4" /> Certificate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SECFooter />
    </div>
  );
}
