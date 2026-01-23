'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

// Generate month options from current year onwards (next 3 years)
const generateMonthOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const options = ['All Months'];
    
    for (let year = currentYear; year <= currentYear + 2; year++) {
        const yearShort = year.toString().slice(-2);
        MONTHS.forEach(month => {
            options.push(`${month} ${yearShort}`);
        });
    }
    
    return options;
};

const MONTH_OPTIONS = generateMonthOptions();

// Get current month as default
const getCurrentMonth = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const yearShort = now.getFullYear().toString().slice(-2);
    return `${monthName} ${yearShort}`;
};

interface LeaderboardEntry {
    rank: number;
    totalSales: number;
    totalIncentive: string;
    // Store fields
    storeId?: string;
    storeName?: string;
    city?: string | null;
    // Canvasser (ASA Canvasser) fields
    asaCanvasserId?: string;
    canvasserName?: string;
    identifier?: string;
    // Stats
    ew1?: number;
    ew2?: number;
    ew3?: number;
    ew4?: number;
}

interface LeaderboardData {
    stores: LeaderboardEntry[];
    canvassers: LeaderboardEntry[]; // Used for canvassers
    month: number;
    year: number;
    activeCampaignsCount: number;
}

export default function LeaderboardPage() {
    const { loading } = useAuth(['ZOPPER_ADMINISTRATOR']);
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [activeTab, setActiveTab] = useState<'store' | 'asaCanvasser'>('store');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Parse month and year from selectedMonth if not "All Months"
            let queryParams = '?limit=20';
            if (selectedMonth !== 'All Months') {
                const [monthName, yearShort] = selectedMonth.split(' ');
                const monthIndex = MONTHS.indexOf(monthName as any);
                const year = 2000 + parseInt(yearShort);
                
                if (monthIndex !== -1 && !isNaN(year)) {
                    queryParams += `&month=${monthIndex + 1}&year=${year}`;
                }
            }
            
            const res = await fetch(`/api/zopper-administrator/leaderboard${queryParams}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                setError('Failed to load leaderboard data');
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            setError('Error fetching leaderboard data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [selectedMonth]); // Re-fetch when month changes

    if (loading) return null;

    const activeStats = activeTab === 'store' ? data?.stores : data?.canvassers;
    const podiumData = getPodiumData();
    const reorderedPodium = podiumData.length >= 3
        ? [podiumData[1], podiumData[0], podiumData[2]]
        : podiumData;

    function getPodiumData() {
        if (!activeStats) return [];

        return activeStats.slice(0, 3).map((item, idx) => ({
            rank: item.rank,
            name: activeTab === 'store' ? item.storeName : item.canvasserName,
            subtext: activeTab === 'store' ? item.city : item.identifier,
            incentives: item.totalIncentive,
            sales: `${item.totalSales} sales`,
            bg: idx === 0 ? 'from-[#FACC15] to-[#F97316]' : idx === 1 ? 'from-[#4B5563] to-[#1F2933]' : 'from-[#F97316] to-[#FB923C]',
            highlight: idx === 0,
        }));
    }

    return (
        <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
            <style jsx global>{`
              select:focus {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                appearance: none !important;
              }
              select::-ms-expand {
                display: none;
              }
            `}</style>
            <main className="flex-1 overflow-y-auto pb-32">
                <div className="px-4 pt-4 pb-6">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Toggle Switch */}
                        <div className="bg-white/10 p-1 rounded-lg flex items-center gap-1 border border-white/20">
                            <button
                                onClick={() => setActiveTab('store')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'store' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Store Wise
                            </button>
                            <button
                                onClick={() => setActiveTab('asaCanvasser')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'asaCanvasser' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Canvasser Wise
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={fetchLeaderboard}
                                disabled={isLoading}
                                className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Refresh'}
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
                            Top {activeTab === 'store' ? 'stores' : 'canvassers'} by total incentives
                        </p>

                        {/* Month selector */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm mb-3">
                            <span className="text-xs uppercase tracking-wide text-gray-300">Month</span>
                            <select
                                className="bg-transparent text-white text-sm outline-none border-none pr-4 cursor-pointer focus:outline-none focus:ring-0 focus:border-none"
                                style={{ 
                                  boxShadow: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                  appearance: 'none'
                                }}
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
                    </div>

                    {/* Loading/Error States */}
                    {isLoading && (
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

                    {!isLoading && !error && activeStats && (
                        <>
                            {/* Podium */}
                            {reorderedPodium.length > 0 && (
                                <section className="mb-6 flex gap-3 sm:gap-4 justify-center items-end pb-1">
                                    {reorderedPodium.map((card) => (
                                        <div key={card.rank} className="relative">
                                            {card.highlight && (
                                                <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                                                    <span className="text-2xl sm:text-4xl">👑</span>
                                                </div>
                                            )}

                                            <div
                                                className={`w-[105px] sm:w-[180px] lg:w-[220px] ${card.highlight ? 'h-[140px] sm:h-[200px] lg:h-[220px]' : 'h-[130px] sm:h-[180px] lg:h-[200px]'} rounded-2xl sm:rounded-3xl bg-gradient-to-b ${card.bg} text-white p-2 sm:p-4 lg:p-5 shadow-lg flex flex-col items-center justify-between overflow-hidden`}
                                            >
                                                <div className="flex justify-center shrink-0">
                                                    <span className="text-xl sm:text-3xl lg:text-4xl">{card.rank === 1 ? '🏆' : card.rank === 2 ? '🥈' : '🥉'}</span>
                                                </div>

                                                <div className="text-center px-1 w-full flex-shrink min-h-0">
                                                    <p className="text-[9px] sm:text-xs lg:text-sm font-semibold leading-tight line-clamp-2 break-words">
                                                        {card.name}
                                                    </p>
                                                    <p className="text-[7px] sm:text-[10px] lg:text-xs text-white/90 mt-0.5 truncate">{card.subtext || 'N/A'}</p>
                                                </div>

                                                <p className="text-sm sm:text-2xl lg:text-3xl font-bold shrink-0">{card.incentives}</p>

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

                            {/* All Rankings Table */}
                            <section className="mb-4">
                                <div className="rounded-t-2xl bg-gradient-to-r from-[#4F46E5] to-[#EC4899] px-3 py-2.5 text-white">
                                    <p className="text-xs font-semibold flex items-center gap-1">
                                        <span>🔥</span> All {activeTab === 'store' ? 'Stores' : 'Canvassers'} Ranking
                                    </p>
                                </div>
                                <div className="bg-white rounded-b-2xl overflow-hidden">
                                    {activeStats.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <p className="text-sm">No active campaigns or sales data available</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[300px] table-fixed">
                                                <thead>
                                                    <tr className="bg-gray-100 text-gray-600 text-[9px] uppercase font-semibold">
                                                        <th className="text-left px-2 py-2 w-[40px]">#</th>
                                                        <th className="text-left px-2 py-2">{activeTab === 'store' ? 'Store' : 'Canvasser'}</th>
                                                        {/* Note: EW stats not currently in admin API, so hiding columns or showing placeholder if desired. 
                                Based on prompt "same as previous one", attempting to match UI structure. */}
                                                        <th className="text-center px-1 py-2 w-[35px]">EW1</th>
                                                        <th className="text-center px-1 py-2 w-[35px]">EW2</th>
                                                        <th className="text-center px-1 py-2 w-[35px]">EW3</th>
                                                        <th className="text-center px-1 py-2 w-[35px]">EW4</th>
                                                        <th className="text-right px-2 py-2 w-[60px]">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeStats.map((item) => {
                                                        const medal = item.rank === 1 ? '👑' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : null;
                                                        const rankColor = item.rank === 1 ? 'text-yellow-600' : item.rank === 2 ? 'text-gray-500' : item.rank === 3 ? 'text-orange-600' : 'text-gray-700';

                                                        const name = activeTab === 'store' ? item.storeName : item.canvasserName;
                                                        const subtext = activeTab === 'store' ? item.city : item.identifier;
                                                        const id = activeTab === 'store' ? item.storeId : item.canvasserId;

                                                        // Placeholder EW stats since admin endpoint doesn't return them currently
                                                        // You might want to update the admin endpoint to return these detailed stats similarly if needed.
                                                        const ew1 = item.ew1 || '-';
                                                        const ew2 = item.ew2 || '-';
                                                        const ew3 = item.ew3 || '-';
                                                        const ew4 = item.ew4 || '-';

                                                        return (
                                                            <tr key={item.rank} className="border-b border-gray-100 last:border-none">
                                                                <td className="px-2 py-2">
                                                                    <div className="flex items-center gap-1">
                                                                        {medal && <span className="text-sm">{medal}</span>}
                                                                        {!medal && <span className={`text-xs font-bold ${rankColor}`}>{item.rank}</span>}
                                                                    </div>
                                                                </td>

                                                                <td className="px-2 py-2">
                                                                    <div className="font-medium text-gray-900 text-[10px] leading-tight line-clamp-1">
                                                                        {name}
                                                                    </div>
                                                                    <div className="text-[8px] text-gray-500 leading-tight mt-0.5">
                                                                        {subtext || 'N/A'}
                                                                    </div>
                                                                </td>

                                                                <td className="px-1 py-2 text-center">
                                                                    <span className="text-[10px] font-medium text-gray-700">{ew1}</span>
                                                                </td>
                                                                <td className="px-1 py-2 text-center">
                                                                    <span className="text-[10px] font-medium text-gray-700">{ew2}</span>
                                                                </td>
                                                                <td className="px-1 py-2 text-center">
                                                                    <span className="text-[10px] font-medium text-gray-700">{ew3}</span>
                                                                </td>
                                                                <td className="px-1 py-2 text-center">
                                                                    <span className="text-[10px] font-medium text-gray-700">{ew4}</span>
                                                                </td>

                                                                <td className="px-2 py-2 text-right">
                                                                    <div className="font-semibold text-green-600 text-[11px] leading-tight">
                                                                        {item.totalIncentive}
                                                                    </div>
                                                                    <div className="text-[8px] text-gray-500 leading-tight mt-0.5">
                                                                        {item.totalSales} sales
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Keep Pushing Higher Animation */}
                            <div className="mt-8 mb-4 flex flex-col items-center justify-center space-y-2">
                                <div className="animate-bounce">
                                    <span className="text-4xl filter drop-shadow-lg transform -rotate-45">🚀</span>
                                </div>
                                <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 font-bold text-lg tracking-wider animate-pulse">
                                    Keep Pushing Higher!
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
