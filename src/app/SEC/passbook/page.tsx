'use client';

import { useState, useEffect } from 'react';
import FestiveHeader from '@/components/FestiveHeader';
import FestiveFooter from '@/components/FestiveFooter';
import { downloadReport } from './downloadReport';

// Filter options
const monthlyFilters = ['Today', 'Yesterday', 'All'] as const;

type FilterType = (typeof monthlyFilters)[number];

type MonthlySale = {
  date: string;
  adld1Year: number;
  combo2Year: number;
  adld: number;
  combo: number;
  units: number;
};

type MonthlyTxn = {
  month: string;
  units: number;
  incentive: string;
  status: string;
  paymentDate: string;
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
  const [activeTab, setActiveTab] = useState<'monthly' | 'spot'>('monthly');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedFY, setSelectedFY] = useState<string>('FY-25');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  
  // API data state
  const [passbookData, setPassbookData] = useState<PassbookData | null>(null);
  const [spotIncentiveData, setSpotIncentiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [selectedIncentiveData, setSelectedIncentiveData] = useState<any>(null);
  const [loadingIncentiveDetails, setLoadingIncentiveDetails] = useState(false);
  const [numberOfSECs, setNumberOfSECs] = useState<number>(3);

  // Fetch passbook data from API
  useEffect(() => {
    async function fetchPassbookData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both passbook and spot incentive data
        const [passbookRes, spotRes] = await Promise.all([
          fetch('/api/sec/passbook'),
          fetch('/api/sec/spot-incentive')
        ]);
        
        if (!passbookRes.ok) {
          if (passbookRes.status === 401) {
            setError('Unauthorized. Please login again.');
            return;
          }
          const errorData = await passbookRes.json().catch(() => ({ error: 'Failed to fetch data' }));
          setError(errorData.error || 'Failed to fetch passbook data');
          return;
        }

        const passbookResult = await passbookRes.json();
        if (passbookResult.success && passbookResult.data) {
          setPassbookData(passbookResult.data);
        } else {
          setError(passbookResult.error || 'Invalid response from server');
          return;
        }

        // Handle spot incentive data
        if (spotRes.ok) {
          const spotResult = await spotRes.json();
          if (spotResult.success && spotResult.data) {
            setSpotIncentiveData(spotResult.data);
          }
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
  const salesSummaryData = activeTab === 'monthly' 
    ? (passbookData?.monthlyIncentive?.salesSummary || [])
    : (passbookData?.spotIncentive?.salesSummary || []);
  
  // Get unique months from sales summary
  const allMonths = Array.from(
    new Set(salesSummaryData.filter(r => r && r.date).map((r) => formatMonthYear(r.date)))
  );

  // Get available FYs from API data or default
  const allFYs = passbookData?.monthlyIncentive?.fyStats 
    ? Object.keys(passbookData.monthlyIncentive.fyStats) 
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
    totalEarned: '₹0',
    paid: '₹0',
    net: '₹0',
  };

  const spotFyStats = spotFyStatsFromAPI[selectedFY] || {
    units: '0',
    totalEarned: '₹0',
    paid: '₹0',
    net: '₹0',
  };

  // Get monthly transactions
  const monthlyTransactions = passbookData?.monthlyIncentive.transactions || [];

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <FestiveHeader hideGreeting />
        <main className="flex-1 overflow-y-auto pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading passbook data...</p>
          </div>
        </main>
        <FestiveFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <FestiveHeader hideGreeting />
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
        <FestiveFooter />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <FestiveHeader hideGreeting />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          {/* Top Tabs - 3D Segmented Control */}
          <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-4 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'monthly'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-[1.02] transform'
                  : 'bg-white text-gray-600 shadow-md hover:shadow-lg'
              }`}
              style={activeTab !== 'monthly' ? {
                animation: 'softPulse 2.5s ease-in-out infinite',
              } : {}}
            >
              💰 Monthly Incentive
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spot')}
              className={`flex-1 ml-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'spot'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl scale-[1.02] transform'
                  : 'bg-white text-gray-600 shadow-md hover:shadow-lg'
              }`}
              style={activeTab !== 'spot' ? {
                animation: 'softPulse 2.5s ease-in-out infinite',
              } : {}}
            >
              ⚡ Spot Incentive
            </button>
          </div>

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
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  activeFilter === filter
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
              className="w-full bg-black text-white text-sm font-semibold py-2.5 rounded-xl"
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

          {activeTab === 'monthly' ? (
            <MonthlyIncentiveSection
              rows={filteredMonthlySales}
              transactions={monthlyTransactions}
              allMonths={allMonths}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedFY={selectedFY}
              setSelectedFY={setSelectedFY}
              allFYs={allFYs}
              setSelectedIncentiveData={setSelectedIncentiveData}
              setShowIncentiveModal={setShowIncentiveModal}
              loadingIncentiveDetails={loadingIncentiveDetails}
              setLoadingIncentiveDetails={setLoadingIncentiveDetails}
            />
          ) : (
            <SpotIncentiveSection
              rows={filteredMonthlySales}
              transactions={spotTransactions}
              allMonths={allMonths}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedFY={selectedFY}
              setSelectedFY={setSelectedFY}
              allFYs={allFYs}
              spotIncentiveData={spotIncentiveData}
            />
          )}

          {/* Stats cards (common) */}
          <div className="mt-5 mb-4 space-y-3">
            {statsCardsConfig.map((card) => {
              const currentFyStats = activeTab === 'monthly' ? monthlyFyStats : spotFyStats;
              return (
                <div
                  key={card.id}
                  className={`bg-gradient-to-r ${card.gradient} rounded-2xl px-4 py-4 text-white`}
                >
                  <p className="text-xs mb-1">{card.label}</p>
                  <p className="text-xl font-semibold">{currentFyStats[card.key as keyof typeof currentFyStats]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <FestiveFooter />

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
                      <td className="px-4 py-3 font-medium text-right text-gray-900">Croma - A294 Agra SRK Mall</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Number Of SECs</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block modal-dropdown">
                          <select
                            value={numberOfSECs}
                            onChange={(e) => setNumberOfSECs(Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 min-w-[60px]"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Total Units Sold [25 Dec]</td>
                      <td className="px-4 py-3 font-medium text-right text-gray-900">{selectedIncentiveData?.units || 0}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Fold 7 Sold</td>
                      <td className="px-4 py-3 font-medium text-right text-gray-900">0</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">S25 Series Sold</td>
                      <td className="px-4 py-3 font-medium text-right text-gray-900">1</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Attachment Kicker Considered [25 Dec]</td>
                      <td className="px-4 py-3 font-medium text-right text-gray-900">Yes</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-600">Volume Kicker Applicable</td>
                      <td className="px-4 py-3 font-medium text-right text-gray-900">8 x 3 = 24</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-blue-50">
                      <td className="px-4 py-3 text-blue-700 font-semibold">Total Incentive Earned</td>
                      <td className="px-4 py-3 font-bold text-right text-blue-700">{selectedIncentiveData?.incentive || '₹0'}</td>
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

              {/* Daily Sales Breakdown */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Daily Sales Breakdown</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white">
                  <div className="bg-gray-50 px-3 py-2">
                    <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-700">
                      <span>Date</span>
                      <span className="text-center">Units Sold</span>
                      <span className="text-center">Base Incentive</span>
                      <span className="text-center">Volume Incentive</span>
                      <span className="text-center">Units Fold 7</span>
                      <span className="text-center">Units S25</span>
                      <span className="text-center">Attachment Incentive</span>
                    </div>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-7 gap-2 px-3 py-2 text-xs border-b border-gray-100">
                      <span>1 Dec</span>
                      <span className="text-center">0</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">₹0</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 px-3 py-2 text-xs border-b border-gray-100">
                      <span>2 Dec</span>
                      <span className="text-center">0</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">₹0</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 px-3 py-2 text-xs border-b border-gray-100">
                      <span>3 Dec</span>
                      <span className="text-center">0</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">₹0</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 px-3 py-2 text-xs border-b border-gray-100">
                      <span>25 Dec</span>
                      <span className="text-center">1</span>
                      <span className="text-center text-blue-600 font-medium">₹2,200</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">1</span>
                      <span className="text-center">₹550</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 px-3 py-2 text-xs bg-gray-50 font-medium">
                      <span>Total</span>
                      <span className="text-center">1</span>
                      <span className="text-center text-blue-600">₹2,200</span>
                      <span className="text-center">₹0</span>
                      <span className="text-center">0</span>
                      <span className="text-center">1</span>
                      <span className="text-center">₹550</span>
                    </div>
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
                      Incentive calculations are based on store-level performance.This is estimated data and final confirmation will be from Samsung.

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
  loadingIncentiveDetails: boolean;
  setLoadingIncentiveDetails: (loading: boolean) => void;
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
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span>ADLD</span>
            <span>Combo</span>
            <span className="text-right">Units</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.date + idx}
              className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 text-gray-800"
            >
              <span>{row.date}</span>
              <span>{row.adld}</span>
              <span>{row.combo}</span>
              <span className="text-right">{row.units}</span>
            </div>
          ))}
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
                    className="px-3 py-1 rounded-lg bg-blue-100 text-blue-600 text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                    title="View incentive calculation details"
                    disabled={loadingIncentiveDetails}
                    onClick={async () => {
                      try {
                        setLoadingIncentiveDetails(true);
                        
                        // Call the incentive calculation API
                        const response = await fetch('/api/sec/incentive/calculate', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            month: row.month,
                            // Add any other required parameters
                          }),
                        });

                        if (response.ok) {
                          const result = await response.json();
                          setSelectedIncentiveData({
                            month: row.month,
                            incentive: row.incentive,
                            units: row.units,
                            status: row.status,
                            breakdown: result.data // Store the detailed breakdown from API
                          });
                        } else {
                          // Fallback to basic data if API fails
                          setSelectedIncentiveData({
                            month: row.month,
                            incentive: row.incentive,
                            units: row.units,
                            status: row.status
                          });
                        }
                        setShowIncentiveModal(true);
                      } catch (error) {
                        console.error('Error fetching incentive details:', error);
                        // Fallback to basic data if API fails
                        setSelectedIncentiveData({
                          month: row.month,
                          incentive: row.incentive,
                          units: row.units,
                          status: row.status
                        });
                        setShowIncentiveModal(true);
                      } finally {
                        setLoadingIncentiveDetails(false);
                      }
                    }}
                  >
                    {loadingIncentiveDetails ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'View Your Calculation'
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

      {/* FY Dropdown */}
      <section className="mb-3">
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Financial Year</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
            >
              {allFYs.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
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
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span>ADLD</span>
            <span>Combo</span>
            <span className="text-right">Units</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.date + idx}
              className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 text-gray-800"
            >
              <span>{row.date}</span>
              <span>{row.adld}</span>
              <span>{row.combo}</span>
              <span className="text-right">{row.units}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Spot Incentive Summary */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[9px] text-white">
            ⚡
          </span>
          <h2 className="text-sm font-semibold text-gray-900">
            Spot Incentive Summary
          </h2>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">Your spot incentive earnings overview</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-90 mb-1">Total Earned</p>
            <p className="text-lg font-bold">{spotIncentiveData?.summary?.totalEarned || '₹0'}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 text-white">
            <p className="text-[10px] opacity-90 mb-1">Total Units</p>
            <p className="text-lg font-bold">{spotIncentiveData?.summary?.totalUnits || '0'}</p>
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
          <div className="grid grid-cols-6 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span className="text-center">Device</span>
            <span className="text-center">Plan</span>
            <span className="text-center">Incentive</span>
            <span className="text-center">Status</span>
            <span className="text-center">IMEI</span>
          </div>
          {transactions.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-xs">
              No spot incentive transactions found
            </div>
          ) : (
            transactions.map((row, idx) => (
              <div
                key={row.id || row.date + idx}
                className="grid grid-cols-6 px-3 py-2 border-t border-gray-100 text-gray-800 items-center"
              >
                <span className="text-[10px]">{row.date}</span>
                <span className="text-center text-[10px]">{row.deviceName}</span>
                <span className="text-center text-[10px]">{row.planName}</span>
                <span className="text-center text-green-600 font-semibold text-[10px]">{row.incentive}</span>
                <span className="text-center">
                  {row.isPaid ? (
                    <span className="text-[9px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Paid
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                </span>
                <span className="text-center text-[9px] font-mono text-gray-500">
                  {row.imei ? `...${row.imei.slice(-4)}` : 'N/A'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FY Dropdown */}
      <section className="mb-3">
        <div className="flex justify-end">
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
      </section>
    </>
  );
}