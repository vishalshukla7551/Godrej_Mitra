'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface TestForm {
  name: string;
  description: string;
  type: 'QUIZ' | 'ASSESSMENT' | 'FINAL_EXAM';
  duration: number;
  passingPercentage: number;
  maxAttempts: number;
  enableProctoring: boolean;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'LOCKED';
}

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TestForm>({
    name: '',
    description: '',
    type: 'QUIZ',
    duration: 15,
    passingPercentage: 60,
    maxAttempts: 3,
    enableProctoring: true,
    startDate: '',
    endDate: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    // Simulate fetching test data
    setTimeout(() => {
      setForm({
        name: 'Samsung Protect Max Basic',
        description: 'Basic knowledge test for Samsung Protect Max',
        type: 'QUIZ',
        duration: 15,
        passingPercentage: 60,
        maxAttempts: 3,
        enableProctoring: true,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'ACTIVE',
      });
      setLoading(false);
    }, 500);
  }, [testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Please enter a test name');
      return;
    }

    setSaving(true);
    
    setTimeout(() => {
      alert('Test updated successfully!');
      router.push('/Zopper-Administrator/test/manage');
    }, 1000);
  };

  const updateForm = (field: keyof TestForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
        >
          ← Back to Tests
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Test</h1>
          <span className="text-sm text-gray-500">ID: {testId}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Name */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Test Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => updateForm('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Test Type */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Test Type *
            </label>
            <select
              value={form.type}
              onChange={e => updateForm('type', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="QUIZ">Quiz (Training)</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="FINAL_EXAM">Final Certification Exam</option>
            </select>
          </div>

          {/* Duration & Passing % */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min={1}
                value={form.duration}
                onChange={e => updateForm('duration', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Passing Percentage *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.passingPercentage}
                onChange={e => updateForm('passingPercentage', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Max Attempts */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Max Attempts *
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.maxAttempts}
              onChange={e => updateForm('maxAttempts', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Proctoring Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-bold text-gray-900">Enable Proctoring</div>
              <div className="text-sm text-gray-600">Capture screenshots during test</div>
            </div>
            <button
              type="button"
              onClick={() => updateForm('enableProctoring', !form.enableProctoring)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                form.enableProctoring ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  form.enableProctoring ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => updateForm('startDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => updateForm('endDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              {['DRAFT', 'ACTIVE', 'LOCKED'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={form.status === status}
                    onChange={() => updateForm('status', status)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
