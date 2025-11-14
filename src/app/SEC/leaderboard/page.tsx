'use client';

import SECHeader from '@/components/sec/SECHeader';
import SECFooter from '@/components/sec/SECFooter';

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
  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
      <SECHeader />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 pb-6">
          {/* Title */}
          <section className="mb-4 text-center text-white">
            <div className="flex justify-center mb-2">
              <span className="text-2xl">🏆</span>
            </div>
            <h1 className="text-lg font-semibold">Sales Champion Leaderboard</h1>
            <p className="text-xs text-gray-300 mt-1">
              Who will claim the crown this month?
            </p>
            <p className="mt-2 text-[10px] text-gray-400 max-w-xs mx-auto leading-snug">
              Rank movement is calculated against yesterday 23:59:59 IST.
              <span className="block mt-1">
                ↑ = improved rank &nbsp;·&nbsp; ↓ = dropped rank
              </span>
            </p>
          </section>

          {/* Podium */}
          <section className="mb-5 flex justify-between gap-2">
            {podiumData.map((card, idx) => (
              <div
                key={card.rank}
                className={`flex-1 rounded-2xl bg-gradient-to-b ${card.bg} text-white px-2 pt-3 pb-3 shadow-md ${
                  card.highlight ? 'scale-105' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold">#{card.rank}</span>
                  {card.highlight && <span className="text-lg">👑</span>}
                </div>
                <p className="text-[11px] font-semibold leading-tight">
                  {card.store}
                </p>
                <p className="text-[10px] text-gray-200 mb-2">{card.city}</p>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-[10px] text-gray-200">Incentives</p>
                    <p className="text-sm font-semibold">{card.incentives}</p>
                  </div>
                  <p className="text-[10px] text-gray-200">{card.sales}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Start Your Journey */}
          <section className="mb-5 bg-[#111827] rounded-2xl px-4 py-4 text-center text-gray-100 shadow-inner">
            <div className="mb-3 flex justify-center">
              <div className="w-24 h-10 rounded-lg bg-[#020617] flex items-center justify-center">
                <div className="w-6 h-6 bg-gradient-to-t from-green-500 to-emerald-300 rounded-sm" />
              </div>
            </div>
            <h2 className="text-sm font-semibold mb-1">Start Your Journey!</h2>
            <p className="text-[11px] text-gray-300 mb-3">
              Make your first sale to appear on the leaderboard!
            </p>
            <button className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white text-[12px] font-semibold text-gray-900">
              Start Selling
            </button>
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
              {/* Table Header */}
              <div className="grid grid-cols-[50px,1fr,55px,55px,65px] gap-2 px-3 py-2.5 border-b border-gray-200 bg-gray-50">
                <span className="text-[11px] font-semibold text-gray-600">Rank</span>
                <span className="text-[11px] font-semibold text-gray-600">Store</span>
                <span className="text-[11px] font-semibold text-gray-600 text-right">ADLD</span>
                <span className="text-[11px] font-semibold text-gray-600 text-right">Combo</span>
                <span className="text-[11px] font-semibold text-gray-600 text-right">Total</span>
              </div>
              
              {/* Table Rows */}
              {leaderboardRows.map((row, idx) => (
                <div
                  key={row.rank + row.store}
                  className="grid grid-cols-[50px,1fr,55px,55px,65px] gap-2 px-3 py-3 border-b border-gray-100 items-start"
                >
                  {/* Rank Column */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      {row.medal && <span className="text-xs">{row.medal}</span>}
                      <span className="text-[11px] font-bold text-gray-900">{row.rank}</span>
                    </div>
                    <div
                      className={`text-[9px] font-medium ${
                        row.movementDir === 'up'
                          ? 'text-green-500'
                          : row.movementDir === 'down'
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {row.movementDir === 'up' && '↑ '}
                      {row.movementDir === 'down' && '↓ '}
                      {row.movementDir === 'same' && '↔ '}
                      {row.movement}
                    </div>
                  </div>
                  
                  {/* Store Column */}
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-900 leading-tight">{row.store}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{row.city}</span>
                  </div>
                  
                  {/* ADLD Column */}
                  <div className="text-right">
                    <span className="text-[11px] text-gray-800">{row.adld}</span>
                  </div>
                  
                  {/* Combo Column */}
                  <div className="text-right">
                    <span className="text-[11px] text-gray-800">{row.combo}</span>
                  </div>
                  
                  {/* Total Column */}
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[12px] font-bold text-emerald-600">{row.total}</span>
                    <span className="text-[9px] text-gray-500 mt-0.5">{row.sales}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SECFooter />
    </div>
  );
}
