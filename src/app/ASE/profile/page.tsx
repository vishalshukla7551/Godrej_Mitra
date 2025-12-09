'use client';

import { useEffect, useState } from 'react';

interface ASEProfileApiResponse {
  success: boolean;
  data?: {
    ase: {
      id: string;
      fullName: string;
      phone: string;
    };
    stores: StoreInfo[];
  };
  error?: string;
}

interface StoreInfo {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

interface StoreChangeRequest {
  id: string;
  requestedStoreIds: string[];
  currentStoreIds: string[];
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewNotes?: string;
}

interface AllStoresResponse {
  success: boolean;
  data: {
    stores: StoreInfo[];
  };
}

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    
    // Store Details (prefilled from mapped Store for this ASE)
    storeName: '',
    storeAddress: '',
    storeCategory: '',
    
    // Agency & ASE
    agencyName: '',
    aseCode: '',
    referralCode: '',
    
    // Banking Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  // PAN verification state
  const [panNumber, setPanNumber] = useState('');
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panError, setPanError] = useState<string | null>(null);
  const [kycData, setKycData] = useState<any>(null);

  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [allStores, setAllStores] = useState<StoreInfo[]>([]);
  const [pendingRequest, setPendingRequest] = useState<StoreChangeRequest | null>(null);
  const [showStoreChangeModal, setShowStoreChangeModal] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchKycInfo = async () => {
    try {
      const response = await fetch('/api/ase/kyc/info');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasKycInfo) {
          setKycData(data.kycInfo);
          setPanVerified(true);
          setPanNumber(data.kycInfo.pan || '');
        }
      }
    } catch (error) {
      console.error('Error fetching KYC info:', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/ase/profile');
        if (!res.ok) {
          throw new Error('Failed to load ASE profile');
        }

        const json = (await res.json()) as ASEProfileApiResponse;
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Failed to load ASE profile');
        }

        const { ase, stores: apiStores } = json.data;

        // Save all mapped stores
        setStores(apiStores || []);
        const primaryStore = apiStores && apiStores.length > 0 ? apiStores[0] : null;

        // Build a combined string of all mapped store names, e.g. "Store A, Store B"
        const allStoreNames = (apiStores || []).map((s) => s.name).join(', ');

        setFormData(prev => ({
          ...prev,
          // personal details we know from ASE profile
          fullName: ase.fullName || prev.fullName,
          phoneNumber: ase.phone || prev.phoneNumber,
          // show all mapped store names in a single read-only field
          storeName: allStoreNames || primaryStore?.name || '',
          storeAddress: primaryStore
            ? [primaryStore.city, primaryStore.state].filter(Boolean).join(', ')
            : '',
        }));

        // Fetch pending store change request
        const requestRes = await fetch('/api/ase/store-change-request');
        if (requestRes.ok) {
          const requestJson = await requestRes.json();
          if (requestJson.success && requestJson.data.pendingRequest) {
            setPendingRequest(requestJson.data.pendingRequest);
          }
        }
      } catch (err) {
        console.error(err);
        setProfileError('Unable to load profile details.');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    fetchKycInfo();
  }, []);

  const fetchAllStores = async (search = '') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      // Always include currently selected store IDs to ensure they appear
      if (selectedStoreIds.length > 0) {
        params.append('includeIds', selectedStoreIds.join(','));
      }
      
      const res = await fetch(`/api/ase/stores?${params}`);
      if (res.ok) {
        const json: AllStoresResponse = await res.json();
        if (json.success) {
          setAllStores(json.data.stores);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const handleEditStores = async () => {
    const currentStoreIds = stores.map(s => s.id);
    setSelectedStoreIds(currentStoreIds);
    setShowStoreChangeModal(true);
    
    // Fetch all stores, including the currently selected ones
    const params = new URLSearchParams();
    if (currentStoreIds.length > 0) {
      params.append('includeIds', currentStoreIds.join(','));
    }
    
    try {
      const res = await fetch(`/api/ase/stores?${params}`);
      if (res.ok) {
        const json: AllStoresResponse = await res.json();
        if (json.success) {
          setAllStores(json.data.stores);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const handleStoreSelection = (storeId: string, selected: boolean) => {
    if (selected) {
      setSelectedStoreIds(prev => [...prev, storeId]);
    } else {
      setSelectedStoreIds(prev => prev.filter(id => id !== storeId));
    }
  };

  const handleSubmitStoreChangeRequest = async () => {
    if (selectedStoreIds.length === 0) {
      alert('Please select at least one store');
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/ase/store-change-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestedStoreIds: selectedStoreIds,
          reason: changeReason
        })
      });

      const json = await res.json();
      if (json.success) {
        alert('Store change request submitted successfully! It will be reviewed by an administrator.');
        setShowStoreChangeModal(false);
        setChangeReason('');
        setSelectedStoreIds([]);
        // Refresh pending request
        const requestRes = await fetch('/api/ase/store-change-request');
        if (requestRes.ok) {
          const requestJson = await requestRes.json();
          if (requestJson.success && requestJson.data.pendingRequest) {
            setPendingRequest(requestJson.data.pendingRequest);
          } else {
            setPendingRequest(null);
          }
        }
      } else {
        alert(json.error || 'Failed to submit store change request');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Failed to submit store change request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handlePanVerification = async () => {
    setPanError(null);

    if (!panNumber.trim()) {
      setPanError('Please enter PAN number');
      return;
    }

    try {
      setVerifyingPan(true);

      const response = await fetch('/api/ase/kyc/verify-pan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pan: panNumber.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPanVerified(true);
        setKycData(data.kycInfo);
        
        // Update the full name in the form data
        setFormData(prev => ({
          ...prev,
          fullName: data.fullName
        }));

        alert('PAN verified successfully! Your name has been updated from PAN details.');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
  };



  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-700 to-slate-800 px-16 py-10">
      {/* Page Title */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-bold text-white">Your Profile</h1>
        </div>
        <a
          href="/login/role"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17L21 12L16 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Logout</span>
        </a>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Top row - Personal Details & Store Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Personal Details Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="8" r="4" fill="white" />
                  <path
                    d="M20 21C20 17.134 16.418 14 12 14C7.582 14 4 17.134 4 21"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your complete name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Store Details Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Store Details</h2>
              </div>
              <button
                type="button"
                onClick={handleEditStores}
                disabled={pendingRequest?.status === 'PENDING'}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  pendingRequest?.status === 'PENDING'
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pendingRequest?.status === 'PENDING' ? 'Request Pending' : 'Edit'}
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name(s)
                </label>
                <div className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 max-h-32 overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    {stores.length ? (
                      stores.map((store) => (
                        <span
                          key={store.id}
                          className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm"
                        >
                          {store.name}
                          {store.city && (
                            <span className="ml-1 text-xs text-gray-500">- {store.city}</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No stores mapped</span>
                    )}
                  </div>
                </div>
              </div>

              {pendingRequest && (
                <div className={`border rounded-lg p-4 ${
                  pendingRequest.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                  pendingRequest.status === 'APPROVED' ? 'bg-green-50 border-green-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        pendingRequest.status === 'PENDING' ? 'bg-yellow-400' :
                        pendingRequest.status === 'APPROVED' ? 'bg-green-400' :
                        'bg-red-400'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        pendingRequest.status === 'PENDING' ? 'text-yellow-800' :
                        pendingRequest.status === 'APPROVED' ? 'text-green-800' :
                        'text-red-800'
                      }`}>
                        Store Change Request {pendingRequest.status}
                      </span>
                    </div>
                    {(pendingRequest.status === 'APPROVED' || pendingRequest.status === 'REJECTED') && (
                      <button
                        onClick={() => setPendingRequest(null)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                        title="Dismiss notification"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {pendingRequest.status === 'PENDING' && (
                    <p className="text-sm text-yellow-700 mb-2">
                      Your request to change store mapping is under review by the administrator.
                    </p>
                  )}
                  {pendingRequest.status === 'APPROVED' && (
                    <p className="text-sm text-green-700 mb-2">
                      Your store change request has been approved! Your store mapping has been updated. You can now submit a new request if needed.
                    </p>
                  )}
                  {pendingRequest.status === 'REJECTED' && (
                    <p className="text-sm text-red-700 mb-2">
                      Your store change request has been rejected. You can submit a new request with different stores or reason.
                    </p>
                  )}
                  <p className={`text-xs ${
                    pendingRequest.status === 'PENDING' ? 'text-yellow-600' :
                    pendingRequest.status === 'APPROVED' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    Submitted: {new Date(pendingRequest.createdAt).toLocaleDateString()}
                  </p>
                  {pendingRequest.reason && (
                    <p className={`text-xs mt-1 ${
                      pendingRequest.status === 'PENDING' ? 'text-yellow-600' :
                      pendingRequest.status === 'APPROVED' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      Reason: {pendingRequest.reason}
                    </p>
                  )}
                  {pendingRequest.reviewNotes && (
                    <p className={`text-xs mt-1 ${
                      pendingRequest.status === 'PENDING' ? 'text-yellow-600' :
                      pendingRequest.status === 'APPROVED' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      Admin Notes: {pendingRequest.reviewNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle row - Agency & ASE and KYC/PAN Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Agency & ASE Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                    />
                    <circle cx="9" cy="7" r="4" fill="white" />
                    <path
                      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Agency & ASE</h2>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-semibold">
                ₹1068.24
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agency Name
                </label>
                <input
                  type="text"
                  placeholder="Enter agency name"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ASE Code
                </label>
                <input
                  type="text"
                  placeholder="Enter ASE code"
                  value={formData.aseCode}
                  onChange={(e) => setFormData({ ...formData, aseCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Code
                </label>
                <input
                  type="text"
                  placeholder="Please enter referral code"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* KYC/PAN Details Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="2" fill="none" />
                  <path d="M3 8H21" stroke="white" strokeWidth="2" />
                  <circle cx="7" cy="14" r="2" fill="white" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">KYC/PAN Details</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter PAN number"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    maxLength={10}
                    disabled={panVerified}
                    className={`flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 ${
                      panVerified ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                  />
                  {panVerified && (
                    <div className="flex items-center px-3 py-3 bg-green-50 border border-green-300 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {panError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{panError}</p>
                </div>
              )}

              {/* Success Message */}
              {panVerified && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ PAN verified successfully! Your name has been updated from PAN details.
                  </p>
                </div>
              )}

              {/* KYC Information Display */}
              {panVerified && kycData && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Verified KYC Information</h4>
                  <div className="space-y-2 text-sm">
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
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  panVerified 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-yellow-100 border border-yellow-300'
                }`}>
                  <span className={`text-sm font-medium ${
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

              {/* Verify Button */}
              <button
                type="button"
                onClick={handlePanVerification}
                disabled={verifyingPan || panVerified}
                className="w-full px-4 py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </div>

        {/* Bottom row - Banking Details */}
        <div className="mb-8">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path d="M9 12H15" stroke="white" strokeWidth="2" />
                  <path d="M12 9V15" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Banking Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="Please enter bank name"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="Please enter account number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  placeholder="Please enter IFSC code"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="Please enter account holder name"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-12 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Store Change Request Modal */}
      {showStoreChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Request Store Change</h3>
                <button
                  onClick={() => setShowStoreChangeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Currently Selected Stores */}
              {selectedStoreIds.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Currently Selected Stores ({selectedStoreIds.length})
                    </label>
                    <button
                      onClick={() => setSelectedStoreIds([])}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {selectedStoreIds.map((storeId) => {
                        // First try to find in allStores, then fallback to current stores
                        let store = allStores.find(s => s.id === storeId);
                        if (!store) {
                          store = stores.find(s => s.id === storeId);
                        }
                        
                        return (
                          <div
                            key={storeId}
                            className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{store ? store.name : `Store ID: ${storeId}`}</span>
                            {store?.city && (
                              <span className="text-blue-600">- {store.city}</span>
                            )}
                            <button
                              onClick={() => handleStoreSelection(storeId, false)}
                              className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                              title="Remove store"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Stores
                </label>
                <input
                  type="text"
                  placeholder="Search by store name, city, or state..."
                  value={storeSearch}
                  onChange={(e) => {
                    setStoreSearch(e.target.value);
                    fetchAllStores(e.target.value);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Stores (click to select/deselect)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {allStores.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {storeSearch ? 'No stores found matching your search' : 'Loading stores...'}
                    </div>
                  ) : (
                    allStores.map((store) => {
                      const isSelected = selectedStoreIds.includes(store.id);
                      return (
                        <label
                          key={store.id}
                          className={`flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 hover:bg-blue-100' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleStoreSelection(store.id, e.target.checked)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {store.name}
                              {isSelected && (
                                <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                                  Selected
                                </span>
                              )}
                            </div>
                            {(store.city || store.state) && (
                              <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                {[store.city, store.state].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Change (Optional)
                </label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Please provide a reason for requesting this store change..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>• Your request will be sent to the administrator for approval</p>
                <p>• You will be notified once the request is reviewed</p>
                <p>• Current store mapping will remain until the request is approved</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowStoreChangeModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitStoreChangeRequest}
                disabled={submittingRequest || selectedStoreIds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingRequest ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
