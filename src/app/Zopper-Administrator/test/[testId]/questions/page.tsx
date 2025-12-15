'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Question {
  id: string;
  questionText: string;
  options: { option: string; text: string }[];
  correctAnswer: string;
  order: number;
}

// Mock questions
const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    questionText: 'What is the coverage period for Samsung Protect Max ADLD plan?',
    options: [
      { option: 'A', text: '1 Year' },
      { option: 'B', text: '2 Years' },
      { option: 'C', text: '6 Months' },
      { option: 'D', text: '3 Years' },
    ],
    correctAnswer: 'A',
    order: 1,
  },
  {
    id: '2',
    questionText: 'Which of the following is NOT covered under Samsung Protect Max?',
    options: [
      { option: 'A', text: 'Accidental Damage' },
      { option: 'B', text: 'Liquid Damage' },
      { option: 'C', text: 'Theft' },
      { option: 'D', text: 'Screen Crack' },
    ],
    correctAnswer: 'C',
    order: 2,
  },
  {
    id: '3',
    questionText: 'What is the maximum claim limit for Samsung Protect Max?',
    options: [
      { option: 'A', text: '₹50,000' },
      { option: 'B', text: 'Device Invoice Value' },
      { option: 'C', text: '₹1,00,000' },
      { option: 'D', text: 'No Limit' },
    ],
    correctAnswer: 'B',
    order: 3,
  },
];

export default function TestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState('A');

  useEffect(() => {
    setTimeout(() => {
      setQuestions(MOCK_QUESTIONS);
      setLoading(false);
    }, 500);
  }, []);

  const resetForm = () => {
    setFormQuestion('');
    setFormOptions(['', '', '', '']);
    setFormCorrectAnswer('A');
    setEditingQuestion(null);
  };

  const handleAddQuestion = () => {
    if (!formQuestion.trim() || formOptions.some(o => !o.trim())) {
      alert('Please fill all fields');
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      questionText: formQuestion,
      options: formOptions.map((text, idx) => ({
        option: String.fromCharCode(65 + idx),
        text,
      })),
      correctAnswer: formCorrectAnswer,
      order: questions.length + 1,
    };

    setQuestions(prev => [...prev, newQuestion]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditQuestion = () => {
    if (!editingQuestion) return;
    
    setQuestions(prev =>
      prev.map(q =>
        q.id === editingQuestion.id
          ? {
              ...q,
              questionText: formQuestion,
              options: formOptions.map((text, idx) => ({
                option: String.fromCharCode(65 + idx),
                text,
              })),
              correctAnswer: formCorrectAnswer,
            }
          : q
      )
    );
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setFormQuestion(question.questionText);
    setFormOptions(question.options.map(o => o.text));
    setFormCorrectAnswer(question.correctAnswer);
    setShowAddModal(true);
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
          <button
            onClick={() => router.push('/Zopper-Administrator/test/manage')}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 mb-2"
          >
            ← Back to Tests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Question Management</h1>
          <p className="text-sm text-gray-600 mt-1">Test ID: {testId}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-sm">
            {questions.length} Questions
          </span>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            ➕ Add Question
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, idx) => (
          <div key={question.id} className="bg-white rounded-xl shadow-md p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <h3 className="font-semibold text-gray-900">{question.questionText}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(question)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {question.options.map(opt => (
                <div
                  key={opt.option}
                  className={`p-3 rounded-lg border ${
                    opt.option === question.correctAnswer
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className={`font-bold mr-2 ${
                    opt.option === question.correctAnswer ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {opt.option}.
                  </span>
                  <span className="text-gray-900">{opt.text}</span>
                  {opt.option === question.correctAnswer && (
                    <span className="ml-2 text-green-600 font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-600 mb-4">Add questions to this test</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            ➕ Add First Question
          </button>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>

            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900"
                  placeholder="Enter question text"
                />
              </div>

              {/* Options */}
              {['A', 'B', 'C', 'D'].map((opt, idx) => (
                <div key={opt}>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Option {opt} *
                  </label>
                  <input
                    type="text"
                    value={formOptions[idx]}
                    onChange={e => {
                      const newOptions = [...formOptions];
                      newOptions[idx] = e.target.value;
                      setFormOptions(newOptions);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900"
                    placeholder={`Enter option ${opt}`}
                  />
                </div>
              ))}

              {/* Correct Answer */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Correct Answer *
                </label>
                <div className="flex gap-4">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={opt}
                        checked={formCorrectAnswer === opt}
                        onChange={() => setFormCorrectAnswer(opt)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium text-gray-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingQuestion ? handleEditQuestion : handleAddQuestion}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                {editingQuestion ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
