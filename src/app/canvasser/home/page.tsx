'use client';

import { useEffect, useState } from 'react';
import { clientLogout } from '@/lib/clientLogout';
import LandingPage from './component/LandingPage.jsx';

export default function CanvasserHomePage() {
  const [userName, setUserName] = useState('Guest');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('authUser');
      if (!raw) {
        // No authUser found - logout
        clientLogout('/login/canvasser');
        return;
      }

      const auth = JSON.parse(raw) as any;
      
      // Validate required fields - role must be valid
      const VALID_ROLES = ['CANVASSER'];
      if (!auth.role || !VALID_ROLES.includes(auth.role)) {
        // Invalid authUser - logout
        clientLogout('/login/canvasser');
        return;
      }

      const fullName = (auth?.fullName || '').trim();

      if (fullName) {
        // Extract only the first name and convert to proper case
        const firstName = fullName.split(' ')[0];
        const properCaseFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        setUserName(properCaseFirstName);
      }
    } catch {
      // JSON parse error or other error - logout
      clientLogout('/login/canvasser');
    }
  }, []);

  return <LandingPage userName={userName} />;
}
