'use client';

import { useState, useEffect } from 'react';

interface QuestionAnalysis {
  id: string;
  questionNumber: number;
  questionText: string;
  correctPercentage: number;
  wrongPercentage: number;
  totalAttempts: number;
  mostSelectedWrongOption: string;
  options: {
    option: string;
    text: string;
    selectedCount: number;
    isCorrect: boolean;
  }[];
}

// Mock data
const MOCK_ANALYSIS: QuestionAnalysis[] = [
  {
    id: '1',
    questionNumber: 1,
    questionText: 'What is the coverage period for Samsung Protect Max ADLD plan?',
    correctPercentage: 85,
    wrongPercentage: 15,
    totalAttempts: 100,
    mostSelectedWrongOption: 'B',
    options: [
      { option: 'A', text: '1 Year', selectedCount: 85, isCorrect: true },
      { option: 'B', text: '2 Years', selectedCount: 10, isCorrect: false },
      { option: 'C', text: '6 Months', selectedCount: 3, isCorrect: false },
      { option: 'D', text: '3 Years', selectedCount: 2, isCorrect: false },
    ],
  },
  {
    id: '2',
    questionNumber: 2,
    questionText: 'Which of the following is NOT covered under Samsung Protect Max?',
    correctPercentage: 62,
    wrongPercentage: 38,
    totalAttempts: 100,
    mostSelectedWrongOption: 'C',
    options: [
      { option: 'A', text: 'Accidental Damage', selectedCount: 15, isCorrect: false },
      { option: 'B', text: 'Liquid Damage', selectedCount: 8, isCorrect: false },
      { option: 'C', text: 'Theft', selectedCount: 62, isCorrect: true },
      { option: 'D', text: 'Screen Crack', selectedCount: 15, isCorrect: false },
    ],
  },
  {
    id: '3',
    questionNumber: 3,
    questionText: 'What is the maximum claim limit for Samsung Protect Max?',
    correctPercentage: 45,
    wrongPercentage: 55,
    totalAttempts: 100,
    mostSelectedWrongOption: 'A',
    options: [
      { option: 'A', text: '₹50,000', selectedCount: 30, isCorrect: false },
      { option: 'B', text: 'Device Invoice Value', selectedCount: 45, isCorrect: true },
      { option: 'C', text: '₹1,00,000', selectedCount: 15, isCorrect: false },
      { option: 'D', text: 'No Limit', selectedCount: 10, isCorrect: false },
    ],
  },
  {
    id: '4',
    questionNumber: 4,
    questionText: 'How many claims can be made under Samsung Protect Max ADLD?',
    correctPercentage: 78,
    wrongPercentage: 22,
    totalAttempts: 100,
    mostSelectedWrongOption: 'B',
    options: [
      { option: 'A', text: '1 Claim', selectedCount: 78, isCorrect: true },
      { option: 'B', text: '2 Claims', selectedCount: 15, isCorrect: false },
      { option: 'C', text: 'Unlimited', selectedCount: 5, isCorrect: false },
      { option: 'D', text: '3 Claims', selectedCount: 2, isCorrect: false },
    ],
  },
  {
    id: '5',
    questionNumber: 5,
    questionText: 'What is the waiting period after purchasing Samsung Protect Max?',
    correctPercentage: 35,
    wrongPercentage: 65,
    totalAttempts: 100,
    mostSelectedWrongOption: 'C',
    options: [
      { option: 'A', text: 'No waiting period', selectedCount: 35, isCorrect: true },
      { option: 'B', text: '7 Days', selectedCount: 20, isCorrect: false },
      { option: 'C', text: '15 Days', selectedCount: 30, isCorrect: false },
      { option: 'D', text: '30 Days', selectedCount: 15, isCorrect: false },
    ],
  },
];

export default function QuestionAnalysisPage() {
  const [analysis, setAnalysis] = useState<QuestionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setAnalysis(MOCK_ANALYSIS);
      setLoading(false);
    }, 500);
  }, []);

  const getAccuracyColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const sortedByDifficulty = [...analysis].sort((a, b) => a.correctPercentage - b.correctPercentage);
  const hardestQuestions = sortedByDifficulty.slice(0, 5);
  const easiestQuestions = [...sortedByDifficulty].reverse().slice(0, 5);
  
  const avgAccuracy = analysis.length > 0 
    ? Math.round(analysis.reduce((sum, q) => sum + q.correctPercentage, 0) / analysis.length)
    : 0;

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Question Analysis</h1>
        <p className="text-sm text-gray-600 mt-1">Analyze which questions SECs struggle with</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-blue-600">{analysis.length}</div>
          <div className="text-sm font-semibold text-gray-700">Total Questions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-green-600">{avgAccuracy}%</div>
          <div className="text-sm font-semibold text-gray-700">Avg Accuracy</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-red-600">
            Q{hardestQuestions[0]?.questionNumber || '-'}
          </div>
          <div className="text-sm font-semibold text-gray-700">Hardest Question</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-purple-600">
            Q{easiestQuestions[0]?.questionNumber || '-'}
          </div>
          <div className="text-sm font-semibold text-gray-700">Easiest Question</div>
        </div>
      </div>

      {/* Top 5 Most Difficult */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🔴 Top 5 Most Difficult Questions</h2>
        <div className="space-y-3">
          {hardestQuestions.map((q, idx) => (
            <div key={q.id} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-700">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Q{q.questionNumber}: {q.questionText.slice(0, 60)}...</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600">{q.correctPercentage}%</div>
                <div className="text-xs text-gray-600">correct</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per Question Analysis Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Per Question Accuracy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Q#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Question</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Correct %</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Wrong %</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Most Wrong</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysis.map(q => (
                <>
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">Q{q.questionNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                      {q.questionText.slice(0, 80)}{q.questionText.length > 80 ? '...' : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getAccuracyColor(q.correctPercentage)}`}>
                        {q.correctPercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                        {q.wrongPercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-orange-600">
                      Option {q.mostSelectedWrongOption}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200"
                      >
                        {expandedQuestion === q.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedQuestion === q.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900 mb-3">{q.questionText}</div>
                          {q.options.map(opt => (
                            <div
                              key={opt.option}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                opt.isCorrect ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                  opt.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {opt.option}
                                </span>
                                <span className="font-medium text-gray-900">{opt.text}</span>
                                {opt.isCorrect && <span className="text-green-600 font-bold">✓ Correct</span>}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">{opt.selectedCount}%</div>
                                <div className="text-xs text-gray-600">selected</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
