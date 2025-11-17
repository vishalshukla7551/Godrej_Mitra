'use client';

import Link from 'next/link';
import { useState } from 'react';

// Format number with commas consistently
function formatCurrency(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

interface Report {
  id: string;
  timestamp: string;
  dateOfSale: string;
  secId: string;
  storeName: string;
  storeCode: string;
  deviceName: string;
  planType: string;
  imei: string;
  incentiveEarned: number;
  status: string;
  validator: string;
}

export default function SamsungAdministratorPage() {
  const [filterDate, setFilterDate] = useState('');
  const [filterStore, setFilterStore] = useState('All Store');
  const [filterDevice, setFilterDevice] = useState('All Executive');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterSecStoreImei, setFilterSecStoreImei] = useState('');

  // Sample data
  const reports: Report[] = [
    {
      id: 'SEC001',
      timestamp: '2025-11-15 14:30:22',
      dateOfSale: '2025-11-15',
      secId: 'SEC001',
      storeName: 'Croma- A103 -',
      storeCode: 'Gour Mall',
      deviceName: 'Galaxy S24 Ultra',
      planType: 'Premium',
      imei: '123456789012345',
      incentiveEarned: 2500,
      status: 'Approved',
      validator: 'Zopper'
    },
    {
      id: 'SEC002',
      timestamp: '2025-11-15 14:25:18',
      dateOfSale: '2025-11-15',
      secId: 'SEC002',
      storeName: 'Croma- A405 -',
      storeCode: 'Vjjec occ',
      deviceName: 'Galaxy A54',
      planType: 'Standard',
      imei: '123456789012340',
      incentiveEarned: 1500,
      status: 'Pending',
      validator: 'Zopper'
    },
    {
      id: 'SEC003',
      timestamp: '2025-11-15 14:20:45',
      dateOfSale: '2025-11-15',
      secId: 'SEC003',
      storeName: 'V3- Purva (Echinacesa)',
      storeCode: 'D',
      deviceName: 'Galaxy S23',
      planType: 'Premium',
      imei: '123456789012347',
      incentiveEarned: 2200,
      status: 'Approved',
      validator: 'Zopper'
    },
    {
      id: 'SEC004',
      timestamp: '2025-11-15 14:15:33',
      dateOfSale: '2025-11-15',
      secId: 'SEC004',
      storeName: 'V3- Himaraja',
      storeCode: '',
      deviceName: 'Galaxy Note 20',
      planType: 'Standard',
      imei: '123456789012348',
      incentiveEarned: 1500,
      status: 'Pending',
      validator: 'Zopper'
    },
    {
      id: 'SEC005',
      timestamp: '2025-11-15 14:10:12',
      dateOfSale: '2025-11-15',
      secId: 'SEC005',
      storeName: 'Croma- A103 - Maronel-eliyakiapar',
      storeCode: 'kosi',
      deviceName: 'Galaxy Z Fold 5',
      planType: 'Premium',
      imei: '123456789012349',
      incentiveEarned: 3500,
      status: 'Pending',
      validator: 'Zopper'
    },
    {
      id: 'SEC006',
      timestamp: '2025-11-15 14:05:28',
      dateOfSale: '2025-11-15',
      secId: 'SEC006',
      storeName: 'V3- Chirkob',
      storeCode: 'Avtham Dt',
      deviceName: 'Galaxy A54',
      planType: 'Standard',
      imei: '123456789012350',
      incentiveEarned: 1200,
      status: 'Approved',
      validator: 'Zopper'
    },
    {
      id: 'SEC007',
      timestamp: '2025-11-15 14:00:15',
      dateOfSale: '2025-11-15',
      secId: 'SEC007',
      storeName: 'Croma- A101 - Mulco',
      storeCode: 'Med di knolla',
      deviceName: 'Galaxy S24',
      planType: 'Premium',
      imei: '123456789012351',
      incentiveEarned: 2300,
      status: 'Approved',
      validator: 'Zopper'
    },
  ];

  const stats = {
    activeStores: 465,
    secsActive: 556,
    reportsSubmitted: 2704,
    incentiveEarned: 427021,
    incentivePaid: 385800,
    incentivePaidCount: 2474,
    incentiveUnpaidCount: 230
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
        {/* Logo Section */}
        <div className="relative w-full h-[69px] bg-black border-b border-gray-800 overflow-hidden">
          {/* Rectangle background with image */}
          <div 
            className="absolute w-[72.83px] h-[69px] top-[-1px] left-[6px] rounded-[20px]"
            style={{
              background: 'url(https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-11-14/N8vfr4GWX8.png) no-repeat center',
              backgroundSize: 'cover'
            }}
          />
          
          {/* S letter */}
          <div 
            className="absolute flex items-center justify-center h-[26px] top-[21px] left-[23px] text-white font-bold text-[28px] leading-[26px] whitespace-nowrap z-[1]"
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              width: '36px'
            }}
          >
            S
          </div>
          
          {/* SalesDost with gradient */}
          <div 
            className="absolute flex items-start justify-start h-[31px] top-[7px] left-[87.938px] font-bold text-[26px] leading-[31px] whitespace-nowrap z-[3]"
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: 'rgba(0, 0, 0, 0)',
              background: 'linear-gradient(90deg, #1d4ed8, #2563eb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            SalesDost
          </div>
          
          {/* Safalta ka Sathi */}
          <div 
            className="absolute flex items-start justify-start h-[25px] top-[38px] left-[92.938px] text-white font-medium text-[16px] leading-[25px] whitespace-nowrap z-[2]"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            Safalta ka Sathi
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1">
          <Link 
            href="/Samsung-Administrator" 
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors mb-1 text-sm text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Home
          </Link>
          <Link 
            href="/Samsung-Administrator/spot-incentive-report" 
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="leading-tight">Spot Incentive Report</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">Welcome, Samsung Administrator</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-0.5">
                <span>No of Incentive Paid: <span className="font-semibold text-blue-600">{stats.incentivePaidCount}</span></span>
                <span>Unpaid: <span className="font-semibold text-orange-600">{stats.incentiveUnpaidCount}</span></span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Updated: 16:08:27</span>
              <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                Refresh
              </button>
              <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                Pause Auto-refresh
              </button>
              <Link 
                href="/login/role"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-md"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-5 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-5">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(99,102,241,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">{stats.activeStores}</h3>
              <p className="text-indigo-100 text-sm font-medium">Active Stores</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(16,185,129,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">{stats.secsActive}</h3>
              <p className="text-emerald-100 text-sm font-medium">SECs Active</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(37,99,235,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">{stats.reportsSubmitted}</h3>
              <p className="text-blue-100 text-sm font-medium">Reports Submitted</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(245,158,11,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">₹{formatCurrency(stats.incentiveEarned)}</h3>
              <p className="text-amber-100 text-sm font-medium">Incentive Earned</p>
            </div>
            <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(244,63,94,0.3)]">
              <h3 className="text-white text-4xl font-bold mb-2">₹{formatCurrency(stats.incentivePaid)}</h3>
              <p className="text-rose-100 text-sm font-medium">Incentive Paid</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-5 shadow-md mb-5">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              Filters ▼
            </h3>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Filter by Sec/Store/IMEI
                </label>
                <input
                  type="text"
                  value={filterSecStoreImei}
                  onChange={(e) => setFilterSecStoreImei(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Filter by Date
                </label>
                <input
                  type="text"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Filter by Store Name
                </label>
                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Store</option>
                  <option>Croma</option>
                  <option>V3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Filter by Device Name
                </label>
                <select
                  value={filterDevice}
                  onChange={(e) => setFilterDevice(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Executive</option>
                  <option>Galaxy S24</option>
                  <option>Galaxy A54</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Status</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-[9%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Timestamp</th>
                    <th className="w-[7%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Date</th>
                    <th className="w-[6%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">SEC ID</th>
                    <th className="w-[12%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Store Name</th>
                    <th className="w-[10%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Device</th>
                    <th className="w-[7%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Plan</th>
                    <th className="w-[10%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">IMEI</th>
                    <th className="w-[8%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Incentive</th>
                    <th className="w-[12%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Status</th>
                    <th className="w-[11%] px-2 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report, index) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2.5 text-[11px] text-gray-900">{report.timestamp}</td>
                      <td className="px-2 py-2.5 text-[11px] text-gray-900">{report.dateOfSale}</td>
                      <td className="px-2 py-2.5 text-[11px] font-medium text-gray-900">{report.secId}</td>
                      <td className="px-2 py-2.5 text-[11px] text-gray-900">
                        <div className="truncate">
                          <div className="font-medium truncate">{report.storeName}</div>
                          {report.storeCode && (
                            <div className="text-[10px] text-gray-500 truncate">{report.storeCode}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-gray-900">
                        <div className="truncate">{report.deviceName}</div>
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-gray-900">{report.planType}</td>
                      <td className="px-2 py-2.5 text-[11px] text-gray-900 font-mono">
                        <div className="truncate">{report.imei}</div>
                      </td>
                      <td className="px-2 py-2.5 text-[11px] font-semibold text-green-600">
                        ₹{formatCurrency(report.incentiveEarned)}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="text-center">
                          <div className="text-[9px] text-green-600 font-medium mb-0.5">Validate by {report.validator}</div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            report.status === 'Approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        {report.status === 'Pending' ? (
                          <div className="flex gap-1">
                            <button className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded transition-colors">
                              Approve
                            </button>
                            <button className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded transition-colors">
                              Discard
                            </button>
                          </div>
                        ) : (
                          <div className="flex">
                            <button className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded transition-colors">
                              Discard
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
