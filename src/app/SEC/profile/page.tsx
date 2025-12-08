'use client';

import { useState, useEffect } from 'react';
import SECHeader from '../SECHeader.jsx';
import SECFooter from '../SECFooter.jsx';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [submittingPersonalInfo, setSubmittingPersonalInfo] = useState(false);
  const [personalInfoError, setPersonalInfoError] = useState<string | null>(null);
  
  const [panNumber, setPanNumber] = useState('');
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panError, setPanError] = useState<string | null>(null);
  const [kycData, setKycData] = useState<any>(null);
  
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [chequeFile, setChequeFile] = useState<File | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('authUser');
      if (!raw) return;

      const auth = JSON.parse(raw) as any;
      const fullNameFromAuth = (auth?.fullName || '').trim();
      const phoneFromAuth = (auth?.username || auth?.phone || '').trim();
      const storeNameFromAuth = auth?.store?.name || '';
      const agencyNameFromAuth = (auth?.AgencyName || '').trim();
      const agentCodeFromAuth = (auth?.AgentCode || '').trim();

      if (fullNameFromAuth) setFullName(fullNameFromAuth);
      if (phoneFromAuth) setPhoneNumber(phoneFromAuth);
      if (storeNameFromAuth) setStoreName(storeNameFromAuth);
      if (agencyNameFromAuth) setAgencyName(agencyNameFromAuth);
      if (agentCodeFromAuth) setAgentCode(agentCodeFromAuth);

      // Load existing KYC info if available
      if (auth?.kycInfo) {
        setKycData(auth.kycInfo);
        setPanVerified(true);
        setPanNumber(auth.kycInfo.pan || '');
        setKycStatus('approved');
      }
    } catch {
      // ignore parse/storage errors
    }

    // Also fetch KYC info from server
    fetchKycInfo();
  }, []);

  const fetchKycInfo = async () => {
    try {
      const response = await fetch('/api/sec/kyc/info');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasKycInfo) {
          setKycData(data.kycInfo);
          setPanVerified(true);
          setPanNumber(data.kycInfo.pan || '');
          setKycStatus('approved');
        }
      }
    } catch (error) {
      console.error('Error fetching KYC info:', error);
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalInfoError(null);

    try {
      setSubmittingPersonalInfo(true);

      const res = await fetch('/api/sec/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyName: agencyName.trim() || null,
          agentCode: agentCode.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to update profile');
      }

      const responseData = await res.json();

      // Update localStorage with new data
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('authUser');
          if (raw) {
            const parsed = JSON.parse(raw) as any;
            const updated = {
              ...parsed,
              AgencyName: responseData.AgencyName,
              AgentCode: responseData.AgentCode,
            };
            window.localStorage.setItem('authUser', JSON.stringify(updated));
          }
        } catch {
          // ignore parse/storage errors
        }
      }

      alert('Personal info saved successfully!');
    } catch (err: any) {
      setPersonalInfoError(err.message || 'Failed to update profile');
    } finally {
      setSubmittingPersonalInfo(false);
    }
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanError(null);

    if (!panNumber.trim()) {
      setPanError('Please enter PAN number');
      return;
    }

    try {
      setVerifyingPan(true);

      const response = await fetch('/api/sec/kyc/verify-pan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pan: panNumber.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPanVerified(true);
        setKycStatus('approved');
        setKycData(data.kycInfo);
        
        // Update the full name in the UI
        setFullName(data.fullName);
        
        // Update localStorage with new data
        if (typeof window !== 'undefined') {
          try {
            const raw = window.localStorage.getItem('authUser');
            if (raw) {
              const parsed = JSON.parse(raw) as any;
              const updated = {
                ...parsed,
                fullName: data.fullName,
                secId: data.secUser.id,
                kycInfo: data.kycInfo,
              };
              window.localStorage.setItem('authUser', JSON.stringify(updated));
            }
          } catch {
            // ignore parse/storage errors
          }
        }

        alert('PAN verified successfully! Your KYC information has been saved.');
      } else {
        setPanError(data.error || 'PAN verification failed');
      }
    } catch (error) {
      setPanError('Failed to verify PAN. Please try again.');
      console.error('PAN verification error:', error);
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleBankingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber !== confirmAccountNumber) {
      alert('Account numbers do not match!');
      return;
    }
    console.log('Banking Info submitted:', { bankName, accountHolderName, accountNumber, ifscCode });
    alert('Banking info saved successfully!');
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <SECHeader />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 pb-6">
          {/* Page Title */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Profile</h1>
            <p className="text-sm text-gray-600">
              Please complete your verification & payout details
            </p>
          </div>

          {/* SECTION 1: Personal Info */}
          <section className="mb-5 bg-white rounded-2xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-base font-semibold text-gray-900">Personal Info*</h2>
              </div>
            </div>

            <form onSubmit={handlePersonalInfoSubmit}>
              {/* Personal Details */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Personal Details</span>
                </div>
                <button type="button" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Full Name */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Full Name</label>
                <div className="text-sm font-medium text-gray-900">{fullName || 'Rajesh Kumar'}</div>
              </div>

              {/* Phone Number */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
                <div className="text-sm font-medium text-gray-900">{phoneNumber}</div>
              </div>

              {/* Store Details */}
              <div className="mb-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">Store Details</span>
                  </div>
                  <button type="button" className="text-gray-600 hover:text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Store Name</label>
                  <div className="text-sm font-medium text-gray-900">{storeName}</div>
                </div>
              </div>

              {/* Agency */}
              <div className="mb-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">Agency</span>
                </div>
                <div className="mb-3">
                  <label htmlFor="agencyName" className="block text-xs text-gray-600 mb-1">Agency Name</label>
                  <input
                    type="text"
                    id="agencyName"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Enter Agency Name"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="agentCode" className="block text-xs text-gray-600 mb-1">Agent Code</label>
                  <input
                    type="text"
                    id="agentCode"
                    value={agentCode}
                    onChange={(e) => setAgentCode(e.target.value)}
                    placeholder="Enter Agent Code"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Error Message */}
              {personalInfoError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-700">{personalInfoError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingPersonalInfo}
                className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {submittingPersonalInfo ? 'Saving...' : 'Submit'}
              </button>
            </form>
          </section>

          {/* SECTION 2: KYC Info */}
          <section className="mb-5 bg-white rounded-2xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-base font-semibold text-gray-900">KYC Info</h2>
            </div>

            <form onSubmit={handleKYCSubmit}>
              {/* PAN Number */}
              <div className="mb-4">
                <label htmlFor="panNumber" className="block text-xs text-gray-600 mb-1">PAN Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="panNumber"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="Enter PAN Number"
                    maxLength={10}
                    disabled={panVerified}
                    className={`flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      panVerified ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                  />
                  {panVerified && (
                    <div className="flex items-center px-3 py-3 bg-green-50 border border-green-300 rounded-xl">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {panError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-700">{panError}</p>
                </div>
              )}

              {/* Success Message */}
              {panVerified && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700">
                    ✓ PAN verified successfully! Your KYC information has been saved.
                  </p>
                </div>
              )}

              {/* KYC Information Display */}
              {panVerified && kycData && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Verified KYC Information</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Name:</span>
                      <span className="font-medium text-blue-900">{kycData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">PAN:</span>
                      <span className="font-medium text-blue-900">{kycData.pan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Gender:</span>
                      <span className="font-medium text-blue-900 capitalize">{kycData.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Date of Birth:</span>
                      <span className="font-medium text-blue-900">{kycData.dob}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Aadhaar Linked:</span>
                      <span className={`font-medium ${kycData.aadhaarLinked ? 'text-green-700' : 'text-red-700'}`}>
                        {kycData.aadhaarLinked ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}



              {/* KYC Status Badge */}
              <div className="mb-4">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  panVerified 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-yellow-100 border border-yellow-300'
                }`}>
                  <span className={`text-xs font-medium ${
                    panVerified ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {panVerified ? 'Verified' : 'Pending'}
                  </span>
                  <svg className={`w-3 h-3 ${
                    panVerified ? 'text-green-600' : 'text-yellow-600'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    {panVerified ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={verifyingPan || panVerified}
                className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingPan ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying PAN...
                  </>
                ) : panVerified ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify PAN
                  </>
                )}
              </button>
            </form>
          </section>

          {/* SECTION 3: Banking Info */}
          <section className="mb-5 bg-white rounded-2xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h2 className="text-base font-semibold text-gray-900">Banking Info</h2>
            </div>

            <form onSubmit={handleBankingSubmit}>
              {/* Bank Name */}
              <div className="mb-4">
                <label htmlFor="bankName" className="block text-xs text-gray-600 mb-1">Bank Name</label>
                <select
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem',
                  }}
                >
                  <option value="">Select Bank</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                </select>
              </div>

              {/* Account Holder Name */}
              <div className="mb-4">
                <label htmlFor="accountHolderName" className="block text-xs text-gray-600 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  id="accountHolderName"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Enter Account Holder Name"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Account Number */}
              <div className="mb-4">
                <label htmlFor="accountNumber" className="block text-xs text-gray-600 mb-1">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter Account Number"
                  inputMode="numeric"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Confirm Account Number */}
              <div className="mb-4">
                <label htmlFor="confirmAccountNumber" className="block text-xs text-gray-600 mb-1">Confirm Account Number</label>
                <input
                  type="text"
                  id="confirmAccountNumber"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter Account Number"
                  inputMode="numeric"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* IFSC Code */}
              <div className="mb-4">
                <label htmlFor="ifscCode" className="block text-xs text-gray-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  id="ifscCode"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="Enter IFSC Code"
                  maxLength={11}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload Cancelled Cheque */}
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">Upload Cancelled Cheque / Passbook</label>
                <label
                  htmlFor="chequeUpload"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {chequeFile ? chequeFile.name : 'Choose File'}
                </label>
                <input
                  type="file"
                  id="chequeUpload"
                  accept="image/*,.pdf"
                  onChange={(e) => setChequeFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              {/* Note */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Note:</span> These details will be used for incentive payout to your account.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Submit
              </button>
            </form>
          </section>
        </div>
      </main>

      <SECFooter />
    </div>
  );
}
