'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';

export default function ZopperAdministratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Auto-detects role from URL and calls correct endpoint
  const { loading, user } = useAuth();
  const isUatUser = user?.metadata?.isUatUser === true;

  // Routes restricted for UAT users
  const uatRestrictedRoutes = [
    '/Zopper-Administrator',
    '/Zopper-Administrator/leaderboard',
    '/Zopper-Administrator/validate-user',
    '/Zopper-Administrator/store-change-requests',
    '/Zopper-Administrator/referral',
    '/Zopper-Administrator/help-requests',
    '/Zopper-Administrator/process-voucher-excel',
    '/Zopper-Administrator/manage-pdfs',
    '/Zopper-Administrator/process-referral-vouchers',
  ];

  // Sidebar state with localStorage persistence
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zopperAdminSidebarOpen');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('zopperAdminSidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Protect routes for UAT users
  useEffect(() => {
    if (!loading && isUatUser && uatRestrictedRoutes.includes(pathname)) {
      router.replace('/Zopper-Administrator/spot-incentive-report');
    }
  }, [loading, isUatUser, pathname, router]);

  if (loading) {
    return null; // or a loading spinner
  }

  // Prevent rendering restricted content for UAT users
  if (isUatUser && uatRestrictedRoutes.includes(pathname)) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-black text-white flex flex-col border-r border-neutral-700 h-full transition-all duration-300 ease-in-out overflow-hidden`}
      >
        {/* Logo */}
        <div className="relative w-full h-[69px] bg-black border-b border-[#353535] overflow-hidden">
          <div
            className="absolute w-[48px] h-[48px] top-[10px] left-[12px] rounded-[12px]"
            style={{
              backgroundColor: '#5E1846'
            }}
          />

          <div
            className="absolute flex items-center justify-center h-[26px] top-[21px] left-[21px] text-white font-bold text-[24px] leading-[26px] whitespace-nowrap z-[1]"
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              width: '30px'
            }}
          >
            S
          </div>

          <div
            className="absolute flex items-start justify-start h-[24px] top-[14px] left-[72px] font-bold text-[20px] leading-[24px] whitespace-nowrap z-[3]"
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <span className="text-white">Sales</span><span className="text-[#3056FF]">mitr</span>
          </div>

          <div
            className="absolute flex items-start justify-start h-[16px] top-[36px] left-[72px] text-white font-medium text-[11px] leading-[16px] whitespace-nowrap z-[2]"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            Safalta ka Sathi
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-[20px] right-[15px] p-2 rounded-md bg-slate-800 text-white hover:bg-slate-700 transition-colors z-[4]"
            title="Collapse Menu"
          >
            <FaBars size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-4 text-sm font-normal overflow-y-auto">
          <div className="space-y-1 px-3">
            {/* Home - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                  }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"
                    fill="white"
                  />
                </svg>
                <span className="text-sm leading-normal">Home</span>
              </Link>
            )}

            {/* Spot Incentive Report - Show for all */}
            <Link
              href="/Zopper-Administrator/spot-incentive-report"
              className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator/spot-incentive-report')
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-white hover:bg-white/5'
                }`}
            >
              <span className="text-lg shrink-0">📘</span>
              <span className="text-sm leading-normal">Spot Incentive Report</span>
            </Link>

            {/* View Leaderboard - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator/leaderboard"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator/leaderboard')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                  }`}
              >
                <span className="text-lg shrink-0">🏆</span>
                <span className="text-sm leading-normal">View Leaderboard</span>
              </Link>
            )}

            {/* User Validation - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator/validate-user"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator/validate-user')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                  }`}
              >
                <span className="text-lg shrink-0">👤</span>
                <span className="text-sm leading-normal">User Validation</span>
              </Link>
            )}

            {/* Store Change Requests - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator/store-change-requests"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator/store-change-requests')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                  }`}
              >
                <span className="text-lg shrink-0">🏪</span>
                <span className="text-sm leading-normal">Store Change Requests</span>
              </Link>
            )}

            {/* Referral - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator/referral"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${pathname?.startsWith('/Zopper-Administrator/referral')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg shrink-0">📄</span>
                <span className="text-sm leading-normal">Referral</span>
              </Link>
            )}

            {/* Canvasser Help Requests - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator/help-requests"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator/help-requests')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                  }`}
              >
                <span className="text-lg shrink-0">🆘</span>
                <span className="text-sm leading-normal">Canvasser Help Requests</span>
              </Link>
            )}

            {/* Process Voucher Excel - Hide for UAT users */}
            {!isUatUser && (
              <Link
                href="/Zopper-Administrator/process-voucher-excel"
                className={`w-full flex items-center space-x-3 rounded-lg py-2.5 px-3 select-none ${isActive('/Zopper-Administrator/process-voucher-excel')
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-white hover:bg-white/5'
                  }`}
              >
                <span className="text-lg shrink-0">📊</span>
                <span className="text-sm leading-normal">Process Voucher Excel</span>
              </Link>
            )}




          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto relative ${!sidebarOpen ? 'pl-16' : ''}`}>
        {/* Hamburger button when sidebar is hidden */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-40">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-md bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-lg"
              title="Expand Menu"
            >
              <FaBars size={18} />
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
