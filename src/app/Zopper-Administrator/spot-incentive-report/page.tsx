'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaSignOutAlt, FaSpinner, FaInfoCircle, FaTimes, FaLock } from 'react-icons/fa';
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
  transactionMetadata?: {
    status?: 'SUCCESS' | 'PENDING_BALANCE' | 'PENDING';
    [key: string]: any;
  };
  canvasserUser: {
    canvasserId: string;
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
      activeCanvassers: number;
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
    'Active Canvassers': 'from-emerald-600 to-teal-600 shadow-[0_10px_40px_rgba(16,185,129,0.4)]',
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
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [isMarkingPaidBulk, setIsMarkingPaidBulk] = useState(false);
  const [isSendingReward, setIsSendingReward] = useState<string | null>(null);
  const [bulkSummary, setBulkSummary] = useState<any>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const pageSize = 50;

  // API state
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDiscardingBulk, setIsDiscardingBulk] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'send' | 'discard' | null>(null);

  // Handle Send Reward (bulk only)
  const handleSendReward = async () => {
    if (selectedReports.size === 0) {
      alert('Please select at least one report');
      return;
    }

    if (!confirm(`Send rewards for ${selectedReports.size} report(s)?`)) {
      return;
    }

    try {
      // First, send OTP
      setIsOtpLoading(true);
      setOtpError(null);
      setPendingRewardId('bulk'); // Mark as bulk operation
      
      const otpResponse = await fetch('/api/zopper-administrator/spot-incentive-report/send-reward-otp/send', {
        method: 'POST',
      });

      const otpResult = await otpResponse.json();

      if (!otpResponse.ok) {
        setOtpError(otpResult.error || 'Failed to send OTP');
        setIsOtpLoading(false);
        return;
      }

      // Show OTP modal only after successful OTP send
      setOtpPhone(otpResult.data.phone);
      setShowOtpModal(true);
      setOtpInput('');
      setIsOtpLoading(false);
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError('Failed to send OTP');
      setIsOtpLoading(false);
    }
  };

  // Handle Discard (bulk only)
  const handleDiscardBulk = async () => {
    if (selectedReports.size === 0) {
      alert('Please select at least one report');
      return;
    }

    if (!confirm(`Discard ${selectedReports.size} report(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDiscardingBulk(true);
      const reportIds = Array.from(selectedReports);
      
      // Discard reports using individual API calls
      const results = await Promise.allSettled(
        reportIds.map(id =>
          fetch(`/api/zopper-administrator/spot-incentive-report/${id}/discard`, {
            method: 'POST',
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length;
      const failed = results.length - successful;

      // Show summary modal
      setBulkSummary({
        type: 'discard',
        success: failed === 0,
        status: 200,
        data: {
          successful,
          failed,
          total: reportIds.length,
        },
        rawResponse: results, // Store raw API responses
      });

      setSelectedReports(new Set());
      setIsDiscardingBulk(false);
      fetchData();
    } catch (error) {
      console.error('Error in bulk discard:', error);
      setBulkSummary({
        type: 'discard',
        success: false,
        status: 500,
        data: {
          error: 'Network error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      setIsDiscardingBulk(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async () => {
    if (!otpInput || otpInput.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsOtpLoading(true);
      setOtpError(null);

      // Verify OTP
      const verifyResponse = await fetch('/api/zopper-administrator/spot-incentive-report/send-reward-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setOtpError(verifyResult.error || 'Invalid OTP');
        setIsOtpLoading(false);
        return;
      }

      // OTP verified, now send rewards
      setShowOtpModal(false);
      setIsOtpLoading(false);
      setIsMarkingPaidBulk(true);
      
      const reportIds = Array.from(selectedReports);
      
      // Send rewards using individual API calls
      const results = await Promise.allSettled(
        reportIds.map(async (id) => {
          const response = await fetch(`/api/zopper-administrator/spot-incentive-report/${id}/send-reward`, {
            method: 'POST',
          });
          const responseBody = await response.json();
          return {
            reportId: id,
            status: response.status,
            ok: response.ok,
            body: responseBody,
          };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      // Show summary modal
      setBulkSummary({
        type: 'bulk',
        success: failed === 0, // Only true if ALL succeeded
        status: 200,
        data: {
          successful,
          failed,
          total: reportIds.length,
        },
        rawResponse: results, // Store raw API responses
      });

      setSelectedReports(new Set());
      setIsMarkingPaidBulk(false);
      fetchData();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('Error verifying OTP');
      setIsMarkingPaidBulk(false);
    }
  };

  // Toggle report selection
  const toggleReportSelection = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  // Toggle all reports on current page
  const toggleAllReports = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      const allIds = new Set(reports.map(r => r.id));
      setSelectedReports(allIds);
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
  const summary = data?.summary || { activeStores: 0, activeCanvassers: 0, totalReports: 0, totalIncentiveEarned: 0, totalIncentivePaid: 0 };
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
        'Canvasser ID': report.canvasserUser.canvasserId || 'Not Set',
        'Canvasser Phone': report.canvasserUser.phone,
        'Canvasser Name': report.canvasserUser.name || 'Not Set',
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
            onClick={() => clientLogout('/login/role', false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
          >
            <FaSignOutAlt size={12} />
            Logout
          </button>
        </header>

        {/* Key metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Active Stores" value={summary.activeStores.toString()} />
          <StatCard title="Active Canvassers" value={summary.activeCanvassers.toString()} />
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
          {/* Send Rewards button - Only for UAT testing */}
          {data?.isUatAdmin && (
            <>
              <button
                onClick={() => setSelectionMode(selectionMode === 'send' ? null : 'send')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${
                  selectionMode === 'send'
                    ? 'bg-blue-700 hover:bg-blue-800'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {selectionMode === 'send' ? 'Hide Selection' : 'Send Rewards'}
              </button>
              {selectionMode === 'send' && (
                <button
                  onClick={handleSendReward}
                  disabled={isMarkingPaidBulk || (isOtpLoading && pendingRewardId === 'bulk') || selectedReports.size === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
              {(isOtpLoading && pendingRewardId === 'bulk') ? (
                <>
                  <FaSpinner className="animate-spin" size={14} />
                  Sending OTP...
                </>
              ) : isMarkingPaidBulk ? (
                <>
                  <FaSpinner className="animate-spin" size={14} />
                  Processing...
                </>
              ) : (
                `Send (${selectedReports.size})`
              )}
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setSelectionMode(selectionMode === 'discard' ? null : 'discard')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${
              selectionMode === 'discard'
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {selectionMode === 'discard' ? 'Hide Selection' : 'Discard'}
          </button>
          {selectionMode === 'discard' && (
            <button
              onClick={handleDiscardBulk}
              disabled={isDiscardingBulk || selectedReports.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiscardingBulk ? (
                <>
                  <FaSpinner className="animate-spin" size={14} />
                  Discarding...
                </>
              ) : (
                `Discard (${selectedReports.size})`
              )}
            </button>
          )}
        </section>

        {/* Table */}
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left">
                  {selectionMode && (
                    <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[40px]">
                      <input
                        type="checkbox"
                        checked={selectedReports.size === reports.length && reports.length > 0}
                        onChange={toggleAllReports}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[100px]">
                    Timestamp
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[140px]">
                    Date of Sale
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[120px]">
                    Canvasser Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[140px]">
                    Store Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[130px]">
                    Customer Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[140px]">
                    Device Name
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[110px]">
                    Plan Type
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[160px]">
                    Serial Number
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[100px]">
                    Incentive
                  </th>
                  <th className="p-2 md:p-3 text-neutral-600 text-xs font-medium uppercase tracking-wider w-[80px]">
                    Status
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
                      {selectionMode && (
                        <td className="p-2 md:p-3 w-[40px]">
                          <input
                            type="checkbox"
                            checked={selectedReports.has(r.id)}
                            onChange={() => toggleReportSelection(r.id)}
                            disabled={selectionMode === 'send' && r.isPaid}
                            className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      )}
                      <td className="p-2 md:p-3 text-neutral-900 text-sm w-[100px]">
                        <div className="text-xs">{formatDateWithTime(r.createdAt).date}</div>
                        <div className="text-neutral-500 text-xs">
                          {formatDateWithTime(r.createdAt).time}
                        </div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-700 text-sm whitespace-nowrap w-[140px]">
                        <div className="text-xs">{formatDateWithTime(r.submittedAt).date}</div>
                        <div className="text-neutral-500 text-xs">
                          {formatDateWithTime(r.submittedAt).time}
                        </div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm font-medium w-[120px]">
                        <div>{r.canvasserUser.name || 'Not Set'}</div>
                        <div className="text-neutral-500 text-xs">{r.canvasserUser.phone}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm w-[140px]">
                        <div>{r.store.storeName}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-900 text-sm w-[130px]">
                        <div>{r.customerName || 'Not Provided'}</div>
                        <div className="text-neutral-500 text-xs">{r.customerPhoneNumber || 'Not Provided'}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-700 text-sm w-[140px]">
                        <div>{r.samsungSKU.ModelName}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-700 text-xs w-[110px]">
                        <div>{r.plan.planType.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="p-2 md:p-3 text-neutral-500 text-xs font-mono w-[160px]">
                        <div>{r.serialNumber}</div>
                      </td>
                      <td className="p-2 md:p-3 text-emerald-600 text-sm font-semibold">
                        ₹{r.incentiveEarned}
                      </td>
                      <td className="p-2 md:p-3">
                        {r.transactionMetadata?.status === 'PENDING_BALANCE' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Transaction Pending
                          </span>
                        ) : r.isPaid ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
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

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700">
              <div className="flex items-center gap-3">
                <FaLock className="text-white" size={24} />
                <h3 className="text-2xl font-bold text-white">Verify OTP</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Phone Display */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-xs text-indigo-600 font-medium mb-1">OTP sent to:</p>
                <p className="text-lg font-semibold text-indigo-900">{otpPhone}</p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(value);
                  }}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest font-bold text-neutral-900 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 placeholder:text-neutral-400"
                />
              </div>

              {/* Error Message */}
              {otpError && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-700">{otpError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpInput('');
                    setOtpError(null);
                  }}
                  disabled={isOtpLoading}
                  className="flex-1 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOtpVerify}
                  disabled={isOtpLoading || otpInput.length !== 6}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {isOtpLoading ? (
                    <>
                      <FaSpinner className="animate-spin" size={14} />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Summary Modal */}
      {bulkSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200">
            <div className={`p-6 bg-gradient-to-r ${bulkSummary.success ? 'from-blue-600 to-blue-700' : 'from-red-600 to-red-700'}`}>
              <h3 className="text-2xl font-bold text-white">
                {bulkSummary.type === 'single' ? 'Reward Sent' : bulkSummary.type === 'discard' ? 'Reports Discarded' : 'Rewards Sent'}
              </h3>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

              {/* Bulk Summary Stats */}
              {bulkSummary.type === 'bulk' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600">{bulkSummary.data.successful}</div>
                    <div className="text-sm text-emerald-700 font-medium mt-1">Successful</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${bulkSummary.data.failed > 0 ? 'bg-red-50' : 'bg-neutral-50'}`}>
                    <div className={`text-3xl font-bold ${bulkSummary.data.failed > 0 ? 'text-red-600' : 'text-neutral-600'}`}>
                      {bulkSummary.data.failed}
                    </div>
                    <div className={`text-sm font-medium mt-1 ${bulkSummary.data.failed > 0 ? 'text-red-700' : 'text-neutral-700'}`}>
                      Failed
                    </div>
                  </div>
                </div>
              )}

              {/* API Response */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <p className="text-xs font-semibold text-neutral-700 mb-2">API Response:</p>
                <div className="text-xs text-neutral-600 overflow-x-auto whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto font-mono bg-white p-3 rounded border border-neutral-300">
                  {bulkSummary.rawResponse ? (
                    bulkSummary.rawResponse.map((result: any, idx: number) => (
                      <div key={idx} className="mb-3 pb-3 border-b border-neutral-200 last:border-b-0">
                        <div className="font-semibold text-neutral-800 mb-1">
                          Report #{idx + 1}:
                        </div>
                        {result.status === 'fulfilled' ? (
                          <div>
                            <div className={`font-semibold mb-1 ${result.value.ok ? 'text-green-600' : 'text-red-600'}`}>
                              {result.value.ok ? '✓' : '✗'} HTTP {result.value.status}
                            </div>
                            <pre className="text-[10px] bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.value.body, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-red-600 font-semibold">
                            ✗ Error: {result.reason?.message || 'Request failed'}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div>No response data</div>
                  )}
                </div>
              </div>

              {/* Error Message if any */}
              {bulkSummary.data.error && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm font-semibold text-red-700 mb-1">Error:</p>
                  <p className="text-xs text-red-600">{bulkSummary.data.error}</p>
                  {bulkSummary.data.message && (
                    <p className="text-xs text-red-600 mt-1">{bulkSummary.data.message}</p>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setBulkSummary(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
