'use client';

import { useEffect, useState } from 'react';
import { clientLogout } from '@/lib/clientLogout';

interface ABMProfileApiResponse {
  success: boolean;
  data?: {
    abm: {
      id: string;
      fullName: string;
      phone: string;
      region: string | null;
    };
    stores: StoreInfo[];
  };
  error?: string;
}

interface StoreInfo {
  id: string;
  name: string;
  city: string | null;
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    region: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/abm/profile');
        if (!res.ok) {
          throw new Error('Failed to load ABM profile');
        }

        const json = (await res.json()) as ABMProfileApiResponse;
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Failed to load ABM profile');
        }

        const { abm } = json.data;

        setProfileData({
          fullName: abm.fullName || '',
          phone: abm.phone || '',
          region: abm.region || 'N/A',
        });
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
    <div className="min-h-screen bg-gradient-to-b from-slate-700 to-slate-800 px-6 py-10">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 flex justify-between items-center">
        <a
          href="/ABM"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-medium">Back</span>
        </a>
        <button
          onClick={() => clientLogout('/login/role')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>

      {/* Page Title */}
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-2xl mx-auto text-center text-white py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-2xl mx-auto text-center text-red-400 py-12">
          <p>{error}</p>
        </div>
      )}

      {/* Personal Info Card */}
      {!loading && !error && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="white"/>
                  <path d="M20 21C20 17.134 16.418 14 12 14C7.582 14 4 17.134 4 21" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <div className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-lg font-medium">
                  {profileData.fullName || 'N/A'}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <div className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-lg font-medium">
                  {profileData.phone || 'N/A'}
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Region</label>
                <div className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-lg font-medium">
                  {profileData.region || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
