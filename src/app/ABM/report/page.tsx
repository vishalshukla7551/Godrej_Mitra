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

interface Summary {
  activeStores: number;
  activeSECs: number;
  totalReports: number;
  paidCount: number;
  unpaidCount: number;
}

type ReportTab = 'monthly' | 'spot';

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('spot');
  const [planSearch, setPlanSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState<Summary>({
    activeStores: 0,
    activeSECs: 0,
    totalReports: 0,
    paidCount: 0,
    unpaidCount: 0
  });
  const [loading, setLoading] = useState(true);

  const planTypes = ["ADLD", "COMBO"];
  const [stores, setStores] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
  }, [activeTab, planSearch, storeSearch, deviceSearch]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Use different parameter names based on the API
      if (activeTab === 'monthly') {
        if (planSearch && planTypes.includes(planSearch)) {
          params.append('planType', planSearch + '_1_YR');
        }
        if (storeSearch) {
          params.append('store', storeSearch);
        }
        if (deviceSearch) {
          params.append('device', deviceSearch);
        }
      } else {
        if (planSearch && planTypes.includes(planSearch)) {
          params.append('planFilter', planSearch);
        }
        if (storeSearch) {
          params.append('storeFilter', storeSearch);
        }
        if (deviceSearch) {
          params.append('deviceFilter', deviceSearch);
        }
      }

      // Use different API endpoints based on active tab
      const endpoint = activeTab === 'monthly' ? '/api/abm/monthly-report' : '/api/abm/report';
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        if (activeTab === 'monthly') {
          // Handle monthly report API response structure
          setReports(result.data.reports.map((r: any) => ({
            id: r.id,
            dateOfSale: r.dateOfSale,
            secId: r.secId || 'N/A',
            secName: r.secName,
            secPhone: r.secPhone,
            storeName: r.storeName,
            storeCity: r.storeCity,
            deviceName: r.deviceName,
            deviceCategory: r.deviceCategory,
            planType: r.planType,
            imei: r.imei,
            incentive: 0, // Monthly reports don't have incentive amounts
            isPaid: false
          })));
          setSummary({
            activeStores: result.data.summary.uniqueStores || 0,
            activeSECs: 0, // Monthly API doesn't track this
            totalReports: result.data.summary.totalReports || 0,
            paidCount: 0,
            unpaidCount: 0
          });
          
          // Extract filter options from monthly API
          const uniqueStores = result.data.filters?.availableStores || [];
          const uniqueDevices = result.data.filters?.availableDevices || [];
          setStores(uniqueStores);
          setDevices(uniqueDevices);
        } else {
          // Handle spot report API response structure (existing)
          setReports(result.data.reports);
          setSummary(result.data.summary);

          // Extract unique stores and devices for dropdowns
          const uniqueStores = [...new Set(result.data.reports.map((r: ReportData) => r.storeName))] as string[];
          const uniqueDevices = [...new Set(result.data.reports.map((r: ReportData) => r.deviceName))] as string[];
          setStores(uniqueStores);
          setDevices(uniqueDevices);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = planTypes.filter((plan) =>
    plan.toLowerCase().includes(planSearch.toLowerCase())
  );
  const filteredStores = stores.filter((store) =>
    store.toLowerCase().includes(storeSearch.toLowerCase())
  );
  const filteredDevices = devices.filter((device) =>
    device.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-10">
      <header className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Report Page</h1>
            <p className="text-sm text-neutral-400">Incentives Summary — No of Incentive Paid: {summary.paidCount} | Unpaid: {summary.unpaidCount}</p>
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
          {/* Plan Type Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Plan Type"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              onFocus={() => setShowPlanDropdown(true)}
              onBlur={() => setTimeout(() => setShowPlanDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-neutral-750 transition w-48"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showPlanDropdown && filteredPlans.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan}
                    onClick={() => {
                      setPlanSearch(plan);
                      setShowPlanDropdown(false);
                    }}
                    className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                  >
                    {plan}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Store Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Store"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              onFocus={() => setShowStoreDropdown(true)}
              onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-750 transition w-64"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showStoreDropdown && filteredStores.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredStores.map((store) => (
                  <div
                    key={store}
                    onClick={() => {
                      setStoreSearch(store);
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

          {/* Device Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Device"
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
              onFocus={() => setShowDeviceDropdown(true)}
              onBlur={() => setTimeout(() => setShowDeviceDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-neutral-750 transition w-56"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showDeviceDropdown && filteredDevices.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredDevices.map((device) => (
                  <div
                    key={device}
                    onClick={() => {
                      setDeviceSearch(device);
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

          {/* Transactions Table */}
          <div className="max-w-7xl">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Date of Sale</th>
                    <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Store Name</th>
                    <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Device Name</th>
                    <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Plan Type</th>
                    <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">IMEI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center text-neutral-500 text-sm p-8">
                        Loading reports...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-neutral-500 text-sm p-8">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-neutral-50 transition">
                        <td className="text-neutral-600 text-sm p-4">
                          {new Date(report.dateOfSale).toLocaleDateString()}
                        </td>
                        <td className="text-neutral-900 text-sm p-4">{report.storeName}</td>
                        <td className="text-neutral-600 text-sm p-4">{report.deviceName}</td>
                        <td className="text-neutral-600 text-sm p-4">{report.planType}</td>
                        <td className="text-neutral-500 text-xs font-mono p-4">{report.imei}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

      {/* Transactions Table */}
      <div className="max-w-7xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Date of Sale</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Store Name</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Device Name</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Plan Type</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">IMEI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-neutral-500 text-sm p-8">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-neutral-500 text-sm p-8">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-neutral-50 transition">
                    <td className="text-neutral-600 text-sm p-4">
                      {new Date(report.dateOfSale).toLocaleDateString()}
                    </td>
                    <td className="text-neutral-900 text-sm p-4">{report.storeName}</td>
                    <td className="text-neutral-600 text-sm p-4">{report.deviceName}</td>
                    <td className="text-neutral-600 text-sm p-4">{report.planType}</td>
                    <td className="text-neutral-500 text-xs font-mono p-4">{report.imei}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
