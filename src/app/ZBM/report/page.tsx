"use client";

import { useState, useEffect } from "react";
import { clientLogout } from '@/lib/clientLogout';

interface ReportData {
  id: string;
  dateOfSale: string;
  secId: string;
  secName: string;
  secPhone: string;
  storeName: string;
  storeCity: string;
  deviceName: string;
  deviceCategory: string;
  planType: string;
  imei: string;
  incentive: number;
  isPaid: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    reports: ReportData[];
    summary: {
      activeStores: number;
      activeSECs: number;
      totalReports: number;
      paidCount: number;
      unpaidCount: number;
    };
  };
}

type ReportTab = 'monthly' | 'spot';

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('spot');
  
  // Text values actually sent to the API as filters
  const [planFilter, setPlanFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");

  // Dropdown state
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [planOptions, setPlanOptions] = useState<string[]>([]);
  const [storeOptions, setStoreOptions] = useState<string[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<string[]>([]);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    activeStores: 0,
    activeSECs: 0,
    totalReports: 0,
    paidCount: 0,
    unpaidCount: 0
  });



  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        ...(planFilter && { planFilter }),
        ...(storeFilter && { storeFilter }),
        ...(deviceFilter && { deviceFilter })
      });

      const response = await fetch(`/api/zbm/report?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setData(result.data.reports);
        setSummary(result.data.summary);

        // On initial load, derive unique filter options for the dropdowns
        if (!filtersInitialized) {
          const reports = result.data.reports;

          const uniquePlans = Array.from(
            new Set(reports.map((r) => r.planType))
          );
          const uniqueStores = Array.from(
            new Set(reports.map((r) => r.storeName))
          );
          const uniqueDevices = Array.from(
            new Set(reports.map((r) => r.deviceName))
          );

          setPlanOptions(uniquePlans);
          setStoreOptions(uniqueStores);
          setDeviceOptions(uniqueDevices);
          setFiltersInitialized(true);
        }
      } else {
        throw new Error('API returned error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };



  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchData();
  }, [planFilter, storeFilter, deviceFilter]);

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-10">
      <header className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Report Page</h1>
            <p className="text-sm text-neutral-400">
              Incentives Summary — No of Incentive Paid: {summary.paidCount} | Unpaid: {summary.unpaidCount}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Live
              </span>
            </div>
          </div>

          {/* Utilities */}
          <div className="flex items-center gap-3">
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
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setActiveTab('spot')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'spot'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            Spot Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Plan Type Filter - searchable dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Plan Type"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              onFocus={() => setShowPlanDropdown(true)}
              onBlur={() => setTimeout(() => setShowPlanDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-neutral-750 transition w-48"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showPlanDropdown && planOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {planOptions
                  .filter((plan) =>
                    plan.toLowerCase().includes(planFilter.toLowerCase())
                  )
                  .map((plan) => (
                    <div
                      key={plan}
                      onMouseDown={() => {
                        setPlanFilter(plan);
                        setShowPlanDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                    >
                      {plan.replace(/_/g, ' ')}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Store Filter - searchable dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Store"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              onFocus={() => setShowStoreDropdown(true)}
              onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-750 transition w-64"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showStoreDropdown && storeOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {storeOptions
                  .filter((store) =>
                    store.toLowerCase().includes(storeFilter.toLowerCase())
                  )
                  .map((store) => (
                    <div
                      key={store}
                      onMouseDown={() => {
                        setStoreFilter(store);
                        setShowStoreDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                    >
                      {store}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Device Filter - searchable dropdown */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Device"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              onFocus={() => setShowDeviceDropdown(true)}
              onBlur={() => setTimeout(() => setShowDeviceDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-neutral-750 transition w-56"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showDeviceDropdown && deviceOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {deviceOptions
                  .filter((device) =>
                    device.toLowerCase().includes(deviceFilter.toLowerCase())
                  )
                  .map((device) => (
                    <div
                      key={device}
                      onMouseDown={() => {
                        setDeviceFilter(device);
                        setShowDeviceDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                    >
                      {device}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Monthly Report Tab Content */}
      {activeTab === 'monthly' && (
        <>
          {/* Key Metrics */}
          <div className="max-w-6xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(99,102,241,0.3)]">
                <h3 className="text-white text-4xl font-bold mb-2">{summary.activeStores}</h3>
                <p className="text-indigo-100 text-sm font-medium">Active Stores</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(16,185,129,0.3)]">
                <h3 className="text-white text-4xl font-bold mb-2">{summary.activeSECs}</h3>
                <p className="text-emerald-100 text-sm font-medium">SECs Active</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(37,99,235,0.3)]">
                <h3 className="text-white text-4xl font-bold mb-2">{summary.totalReports}</h3>
                <p className="text-blue-100 text-sm font-medium">Reports Submitted</p>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Loading reports...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 mb-6">
              <p className="font-semibold">Error loading data:</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Transactions Table */}
          {!loading && !error && (
            <div className="max-w-7xl">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Date of Sale</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">SEC ID</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Store Name</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Device Name</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Plan Type</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">IMEI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                          No sales reports found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      data.map((row) => (
                        <tr key={row.id} className="hover:bg-neutral-50 transition">
                          <td className="text-neutral-600 text-sm p-4">{formatDate(row.dateOfSale)}</td>
                          <td className="text-neutral-900 text-sm font-medium p-4">
                            <div>{row.secName}</div>
                            <div className="text-neutral-500 text-xs">{row.secPhone}</div>
                          </td>
                          <td className="text-neutral-900 text-sm p-4">
                            <div>{row.storeName}</div>
                            {row.storeCity && <div className="text-neutral-500 text-xs">{row.storeCity}</div>}
                          </td>
                          <td className="text-neutral-600 text-sm p-4">{row.deviceName}</td>
                          <td className="text-neutral-600 text-sm p-4">{row.planType.replace(/_/g, ' ')}</td>
                          <td className="text-neutral-500 text-xs font-mono p-4">{row.imei}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Spot Report Tab Content */}
      {activeTab === 'spot' && (
        <>
          {/* Key Metrics */}
          <div className="max-w-6xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(99,102,241,0.3)]">
                <h3 className="text-white text-4xl font-bold mb-2">{summary.activeStores}</h3>
                <p className="text-indigo-100 text-sm font-medium">Active Stores</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(16,185,129,0.3)]">
                <h3 className="text-white text-4xl font-bold mb-2">{summary.activeSECs}</h3>
                <p className="text-emerald-100 text-sm font-medium">SECs Active</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(37,99,235,0.3)]">
                <h3 className="text-white text-4xl font-bold mb-2">{summary.totalReports}</h3>
                <p className="text-blue-100 text-sm font-medium">Reports Submitted</p>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Loading reports...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 mb-6">
              <p className="font-semibold">Error loading data:</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Transactions Table */}
          {!loading && !error && (
            <div className="max-w-7xl">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Date of Sale</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">SEC ID</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Store Name</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Device Name</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Plan Type</th>
                      <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">IMEI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                          No sales reports found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      data.map((row) => (
                        <tr key={row.id} className="hover:bg-neutral-50 transition">
                          <td className="text-neutral-600 text-sm p-4">{formatDate(row.dateOfSale)}</td>
                          <td className="text-neutral-900 text-sm font-medium p-4">
                            <div>{row.secName}</div>
                            <div className="text-neutral-500 text-xs">{row.secPhone}</div>
                          </td>
                          <td className="text-neutral-900 text-sm p-4">
                            <div>{row.storeName}</div>
                            {row.storeCity && <div className="text-neutral-500 text-xs">{row.storeCity}</div>}
                          </td>
                          <td className="text-neutral-600 text-sm p-4">{row.deviceName}</td>
                          <td className="text-neutral-600 text-sm p-4">{row.planType.replace(/_/g, ' ')}</td>
                          <td className="text-neutral-500 text-xs font-mono p-4">{row.imei}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
