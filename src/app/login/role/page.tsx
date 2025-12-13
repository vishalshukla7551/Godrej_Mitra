'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getHomePathForRole } from '@/lib/roleHomePath';

export default function RoleLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Reuse SEC login phone field typography & input styles
  const inputBaseClasses =
    'w-full px-3 py-2.5 rounded-lg text-base text-black placeholder:text-gray-500 transition-all duration-200 border-0 outline-none focus:outline-none';
  const labelBaseClasses = 'block text-sm font-medium text-gray-900 mb-1.5';

  // Apply important styles on mount
  useEffect(() => {
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    
    if (usernameInput) {
      usernameInput.style.setProperty('background-color', '#e8f0fe', 'important');
      usernameInput.style.setProperty('border', '1px solid #d1d5db', 'important');
      usernameInput.style.setProperty('outline', 'none', 'important');
    }
    
    if (passwordInput) {
      passwordInput.style.setProperty('background-color', '#e8f0fe', 'important');
      passwordInput.style.setProperty('border', '1px solid #d1d5db', 'important');
      passwordInput.style.setProperty('outline', 'none', 'important');
    }
  });

  // If already logged in (authUser in localStorage), redirect to role home.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data?.error || 'Invalid username or password');
        return;
      }

      // Store auth info in localStorage.
      // This only contains `role` and the role-specific `profile` object,
      // so the raw User model (id, username, metadata, etc.) is never exposed on the client.
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('authUser', JSON.stringify(data.user));
      }

      // Redirect by role using shared helper
      // Use window.location.href to ensure localStorage is fully written before redirect
      const target = getHomePathForRole(data.user.role);
      window.location.href = target;
    } catch (err) {
      console.error('Error logging in', err);
      setLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ backgroundColor: '#F5F6F8' }}
    >
      {/* Gift Box - Fixed to page */}
      <Image
        src="/images/gift-box.png"
        alt="Christmas Gift"
        width={200}
        height={200}
        className="absolute pointer-events-none z-10"
        style={{
          top: '50%',
          left: 'calc(50% + 160px)',
          transform: 'translateY(20%)',
          filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.12))',
        }}
        priority
      />

      {/* Card Wrapper - Anchors Santa hat to the card */}
      <div className="relative" style={{ maxWidth: '450px', width: '100%' }}>
        {/* Santa Hat - Anchored to Card Top Left */}
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

        {/* Login Card */}
        <div
          className="w-full bg-white rounded-2xl p-10 relative"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 12px' }}
        >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-500">Use your credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="username"
              className={labelBaseClasses}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
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
          </div>

          <div>
            <label
              htmlFor="password"
              className={labelBaseClasses}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`${inputBaseClasses} pr-12`}
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 transition-colors text-base disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #E53935 0%, #FF4D4D 100%)',
              borderRadius: '12px',
              boxShadow: loading ? 'none' : 'rgba(229, 57, 53, 0.2) 0px 4px 12px',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C62828 0%, #E53935 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #E53935 0%, #FF4D4D 100%)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Are You Sec?{' '}
            <Link
              href="/login/sec"
              className="text-blue-600 hover:underline font-medium"
            >
              Login with phone
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
      </div>
    </div>
  );
}
