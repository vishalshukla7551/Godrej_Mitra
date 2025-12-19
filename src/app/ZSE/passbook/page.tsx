'use client';

import { useState, useEffect } from 'react';
import { clientLogout } from '@/lib/clientLogout';

interface Transaction {
  month: string;
  monthNum: number;
  year: number;
  totalUnits: number;
  incentive: number;
  qualified: boolean;
  incentiveRate: number;
  status: string;
  paymentDate: string | null;
}

interface PassbookData {
  zse: {
    id: string;
    name: string;
    phone: string;
    aseCount: number;
    storeCount: number;
  };
  transactions: Transaction[];
}

export default function ZSEWalletPage() {
  // Modal state for incentive breakdown
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [selectedIncentiveData, setSelectedIncentiveData] = useState<any>(null);
  const [loadingIncentiveDetails, setLoadingIncentiveDetails] = useState<string | null>(null);
  
  // Passbook data state
  const [passbookData, setPassbookData] = useState<PassbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch passbook data on mount
  useEffect(() => {
    fetchPassbookData();
  }, []);

  const fetchPassbookData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/zse/passbook');
      const result = await response.json();

      if (result.success) {
        setPassbookData(result.data);
      } else {
        setError(result.error || 'Failed to fetch passbook data');
      }
    } catch (err) {
      console.error('Error fetching passbook data:', err);
      setError('Failed to load passbook data');
    } finally {
      setLoading(false);
    }
  };

  // Get current month data for "This Month" section
  const currentDate = new Date();
  const currentMonthData = passbookData?.transactions.find(
    t => t.monthNum === currentDate.getMonth() + 1 && t.year === currentDate.getFullYear()
  );

  const incentiveTransactions = passbookData?.transactions || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-10">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">ZSE Incentive Passbook</h1>
          <p className="text-neutral-300">Track your earnings and transaction history</p>
        </div>
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
      </header>

      {/* Quick Stats */}
      <div className="max-w-4xl mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">This Month</h3>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 text-red-300">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Total Units Sold</p>
              <p className="text-white text-3xl font-bold">
                {currentMonthData?.totalUnits || 0}
              </p>
              <p className={`text-sm mt-2 ${currentMonthData?.qualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentMonthData?.qualified ? 'Qualified' : 'Not Qualified'}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Incentive Rate</p>
              <p className="text-white text-3xl font-bold">
                ₹{currentMonthData?.incentiveRate || 0}
              </p>
              <p className="text-slate-400 text-sm mt-2">per unit</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Total Earned</p>
              <p className="text-white text-3xl font-bold">
                ₹{currentMonthData?.incentive.toLocaleString() || 0}
              </p>
              <p className={`text-sm mt-2 ${currentMonthData?.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentMonthData?.status || 'No Data'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Incentive Breakdown Table */}
      <div className="max-w-4xl mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">Incentive Breakdown</h3>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-2 bg-slate-700/50 px-4 py-3 font-semibold text-slate-300 text-sm">
            <span>Month</span>
            <span className="text-center">Incentive</span>
            <span className="text-center">Status</span>
            <span className="text-center">Date of Payment</span>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            </div>
          ) : incentiveTransactions.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              No incentive transactions found
            </div>
          ) : (
            incentiveTransactions.map((row, idx) => (
              <div
                key={row.month + idx}
                className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-slate-700 text-slate-200 items-center hover:bg-slate-700/30 transition"
              >
                <span className="font-medium">{row.month}</span>
                <div className="text-center">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                    title="View incentive calculation details"
                    disabled={loadingIncentiveDetails === row.month}
                    onClick={async () => {
                      try {
                        setLoadingIncentiveDetails(row.month);
                        
                        // Fetch detailed incentive calculation from API
                        const response = await fetch(`/api/zse/incentive/calculate?month=${row.monthNum}&year=${row.year}`);
                        const result = await response.json();
                        
                        if (result.success) {
                          setSelectedIncentiveData({
                            month: row.month,
                            monthNum: row.monthNum,
                            year: row.year,
                            incentive: row.incentive,
                            status: row.status,
                            paymentDate: row.paymentDate || '--',
                            totalUnits: row.totalUnits,
                            qualified: row.qualified,
                            incentiveRate: row.incentiveRate,
                            breakdown: result.data.breakdown,
                            summary: result.data.summary,
                          });
                        } else {
                          // Fallback to basic data if API fails
                          setSelectedIncentiveData({
                            month: row.month,
                            incentive: row.incentive,
                            status: row.status,
                            paymentDate: row.paymentDate || '--',
                            totalUnits: row.totalUnits,
                            qualified: row.qualified,
                            incentiveRate: row.incentiveRate,
                          });
                        }
                        setShowIncentiveModal(true);
                      } catch (error) {
                        console.error('Error fetching incentive details:', error);
                        // Fallback to basic data if API fails
                        setSelectedIncentiveData({
                          month: row.month,
                          incentive: row.incentive,
                          status: row.status,
                          paymentDate: row.paymentDate || '--',
                          totalUnits: row.totalUnits,
                          qualified: row.qualified,
                          incentiveRate: row.incentiveRate,
                        });
                        setShowIncentiveModal(true);
                      } finally {
                        setLoadingIncentiveDetails(null);
                      }
                    }}
                  >
                    {loadingIncentiveDetails === row.month ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'View Your Calculation'
                    )}
                  </button>
                </div>
                <span className="text-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    row.status === 'Paid' 
                      ? 'text-emerald-400 bg-emerald-400/20' 
                      : 'text-orange-400 bg-orange-400/20'
                  }`}>
                    {row.status}
                  </span>
                </span>
                <span className="text-center text-sm text-slate-400">
                  {row.paymentDate || '--'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incentive Details Modal */}
      {showIncentiveModal && selectedIncentiveData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 9999 }}
          onClick={() => setShowIncentiveModal(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] flex flex-col my-8 mx-auto relative border border-slate-700"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'relative',
              zIndex: 10000
            }}
          >
            {/* Header */}
            <div className="bg-slate-700 px-4 py-3 rounded-t-lg flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  ZSE Incentive Breakdown - {selectedIncentiveData?.month || 'N/A'}
                </h3>
                <button
                  onClick={() => setShowIncentiveModal(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-600 rounded-full p-1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4" style={{ position: 'relative', zIndex: 1 }}>
              {/* ZSE Incentive Details Section */}
              <div className="mb-6">
                <div className="overflow-hidden rounded-xl border border-slate-600 shadow-lg bg-slate-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700">
                        <th className="px-4 py-3 text-left font-medium text-slate-300 rounded-tl-xl">Details</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-300 rounded-tr-xl">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Qualification Gate</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          300 units
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Volume Slab</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          <div className="text-right space-y-1">
                            <div className="text-xs text-slate-300">Slab 1: 300 to 800 Units</div>
                            <div className="text-emerald-400 font-semibold">₹8.75 per unit</div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400"></td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          <div className="text-right space-y-1">
                            <div className="text-xs text-slate-300">Slab 2: &gt;800 Units</div>
                            <div className="text-emerald-400 font-semibold">₹12.5 per unit</div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Total Units Sold</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          {selectedIncentiveData?.totalUnits || 0} units
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Qualification Status</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          <span className={`px-2 py-1 rounded text-xs ${
                            selectedIncentiveData?.qualified 
                              ? 'bg-emerald-600/20 text-emerald-300' 
                              : 'bg-red-600/20 text-red-300'
                          }`}>
                            {selectedIncentiveData?.qualified ? 'Qualified' : 'Not Qualified'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Incentive Rate</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          ₹{selectedIncentiveData?.incentiveRate || 0} per unit
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Team Performance Bonus</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          ₹{selectedIncentiveData?.incentive?.toLocaleString() || 0}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600 bg-blue-900/30">
                        <td className="px-4 py-3 text-blue-300 font-semibold">Total Incentive Earned</td>
                        <td className="px-4 py-3 font-bold text-right text-blue-300">
                          ₹{selectedIncentiveData?.incentive?.toLocaleString() || 0}
                        </td>
                      </tr>
                      <tr className="bg-orange-900/30">
                        <td className="px-4 py-3 text-orange-300 font-semibold rounded-bl-xl">Payment Status</td>
                        <td className="px-4 py-3 text-right rounded-br-xl">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedIncentiveData?.status === 'Paid'
                              ? 'bg-emerald-600/20 text-emerald-300'
                              : 'bg-orange-600/20 text-orange-300'
                          }`}>
                            {selectedIncentiveData?.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note Section */}
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-yellow-200">
                      <strong>Note:</strong><br />
                      Incentive calculations are based on regional performance and team achievements. This is estimated data and final confirmation will be from Samsung. Detailed breakdown may not be available if the incentive calculation system is not fully configured.
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