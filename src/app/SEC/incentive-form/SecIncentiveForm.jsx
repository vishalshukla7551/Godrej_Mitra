'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import SECHeader from '@/app/SEC/SECHeader';
import SECFooter from '@/app/SEC/SECFooter';
import SuccessModal from '@/components/SuccessModal';

export default function SecIncentiveForm({ initialSecId = '' }) {
  const router = useRouter();
  const [secPhone, setSecPhone] = useState('');
  const [secId, setSecId] = useState('');
  const [invoicePrice, setInvoicePrice] = useState('');
  const [dateOfSale, setDateOfSale] = useState('');
  const [storeId, setStoreId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [applianceSubCategory, setApplianceSubCategory] = useState('');
  const [planId, setPlanId] = useState('');
  const [imeiExists, setImeiExists] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecAlert, setShowSecAlert] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [earnedIncentive, setEarnedIncentive] = useState(0);
  const [secInput, setSecInput] = useState('');
  const [secError, setSecError] = useState('');
  const [showSecModal, setShowSecModal] = useState(false);

  // Data from APIs
  const [stores, setStores] = useState([]);
  const [devices, setDevices] = useState([
    { id: 'REF', Category: 'Home', ModelName: 'Refrigerator' },
    { id: 'WM', Category: 'Home', ModelName: 'Washing Machine' },
    { id: 'MW', Category: 'Home', ModelName: 'Microwave Oven' },
    { id: 'DW', Category: 'Home', ModelName: 'Dishwasher' },
    { id: 'CF', Category: 'Home', ModelName: 'Chest Freezer' },
    { id: 'QB', Category: 'Home', ModelName: 'Qube' },
  ]);
  const [plans, setPlans] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Load SEC phone and store from authUser in localStorage on mount
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
      const employeeIdFromAuth = auth?.employeeId || auth?.employId;
      const storeFromAuth = auth?.storeId || auth?.selectedStoreId;
      const storeDetails = auth?.store;

      if (phoneFromAuth) {
        setSecPhone(phoneFromAuth);
        setShowSecAlert(false);
      } else {
        setShowSecAlert(true);
      }

      if (employeeIdFromAuth) {
        setSecId(employeeIdFromAuth);
      }

      if (storeFromAuth) {
        setStoreId(storeFromAuth);
        // Store the store details for display
        if (storeDetails) {
          setStores([storeDetails]);
        }
      }
    } catch {
      // ignore parse errors but show alert so SEC can re-login
      setShowSecAlert(true);
    }
    setLoadingStores(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!secPhone) {
      setShowSecAlert(true);
      alert('Please login to submit the form');
      return;
    }

    // Validate all fields with user-friendly messages
    if (!dateOfSale) {
      alert('⚠️ Please select the date of sale');
      return;
    }
    if (!storeId) {
      alert('⚠️ Please select a store');
      return;
    }
    if (!deviceId) {
      alert('⚠️ Please select a device');
      return;
    }
    if (!invoicePrice) {
      alert('⚠️ Please enter the invoice price');
      return;
    }
    if (!planId) {
      alert('⚠️ Please select a plan');
      return;
    }
    if (!serialNumber) {
      alert('⚠️ Please enter the serial number');
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
          deviceId,
          planId,
          imei: serialNumber, // Send serialNumber as imei
          invoicePrice,
          dateOfSale: dateOfSale || undefined,
          // Send client values for security verification (server will validate)
          clientSecPhone: secPhone,
          clientStoreId: storeId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to submit sales report');
        return;
      }

      // Success - Show celebration modal
      setEarnedIncentive(data.salesReport.incentiveEarned);
      setShowSuccessModal(true);

      // OLD CONFETTI CODE RESTORED
      setShowConfetti(true);
      // Stop confetti after 4 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      // Reset form
      setDateOfSale('');
      setStoreId('');
      setDeviceId('');
      setInvoicePrice('');
      setPlanId('');
      setSerialNumber('');
      // imei reset removed

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
                Please set up your Canvasser ID to continue
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
              Spot Incentive Form
            </h1>
            <p className="text-sm text-gray-500">
              Submit your plan sales below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SEC ID - Disabled */}
            <div>
              <label htmlFor="secId" className="block text-sm font-medium text-gray-700 mb-2">
                Canvasser ID
              </label>
              <input
                type="text"
                id="secId"
                value={secId}
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
                  max={(() => {
                    // Get current date in IST
                    const now = new Date();
                    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
                    const istDate = new Date(now.getTime() + istOffset);
                    return istDate.toISOString().split('T')[0];
                  })()}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  placeholder="dd/mm/yyyy"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
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
                </div>
              </div>
            </div>

            {/* Store Name - Always disabled, loaded from authUser */}
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                id="storeId"
                value={(() => {
                  const store = stores.find((s) => s.id === storeId);
                  if (!store) return loadingStores ? 'Loading...' : 'Store not set';
                  return `${store.name}${store.city ? ` - ${store.city}` : ''}`;
                })()}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm"
              />
              <a
                href="/SEC/profile?from=incentive-form"
                className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Want to change store?
              </a>
            </div>

            {/* Device Name */}
            <div>
              <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
                Appliance Category
              </label>
              <select
                id="deviceId"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setApplianceSubCategory(''); // Reset sub-category when category changes
                  setInvoicePrice(''); // Reset invoice price when category changes
                }}
                disabled={loadingDevices}
                className="w-full pl-4 pr-10 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
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
                    {device.ModelName}
                  </option>
                ))}
              </select>
            </div>

            {/* Appliance Sub Category */}
            <div>
              <label htmlFor="applianceSubCategory" className="block text-sm font-medium text-gray-700 mb-2">
                Appliance Sub Category
              </label>
              <select
                id="applianceSubCategory"
                value={applianceSubCategory}
                onChange={(e) => setApplianceSubCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="">Select Sub Category</option>
                {(() => {
                  // Find the selected device to get its ModelName
                  const selectedDevice = devices.find(d => d.id === deviceId);
                  const categoryName = selectedDevice?.ModelName || '';
                  const lowerCategoryName = categoryName.toLowerCase();

                  // Define sub-categories based on category name
                  if (lowerCategoryName.includes('refrigerator')) {
                    return (
                      <>
                        <option value="Direct Cool">Direct Cool</option>
                        <option value="Frost Free">Frost Free</option>
                      </>
                    );
                  } else if (lowerCategoryName.includes('washing machine')) {
                    return (
                      <>
                        <option value="Semi Automatic">Semi Automatic</option>
                        <option value="Fully Automatic">Fully Automatic</option>
                      </>
                    );
                  } else if (
                    lowerCategoryName.includes('air cooler') ||
                    lowerCategoryName.includes('dishwasher') ||
                    lowerCategoryName.includes('chest freezer') ||
                    lowerCategoryName.includes('microwave') ||
                    lowerCategoryName.includes('qube')
                  ) {
                    return (
                      <option value="All">All</option>
                    );
                  }
                  return null;
                })()}
              </select>
            </div>

            {/* Appliance Invoice Price */}
            <div>
              <label htmlFor="invoicePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Appliance Invoice Price
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="invoicePrice"
                  value={invoicePrice}
                  onChange={(e) => setInvoicePrice(e.target.value)}
                  placeholder="Enter Invoice Price"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!invoicePrice || !deviceId) {
                      alert('Please select a category and enter invoice price first');
                      return;
                    }

                    // Find category name from ID
                    const selectedDevice = devices.find(d => d.id === deviceId);
                    const categoryName = selectedDevice?.ModelName;

                    if (!categoryName) return;

                    try {
                      setLoadingPlans(true);
                      const res = await fetch('/api/sec/plans/fetch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          category: categoryName,
                          price: invoicePrice
                        })
                      });

                      const data = await res.json();

                      if (res.ok) {
                        const formattedPlans = data.plans.map(p => ({
                          id: p.id,
                          label: p.planType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                          price: p.PlanPrice
                        }));

                        setPlans(formattedPlans);
                        setPlanId(''); // Reset selected plan

                        if (formattedPlans.length === 0) {
                          alert('No plans found for this price range');
                        }
                      } else {
                        console.error('Error fetching plans:', data.error);
                        alert('Failed to fetch plans');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert('An error occurred while checking plans');
                    } finally {
                      setLoadingPlans(false);
                    }
                  }}
                  disabled={loadingPlans}
                  className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPlans ? 'Checking...' : 'Check'}
                </button>
              </div>
            </div>

            {/* Plan Type */}
            <div>
              <label htmlFor="planId" className="block text-sm font-medium text-gray-700 mb-2">
                Extended Warranty
              </label>
              <select
                id="planId"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                disabled={!deviceId || loadingPlans}
                className="w-full pl-4 pr-10 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="">
                  {loadingPlans ? 'Loading plans...' : 'Select Plan'}
                </option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.label} - ₹{plan.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Number */}
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="Enter Serial Number"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 pb-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#5E1846',
                  boxShadow: '0 4px 15px rgba(94, 24, 70, 0.4)',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <SECFooter />

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <Confetti
            width={typeof window !== 'undefined' ? window.innerWidth : 300}
            height={typeof window !== 'undefined' ? window.innerHeight : 800}
            recycle={false}
            numberOfPieces={200}
          />
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        earnedIncentive={earnedIncentive}
        onClose={handleCloseSuccess}
      />

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
                <span className="text-sm text-gray-500">Canvasser ID</span>
                <span className="text-sm text-gray-900 font-medium">{secId}</span>
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
                <span className="text-sm text-gray-500">Serial Number</span>
                <span className="text-sm text-gray-900 font-medium text-right ml-4">
                  {serialNumber}
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
