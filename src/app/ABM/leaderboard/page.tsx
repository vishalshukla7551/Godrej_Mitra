'use client';

import { useState, useEffect } from 'react';
import { clientLogout } from '@/lib/clientLogout';

interface ABMLeaderboardEntry {
  rank: number;
  abmId: string;
  abmName: string;
  phone: string;
  zsmName: string | null;
  region: string | null;
  storeCount: number;
  activeStoreCount: number;
  totalSales: number;
  totalIncentive: string;
  totalIncentiveRaw: number;
  adldUnits: number;
  comboUnits: number;
  adldRevenue: string;
  comboRevenue: string;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  abms: ABMLeaderboardEntry[];
  period: string;
  totalABMs: number;
  totalSalesReports: number;
  currentUserRank: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const CURRENT_YEAR_SHORT = new Date().getFullYear().toString().slice(-2);
const MONTH_OPTIONS = MONTHS.map((month) => `${month} ${CURRENT_YEAR_SHORT}`);

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTH_OPTIONS[new Date().getMonth()] ?? `December ${CURRENT_YEAR_SHORT}`
  );

  const fetchLeaderboard = async (monthStr: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Parse month string like "December 24" to get month and year
      const parts = monthStr.split(' ');
      const monthName = parts[0];
      const yearShort = parts[1];
      const monthIndex = MONTHS.indexOf(monthName as typeof MONTHS[number]) + 1;
      const year = 2000 + parseInt(yearShort);
      
      const res = await fetch(`/api/abm/leaderboard?month=${monthIndex}&year=${year}&limit=20`);
      const result = await res.json();
      
      if (result.success) {
        setLeaderboardData(result.data);
      } else {
        setError('Failed to load leaderboard data');
      }
    } catch (err) {
      setError('Error fetching leaderboard data');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedMonth);
  }, [selectedMonth]);

  // Get top 3 for podium (reorder: 2nd, 1st, 3rd)
  const podiumData = leaderboardData?.abms.slice(0, 3) || [];
  const reorderedPodium = podiumData.length >= 3 
    ? [podiumData[1], podiumData[0], podiumData[2]]
    : podiumData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-6 py-6">
      {/* Header with buttons */}
      <div className="flex justify-end items-center mb-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLeaderboard(selectedMonth)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium border border-white/20 disabled:opacity-50 hover:bg-white/20 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => clientLogout('/login/role')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Trophy Icon */}
      <div className="flex justify-center pb-4">
        <div className="w-20 h-20 flex items-center justify-center">
          <span className="text-6xl">🏆</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-3xl font-bold text-white">ABM Ka Mahasangram</h1>
      </div>

      {/* Subtitle */}
      <div className="text-center mb-4">
        <p className="text-neutral-300 text-sm">
          Compete with other ABMs based on your stores&apos; performance
        </p>
      </div>

      {/* Month selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm">
          <span className="text-xs uppercase tracking-wide text-gray-300">Month</span>
          <select
            className="bg-transparent text-white text-sm pr-4 cursor-pointer appearance-none focus:outline-none focus:ring-0 focus:border-none border-none outline-none"
            style={{ outline: 'none', boxShadow: 'none' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {MONTH_OPTIONS.map((label) => (
              <option key={label} value={label} className="bg-gray-900 text-white">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-white py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading leaderboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-400 py-12">
          <p>{error}</p>
          <button 
            onClick={() => fetchLeaderboard(selectedMonth)}
            className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && leaderboardData && (
        <>
          {/* Podium */}
          {reorderedPodium.length > 0 && (
            <div className="flex justify-center items-end gap-4 mb-8 max-w-5xl mx-auto">
              {reorderedPodium.map((abm) => {
                const isChampion = abm.rank === 1;
                const bgGradient = abm.rank === 1 
                  ? 'from-yellow-400 to-yellow-600' 
                  : abm.rank === 2 
                    ? 'from-gray-400 to-gray-500' 
                    : 'from-orange-400 to-orange-600';
                const height = isChampion ? 'h-52' : abm.rank === 2 ? 'h-44' : 'h-40';
                
                return (
                  <div key={abm.abmId} className="relative">
                    {/* Crown for champion with bounce animation */}
                    {isChampion && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                        <span className="text-4xl">👑</span>
                      </div>
                    )}
                    
                    <div className={`w-64 ${height} rounded-2xl bg-gradient-to-br ${bgGradient} shadow-xl p-5 flex flex-col justify-between ${abm.isCurrentUser ? 'ring-2 ring-white' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <span className="text-2xl">
                            {abm.rank === 1 ? '🏆' : abm.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        </div>
                        {abm.isCurrentUser && (
                          <span className="px-2 py-0.5 bg-white/30 rounded text-white text-xs font-bold">YOU</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold mb-0.5 truncate">
                          {abm.abmName}
                        </p>
                        <p className="text-white/80 text-xs mb-2">
                          {abm.storeCount} stores • {abm.region || 'N/A'}
                        </p>
                        <div className="text-white text-xl font-bold">{abm.totalIncentive}</div>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/20 rounded-lg px-2.5 py-0.5">
                        <span className="text-white text-xs font-bold">
                          {isChampion ? 'CHAMPION' : `#${abm.rank}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {leaderboardData.abms.length === 0 && (
            <div className="max-w-5xl mx-auto mb-6 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">📊</div>
                <h2 className="text-white text-xl font-bold">No Data Yet!</h2>
                <p className="text-neutral-300 text-sm">
                  Sales data will appear here once campaigns are active.
                </p>
              </div>
            </div>
          )}

          {/* All ABMs Ranking Table */}
          {leaderboardData.abms.length > 0 && (
            <div className="max-w-5xl mx-auto">
              <div className="rounded-2xl bg-purple-600 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-xl">🔥</span>
                    <h2 className="text-lg font-bold">All ABM Rankings</h2>
                  </div>
                  <p className="text-purple-100 text-xs mt-1">
                    Complete leaderboard by total store incentives earned
                  </p>
                </div>

                {/* Table */}
                <div className="bg-gray-900 rounded-t-2xl overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left px-4 py-3 text-neutral-400 text-xs font-medium">Rank</th>
                        <th className="text-left px-4 py-3 text-neutral-400 text-xs font-medium">ABM Name</th>
                        <th className="text-center px-4 py-3 text-neutral-400 text-xs font-medium">Stores</th>
                        <th className="text-right px-4 py-3 text-neutral-400 text-xs font-medium">ADLD</th>
                        <th className="text-right px-4 py-3 text-neutral-400 text-xs font-medium">Combo</th>
                        <th className="text-right px-4 py-3 text-neutral-400 text-xs font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.abms.map((abm) => (
                        <tr
                          key={abm.abmId}
                          className={`border-b border-gray-800 ${
                            abm.isCurrentUser ? 'bg-gradient-to-r from-blue-500/20 to-transparent' :
                            abm.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {abm.rank <= 3 && (
                                <span className="text-xl">
                                  {abm.rank === 1 ? '👑' : abm.rank === 2 ? '🥈' : '🥉'}
                                </span>
                              )}
                              {abm.rank > 3 && (
                                <span className="text-white font-semibold text-sm">#{abm.rank}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-white text-sm font-medium flex items-center gap-2">
                                {abm.abmName}
                                {abm.isCurrentUser && (
                                  <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">YOU</span>
                                )}
                              </div>
                              <div className="text-neutral-400 text-xs">{abm.region || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-white text-sm">{abm.storeCount}</span>
                          </td>
                          <td className="text-right px-4 py-3">
                            <div className="text-white text-sm">{abm.adldUnits}</div>
                            <div className="text-neutral-400 text-xs">{abm.adldRevenue}</div>
                          </td>
                          <td className="text-right px-4 py-3">
                            <div className="text-white text-sm">{abm.comboUnits}</div>
                            <div className="text-neutral-400 text-xs">{abm.comboRevenue}</div>
                          </td>
                          <td className="text-right px-4 py-3">
                            <div className="text-green-500 font-bold text-base">{abm.totalIncentive}</div>
                            <div className="text-neutral-400 text-xs">{abm.totalSales} sales</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom motivational section */}
      <div className="mt-6 mb-4 text-center">
        <div className="text-3xl mb-2 animate-bounce">🚀</div>
        <h3 className="text-white text-lg font-bold mb-1">Keep Pushing Higher!</h3>
        <p className="text-neutral-400 text-xs">
          Every sale from your stores brings you closer to the top!
        </p>
      </div>
    </div>
  );
}
