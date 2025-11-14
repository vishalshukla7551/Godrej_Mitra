'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SECHeader from '@/components/sec/SECHeader';
import SECFooter from '@/components/sec/SECFooter';

export default function LandingPage({ userName = '' }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Banner data - can be fetched from API
  const banners = [
    {
      id: 1,
      title: 'GOOD NEWS TEAM! 🎉',
      subtitle: 'SPOT INCENTIVE LIVE',
      description: 'GET YOUR INCENTIVE INSTANT',
      highlights: [
        '💰 ₹100 VOUCHER on every ADDL sold',
        '🎁 ₹300 VOUCHER on every Combo sold',
      ],
      validity: 'Valid for 18 Oct to 26 Oct',
      gradient: 'from-red-400 via-orange-300 to-yellow-300',
    },
    {
      id: 2,
      title: 'INCENTIVE ALERT! 🔔',
      subtitle: 'NEW REWARDS',
      description: 'EARN MORE THIS MONTH',
      highlights: [
        '🎯 Bonus on target achievement',
        '⭐ Special rewards unlocked',
      ],
      validity: 'Limited time offer',
      gradient: 'from-purple-400 via-pink-300 to-orange-300',
    },
    {
      id: 3,
      title: 'SPECIAL BONUS! 💎',
      subtitle: 'EXCLUSIVE OFFER',
      description: 'MAXIMIZE YOUR EARNINGS',
      highlights: [
        '🚀 Double points this week',
        '💪 Beat your best record',
      ],
      validity: 'Ends this weekend',
      gradient: 'from-blue-400 via-teal-300 to-green-300',
    },
  ];

  // Auto-scroll banner every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Feature tiles data
  const features = [
    {
      id: 'sec-incentive',
      title: 'SEC Incentive Form',
      description: 'Submit your sales IMEI wise',
      icon: '⭐',
      bgGradient: 'from-[#5B6FD8] to-[#8B7FE8]',
      iconBg: 'bg-[#7B8FE8]/30',
      link: '/SEC/incentive-form',
    },
    {
      id: 'incentive-passbook',
      title: 'Incentive Passbook',
      description: 'Track Your Earning',
      icon: '💼',
      bgGradient: 'from-[#4CAF93] to-[#5FD4B3]',
      iconBg: 'bg-[#5CC4A3]/30',
      link: '/SEC/passbook',
    },
    {
      id: 'claim-raise',
      title: 'SC+ Claim Raise Procedure',
      description: 'Learn More',
      icon: '🛒',
      bgGradient: 'from-[#C96E6E] via-[#D8926E] to-[#E8B86E]',
      iconBg: 'bg-[#D88E6E]/30',
      link: '/SEC/claim-procedure',
    },
    {
      id: 'training',
      title: 'ProtectMax Training',
      description: 'Learn More',
      icon: '⭐',
      bgGradient: 'from-[#A86638] to-[#D89038]',
      iconBg: 'bg-[#C88638]/30',
      link: '/SEC/training',
    },
  ];

  const handleSlideChange = (index) => {
    setActiveSlide(index);
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <SECHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Greeting Section */}
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Hello {userName || 'Guest'},
          </h1>
          <p className="text-gray-500 text-sm">
            Welcome! Choose your action below
          </p>
        </div>

        {/* Banner Carousel */}
        <div className="px-5 mb-4">
          <div className="relative overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="w-full flex-shrink-0"
                >
                  <div
                    className={`bg-gradient-to-br ${banner.gradient} px-5 py-6 rounded-xl h-[180px] flex flex-col justify-center items-center text-center`}
                  >
                    <p className="text-xs font-bold text-gray-800 mb-0.5">
                      {banner.title}
                    </p>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-0.5">
                      {banner.subtitle}
                    </h2>
                    <p className="text-xs font-semibold text-gray-800 mb-3">
                      {banner.description}
                    </p>
                    <div className="space-y-1.5 w-full max-w-sm">
                      {banner.highlights.map((highlight, idx) => (
                        <div
                          key={idx}
                          className="bg-white/95 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-900"
                        >
                          {highlight}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-medium text-gray-800 mt-2">
                      {banner.validity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === index
                    ? 'w-6 bg-gray-900'
                    : 'w-1.5 bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Feature Tiles */}
        <div className="px-5 grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <Link
              key={feature.id}
              href={feature.link}
              className="block"
            >
              <div
                className={`bg-gradient-to-br ${feature.bgGradient} rounded-2xl p-4 h-[165px] flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Icon */}
                <div className={`${feature.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <div className="flex-1 mt-2">
                  <h3 className="text-white font-bold text-base mb-0.5 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-white/95 text-xs">
                    {feature.description}
                  </p>
                </div>

                {/* Arrow Button */}
                <div className="absolute top-3 right-3">
                  <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SECFooter />
    </div>
  );
}
