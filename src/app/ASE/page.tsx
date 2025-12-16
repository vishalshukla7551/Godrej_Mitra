'use client';

import { useEffect, useState } from 'react';
import ChristmasDashboard from '@/components/ChristmasDashboard';

interface ASEProfileApiResponse {
  success: boolean;
  data?: { ase: { id: string; fullName: string; phone: string }; stores: any[] };
  error?: string;
}

const WalletIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="4" y="7" width="16" height="11" rx="2" fill="white"/><path d="M4 9C4 7.89543 4.89543 7 6 7H18C19.1046 7 20 7.89543 20 9V10H4V9Z" fill="white" fillOpacity="0.9"/><circle cx="15" cy="13.5" r="2" fill="rgba(16,185,129,0.3)"/></svg>
);

const ReportIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M18.6673 2.6665H8.00064C7.2934 2.6665 6.61512 2.94746 6.11502 3.44755C5.61493 3.94765 5.33398 4.62593 5.33398 5.33317V26.6665C5.33398 27.3737 5.61493 28.052 6.11502 28.5521C6.61512 29.0522 7.2934 29.3332 8.00064 29.3332H24.0007C24.7079 29.3332 25.3862 29.0522 25.8863 28.5521C26.3864 28.052 26.6673 27.3737 26.6673 26.6665V10.6665L18.6673 2.6665ZM24.0007 26.6665H8.00064V5.33317H17.334V11.9998H24.0007V26.6665Z" fill="white"/></svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><path d="M15.9998 20.6668C14.7621 20.6668 13.5751 20.1751 12.7 19.2999C11.8248 18.4247 11.3331 17.2378 11.3331 16.0001C11.3331 14.7624 11.8248 13.5754 12.7 12.7003C13.5751 11.8251 14.7621 11.3334 15.9998 11.3334C17.2375 11.3334 18.4244 11.8251 19.2996 12.7003C20.1748 13.5754 20.6665 14.7624 20.6665 16.0001C20.6665 17.2378 20.1748 18.4247 19.2996 19.2999C18.4244 20.1751 17.2375 20.6668 15.9998 20.6668ZM25.9065 17.2934C25.9598 16.8668 25.9998 16.4401 25.9998 16.0001C25.9998 15.5601 25.9598 15.1201 25.9065 14.6668L28.7198 12.4934C28.9731 12.2934 29.0398 11.9334 28.8798 11.6401L26.2131 7.02675C26.0531 6.73342 25.6931 6.61342 25.3998 6.73342L22.0798 8.06675C21.3865 7.54675 20.6665 7.09342 19.8265 6.76008L19.3331 3.22675C19.306 3.06971 19.2242 2.92732 19.1022 2.82482C18.9802 2.72232 18.8258 2.66632 18.6665 2.66675H13.3331C12.9998 2.66675 12.7198 2.90675 12.6665 3.22675L12.1731 6.76008C11.3331 7.09342 10.6131 7.54675 9.91979 8.06675L6.59979 6.73342C6.30645 6.61342 5.94645 6.73342 5.78645 7.02675L3.11979 11.6401C2.94645 11.9334 3.02645 12.2934 3.27979 12.4934L6.09312 14.6668C6.03979 15.1201 5.99979 15.5601 5.99979 16.0001C5.99979 16.4401 6.03979 16.8668 6.09312 17.2934L3.27979 19.5068C3.02645 19.7068 2.94645 20.0668 3.11979 20.3601L5.78645 24.9734C5.94645 25.2668 6.30645 25.3734 6.59979 25.2668L9.91979 23.9201C10.6131 24.4534 11.3331 24.9068 12.1731 25.2401L12.6665 28.7734C12.7198 29.0934 12.9998 29.3334 13.3331 29.3334H18.6665C18.9998 29.3334 19.2798 29.0934 19.3331 28.7734L19.8265 25.2401C20.6665 24.8934 21.3865 24.4534 22.0798 23.9201L25.3998 25.2668C25.6931 25.3734 26.0531 25.2668 26.2131 24.9734L28.8798 20.3601C29.0398 20.0668 28.9731 19.7068 28.7198 19.5068L25.9065 17.2934Z" fill="white"/></svg>
);

export default function ASEPage() {
  const [aseName, setAseName] = useState('User');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchASEProfile = async () => {
      try {
        const res = await fetch('/api/ase/profile');
        if (res.ok) {
          const json = (await res.json()) as ASEProfileApiResponse;
          if (json.success && json.data?.ase?.fullName) {
            const firstName = json.data.ase.fullName.split(' ')[0];
            setAseName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase());
          }
        }
      } catch (error) { console.error('Error fetching ASE profile:', error); }
      finally { setLoading(false); }
    };
    fetchASEProfile();
  }, []);

  const cards = [
    { title: 'Incentive Wallet', description: 'Track your earnings', href: '/ASE/wallet', badge: '₹12,450 Available', color: 'green' as const, icon: <WalletIcon /> },
    { title: 'View Reports', description: 'Check your stores performance', href: '/ASE/report', badge: 'Analytics Ready', color: 'blue' as const, icon: <ReportIcon /> },
    { title: 'Store Settings', description: 'Manage your store configuration', href: '/ASE/profile', badge: 'Configure', color: 'orange' as const, icon: <SettingsIcon /> },
  ];

  return <ChristmasDashboard userName={aseName} loading={loading} cards={cards} hideSanta={true} />;
}
