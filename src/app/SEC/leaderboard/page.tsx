'use client';

import { useState } from 'react';
import SECHeader from '@/components/sec/SECHeader';
import SECFooter from '@/components/sec/SECFooter';

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

const podiumData = [
  {
    rank: 2,
    store: 'Croma - A151 - Noida-Mall of India',
    city: 'Noida',
    incentives: '₹6200',
    sales: '29 sales',
    bg: 'from-[#4B5563] to-[#1F2933]',
  },
  {
    rank: 1,
    store: 'Croma - A189 - Noida-Gaur Mall',
    city: 'Noida',
    incentives: '₹6500',
    sales: '32 sales',
    bg: 'from-[#FACC15] to-[#F97316]',
    highlight: true,
  },
  {
    rank: 3,
    store: 'Croma - A062 - Chhatrapati Sambhaji Nagar-Prozone Mall',
    city: 'Nagpur',
    incentives: '₹6300',
    sales: '27 sales',
    bg: 'from-[#F97316] to-[#FB923C]',
  },
];

const leaderboardRows = [
  {
    rank: '#1',
    movement: '+1',
    movementDir: 'up',
    medal: '🥇',
    store: 'Croma - A189 - Noida-Gaur Mall',
    city: 'Noida',
    adld: '₹800',
    combo: '₹5700',
    total: '₹6500',
    sales: '27 sales',
  },
  {
    rank: '#2',
    movement: '+1',
    movementDir: 'up',
    medal: '🥈',
    store: 'Croma - A151 - Noida-Mall of India',
    city: 'Noida',
    adld: '₹800',
    combo: '₹5700',
    total: '₹6500',
    sales: '27 sales',
  },
  {
    rank: '#3',
    movement: '+1',
    movementDir: 'up',
    medal: '🥉',
    store: 'Croma - A062 - Chhatrapati Sambhaji Nagar-Prozone Mall',
    city: 'Nagpur',
    adld: '₹2100',
    combo: '₹4200',
    total: '₹6300',
    sales: '30 sales',
  },
  {
    rank: '#4',
    movement: '-1',
    movementDir: 'down',
    store: 'Croma - A041 - Mumbai-Oberoi Mall',
    city: 'Mumbai',
    adld: '₹1800',
    combo: '₹4500',
    total: '₹6300',
    sales: '33 sales',
  },
  {
    rank: '#5',
    movement: '+1',
    movementDir: 'up',
    store: 'VS - Pune(Chinchwad)',
    city: 'Pune',
    adld: '₹5600',
    combo: '₹600',
    total: '₹6200',
    sales: '18 sales',
  },
  {
    rank: '#6',
    movement: '-1',
    movementDir: 'down',
    store: 'Croma - A316 - Gurugram-MGF Fifty One',
    city: 'Gurugram',
    adld: '₹800',
    combo: '₹5400',
    total: '₹6200',
    sales: '18 sales',
  },
  {
    rank: '#7',
    movement: '↔',
    movementDir: 'same',
    store: 'VS - Panvel Br',
    city: 'Thane',
    adld: '₹4200',
    combo: '₹1200',
    total: '₹5400',
    sales: '16 sales',
  },
  {
    rank: '#8',
    movement: '↔',
    movementDir: 'same',
    store: 'Croma - A058 - Bangalore-Koramangala',
    city: 'Bangalore',
    adld: '₹3200',
    combo: '₹2100',
    total: '₹5300',
    sales: '19 sales',
  },
  {
    rank: '#9',
    movement: '↔',
    movementDir: 'same',
    store: 'Croma - A220 - Kolkata-Season Chinar',
    city: 'Kolkata',
    adld: '₹100',
    combo: '₹4200',
    total: '₹4300',
    sales: '18 sales',
  },
  {
    rank: '#10',
    movement: '↔',
    movementDir: 'same',
    store: 'Croma - A039 - Mumbai-Sion',
    city: 'Mumbai',
    adld: '₹3300',
    combo: '₹900',
    total: '₹4200',
    sales: '17 sales',
  },
  {
    rank: '#11',
    movement: '↔',
    movementDir: 'same',
    store: 'Croma - A115 - Pune-Elphinstone Road',
    city: 'Pune',
    adld: '₹1100',
    combo: '₹3000',
    total: '₹4100',
    sales: '21 sales',
  },
];

export default function SalesChampionLeaderboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTH_OPTIONS[new Date().getMonth()] ?? `November ${CURRENT_YEAR_SHORT}`,
  );

  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
      <SECHeader />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20"
              >
                Refresh
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
              Top stores by total incentives
            </p>

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
              Rank movement shows real-time changes (vs 30 seconds ago)
              <br />
              <span className="text-green-300">↑ Up</span> = improved &nbsp;·&nbsp;
              <span className="text-red-400">↓ Down</span> = dropped
            </p>
          </div>

          {/* Podium - 3 cards side by side, aligned at bottom */}
          <section className="mb-6 flex gap-3 sm:gap-4 justify-center items-end pb-1">
            {podiumData.map((card) => (
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

          {/* All Stores Ranking */}
          <section className="mb-4">
            <div className="rounded-t-2xl bg-gradient-to-r from-[#4F46E5] to-[#EC4899] px-4 py-3 text-white">
              <p className="text-xs font-semibold flex items-center gap-1">
                <span>🔥</span> All Stores Ranking
              </p>
              <p className="text-[10px] text-gray-100 mt-1">
                Complete leaderboard by total incentives earned
              </p>
            </div>
            <div className="bg-white rounded-b-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-2 py-2 w-[40px]">
                        Rank
                      </th>
                      <th className="text-left px-2 py-2">
                        Store
                      </th>
                      <th className="text-right px-2 py-2 w-[50px]">
                        ADLD
                      </th>
                      <th className="text-right px-2 py-2 w-[60px]">
                        Combo
                      </th>
                      <th className="text-right px-2 py-2 w-[60px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardRows.map((row) => (
                      <tr key={row.rank + row.store} className="border-b border-gray-100">
                        {/* Rank with movement indicator */}
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-0.5">
                            <span className="text-sm">{row.medal || '⭐'}</span>
                            <span
                              className={`text-xs font-bold ${
                                row.movementDir === 'up'
                                  ? 'text-green-600'
                                  : row.movementDir === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {row.movementDir === 'up' && '↑'}
                              {row.movementDir === 'down' && '↓'}
                              {row.movementDir === 'same' && '↓'}
                            </span>
                            <span
                              className={`text-[9px] font-semibold ${
                                row.movementDir === 'up'
                                  ? 'text-green-600'
                                  : row.movementDir === 'down'
                                  ? 'text-red-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {row.movement}
                            </span>
                          </div>
                        </td>

                        {/* Store name + city */}
                        <td className="px-2 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-gray-900 leading-tight">
                              {row.store}
                            </span>
                            <span className="text-[9px] text-gray-500 leading-tight">{row.city}</span>
                          </div>
                        </td>

                        {/* ADLD */}
                        <td className="px-2 py-2.5 text-right">
                          <span className="text-[11px] font-medium text-gray-900">{row.adld}</span>
                        </td>

                        {/* Combo */}
                        <td className="px-2 py-2.5 text-right">
                          <span className="text-[11px] font-medium text-gray-900">{row.combo}</span>
                        </td>

                        {/* Total + sales */}
                        <td className="px-2 py-2.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[13px] font-bold text-emerald-600">{row.total}</span>
                            <span className="text-[8px] text-gray-500">{row.sales}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </section>
        </div>
      </main>

      <SECFooter />
    </div>
  );
}
