'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaSignOutAlt } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { clientLogout } from '@/lib/clientLogout';

// Types for API response
interface SalesReportData {
  id: string;
  createdAt: string;
  submittedAt: string;
  imei: string;
  spotincentiveEarned: number;
  voucherCode?: string;
  isPaid: boolean;
  paidAt?: string;
  validationStatus: 'NOT_VALIDATED' | 'VALIDATED' | 'DISCARDED';
  approvedBySamsung: boolean;
  secUser: {
    secId: string;
    phone: string;
    name: string;
  };
  store: {
    id: string;
    storeName: string;
    city: string;
  };
  samsungSKU: {
    id: string;
    Category: string;
    ModelName: string;
  };
  plan: {
    id: string;
    planType: string;
    price: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    salesReports: SalesReportData[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
    summary: {
      totalReports: number;
      totalIncentiveEarned: number;
      totalIncentivePaid: number;
      uniqueSECs: number;
      uniqueStores: number;
    };
    filterOptions: {
      stores: Array<{ id: string; name: string; city?: string }>;
      plans: string[];
    };
  };
}

function formatDateWithTime(isoString: string) {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return {
    date: `${day}-${month}-${year}`,
    time: `${hours}:${minutes}`
  };
}

function StatCard({ title, value }: { title: string; value: string }) {
  const gradientMap: Record<string, string> = {
    'Active Stores': 'from-indigo-600 to-purple-600 shadow-[0_10px_40px_rgba(79,70,229,0.4)]',
    'SECs Active': 'from-emerald-600 to-teal-600 shadow-[0_10px_40px_rgba(16,185,129,0.4)]',
    'Reports Submitted': 'from-blue-600 to-cyan-600 shadow-[0_10px_40px_rgba(37,99,235,0.4)]',
    'Incentive Earned': 'from-amber-500 to-orange-600 shadow-[0_10px_40px_rgba(245,158,11,0.4)]',
    'Incentive Paid': 'from-rose-600 to-pink-600 shadow-[0_10px_40px_rgba(244,63,94,0.4)]',
  };

  const gradient = gradientMap[title] || 'from-slate-700 to-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.5)]';

  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 md:p-6 text-white transition-transform hover:translate-y-[-1px]`}
    >
      <div className="text-xs md:text-sm text-slate-100/80 mb-1">{title}</div>
      <div className="text-2xl md:text-3xl font-bold leading-tight">{value}</div>
    </div>
  );
}

export default function MonthlyIncentiveReport() {
  const [query, setQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const [validationFilter, setValidationFilter] = useState<'all' | 'not_validated' | 'validated' | 'discarded'>('all');
  const [startDate, setStartDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  // API data state
  const [data, setData] = useState<SalesReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0
  });
  const [summary, setSummary] = useState({
    totalReports: 0,
    totalIncentiveEarned: 0,
    totalIncentivePaid: 0,
    uniqueSECs: 0,
    uniqueStores: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    stores: [] as Array<{ id: string; name: string; city?: string }>,
    plans: [] as string[]
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(query && { query }),
        ...(storeFilter && { storeFilter }),
        ...(planFilter && { planFilter }),

        ...(validationFilter !== 'all' && { validationFilter }),
        ...(startDate && { startDate })
      });

      const response = await fetch(`/api/zopper-admin/monthly-incentive-report?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || `Failed to fetch data (${response.status})`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setData(result.data.salesReports);
        setPagination(result.data.pagination);
        setSummary(result.data.summary);
        setFilterOptions(result.data.filterOptions);
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
  }, [page, query, storeFilter, planFilter, validationFilter, startDate]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [query, storeFilter, planFilter, validationFilter, startDate]);

  // Handle validation actions
  const handleValidationAction = async (reportId: string, action: 'validate' | 'discard') => {
    try {
      const response = await fetch('/api/zopper-admin/monthly-incentive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, action }),
      });

      if (response.ok) {
        // Refresh data after successful action
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update report');
      }
    } catch (err) {
      setError('Failed to update report');
      console.error('Error updating report:', err);
    }
  };

  const exportExcel = () => {
    const exportData = data.map(report => ({
      'Report ID': report.id,
      'SEC Name': report.secUser.name || 'Not Set',
      'SEC ID': report.secUser.secId || 'Not Set',
      'SEC Phone': report.secUser.phone,
      'Store Name': report.store.storeName,
      'Store City': report.store.city,
      'Device Category': report.samsungSKU.Category,
      'Device Model': report.samsungSKU.ModelName,
      'Plan Type': report.plan.planType.replace(/_/g, ' '),
      'Plan Price': `₹${report.plan.price}`,
      'IMEI': report.imei,
      'Incentive Earned': `₹${report.spotincentiveEarned}`,
      'Payment Status': report.isPaid ? 'Paid' : 'Pending',
      'Validation Status': report.validationStatus.replace(/_/g, ' '),
      'Approved by Samsung': report.approvedBySamsung ? 'Yes' : 'No',
      'Submitted Date': formatDateWithTime(report.submittedAt).date,
      'Submitted Time': formatDateWithTime(report.submittedAt).time,
      'Voucher Code': report.voucherCode || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, `monthly-incentive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Monthly Incentive Report</h1>
            <p className="text-sm text-neutral-400">
              Validated: {data.filter(r => r.validationStatus === 'VALIDATED').length} | 
              Not Validated: {data.filter(r => r.validationStatus === 'NOT_VALIDATED').length} | 
              Discarded: {data.filter(r => r.validationStatus === 'DISCARDED').length}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
          </div>

          <button
            onClick={() => clientLogout('/login/role')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg self-start"
          >
            <FaSignOutAlt size={12} />
            Logout
          </button>
        </header>

        {/* Key metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Active Stores" value={summary.uniqueStores.toString()} />
          <StatCard title="SECs Active" value={summary.uniqueSECs.toString()} />
          <StatCard title="Reports Submitted" value={summary.totalReports.toString()} />
          <StatCard title="Incentive Earned" value={`₹${summary.totalIncentiveEarned}`} />
          <StatCard title="Incentive Paid" value={`₹${summary.totalIncentivePaid}`} />
        </section>

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-3">
          <input
            className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search SEC Name / Store / Device / IMEI"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <input
            type="date"
            className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Filter by Date"
          />

          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="">All Stores</option>
            {filterOptions.stores.map((store) => (
              <option key={store.id} value={store.name}>
                {store.name} {store.city && `- ${store.city}`}
              </option>
            ))}
          </select>

          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">All Plans</option>
            {filterOptions.plans.map((plan) => (
              <option key={plan} value={plan}>
                {plan.replace(/_/g, ' ')}
              </option>
            ))}
          </select>



          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={validationFilter}
            onChange={(e) =>
              setValidationFilter(e.target.value as 'all' | 'not_validated' | 'validated' | 'discarded')
            }
          >
            <option value="all">All Validation Status</option>
            <option value="not_validated">Not Validated</option>
            <option value="validated">Validated</option>
            <option value="discarded">Discarded</option>
          </select>

          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-[0_10px_30px_rgba(16,185,129,0.4)]"
          >
            <FaDownload size={14} />
            Export
          </button>
        </section>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Loading reports...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
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

        {/* Table */}
        {!loading && !error && (
          <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left">
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Date of Sale
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    SEC Name
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Store Name
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Device Name
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Plan Type
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    IMEI
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Validation Status
                  </th>
                  <th className="p-3 md:p-4 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-neutral-500">
                      No sales reports found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  data.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="p-3 md:p-4 text-neutral-900 text-sm">
                        <div>{formatDateWithTime(r.createdAt).date}</div>
                        <div className="text-neutral-500 text-xs">
                          {formatDateWithTime(r.createdAt).time}
                        </div>
                      </td>
                      <td className="p-3 md:p-4 text-neutral-700 text-sm">
                        <div>{formatDateWithTime(r.submittedAt).date}</div>
                        <div className="text-neutral-500 text-xs">
                          {formatDateWithTime(r.submittedAt).time}
                        </div>
                      </td>
                      <td className="p-3 md:p-4 text-neutral-900 text-sm font-medium">
                        <div>{r.secUser.name}</div>
                        <div className="text-neutral-500 text-xs">{r.secUser.phone}</div>
                      </td>
                      <td className="p-3 md:p-4 text-neutral-900 text-sm">{r.store.storeName}</td>
                      <td className="p-3 md:p-4 text-neutral-700 text-sm">
                        {r.samsungSKU.ModelName}
                      </td>
                      <td className="p-3 md:p-4 text-neutral-700 text-sm">{r.plan.planType.replace(/_/g, ' ')}</td>
                      <td className="p-3 md:p-4 text-neutral-500 text-xs font-mono">
                        {r.imei}
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="space-y-1">
                          {r.validationStatus === 'NOT_VALIDATED' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              Not Validated
                            </span>
                          )}
                          {r.validationStatus === 'VALIDATED' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Validated
                            </span>
                          )}
                          {r.validationStatus === 'DISCARDED' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Discarded
                            </span>
                          )}
                          {r.approvedBySamsung && (
                            <div className="text-xs text-green-600 font-medium">
                              Approved by Samsung
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 md:p-4">
                        {r.validationStatus === 'NOT_VALIDATED' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleValidationAction(r.id, 'validate')}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              Validate
                            </button>
                            <button
                              onClick={() => handleValidationAction(r.id, 'discard')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              Discard
                            </button>
                          </div>
                        ) : r.validationStatus === 'VALIDATED' ? (
                          <div className="flex gap-2">
                            <span className="px-2 py-1 text-xs text-blue-700 bg-blue-50 rounded">
                              Validated
                            </span>
                            <button
                              onClick={() => handleValidationAction(r.id, 'discard')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              Discard
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Discarded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 text-sm text-neutral-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-neutral-700 rounded-lg disabled:opacity-40 text-neutral-100 bg-neutral-900 hover:bg-neutral-800"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-neutral-700 rounded-lg disabled:opacity-40 text-neutral-100 bg-neutral-900 hover:bg-neutral-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
