'use client';

import { useEffect, useState } from 'react';
import LandingPage from '../../login/sec/LandingPage.jsx';

export default function SECHomePage() {
  const [userName, setUserName] = useState('Guest');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let finalName = '';

    // 1) Preferred: derive from authUser stored by login flows
    try {
      const raw = window.localStorage.getItem('authUser');
      if (raw) {
        const auth = JSON.parse(raw) as any;
        const fromProfile = auth?.profile?.fullName || auth?.profile?.phone;
        const fromRoot = auth?.fullName || auth?.username || auth?.phone;
        finalName = (fromProfile || fromRoot || '').trim();
      }
    } catch {
      // ignore JSON parse errors and fall back to older keys
    }

    // 2) Backwards-compatible fallback: older SEC keys and first/last name
    if (!finalName) {
      const storedFirst = window.localStorage.getItem('firstName') || '';
      const storedLast = window.localStorage.getItem('lastName') || '';
      const storedFull = window.localStorage.getItem('secUserName') || '';
      finalName = (storedFull || `${storedFirst} ${storedLast}`).trim();
    }

    // 3) Final fallback: SEC ID if present
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
