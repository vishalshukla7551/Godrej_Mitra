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

interface FilterOptions {
  stores: Array<{ id: string; name: string; city: string | null }>;
  plans: string[];
  devices: string[];
}

type ReportTab = 'monthly' | 'spot';

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('spot');
  const [planSearch, setPlanSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState<Summary>({
    activeStores: 0,
    activeSECs: 0,
    totalReports: 0,
    paidCount: 0,
    unpaidCount: 0
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stores: [],
    plans: [],
    devices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (activeTab === 'monthly') {
        if (planSearch) params.append('planType', planSearch);
        if (storeSearch) params.append('store', storeSearch);
        if (deviceSearch) params.append('device', deviceSearch);
        if (dateFilter) params.append('date', dateFilter);
      } else {
        if (planSearch) params.append('planFilter', planSearch);
        if (storeSearch) params.append('storeFilter', storeSearch);
        if (deviceSearch) params.append('deviceFilter', deviceSearch);
        if (dateFilter) params.append('date', dateFilter);
      }

      const endpoint = activeTab === 'monthly' ? '/api/zsm/monthly-report' : '/api/zsm/report';
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch data (${response.status}): ${errorData.error || response.statusText}`);
      }
      const result = await response.json();
      
      if (result.success) {
        if (activeTab === 'monthly') {
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
            incentive: 0,
            isPaid: false
          })));
          setSummary({
            activeStores: result.data.summary.uniqueStores || 0,
            activeSECs: 0,
            totalReports: result.data.summary.totalReports || 0,
            paidCount: 0,
            unpaidCount: 0
          });
          if (result.data.filterOptions) {
            setFilterOptions(result.data.filterOptions);
          }
        } else {
          setReports(result.data.reports);
          setSummary(result.data.summary);
          if (result.data.filterOptions) {
            setFilterOptions(result.data.filterOptions);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [activeTab, planSearch, storeSearch, deviceSearch, dateFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const clearFilters = () => {
    setPlanSearch("");
    setStoreSearch("");
    setDeviceSearch("");
    setDateFilter("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <header className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Report Page</h1>
            <p className="text-sm text-neutral-400">Incentives Summary — Paid: {summary.paidCount} | Unpaid: {summary.unpaidCount}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>Live
              </span>
            </div>
          </div>
          <button onClick={() => clientLogout('/login/role')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Logout</span>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('monthly')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>Monthly Report</button>
          <button onClick={() => setActiveTab('spot')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'spot' ? 'bg-blue-600 text-white shadow-lg' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>Spot Report</button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Plan Filter */}
          <select 
            value={planSearch} 
            onChange={(e) => setPlanSearch(e.target.value)} 
            className="appearance-none bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="">All Plans</option>
            {filterOptions.plans.map((plan) => (
              <option key={plan} value={plan}>{plan.replace(/_/g, ' ')}</option>
            ))}
          </select>
          
          {/* Store Filter */}
          <select 
            value={storeSearch} 
            onChange={(e) => setStoreSearch(e.target.value)} 
            className="appearance-none bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
          >
            <option value="">All Stores</option>
            {filterOptions.stores.map((store) => (
              <option key={store.id} value={store.name}>{store.name} {store.city && `- ${store.city}`}</option>
            ))}
          </select>
          
          {/* Device Filter */}
          <select 
            value={deviceSearch} 
            onChange={(e) => setDeviceSearch(e.target.value)} 
            className="appearance-none bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]"
          >
            <option value="">All Devices</option>
            {filterOptions.devices.map((device) => (
              <option key={device} value={device}>{device}</option>
            ))}
          </select>
          
          {/* Clear Filters */}
          <button 
            onClick={clearFilters}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Content */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading reports...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 mb-6">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm">Retry</button>
        </div>
      )}
      {!loading && !error && (
        <>
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
                    <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {reports.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-neutral-500">No reports found.</td></tr>
                  ) : (
                    reports.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50 transition">
                        <td className="text-neutral-600 text-sm p-4">{formatDate(row.dateOfSale)}</td>
                        <td className="text-neutral-900 text-sm p-4">
                          <div>{row.storeName}</div>
                          {row.storeCity && <div className="text-xs text-neutral-500">{row.storeCity}</div>}
                        </td>
                        <td className="text-neutral-600 text-sm p-4">
                          <div>{row.deviceName}</div>
                          <div className="text-xs text-neutral-500">{row.deviceCategory}</div>
                        </td>
                        <td className="text-neutral-600 text-sm p-4">{row.planType.replace(/_/g, ' ')}</td>
                        <td className="text-neutral-500 text-xs font-mono p-4">{row.imei}</td>
                        <td className="p-4">
                          {row.isPaid ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
                          )}
                        </td>
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
