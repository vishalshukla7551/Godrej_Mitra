"use client";

import { useState, useEffect } from "react";
import { clientLogout } from '@/lib/clientLogout';

interface SpotReport {
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
  paidAt?: string;
  voucherCode?: string;
}

interface Summary {
  activeStores: number;
  activeSECs: number;
  totalReports: number;
  totalIncentive: number;
  paidCount: number;
  unpaidCount: number;
  totalPendingIncentive: number;
}

export default function SpotIncentivePage() {
  const [planFilter, setPlanFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  const [reports, setReports] = useState<SpotReport[]>([]);
  const [summary, setSummary] = useState<Summary>({
    activeStores: 0,
    activeSECs: 0,
    totalReports: 0,
    totalIncentive: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalPendingIncentive: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        ...(planFilter && { planFilter }),
        ...(storeFilter && { storeFilter }),
        ...(deviceFilter && { deviceFilter }),
        ...(dateFilter && { dateFilter })
      });
      const response = await fetch(`/api/ase/spot-incentive?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      if (result.success) {
        setReports(result.data.reports);
        setSummary(result.data.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [planFilter, storeFilter, deviceFilter, dateFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <header className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Spot Incentive Reports</h1>
            <p className="text-sm text-neutral-400">
              View spot incentive reports for your assigned stores
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>Live
              </span>
            </div>
          </div>
          <button 
            onClick={() => clientLogout('/login/role')} 
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 shadow-lg">
            <h3 className="text-white text-2xl font-bold mb-1">{formatCurrency(summary.totalIncentive)}</h3>
            <p className="text-blue-100 text-xs font-medium">Total Incentive</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-4 shadow-lg">
            <h3 className="text-white text-2xl font-bold mb-1">{summary.totalReports}</h3>
            <p className="text-emerald-100 text-xs font-medium">Total Reports</p>
          </div>
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl p-4 shadow-lg">
            <h3 className="text-white text-2xl font-bold mb-1">{formatCurrency(summary.totalPendingIncentive)}</h3>
            <p className="text-amber-100 text-xs font-medium">Pending Payment</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl p-4 shadow-lg">
            <h3 className="text-white text-2xl font-bold mb-1">{summary.activeStores}</h3>
            <p className="text-purple-100 text-xs font-medium">Active Stores</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 bg-neutral-800/50 p-4 rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Filter by Plan Type" 
              value={planFilter} 
              onChange={(e) => setPlanFilter(e.target.value)} 
              className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Filter by Store" 
              value={storeFilter} 
              onChange={(e) => setStoreFilter(e.target.value)} 
              className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Filter by Device" 
              value={deviceFilter} 
              onChange={(e) => setDeviceFilter(e.target.value)} 
              className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" 
            />
          </div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading reports...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 mb-6">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchData} 
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reports Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Date of Sale</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">SEC Details</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Store</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Device</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Plan</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">IMEI</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Incentive</th>
                  <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-neutral-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-neutral-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p className="text-lg font-medium">No spot incentive reports found</p>
                        <p className="text-sm">Try adjusting your filters or check back later</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50 transition">
                      <td className="text-neutral-600 text-sm p-4">{formatDate(row.dateOfSale)}</td>
                      <td className="text-neutral-900 text-sm p-4">
                        <div className="font-medium">{row.secName || 'N/A'}</div>
                        <div className="text-xs text-neutral-500">{row.secPhone}</div>
                        <div className="text-xs text-neutral-500">ID: {row.secId}</div>
                      </td>
                      <td className="text-neutral-900 text-sm p-4">
                        <div className="font-medium">{row.storeName}</div>
                        {row.storeCity && <div className="text-xs text-neutral-500">{row.storeCity}</div>}
                      </td>
                      <td className="text-neutral-600 text-sm p-4">
                        <div className="font-medium">{row.deviceName}</div>
                        <div className="text-xs text-neutral-500">{row.deviceCategory}</div>
                      </td>
                      <td className="text-neutral-600 text-sm p-4">{row.planType.replace(/_/g, ' ')}</td>
                      <td className="text-neutral-500 text-xs font-mono p-4 max-w-[120px] truncate" title={row.imei}>{row.imei}</td>
                      <td className="text-neutral-900 font-medium p-4">{formatCurrency(row.incentive)}</td>
                      <td className="p-4">
                        {row.isPaid ? (
                          <div className="flex flex-col">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 inline-flex items-center w-fit">
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                              Paid
                            </span>
                            {row.paidAt && (
                              <span className="text-xs text-neutral-500 mt-1">
                                {formatDate(row.paidAt)}
                              </span>
                            )}
                            {row.voucherCode && (
                              <span className="text-xs text-neutral-500 mt-1" title={row.voucherCode}>
                                Voucher: {row.voucherCode.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 inline-flex items-center w-fit">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}