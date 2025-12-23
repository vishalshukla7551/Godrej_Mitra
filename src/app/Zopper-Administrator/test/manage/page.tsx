'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Test {
  id: string;
  name: string;
  description: string;
  type: 'QUIZ' | 'ASSESSMENT';
  totalQuestions: number;
  duration: number;
  maxAttempts: number;
  passingPercentage: number;
  status: 'DRAFT' | 'ACTIVE' | 'LOCKED';
  enableProctoring: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// Mock data for now
const MOCK_TESTS: Test[] = [
  {
    id: '1',
    name: 'Samsung Protect Max Basic',
    description: 'Basic knowledge test for Samsung Protect Max',
    type: 'QUIZ',
    totalQuestions: 10,
    duration: 15,
    maxAttempts: 3,
    passingPercentage: 60,
    status: 'ACTIVE',
    enableProctoring: true,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Coverage & Benefits Assessment',
    description: 'Assessment on coverage and benefits knowledge',
    type: 'ASSESSMENT',
    totalQuestions: 20,
    duration: 30,
    maxAttempts: 2,
    passingPercentage: 70,
    status: 'ACTIVE',
    enableProctoring: true,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdAt: '2025-01-15T00:00:00Z',
  },
];

export default function ManageTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setTests(MOCK_TESTS);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusBadge = (status: Test['status']) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      LOCKED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: Test['type']) => {
    const styles = {
      QUIZ: 'bg-blue-100 text-blue-800',
      ASSESSMENT: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      QUIZ: 'Quiz',
      ASSESSMENT: 'Assessment',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const toggleTestStatus = (testId: string) => {
    setTests(prev =>
      prev.map(test => {
        if (test.id === testId) {
          const newStatus = test.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
          return { ...test, status: newStatus };
        }
        return test;
      })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage tests for SECs</p>
        </div>
        <button
          onClick={() => router.push('/Zopper-Administrator/test/create')}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Create New Test
        </button>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map(test => (
          <div
            key={test.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 text-lg">{test.name}</h3>
              {getStatusBadge(test.status)}
            </div>

            {/* Type Badge */}
            <div className="mb-3">{getTypeBadge(test.type)}</div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{test.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-bold text-gray-900">{test.totalQuestions}</div>
                <div className="text-gray-600 text-xs">Questions</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-bold text-gray-900">{test.duration} min</div>
                <div className="text-gray-600 text-xs">Duration</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-bold text-gray-900">{test.maxAttempts}</div>
                <div className="text-gray-600 text-xs">Max Attempts</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-bold text-gray-900">{test.passingPercentage}%</div>
                <div className="text-gray-600 text-xs">Pass %</div>
              </div>
            </div>

            {/* Proctoring Badge */}
            {test.enableProctoring && (
              <div className="mb-4">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                  🎥 Proctoring Enabled
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => router.push(`/Zopper-Administrator/test/${test.id}/edit`)}
                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-200"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => router.push(`/Zopper-Administrator/test/${test.id}/questions`)}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-200"
              >
                📝 Questions
              </button>
              <button
                onClick={() => router.push(`/Zopper-Administrator/test/results?testId=${test.id}`)}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-semibold hover:bg-green-200"
              >
                👁 Results
              </button>
              <button
                onClick={() => toggleTestStatus(test.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${test.status === 'LOCKED'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
              >
                {test.status === 'LOCKED' ? '🔓 Unlock' : '🔒 Lock'}
              </button>
            </div>

            {/* Created Date */}
            <div className="mt-3 text-xs text-gray-500">
              Created: {new Date(test.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests created yet</h3>
          <p className="text-gray-600 mb-4">Create your first test to get started</p>
          <button
            onClick={() => router.push('/Zopper-Administrator/test/create')}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            ➕ Create New Test
          </button>
        </div>
      )}
    </div>
  );
}
