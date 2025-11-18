'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SECLogin() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isValidNumber, setIsValidNumber] = useState<boolean | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Keep only digits and enforce a maximum of 10
    const digitsOnly = inputValue.replace(/\D/g, '').slice(0, 10);

    setPhoneNumber(digitsOnly);

    if (!digitsOnly) {
      setValidationMessage('');
      setIsValidNumber(null);
    } else if (digitsOnly.length < 10) {
      setValidationMessage('Invalid number');
      setIsValidNumber(false);
    } else if (digitsOnly.length === 10) {
      setValidationMessage('Valid number');
      setIsValidNumber(true);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();

    const digitsOnly = phoneNumber.replace(/\D/g, '').slice(0, 10);

    if (!digitsOnly || digitsOnly.length < 10) {
      setPhoneNumber(digitsOnly);
      setValidationMessage('Invalid number');
      setIsValidNumber(false);
      alert('Please enter a 10-digit phone number');
      return;
    }

    setPhoneNumber(digitsOnly);
    setValidationMessage('Valid number');
    setIsValidNumber(true);
    alert(`Valid number: ${digitsOnly}`);

    if (!agreed) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Handle OTP sending logic here
    console.log('Sending OTP to:', digitsOnly);
    setOtpSent(true);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      alert('Please enter your OTP');
      return;
    }
    // Handle OTP verification logic here
    console.log('Verifying OTP:', otp);
    
    // Simulate checking if user is new (in real app, this would come from API)
    const isNewUser = true; // Replace with actual API check
    
    if (isNewUser) {
      setShowProfileSetup(true);
    } else {
      // Navigate to SEC landing page for existing users
      router.push('/SEC/home');
    }
  };

  const handleBackToOTP = () => {
    setShowProfileSetup(false);
  };

  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      alert('Please enter both first name and last name');
      return;
    }
    // Handle profile creation here
    console.log('Profile setup:', { firstName, lastName });
    // Navigate to SEC Landing Page
    router.push('/SEC/home');
  };

  // Show profile setup screen for new users
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              What&apos;s your name?
            </h1>
            <p className="text-lg text-gray-500">
              Let us know how to properly address you
            </p>
          </div>

          <form onSubmit={handleProfileNext} className="space-y-6">
            <div>
              <label
                htmlFor="firstName"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                First name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="w-full px-5 py-4 border-2 border-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base text-black placeholder:text-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                style={{ backgroundColor: '#F5F6F8' }}
                className="w-full px-5 py-4 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base text-black placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBackToOTP}
                className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="submit"
                className="px-12 py-3.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors text-base"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            SC+ Engagement Portal
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">SEC Login</h2>
        </div>

        <form
          onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}
          className="space-y-6"
          autoComplete="off"
        >
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-600 uppercase mb-3"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <input
                type="tel"
                id="phone"
                name="sec-phone"
                autoComplete="off"
                inputMode="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number"
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black placeholder:text-gray-500"
              />
            </div>
            {validationMessage && (
              <p
                className={`mt-2 text-sm ${
                  isValidNumber ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {validationMessage}
              </p>
            )}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-6">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 border-2 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <label htmlFor="terms" className="ml-3 text-base text-gray-700">
              I have read and agree to the{' '}
              <Link
                href="/terms"
                className="text-blue-600 hover:underline font-medium"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline font-medium"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {otpSent && (
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-600 uppercase mb-3"
              >
                OTP
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                autoComplete="off"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter your OTP"
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black placeholder:text-gray-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg"
          >
            {otpSent ? 'Verify & Continue' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-gray-600">
            Different Role?{' '}
            <Link
              href="/login/role"
              className="text-blue-600 hover:underline font-medium"
            >
              Go to Role Login
            </Link>
          </p>
          <p className="text-gray-600">
            Need an account?{' '}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up for different roles
            </Link>
          </p>
        </div>

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
