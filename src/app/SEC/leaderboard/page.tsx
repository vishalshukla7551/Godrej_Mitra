'use client';

import { useState, useEffect } from 'react';
import FestiveHeader from '@/components/FestiveHeader';
import FestiveFooter from '@/components/FestiveFooter';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const CURRENT_YEAR_SHORT = new Date().getFullYear().toString().slice(-2);
const MONTH_OPTIONS = MONTHS.map((month) => `${month} ${CURRENT_YEAR_SHORT}`);

interface LeaderboardStore {
  rank: number;
  storeId: string;
  storeName: string;
  city: string | null;
  state: string | null;
  totalSales: number;
  totalIncentive: string;
  adldUnits: number;
  comboUnits: number;
  adldRevenue: string;
  comboRevenue: string;
}

interface LeaderboardData {
  stores: LeaderboardStore[];
  devices: any[];
  plans: any[];
  period: string;
  activeCampaignsCount: number;
  totalSalesReports: number;
}



interface ActiveCampaignsData {
  campaigns: any[];
  store: {
    id: string;
    name: string;
    city: string;
  };
  totalActiveCampaigns: number;
}

export default function SalesChampionLeaderboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTH_OPTIONS[new Date().getMonth()] ?? `November ${CURRENT_YEAR_SHORT}`,
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);

  const [activeCampaignsData, setActiveCampaignsData] = useState<ActiveCampaignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch leaderboard and active campaigns data
      const [leaderboardRes, activeCampaignsRes] = await Promise.all([
        fetch('/api/sec/leaderboard?period=month&limit=20'),
        fetch('/api/sec/active-campaigns')
      ]);
      
      const [leaderboardResult, activeCampaignsResult] = await Promise.all([
        leaderboardRes.json(),
        activeCampaignsRes.json()
      ]);
      
      if (leaderboardResult.success) {
        setLeaderboardData(leaderboardResult.data);
      } else {
        setError('Failed to load leaderboard data');
      }
      

      
      if (activeCampaignsResult.success) {
        setActiveCampaignsData(activeCampaignsResult.data);
      }
    } catch (err) {
      setError('Error fetching leaderboard data');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const podiumData = leaderboardData?.stores.slice(0, 3).map((store, idx) => ({
    rank: store.rank,
    store: store.storeName,
    city: store.city || 'N/A',
    incentives: store.totalIncentive,
    sales: `${store.totalSales} sales`,
    bg: idx === 0 ? 'from-[#FACC15] to-[#F97316]' : idx === 1 ? 'from-[#4B5563] to-[#1F2933]' : 'from-[#F97316] to-[#FB923C]',
    highlight: idx === 0,
  })) || [];

  // Reorder podium to show 2nd, 1st, 3rd
  const reorderedPodium = podiumData.length >= 3 
    ? [podiumData[1], podiumData[0], podiumData[2]]
    : podiumData;

  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
      <FestiveHeader hideGreeting />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLeaderboard}
                disabled={loading}
                className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-full bg-white text-purple-700 text-sm font-semibold flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="text-center text-white mb-5">
            <div className="mb-2 flex justify-center">
              <span className="text-4xl">🏆</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Sales Champion Leaderboard
            </h1>
            <p className="text-sm text-gray-200 mb-4">
              Top stores by total incentives from active campaigns
            </p>

            {/* Stats */}
            {leaderboardData && (
              <div className="flex justify-center gap-4 mb-3 text-xs">
                <span className="text-gray-300">
                  Active Campaigns: <span className="font-bold text-white">{leaderboardData.activeCampaignsCount}</span>
                </span>
                <span className="text-gray-300">
                  Total Sales: <span className="font-bold text-white">{leaderboardData.totalSalesReports}</span>
                </span>
              </div>
            )}

            {/* Month selector - responsive, shows all months */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm mb-3">
              <span className="text-xs uppercase tracking-wide text-gray-300">Month</span>
              <select
                className="bg-transparent text-white text-sm outline-none border-none pr-4 cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {MONTH_OPTIONS.map((label) => (
                  <option
                    key={label}
                    value={label}
                    className="bg-[#020617] text-white"
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Based on sales from active spot incentive campaigns
            </p>
          </div>



          {/* Active Campaigns */}
          {!loading && !error && activeCampaignsData && activeCampaignsData.campaigns.length > 0 && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-4 text-white">
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold mb-1">Active Campaigns for Your Store</h2>
                  <p className="text-xs text-white/80">
                    {activeCampaignsData.store.name} - {activeCampaignsData.store.city}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {activeCampaignsData.totalActiveCampaigns} active campaign{activeCampaignsData.totalActiveCampaigns !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {activeCampaignsData.campaigns.slice(0, 3).map((campaign: any) => (
                    <div key={campaign.id} className="bg-white/10 rounded-xl p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-semibold">{campaign.name}</h3>
                          <p className="text-xs text-white/70">{campaign.deviceName} - {campaign.planType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {campaign.incentiveType === 'FIXED' 
                              ? `₹${campaign.incentiveValue}` 
                              : `${campaign.incentiveValue}%`
                            }
                          </p>
                          <p className="text-xs text-white/70">per sale</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Valid: {campaign.startDate} to {campaign.endDate}</span>
                        <span>Plan: ₹{campaign.planPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                  
                  {activeCampaignsData.campaigns.length > 3 && (
                    <div className="text-center">
                      <p className="text-xs text-white/70">
                        +{activeCampaignsData.campaigns.length - 3} more campaign{activeCampaignsData.campaigns.length - 3 !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center text-white py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 py-12">
              <p>{error}</p>
              <button 
                onClick={fetchLeaderboard}
                className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && leaderboardData && (
            <>
              {/* Podium - 3 cards side by side, aligned at bottom */}
              {reorderedPodium.length > 0 && (
                <section className="mb-6 flex gap-3 sm:gap-4 justify-center items-end pb-1">
                  {reorderedPodium.map((card) => (
                    <div key={card.rank} className="relative">
                      {/* Crown ABOVE the card with gentle animation */}
                      {card.highlight && (
                        <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                          <span className="text-2xl sm:text-4xl">👑</span>
                        </div>
                      )}
                      
                      {/* The card - responsive sizing, champion taller */}
                      <div
                        className={`w-[105px] sm:w-[180px] lg:w-[220px] ${card.highlight ? 'h-[105px] sm:h-[180px] lg:h-[200px]' : 'h-[95px] sm:h-[160px] lg:h-[180px]'} rounded-2xl sm:rounded-3xl bg-gradient-to-b ${card.bg} text-white p-3 sm:p-4 lg:p-5 shadow-lg flex flex-col items-center justify-between overflow-hidden`}
                      >
                        {/* Icon */}
                        <div className="flex justify-center shrink-0">
                          <span className="text-xl sm:text-3xl lg:text-4xl">{card.rank === 1 ? '🏆' : card.rank === 2 ? '🥈' : '🥉'}</span>
                        </div>
                        
                        {/* Store name - show for all ranks */}
                        <div className="text-center px-1 overflow-hidden w-full">
                          <p className="text-[8px] sm:text-xs lg:text-sm font-semibold leading-tight line-clamp-2 overflow-hidden">
                            {card.store}
                          </p>
                          <p className="text-[7px] sm:text-[10px] lg:text-xs text-white/90 mt-0.5 truncate">{card.city}</p>
                        </div>
                        
                        {/* Amount */}
                        <p className="text-base sm:text-2xl lg:text-3xl font-bold shrink-0">{card.incentives}</p>
                        
                        {/* Bottom badge */}
                        {card.highlight ? (
                          <div className="w-full py-0.5 sm:py-1 lg:py-1.5 rounded-full bg-black/20 text-[7px] sm:text-[10px] lg:text-xs font-bold text-center shrink-0">
                            CHAMPION
                          </div>
                        ) : (
                          <p className="text-xs sm:text-lg lg:text-xl font-bold shrink-0">#{card.rank}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* All Stores Ranking */}
              <section className="mb-4">
                <div className="rounded-t-2xl bg-gradient-to-r from-[#4F46E5] to-[#EC4899] px-4 py-3 text-white">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <span>🔥</span> All Stores Ranking
                  </p>
                  <p className="text-[10px] text-gray-100 mt-1">
                    Complete leaderboard by total incentives earned from active campaigns
                  </p>
                </div>
                <div className="bg-white rounded-b-2xl overflow-hidden">
                  {leaderboardData.stores.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">No active campaigns or sales data available</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-2 py-2 w-[40px]">
                            Rank
                          </th>
                          <th className="text-left px-2 py-2">
                            Store
                          </th>
                          <th className="text-right px-2 py-2 w-[45px]">
                            ADLD
                          </th>
                          <th className="text-right px-2 py-2 w-[45px]">
                            Combo
                          </th>
                          <th className="text-right px-2 py-2 w-[60px]">
                            Sales
                          </th>
                          <th className="text-right px-2 py-2 w-[80px]">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardData.stores.map((store) => {
                          const medal = store.rank === 1 ? '🥇' : store.rank === 2 ? '🥈' : store.rank === 3 ? '🥉' : '⭐';
                          
                          return (
                            <tr key={store.storeId} className="border-b border-gray-100">
                              {/* Rank */}
                              <td className="px-2 py-2.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm">{medal}</span>
                                  <span className="text-[10px] font-semibold text-gray-600">
                                    #{store.rank}
                                  </span>
                                </div>
                              </td>

                              {/* Store name + city */}
                              <td className="px-2 py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold text-gray-900 leading-tight">
                                    {store.storeName}
                                  </span>
                                  <span className="text-[9px] text-gray-500 leading-tight">
                                    {store.city || store.state || 'N/A'}
                                  </span>
                                </div>
                              </td>

                              {/* ADLD units */}
                              <td className="px-2 py-2.5 text-right">
                                <span className="text-[11px] font-medium text-blue-600">
                                  {store.adldUnits > 0 ? store.adldUnits : '-'}
                                </span>
                              </td>

                              {/* Combo units */}
                              <td className="px-2 py-2.5 text-right">
                                <span className="text-[11px] font-medium text-purple-600">
                                  {store.comboUnits > 0 ? store.comboUnits : '-'}
                                </span>
                              </td>

                              {/* Sales count */}
                              <td className="px-2 py-2.5 text-right">
                                <span className="text-[11px] font-medium text-gray-900">
                                  {store.totalSales}
                                </span>
                              </td>

                              {/* Total incentive */}
                              <td className="px-2 py-2.5 text-right">
                                <span className="text-[13px] font-bold text-emerald-600">
                                  {store.totalIncentive}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <FestiveFooter />
    </div>
  );
}
