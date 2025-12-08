'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import SECHeader from '../SECHeader.jsx';
import SECFooter from '../SECFooter.jsx';

export default function SecIncentiveForm({ initialSecId = '' }) {
  const router = useRouter();
  const [secPhone, setSecPhone] = useState('');
  const [dateOfSale, setDateOfSale] = useState('');
  const [storeId, setStoreId] = useState('');
  const [storeFixedFromProfile, setStoreFixedFromProfile] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [planId, setPlanId] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [imeiError, setImeiError] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [imeiExists, setImeiExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecAlert, setShowSecAlert] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [earnedIncentive, setEarnedIncentive] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Data from APIs
  const [stores, setStores] = useState([]);
  const [devices, setDevices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Load SEC phone and fixed store (if any) from authUser in localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('authUser');
      if (!raw) {
        setShowSecAlert(true);
        return;
      }

      const auth = JSON.parse(raw);
      const phoneFromAuth = auth?.phone;
      const storeFromAuth = auth?.selectedStoreId;

      if (phoneFromAuth) {
        setSecPhone(phoneFromAuth);
        setShowSecAlert(false);
      } else {
        setShowSecAlert(true);
      }

      if (storeFromAuth) {
        setStoreId(storeFromAuth);
        setStoreFixedFromProfile(true);
      }
    } catch {
      // ignore parse errors but show alert so SEC can re-login
      setShowSecAlert(true);
    }
  }, []);

  // Fetch stores on mount
  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch('/api/sec/incentive-form/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoadingStores(false);
      }
    }
    fetchStores();
  }, []);

  // Fetch devices on mount
  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch('/api/sec/incentive-form/devices');
        if (res.ok) {
          const data = await res.json();
          setDevices(data.devices || []);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoadingDevices(false);
      }
    }
    fetchDevices();
  }, []);

  // Fetch plans when device is selected
  useEffect(() => {
    if (!deviceId) {
      setPlans([]);
      setPlanId('');
      return;
    }

    async function fetchPlans() {
      try {
        setLoadingPlans(true);
        const res = await fetch(`/api/sec/incentive-form/plans?deviceId=${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        } else {
          setPlans([]);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, [deviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!secPhone) {
      setShowSecAlert(true);
      alert('Please login to submit the form');
      return;
    }
    
    // Validate all fields
    if (!storeId) {
      alert('Please select a store');
      return;
    }
    if (!deviceId) {
      alert('Please select a device');
      return;
    }
    if (!planId) {
      alert('Please select a plan');
      return;
    }
    if (imeiError || duplicateError) {
      alert('Please fix the IMEI issues before submitting');
      return;
    }
    if (!imeiNumber || imeiNumber.length !== 15) {
      setImeiError('Invalid IMEI. Please enter a valid 15-digit IMEI number.');
      return;
    }
    
    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmModal(false);
      
      const res = await fetch('/api/sec/incentive-form/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secPhone,
          storeId,
          deviceId,
          planId,
          imei: imeiNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to submit sales report');
        return;
      }

      // Success - Show celebration modal
      setEarnedIncentive(data.salesReport.incentiveEarned);
      setShowConfetti(true);
      setShowSuccessModal(true);
      
      // Stop confetti after 4 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      
      // Reset form
      setDateOfSale('');
      setStoreId('');
      setDeviceId('');
      setPlanId('');
      setImeiNumber('');
      setImeiError('');
      setDuplicateError('');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit sales report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setShowConfetti(false);
    router.push('/SEC/passbook');
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };



  const luhnCheck = (imei) => {
    let sum = 0;
    for (let i = 0; i < imei.length; i++) {
      let digit = parseInt(imei[imei.length - 1 - i], 10);
      if (Number.isNaN(digit)) return false;
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  const checkImeiDuplicate = async (imei) => {
    if (!imei || imei.length < 14) {
      setImeiExists(false);
      setDuplicateError('');
      return;
    }

    try {
      setIsCheckingDuplicate(true);
      const res = await fetch(`/api/sec/incentive-form/check-imei?imei=${imei}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setImeiExists(true);
          setDuplicateError('This IMEI has already been submitted.');
        } else {
          setImeiExists(false);
          setDuplicateError('');
        }
      } else {
        // If API fails, don't block the user
        setImeiExists(false);
        setDuplicateError('');
      }
    } catch (error) {
      console.error('Error checking IMEI:', error);
      // If API fails, don't block the user
      setImeiExists(false);
      setDuplicateError('');
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Create debounced version of checkImeiDuplicate
  const debouncedCheckImei = debounce(checkImeiDuplicate, 400);

  const validateAndSetImei = (rawValue) => {
    const numeric = rawValue.replace(/\D/g, '').slice(0, 15);
    setImeiNumber(numeric);

    if (!numeric) {
      setImeiError('');
      setDuplicateError('');
      setImeiExists(false);
      return;
    }

    if (numeric.length !== 15) {
      setImeiError('Invalid IMEI. Please enter a valid 15-digit IMEI number.');
      setDuplicateError('');
      setImeiExists(false);
      return;
    }

    if (!luhnCheck(numeric)) {
      setImeiError('Invalid IMEI. Please enter a valid 15-digit IMEI number.');
      setDuplicateError('');
      setImeiExists(false);
      return;
    }

    setImeiError('');
    // Use debounced check for duplicate IMEI
    debouncedCheckImei(numeric);
  };

  const handleImeiChange = (e) => {
    validateAndSetImei(e.target.value);
  };

  const handleScan = async () => {
    setIsScanning(true);
    
    try {
      // Check if browser supports BarcodeDetector API
      if ('BarcodeDetector' in window) {
        // Use native barcode / QR / DataMatrix scanner where supported
        const barcodeDetector = new BarcodeDetector({
          formats: ['ean_13', 'code_128', 'upc_e', 'qr_code', 'data_matrix'],
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        // NOTE: Implementing a full live camera preview + frame capture pipeline
        // is beyond the scope here, so we simulate by asking for IMEI after camera opens.
        alert('Camera scanner would open here on supported devices. For now, please enter IMEI manually.');
        stream.getTracks().forEach((track) => track.stop());

        const scannedImei = prompt('Enter scanned IMEI Number:');
        if (scannedImei) {
          validateAndSetImei(scannedImei);
        }
      } else {
        // Fallback: Use a simple prompt or third-party scanner library
        const scannedImei = prompt('Enter or scan IMEI Number:');
        if (scannedImei) {
          validateAndSetImei(scannedImei);
        }
      }
    } catch (error) {
      console.error('Scanner error:', error);
      // Fallback to manual input
      const manualImei = prompt('Camera access denied or unavailable. Enter IMEI manually:');
      if (manualImei) {
        validateAndSetImei(manualImei);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <SECHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-5 pt-4 pb-6">
          {/* SEC ID Alert */}
          {showSecAlert && (
            <div className="mb-4 rounded-xl bg-[#FFF8C5] px-4 py-3 flex items-center justify-between gap-3 text-[13px] text-black">
              <span className="font-medium">
                Please set up your SEC ID to continue
              </span>
              <button
                type="button"
                onClick={() => {
                  setSecInput(secId || '');
                  setSecError('');
                  setShowSecModal(true);
                }}
                className="shrink-0 px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold"
              >
                Set Now
              </button>
            </div>
          )}

          {/* Page Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Incentive Form
            </h1>
            <p className="text-sm text-gray-500">
              Submit your plan sales below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SEC Phone - Disabled */}
            <div>
              <label htmlFor="secPhone" className="block text-sm font-medium text-gray-700 mb-2">
                SEC Phone
              </label>
              <input
                type="text"
                id="secPhone"
                value={secPhone}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-500 text-sm"
                placeholder="SEC Phone Number"
              />
            </div>

            {/* Date of Sale */}
            <div>
              <label htmlFor="dateOfSale" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Sale
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dateOfSale"
                  value={dateOfSale}
                  onChange={(e) => setDateOfSale(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                  placeholder="dd/mm/yyyy"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('dateOfSale').showPicker()}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                </button>
              </div>
            </div>

          {/* Store Name */}
          <div>
            <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
              Store Name
            </label>
            {storeFixedFromProfile ? (
              <input
                type="text"
                id="storeId"
                value={(() => {
                  const store = stores.find((s) => s.id === storeId);
                  if (!store) return 'Store not set';
                  return `${store.name}${store.city ? ` - ${store.city}` : ''}`;
                })()}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm"
              />
            ) : (
              <select
                id="storeId"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                disabled={loadingStores}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="">{loadingStores ? 'Loading stores...' : 'Select Store'}</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.city ? `- ${store.city}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

            {/* Device Name */}
            <div>
              <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
                Device Name
              </label>
              <select
                id="deviceId"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setPlanId(''); // Reset plan when device changes
                }}
                disabled={loadingDevices}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="">{loadingDevices ? 'Loading devices...' : 'Select Device'}</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.Category} - {device.ModelName}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Type */}
            <div>
              <label htmlFor="planId" className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type
              </label>
              <select
                id="planId"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                disabled={!deviceId || loadingPlans}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="">
                  {!deviceId ? 'Select device first' : loadingPlans ? 'Loading plans...' : 'Select Plan'}
                </option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} - ₹{plan.price}
                  </option>
                ))}
              </select>
            </div>

            {/* IMEI Number */}
            <div>
              <label htmlFor="imeiNumber" className="block text-sm font-medium text-gray-700 mb-2">
                IMEI Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="imeiNumber"
                  value={imeiNumber}
                  onChange={handleImeiChange}
                  placeholder="Enter IMEI Number"
                  inputMode="numeric"
                  maxLength="15"
                  className={`w-full pl-4 pr-24 py-3 bg-white border rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 placeholder:text-gray-400 ${
                    imeiError || duplicateError || imeiExists
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  {isScanning ? 'Scanning...' : 'Scan'}
                </button>
              </div>
              {isCheckingDuplicate && !imeiError && (
                <p className="mt-2 text-xs text-blue-600 font-medium">
                  Checking IMEI...
                </p>
              )}
              {(imeiError || duplicateError) && !isCheckingDuplicate && (
                <p className="mt-2 text-xs text-red-600 font-medium">
                  {imeiError || duplicateError}
                </p>
              )}
              {!imeiError && !duplicateError && !isCheckingDuplicate && (
                <p className="mt-2 text-xs text-gray-500">
                  Any incorrect sales reported will impact your future incentives.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 pb-6">
              <button
                type="submit"
                disabled={!!imeiError || !!duplicateError || imeiExists || !imeiNumber || imeiNumber.length !== 15 || isCheckingDuplicate || isSubmitting || !storeId || !deviceId || !planId}
                className="w-full bg-black text-white font-semibold py-4 rounded-2xl hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-base"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </main>



      <SECFooter />

      {/* Success Celebration Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {showConfetti && (
            <Confetti
              width={typeof window !== 'undefined' ? window.innerWidth : 300}
              height={typeof window !== 'undefined' ? window.innerHeight : 200}
              numberOfPieces={300}
              recycle={false}
            />
          )}
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-[fadeIn_0.3s_ease-in]">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-blue-600 mb-3">
              Congratulations!
            </h2>
            <p className="text-gray-700 text-base mb-2">
              You've earned
            </p>
            <p className="text-3xl font-bold text-green-600 mb-6">
              ₹{earnedIncentive}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              incentive! 🎊
            </p>
            <button
              onClick={handleCloseSuccess}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View My Report
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCancelConfirm}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Confirm Plan Sale
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Review the details below before submitting.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">SEC ID</span>
                <span className="text-sm text-gray-900 font-medium">{secPhone}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Date of Sale</span>
                <span className="text-sm text-gray-900 font-medium">{dateOfSale || 'Not set'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Store Name</span>
                <span className="text-sm text-gray-900 font-medium text-right ml-4">
                  {stores.find(s => s.id === storeId)?.name || storeId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Device</span>
                <span className="text-sm text-gray-900 font-medium text-right ml-4">
                  {devices.find(d => d.id === deviceId)?.ModelName || deviceId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Plan Type</span>
                <span className="text-sm text-gray-900 font-medium text-right ml-4">
                  {plans.find(p => p.id === planId)?.label || planId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Plan Price</span>
                <span className="text-sm text-gray-900 font-medium">
                  ₹{plans.find(p => p.id === planId)?.price || '0'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">IMEI</span>
                <span className="text-sm text-gray-900 font-medium">{imeiNumber}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
