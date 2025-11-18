'use client';

import { useState } from 'react';
import SECHeader from '@/components/sec/SECHeader';
import SECFooter from '@/components/sec/SECFooter';
import { downloadReport } from './downloadReport';

// Mock data variables (can be replaced with API data)
const monthlyFilters = ['Today', 'Yesterday', 'All'] as const;

type FilterType = (typeof monthlyFilters)[number];

type MonthlySale = {
  date: string;
  adld: string;
  combo: string;
  units: number;
};

type MonthlyTxn = {
  month: string;
  units: number;
  incentive: string;
  status: string;
  paymentDate: string;
};

type SpotVoucher = {
  date: string;
  deviceName: string;
  planName: string;
  incentive: string;
  voucherCode: string;
};

const monthlySalesData: MonthlySale[] = [
  { date: '10-11-2025', adld: 'ADLD_1Yr', combo: 'Combo_2Yr', units: 12 },
  { date: '09-11-2025', adld: 'ADLD_6Mo', combo: 'Combo_1Yr', units: 8 },
  { date: '08-11-2025', adld: 'ADLD_1Yr', combo: 'Combo_3Yr', units: 15 },
  { date: '07-11-2025', adld: 'ADLD_2Yr', combo: 'Combo_1Yr', units: 6 },
  { date: '06-11-2025', adld: 'ADLD_1Yr', combo: 'Combo_2Yr', units: 10 },
];

const FY_STATS = {
  'FY-25': {
    units: '1,250',
    totalEarned: '₹37,500',
    paid: '₹32,000',
    net: '₹5,500',
  },
  'FY-24': {
    units: '980',
    totalEarned: '₹28,400',
    paid: '₹25,000',
    net: '₹3,400',
  },
  'FY-23': {
    units: '0',
    totalEarned: '₹0',
    paid: '₹0',
    net: '₹0',
  },
  'FY-22': {
    units: '0',
    totalEarned: '₹0',
    paid: '₹0',
    net: '₹0',
  },
  'FY-21': {
    units: '0',
    totalEarned: '₹0',
    paid: '₹0',
    net: '₹0',
  },
} as const;

const previousTransactionsData: MonthlyTxn[] = [
  { month: 'Nov 25', units: 13, incentive: '₹2300', status: 'Accumulated', paymentDate: '' },
  { month: 'Oct 25', units: 14, incentive: '₹2300', status: 'Due', paymentDate: '' },
  { month: 'Sept 25', units: 15, incentive: '₹2300', status: 'Paid', paymentDate: '10 Oct 25' },
  { month: 'Aug 25', units: 2, incentive: '₹2300', status: 'Paid', paymentDate: '10 Sept 25' },
  { month: 'Jul 25', units: 8, incentive: '₹2300', status: 'Paid', paymentDate: '10 Aug 25' },
];

const spotVoucherData: SpotVoucher[] = [
  {
    date: '19-10-2025',
    deviceName: 'A17',
    planName: 'Combo 2Yrs',
    incentive: '₹300',
    voucherCode: 'dsfsdfdsfsdf',
  },
];

const statsCardsConfig = [
  { id: 'units', label: 'Total Units Sold', key: 'units', gradient: 'from-[#176CF3] to-[#3056FF]' },
  { id: 'total-earned', label: 'Total Earned Incentive', key: 'totalEarned', gradient: 'from-[#16A34A] to-[#22C55E]' },
  { id: 'paid', label: 'Paid Incentive', key: 'paid', gradient: 'from-[#9333EA] to-[#EC4899]' },
  { id: 'net', label: 'Net Balance', key: 'net', gradient: 'from-[#2563EB] to-[#4F46E5]' },
] as const;

const parseDate = (ddmmyyyy: string) => {
  const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1);
};

const formatMonthYear = (dateStr: string) => {
  const d = parseDate(dateStr);
  const monthName = d.toLocaleDateString('en-IN', { month: 'long' });
  const yearShort = d.getFullYear().toString().slice(-2);
  return `${monthName} ${yearShort}`;
};

const allMonths = Array.from(
  new Set(monthlySalesData.map((r) => formatMonthYear(r.date)))
);

const allFYs = Object.keys(FY_STATS);

export default function IncentivePassbookPage() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'spot'>('monthly');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Today');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedFY, setSelectedFY] = useState<string>('FY-25');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const filteredMonthlySales = monthlySalesData
    .filter((row) => {
      const d = parseDate(row.date);
      if (activeFilter === 'Today') {
        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      }
      if (activeFilter === 'Yesterday') {
        return (
          d.getDate() === yesterday.getDate() &&
          d.getMonth() === yesterday.getMonth() &&
          d.getFullYear() === yesterday.getFullYear()
        );
      }
      return true;
    })
    .filter((row) =>
      selectedMonth === 'All' ? true : formatMonthYear(row.date) === selectedMonth
    )
    .filter((row) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        row.date.toLowerCase().includes(term) ||
        row.adld.toLowerCase().includes(term) ||
        row.combo.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const da = parseDate(a.date).getTime();
      const db = parseDate(b.date).getTime();
      return sortAsc ? da - db : db - da;
    });

  const fyStats = FY_STATS[selectedFY as keyof typeof FY_STATS];

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <SECHeader />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          {/* Top Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                activeTab === 'monthly'
                  ? 'bg-[#176CF3] text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              Monthly Incentive
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spot')}
              className={`flex-1 ml-2 py-2 rounded-lg text-sm font-medium border ${
                activeTab === 'spot'
                  ? 'bg-[#176CF3] text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              Spot Incentive
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-4">
            {monthlyFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  activeFilter === filter
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search (e.g., 15-10-2025)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sort & Download buttons */}
          <div className="flex flex-col gap-3 mb-5">
            <button
              type="button"
              onClick={() => setSortAsc((prev) => !prev)}
              className="w-full bg-black text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Sort by Date {sortAsc ? '(Oldest first)' : '(Newest first)'}
            </button>
            <button
              type="button"
              onClick={() => downloadReport(filteredMonthlySales)}
              className="w-full bg-gradient-to-r from-[#0EA5E9] via-[#2563EB] to-[#4F46E5] text-white text-sm font-semibold py-2.5 rounded-xl shadow"
            >
              Download Report
            </button>
          </div>

          {activeTab === 'monthly' ? (
            <MonthlyIncentiveSection
              rows={filteredMonthlySales}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedFY={selectedFY}
              setSelectedFY={setSelectedFY}
            />
          ) : (
            <SpotIncentiveSection
              rows={filteredMonthlySales}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedFY={selectedFY}
              setSelectedFY={setSelectedFY}
            />
          )}

          {/* Stats cards (common) */}
          <div className="mt-5 mb-4 space-y-3">
            {statsCardsConfig.map((card) => (
              <div
                key={card.id}
                className={`bg-gradient-to-r ${card.gradient} rounded-2xl px-4 py-4 text-white`}
              >
                <p className="text-xs mb-1">{card.label}</p>
                <p className="text-xl font-semibold">{fyStats[card.key as keyof typeof fyStats]}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SECFooter />
    </div>
  );
}

function MonthlyIncentiveSection({
  rows,
  selectedMonth,
  setSelectedMonth,
  selectedFY,
  setSelectedFY,
}: {
  rows: MonthlySale[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
}) {
  return (
    <>
      {/* Sales Summary */}
      <section className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Sales Summary</h2>
        <p className="text-[11px] text-gray-500 mb-2">Your recorded monthly sales</p>

        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Month</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span>ADLD</span>
            <span>Combo</span>
            <span className="text-right">Units</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.date + idx}
              className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 text-gray-800"
            >
              <span>{row.date}</span>
              <span>{row.adld}</span>
              <span>{row.combo}</span>
              <span className="text-right">{row.units}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Previous Transactions */}
      <section className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Previous Transactions</h2>
        <p className="text-[11px] text-gray-500 mb-2">Your recent incentive payments</p>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Month</span>
            <span className="text-right">Units</span>
            <span className="text-right">Incentive</span>
            <span className="text-right">Date of Payment</span>
          </div>
          {previousTransactionsData.map((row) => (
            <div
              key={row.month}
              className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 text-gray-800 items-center"
            >
              <span>{row.month}</span>
              <span className="text-right">{row.units}</span>
              <span className="text-right">
                {row.incentive}{' '}
                <span
                  className={`ml-1 text-[10px] font-medium ${
                    row.status === 'Paid'
                      ? 'text-green-600'
                      : row.status === 'Accumulated'
                      ? 'text-orange-500'
                      : 'text-red-500'
                  }`}
                >
                  {row.status}
                </span>
              </span>
              <span className="text-right text-[11px] text-gray-600">
                {row.paymentDate || '--'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FY Dropdown */}
      <section className="mb-3">
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Financial Year</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
            >
              {allFYs.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </>
  );
}

function SpotIncentiveSection({
  rows,
  selectedMonth,
  setSelectedMonth,
  selectedFY,
  setSelectedFY,
}: {
  rows: MonthlySale[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
}) {
  return (
    <>
      {/* Sales Summary (same table as monthly top) */}
      <section className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Sales Summary</h2>
        <p className="text-[11px] text-gray-500 mb-2">Your recorded monthly sales</p>

        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Month</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span>ADLD</span>
            <span>Combo</span>
            <span className="text-right">Units</span>
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.date + idx}
              className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 text-gray-800"
            >
              <span>{row.date}</span>
              <span>{row.adld}</span>
              <span>{row.combo}</span>
              <span className="text-right">{row.units}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Spot Incentive Voucher Codes */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[9px]">
            ₹
          </span>
          <h2 className="text-sm font-semibold text-gray-900">
            Spot Incentive Voucher Codes
          </h2>
        </div>
        <p className="text-[11px] text-gray-500 mb-2">Your redeemed incentive vouchers</p>

        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs bg-white">
          <div className="grid grid-cols-5 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            <span>Date</span>
            <span className="text-center">Device Name</span>
            <span className="text-center">Plan Name</span>
            <span className="text-center">Incentive Earned</span>
            <span className="text-center">Voucher Code</span>
          </div>
          {spotVoucherData.map((row, idx) => (
            <div
              key={row.date + idx}
              className="grid grid-cols-5 px-3 py-2 border-t border-gray-100 text-gray-800 items-center"
            >
              <span>{row.date}</span>
              <span className="text-center">{row.deviceName}</span>
              <span className="text-center">{row.planName}</span>
              <span className="text-center text-green-600 font-semibold">{row.incentive}</span>
              <span className="text-center">
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg bg-blue-50 text-[11px] text-blue-700 border border-blue-200"
                >
                  {row.voucherCode}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FY Dropdown */}
      <section className="mb-3">
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Financial Year</span>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white"
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
            >
              {allFYs.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </>
  );
}
