'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '@/styles/FestiveHeader.module.css';
import { clientLogout } from '@/lib/clientLogout';
import PineLeaves from './PineLeaves';

interface FestiveHeaderProps {
  userName?: string;
  hideGreeting?: boolean;
}

export default function FestiveHeader({ userName = 'Guest', hideGreeting = false }: FestiveHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clientLogout('/login/canvasser');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Redirect SEC users without a full name to the name capture screen
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname || '';

    if (!pathname.startsWith('/canvasser') || pathname === '/canvasser/onboarding') {
      return;
    }

    try {
      const raw = window.localStorage.getItem('authUser');
      if (!raw) return;

      const auth = JSON.parse(raw);
      const fullName = (auth?.fullName || '').trim();

      if (!fullName) {
        window.location.href = '/canvasser/onboarding';
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  return (
    <header className={styles.header}>
      {/* Pine Leaves - Left and Right corners */}
      <PineLeaves position="left" />
      <PineLeaves position="right" />

      {/* Snowflakes */}
      <div className={styles.snow}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className={styles.snowflake} />
        ))}
      </div>

      {/* Header Content */}
      <div className={styles.content}>
        {!hideGreeting ? (
          <div className={styles.greeting}>
            {/* <Image
              src="/images/santa-hat.png"
              alt=""
              width={60}
              height={60}
              className={styles.santaHat}
              priority
            /> */}
            <div className={styles.greetingText}>
              <h1>Hello {userName}</h1>
              <p>Welcome! Choose your action below</p>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Profile Button */}
        <div ref={menuRef} style={{ position: 'relative', zIndex: 9999 }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={styles.profileButton}
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
              style={{ zIndex: 99999 }}
            >
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  window.location.href = '/canvasser/profile';
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">My Account</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Snow Bottom Edge - SVG wavy */}
      <div className={styles.snowBottom}>
        <svg
          className={styles.snowBottomSvg}
          viewBox="0 0 1440 50"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,25 C60,15 120,35 180,25 C240,15 300,35 360,25 C420,15 480,35 540,25 C600,15 660,35 720,25 C780,15 840,35 900,25 C960,15 1020,35 1080,25 C1140,15 1200,35 1260,25 C1320,15 1380,35 1440,25 L1440,50 L0,50 Z"
            fill="#ffffff"
          />
          <path
            d="M0,30 C50,22 100,38 150,30 C200,22 250,38 300,30 C350,22 400,38 450,30 C500,22 550,38 600,30 C650,22 700,38 750,30 C800,22 850,38 900,30 C950,22 1000,38 1050,30 C1100,22 1150,38 1200,30 C1250,22 1300,38 1350,30 C1400,22 1440,30 1440,30 L1440,50 L0,50 Z"
            fill="rgba(230, 240, 250, 0.6)"
          />
        </svg>
      </div>
    </header>
  );
}
