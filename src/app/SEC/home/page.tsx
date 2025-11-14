'use client';

import { useEffect, useState } from 'react';
import LandingPage from '../../login/sec/LandingPage.jsx';

export default function SECHomePage() {
  const [userName, setUserName] = useState('Guest');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try to derive name from stored profile / SEC-related info
    const storedFirst = window.localStorage.getItem('firstName') || '';
    const storedLast = window.localStorage.getItem('lastName') || '';
    const storedFull = window.localStorage.getItem('secUserName') || '';

    let finalName = (storedFull || `${storedFirst} ${storedLast}`).trim();

    // As a fallback, if SEC ID exists but name is missing, show SEC ID
    if (!finalName) {
      const secId = window.localStorage.getItem('secId');
      if (secId) finalName = secId;
    }

    if (finalName) {
      setUserName(finalName);
    }
  }, []);

  return <LandingPage userName={userName} />;
}
