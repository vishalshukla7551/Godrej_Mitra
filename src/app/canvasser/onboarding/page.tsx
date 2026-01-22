"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogout } from '@/lib/clientLogout';

export default function CanvasserOnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [canvasserId, setCanvasserId] = useState('');
  const [stores, setStores] = useState<
    { id: string; name: string; city?: string | null }[]
  >([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasserIdError, setCanvasserIdError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('authUser');
      if (!raw) return;

      const auth = JSON.parse(raw) as any;
      const storedFullName = (auth?.fullName || '').trim();
      const storedStoreId = (auth?.storeId || auth?.selectedStoreId || '').trim();
      const storedCanvasserId = (auth?.canvasserId || auth?.employId || auth?.employeeId || '').trim();

      if (storedFullName) setFullName(storedFullName);
      if (storedStoreId) setSelectedStoreId(storedStoreId);
      if (storedCanvasserId) setCanvasserId(storedCanvasserId);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchStores() {
      try {
        setLoadingStores(true);
        const res = await fetch('/api/canvasser/incentive-form/stores');
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data?.stores || cancelled) return;
        setStores(data.stores);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingStores(false);
      }
    }

    fetchStores();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedStoreId || stores.length === 0) return;
    const s = stores.find((st) => st.id === selectedStoreId);
    if (!s) return;
    const label = `${s.name}${s.city ? ` - ${s.city}` : ''}`;
    setStoreSearch(label);
  }, [selectedStoreId, stores]);

  const handleBack = async () => {
    await clientLogout('/login/canvasser', false);
  };

  const filteredStores = stores.filter((store) => {
    const query = storeSearch.trim().toLowerCase();
    if (!query) return true;
    const name = (store.name || '').toLowerCase();
    const city = (store.city || '').toLowerCase();
    return name.includes(query) || city.includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCanvasserIdError(null);

    const trimmedFullName = fullName.trim();
    const trimmedCanvasserId = canvasserId.trim();

    if (!trimmedFullName) {
      setError('Please enter your full name');
      return;
    }

    if (!trimmedCanvasserId) {
      setError('Please enter your Canvasser ID');
      return;
    }

    if (!selectedStoreId) {
      setError('Please select your store');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/canvasser/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedFullName,
          lastName: '',
          storeId: selectedStoreId,
          employeeId: trimmedCanvasserId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMsg = data?.error || 'Failed to save your details';

        // Show Canvasser ID specific error below the field
        if (errorMsg === 'Canvasser ID already in use') {
          setCanvasserIdError('Canvasser ID already in use');
          return;
        }

        throw new Error(errorMsg);
      }

      const responseData = await res.json();

      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('authUser');
          if (raw) {
            const parsed = JSON.parse(raw) as any;
            const updated = {
              ...parsed,
              fullName: responseData.fullName || trimmedFullName,
              storeId: responseData.storeId,
              store: responseData.store,
              canvasserId: responseData.id,
              employeeId: responseData.employeeId || trimmedCanvasserId,
            };
            window.localStorage.setItem('authUser', JSON.stringify(updated));
            window.location.href = '/canvasser/home';
          }
        } catch {
          router.replace('/canvasser/home');
        }
      } else {
        router.replace('/canvasser/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save your details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
          <p className="text-sm text-gray-500">We need a few details to set up your Canvasser profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black placeholder:text-gray-500" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">Canvasser ID</label>
            <input type="text" value={canvasserId} onChange={(e) => { setCanvasserId(e.target.value); setCanvasserIdError(null); }} placeholder="Enter your Canvasser ID" className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black placeholder:text-gray-500" />
            {canvasserIdError && (
              <p className="text-sm text-red-600 mt-1">{canvasserIdError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">Store name</label>
            <div className="relative">
              <div className={`flex items-center gap-2 w-full px-4 py-4 rounded-lg bg-white cursor-text border transition-colors ${isStoreDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`} onClick={() => { if (!loadingStores && stores.length > 0) setIsStoreDropdownOpen(true); }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 text-xs">🏬</span>
                <input type="text" value={storeSearch} onChange={(e) => { setStoreSearch(e.target.value); setIsStoreDropdownOpen(true); }} onFocus={() => { if (!loadingStores && stores.length > 0) { setStoreSearch(''); setIsStoreDropdownOpen(true); } }} placeholder={loadingStores ? 'Loading stores...' : stores.length === 0 ? 'No stores available' : 'Type to search store name or city'} disabled={loadingStores || stores.length === 0} className="flex-1 border-none outline-none focus:outline-none focus:ring-0 text-lg text-black placeholder:text-gray-500 bg-transparent !outline-none !shadow-none" style={{ outline: 'none', boxShadow: 'none', border: 'none' }} />
                <button type="button" onClick={(e) => { e.stopPropagation(); if (loadingStores || stores.length === 0) return; if (!isStoreDropdownOpen) setStoreSearch(''); setIsStoreDropdownOpen((open) => !open); }} className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none">
                  <svg className={`w-4 h-4 transform transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              {isStoreDropdownOpen && !loadingStores && filteredStores.length > 0 && (
                <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                  {filteredStores.map((store) => {
                    const label = `${store.name}${store.city ? ` - ${store.city}` : ''}`;
                    return (
                      <button key={store.id} type="button" onClick={() => { setSelectedStoreId(store.id); setStoreSearch(label); setIsStoreDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 ${selectedStoreId === store.id ? 'bg-gray-100 font-semibold' : ''}`}>{label}</button>
                    );
                  })}
                </div>
              )}

              {isStoreDropdownOpen && !loadingStores && filteredStores.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">No stores match your search</div>
              )}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between">
            <button type="button" onClick={handleBack} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button type="submit" disabled={submitting} className="flex-1 ml-4 h-12 text-white rounded-full font-semibold text-base flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed" style={{ backgroundColor: '#5E1846' }}>{submitting ? 'Saving...' : 'Next'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
