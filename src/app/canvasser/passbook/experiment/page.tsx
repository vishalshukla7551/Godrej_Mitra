"use client";

import { useState } from "react";
import CanvasserHeader from "../../CanvasserHeader.jsx";
import CanvasserFooter from "../../CanvasserFooter.jsx";

export default function ExperimentPage() {
  // Modal state for incentive breakdown
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [selectedIncentiveData, setSelectedIncentiveData] = useState<any>(null);
  const numberOfSECs = 2; // Example value

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CanvasserHeader />

      {/* Main Content */}
      <main className="flex-1 pb-32 px-4 pt-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Experiment Page
            </h1>
            <p className="text-sm text-gray-600">
              Test incentive breakdown modal with sample data
            </p>
          </div>

          {/* Test Button to Show Modal */}
          <button
            onClick={() => {
              // Mock data for testing - 2 stores
              setSelectedIncentiveData({
                month: 'December 2025',
                breakdown: {
                  storeLevelIncentive: 80000,
                  totalIncentive: 40000,
                  breakdownByStore: [
                    {
                      storeName: ' Croma- A284 -Agra -SRK Mall',
                      storeId: 'store_001',
                      attachPercentage: 30,
                      latestAttachRateInfo: {
                        percentage: 30,
                        startDate: '01 Dec',
                        endDate: '12 Dec'
                      },
                      totalIncentive: 45000,
                      breakdownBySlab: [{
                        deviceBonuses: {
                          foldBonus: 1800,
                          s25Bonus: 1500
                        }
                      }]
                    },
                    {
                      storeName: 'Croma- A004 - Ahmedabad-Devarc',
                      storeId: 'store_002',
                      attachPercentage: 28,
                      latestAttachRateInfo: {
                        percentage: 28,
                        startDate: '13 Dec',
                        endDate: '31 Dec'
                      },
                      totalIncentive: 35000,
                      breakdownBySlab: [{
                        deviceBonuses: {
                          foldBonus: 1200,
                          s25Bonus: 1000
                        }
                      }]
                    }
                  ],
                  unitsSummary: {
                    totalUnits: 25
                  },
                  breakdownByDate: [
                    {
                      date: '13-12-2025',
                      storeName: 'Croma- A004 - Ahmedabad-Devarc',
                      unitsSold: 8,
                      baseIncentive: 16000,
                      volumeIncentive: 3200,
                      unitsFold7: 3,
                      unitsS25: 5,
                      attachmentIncentive: 4300
                    },
                    {
                      date: '12-12-2025',
                      storeName: 'Croma- A284 -Agra -SRK Mall',
                      unitsSold: 8,
                      baseIncentive: 16000,
                      volumeIncentive: 3200,
                      unitsFold7: 3,
                      unitsS25: 5,
                      attachmentIncentive: 4300
                    },
                    {
                      date: '11-12-2025',
                      storeName: 'Croma- A284 -Agra -SRK Mall',
                      unitsSold: 8,
                      baseIncentive: 16000,
                      volumeIncentive: 3200,
                      unitsFold7: 3,
                      unitsS25: 5,
                      attachmentIncentive: 4300
                    },
                    {
                      date: '10-12-2025',
                      storeName: 'Croma- A284 -Agra -SRK Mall',
                      unitsSold: 17,
                      baseIncentive: 34000,
                      volumeIncentive: 6800,
                      unitsFold7: 5,
                      unitsS25: 12,
                      attachmentIncentive: 8700
                    }
                  ]
                }
              });
              setShowIncentiveModal(true);
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
          >
            View Sample Incentive Breakdown
          </button>

          <div className="mt-4 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              This is an experiment page to test the incentive breakdown modal without affecting the main passbook page.
            </p>
          </div>
        </div>
      </main>

      <CanvasserFooter />

      {/* Incentive Details Modal (copied from passbook) */}
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
                  Your Incentive Details - {selectedIncentiveData?.month || 'N/A'}
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

              {/* Store Details Sections - Stacked Vertically */}
              {selectedIncentiveData?.breakdown?.breakdownByStore?.map((store: any, storeIndex: number) => (
                <div key={storeIndex} className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    {store.storeName}
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left font-medium text-gray-700 rounded-tl-xl">Details</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700 rounded-tr-xl">Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="px-4 py-3 text-gray-600 font-medium">Period</td>
                          <td className="px-4 py-3 font-medium text-right text-gray-900">
                            {store.latestAttachRateInfo?.startDate || '01-12-2025'} - {store.latestAttachRateInfo?.endDate || '31-12-2025'}
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
                                const foldBonus = slab.deviceBonuses?.foldBonus || 0;
                                if (foldBonus === 0) return total;
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
                              const s25Count = store.breakdownBySlab?.reduce((total: number, slab: any) => {
                                const s25Bonus = slab.deviceBonuses?.s25Bonus || 0;
                                if (s25Bonus === 0) return total;
                                const attachRate = store.attachPercentage ?? 0;
                                const bonusPerDevice = attachRate < 15 ? 300 : 500;
                                return total + Math.round(s25Bonus / bonusPerDevice);
                              }, 0) || 0;
                              return s25Count;
                            })()}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-3 text-gray-600">Store Attach Rate</td>
                          <td className="px-4 py-3 font-medium text-right text-gray-900">
                            {store.latestAttachRateInfo ? (
                              <div className="flex flex-col items-end">
                                <span>{store.latestAttachRateInfo.percentage}%</span>
                                <span className="text-xs text-gray-500">
                                  Latest By: {store.latestAttachRateInfo.endDate}
                                </span>
                              </div>
                            ) : (
                              `${store.attachPercentage}%`
                            )}
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
                        <tr className="bg-green-50">
                          <td className="px-4 py-3 text-green-700 font-semibold">Estimated Earning</td>
                          <td className="px-4 py-3 font-bold text-right text-green-700">
                            ₹{store.totalIncentive?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Overall Summary */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Overall Summary</h4>
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white">
                  <table className="w-full text-sm">
                    <tbody className="bg-white">
                      <tr className="border-b border-gray-100 bg-blue-50">
                        <td className="px-4 py-3 text-blue-700 font-semibold">Total Estimated Earning</td>
                        <td className="px-4 py-3 font-bold text-right text-blue-700">
                          ₹{(() => {
                            const total = selectedIncentiveData?.breakdown?.breakdownByStore?.reduce(
                              (sum: number, store: any) => sum + (store.totalIncentive || 0),
                              0
                            ) || 0;
                            return total.toLocaleString();
                          })()}
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
                <h4 className="text-md font-semibold text-gray-900 mb-3">Incentive Breakdown</h4>
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
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{formatDate(daily.date)}</span>
                              <span className="text-[10px] text-gray-500">{daily.storeName || 'N/A'}</span>
                            </div>
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
                        Detailed breakdown not available.
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
                      Incentive calculations are based on store-level performance. This is estimated data and final confirmation will be from Samsung.
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
