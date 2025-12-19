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
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [zsmName, setZsmName] = useState<string | null>(null);
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

        const { abm, stores: apiStores } = json.data;

        setProfileData({
          fullName: abm.fullName || '',
          phone: abm.phone || '',
          region: abm.region || 'N/A',
        });
        
        setStores(apiStores || []);
        setZsmName(abm.zsmName || null);
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

      {/* Profile Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Personal Details Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="white"/>
                  <path d="M20 21C20 17.134 16.418 14 12 14C7.582 14 4 17.134 4 21" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium">
                  {profileData.fullName || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium">
                  {profileData.phone || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Store Details Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Stores and ZSM Mapping</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZSM Name</label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium">
                  {zsmName || 'Not assigned'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mapped Stores</label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 max-h-64 overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {stores.length ? (
                      stores.map((store) => (
                        <span
                          key={store.id}
                          className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm"
                        >
                          {store.name}
                          {store.city && (
                            <span className="ml-1 text-xs text-gray-500">- {store.city}</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No stores mapped</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
