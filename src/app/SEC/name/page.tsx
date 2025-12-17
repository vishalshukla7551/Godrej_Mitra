"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectNameToOnboarding() {
  const router = useRouter();

  useEffect(() => {
    // Keep backward-compatible route available but forward to the new onboarding page
    if (typeof window !== 'undefined') {
      window.location.href = '/SEC/onboarding';
    } else {
      router.replace('/SEC/onboarding');
    }
  }, [router]);

  return null;
}
                  isStoreDropdownOpen ? 'border-gray-900 ring-2 ring-gray-900' : 'border-gray-300'
                }`}
                onClick={() => {
                  if (!loadingStores && stores.length > 0) {
                    setIsStoreDropdownOpen(true);
                  }
                }}
              >
                {/* Store icon */}
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 text-xs">
                  🏬
                </span>
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => {
                    setStoreSearch(e.target.value);
                    setIsStoreDropdownOpen(true);
                  }}
                  onFocus={(e) => {
                    if (!loadingStores && stores.length > 0) {
                      // Clear search to show all stores when focusing
                      setStoreSearch('');
                      setIsStoreDropdownOpen(true);
                    }
                  }}
                  placeholder={
                    loadingStores
                      ? 'Loading stores...'
                      : stores.length === 0
                      ? 'No stores available'
                      : 'Type to search store name or city'
                  }
                  disabled={loadingStores || stores.length === 0}
                  className="flex-1 border-none outline-none text-lg text-black placeholder:text-gray-500 bg-transparent"
                />
                {/* Dropdown arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (loadingStores || stores.length === 0) return;
                    // Clear search to show all stores when clicking arrow
                    if (!isStoreDropdownOpen) {
                      setStoreSearch('');
                    }
                    setIsStoreDropdownOpen((open) => !open);
                  }}
                  className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    className={`w-4 h-4 transform transition-transform ${
                      isStoreDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Dropdown list under the same column */}
              {isStoreDropdownOpen && !loadingStores && filteredStores.length > 0 && (
                <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                  {filteredStores.map((store) => {
                    const label = `${store.name}${store.city ? ` - ${store.city}` : ''}`;
                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          setSelectedStoreId(store.id);
                          setStoreSearch(label);
                          setIsStoreDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 ${
                          selectedStoreId === store.id ? 'bg-gray-100 font-semibold' : ''
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {isStoreDropdownOpen && !loadingStores && filteredStores.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                  No stores match your search
                </div>
              )}
            </div>
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
