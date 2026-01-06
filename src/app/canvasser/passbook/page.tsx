'use client';

import { useState, useEffect } from 'react';
import CanvasserHeader from '@/app/canvasser/CanvasserHeader';
import CanvasserFooter from '@/app/canvasser/CanvasserFooter';
import { downloadReport } from './downloadReport';

// Filter options
const monthlyFilters = ['Today', 'Yesterday', 'All'] as const;

type FilterType = (typeof monthlyFilters)[number];

type MonthlySale = {
  date: string;
  units: number;
  ew1: number;
  ew2: number;
  ew3: number;
  ew4: number;
  // Legacy fields (optional)
  adld1Year?: number;
  combo2Year?: number;
  adld?: number;
  combo?: number;
  ex1?: number;
  ex2?: number;
  ex3?: number;
  ex4?: number;
};

type MonthlyTxn = {
  month: string;
  units: number;
  incentive: string;
  status: string;
  paymentDate: string;
  latestSaleDate: string;
};

type SpotVoucher = {
  id?: string;
  date: string;
  deviceName: string;
  planName: string;
  incentive: string;
  voucherCode: string;
  isPaid?: boolean;
  imei?: string;
};

type FYStats = Record<string, {
  units: string;
  totalEarned: string;
  paid: string;
  net: string;
}>;

type PassbookData = {
  monthlyIncentive: {
    salesSummary: MonthlySale[];
    transactions: MonthlyTxn[];
    fyStats: FYStats;
  };
  spotIncentive: {
    salesSummary: MonthlySale[];
    transactions: SpotVoucher[];
    fyStats: FYStats;
  };
};

const statsCardsConfig = [
  { id: 'units', label: 'Total Units Sold', key: 'units', gradient: 'from-[#176CF3] to-[#3056FF]' },
  { id: 'paid', label: 'Paid Incentive', key: 'paid', gradient: 'from-[#9333EA] to-[#EC4899]' },
  { id: 'net', label: 'Net Balance', key: 'net', gradient: 'from-[#2563EB] to-[#4F46E5]' },
] as const;

const parseDate = (ddmmyyyy: string) => {
  try {
    const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
    const date = new Date(yyyy || new Date().getFullYear(), (mm || 1) - 1, dd || 1);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn('Invalid date format:', ddmmyyyy);
    return new Date(); // Return current date as fallback
  }
};

const formatMonthYear = (dateStr: string) => {
  try {
    const d = parseDate(dateStr);
    const monthName = d.toLocaleDateString('en-IN', { month: 'long' });
    const yearShort = d.getFullYear().toString().slice(-2);
    return `${monthName} ${yearShort}`;
  } catch (error) {
    console.warn('Error formatting date:', dateStr);
    return 'Invalid Date';
  }
};

export default function IncentivePassbookPage() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'spot'>('spot');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedFY, setSelectedFY] = useState<string>('FY-25');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // API data state
  const [passbookData, setPassbookData] = useState<PassbookData | null>(null);
  const [spotIncentiveData, setSpotIncentiveData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [secData, setSecData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [selectedIncentiveData, setSelectedIncentiveData] = useState<any>(null);
  const [loadingIncentiveDetails, setLoadingIncentiveDetails] = useState<string | null>(null); // Track which month is loading
  const [numberOfSECs, setNumberOfSECs] = useState<number>(3);

  // Fetch passbook data from API
  useEffect(() => {
    async function fetchPassbookData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch only spot incentive data (now contains store/sec info)
        const spotRes = await fetch('/api/canvasser/spot-incentive');

        if (!spotRes.ok) {
          if (spotRes.status === 401) {
            setError('Unauthorized. Please login again.');
            return;
          }
          const errorData = await spotRes.json().catch(() => ({ error: 'Failed to fetch data' }));
          setError(errorData.error || 'Failed to fetch spot incentive data');
          return;
        }

        const spotResult = await spotRes.json();

        if (spotResult.success && spotResult.data) {
          setSpotIncentiveData(spotResult.data);
          // Store and SEC data are now returned by spot-incentive API
          if (spotResult.data.store) {
            setStoreData(spotResult.data.store);
            if (spotResult.data.store.numberOfSec) {
              setNumberOfSECs(spotResult.data.store.numberOfSec);
            }
          }
          if (spotResult.data.sec) {
            setSecData(spotResult.data.sec);
          }

          // Passbook data is no longer fetched, but we might need a dummy structure if other parts rely on it
          // OR better, just don't set it.
          // setPassbookData(null); 
        } else {
          setError(spotResult.error || 'Invalid response from server');
        }
      } catch (err) {
        console.error('Error fetching passbook data:', err);
        setError('Failed to load passbook data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchPassbookData();
  }, []);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Get sales summary data based on active tab
  const salesSummaryData: MonthlySale[] = activeTab === 'monthly'
    ? []
    : (spotIncentiveData?.salesSummary || []);

  // Get unique months from sales summary
  const allMonths = Array.from(
    new Set(salesSummaryData.filter(r => r && r.date).map((r) => formatMonthYear(r.date)))
  );

  // Get unique months from spot incentive sales summary
  const spotSalesSummaryData = spotIncentiveData?.salesSummary || [];
  const allSpotMonths: string[] = Array.from(
    new Set(spotSalesSummaryData.map((r: any) => formatMonthYear(r.date)))
  );

  // Get available FYs from API data or default
  const allFYs = spotIncentiveData?.fyStats
    ? Object.keys(spotIncentiveData.fyStats)
    : ['FY-25', 'FY-24', 'FY-23', 'FY-22', 'FY-21'];

  const filteredMonthlySales = salesSummaryData
    .filter((row) => {
      const d = parseDate(row.date);
      if (activeFilter === 'Today') {
        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      }
      if (activeFilter === 'Yesterday') {
        return (
          d.getDate() === yesterday.getDate() &&
          d.getMonth() === yesterday.getMonth() &&
          d.getFullYear() === yesterday.getFullYear()
        );
      }
      return true;
    })
    .filter((row) =>
      selectedMonth === 'All' ? true : formatMonthYear(row.date) === selectedMonth
    )
    .filter((row) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return row.date.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const da = parseDate(a.date).getTime();
      const db = parseDate(b.date).getTime();
      return sortAsc ? da - db : db - da;
    });

  // Get spot incentive data from new API
  const spotTransactions = spotIncentiveData?.transactions || [];
  const spotFyStatsFromAPI = spotIncentiveData?.fyStats || {};

  // Get FY stats from API data based on active tab
  const monthlyFyStats = passbookData?.monthlyIncentive?.fyStats?.[selectedFY] || {
    units: '0',
    totalEarned: '-',
    paid: '-',
    net: '-',
  };

  const spotFyStats = spotFyStatsFromAPI[selectedFY] || {
    units: '0',
    totalEarned: '-',
    paid: '-',
    net: '-',
  };

  // Get monthly transactions
  const monthlyTransactions = passbookData?.monthlyIncentive.transactions || [];

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <CanvasserHeader />
        <main className="flex-1 overflow-y-auto pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading passbook data...</p>
          </div>
        </main>
        <CanvasserFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <CanvasserHeader />
        <main className="flex-1 overflow-y-auto pb-32 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </main>
        <CanvasserFooter />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <CanvasserHeader />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">


          {/* Pulse Animation Styles */}
          <style jsx global>{`
            @keyframes softPulse {
              0%, 100% { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
              50% { box-shadow: 0 0 12px rgba(99, 102, 241, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            }
            
            /* Mobile dropdown positioning fix */
            @media (max-width: 768px) {
              select {
                background-position: right 8px center;
                background-size: 16px;
              }
              
              .modal-dropdown {
                position: relative;
                z-index: 10001;
              }
              
              .modal-dropdown select {
                position: relative;
                z-index: 10001;
              }
            }
          `}</style>

          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-4">
            {monthlyFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${activeFilter === filter
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-200'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search (e.g., 15-10-2025)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sort & Download buttons */}
          <div className="flex flex-col gap-3 mb-5">
            <button
              type="button"
              onClick={() => setSortAsc((prev) => !prev)}
              className="w-full bg-[#5E1846] text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Sort by Date {sortAsc ? '(Oldest first)' : '(Newest first)'}
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  downloadReport(filteredMonthlySales.map(row => ({
                    date: row?.date || '',
                    adld: (row?.adld || 0).toString(),
                    combo: (row?.combo || 0).toString(),
                    units: row?.units || 0
                  })));
                } catch (error) {
                  console.error('Error downloading report:', error);
                  alert('Failed to download report. Please try again.');
                }
              }}
              className="w-full bg-gradient-to-r from-[#0EA5E9] via-[#2563EB] to-[#4F46E5] text-white text-sm font-semibold py-2.5 rounded-xl shadow"
            >
              Download Report
            </button>
          </div>

          <SpotIncentiveSection
            rows={spotIncentiveData?.salesSummary || []}
            transactions={spotTransactions}
            allMonths={allSpotMonths}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedFY={selectedFY}
            setSelectedFY={setSelectedFY}
            allFYs={allFYs}
            spotIncentiveData={spotIncentiveData}
          />


        </div>
      </main>

      <CanvasserFooter />

      {/* Incentive Details Modal */}
      {showIncentiveModal && selectedIncentiveData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 9999 }}
          onClick={() => setShowIncentiveModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col my-8 mx-auto relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 10000
            }}
          >
            {/* Header */}
            <div className="bg-gray-100 px-4 py-3 rounded-t-lg flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Incentive Breakdown - {selectedIncentiveData?.month || 'N/A'}
                </h3>
                <button
                  onClick={() => setShowIncentiveModal(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full p-1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4" style={{ position: 'relative', zIndex: 1 }}>
              {/* Details Section */}
              <div className="mb-6">
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left font-medium text-gray-700 rounded-tl-xl">Details</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 rounded-tr-xl">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Store Name</td>
                        <td className="px-4 py-3 font-medium text-right text-gray-900">
                          {selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.storeName || 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Total Units Sold</td>
                        <td className="px-4 py-3 font-medium text-right text-gray-900">
                          {selectedIncentiveData?.breakdown?.unitsSummary?.totalUnits || 0}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Number Of SECs</td>
                        <td className="px-4 py-3 font-medium text-right text-gray-900">
                          {numberOfSECs}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Base Gate Status</td>
                        <td className="px-4 py-3 text-right">
                          {(() => {
                            const totalUnits = selectedIncentiveData?.breakdown?.unitsSummary?.totalUnits || 0;
                            const gate = 4 * numberOfSECs;
                            const isQualified = totalUnits >= gate;
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isQualified
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {isQualified ? 'Qualified' : `Not Qualified`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  (4 x {numberOfSECs} = {gate} Units)
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Fold 7 Sold</td>
                        <td className="px-4 py-3 font-medium text-right text-gray-900">
                          {(() => {
                            const foldCount = selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.breakdownBySlab?.reduce((total: number, slab: any) => {
                              // Calculate number of Fold devices from the bonus amount
                              const foldBonus = slab.deviceBonuses?.foldBonus || 0;
                              if (foldBonus === 0) return total;

                              // Fold bonus is either ₹400 or ₹600 per device
                              // Determine which rate was used based on attach percentage
                              const attachRate = selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.attachPercentage ?? 0;
                              const bonusPerDevice = attachRate < 25 ? 400 : 600;
                              const foldDevices = Math.round(foldBonus / bonusPerDevice);

                              return total + foldDevices;
                            }, 0) || 0;
                            return foldCount;
                          })()}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">S25 Series Sold</td>
                        <td className="px-4 py-3 font-medium text-right text-gray-900">
                          {(() => {
                            const s25Count = selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.breakdownBySlab?.reduce((total: number, slab: any) => {
                              // Calculate number of S25 devices from the bonus amount
                              const s25Bonus = slab.deviceBonuses?.s25Bonus || 0;
                              if (s25Bonus === 0) return total;

                              // S25 bonus is either ₹300 or ₹500 per device
                              // Determine which rate was used based on attach percentage
                              const attachRate = selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.attachPercentage ?? 0;
                              const bonusPerDevice = attachRate < 15 ? 300 : 500;
                              const s25Devices = Math.round(s25Bonus / bonusPerDevice);

                              return total + s25Devices;
                            }, 0) || 0;
                            return s25Count;
                          })()}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Store Attach Rate</td>
                        <td className="px-4 py-3 font-medium text-right text-gray-900">
                          {(() => {
                            const latestInfo = selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.latestAttachRateInfo;
                            const attachPercentage = selectedIncentiveData?.breakdown?.breakdownByStore?.[0]?.attachPercentage;

                            if (latestInfo) {
                              return (
                                <div className="flex flex-col items-end">
                                  <span>{latestInfo.percentage}%</span>
                                  <span className="text-xs text-gray-500">
                                    Latest By: {latestInfo.endDate}
                                  </span>
                                </div>
                              );
                            } else if (attachPercentage !== null && attachPercentage !== undefined) {
                              return `${attachPercentage}%`;
                            } else {
                              return 'N/A';
                            }
                          })()}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-600">Volume Kicker Status</td>
                        <td className="px-4 py-3 text-right">
                          {(() => {
                            const totalUnits = selectedIncentiveData?.breakdown?.unitsSummary?.totalUnits || 0;
                            const volumeKicker = 8 * numberOfSECs;
                            const isQualified = totalUnits >= volumeKicker;
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isQualified
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {isQualified ? 'Qualified' : `Not Qualified`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  (8 x {numberOfSECs} = {volumeKicker} Units)
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100 bg-blue-50">
                        <td className="px-4 py-3 text-blue-700 font-semibold">Estimated Incentive Earned (Store Level)</td>
                        <td className="px-4 py-3 font-bold text-right text-blue-700">
                          ₹{selectedIncentiveData?.breakdown?.storeLevelIncentive?.toLocaleString() || '0'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100 bg-green-50">
                        <td className="px-4 py-3 text-green-700 font-semibold">Your Estimated Earning</td>
                        <td className="px-4 py-3 font-bold text-right text-green-700">
                          ₹{selectedIncentiveData?.breakdown?.totalIncentive?.toLocaleString() || '0'}
                        </td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="px-4 py-3 text-orange-700 font-semibold rounded-bl-xl">Payment Status</td>
                        <td className="px-4 py-3 text-right rounded-br-xl">
                          <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                            Accumulated
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Incentive Breakdown */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Incentive Breakdown(Store Level)</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
                  <div className="bg-gray-50 px-3 py-2">
                    <div className="grid grid-cols-7 gap-2 text-[9px] sm:text-xs font-semibold text-gray-900">
                      <span>Date</span>
                      <span className="text-center">Units Sold</span>
                      <span className="text-center">Base Incentive</span>
                      <span className="text-center">Volume Incentive</span>
                      <span className="text-center">Units Fold 7</span>
                      <span className="text-center">Units S25</span>
                      <span className="text-center">Attach Incentive</span>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {selectedIncentiveData?.breakdown?.breakdownByDate?.length > 0 ? (
                      selectedIncentiveData.breakdown.breakdownByDate.map((daily: any, index: number) => {
                        // Format date from DD-MM-YYYY to "1 Dec" format
                        const formatDate = (dateStr: string) => {
                          try {
                            const [day, month, year] = dateStr.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                            return `${parseInt(day)} ${monthName}`;
                          } catch {
                            return dateStr;
                          }
                        };

                        return (
                          <div key={index} className="grid grid-cols-7 gap-2 px-3 py-2 text-xs text-gray-800 border-b border-gray-100">
                            <span className="text-xs">{formatDate(daily.date)}</span>
                            <span className="text-center">{daily.unitsSold}</span>
                            <span className="text-center">₹{daily.baseIncentive.toLocaleString()}</span>
                            <span className="text-center">₹{daily.volumeIncentive.toLocaleString()}</span>
                            <span className="text-center">{daily.unitsFold7}</span>
                            <span className="text-center">{daily.unitsS25}</span>
                            <span className="text-center font-medium text-blue-600">₹{daily.attachmentIncentive.toLocaleString()}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-center text-gray-500 text-xs">
                        Detailed breakdown not available. The incentive calculation API may not be properly configured.
                      </div>
                    )}

                    {/* Total Row */}
                    {selectedIncentiveData?.breakdown?.breakdownByDate?.length > 0 && (
                      <div className="grid grid-cols-7 gap-2 px-3 py-2 text-xs bg-gray-50 font-medium text-gray-900 border-t-2 border-gray-200">
                        <span>Total</span>
                        <span className="text-center">
                          {selectedIncentiveData?.breakdown?.breakdownByDate?.reduce((sum: number, daily: any) => sum + daily.unitsSold, 0) || 0}
                        </span>
                        <span className="text-center">
                          ₹{selectedIncentiveData?.breakdown?.breakdownByDate?.reduce((sum: number, daily: any) => sum + daily.baseIncentive, 0).toLocaleString() || '0'}
                        </span>
                        <span className="text-center">
                          ₹{selectedIncentiveData?.breakdown?.breakdownByDate?.reduce((sum: number, daily: any) => sum + daily.volumeIncentive, 0).toLocaleString() || '0'}
                        </span>
                        <span className="text-center">
                          {selectedIncentiveData?.breakdown?.breakdownByDate?.reduce((sum: number, daily: any) => sum + daily.unitsFold7, 0) || 0}
                        </span>
                        <span className="text-center">
                          {selectedIncentiveData?.breakdown?.breakdownByDate?.reduce((sum: number, daily: any) => sum + daily.unitsS25, 0) || 0}
                        </span>
                        <span className="text-center font-bold text-blue-600">
                          ₹{selectedIncentiveData?.breakdown?.breakdownByDate?.reduce((sum: number, daily: any) => sum + daily.attachmentIncentive, 0).toLocaleString() || '0'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Note Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong><br />
                      Incentive calculations are based on store-level performance. This is estimated data and final confirmation will be from Samsung. Detailed breakdown may not be available if the incentive calculation system is not fully configured.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyIncentiveSection({
  rows,
  transactions,
  allMonths,
  selectedMonth,
  setSelectedMonth,
  selectedFY,
  setSelectedFY,
  allFYs,
  setSelectedIncentiveData,
  setShowIncentiveModal,
  loadingIncentiveDetails,
  setLoadingIncentiveDetails,
  numberOfSECs,
}: {
  rows: MonthlySale[];
  transactions: MonthlyTxn[];
  allMonths: string[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
  allFYs: string[];
  setSelectedIncentiveData: (data: any) => void;
  setShowIncentiveModal: (show: boolean) => void;
  loadingIncentiveDetails: string | null;
  setLoadingIncentiveDetails: (loading: string | null) => void;
  numberOfSECs: number;
}) {
  return (
    <>
      {/* Sales Summary */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Sales Summary</h2>
            <p className="text-[11px] text-gray-500">Your recorded monthly sales</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Month</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-6 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span className="text-center">EX1</span>
            <span className="text-center">EX2</span>
            <span className="text-center">EX3</span>
            <span className="text-center">EX4</span>
            <span className="text-right">Units</span>
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-xs">
              No sales found
            </div>
          ) : (
            rows.map((row, idx) => (
              <div
                key={row.date + idx}
                className="grid grid-cols-6 px-3 py-2 border-t border-gray-100 text-gray-800"
              >
                <span>{row.date}</span>
                <span className="text-center">{row.ex1 || row.adld || 0}</span>
                <span className="text-center">{row.ex2 || row.combo || 0}</span>
                <span className="text-center">{row.ex3 || 0}</span>
                <span className="text-center">{row.ex4 || 0}</span>
                <span className="text-right">{row.units}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Previous Transactions */}
      <section className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Previous Transactions</h2>
        <p className="text-[11px] text-gray-500 mb-2">Your recent incentive payments</p>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-4 gap-2 bg-gray-50 px-3 py-3 font-semibold text-gray-700">
            <span className="text-left">Month</span>
            <span className="text-center">Incentive</span>
            <span className="text-center">Status</span>
            <span className="text-center">Date of Payment</span>
          </div>
          {transactions.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-xs">
              No transactions found
            </div>
          ) : (
            transactions.map((row) => (
              <div
                key={row.month}
                className="grid grid-cols-4 gap-2 px-3 py-3 border-t border-gray-100 text-gray-800 items-center"
              >
                <span className="text-left font-medium">{row.month}</span>
                <div className="text-center">
                  <button
                    type="button"
                    className="px-2 sm:px-3 py-1 rounded-lg bg-blue-100 text-blue-600 text-[10px] sm:text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                    title="View incentive calculation details"
                    disabled={loadingIncentiveDetails === row.month}
                    onClick={async () => {
                      try {
                        setLoadingIncentiveDetails(row.month);

                        // Parse month from "Jan 24" format to month number and year
                        const monthParts = row.month.split(' ');
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
                        const monthNumber = monthNames.indexOf(monthParts[0]) + 1;
                        const year = 2000 + parseInt(monthParts[1]); // Convert "24" to 2024

                        if (!monthNumber || !year) {
                          throw new Error('Invalid month or year format');
                        }

                        // Call the incentive calculation API (no secId needed - uses auth)
                        const response = await fetch(`/api/canvasser/incentive/calculate?month=${monthNumber}&year=${year}&numberOfSECs=${numberOfSECs}`);

                        if (!response.ok) {
                          const errorData = await response.json();
                          console.error('API error:', errorData);
                          alert(`Failed to calculate incentive: ${errorData.error || 'Unknown error'}`);
                          return;
                        }

                        const result = await response.json();

                        if (!result.success || !result.data) {
                          alert('Failed to get incentive calculation data');
                          return;
                        }

                        // Only show modal if we have API data
                        setSelectedIncentiveData({
                          month: row.month,
                          breakdown: result.data // ONLY use API data
                        });
                        setShowIncentiveModal(true);
                      } catch (error) {
                        console.error('Error fetching incentive details:', error);
                        alert('Failed to load incentive calculation. Please try again.');
                        // Don't show modal if API fails
                      } finally {
                        setLoadingIncentiveDetails(null);
                      }
                    }}
                  >
                    {loadingIncentiveDetails === row.month ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                        <span className="hidden sm:inline">Loading...</span>
                      </div>
                    ) : (
                      <span className="hidden sm:inline">View Your Calculation</span>
                    )}
                    {loadingIncentiveDetails !== row.month && (
                      <span className="sm:hidden">View</span>
                    )}
                  </button>
                </div>
                <span className="text-center">
                  <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    Accumulated
                  </span>
                </span>
                <span className="text-center text-[11px] text-gray-600">
                  {row.paymentDate || '--'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>


    </>
  );
}

function SpotIncentiveSection({
  rows,
  transactions,
  allMonths,
  selectedMonth,
  setSelectedMonth,
  selectedFY,
  setSelectedFY,
  allFYs,
  spotIncentiveData,
}: {
  rows: MonthlySale[];
  transactions: SpotVoucher[];
  allMonths: string[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
  allFYs: string[];
  spotIncentiveData: any;
}) {
  // Helper function to check if a date falls within a financial year
  const isDateInFY = (dateStr: string, fy: string) => {
    try {
      const [dd, mm, yyyy] = dateStr.split('-').map(Number);
      const date = new Date(yyyy, mm - 1, dd);

      // Extract year from FY (e.g., "FY-25" -> 2025)
      const fyYear = 2000 + parseInt(fy.split('-')[1]);

      // Financial year runs from April 1 to March 31
      const fyStart = new Date(fyYear - 1, 3, 1); // April 1 of previous year
      const fyEnd = new Date(fyYear, 2, 31); // March 31 of current year

      return date >= fyStart && date <= fyEnd;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return true; // Show all data if date parsing fails
    }
  };

  // Get all available sales data and transactions
  const allSalesData = rows || []; // Use the rows prop passed to component
  const allTransactions = transactions || [];

  // Apply FY filtering
  let filteredSalesData = allSalesData.filter((row: any) => {
    return isDateInFY(row.date, selectedFY);
  });

  let filteredTransactions = allTransactions.filter((txn: any) => {
    return isDateInFY(txn.date, selectedFY);
  });

  // Fallback: if no data for selected FY, show all data
  if (filteredSalesData.length === 0 && allSalesData.length > 0) {
    console.log('No sales data for', selectedFY, 'showing all data');
    filteredSalesData = allSalesData;
  }

  if (filteredTransactions.length === 0 && allTransactions.length > 0) {
    console.log('No transactions for', selectedFY, 'showing all transactions');
    filteredTransactions = allTransactions;
  }

  // Debug: Log data to console
  console.log('SpotIncentiveSection Debug:', {
    selectedFY,
    allSalesData: allSalesData.length,
    filteredSalesData: filteredSalesData.length,
    allTransactions: allTransactions.length,
    filteredTransactions: filteredTransactions.length,
    spotIncentiveData: !!spotIncentiveData,
    fyStats: spotIncentiveData?.fyStats
  });

  return (
    <>
      {/* Sales Summary (same table as monthly top) */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Sales Summary</h2>
            <p className="text-[11px] text-gray-500">Your recorded monthly sales</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Month</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-6 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span className="text-center">EW1</span>
            <span className="text-center">EW2</span>
            <span className="text-center">EW3</span>
            <span className="text-center">EW4</span>
            <span className="text-right">Units</span>
          </div>
          {filteredSalesData.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-xs">
              No transactions found
            </div>
          ) : (
            filteredSalesData.map((row: any, idx: number) => (
              <div
                key={row.date + idx}
                className="grid grid-cols-6 px-3 py-2 border-t border-gray-100 text-gray-800"
              >
                <span>{row.date}</span>
                <span className="text-center text-blue-600 font-medium">{row.ew1 || 0}</span>
                <span className="text-center text-purple-600 font-medium">{row.ew2 || 0}</span>
                <span className="text-center text-gray-600">{row.ew3 || 0}</span>
                <span className="text-center text-gray-600">{row.ew4 || 0}</span>
                <span className="text-right">{row.units}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Spot Incentive Summary */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[9px] text-white">
              ⚡
            </span>
            <h2 className="text-sm font-semibold text-gray-900">
              Spot Incentive Summary
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Financial Year</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
            >
              {allFYs.map((fy: string) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">Your spot incentive earnings overview</p>

        {/* Summary Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Earned Incentive */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-90 mb-1">Total Earned Incentive</p>
            <p className="text-lg font-bold">
              {spotIncentiveData?.fyStats?.[selectedFY]?.totalEarned || '₹0'}
            </p>
          </div>

          {/* Total Units */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-90 mb-1">Total Units</p>
            <p className="text-lg font-bold">
              {spotIncentiveData?.fyStats?.[selectedFY]?.units || '0'}
            </p>
          </div>

          {/* Paid Incentive */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-90 mb-1">Paid Incentive</p>
            <p className="text-lg font-bold">
              {spotIncentiveData?.fyStats?.[selectedFY]?.paid || '₹0'}
            </p>
          </div>

          {/* Net Balance */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-90 mb-1">Net Balance</p>
            <p className="text-lg font-bold">
              {spotIncentiveData?.fyStats?.[selectedFY]?.net || '₹0'}
            </p>
          </div>
        </div>
      </section>

      {/* Spot Incentive Transactions */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[9px]">
            ₹
          </span>
          <h2 className="text-sm font-semibold text-gray-900">
            Spot Incentive Transactions
          </h2>
        </div>
        <p className="text-[11px] text-gray-500 mb-2">Your spot incentive earnings from active campaigns</p>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span className="text-center">Appliances</span>
            <span className="text-center">Incentive</span>
            <span className="text-center">Voucher Code</span>
          </div>
          {filteredTransactions.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-xs">
              No spot incentive transactions found for {selectedFY}
            </div>
          ) : (
            filteredTransactions.map((row, idx) => (
              <div
                key={row.id || row.date + idx}
                className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 text-gray-800 items-center"
              >
                <span className="text-[10px]">{row.date}</span>
                <span className="text-center text-[10px]">{row.deviceName}</span>
                <span className="text-center text-green-600 font-semibold text-[10px]">{row.incentive}</span>
                <span className="text-center text-[10px]">
                  {row.voucherCode && row.voucherCode.trim() && row.voucherCode !== 'N/A' ? (
                    <span className="font-mono text-blue-600">{row.voucherCode}</span>
                  ) : (
                    <span className="text-orange-600 font-normal">Not Released</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </section>


    </>
  );
}