'use client';

import Link from 'next/link';
import Snowfall from 'react-snowfall';
import { clientLogout } from '@/lib/clientLogout';

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  badge: string;
  color: 'green' | 'blue' | 'orange' | 'purple';
  icon: React.ReactNode;
}

interface ChristmasDashboardProps {
  userName: string;
  loading: boolean;
  cards: DashboardCard[];
  logoutPath?: string;
  hideSanta?: boolean;
}

const colorClasses = {
  green: { bg: 'from-green-600 to-green-500', badge: 'bg-green-600' },
  blue: { bg: 'from-blue-600 to-blue-500', badge: 'bg-blue-600' },
  orange: { bg: 'from-orange-500 to-amber-500', badge: 'bg-orange-500' },
  purple: { bg: 'from-purple-600 to-indigo-500', badge: 'bg-purple-600' },
};

export default function ChristmasDashboard({ userName, loading, cards, logoutPath = '/login/role', hideSanta = false }: ChristmasDashboardProps) {
  return (
    <div className="flex-1 relative overflow-hidden min-h-screen" style={{ background: 'linear-gradient(180deg, #0b2a3d 0%, #0f172a 100%)' }}>
      <Snowfall snowflakeCount={100} style={{ position: 'fixed', width: '100%', height: '100%', zIndex: 1 }} />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#ffffff22 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Pine decorations */}
      <div className="absolute top-0 left-0 w-full h-24 z-10">
        <div className="absolute top-0 left-0 text-6xl">🌲</div>
        <div className="absolute top-0 left-20 text-5xl">🌲</div>
        <div className="absolute top-0 right-0 text-6xl">🌲</div>
        <div className="absolute top-0 right-20 text-5xl">🌲</div>
      </div>

      {/* Snowman */}
      <div className="absolute bottom-10 right-10 z-10 hidden md:block text-[120px] lg:text-[180px]" style={{ animation: 'float 3s ease-in-out infinite' }}>⛄</div>
      
      {/* Snow ground */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white/20 to-transparent z-0" />

      {/* Header */}
      <div className="relative z-20 flex justify-between items-center px-10 pt-8">
        <div className="relative">
          {!hideSanta && <div className="absolute -top-8 -left-2 text-4xl transform -rotate-12">🎅</div>}
          <p className="text-neutral-50 text-3xl font-semibold">{loading ? 'Hello User,' : `Hello ${userName},`}</p>
          <p className="text-white/80 text-lg">Welcome! Choose your action below</p>
        </div>
        <button onClick={() => clientLogout(logoutPath)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow-lg hover:scale-105" style={{ background: 'linear-gradient(135deg, #c62828, #ff5252)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Logout</span>
        </button>
      </div>

      {/* Hero */}
      <section className="relative z-20 mt-10 px-10">
        <div className="max-w-xl space-y-3">
          <h1 className="text-[72px] font-black leading-[61.2px] tracking-[-2px] bg-gradient-to-r from-green-400 via-green-300 to-emerald-200 bg-clip-text text-transparent">SPOT</h1>
          <h1 className="text-[72px] font-black leading-[61.2px] tracking-[-2px] bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">INCENTIVE</h1>
          <h1 className="text-[72px] font-black leading-[61.2px] tracking-[-2px] bg-gradient-to-r from-red-500 via-red-400 to-rose-300 bg-clip-text text-transparent">REVOLUTION</h1>
        </div>
      </section>

      {/* Cards */}
      <section className="relative z-20 mt-12 px-10 pb-10">
        <div className={`grid grid-cols-1 gap-6 ${cards.length === 2 ? 'md:grid-cols-2 max-w-3xl' : 'md:grid-cols-3 max-w-4xl'}`}>
          {cards.map((card, idx) => (
            <Link key={idx} href={card.href} className="relative h-60 rounded-2xl bg-[#fffaf0] shadow-[0_12px_30px_rgba(0,0,0,0.15)] p-6 block hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all cursor-pointer group">
              <div className={`absolute top-6 right-6 h-10 w-10 rounded-full bg-gradient-to-r ${colorClasses[card.color].bg} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="text-white text-lg font-semibold">{">"}</span>
              </div>
              <div className="relative mb-6">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-r ${colorClasses[card.color].bg} shadow-lg flex items-center justify-center`}>{card.icon}</div>
              </div>
              <h3 className="text-zinc-900 text-xl font-bold">{card.title}</h3>
              <p className="text-stone-500 text-base">{card.description}</p>
              <div className={`mt-4 inline-flex items-center rounded-md ${colorClasses[card.color].badge} px-3 py-1.5`}>
                <span className="text-white text-xs font-semibold">{card.badge}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}
