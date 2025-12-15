'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  status: 'DRAFT' | 'ACTIVE';
}

export default function CreateTestPage() {
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Please enter a test name');
      return;
    }

    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      alert('Test created successfully!');
      router.push('/Zopper-Administrator/test/manage');
    }, 1000);
  };

  const updateForm = (field: keyof TestForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Test</h1>

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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter test name"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter test description"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={form.status === 'DRAFT'}
                  onChange={() => updateForm('status', 'DRAFT')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900">Draft</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={form.status === 'ACTIVE'}
                  onChange={() => updateForm('status', 'ACTIVE')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900">Active</span>
              </label>
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
              {saving ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
