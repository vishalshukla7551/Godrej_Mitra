'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface StoreOption {
  id: string;
  label: string;
}

interface ManagerOption {
  id: string;
  label: string;
}

export default function SignUpPage() {
  const router = useRouter();

  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [zsmOptions, setZsmOptions] = useState<ManagerOption[]>([]);
  const [zseOptions, setZseOptions] = useState<ManagerOption[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    role: '',
    storeIds: [] as string[],
    managerId: '',
    username: '',
    password: '',
  });

  const [storeSearch, setStoreSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load store + manager options from API
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch('/api/auth/signup');
        if (!res.ok) return;
        const data = await res.json();

        const stores: StoreOption[] = (data.stores || []).map((s: any) => ({
          id: s.id,
          label: s.name,
        }));

        const zsms: ManagerOption[] = (data.zsms || []).map((z: any) => ({
          id: z.id,
          label: `${z.fullName} (${z.region || 'N/A'})`,
        }));

        const zses: ManagerOption[] = (data.zses || []).map((z: any) => ({
          id: z.id,
          label: `${z.fullName} (${z.region || 'N/A'})`,
        }));

        setStoreOptions(stores);
        setZsmOptions(zsms);
        setZseOptions(zses);
      } catch (err) {
        console.error('Failed to load signup options', err);
      }
    }

    loadOptions();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated: typeof prev = {
        ...prev,
        [name]: value,
      };

      if (name === 'role') {
        if (value !== 'ABM' && value !== 'ASE') {
          updated.storeIds = [];
        }
        if (value !== 'ABM' && value !== 'ASE') {
          updated.managerId = '';
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic field validation
    if (!formData.fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      alert('Please enter your phone number');
      return;
    }

    // Phone number validation (10 digits)
    if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    if (!formData.role) {
      alert('Please select a role');
      return;
    }

    // Role-specific validation for ABM and ASE
    if (formData.role === 'ABM' || formData.role === 'ASE') {
      if (formData.storeIds.length === 0) {
        alert('Please select at least one store');
        return;
      }

      if (!formData.managerId) {
        alert(`Please select a ${formData.role === 'ABM' ? 'ZSM' : 'ZSE'}`);
        return;
      }
    }

    if (!formData.username.trim()) {
      alert('Please enter a username');
      return;
    }

    // Username validation
    if (!isUsernameLongEnough || !hasUsernameLetter) {
      alert(
        'Username must be at least 4 characters long and contain at least one letter.'
      );
      return;
    }

    if (!formData.password) {
      alert('Please enter a password');
      return;
    }

    // Password validation
    if (
      !isPasswordLongEnough ||
      !hasPasswordUppercase ||
      !hasPasswordLetter ||
      !hasPasswordSpecial
    ) {
      alert(
        'Password must be at least 6 characters long, contain at least one capital letter, at least one alphabet letter, and at least one special symbol.'
      );
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || 'Failed to create account');
        return;
      }

      alert('Signup submitted. Your account will be activated after admin approval.');
      router.push('/login/role');
    } catch (err) {
      console.error('Signup error', err);
      alert('Something went wrong while creating your account');
    }
  };

  const handleToggleStore = (storeId: string) => {
    setFormData((prev) => {
      const exists = prev.storeIds.includes(storeId);
      return {
        ...prev,
        storeIds: exists
          ? prev.storeIds.filter((id) => id !== storeId)
          : [...prev.storeIds, storeId],
      };
    });
  };

  const username = formData.username;
  const isUsernameLongEnough = username.length >= 4;
  const hasUsernameLetter = /[A-Za-z]/.test(username);

  const password = formData.password;
  const isPasswordLongEnough = password.length >= 6;
  const hasPasswordUppercase = /[A-Z]/.test(password);
  const hasPasswordLetter = /[A-Za-z]/.test(password);
  const hasPasswordSpecial = /[^A-Za-z0-9]/.test(password);

  // Check if all required fields are filled
  const isFormValid = () => {
    const basicFieldsFilled =
      formData.fullName.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      /^\d{10}$/.test(formData.phoneNumber.trim()) &&
      formData.role !== '' &&
      formData.username.trim() !== '' &&
      formData.password !== '';

    const usernameValid = isUsernameLongEnough && hasUsernameLetter;
    const passwordValid = isPasswordLongEnough && hasPasswordUppercase && hasPasswordLetter && hasPasswordSpecial;

    // Role-specific validation
    let roleSpecificValid = true;
    if (formData.role === 'ABM' || formData.role === 'ASE') {
      roleSpecificValid = formData.storeIds.length > 0 && formData.managerId !== '';
    }

    return basicFieldsFilled && usernameValid && passwordValid && roleSpecificValid;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ backgroundColor: '#F5F6F8' }}
    >
      {/* Gift Box - Fixed to page
      <Image
        src="/images/gift-box.png"
        alt="Christmas Gift"
        width={200}
        height={200}
        className="absolute pointer-events-none z-10"
        style={{
          top: '50%',
          left: 'calc(50% + 220px)',
          transform: 'translateY(20%)',
          filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12))',
        }}
        priority
      />
      */}

      {/* Card Wrapper - Anchors Santa hat to the card */}
      <div className="relative" style={{ maxWidth: '512px', width: '100%' }}>
        {/* Santa Hat - Anchored to Card Top Left
        <Image
          src="/images/santa-hat.png"
          alt="Santa Hat"
          width={130}
          height={130}
          className="absolute pointer-events-none z-20"
          style={{
            top: '-50px',
            left: '-45px',
            transform: 'rotate(-18deg)',
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18))',
          }}
          priority
        />
        */}

        {/* Signup Card */}
        <div
          className="w-full bg-white rounded-2xl p-6 sm:p-8 relative"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 12px' }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-3">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  pattern="[A-Za-z ]+"
                  maxLength={80}
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value.replace(/[^A-Za-z\s]/g, '') }))}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-900 mb-3">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-900 mb-3">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 appearance-none"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="ABM">ABM</option>
                  <option value="ASE">ASE</option>
                  <option value="ZSM">ZSM</option>
                  <option value="ZSE">ZSE</option>
                </select>
              </div>
            </div>

            {/* Select Store - ABM, ASE (search + multi-select) */}
            {(formData.role === 'ABM' || formData.role === 'ASE') && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Select Store(s)
                </label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h6M7 3v6h10V3M7 13h10m-5-4v4"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Search store..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {storeOptions.filter((store) =>
                    store.label.toLowerCase().includes(storeSearch.toLowerCase())
                  ).map((store) => {
                    const checked = formData.storeIds.includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleStore(store.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-800">{store.label}</span>
                      </label>
                    );
                  })}
                  {storeOptions.filter((store) =>
                    store.label.toLowerCase().includes(storeSearch.toLowerCase())
                  ).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">No stores found</div>
                    )}
                </div>
                {formData.storeIds.length > 0 && (
                  <div className="mt-2 text-xs text-gray-700">
                    <span className="font-medium">Selected store(s):</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {formData.storeIds.map((id) => {
                        const store = storeOptions.find((s) => s.id === id);
                        if (!store) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {store.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Select reporting manager - ZSM for ABM, ZSE for ASE (searchable) */}
            {(formData.role === 'ABM' || formData.role === 'ASE') && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  {formData.role === 'ABM' ? 'Select ZSM' : 'Select ZSE'}
                </label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    placeholder={
                      formData.role === 'ABM'
                        ? 'Search ZSM...'
                        : 'Search ZSE...'
                    }
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {(formData.role === 'ABM' ? zsmOptions : zseOptions)
                    .filter((manager) =>
                      manager.label.toLowerCase().includes(managerSearch.toLowerCase())
                    )
                    .map((manager) => (
                      <label
                        key={manager.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="manager"
                          value={manager.id}
                          checked={formData.managerId === manager.id}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, managerId: manager.id }))
                          }
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-800">{manager.label}</span>
                      </label>
                    ))}
                  {(formData.role === 'ABM' ? zsmOptions : zseOptions)
                    .filter((manager) =>
                      manager.label.toLowerCase().includes(managerSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">No options found</div>
                    )}
                </div>
                {formData.managerId && (
                  <div className="mt-2 text-xs text-gray-700">
                    <span className="font-medium">
                      Selected {formData.role === 'ABM' ? 'ZSM' : 'ZSE'}:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(() => {
                        const selectedLabel = (formData.role === 'ABM' ? zsmOptions : zseOptions).find(
                          (m) => m.id === formData.managerId,
                        )?.label;
                        if (!selectedLabel) return null;
                        return (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {selectedLabel}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-3">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                  minLength={4}
                  required
                />
              </div>

              {/* Username requirements checklist */}
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${isUsernameLongEnough
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                      }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      isUsernameLongEnough ? 'text-gray-700' : 'text-gray-400'
                    }
                  >
                    At least 4 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${hasUsernameLetter
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                      }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      hasUsernameLetter ? 'text-gray-700' : 'text-gray-400'
                    }
                  >
                    Contains at least one letter
                  </span>
                </div>


              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full pl-12 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password requirements checklist */}
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${isPasswordLongEnough
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                      }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      isPasswordLongEnough ? 'text-gray-700' : 'text-gray-400'
                    }
                  >
                    At least 6 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${hasPasswordUppercase
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                      }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      hasPasswordUppercase ? 'text-gray-700' : 'text-gray-400'
                    }
                  >
                    Contains at least one capital letter
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${hasPasswordLetter
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                      }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      hasPasswordLetter ? 'text-gray-700' : 'text-gray-400'
                    }
                  >
                    Contains at least one alphabet letter
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${hasPasswordSpecial
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                      }`}
                  >
                    ✓
                  </span>
                  <span
                    className={
                      hasPasswordSpecial ? 'text-gray-700' : 'text-gray-400'
                    }
                  >
                    Uses at least one special symbol (e.g. ! @ # $)
                  </span>
                </div>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="w-full font-semibold py-2.5 transition-colors text-base text-white"
              style={{
                background: !isFormValid()
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #E53935 0%, #FF4D4D 100%)',
                borderRadius: '12px',
                boxShadow: !isFormValid()
                  ? 'none'
                  : 'rgba(229, 57, 53, 0.2) 0px 4px 12px',
                cursor: !isFormValid() ? 'not-allowed' : 'pointer',
                color: !isFormValid() ? '#6b7280' : '#ffffff',
              }}
              onMouseEnter={(e) => {
                if (isFormValid()) {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #C62828 0%, #E53935 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid()) {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, #E53935 0%, #FF4D4D 100%)';
                }
              }}
            >
              Create Account
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login/canvasser"
                className="text-blue-600 hover:underline font-medium"
              >
                Login here
              </Link>
            </p>
          </div>

          {/* Powered by Zopper - same as canvasser login */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center text-gray-500 gap-1">
              <span className="text-base">Powered by</span>
              <Image
                src="/zopper-icon.png"
                alt="Zopper icon"
                width={24}
                height={24}
                className="inline-block"
              />
              <span className="text-base font-semibold text-gray-900">Zopper</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
