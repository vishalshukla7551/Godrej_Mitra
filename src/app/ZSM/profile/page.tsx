'use client';

import { useEffect, useState } from 'react';
import { clientLogout } from '@/lib/clientLogout';

interface StoreInfo {
  id: string;
  name: string;
  city: string | null;
}

interface ZSMProfileApiResponse {
  success: boolean;
  data?: {
    zsm: {
      id: string;
      fullName: string;
      phone: string;
      region?: string;
    };
    abms: Array<{
      id: string;
      fullName: string;
      storeCount: number;
    }>;
    stores: StoreInfo[];
  };
  error?: string;
}

export default function ZSMProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    region: '',
  });

  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [abms, setAbms] = useState<Array<{ id: string; fullName: string; storeCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/zsm/profile');
        if (!res.ok) {
          throw new Error('Failed to load ZSM profile');
        }

        const json = (await res.json()) as ZSMProfileApiResponse;
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Failed to load ZSM profile');
        }

        const { zsm, abms: apiAbms, stores: apiStores } = json.data;

        setFormData(prev => ({
          ...prev,
          fullName: zsm.fullName || '',
          phoneNumber: zsm.phone || '',
          region: zsm.region || '',
        }));

        setStores(apiStores || []);
        setAbms(apiAbms || []);

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
      <div className="mb-8 flex justify-between items-center">
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-bold text-white">Your Profile</h1>
        </div>
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
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Personal Details Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="white" />
                  <path d="M20 21C20 17.134 16.418 14 12 14C7.582 14 4 17.134 4 21" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium">{formData.fullName || 'Not provided'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium">{formData.phoneNumber || 'Not provided'}</div>
              </div>
              {formData.region && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-medium">{formData.region}</div>
                </div>
              )}
            </div>
          </div>

          {/* Mapped ABMs & Stores Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Mapped ABMs & Stores</h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mapped ABMs ({abms.length})
                </label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 max-h-32 overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {abms.length ? (
                      abms.map((abm) => (
                        <span key={abm.id} className="inline-flex items-center justify-between rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm">
                          <span>{abm.fullName}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {abm.storeCount} {abm.storeCount === 1 ? 'store' : 'stores'}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No ABMs mapped</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  All Mapped Stores ({stores.length})
                </label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 max-h-32 overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {stores.length ? (
                      stores.map((store) => (
                        <span key={store.id} className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm">
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
