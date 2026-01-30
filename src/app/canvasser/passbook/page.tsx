'use client';

import { useState, useEffect } from 'react';
import CanvasserHeader from '@/app/canvasser/CanvasserHeader';
import CanvasserFooter from '@/app/canvasser/CanvasserFooter';
import { downloadReport } from './downloadReport';

type SpotSale = {
  date: string;
  units: number;
  ew1: number;
  ew2: number;
  ew3: number;
  ew4: number;
};

type SpotVoucher = {
  id?: string;
  date: string;
  deviceName: string;
  planName: string;
  incentive: string;
  voucherCode: string;
  transactionId?: string | null; // Add transaction ID
  isPaid?: boolean;
  paidAt?: string | null; // Add paid date
  serialNumber?: string;
  transactionMetadata?: {
    status?: 'SUCCESS' | 'PENDING_BALANCE' | 'PENDING';
    [key: string]: any;
  };
};



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
  // Get current month and year for default selection
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleDateString('en-IN', { month: 'long' });
  const currentYearShort = currentDate.getFullYear().toString().slice(-2);
  const currentMonthYear = `${currentMonthName} ${currentYearShort}`;

  // Get current FY and generate FY options from current FY onwards
  const getCurrentFY = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // If current month is April or later, we're in the FY that ends next year
    // If current month is before April, we're in the FY that ends this year
    const fyEndYear = currentMonth >= 3 ? currentYear + 1 : currentYear;
    return `FY-${fyEndYear.toString().slice(-2)}`;
  };

  const currentFY = getCurrentFY();

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthYear);
  const [selectedFY, setSelectedFY] = useState<string>(currentFY);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // API data state
  const [spotIncentiveData, setSpotIncentiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch passbook data from API
  useEffect(() => {
    async function fetchPassbookData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch only spot incentive data (now contains store/canvasser info)
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
          console.log('Received spot incentive data:', spotResult.data);
          console.log('FY Stats:', spotResult.data.fyStats);
          setSpotIncentiveData(spotResult.data);
        } else {
          console.error('Spot incentive API error:', spotResult);
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

  // Get sales summary data
  const salesSummaryData: SpotSale[] = spotIncentiveData?.salesSummary || [];

  // Generate all months from current year onwards (next 3 years)
  const generateAllMonths = () => {
    const months = ['All Months'];
    const currentYear = currentDate.getFullYear();
    
    for (let year = currentYear; year <= currentYear + 2; year++) {
      const yearShort = year.toString().slice(-2);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      monthNames.forEach(monthName => {
        months.push(`${monthName} ${yearShort}`);
      });
    }
    
    return months;
  };

  const allMonths = generateAllMonths();

  const currentFYNumber = parseInt(currentFY.split('-')[1]);
  
  // Generate FY options from current FY onwards (next 5 years)
  const allFYs = [];
  for (let i = 0; i < 5; i++) {
    const fyNumber = currentFYNumber + i;
    allFYs.push(`FY-${fyNumber.toString().padStart(2, '0')}`);
  }

  const filteredSalesData = salesSummaryData
    .filter((row) =>
      selectedMonth === 'All Months' ? true : formatMonthYear(row.date) === selectedMonth
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

  // Get spot incentive data from API
  const spotTransactions = spotIncentiveData?.transactions || [];

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
                placeholder="Search by date (e.g., 15-01-2026 or 15-01)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search for specific dates in DD-MM-YYYY format (e.g., 15-01-2026) or partial dates (e.g., 15-01)
            </p>
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
                  downloadReport(filteredSalesData.map(row => ({
                    date: row?.date || '',
                    adld: (row?.ew1 || 0).toString(),
                    combo: (row?.ew2 || 0).toString(),
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
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedFY={selectedFY}
            setSelectedFY={setSelectedFY}
            allFYs={allFYs}
            spotIncentiveData={spotIncentiveData}
            search={search}
          />

        </div>
      </main>

      <CanvasserFooter />
    </div>
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
  search,
}: {
  rows: SpotSale[];
  transactions: SpotVoucher[];
  allMonths: string[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
  allFYs: string[];
  spotIncentiveData: any;
  search: string;
}) {
  const [selectedTransaction, setSelectedTransaction] = useState<SpotVoucher | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewClick = (transaction: SpotVoucher) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };
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

  // Helper functions for date parsing and formatting
  const parseDate = (ddmmyyyy: string) => {
    try {
      const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
      const date = new Date(yyyy || new Date().getFullYear(), (mm || 1) - 1, dd || 1);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch (error) {
      console.warn('Invalid date format:', ddmmyyyy);
      return new Date();
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

  // Get all available sales data and transactions
  const allSalesData = rows || []; // Use the rows prop passed to component
  const allTransactions = transactions || [];

  // Sales Summary: Filter only by month and search (NOT by FY)
  let filteredSalesData = allSalesData.filter((row: any) =>
    selectedMonth === 'All Months' ? true : formatMonthYear(row.date) === selectedMonth
  ).filter((row: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return row.date.toLowerCase().includes(term);
  });

  // Transactions: Apply FY filtering first, then month and search
  let filteredTransactions = allTransactions.filter((txn: any) => {
    return isDateInFY(txn.date, selectedFY);
  });

  filteredTransactions = filteredTransactions.filter((txn: any) =>
    selectedMonth === 'All Months' ? true : formatMonthYear(txn.date) === selectedMonth
  ).filter((txn: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return txn.date.toLowerCase().includes(term);
  });

  // Fallback for transactions only: if no data for selected FY, show all data
  if (filteredTransactions.length === 0 && allTransactions.length > 0) {
    console.log('No transactions for', selectedFY, 'showing all transactions');
    filteredTransactions = allTransactions.filter((txn: any) =>
      selectedMonth === 'All Months' ? true : formatMonthYear(txn.date) === selectedMonth
    );
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
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-gray-300"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All Months">All Months</option>
              {allMonths.slice(1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          {/* Year labels row */}
          <div className="grid grid-cols-6 bg-gray-100 px-3 py-1 text-xs text-gray-600">
            <span></span>
            <span className="text-center">1 year</span>
            <span className="text-center">2 year</span>
            <span className="text-center">3 year</span>
            <span className="text-center">4 year</span>
            <span></span>
          </div>
          {/* Main headers row */}
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
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-gray-300"
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

        {/* Summary Cards - Enhanced 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Earned Incentive */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-90">Total Earned Incentive</p>
              <span className="text-lg">💰</span>
            </div>
            <p className="text-xl font-bold mb-1">
              {spotIncentiveData?.fyStats?.[selectedFY]?.totalEarned || '₹0'}
            </p>
            <p className="text-xs opacity-80">
              Incentive earned from all sales
            </p>
          </div>

          {/* Total Units Sold */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-90">Total Units Sold</p>
              <span className="text-lg">📱</span>
            </div>
            <p className="text-xl font-bold mb-1">
              {spotIncentiveData?.fyStats?.[selectedFY]?.units || '0'}
            </p>
            <p className="text-xs opacity-80">
              Total devices sold this FY
            </p>
          </div>

          {/* Paid Incentive */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-90">Paid Incentive</p>
              <span className="text-lg">✅</span>
            </div>
            <p className="text-xl font-bold mb-1">
              {spotIncentiveData?.fyStats?.[selectedFY]?.paid || '₹0'}
            </p>
            <p className="text-xs opacity-80">
              Already received payments
            </p>
          </div>

          {/* Net Balance (Total - Paid) */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs opacity-90">Net Balance</p>
              <span className="text-lg">⏳</span>
            </div>
            <p className="text-xl font-bold mb-1">
              {(() => {
                const totalEarned = spotIncentiveData?.fyStats?.[selectedFY]?.totalEarned || '₹0';
                const paid = spotIncentiveData?.fyStats?.[selectedFY]?.paid || '₹0';
                
                // Extract numeric values from currency strings
                const totalAmount = parseFloat(totalEarned.replace(/[₹,]/g, '')) || 0;
                const paidAmount = parseFloat(paid.replace(/[₹,]/g, '')) || 0;
                const netBalance = totalAmount - paidAmount;
                
                return `₹${netBalance.toLocaleString()}`;
              })()}
            </p>
            <p className="text-xs opacity-80">
              Pending payment amount
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
            <span className="text-center">Payment</span>
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
                <span className="text-center">
                  {row.isPaid && row.transactionMetadata?.status !== 'PENDING_BALANCE' ? (
                    <button
                      onClick={() => handleViewClick(row)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-[10px] underline"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-orange-600 text-[10px]">Pending</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payment Details Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Paid Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Paid Status</p>
                <p className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <span className="text-lg">✅</span> Payment Released
                </p>
              </div>

              {/* Payment Date */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Payment Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTransaction.paidAt || 'N/A'}
                </p>
              </div>

              {/* Voucher Code (if available) */}
              {selectedTransaction.voucherCode && 
               selectedTransaction.voucherCode.trim() && 
               selectedTransaction.voucherCode !== 'N/A' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Voucher Code</p>
                  <p className="text-sm font-mono font-semibold text-blue-600">
                    {selectedTransaction.voucherCode}
                  </p>
                </div>
              )}

              {/* Transaction ID (if available) */}
              {selectedTransaction.transactionId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                      <p className="text-sm font-mono font-semibold text-green-600 break-all">
                        {selectedTransaction.transactionId}
                      </p>
                    </div>
                    <a
                      href={`https://www.benepikplus.com/bpweb3/#/${selectedTransaction.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 text-blue-600 hover:text-blue-800 text-xs font-medium underline whitespace-nowrap"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}

              {/* Incentive Amount */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Incentive Amount</p>
                <p className="text-lg font-bold text-purple-600">
                  {selectedTransaction.incentive}
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}


    </>
  );
}