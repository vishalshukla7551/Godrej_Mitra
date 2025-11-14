'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    role: '',
    store: '',
    zse: '',
    username: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle account creation logic here
    console.log('Creating account with data:', formData);
    
    // For now, just navigate back to login
    // In a real app, you would send data to your API first
    alert('Account creation functionality will be implemented');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-8">
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
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
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
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter 10-digit number"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
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
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 appearance-none"
                required
              >
                <option value="">Select Role</option>
                <option value="sec">Sales Engagement Champion (SEC)</option>
                <option value="manager">Store Manager</option>
                <option value="zse">Zone Sales Executive</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Select Store */}
          <div>
            <label htmlFor="store" className="block text-sm font-medium text-gray-900 mb-3">
              Select Store
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h6M7 3v6h10V3M7 13h10m-5-4v4" />
                </svg>
              </div>
              <select
                id="store"
                name="store"
                value={formData.store}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 appearance-none"
                required
              >
                <option value="">Choose your store from list</option>
                <option value="croma-a189-noida-gaur-mall">Croma - A189 - Noida-Gaur Mall</option>
                <option value="croma-a151-noida-mall-of-india">Croma - A151 - Noida-Mall of India</option>
                <option value="croma-a062-chhatrapati-sambhaji-nagar">Croma - A062 - Chhatrapati Sambhaji Nagar-Prozone Mall</option>
                <option value="croma-a041-mumbai-oberoi-mall">Croma - A041 - Mumbai-Oberoi Mall</option>
                <option value="vs-pune-chinchwad">VS - Pune(Chinchwad)</option>
                <option value="croma-a316-gurugram-mgf-fifty-one">Croma - A316 - Gurugram-MGF Fifty One</option>
              </select>
            </div>
          </div>

          {/* Select ZSE */}
          <div>
            <label htmlFor="zse" className="block text-sm font-medium text-gray-900 mb-3">
              Select ZSE
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <select
                id="zse"
                name="zse"
                value={formData.zse}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 appearance-none"
                required
              >
                <option value="">Choose your ZSE from list</option>
                <option value="zse-north">ZSE - North Region</option>
                <option value="zse-south">ZSE - South Region</option>
                <option value="zse-east">ZSE - East Region</option>
                <option value="zse-west">ZSE - West Region</option>
                <option value="zse-central">ZSE - Central Region</option>
              </select>
            </div>
          </div>

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
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                required
              />
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
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password (min 6 characters)"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-500"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-semibold py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg"
          >
            Create Account
          </button>
        </form>

        {/* Already have an account */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login/sec"
              className="text-blue-600 hover:underline font-medium"
            >
              Login here
            </Link>
          </p>
        </div>

        {/* Powered by Zopper */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span className="text-base">Powered by</span>
            <Image
              src="/zopper-logo.svg"
              alt="Zopper"
              width={120}
              height={30}
              className="inline-block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}