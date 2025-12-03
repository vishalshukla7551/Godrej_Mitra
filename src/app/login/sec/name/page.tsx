'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SECNameCapturePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pre-fill from any existing values
    const storedFirst = window.localStorage.getItem('firstName') || '';
    const storedLast = window.localStorage.getItem('lastName') || '';

    if (storedFirst) setFirstName(storedFirst);
    if (storedLast) setLastName(storedLast);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst) {
      setError('Please enter your first name');
      return;
    }

    try {
      setSubmitting(true);

      // Persist to backend SEC profile so this screen only appears once.
      const res = await fetch('/api/sec/profile/name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName: trimmedFirst, lastName: trimmedLast }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save your name');
      }

      if (typeof window !== 'undefined') {
        const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
        window.localStorage.setItem('firstName', trimmedFirst);
        window.localStorage.setItem('lastName', trimmedLast);
        if (fullName) {
          window.localStorage.setItem('secUserName', fullName);
        }

        // Also update authUser in storage if present so greeting uses the name.
        try {
          const raw = window.localStorage.getItem('authUser');
          if (raw) {
            const parsed = JSON.parse(raw) as any;
            const updated = {
              ...parsed,
              profile: {
                ...(parsed.profile || {}),
                fullName,
              },
            };
            window.localStorage.setItem('authUser', JSON.stringify(updated));
          }
        } catch {
          // ignore parse/storage errors
        }
      }

      // After capturing the name, send SEC to their home screen.
      router.replace('/SEC/home');
    } catch (err: any) {
      setError(err.message || 'Failed to save your name');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your name?</h1>
          <p className="text-sm text-gray-500">
            Let us know how to properly address you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="w-full px-4 py-3 border border-gray-900 rounded-2xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
            />
          </div>

          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 ml-4 h-12 bg-black text-white rounded-full font-semibold text-base flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
