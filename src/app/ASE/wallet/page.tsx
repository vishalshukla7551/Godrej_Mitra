'use client';

import { useState } from 'react';
import { clientLogout } from '@/lib/clientLogout';

export default function WalletPage() {
  // Modal state for incentive breakdown
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [selectedIncentiveData, setSelectedIncentiveData] = useState<any>(null);
  const [loadingIncentiveDetails, setLoadingIncentiveDetails] = useState(false);

  // Sample incentive data - replace with real API data later
  const incentiveTransactions = [
    {
      month: "Nov 24",
      incentive: "₹5,200",
      status: "Paid",
      paymentDate: "15-11-2024"
    },
    {
      month: "Oct 24", 
      incentive: "₹4,800",
      status: "Paid",
      paymentDate: "12-10-2024"
    },
    {
      month: "Sep 24",
      incentive: "₹6,100",
      status: "Accumulated",
      paymentDate: "--"
    },
    {
      month: "Aug 24",
      incentive: "₹3,900",
      status: "Paid", 
      paymentDate: "08-08-2024"
    }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-10">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Incentive Wallet</h1>
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

      {/* Balance Card */}
      <div className="max-w-4xl mb-8">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-8 shadow-[0_20px_60px_rgba(5,150,105,0.4)]">
          <p className="text-emerald-100 text-sm font-medium mb-2">Total Available Balance</p>
          <h2 className="text-white text-5xl font-bold mb-6">₹12,450</h2>
          <div className="flex gap-4">
            <button className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition">
              Withdraw
            </button>
            <button className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition">
              View History
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-4xl mb-8">
        <h3 className="text-white text-xl font-semibold mb-4">This Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Earned</p>
            <p className="text-white text-3xl font-bold">₹8,200</p>
            <p className="text-emerald-400 text-sm mt-2">+15% from last month</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Withdrawn</p>
            <p className="text-white text-3xl font-bold">₹3,500</p>
            <p className="text-slate-400 text-sm mt-2">2 transactions</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Pending</p>
            <p className="text-white text-3xl font-bold">₹750</p>
            <p className="text-amber-400 text-sm mt-2">Processing</p>
          </div>
        </div>
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
          {incentiveTransactions.length === 0 ? (
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
                    disabled={loadingIncentiveDetails}
                    onClick={async () => {
                      try {
                        setLoadingIncentiveDetails(true);
                        
                        // TODO: Replace with actual API call for ASE incentive calculation
                        // For now, using placeholder data
                        setSelectedIncentiveData({
                          month: row.month,
                          incentive: row.incentive,
                          status: row.status,
                          paymentDate: row.paymentDate,
                          // Placeholder breakdown data
                          breakdown: {
                            storeName: "Sample Store - City",
                            totalUnits: 25,
                            attachRate: "28%",
                            totalIncentive: row.incentive
                          }
                        });
                        setShowIncentiveModal(true);
                      } catch (error) {
                        console.error('Error fetching incentive details:', error);
                        // Fallback to basic data if API fails
                        setSelectedIncentiveData({
                          month: row.month,
                          incentive: row.incentive,
                          status: row.status,
                          paymentDate: row.paymentDate
                        });
                        setShowIncentiveModal(true);
                      } finally {
                        setLoadingIncentiveDetails(false);
                      }
                    }}
                  >
                    {loadingIncentiveDetails ? (
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
                  {row.paymentDate}
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
                  Incentive Breakdown - {selectedIncentiveData?.month || 'N/A'}
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
              {/* ASE Incentive Details Section */}
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
                          35 packs
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Volume Slab</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          <div className="text-right space-y-1">
                            <div className="text-xs text-slate-300">Slab 1: 35 to 100 Units</div>
                            <div className="text-emerald-400 font-semibold">₹18.75 per pack</div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400"></td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          <div className="text-right space-y-1">
                            <div className="text-xs text-slate-300">Slab 2: &gt;100 Units</div>
                            <div className="text-emerald-400 font-semibold">₹28.75 per pack</div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600">
                        <td className="px-4 py-3 text-slate-400">Total Units Sold</td>
                        <td className="px-4 py-3 font-medium text-right text-white">
                          85 packs
                        </td>
                      </tr>
                      <tr className="border-b border-slate-600 bg-blue-900/30">
                        <td className="px-4 py-3 text-blue-300 font-semibold">Total Incentive Earned</td>
                        <td className="px-4 py-3 font-bold text-right text-blue-300">
                          {selectedIncentiveData?.incentive || '₹0'}
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
