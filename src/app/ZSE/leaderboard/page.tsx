'use client';

import { useState, useEffect } from 'react';
import { clientLogout } from '@/lib/clientLogout';

interface LeaderboardItem {
  rank: number;
  storeId: string;
  storeName: string;
  city: string | null;
  totalSales: number;
  totalIncentive: string;
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/zse/leaderboard?period=${period}&limit=10`);
      const result = await response.json();

      if (result.success) {
        setLeaderboardData(result.data.stores);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-6 py-6">
      {/* Header with buttons */}
      <div className="flex justify-between items-center mb-8">
        <a
          href="/ASE"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-medium">Back</span>
        </a>

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
      </div>

      {/* Trophy Icon */}
      <div className="flex justify-center pb-4">
        <div className="w-20 h-20 flex items-center justify-center">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 29.3333H13.3333C11.9188 29.3333 10.5623 28.7714 9.5621 27.7712C8.5619 26.771 8 25.4145 8 24C8 22.5855 8.5619 21.229 9.5621 20.2288C10.5623 19.2286 11.9188 18.6667 13.3333 18.6667H20"
              stroke="#FFD700"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M60 29.3333H66.6667C68.0812 29.3333 69.4377 28.7714 70.4379 27.7712C71.4381 26.771 72 25.4145 72 24C72 22.5855 71.4381 21.229 70.4379 20.2288C69.4377 19.2286 68.0812 18.6667 66.6667 18.6667H60"
              stroke="#FFD700"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 70H68"
              stroke="#FFD700"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M30 48.6667V54.6667C30 55.5507 29.6488 56.3986 29.0237 57.0237C28.3986 57.6488 27.5507 58 26.6667 58C24.7867 58 22.5333 59.3333 21.3333 61.3333C20.5333 62.6667 20 64.5333 20 66.6667"
              stroke="#FFD700"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 48.6667V54.6667C50 55.5507 50.3512 56.3986 50.9763 57.0237C51.6014 57.6488 52.4493 58 53.3333 58C55.2133 58 57.4667 59.3333 58.6667 61.3333C59.4667 62.6667 60 64.5333 60 66.6667"
              stroke="#FFD700"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M60 12H20V29.3333C20 33.2754 21.5667 37.0957 24.3173 39.8962C27.0679 42.6967 30.8116 44.2667 34.6667 44.2667H45.3333C49.1884 44.2667 52.9321 42.6967 55.6827 39.8962C58.4333 37.0957 60 33.2754 60 29.3333V12Z"
              stroke="#FFD700"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-3xl font-bold text-white">Sales Champion Leaderboard</h1>
      </div>

      {/* Subtitle */}
      <div className="text-center mb-6">
        <p className="text-neutral-300 text-sm">
          Who will claim the crown this month?
        </p>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-4 mb-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center text-white py-12 w-full">Loading leaderboard...</div>
        ) : leaderboardData.length >= 3 ? (
          <>
        {/* Second Place */}
        <div className="relative w-64 h-44 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8C3 8.53043 3.21071 9.03914 3.58579 9.41421C3.96086 9.78929 4.46957 10 5 10H8M16 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8C21 8.53043 20.7893 9.03914 20.4142 9.41421C20.0391 9.78929 19.5304 10 19 10H16M5 21H19M9.5 13V15C9.5 15.2652 9.39464 15.5196 9.20711 15.7071C9.01957 15.8946 8.76522 16 8.5 16C7.7 16 6.5 16.6667 6 17.5C5.625 18.125 5.5 18.9167 5.5 20M14.5 13V15C14.5 15.2652 14.6054 15.5196 14.7929 15.7071C14.9804 15.8946 15.2348 16 15.5 16C16.3 16 17.5 16.6667 18 17.5C18.375 18.125 18.5 18.9167 18.5 20M16 3H8V10C8 11.0609 8.42143 12.0783 9.17157 12.8284C9.92172 13.5786 10.9391 14 12 14C13.0609 14 14.0783 13.5786 14.8284 12.8284C15.5786 12.0783 16 11.0609 16 10V3Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-white text-xs font-semibold mb-0.5">
              {leaderboardData[1].storeName}
            </p>
            <p className="text-white/80 text-xs mb-2">{leaderboardData[1].city || 'N/A'}</p>
            <div className="text-white text-xl font-bold">{leaderboardData[1].totalIncentive}</div>
          </div>
          <div className="absolute bottom-3 right-3 bg-white/20 rounded-lg px-2.5 py-0.5">
            <span className="text-white text-xs font-bold">#2</span>
          </div>
        </div>

        {/* First Place - Champion */}
        <div className="relative w-64 h-52 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl p-5 flex flex-col justify-between">
          {/* Crown icon */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 8L28 18L38 20L31 27L33 38L24 33L15 38L17 27L10 20L20 18L24 8Z"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8C3 8.53043 3.21071 9.03914 3.58579 9.41421C3.96086 9.78929 4.46957 10 5 10H8M16 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8C21 8.53043 20.7893 9.03914 20.4142 9.41421C20.0391 9.78929 19.5304 10 19 10H16M5 21H19M9.5 13V15C9.5 15.2652 9.39464 15.5196 9.20711 15.7071C9.01957 15.8946 8.76522 16 8.5 16C7.7 16 6.5 16.6667 6 17.5C5.625 18.125 5.5 18.9167 5.5 20M14.5 13V15C14.5 15.2652 14.6054 15.5196 14.7929 15.7071C14.9804 15.8946 15.2348 16 15.5 16C16.3 16 17.5 16.6667 18 17.5C18.375 18.125 18.5 18.9167 18.5 20M16 3H8V10C8 11.0609 8.42143 12.0783 9.17157 12.8284C9.92172 13.5786 10.9391 14 12 14C13.0609 14 14.0783 13.5786 14.8284 12.8284C15.5786 12.0783 16 11.0609 16 10V3Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-white text-xs font-semibold mb-0.5">
              {leaderboardData[0].storeName}
            </p>
            <p className="text-white/90 text-xs mb-2">{leaderboardData[0].city || 'N/A'}</p>
            <div className="text-white text-2xl font-bold">{leaderboardData[0].totalIncentive}</div>
          </div>
          <div className="absolute bottom-3 right-3 bg-white/30 rounded-lg px-3 py-1">
            <span className="text-white text-xs font-bold">CHAMPION</span>
          </div>
        </div>

        {/* Third Place */}
        <div className="relative w-64 h-40 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8C3 8.53043 3.21071 9.03914 3.58579 9.41421C3.96086 9.78929 4.46957 10 5 10H8M16 6H19C19.5304 6 20.0391 6.21071 20.4142 6.58579C20.7893 6.96086 21 7.46957 21 8C21 8.53043 20.7893 9.03914 20.4142 9.41421C20.0391 9.78929 19.5304 10 19 10H16M5 21H19M9.5 13V15C9.5 15.2652 9.39464 15.5196 9.20711 15.7071C9.01957 15.8946 8.76522 16 8.5 16C7.7 16 6.5 16.6667 6 17.5C5.625 18.125 5.5 18.9167 5.5 20M14.5 13V15C14.5 15.2652 14.6054 15.5196 14.7929 15.7071C14.9804 15.8946 15.2348 16 15.5 16C16.3 16 17.5 16.6667 18 17.5C18.375 18.125 18.5 18.9167 18.5 20M16 3H8V10C8 11.0609 8.42143 12.0783 9.17157 12.8284C9.92172 13.5786 10.9391 14 12 14C13.0609 14 14.0783 13.5786 14.8284 12.8284C15.5786 12.0783 16 11.0609 16 10V3Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-white text-xs font-semibold mb-0.5">
              {leaderboardData[2].storeName}
            </p>
            <p className="text-white/80 text-xs mb-2">{leaderboardData[2].city || 'N/A'}</p>
            <div className="text-white text-xl font-bold">{leaderboardData[2].totalIncentive}</div>
          </div>
          <div className="absolute bottom-3 right-3 bg-white/20 rounded-lg px-2.5 py-0.5">
            <span className="text-white text-xs font-bold">#3</span>
          </div>
        </div>
          </>
        ) : (
          <div className="text-center text-white py-12 w-full">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">No Rankings Yet</h3>
            <p className="text-neutral-400 text-sm">Start making sales to appear on the leaderboard!</p>
          </div>
        )}
      </div>

      {/* Start Your Journey Section */}
      <div className="max-w-5xl mx-auto mb-6 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">📊</div>
          <h2 className="text-white text-xl font-bold">Start Your Journey!</h2>
          <p className="text-neutral-300 text-sm">
            Make your first sale to appear on this leaderboard!
          </p>
          <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
            Start Selling
          </button>
        </div>
      </div>

      {/* All Stores Ranking Section */}
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl bg-purple-600 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3">
            <div className="flex items-center gap-2 text-white">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3V5M15 3V5M9 19V21M15 19V21M5 9H3M5 15H3M21 9H19M21 15H19M7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="text-lg font-bold">All Stores Ranking</h2>
            </div>
            <p className="text-purple-100 text-xs mt-1">
              Complete leaderboard by total incentives earned
            </p>
          </div>

          {/* Table */}
          <div className="bg-gray-900 rounded-t-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-neutral-400 text-xs font-medium">
                    Rank 👑
                  </th>
                  <th className="text-left px-4 py-3 text-neutral-400 text-xs font-medium">
                    Store
                  </th>
                  <th className="text-right px-4 py-3 text-neutral-400 text-xs font-medium">
                    ADLD
                  </th>
                  <th className="text-right px-4 py-3 text-neutral-400 text-xs font-medium">
                    Combo
                  </th>
                  <th className="text-right px-4 py-3 text-neutral-400 text-xs font-medium">
                    Total Incentive
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-white py-8">
                      Loading...
                    </td>
                  </tr>
                ) : leaderboardData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-neutral-400 py-8">
                      No data available
                    </td>
                  </tr>
                ) : (
                  leaderboardData.map((item, index) => (
                    <tr
                      key={item.storeId}
                      className={`border-b border-gray-800 ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.rank <= 3 && (
                            <span className="text-xl">
                              {item.rank === 1 ? '👑' : item.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                          {item.rank > 3 && (
                            <span className="text-white font-semibold text-sm">#{item.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-white text-sm font-medium">{item.storeName}</div>
                          <div className="text-neutral-400 text-xs">{item.city || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 text-white text-sm">-</td>
                      <td className="text-right px-4 py-3 text-white text-sm">-</td>
                      <td className="text-right px-4 py-3">
                        <div>
                          <div className="text-green-500 font-bold text-base">
                            {item.totalIncentive}
                          </div>
                          <div className="text-neutral-400 text-xs">{item.totalSales} sales</div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom motivational section */}
      <div className="mt-6 mb-4 text-center">
        <div className="text-3xl mb-2">🚀</div>
        <h3 className="text-white text-lg font-bold mb-1">Keep Pushing Higher!</h3>
        <p className="text-neutral-400 text-xs">
          Every sale brings you closer to the top!
        </p>
      </div>
    </div>
  );
}
