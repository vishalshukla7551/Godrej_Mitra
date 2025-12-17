'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/FestiveFooter.module.css';

export default function FestiveFooter() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (!pathname) return 'home';
    if (pathname.includes('/incentive-form')) return 'form';
    if (pathname.includes('/passbook') || pathname.includes('/incentive-passbook')) return 'passbook';
    if (pathname.includes('/training')) return 'training';
    if (pathname.includes('/leaderboard')) return 'leaderboard';
    if (pathname.includes('/home')) return 'home';
    return 'home';
  };

  const active = getActiveTab();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      href: '/SEC/home',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'form',
      label: 'Incentive\nForm',
      href: '/SEC/incentive-form',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      id: 'passbook',
      label: 'Incentive\nPassbook',
      href: '/SEC/passbook',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      href: '/SEC/leaderboard',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'training',
      label: 'Training &\nQuizzes',
      href: '/SEC/training',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
    },
  ];

  return (
    <footer className={styles.footer}>
      {/* SVG with wavy snow on top, dark footer below */}
      <svg
        className={styles.snowWave}
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* White snow bumps at top - wavy edge */}
        <path
          d="M0,15 C60,8 120,22 180,15 C240,8 300,22 360,15 C420,8 480,22 540,15 C600,8 660,22 720,15 C780,8 840,22 900,15 C960,8 1020,22 1080,15 C1140,8 1200,22 1260,15 C1320,8 1380,15 1440,12 L1440,0 L0,0 Z"
          fill="#ffffff"
        />
        {/* Dark footer background - fills below the wavy snow */}
        <path
          d="M0,15 C60,8 120,22 180,15 C240,8 300,22 360,15 C420,8 480,22 540,15 C600,8 660,22 720,15 C780,8 840,22 900,15 C960,8 1020,22 1080,15 C1140,8 1200,22 1260,15 C1320,8 1380,15 1440,12 L1440,40 L0,40 Z"
          fill="#1a1a2e"
        />
      </svg>

      {/* Dark footer content area */}
      <div className={styles.footerContent}>
        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${active === item.id ? styles.active : ''}`}
            >
              {item.icon}
              <span className={styles.navLabel} style={{ whiteSpace: 'pre-line' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Powered by Zopper */}
        <div className={styles.poweredBy}>
          <p>Powered by Zopper</p>
          <p>salesdost.com</p>
        </div>
      </div>
    </footer>
  );
}