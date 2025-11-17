'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SECFooter() {
  const pathname = usePathname();

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (!pathname) return 'home';
    if (pathname.includes('/passbook') || pathname.includes('/incentive-passbook')) {
      return 'passbook';
    }
    if (pathname.includes('/training')) {
      return 'training';
    }
    if (pathname.includes('/leaderboard')) {
      return 'leaderboard';
    }
    if (pathname.includes('/profile')) {
      return 'profile';
    }
    if (pathname.includes('/incentive-form')) {
      return 'home';
    }
    if (pathname.includes('/home')) {
      return 'home';
    }
    return 'home';
  };

  const active = getActiveTab();

  const linkClasses = (tab) =>
    `flex flex-col items-center gap-0.5 min-w-[60px] transition-colors ${
      active === tab ? 'text-white' : 'text-gray-400'
    }`;
  const iconClasses = (tab) =>
    `w-6 h-6 transition-colors ${active === tab ? 'text-white' : 'text-gray-400'}`;
  const labelClasses = (tab) =>
    `text-[10px] ${active === tab ? 'font-semibold' : 'font-normal'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black text-white z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
      <div className="flex justify-around items-center py-3">
        <Link href="/SEC/home" className={linkClasses('home')}>
          <svg
            className={iconClasses('home')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className={labelClasses('home')}>Home</span>
        </Link>

        <Link href="/SEC/passbook" className={linkClasses('passbook')}>
          <svg
            className={iconClasses('passbook')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className={`${labelClasses('passbook')} text-center leading-tight`}>Incentive<br/>Passbook</span>
        </Link>

        <Link href="/SEC/training" className={linkClasses('training')}>
          <svg
            className={iconClasses('training')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className={`${labelClasses('training')} text-center leading-tight`}>Training &<br/>Quiz</span>
        </Link>

        <Link href="/SEC/leaderboard" className={linkClasses('leaderboard')}>
          <div className="relative flex flex-col items-center gap-0.5 min-w-[60px]">
            <svg
              className={iconClasses('leaderboard')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">
              2
            </span>
            <span className={labelClasses('leaderboard')}>Leaderboard</span>
          </div>
        </Link>

        <Link href="/SEC/profile" className={linkClasses('profile')}>
          <svg
            className={iconClasses('profile')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className={labelClasses('profile')}>Profile</span>
        </Link>
      </div>

      {/* Powered by Zopper */}
      <div className="text-center py-2 border-t border-gray-800">
        <p className="text-[10px] text-gray-400 leading-tight">
          Powered by Zopper
        </p>
        <p className="text-[9px] text-gray-500 leading-tight">salesdost.com</p>
      </div>
    </nav>
  );
}
