'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CanvasserHeader from '@/app/canvasser/CanvasserHeader';
import CanvasserFooter from '@/app/canvasser/CanvasserFooter';

export default function LandingPage({ userName = '' }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Banner data - can be fetched from API
  const banners = [
    {
      id: 1,
      title: 'GOOD NEWS TEAM! 🎉',
      subtitle: 'CANVASSER INCENTIVE LIVE',
      description: 'GET YOUR INCENTIVE INSTANT',
      highlights: [
        'Scheme Brief',
        'Scheme Brief',
      ],
      validity: 'Valid for 10 Jan to 17 Jan',
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
      id: 'canvasser-incentive',
      title: 'Canvasser Incentive Form',
      description: 'Submit sales Serial wise',
      icon: '⭐',
      bgGradient: 'from-[#5B6FD8] to-[#8B7FE8]',
      iconBg: 'bg-[#7B8FE8]/30',
      link: '/canvasser/incentive-form',
    },
    {
      id: 'incentive-passbook',
      title: 'Incentive Passbook',
      description: 'Track Your Earning',
      icon: '💼',
      bgGradient: 'from-[#4CAF93] to-[#5FD4B3]',
      iconBg: 'bg-[#5CC4A3]/30',
      link: '/canvasser/passbook',
    },
    {
      id: 'training',
      title: 'Godrej Care+ Pricesheet',
      description: 'Learn More',
      icon: '⭐',
      bgGradient: 'from-[#A86638] to-[#D89038]',
      iconBg: 'bg-[#C88638]/30',
      link: '/canvasser/training',
    },
    {
      id: 'claim-raise',
      title: 'Godrej Claim Raise Procedure',
      description: 'Learn More',
      icon: '🛒',
      bgGradient: 'from-[#C96E6E] via-[#D8926E] to-[#E8B86E]',
      iconBg: 'bg-[#D88E6E]/30',
      link: '/canvasser/claim-procedure',
    },
  ];

  const handleSlideChange = (index) => {
    setActiveSlide(index);
  };

  return (
    <div className="min-h-screen md:h-auto h-screen bg-gray-50 flex flex-col md:overflow-visible overflow-hidden">
      <CanvasserHeader userName={userName} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">

        {/* Greeting Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-4 sm:mt-6 mb-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">Hello {userName},</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2 font-medium">Welcome back! Choose your action below</p>
        </div>

        {/* Banner Carousel */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mb-8 sm:mb-10">
          <div className="relative overflow-hidden rounded-2xl shadow-xl border border-gray-100 bg-white">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="w-full flex-shrink-0"
                >
                  <div className="w-full aspect-[2/1] lg:aspect-[528/145] relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                    {banner.id === 1 ? (
                      <img
                        src="/images/banners/godrej_incentive_banner.png"
                        alt="Godrej Canvasser Incentive"
                        className="w-full h-full object-cover scale-110 lg:scale-100"
                      />
                    ) : banner.id === 2 ? (
                      <img
                        src="/images/banners/godrej_rewards_banner.png"
                        alt="Godrej New Rewards"
                        className="w-full h-full object-cover scale-110 lg:scale-100"
                      />
                    ) : banner.id === 3 ? (
                      <img
                        src="/images/banners/godrej_bonus_banner.png"
                        alt="Godrej Special Bonus"
                        className="w-full h-full object-cover scale-110 lg:scale-100"
                      />
                    ) : (
                      <div
                        className={`bg-gradient-to-br ${banner.gradient} px-4 sm:px-8 py-8 md:py-12 min-h-[180px] sm:min-h-[220px] md:min-h-[280px] flex flex-col justify-center items-center text-center`}
                      >
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 mb-0.5 sm:mb-1">
                          {banner.title}
                        </p>
                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-0.5 sm:mb-1 md:mb-2">
                          {banner.subtitle}
                        </h2>
                        <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4">
                          {banner.description}
                        </p>
                        <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px]">
                          {banner.highlights.map((highlight, idx) => (
                            <div
                              key={idx}
                              className="bg-white/95 rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900"
                            >
                              {highlight}
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-800 mt-2 sm:mt-3 md:mt-4">
                          {banner.validity}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 md:mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`h-1.5 sm:h-2 md:h-2.5 rounded-full transition-all duration-300 ${activeSlide === index
                  ? 'w-6 sm:w-8 md:w-10 bg-gray-900'
                  : 'w-1.5 sm:w-2 md:w-2.5 bg-gray-300'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Feature Tiles */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4">
          {features.map((feature) => (
            <Link
              key={feature.id}
              href={feature.link}
              className="block group"
            >
              <div
                className={`bg-gradient-to-br ${feature.bgGradient} rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-5 min-h-[140px] sm:min-h-[155px] md:min-h-[180px] lg:min-h-[200px] flex flex-col justify-between relative overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl`}
              >
                {/* Icon */}
                <div className={`${feature.iconBg} w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl transition-transform group-hover:scale-110`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <div className="flex-1 mt-2 sm:mt-3 md:mt-4">
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl mb-0.5 sm:mb-1 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-white/95 text-[10px] sm:text-xs md:text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <CanvasserFooter />
    </div>
  );
}
