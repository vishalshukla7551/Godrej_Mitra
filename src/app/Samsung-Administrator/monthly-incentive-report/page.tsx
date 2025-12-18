'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

function formatCurrency(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

interface Report {
  id: string;
  imei: string;
  metadata: any;
  Date_of_sale: string;
  createdAt: string;
  updatedAt: string;
  secId: string;
  secName: string;
  secPhone: string;
  agencyName: string | null;
  storeId: string;
  storeName: string;
  storeCity: string | null;
  deviceId: string;
  deviceName: string;
  deviceCategory: string;
  devicePrice: number;
  planId: string;
  planType: string;
  planPrice: number;
}

interface Summary {
  totalReports: number;
  activeStores: number;
  activeSECs: number;
  totalPlanValue: number;
  averagePlanValue: number;
}

interface FilterOptions {
  stores: Array<{ id: string; name: string; city: string | null }>;
  planTypes: string[];
  devices: string[];
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function MonthlyIncentiveReportPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalReports: 0,
    activeStores: 0,
    activeSECs: 0,
    totalPlanValue: 0,
    averagePlanValue: 0
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stores: [],
    planTypes: [],
    devices: []
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterPlanType, setFilterPlanType] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', '50');
      
      if (filterSearch) params.append('search', filterSearch);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterStore) params.append('storeId', filterStore);
      if (filterDevice) params.append('deviceName', filterDevice);
      if (filterPlanType) params.append('planType', filterPlanType);

      const response = await fetch(`/api/samsung-admin/monthly-incentive-report?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();

      if (result.success) {
        setReports(result.data.reports);
        setSummary(result.data.summary);
        setFilterOptions(result.data.filters);
        setPagination(result.data.pagination);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filterSearch, filterStartDate, filterEndDate, filterStore, filterDevice, filterPlanType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilterSearch('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterStore('');
    setFilterDevice('');
    setFilterPlanType('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
        <div className="relative w-full h-[69px] bg-black border-b border-gray-800 overflow-hidden">
          <div className="absolute w-[72.83px] h-[69px] top-[-1px] left-[6px] rounded-[20px]"
            style={{ background: 'url(https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-11-14/N8vfr4GWX8.png) no-repeat center', backgroundSize: 'cover' }} />
          <div className="absolute flex items-center justify-center h-[26px] top-[21px] left-[23px] text-white font-bold text-[28px] leading-[26px] whitespace-nowrap z-[1]"
            style={{ fontFamily: 'Inter, sans-serif', width: '36px' }}>S</div>
          <div className="absolute flex items-start justify-start h-[31px] top-[7px] left-[87.938px] font-bold text-[26px] leading-[31px] whitespace-nowrap z-[3]"
            style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(90deg, #1d4ed8, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SalesDost</div>
          <div className="absolute flex items-start justify-start h-[25px] top-[38px] left-[92.938px] text-white font-medium text-[16px] leading-[25px] whitespace-nowrap z-[2]"
            style={{ fontFamily: 'Inter, sans-serif' }}>Safalta ka Sathi</div>
        </div>

        <nav className="p-3 flex-1">
          <Link href="/Samsung-Administrator" className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors mb-1 text-sm text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Home
          </Link>
          <Link href="/Samsung-Administrator/spot-incentive-report" className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors mb-1 text-sm text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Spot Incentive Report
          </Link>
          <Link href="/Samsung-Administrator/monthly-incentive-report" className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17ZM17 21V11H13V7H7V19H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="leading-tight">Monthly Incentive Report</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">Monthly Incentive Report</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-0.5">
                <span>Total Reports: <span className="font-semibold text-blue-600">{summary.totalReports}</span></span>
                <span>Active Stores: <span className="font-semibold text-green-600">{summary.activeStores}</span></span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>Live
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Updated: {lastUpdated || '--:--:--'}</span>
              <button onClick={fetchData} disabled={loading} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50">
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <Link href="/login/role" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Logout
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-5 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-5">
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
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(245,158,11,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">₹{formatCurrency(summary.totalPlanValue)}</h3>
              <p className="text-amber-100 text-sm font-medium">Total Plan Value</p>
            </div>
            <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(244,63,94,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">₹{formatCurrency(summary.averagePlanValue)}</h3>
              <p className="text-rose-100 text-sm font-medium">Average Plan Value</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-5 shadow-md mb-5">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">Filters</h3>
            <div className="grid grid-cols-7 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Search SEC/Store/IMEI</label>
                <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">End Date</label>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Store</label>
                <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Stores</option>
                  {filterOptions.stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name} {store.city && `- ${store.city}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Device</label>
                <select value={filterDevice} onChange={(e) => setFilterDevice(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Devices</option>
                  {filterOptions.devices.map((device) => (
                    <option key={device} value={device}>{device}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Plan Type</label>
                <select value={filterPlanType} onChange={(e) => setFilterPlanType(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Plans</option>
                  {filterOptions.planTypes.map((plan) => (
                    <option key={plan} value={plan}>{plan.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="w-full px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">Clear</button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={fetchData} className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">Retry</button>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-[11%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created At</th>
                    <th className="w-[9%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date of Sale</th>
                    <th className="w-[8%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SEC ID</th>
                    <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Store Name</th>
                    <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Device Name</th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plan Type</th>
                    <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IMEI</th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plan Price</th>
                    <th className="w-[8%] px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No reports found</td></tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-900">{report.createdAt}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{report.Date_of_sale}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{report.secId}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="font-semibold truncate">{report.storeName}</div>
                          {report.storeCity && <div className="text-xs text-gray-500">{report.storeCity}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="truncate">{report.deviceName}</div>
                          <div className="text-xs text-gray-500">{report.deviceCategory}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{report.planType.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-mono text-xs">{report.imei}</td>
                        <td className="px-4 py-4 text-sm font-bold text-blue-600">₹{report.planPrice}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                            Submitted
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePageChange(pagination.page - 1)} disabled={!pagination.hasPrev}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                  <span className="px-3 py-1 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                  <button onClick={() => handlePageChange(pagination.page + 1)} disabled={!pagination.hasNext}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}