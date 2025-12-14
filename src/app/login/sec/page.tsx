'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getHomePathForRole } from '@/lib/roleHomePath';
import ButtonLoader from '@/components/ButtonLoader';

export default function SECLogin() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isValidNumber, setIsValidNumber] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Shared input styles – keep consistent with Phone Number field
  const inputBaseClasses =
    'w-full px-3 py-2.5 rounded-lg text-base text-black placeholder:text-gray-500 transition-all duration-200 border-0 outline-none focus:outline-none';
  const labelBaseClasses = 'block text-sm font-medium text-gray-900 mb-1.5';

  // Apply important styles on mount
  useEffect(() => {
    const phoneInput = document.getElementById('phone') as HTMLInputElement;
    const otpInput = document.getElementById('otp') as HTMLInputElement;
    
    if (phoneInput) {
      phoneInput.style.setProperty('background-color', '#e8f0fe', 'important');
      phoneInput.style.setProperty('border', '1px solid #d1d5db', 'important');
      phoneInput.style.setProperty('outline', 'none', 'important');
    }
    
    if (otpInput) {
      otpInput.style.setProperty('background-color', 'transparent', 'important');
      otpInput.style.setProperty('border', '1px solid #d1d5db', 'important');
      otpInput.style.setProperty('outline', 'none', 'important');
    }
  }, [otpSent]);

  // If already logged in, redirect away from SEC login.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('authUser');
    if (!raw) return;
    try {
      const user = JSON.parse(raw) as { role?: string };
      if (user?.role) {
        const target = getHomePathForRole(user.role);
        router.replace(target);
      }
    } catch {
      // ignore parse errors
    }
  }, [router]);

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digitsOnly = phoneNumber.replace(/\D/g, '').slice(0, 10);

    if (!digitsOnly || digitsOnly.length < 10) {
      setPhoneNumber(digitsOnly);
      setValidationMessage('Invalid number');
      setIsValidNumber(false);
      alert('Please enter a 10-digit phone number');
      return;
    }

    if (!agreed) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setPhoneNumber(digitsOnly);
    setValidationMessage('Valid number');
    setIsValidNumber(true);

    try {
      setLoading(true);
      const res = await fetch('/api/auth/sec/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: digitsOnly }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Failed to send OTP');
        return;
      }

      // OTP will be visible in the terminal logs on the server.
      setOtpSent(true);
    } catch (err) {
      console.error('Error sending OTP', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp) {
      alert('Please enter your OTP');
      return;
    }

    const digitsOnly = phoneNumber.replace(/\D/g, '').slice(0, 10);

    try {
      setLoading(true);
      const res = await fetch('/api/auth/sec/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: digitsOnly, otp }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || 'Invalid OTP');
        return;
      }

      // Store SEC auth info in localStorage, same as role login does.
      if (typeof window !== 'undefined' && data?.user) {
        window.localStorage.setItem('authUser', JSON.stringify(data.user));
      }

      // If this SEC user has not yet provided their name, send them to the
      // one-time name capture screen before landing on the home dashboard.
      if (data.needsName) {
        // Use window.location.href to ensure localStorage is fully written before redirect
        window.location.href = '/SEC/name';
        return;
      }

      // OTP verified successfully; redirect to SEC landing page (via shared helper).
      const target = getHomePathForRole(data.user.role || 'SEC');
      // Use window.location.href to ensure localStorage is fully written before redirect
      window.location.href = target;
    } catch (err) {
      console.error('Error verifying OTP', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex flex-col md:flex-row items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto"
      style={{ backgroundColor: '#F5F6F8' }}
    >
      {/* Gift Box - Desktop: absolute positioned on side */}
      <Image
        src="/images/gift-box.png"
        alt="Christmas Gift"
        width={200}
        height={200}
        className="absolute pointer-events-none z-10 hidden md:block"
        style={{
          top: '50%',
          left: 'calc(50% + 160px)',
          transform: 'translateY(20%)',
          filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12))',
        }}
        priority
      />

      {/* Card Wrapper - Anchors Santa hat to the card */}
      <div className="relative w-full max-w-[450px] mx-auto overflow-visible">
        {/* Santa Hat - Anchored to Card Top Left, smaller on mobile */}
        <Image
          src="/images/santa-hat.png"
          alt="Santa Hat"
          width={130}
          height={130}
          className="absolute pointer-events-none z-20 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[130px] md:h-[130px]"
          style={{
            top: '-35px',
            left: '-25px',
            transform: 'rotate(-18deg)',
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18))',
          }}
          priority
        />

        {/* Login Card */}
        <div
          className="w-full bg-white rounded-2xl p-6 sm:p-8 md:p-10 relative"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 12px' }}
        >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SEC Login</h1>
          <p className="text-gray-500">Login with your phone number</p>
        </div>

        <form
          onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}
          className="space-y-6"
          autoComplete="off"
        >
          <div>
            <label
              htmlFor="phone"
              className={labelBaseClasses}
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="sec-phone"
              autoComplete="off"
              inputMode="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Enter your phone number"
              className={inputBaseClasses}
              style={{
                backgroundColor: '#e8f0fe',
                border: '1px solid #d1d5db',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.setProperty('border-color', 'rgb(120, 164, 235)', 'important');
                e.target.style.setProperty('box-shadow', 'rgba(59, 130, 246, 0.06) 0px 0px 0px 1.77453px', 'important');
                e.target.style.setProperty('outline', 'none', 'important');
              }}
              onBlur={(e) => {
                e.target.style.setProperty('border-color', '#d1d5db', 'important');
                e.target.style.setProperty('box-shadow', 'none', 'important');
              }}
            />
            {validationMessage && (
              <p
                className={`mt-2 text-sm ${
                  isValidNumber ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {validationMessage}
              </p>
            )}
            {error && !otpSent && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
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



          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading || otpSent}
            className="w-full text-white font-semibold py-2.5 transition-colors text-base disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background:
                loading || otpSent ? '#d1d5db' : 'linear-gradient(135deg, #E53935 0%, #FF4D4D 100%)',
              borderRadius: '12px',
              boxShadow: loading || otpSent ? 'none' : 'rgba(229, 57, 53, 0.2) 0px 4px 12px',
            }}
            onMouseEnter={(e) => {
              if (!loading && !otpSent) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C62828 0%, #E53935 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !otpSent) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #E53935 0%, #FF4D4D 100%)';
              }
            }}
          >
            {loading && !otpSent && <ButtonLoader variant="light" size="md" />}
            {loading && !otpSent ? 'Sending...' : 'Send OTP'}
          </button>

          {otpSent && (
            <>
              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)',
                marginBottom: '24px'
              }} />
              
              <div>
                <p className="text-center mb-3" style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                  OTP sent to registered whatsapp number
                </p>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  autoComplete="off"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter OTP"
                  className={inputBaseClasses}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.setProperty('border-color', 'rgb(120, 164, 235)', 'important');
                    e.target.style.setProperty('box-shadow', 'rgba(59, 130, 246, 0.06) 0px 0px 0px 1.77453px', 'important');
                    e.target.style.setProperty('outline', 'none', 'important');
                  }}
                  onBlur={(e) => {
                    e.target.style.setProperty('border-color', '#d1d5db', 'important');
                    e.target.style.setProperty('box-shadow', 'none', 'important');
                  }}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 text-white font-semibold py-2.5 rounded-xl transition-colors text-base disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: loading ? '#d1d5db' : '#10b981'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }
                  }}
                >
                  {loading && <ButtonLoader variant="light" size="md" />}
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex-1 text-white font-semibold py-2.5 rounded-xl transition-colors text-base disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#6b7280' }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#6b7280';
                    }
                  }}
                >
                Cancel
              </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Different Role?{' '}
            <Link
              href="/login/role"
              className="text-blue-600 hover:underline font-medium"
            >
              Go to Role Login
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Need an account?{' '}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up for different roles
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
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

        {/* Gift Box - Mobile: touching the bottom of the card */}
        <div className="md:hidden flex justify-center -mt-6 relative z-10">
          <Image
            src="/images/gift-box.png"
            alt="Christmas Gift"
            width={100}
            height={100}
            className="pointer-events-none"
            style={{
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.12))',
            }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
