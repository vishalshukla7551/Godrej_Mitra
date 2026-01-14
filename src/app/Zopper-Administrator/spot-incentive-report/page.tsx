'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaSignOutAlt, FaSpinner, FaInfoCircle, FaTimes } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { clientLogout } from '@/lib/clientLogout';

interface SpotIncentiveReport {
  id: string;
  createdAt: string;
  submittedAt: string;
  serialNumber: string;
  planPrice: number;
  incentiveEarned: number;
  isPaid: boolean;
  paidAt?: string;
  voucherCode: string;
  isCampaignActive: boolean;
  customerName: string;
  customerPhoneNumber: string;
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

interface MRIncentive {
  id: string;
  category: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number | null;
  incentive1Year: number;
  incentive2Year: number;
  incentive3Year: number;
  incentive4Year: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    reports: SpotIncentiveReport[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      totalReports: number;
      activeStores: number;
      activeSECs: number;
      totalIncentiveEarned: number;
      totalIncentivePaid: number;
      totalIncentivePending: number;
    };
    filters: {
      stores: Array<{ id: string; name: string; city: string }>;
      planTypes: string[];
    };
    mrIncentives?: MRIncentive[];
  };
}

function formatDateWithTime(ts: string) {
  const [date, time] = ts.split(' ');
  const [y, m, d] = date.split('-');
  return { date: `${d}-${m}-${y}`, time };
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

export default function SpotIncentiveReport() {
  const [query, setQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [startDate, setStartDate] = useState('');
  const [page, setPage] = useState(1);
  const [showIncentives, setShowIncentives] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 50;

  // API state
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle Mark Paid action
  const handleMarkPaid = async (reportId: string) => {
    try {
      const response = await fetch(`/api/zopper-administrator/spot-incentive-report/${reportId}/mark-paid`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh data after successful action
        fetchData();
      } else {
        alert('Failed to mark as paid');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error marking as paid');
    }
  };

  // Handle Discard action
  const handleDiscard = async (reportId: string) => {
    if (confirm('Are you sure you want to discard this report?')) {
      try {
        const response = await fetch(`/api/zopper-administrator/spot-incentive-report/${reportId}/discard`, {
          method: 'POST',
        });

        if (response.ok) {
          // Refresh data after successful action
          fetchData();
        } else {
          alert('Failed to discard report');
        }
      } catch (error) {
        console.error('Error discarding report:', error);
        alert('Error discarding report');
      }
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (query) params.append('search', query);
      if (storeFilter) params.append('storeId', storeFilter);
      if (planFilter) params.append('planType', planFilter);
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);
      if (startDate) {
        params.append('startDate', startDate);
        params.append('endDate', startDate);
      }

      const response = await fetch(`/api/zopper-administrator/spot-incentive-report?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || `Failed to fetch data (${response.status})`);
      }

      const result: ApiResponse = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error('API returned error');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchData();
  }, [page, query, storeFilter, planFilter, paymentFilter, startDate]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, storeFilter, planFilter, paymentFilter, startDate]);

  const reports = data?.reports || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, hasNext: false, hasPrev: false };
  const summary = data?.summary || { activeStores: 0, activeSECs: 0, totalReports: 0, totalIncentiveEarned: 0, totalIncentivePaid: 0 };
  const filters = data?.filters || { stores: [], planTypes: [] };
  const mrIncentives = data?.mrIncentives || [];

  const exportExcel = async () => {
    try {
      setIsExporting(true);

      // Build the same filter parameters but without pagination
      const params = new URLSearchParams({
        limit: '999999', // Get all records
        page: '1'
      });

      if (query) params.append('search', query);
      if (storeFilter) params.append('storeId', storeFilter);
      if (planFilter) params.append('planType', planFilter);
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);
      if (startDate) {
        params.append('startDate', startDate);
        params.append('endDate', startDate);
      }

      // Fetch all data for export
      const response = await fetch(`/api/zopper-administrator/spot-incentive-report?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }

      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error('API returned error');
      }

      const allReports = result.data.reports;

      // Create export data from all reports
      const exportData = allReports.map(report => ({
        'Report ID': report.id,
        'Canvasser ID': report.secUser.secId || 'Not Set',
        'Canvasser Phone': report.secUser.phone,
        'Canvasser Name': report.secUser.name || 'Not Set',
        'Store Name': report.store.storeName,
        'Store City': report.store.city,
        'Customer Name': report.customerName || '',
        'Customer Phone': report.customerPhoneNumber || '',
        'Device Category': report.samsungSKU.Category,
        'Device Model': report.samsungSKU.ModelName,
        'Plan Type': report.plan.planType.replace(/_/g, ' '),
        'Plan Price': `₹${report.planPrice}`,
        'Serial Number': report.serialNumber,
        'Incentive Earned': `₹${report.incentiveEarned}`,
        'Payment Status': report.isPaid ? 'Paid' : 'Pending',
        'Submitted Date': formatDateWithTime(report.submittedAt).date,
        'Submitted Time': formatDateWithTime(report.submittedAt).time,
        'Voucher Code': report.voucherCode || '',
        'Campaign Active': report.isCampaignActive ? 'Yes' : 'No',
        'Paid Date': report.paidAt ? formatDateWithTime(report.paidAt).date : '',
        'Action Required': report.isPaid ? 'None' : 'Mark Paid Available'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Spot Incentive Report');
      
      // Add summary info as filename
      const totalRecords = exportData.length;
      const filename = `spot-incentive-report-${totalRecords}-records-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, filename);

      // Show success message with filter info
      let filterInfo = '';
      if (query || storeFilter || planFilter || paymentFilter !== 'all' || startDate) {
        const filtersList = [];
        if (query) filtersList.push(`Search: "${query}"`);
        if (storeFilter) {
          const storeName = filters.stores.find(s => s.id === storeFilter)?.name || 'Unknown Store';
          filtersList.push(`Store: ${storeName}`);
        }
        if (planFilter) filtersList.push(`Plan: ${planFilter.replace(/_/g, ' ')}`);
        if (paymentFilter !== 'all') filtersList.push(`Payment: ${paymentFilter}`);
        if (startDate) filtersList.push(`Date: ${startDate}`);
        filterInfo = ` (Filters applied: ${filtersList.join(', ')})`;
      }

      alert(`Successfully exported ${totalRecords} records to Excel!${filterInfo}`);

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <div className="w-full space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-3">Spot Incentive Report</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm text-neutral-400">
                Paid: {reports.filter(r => r.isPaid).length} | Unpaid: {
                  reports.filter(r => !r.isPaid).length
                }
              </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live
              </span>
              {summary.totalReports > 0 && (
                <span className="text-xs text-neutral-400">
                  {summary.totalReports.toLocaleString()} total records
                </span>
              )}
            </div>

                <button
                  onClick={() => setShowIncentives(true)}
                  className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <FaInfoCircle />
                  View Incentive Rules
                </button>
              </div>
          </div>

          <button
            onClick={() => clientLogout('/login/role')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
          >
            <FaSignOutAlt size={12} />
            Logout
          </button>
        </header>

        {/* Key metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Active Stores" value={summary.activeStores.toString()} />
          <StatCard title="SECs Active" value={summary.activeSECs.toString()} />
          <StatCard title="Reports Submitted" value={summary.totalReports.toString()} />
          <StatCard title="Incentive Earned" value={`₹${summary.totalIncentiveEarned.toLocaleString('en-IN')}`} />
          <StatCard title="Incentive Paid" value={`₹${summary.totalIncentivePaid.toLocaleString('en-IN')}`} />
        </section>

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-3">
          <input
            className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search Canvasser / Store / Device / Serial Number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            placeholder="Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="">All Stores</option>
            {filters.stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} - {store.city}
              </option>
            ))}
          </select>
          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">All Plans</option>
            {filters.planTypes.map((planType) => (
              <option key={planType} value={planType}>
                {planType.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            className="appearance-none bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-800"
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(e.target.value as 'all' | 'paid' | 'unpaid')
            }
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button
            onClick={exportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-[0_10px_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <FaSpinner className="animate-spin" size={14} />
                Exporting...
              </>
            ) : (
              <>
                <FaDownload size={14} />
                Export All
              </>
            )}
          </button>
        </section>

        {/* Table */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left">
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Timestamp
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Date of Sale
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[100px]">
                    Canvasser ID
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Store Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Customer Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Customer Phone
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider">
                    Device Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Plan Type
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[140px]">
                    Serial Number
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[100px]">
                    Incentive
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[80px]">
                    Status
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-neutral-500">
                      <FaSpinner className="animate-spin mx-auto mb-2" size={20} />
                      Loading reports...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-neutral-500">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((r: SpotIncentiveReport) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="p-2 md:p-3 text-neutral-900 text-sm">
                        <div className="text-xs">{formatDateWithTime(r.createdAt).date}</div>
                        <div className="text-neutral-500 text-xs">
                          {formatDateWithTime(r.createdAt).time}
                        </div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-700 text-sm">
                        <div className="text-xs">{formatDateWithTime(r.submittedAt).date}</div>
                        <div className="text-neutral-500 text-xs">
                          {formatDateWithTime(r.submittedAt).time}
                        </div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm font-medium">
                        <div className="truncate">{r.secUser.secId || 'Not Set'}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm">
                        <div className="truncate">{r.store.storeName}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm">
                        <div className="truncate">{r.customerName || 'Not Provided'}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm">
                        <div className="truncate">{r.customerPhoneNumber || 'Not Provided'}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-700 text-sm">
                        <div className="truncate">{r.samsungSKU.ModelName}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-700 text-xs">
                        <div className="truncate">{r.plan.planType.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-500 text-xs font-mono">
                        <div className="truncate">{r.serialNumber}</div>
                      </td>
                      <td className="p-2 md:p-3 text-emerald-600 text-sm font-semibold">
                        ₹{r.incentiveEarned}
                      </td>
                      <td className="p-2 md:p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${r.isPaid
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                            }`}
                        >
                          {r.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-2 md:p-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMarkPaid(r.id)}
                            disabled={r.isPaid}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${r.isPaid
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleDiscard(r.id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                          >
                            Discard
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {
          pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 text-sm text-neutral-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-neutral-700 rounded-lg disabled:opacity-40 text-neutral-100 bg-neutral-900 hover:bg-neutral-800"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-neutral-700 rounded-lg disabled:opacity-40 text-neutral-100 bg-neutral-900 hover:bg-neutral-800"
              >
                Next
              </button>
            </div>
          )
        }
      </div >

      {/* MR Incentive Rules Modal */}
      {showIncentives && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
              <h3 className="text-xl font-bold text-white">Incentive Rules</h3>
              <button
                onClick={() => setShowIncentives(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="overflow-auto p-0 max-h-[calc(90vh-60px)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3 text-slate-300 font-semibold border-b border-slate-700">Category</th>
                    <th className="p-3 text-slate-300 font-semibold border-b border-slate-700">Price Range</th>
                    <th className="p-3 text-slate-300 font-semibold border-b border-slate-700">1 Year</th>
                    <th className="p-3 text-slate-300 font-semibold border-b border-slate-700">2 Year</th>
                    <th className="p-3 text-slate-300 font-semibold border-b border-slate-700">3 Year</th>
                    <th className="p-3 text-slate-300 font-semibold border-b border-slate-700">4 Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {mrIncentives.length > 0 ? (
                    mrIncentives.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-800/50">
                        <td className="p-3 text-slate-300">{rule.category}</td>
                        <td className="p-3 text-slate-400 font-mono text-xs">{rule.priceRange}</td>
                        <td className="p-3 text-emerald-400 font-medium">₹{rule.incentive1Year}</td>
                        <td className="p-3 text-emerald-400 font-medium">₹{rule.incentive2Year}</td>
                        <td className="p-3 text-emerald-400 font-medium">₹{rule.incentive3Year}</td>
                        <td className="p-3 text-emerald-400 font-medium">₹{rule.incentive4Year}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No incentive rules found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
