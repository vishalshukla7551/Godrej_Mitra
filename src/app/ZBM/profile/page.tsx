'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientLogout } from '@/lib/clientLogout';

interface ZBMProfileApiResponse {
  success: boolean;
  data?: {
    zbm: {
      id: string;
      fullName: string;
      phone: string;
      region?: string;
    };
  };
  error?: string;
}

export default function ZBMProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    region: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/zbm/profile');
        if (!res.ok) {
          throw new Error('Failed to load ZBM profile');
        }

        const json = (await res.json()) as ZBMProfileApiResponse;
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Failed to load ZBM profile');
        }

        const { zbm } = json.data;

        setFormData(prev => ({
          ...prev,
          fullName: zbm.fullName || '',
          phoneNumber: zbm.phone || '',
          region: zbm.region || '',
        }));

      } catch (err) {
        console.error(err);
        setError('Unable to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);



  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-700 to-slate-800 px-16 py-10">
      {/* Page Title */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-bold text-white">Your Profile</h1>
        </div>
        <button
          onClick={() => clientLogout('/login/role')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17L21 12L16 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      {loading ? (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-5">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="8" r="4" fill="white" />
                  <path
                    d="M20 21C20 17.134 16.418 14 12 14C7.582 14 4 17.134 4 21"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900">
                  {formData.fullName || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900">
                  {formData.phoneNumber || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900">
                  {formData.email || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900">
                  {formData.dateOfBirth || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900">
                  {formData.region || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
